import { spawnSync } from 'node:child_process';

// Small Windows controls for the live edge-case tests (mouse position,
// focused window, moving and minimizing windows), through Windows
// PowerShell like the Zoom helper itself.

const NATIVE = `
Add-Type -ReferencedAssemblies System.Windows.Forms -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class M3Win {
  [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hwnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hwnd, int command);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hwnd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hwnd, IntPtr after, int x, int y, int w, int h, uint flags);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT point);
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hwnd);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, IntPtr processId);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint attach, uint attachTo, bool doAttach);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  // Like the Zoom helper: no Alt tap, which in Zoom toggles a setting.
  public static void BringToFront(IntPtr handle) {
    var foreground = GetForegroundWindow();
    if (foreground == handle) return;
    var other = GetWindowThreadProcessId(foreground, IntPtr.Zero);
    var me = GetCurrentThreadId();
    var attached = other != 0 && other != me && AttachThreadInput(me, other, true);
    try { BringWindowToTop(handle); SetForegroundWindow(handle); }
    finally { if (attached) AttachThreadInput(me, other, false); }
  }
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X; public int Y; }
}
'@
[void][M3Win]::SetProcessDpiAwarenessContext([IntPtr]-4)
`;

const run = (script: string): string => {
  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', `${NATIVE}\n${script}`],
    { encoding: 'utf8', windowsHide: true },
  );
  if (result.status !== 0)
    throw new Error(result.stderr || 'PowerShell failed');
  return result.stdout.trim();
};

export interface ScreenBounds {
  height: number;
  name: string;
  width: number;
  x: number;
  y: number;
}

export const getCursor = () => {
  const [x, y] = run(
    '$p = New-Object M3Win+POINT; [void][M3Win]::GetCursorPos([ref]$p); "$($p.X),$($p.Y)"',
  )
    .split(',')
    .map(Number);
  return { x: x ?? 0, y: y ?? 0 };
};

export const setCursor = (x: number, y: number) => {
  run(`[void][M3Win]::SetCursorPos(${x}, ${y})`);
};

export const getForegroundWindow = () =>
  Number(run('[M3Win]::GetForegroundWindow().ToInt64()'));

export const focusWindow = (handle: number) => {
  run(`[M3Win]::BringToFront([IntPtr]${handle})`);
};

/**
 * Taps Alt alone in a Zoom meeting window, which toggles Zoom's "Always
 * show meeting controls" setting. Only for tests that need Zoom's toolbar
 * to auto-hide, which then put the setting back the same way.
 */
export const toggleZoomAlwaysShowControls = (meetingHandle: number) => {
  run(
    `[M3Win]::BringToFront([IntPtr]${meetingHandle}); Start-Sleep -Milliseconds 300; [M3Win]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [M3Win]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)`,
  );
};

export const minimizeWindow = (handle: number) => {
  run(`[void][M3Win]::ShowWindow([IntPtr]${handle}, 6)`);
};

export const isMinimized = (handle: number) =>
  run(`[M3Win]::IsIconic([IntPtr]${handle})`) === 'True';

export const restoreWindow = (handle: number) => {
  run(`[void][M3Win]::ShowWindow([IntPtr]${handle}, 9)`);
};

/** Moves (and sizes) a window, in physical pixels. */
export const moveWindow = (
  handle: number,
  bounds: { height: number; width: number; x: number; y: number },
) => {
  run(
    `[void][M3Win]::ShowWindow([IntPtr]${handle}, 9); [void][M3Win]::SetWindowPos([IntPtr]${handle}, [IntPtr]::Zero, ${bounds.x}, ${bounds.y}, ${bounds.width}, ${bounds.height}, 0x0004)`,
  );
};

/** The monitors' working areas, in physical pixels. */
export const getScreens = (): ScreenBounds[] =>
  JSON.parse(
    run(
      // -InputObject keeps a single monitor a JSON array in PowerShell 5.1.
      'ConvertTo-Json -Compress -InputObject @([System.Windows.Forms.Screen]::AllScreens | ForEach-Object { @{ name = $_.DeviceName; x = $_.WorkingArea.X; y = $_.WorkingArea.Y; width = $_.WorkingArea.Width; height = $_.WorkingArea.Height } })',
    ),
  ) as ScreenBounds[];

/** A window's position and size, in physical pixels. */
export const getWindowRect = (handle: number) => {
  const [x, y, right, bottom] = run(
    `Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class M3Rect { [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L; public int T; public int R; public int B; } [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r); }'; $r = New-Object M3Rect+RECT; [void][M3Rect]::GetWindowRect([IntPtr]${handle}, [ref]$r); "$($r.L),$($r.T),$($r.R),$($r.B)"`,
  )
    .split(',')
    .map(Number);
  return {
    height: (bottom ?? 0) - (y ?? 0),
    width: (right ?? 0) - (x ?? 0),
    x: x ?? 0,
    y: y ?? 0,
  };
};

/** The first top-level window whose title starts with `prefix`. */
export const findWindowByTitle = (prefix: string) =>
  Number(
    run(
      `$w = Get-Process | Where-Object { $_.MainWindowTitle.StartsWith('${prefix.replaceAll("'", "''")}') } | Select-Object -First 1; if ($w) { $w.MainWindowHandle.ToInt64() } else { 0 }`,
    ),
  );

const ENUM_WINDOWS = `Add-Type -TypeDefinition '
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class M3Enum {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L; public int T; public int R; public int B; }
  public delegate bool Proc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(Proc p, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder b, int m);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  public static string[] Find(string cls) {
    var found = new List<string>();
    EnumWindows((h, l) => {
      var name = new StringBuilder(256);
      GetClassName(h, name, 256);
      RECT r;
      if (IsWindowVisible(h) && name.ToString() == cls && GetWindowRect(h, out r)) found.Add(r.L + "," + r.T + "," + r.R + "," + r.B);
      return true;
    }, IntPtr.Zero);
    return found.ToArray();
  }
}'`;

/** The positions of the visible top-level windows of a class, in physical pixels. */
export const getVisibleWindowRects = (className: string) =>
  run(`${ENUM_WINDOWS}; [M3Enum]::Find('${className.replaceAll("'", "''")}')`)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [x, y, right, bottom] = line.split(',').map(Number);
      return {
        height: (bottom ?? 0) - (y ?? 0),
        width: (right ?? 0) - (x ?? 0),
        x: x ?? 0,
        y: y ?? 0,
      };
    });
