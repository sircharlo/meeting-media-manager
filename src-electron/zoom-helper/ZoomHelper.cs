// UI Automation helper behind M³'s Zoom Meeting Manager (Windows only).
//
// zoom-helper.ps1 compiles this file with Windows PowerShell's built-in C#
// compiler (C# 5: no string interpolation, `?.`, `nameof` or expression
// bodies), so M³ needs nothing installed beyond Windows itself.
//
// Protocol: one JSON request per line on stdin, one JSON reply per line on
// stdout, logs on stderr. No network port is opened. Requests are handled
// one at a time, which also keeps two actions from stealing each other's
// focus or closing each other's menus.
//
// Zoom Workplace 7 exposes no control IDs, and every visible name is in the
// user's Zoom language. So controls are found only by things that are the
// same in every language:
// - the keyboard shortcuts Zoom appends to button names ("..., Alt+A" for
//   the microphone, "Alt+V" video, "Alt+M" mute everyone);
// - window classes (the join-audio dialog, the mute-everyone dialog, menus);
// - control types and their order in a dialog or menu;
// - titles M³ controls (its media window) or that the user captured in M³'s
//   settings (the microphone and video buttons in each state, the Share
//   entry).
//
// Controls are pressed through UI Automation patterns (Invoke, Toggle),
// which don't move the user's mouse, falling back to a real click for the
// few Zoom controls that don't support them. It uses the native COM UI
// Automation API (through an interop assembly zoom-helper.ps1 generates from
// Windows' own UIAutomationCore.dll): the managed System.Windows.Automation
// API is over ten times slower on Zoom's windows.

using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web.Script.Serialization;
using Interop.UIAutomationClient;

namespace M3.ZoomHelper
{
    public class ZoomActionError : Exception
    {
        public ZoomActionError(string message) : base(message) { }
    }

    /// <summary>An element with the properties this helper reads, fetched in
    /// one round trip through a UI Automation cache request.</summary>
    public sealed class El
    {
        public readonly IUIAutomationElement Raw;
        public readonly string Name;
        public readonly int ControlType;
        public readonly string ClassName;
        public readonly tagRECT Rect;

        public El(IUIAutomationElement raw)
        {
            Raw = raw;
            Name = raw.CachedName ?? "";
            ControlType = raw.CachedControlType;
            ClassName = raw.CachedClassName ?? "";
            Rect = raw.CachedBoundingRectangle;
        }

        public int CenterX { get { return (Rect.left + Rect.right) / 2; } }
        public int CenterY { get { return (Rect.top + Rect.bottom) / 2; } }
        public int Area { get { return Math.Max(0, Rect.right - Rect.left) * Math.Max(0, Rect.bottom - Rect.top); } }
    }

    internal static class Native
    {
        public delegate bool EnumWindowsProc(IntPtr hwnd, IntPtr lParam);

        [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
        [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr hwnd, StringBuilder buffer, int max);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hwnd, StringBuilder buffer, int max);
        [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out Rect rect);
        [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hwnd);
        [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hwnd, IntPtr after, int x, int y, int width, int height, uint flags);
        [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(Point point);
        [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr hwnd, uint flags);
        [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr hwnd, int index);
        [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hwnd);
        [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hwnd, int command);
        [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hwnd);
        [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hwnd);
        [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, IntPtr processId);
        [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint attach, uint attachTo, bool doAttach);
        [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();

        /// <summary>Brings a window to the front. Windows only lets the
        /// foreground app hand focus over, so this briefly shares the
        /// foreground window's input state. (The usual trick of tapping Alt
        /// must not be used: in Zoom a lone Alt toggles its "Always show
        /// meeting controls" setting.)</summary>
        public static void BringToFront(IntPtr handle)
        {
            var foreground = GetForegroundWindow();
            if (foreground == handle) return;
            var foregroundThread = GetWindowThreadProcessId(foreground, IntPtr.Zero);
            var thisThread = GetCurrentThreadId();
            var attached = foregroundThread != 0 && foregroundThread != thisThread &&
                AttachThreadInput(thisThread, foregroundThread, true);
            try
            {
                BringWindowToTop(handle);
                SetForegroundWindow(handle);
            }
            finally
            {
                if (attached) AttachThreadInput(thisThread, foregroundThread, false);
            }
        }
        [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
        [DllImport("user32.dll")] public static extern bool GetCursorPos(out Point point);

        [StructLayout(LayoutKind.Sequential)]
        public struct Point
        {
            public int X;
            public int Y;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct Rect
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }
        [DllImport("user32.dll")] public static extern void mouse_event(uint flags, int dx, int dy, uint data, UIntPtr extra);
        [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);

        public static readonly IntPtr DpiAwarenessPerMonitorV2 = new IntPtr(-4);
        public const int SwRestore = 9;
        public const uint MouseLeftDown = 0x0002;
        public const uint MouseLeftUp = 0x0004;
        public const uint MouseWheel = 0x0800;
        public const int WheelDelta = 120;
        public static readonly IntPtr HwndTopmost = new IntPtr(-1);
        public static readonly IntPtr HwndNoTopmost = new IntPtr(-2);
        public const uint GaRoot = 2;
        public const int GwlExStyle = -20;
        public const int WsExTopmost = 0x0008;
        public const uint SwpNoSize = 0x0001;
        public const uint SwpNoMove = 0x0002;
        public const uint SwpNoActivate = 0x0010;
        public const uint KeyUp = 0x0002;
        public const byte VkMenu = 0x12; // Alt
        public const byte VkEscape = 0x1B;
    }

    public static class Uia
    {
        // UI Automation property, control type and pattern IDs.
        public const int NameProperty = 30005;
        public const int ControlTypeProperty = 30003;
        public const int ClassNameProperty = 30012;
        public const int BoundingRectangleProperty = 30001;
        public const int ButtonType = 50000;
        public const int CheckBoxType = 50002;
        public const int ListItemType = 50007;
        public const int ListType = 50008;
        public const int MenuItemType = 50011;
        public const int TabItemType = 50019;
        public const int TextType = 50020;
        public const int SplitButtonType = 50031;
        public const int InvokePattern = 10000;
        public const int SelectionItemPattern = 10010;
        public const int TogglePattern = 10015;

        public static readonly CUIAutomation8 Automation = new CUIAutomation8();
        private static readonly IUIAutomationCacheRequest Cache = CreateCache();

        private static IUIAutomationCacheRequest CreateCache()
        {
            var cache = Automation.CreateCacheRequest();
            cache.AddProperty(NameProperty);
            cache.AddProperty(ControlTypeProperty);
            cache.AddProperty(ClassNameProperty);
            cache.AddProperty(BoundingRectangleProperty);
            return cache;
        }

        public static El FromHandle(IntPtr handle)
        {
            return new El(Automation.ElementFromHandleBuildCache(handle, Cache));
        }

        public static List<El> Descendants(El root, int controlType)
        {
            var condition = controlType == 0
                ? Automation.CreateTrueCondition()
                : Automation.CreatePropertyCondition(ControlTypeProperty, controlType);
            var result = new List<El>();
            IUIAutomationElementArray found;
            try
            {
                found = root.Raw.FindAllBuildCache(TreeScope.TreeScope_Descendants, condition, Cache);
            }
            catch (Exception)
            {
                return result; // the element went away
            }
            if (found == null) return result;
            for (int i = 0; i < found.Length; i++) result.Add(new El(found.GetElement(i)));
            return result;
        }

        public static List<El> Descendants(El root)
        {
            return Descendants(root, 0);
        }

        public static El FirstByClass(El root, string className)
        {
            try
            {
                var condition = Automation.CreatePropertyCondition(ClassNameProperty, className);
                var found = root.Raw.FindFirstBuildCache(TreeScope.TreeScope_Descendants, condition, Cache);
                return found == null ? null : new El(found);
            }
            catch (Exception)
            {
                return null;
            }
        }
    }

    public static class Helper
    {
        const string MeetingWindowClass = "ConfMultiTabContentWndClass";
        const string ControlPanelClass = "ZPControlPanelClass";
        const string JoinAudioDialogClass = "zJoinAudioWndClass";
        const string MuteAllDialogClass = "zChangeNameWndClass";
        const string MenuClass = "WCN_ModelessWnd";
        const string MoreGridClass = "ZGridMultiLevelPopupWndClass";
        const string SharePickerClass = "ZPShareEntranceClass";
        const string ShareToolbarClass = "ZPFloatToolbarClass";
        // Zoom's annotation layer, laid over whatever is being shared.
        const string AnnotationLayerClass = "ZoomAnnoWindowWndClass";

        const string HotkeyAudio = "Alt+A";
        const string HotkeyVideo = "Alt+V";
        const string HotkeyMuteAll = "Alt+M";
        // Toolbar buttons that are clearly not Share, and in two cases must
        // never be pressed to find out: End (Alt+Q) and Record (Alt+R).
        static readonly string[] NotShareHotkeys = { "Alt+Q", "Alt+R", "Alt+H", "Alt+U", "Alt+I" };

        // A trailing "(Ctrl+Alt+Shift+A)" style shortcut in a control name.
        // Key names are matched by shape only, since Zoom may translate them
        // (e.g. "Strg" for Ctrl in German).
        static readonly Regex TrailingHotkey = new Regex(@"\((?:[^()\s+]+\+)+[^()\s+]+\)\s*$");
        // Zoom names its menu separators "4 of 17" in every language.
        static readonly Regex MenuSeparator = new Regex(@"^\d+ of \d+$");
        // "More" menu entries end with a translated "row R, column C N of M ..."
        static readonly Regex GridPositionSuffix = new Regex(@"^(.*?)\s+\S+\s+\d+,\s*\S+\s+\d+\s+\d+\s+\S+\s+\d+(?:\s.*)?$");
        static readonly Regex SectionHeader = new Regex(@"\(\d+\)");
        // Any keyboard shortcut ("Alt+A", "Ctrl+Alt+Shift+A", "Strg+Umschalt+S").
        static readonly Regex AnyHotkey = new Regex(@"(?<![\w+])[\p{L}]+(?:\+[\p{L}\p{N}]+)+(?![\w+])");

        // Buttons whose tops are this close (in pixels) count as one row.
        const int RowTolerance = 8;
        const int WaitTimeoutMs = 8000;
        const int PollIntervalMs = 200;

        // --- Waiting and windows ---------------------------------------------

        static T WaitFor<T>(Func<T> read, Func<T, bool> done, int timeoutMs) where T : class
        {
            var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
            while (true)
            {
                var value = read();
                if (done(value) || DateTime.UtcNow >= deadline) return value;
                Thread.Sleep(PollIntervalMs);
            }
        }

        static bool WaitUntil(Func<bool> condition, int timeoutMs)
        {
            var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
            while (true)
            {
                if (condition()) return true;
                if (DateTime.UtcNow >= deadline) return false;
                Thread.Sleep(PollIntervalMs);
            }
        }

        /// <summary>Top-level windows of a class, found through Win32 because UI
        /// Automation's desktop listing misses Zoom's popup menus.</summary>
        static List<IntPtr> TopWindows(string className, bool visibleOnly)
        {
            var found = new List<IntPtr>();
            Native.EnumWindows(delegate (IntPtr hwnd, IntPtr lParam)
            {
                if (visibleOnly && !Native.IsWindowVisible(hwnd)) return true;
                var buffer = new StringBuilder(256);
                Native.GetClassName(hwnd, buffer, buffer.Capacity);
                if (buffer.ToString() == className) found.Add(hwnd);
                return true;
            }, IntPtr.Zero);
            return found;
        }

        static List<IntPtr> TopWindowsTitled(string title)
        {
            var found = new List<IntPtr>();
            Native.EnumWindows(delegate (IntPtr hwnd, IntPtr lParam)
            {
                if (!Native.IsWindowVisible(hwnd)) return true;
                var buffer = new StringBuilder(512);
                Native.GetWindowText(hwnd, buffer, buffer.Capacity);
                if (buffer.ToString() == title) found.Add(hwnd);
                return true;
            }, IntPtr.Zero);
            return found;
        }

        /// <summary>How much two windows cover the same area (intersection over
        /// union, 0 to 1).</summary>
        static double Overlap(IntPtr a, IntPtr b)
        {
            Native.Rect ra, rb;
            if (!Native.GetWindowRect(a, out ra) || !Native.GetWindowRect(b, out rb)) return 0;
            var width = Math.Min(ra.Right, rb.Right) - Math.Max(ra.Left, rb.Left);
            var height = Math.Min(ra.Bottom, rb.Bottom) - Math.Max(ra.Top, rb.Top);
            if (width <= 0 || height <= 0) return 0;
            double shared = (double)width * height;
            double areaA = (double)(ra.Right - ra.Left) * (ra.Bottom - ra.Top);
            double areaB = (double)(rb.Right - rb.Left) * (rb.Bottom - rb.Top);
            return shared / (areaA + areaB - shared);
        }

        static El WaitForWindow(string className, int timeoutMs)
        {
            var handles = WaitFor(
                () => TopWindows(className, true),
                list => list.Count > 0,
                timeoutMs);
            return handles.Count > 0 ? Uia.FromHandle(handles[0]) : null;
        }

        static bool HasHotkey(string name, string hotkey)
        {
            return Regex.IsMatch(name ?? "", @"(?<![\w+])" + Regex.Escape(hotkey) + @"(?![\w+])");
        }

        /// <summary>"Arrêter ma vidéo, Alt+V" -> "Arrêter ma vidéo".</summary>
        public static string FirstSegment(string name)
        {
            var first = (name ?? "").Split(',')[0];
            return TrailingHotkey.Replace(first, "").Trim();
        }

        static List<El> OfType(IEnumerable<El> elements, int controlType)
        {
            var result = new List<El>();
            foreach (var element in elements) if (element.ControlType == controlType) result.Add(element);
            return result;
        }

        static List<El> Named(IEnumerable<El> elements)
        {
            var result = new List<El>();
            foreach (var element in elements) if (element.Name.Length > 0) result.Add(element);
            return result;
        }

        // --- Input ------------------------------------------------------------

        static void Focus(El window)
        {
            var handle = window.Raw.CurrentNativeWindowHandle;
            if (handle != IntPtr.Zero)
            {
                if (Native.IsIconic(handle))
                {
                    Native.ShowWindow(handle, Native.SwRestore);
                    Thread.Sleep(400); // let the restore animation finish
                }
                Native.BringToFront(handle);
            }
            Thread.Sleep(200);
        }

        /// <summary>The top-level window an element belongs to.</summary>
        static IntPtr TopWindowOf(El element)
        {
            try
            {
                var walker = Uia.Automation.RawViewWalker;
                var current = element.Raw;
                for (int depth = 0; current != null && depth < 30; depth++)
                {
                    var handle = current.CurrentNativeWindowHandle;
                    if (handle != IntPtr.Zero) return Native.GetAncestor(handle, Native.GaRoot);
                    current = walker.GetParentElement(current);
                }
            }
            catch (Exception) { }
            return IntPtr.Zero;
        }

        /// <summary>Whether the window itself shows at the point, rather than
        /// another window in front of it.</summary>
        static bool ShowsAt(IntPtr window, int x, int y)
        {
            var hit = Native.WindowFromPoint(new Native.Point { X = x, Y = y });
            return hit != IntPtr.Zero && Native.GetAncestor(hit, Native.GaRoot) == window;
        }

        /// <summary>Runs a mouse action with the window lifted above
        /// always-on-top windows (such as M³'s own media window on a single
        /// screen), which would otherwise take the mouse input meant for it,
        /// then puts the window back as it was. Only ever around a single
        /// action, so the window can't stay on top should anything go
        /// wrong.</summary>
        static T Lifted<T>(IntPtr window, Func<T> action)
        {
            const uint flags = Native.SwpNoMove | Native.SwpNoSize | Native.SwpNoActivate;
            var wasTopmost = (Native.GetWindowLong(window, Native.GwlExStyle) & Native.WsExTopmost) != 0;
            if (!wasTopmost) Native.SetWindowPos(window, Native.HwndTopmost, 0, 0, 0, 0, flags);
            try
            {
                return action();
            }
            finally
            {
                if (!wasTopmost) Native.SetWindowPos(window, Native.HwndNoTopmost, 0, 0, 0, 0, flags);
            }
        }

        static void ClickAt(int x, int y)
        {
            Native.SetCursorPos(x, y);
            Thread.Sleep(50);
            Native.mouse_event(Native.MouseLeftDown, 0, 0, 0, UIntPtr.Zero);
            Native.mouse_event(Native.MouseLeftUp, 0, 0, 0, UIntPtr.Zero);
        }

        static void Click(El element)
        {
            var window = TopWindowOf(element);
            if (window == IntPtr.Zero || ShowsAt(window, element.CenterX, element.CenterY))
            {
                ClickAt(element.CenterX, element.CenterY);
                return;
            }
            Lifted(window, () =>
            {
                ClickAt(element.CenterX, element.CenterY);
                Thread.Sleep(100);
                return true;
            });
        }

        static void Hover(El element)
        {
            Native.SetCursorPos(element.CenterX, element.CenterY);
        }

        static void AltKey(char key)
        {
            byte vk = (byte)char.ToUpperInvariant(key);
            Native.keybd_event(Native.VkMenu, 0, 0, UIntPtr.Zero);
            Native.keybd_event(vk, 0, 0, UIntPtr.Zero);
            Native.keybd_event(vk, 0, Native.KeyUp, UIntPtr.Zero);
            Native.keybd_event(Native.VkMenu, 0, Native.KeyUp, UIntPtr.Zero);
        }

        static void Escape()
        {
            Native.keybd_event(Native.VkEscape, 0, 0, UIntPtr.Zero);
            Native.keybd_event(Native.VkEscape, 0, Native.KeyUp, UIntPtr.Zero);
        }

        /// <summary>Invokes a control without moving the mouse, or clicks it if
        /// Zoom doesn't support Invoke on it.</summary>
        static void Press(El element)
        {
            try
            {
                var pattern = element.Raw.GetCurrentPattern(Uia.InvokePattern) as IUIAutomationInvokePattern;
                if (pattern != null)
                {
                    pattern.Invoke();
                    return;
                }
            }
            catch (Exception)
            {
                // Zoom turns some Invoke calls down (COMException, or
                // InvalidOperationException through the interop): a real
                // click still works there.
            }
            Click(element);
        }

        static bool SetChecked(El checkbox, bool isChecked)
        {
            var pattern = checkbox.Raw.GetCurrentPattern(Uia.TogglePattern) as IUIAutomationTogglePattern;
            var want = isChecked ? ToggleState.ToggleState_On : ToggleState.ToggleState_Off;
            if (pattern != null && pattern.CurrentToggleState == want) return false;
            try
            {
                if (pattern == null) throw new InvalidOperationException();
                pattern.Toggle();
            }
            catch (Exception)
            {
                Click(checkbox);
            }
            return true;
        }

        // --- Dialogs and menus -------------------------------------------------

        static El LargestButton(El dialog)
        {
            El best = null;
            foreach (var button in Uia.Descendants(dialog, Uia.ButtonType))
                if (best == null || button.Area > best.Area) best = button;
            return best;
        }

        /// <summary>A dialog's action buttons (e.g. Yes, No), left to right: the
        /// lowest row of buttons. Close buttons, in the title bar or a corner,
        /// sit higher up, and their names can't be relied on.</summary>
        static List<El> ActionRowButtons(El dialog)
        {
            var buttons = Uia.Descendants(dialog, Uia.ButtonType);
            var row = new List<El>();
            if (buttons.Count == 0) return row;
            int lowest = int.MinValue;
            foreach (var button in buttons) lowest = Math.Max(lowest, button.Rect.top);
            foreach (var button in buttons) if (Math.Abs(button.Rect.top - lowest) <= RowTolerance) row.Add(button);
            row.Sort((a, b) => a.Rect.left.CompareTo(b.Rect.left));
            return row;
        }

        /// <summary>A menu's entries, in groups split at its separators.</summary>
        static List<List<El>> MenuGroups(El menu)
        {
            var groups = new List<List<El>> { new List<El>() };
            foreach (var item in Uia.Descendants(menu, Uia.MenuItemType))
            {
                if (MenuSeparator.IsMatch(item.Name)) groups.Add(new List<El>());
                else if (item.Name.Length > 0) groups[groups.Count - 1].Add(item);
            }
            groups.RemoveAll(group => group.Count == 0);
            return groups;
        }

        static List<El> MenuItems(El menu)
        {
            var items = new List<El>();
            foreach (var group in MenuGroups(menu)) items.AddRange(group);
            return items;
        }

        // --- Meeting window ------------------------------------------------------

        /// <summary>The meeting window. Zoom hides its toolbar a few seconds after
        /// the mouse stops moving over it, and a hidden toolbar vanishes from UI
        /// Automation too, so the window is recognized without it: it's the
        /// visible meeting-class window (Zoom keeps a hidden spare), preferring
        /// one whose toolbar is showing.</summary>
        static El FindMeetingWindow()
        {
            El largest = null;
            El minimized = null;
            foreach (var handle in TopWindows(MeetingWindowClass, true))
            {
                try
                {
                    var window = Uia.FromHandle(handle);
                    // A minimized window has no size on screen, but it's still
                    // the meeting (and Focus brings it back).
                    if (Native.IsIconic(handle))
                    {
                        if (minimized == null) minimized = window;
                        continue;
                    }
                    if (Uia.FirstByClass(window, ControlPanelClass) != null) return window;
                    if (largest == null || window.Area > largest.Area) largest = window;
                }
                catch (Exception) { }
            }
            if (largest != null && largest.Area > 0) return largest;
            return minimized;
        }

        static El RequireMeetingWindow()
        {
            var window = FindMeetingWindow();
            if (window == null) throw new ZoomActionError("meeting-not-found");
            return window;
        }

        /// <summary>The meeting toolbar, brought back into view if Zoom hid it:
        /// Zoom shows it again when the mouse moves over the meeting.</summary>
        static El ControlPanel(El window)
        {
            var panel = Uia.FirstByClass(window, ControlPanelClass);
            if (panel != null) return panel;
            Focus(window);
            var handle = window.Raw.CurrentNativeWindowHandle;
            Func<El> reveal = () => WaitFor(() =>
            {
                // Read afresh: Focus may just have restored a minimized window,
                // whose earlier position was off-screen.
                Native.Point point;
                VisiblePoint(handle, window.Raw.CurrentBoundingRectangle, out point);
                Native.SetCursorPos(point.X, point.Y);
                Thread.Sleep(50);
                var nudge = ShowsAt(handle, point.X + 20, point.Y + 20) ? 20 : -20;
                Native.SetCursorPos(point.X + nudge, point.Y + nudge);
                return Uia.FirstByClass(window, ControlPanelClass);
            }, found => found != null, 3000);
            Native.Point visible;
            panel = VisiblePoint(handle, window.Raw.CurrentBoundingRectangle, out visible)
                ? reveal()
                : Lifted(handle, reveal);
            if (panel == null) throw new ZoomActionError("meeting-toolbar-not-found");
            return panel;
        }

        // Where to move the mouse to bring Zoom's toolbar back: the middle of
        // the meeting, else just above the toolbar, else elsewhere in it.
        static readonly double[][] RevealSpots =
        {
            new[] { 0.5, 0.5 }, new[] { 0.5, 0.85 }, new[] { 0.25, 0.85 }, new[] { 0.75, 0.85 },
            new[] { 0.25, 0.5 }, new[] { 0.75, 0.5 }, new[] { 0.5, 0.2 }, new[] { 0.2, 0.2 }, new[] { 0.8, 0.2 },
        };

        /// <summary>A spot where the window shows, rather than another window
        /// in front of it (an always-on-top one, such as M³'s own media window
        /// on a single screen). False, with its middle, if it's covered all
        /// over.</summary>
        static bool VisiblePoint(IntPtr window, tagRECT rect, out Native.Point point)
        {
            var width = rect.right - rect.left;
            var height = rect.bottom - rect.top;
            foreach (var spot in RevealSpots)
            {
                point = new Native.Point { X = rect.left + (int)(width * spot[0]), Y = rect.top + (int)(height * spot[1]) };
                if (ShowsAt(window, point.X, point.Y)) return true;
            }
            point = new Native.Point { X = rect.left + width / 2, Y = rect.top + height / 2 };
            return false;
        }

        static List<El> ToolbarButtons(El window)
        {
            return Uia.Descendants(ControlPanel(window), Uia.ButtonType);
        }

        static List<El> ToolbarMenus(El window)
        {
            return Uia.Descendants(ControlPanel(window), Uia.MenuItemType);
        }

        /// <summary>The microphone button. The toolbar always starts with it:
        /// joined to computer audio, its name includes its keyboard shortcut
        /// (Alt+A, or whatever the user chose instead); not joined, it's a
        /// "Join audio" button without one (null here).</summary>
        static El MicButton(El window)
        {
            var buttons = ToolbarButtons(window);
            return buttons.Count > 0 && AnyHotkey.IsMatch(buttons[0].Name) ? buttons[0] : null;
        }

        static bool AudioJoined(El window)
        {
            return MicButton(window) != null;
        }

        /// <summary>The camera button: the one with Zoom's Alt+V shortcut, or,
        /// if the user changed that shortcut, the toolbar's second button.</summary>
        static El VideoButton(El window)
        {
            var buttons = ToolbarButtons(window);
            foreach (var button in buttons)
                if (HasHotkey(button.Name, HotkeyVideo)) return button;
            return buttons.Count > 1 ? buttons[1] : null;
        }

        static bool IsSharing()
        {
            return TopWindows(ShareToolbarClass, true).Count > 0;
        }

        /// <summary>What's going on in Zoom. Without `reveal`, it never moves the
        /// mouse or focus (M³ polls it), so with Zoom's toolbar hidden the
        /// audio and video states are unknown (null).</summary>
        static Dictionary<string, object> MeetingState(bool reveal)
        {
            var sharing = IsSharing();
            var window = FindMeetingWindow();
            if (window == null)
            {
                // While sharing, Zoom hides the meeting window behind its share
                // toolbar: still in a meeting.
                return new Dictionary<string, object> { { "found", sharing }, { "sharing", sharing } };
            }
            var toolbarVisible = Uia.FirstByClass(window, ControlPanelClass) != null;
            if (!toolbarVisible && reveal)
            {
                try
                {
                    ControlPanel(window);
                    toolbarVisible = true;
                }
                catch (ZoomActionError) { }
            }
            El mic = toolbarVisible ? MicButton(window) : null;
            El video = toolbarVisible ? VideoButton(window) : null;
            return new Dictionary<string, object>
            {
                { "audioJoined", toolbarVisible ? (object)(mic != null) : null },
                { "found", true },
                { "handle", window.Raw.CurrentNativeWindowHandle.ToInt64() },
                { "micTitle", mic == null ? null : FirstSegment(mic.Name) },
                { "participantsPanelOpen", MuteAllButton(window) != null },
                { "sharing", sharing },
                { "title", window.Name },
                { "toolbarVisible", toolbarVisible },
                { "videoTitle", video == null ? null : FirstSegment(video.Name) },
            };
        }

        // --- Audio and video -------------------------------------------------------

        static Dictionary<string, object> Changed(bool changed)
        {
            return new Dictionary<string, object> { { "changed", changed } };
        }

        public static Dictionary<string, object> JoinAudio()
        {
            var window = RequireMeetingWindow();
            if (AudioJoined(window)) return Changed(false);
            var buttons = ToolbarButtons(window);
            if (buttons.Count == 0) throw new ZoomActionError("join-audio-button-not-found");
            Focus(window);
            Press(buttons[0]);
            var dialog = WaitForWindow(JoinAudioDialogClass, 5000);
            if (dialog != null)
            {
                var button = LargestButton(dialog);
                if (button == null) throw new ZoomActionError("join-audio-button-not-found");
                Press(button);
            }
            if (!WaitUntil(() => AudioJoined(window), WaitTimeoutMs)) throw new ZoomActionError("audio-not-joined");
            return Changed(true);
        }

        public static Dictionary<string, object> LeaveAudio()
        {
            var window = RequireMeetingWindow();
            if (!AudioJoined(window)) return Changed(false);
            // The arrow next to the microphone button is the toolbar's first menu.
            var menus = ToolbarMenus(window);
            if (menus.Count == 0) throw new ZoomActionError("audio-menu-not-found");
            Focus(window);
            Press(menus[0]);
            var menu = WaitForWindow(MenuClass, 4000);
            if (menu == null)
            {
                Click(menus[0]);
                menu = WaitForWindow(MenuClass, 4000);
            }
            if (menu == null) throw new ZoomActionError("audio-menu-not-found");
            var items = MenuItems(menu);
            // "Leave computer audio" is the entry just before "Audio settings".
            if (items.Count < 2) throw new ZoomActionError("leave-audio-item-not-found");
            Press(items[items.Count - 2]);
            if (!WaitUntil(() => !AudioJoined(window), WaitTimeoutMs)) throw new ZoomActionError("audio-not-left");
            return Changed(true);
        }

        /// <summary>Puts a two-state toolbar button (the microphone or the camera)
        /// in the state named `on ? onTitle : offTitle`, telling its states
        /// apart by the names captured in M³'s settings. `what` ("mic",
        /// "video") starts the error names.</summary>
        static Dictionary<string, object> SetButtonState(El window, Func<El> find, string what, bool on, string onTitle, string offTitle)
        {
            var button = find();
            if (button == null) throw new ZoomActionError(what + "-button-not-found");
            var current = FirstSegment(button.Name);
            onTitle = FirstSegment(onTitle);
            offTitle = FirstSegment(offTitle);
            if (onTitle.Length == 0 || offTitle.Length == 0) throw new ZoomActionError(what + "-titles-not-captured");
            if (current != onTitle && current != offTitle) throw new ZoomActionError(what + "-title-unrecognized:" + current);
            if ((current == onTitle) == on) return Changed(false);
            Focus(window);
            Press(button);
            var wanted = on ? onTitle : offTitle;
            var done = WaitUntil(() =>
            {
                var latest = find();
                return latest != null && FirstSegment(latest.Name) == wanted;
            }, WaitTimeoutMs);
            if (!done) throw new ZoomActionError(what + "-not-changed");
            return Changed(true);
        }

        public static Dictionary<string, object> SetVideo(bool on, string onTitle, string offTitle)
        {
            var window = RequireMeetingWindow();
            return SetButtonState(window, () => VideoButton(window), "video", on, onTitle, offTitle);
        }

        /// <summary>Unmutes or mutes the host's microphone, which only exists
        /// once joined to computer audio.</summary>
        public static Dictionary<string, object> SetMic(bool on, string onTitle, string offTitle)
        {
            var window = RequireMeetingWindow();
            if (!AudioJoined(window)) throw new ZoomActionError("audio-not-joined");
            return SetButtonState(window, () => MicButton(window), "mic", on, onTitle, offTitle);
        }

        static Dictionary<string, object> ButtonTitle(El button, string what)
        {
            if (button == null) throw new ZoomActionError(what + "-button-not-found");
            return new Dictionary<string, object> { { "title", FirstSegment(button.Name) } };
        }

        public static Dictionary<string, object> VideoTitle()
        {
            var window = RequireMeetingWindow();
            return ButtonTitle(VideoButton(window), "video");
        }

        public static Dictionary<string, object> MicTitle()
        {
            var window = RequireMeetingWindow();
            if (!AudioJoined(window)) throw new ZoomActionError("audio-not-joined");
            return ButtonTitle(MicButton(window), "mic");
        }

        // --- Participants ----------------------------------------------------------

        static El MuteAllButton(El window)
        {
            foreach (var button in Uia.Descendants(window, Uia.ButtonType))
                if (HasHotkey(button.Name, HotkeyMuteAll)) return button;
            return null;
        }

        static El OpenParticipantsPanel(El window)
        {
            var button = MuteAllButton(window);
            if (button != null) return button;
            Focus(window);
            AltKey('U');
            button = WaitFor(() => MuteAllButton(window), found => found != null, 5000);
            if (button == null) throw new ZoomActionError("participants-panel-not-opened");
            return button;
        }

        public static Dictionary<string, object> MuteAll(bool allowSelfUnmute)
        {
            var window = RequireMeetingWindow();
            var button = OpenParticipantsPanel(window);
            Focus(window);
            Press(button);
            var dialog = WaitForWindow(MuteAllDialogClass, 5000);
            if (dialog == null) throw new ZoomActionError("mute-all-dialog-not-found");
            var checkboxes = Uia.Descendants(dialog, Uia.CheckBoxType);
            if (checkboxes.Count == 0) throw new ZoomActionError("allow-unmute-checkbox-not-found");
            SetChecked(checkboxes[0], allowSelfUnmute);
            var buttons = ActionRowButtons(dialog);
            if (buttons.Count != 2) throw new ZoomActionError("mute-all-confirm-not-found");
            Press(buttons[0]); // Yes; No is to its right
            if (!WaitUntil(() => TopWindows(MuteAllDialogClass, true).Count == 0, 4000))
                throw new ZoomActionError("mute-all-not-confirmed");
            return Changed(true);
        }

        public static Dictionary<string, object> AskAllToUnmute()
        {
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            // The participants panel's "more" button is the first split button
            // after the mute-everyone button.
            El more = null;
            bool afterMuteAll = false;
            foreach (var control in Uia.Descendants(window))
            {
                if (control.ControlType == Uia.ButtonType && HasHotkey(control.Name, HotkeyMuteAll)) afterMuteAll = true;
                else if (afterMuteAll && control.ControlType == Uia.SplitButtonType)
                {
                    more = control;
                    break;
                }
            }
            if (more == null) throw new ZoomActionError("participants-more-button-not-found");
            Focus(window);
            Click(more); // Zoom doesn't support Invoke on this one
            var menu = WaitForWindow(MenuClass, 4000);
            if (menu == null) throw new ZoomActionError("participants-menu-not-found");
            // "Ask all to unmute" heads the menu, alone in its group. Where it
            // isn't offered, the first group holds on/off options that must
            // not be toggled by mistake.
            var groups = MenuGroups(menu);
            if (groups.Count == 0 || groups[0].Count != 1)
            {
                Focus(window);
                Escape();
                throw new ZoomActionError("ask-to-unmute-item-not-found");
            }
            Press(groups[0][0]);
            return Changed(true);
        }

        sealed class Row
        {
            public El Element;
            public string Name;
            public string Details;
            public string Section;
        }

        /// <summary>Rows of the participants list, split into the waiting room and
        /// the meeting. Section headers ("Waiting room (2)") only exist while
        /// someone is waiting; the waiting room is then the first section.</summary>
        static List<Row> ParticipantRows(El window)
        {
            var result = new List<Row>();
            var lists = Uia.Descendants(window, Uia.ListType);
            if (lists.Count == 0) return result;
            var rows = Uia.Descendants(lists[0], Uia.ListItemType);
            var headers = new List<int>();
            for (int i = 0; i < rows.Count; i++)
                if (SectionHeader.IsMatch(rows[i].Name.Split(',')[0])) headers.Add(i);
            for (int i = 0; i < rows.Count; i++)
            {
                if (headers.Contains(i)) continue;
                var section = headers.Count >= 2 && headers[0] < i && i < headers[1] ? "waiting" : "meeting";
                var texts = Named(Uia.Descendants(rows[i], Uia.TextType));
                result.Add(new Row
                {
                    Element = rows[i],
                    Name = texts.Count > 0 ? texts[0].Name : FirstSegment(rows[i].Name),
                    Details = rows[i].Name,
                    Section = section,
                });
            }
            return result;
        }

        public static Dictionary<string, object> Participants()
        {
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            var rows = new List<object>();
            foreach (var row in ParticipantRows(window))
            {
                rows.Add(new Dictionary<string, object>
                {
                    { "details", row.Details },
                    { "name", row.Name },
                    { "section", row.Section },
                });
            }
            return new Dictionary<string, object> { { "participants", rows } };
        }

        static Row WaitingRow(El window, string name)
        {
            foreach (var row in ParticipantRows(window))
                if (row.Section == "waiting" && row.Name == name) return row;
            return null;
        }

        /// <summary>Admits waiting participants by name (everyone waiting, if no
        /// names). Each waiting row reveals its "Admit" button only while
        /// hovered, and the list reshuffles after every admission, so rows are
        /// looked up afresh.</summary>
        public static Dictionary<string, object> Admit(List<string> names)
        {
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            var waiting = new List<string>();
            foreach (var row in ParticipantRows(window))
                if (row.Section == "waiting" && (names.Count == 0 || names.Contains(row.Name)) && !waiting.Contains(row.Name))
                    waiting.Add(row.Name);
            var admitted = new List<object>();
            var handle = window.Raw.CurrentNativeWindowHandle;
            foreach (var name in waiting)
            {
                var current = name;
                var row = WaitingRow(window, current);
                if (row == null) continue;
                Focus(window);
                Func<bool> pressAdmit = () =>
                {
                    Hover(row.Element);
                    Thread.Sleep(500);
                    var hovered = WaitingRow(window, current);
                    if (hovered == null) return false;
                    var buttons = Named(Uia.Descendants(hovered.Element, Uia.ButtonType));
                    if (buttons.Count == 0) return false;
                    Press(buttons[0]);
                    return true;
                };
                // The row only shows its button while the mouse is over it.
                var pressed = ShowsAt(handle, row.Element.CenterX, row.Element.CenterY)
                    ? pressAdmit()
                    : Lifted(handle, pressAdmit);
                if (pressed && WaitUntil(() => WaitingRow(window, current) == null, 5000)) admitted.Add(name);
            }
            return new Dictionary<string, object> { { "admitted", admitted }, { "changed", admitted.Count > 0 } };
        }

        // --- Raised hands -----------------------------------------------------------

        /// <summary>What Zoom says about each person in the meeting (not the
        /// waiting room), by name.</summary>
        static Dictionary<string, string> MeetingRowDetails(El window)
        {
            var result = new Dictionary<string, string>();
            foreach (var row in ParticipantRows(window))
                if (row.Section == "meeting" && !result.ContainsKey(row.Name)) result[row.Name] = row.Details;
            return result;
        }

        /// <summary>A row's name, split into Zoom's comma-separated pieces
        /// ("Name, Host, me, Audio muted, Hand raised").</summary>
        static List<string> Segments(string details)
        {
            var result = new List<string>();
            foreach (var piece in (details ?? "").Split(','))
            {
                var trimmed = piece.Trim();
                if (trimmed.Length > 0) result.Add(trimmed);
            }
            return result;
        }

        /// <summary>Learns how Zoom marks a raised hand in the user's language:
        /// raises the host's own hand (Alt+Y), reads what Zoom added to the
        /// host's row in the participants list, then lowers it again and makes
        /// sure the words went away with it.</summary>
        public static Dictionary<string, object> LearnHandRaised()
        {
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            var before = MeetingRowDetails(window);
            if (before.Count == 0) throw new ZoomActionError("participants-not-found");
            Focus(window);
            AltKey('Y');
            string phrase = null;
            string name = null;
            var raised = WaitUntil(() =>
            {
                foreach (var entry in MeetingRowDetails(window))
                {
                    string old;
                    if (!before.TryGetValue(entry.Key, out old) || old == entry.Value) continue;
                    var oldSegments = Segments(old);
                    var added = new List<string>();
                    foreach (var segment in Segments(entry.Value))
                        if (!oldSegments.Contains(segment)) added.Add(segment);
                    if (added.Count != 1) continue;
                    phrase = added[0];
                    name = entry.Key;
                    return true;
                }
                return false;
            }, 5000);
            if (!raised) throw new ZoomActionError("hand-not-raised");
            Focus(window);
            AltKey('Y');
            var lowered = WaitUntil(() =>
            {
                string now;
                return MeetingRowDetails(window).TryGetValue(name, out now) && !Segments(now).Contains(phrase);
            }, 5000);
            if (!lowered) throw new ZoomActionError("hand-not-lowered");
            return new Dictionary<string, object> { { "phrase", phrase } };
        }

        /// <summary>Who in the meeting has their hand raised, going by the words
        /// learned with LearnHandRaised. Reads the list only: with the
        /// participants panel open it moves neither mouse nor focus.</summary>
        public static Dictionary<string, object> RaisedHands(string phrase)
        {
            if (string.IsNullOrEmpty(phrase)) throw new ZoomActionError("hand-phrase-not-learned");
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            var names = new List<object>();
            foreach (var row in ParticipantRows(window))
                if (row.Section == "meeting" && Segments(row.Details).Contains(phrase) && !names.Contains(row.Name)) names.Add(row.Name);
            return new Dictionary<string, object> { { "raisedHands", names } };
        }

        static Row MeetingRow(El window, string name)
        {
            foreach (var row in ParticipantRows(window))
                if (row.Section == "meeting" && row.Name == name) return row;
            return null;
        }

        /// <summary>Presses the microphone button on a participant's row: "Mute"
        /// for someone unmuted, "Ask to unmute" (or "Unmute") for someone muted.
        /// Like the Admit button, it only shows while the row is hovered, and
        /// it comes first ("More" follows it).</summary>
        public static Dictionary<string, object> PressParticipantMic(string name)
        {
            if (string.IsNullOrEmpty(name)) throw new ZoomActionError("participant-name-missing");
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            var row = MeetingRow(window, name);
            if (row == null) throw new ZoomActionError("participant-not-found");
            var before = row.Details;
            var handle = window.Raw.CurrentNativeWindowHandle;
            Focus(window);
            Func<bool> pressMic = () =>
            {
                Hover(row.Element);
                Thread.Sleep(500);
                var hovered = MeetingRow(window, name);
                if (hovered == null) return false;
                var buttons = Named(Uia.Descendants(hovered.Element, Uia.ButtonType));
                if (buttons.Count == 0) return false;
                Press(buttons[0]);
                return true;
            };
            var pressed = ShowsAt(handle, row.Element.CenterX, row.Element.CenterY)
                ? pressMic()
                : Lifted(handle, pressMic);
            if (!pressed) throw new ZoomActionError("participant-mic-button-not-found");
            // Muting changes the row at once; asking someone to unmute only
            // sends them a request, so the row may well stay as it was.
            var changed = WaitUntil(() =>
            {
                var latest = MeetingRow(window, name);
                return latest != null && latest.Details != before;
            }, 3000);
            var after = MeetingRow(window, name);
            return new Dictionary<string, object>
            {
                { "after", after == null ? null : after.Details },
                { "before", before },
                { "changed", changed },
            };
        }

        // --- Screen sharing -----------------------------------------------------------

        static string GridEntryName(El item)
        {
            var match = GridPositionSuffix.Match(item.Name);
            return match.Success ? match.Groups[1].Value.Trim() : FirstSegment(item.Name);
        }

        static El OpenMoreGrid(El window)
        {
            var menus = ToolbarMenus(window);
            if (menus.Count == 0) return null;
            Focus(window);
            Click(menus[menus.Count - 1]); // "More" is the toolbar's last menu
            return WaitForWindow(MoreGridClass, 4000);
        }

        /// <summary>Toolbar buttons and "More" menu entries, for the user to pick
        /// which one is Share (its name depends on their Zoom language). They
        /// are kept apart because "More" entries don't show their shortcuts,
        /// so dangerous ones like Record can't be left out there.</summary>
        public static Dictionary<string, object> ShareEntries()
        {
            var window = RequireMeetingWindow();
            var entries = new List<object>();
            var moreEntries = new List<object>();
            var toolbar = ToolbarButtons(window);
            // The first two are always the microphone and the camera, and the
            // last is always End: offering it would invite ending the meeting.
            for (int i = 2; i < toolbar.Count - 1; i++)
            {
                var isOther = false;
                foreach (var hotkey in NotShareHotkeys)
                    if (HasHotkey(toolbar[i].Name, hotkey)) isOther = true;
                if (isOther) continue;
                var name = FirstSegment(toolbar[i].Name);
                if (name.Length > 0 && !entries.Contains(name)) entries.Add(name);
            }
            var grid = OpenMoreGrid(window);
            if (grid != null)
            {
                foreach (var item in Uia.Descendants(grid, Uia.TabItemType))
                {
                    var name = GridEntryName(item);
                    if (name.Length > 0 && !entries.Contains(name) && !moreEntries.Contains(name)) moreEntries.Add(name);
                }
                Focus(window);
                Escape();
            }
            return new Dictionary<string, object> { { "entries", entries }, { "moreEntries", moreEntries } };
        }

        static void OpenSharePicker(El window, string shareTitle)
        {
            if (TopWindows(SharePickerClass, true).Count > 0) return;
            var wanted = FirstSegment(shareTitle);
            if (wanted.Length == 0)
            {
                // Nothing captured: try Zoom's default share shortcut, Alt+S.
                Focus(window);
                AltKey('S');
                return;
            }
            foreach (var button in ToolbarButtons(window))
            {
                if (FirstSegment(button.Name) == wanted)
                {
                    Focus(window);
                    Press(button);
                    return;
                }
            }
            var grid = OpenMoreGrid(window);
            if (grid != null)
            {
                foreach (var item in Uia.Descendants(grid, Uia.TabItemType))
                {
                    if (GridEntryName(item) == wanted || item.Name.StartsWith(wanted, StringComparison.Ordinal))
                    {
                        Click(item);
                        return;
                    }
                }
                Focus(window);
                Escape();
            }
            throw new ZoomActionError("share-button-not-found");
        }

        // Zoom's share picker lists the screens, then the open windows (most
        // recently used first, so the media window's spot changes), then
        // browser tabs. It selects an entry only on a real click, and reports
        // every entry as on screen, even one scrolled under its footer or past
        // its edge, where a click would select or share something else. So the
        // entry is found by its exact title, and its position is read afresh
        // before every click.

        static El ShareItem(El picker, string windowTitle)
        {
            foreach (var item in Uia.Descendants(picker, Uia.ListItemType))
                if (item.Name == windowTitle) return item;
            return null;
        }

        static string ShareItemsLayout(El picker)
        {
            var layout = new StringBuilder();
            foreach (var item in Uia.Descendants(picker, Uia.ListItemType))
                layout.Append(item.Name).Append('@').Append(item.Rect.left).Append(',').Append(item.Rect.top).Append(';');
            return layout.ToString();
        }

        /// <summary>Waits for the window to be listed, then for the picker to
        /// stop adding and moving entries.</summary>
        static El WaitForShareItem(El picker, string windowTitle)
        {
            if (WaitFor(() => ShareItem(picker, windowTitle), found => found != null, 4000) == null) return null;
            string previous = null;
            WaitUntil(() =>
            {
                var layout = ShareItemsLayout(picker);
                var settled = layout == previous;
                previous = layout;
                return settled;
            }, 3000);
            return ShareItem(picker, windowTitle);
        }

        /// <summary>Whether a click at the element's centre lands on it.</summary>
        static bool IsClickable(El element)
        {
            try
            {
                var point = new tagPOINT { x = element.CenterX, y = element.CenterY };
                var hit = Uia.Automation.ElementFromPoint(point);
                var walker = Uia.Automation.ControlViewWalker;
                for (int depth = 0; hit != null && depth < 4; depth++)
                {
                    if (Uia.Automation.CompareElements(hit, element.Raw) != 0) return true;
                    hit = walker.GetParentElement(hit);
                }
            }
            catch (Exception) { }
            return false;
        }

        /// <summary>Scrolls the picker until its entry for the window can be
        /// clicked. The picker can't be scrolled through UI Automation, so this
        /// turns the mouse wheel over it.</summary>
        static El ScrollShareItemIntoReach(El picker, string windowTitle)
        {
            var item = ShareItem(picker, windowTitle);
            for (int i = 0; i < 12 && item != null; i++)
            {
                if (IsClickable(item)) return item;
                var area = picker.Raw.CurrentBoundingRectangle;
                var middle = (area.top + area.bottom) / 2;
                Native.SetCursorPos(item.CenterX, middle);
                Thread.Sleep(50);
                var delta = item.CenterY > middle ? -Native.WheelDelta : Native.WheelDelta;
                Native.mouse_event(Native.MouseWheel, 0, 0, unchecked((uint)delta), UIntPtr.Zero);
                Thread.Sleep(300);
                item = ShareItem(picker, windowTitle);
            }
            return item != null && IsClickable(item) ? item : null;
        }

        /// <summary>Whether the window is the picker's one selected entry. Zoom
        /// versions that don't report selection are trusted with the click,
        /// which was checked to land on the window's entry.</summary>
        static bool IsOnlyShareSelection(El picker, string windowTitle)
        {
            var reported = false;
            var selected = false;
            foreach (var item in Uia.Descendants(picker, Uia.ListItemType))
            {
                try
                {
                    var pattern = item.Raw.GetCurrentPattern(Uia.SelectionItemPattern) as IUIAutomationSelectionItemPattern;
                    if (pattern == null) continue;
                    reported = true;
                    if (pattern.CurrentIsSelected == 0) continue;
                    if (item.Name != windowTitle) return false;
                    selected = true;
                }
                catch (Exception) { }
            }
            return selected || !reported;
        }

        /// <summary>Selects the window in Zoom's share picker, and makes sure
        /// it's the one selected. Returns the problem, or null.</summary>
        static string SelectShareWindow(El picker, string windowTitle)
        {
            if (WaitForShareItem(picker, windowTitle) == null) return "window-to-share-not-found";
            // Always-on-top windows can cover the picker, such as M³'s own
            // media window on a single screen, or Zoom's notices; a click
            // there would land on them. So the picker (which closes once
            // done) goes above them.
            Native.SetWindowPos(picker.Raw.CurrentNativeWindowHandle, Native.HwndTopmost, 0, 0, 0, 0,
                Native.SwpNoMove | Native.SwpNoSize | Native.SwpNoActivate);
            for (int attempt = 0; attempt < 3; attempt++)
            {
                var item = ScrollShareItemIntoReach(picker, windowTitle);
                if (item == null) return "window-to-share-not-selected";
                Click(item);
                if (WaitUntil(() => IsOnlyShareSelection(picker, windowTitle), 1500)) return null;
            }
            return "window-to-share-not-selected";
        }

        /// <summary>Whether Zoom is sharing the window, judged by its annotation
        /// layer covering it. Null if that can't be told (yet): the layer starts
        /// out as a tiny placeholder and takes about a second to move over the
        /// shared content, annotation can be turned off, and the window may not
        /// be found.</summary>
        static bool? IsSharingWindow(string windowTitle)
        {
            var layers = new List<IntPtr>();
            foreach (var layer in TopWindows(AnnotationLayerClass, true))
            {
                Native.Rect rect;
                if (Native.GetWindowRect(layer, out rect) && rect.Right - rect.Left > 50 && rect.Bottom - rect.Top > 50)
                    layers.Add(layer);
            }
            var windows = TopWindowsTitled(windowTitle);
            if (layers.Count == 0 || windows.Count == 0) return null;
            foreach (var layer in layers)
                foreach (var window in windows)
                    if (Overlap(layer, window) > 0.6) return true;
            return false;
        }

        static void CloseSharePicker(El picker)
        {
            Focus(picker);
            Escape();
            if (!WaitUntil(() => TopWindows(SharePickerClass, true).Count == 0, 3000))
            {
                // Its title bar's close button, as a fallback.
                var buttons = Uia.Descendants(picker, Uia.ButtonType);
                if (buttons.Count > 0) Press(buttons[0]);
            }
        }

        public static Dictionary<string, object> StartShare(string windowTitle, string shareTitle)
        {
            if (IsSharing()) return Changed(false);
            var window = RequireMeetingWindow();
            OpenSharePicker(window, shareTitle);
            var picker = WaitForWindow(SharePickerClass, WaitTimeoutMs);
            if (picker == null) throw new ZoomActionError("share-picker-not-found");
            var problem = SelectShareWindow(picker, windowTitle);
            if (problem != null)
            {
                CloseSharePicker(picker);
                throw new ZoomActionError(problem);
            }
            // Share sound, then Optimize for video clips, in every language.
            var checkboxes = Uia.Descendants(picker, Uia.CheckBoxType);
            for (int i = 0; i < Math.Min(2, checkboxes.Count); i++) SetChecked(checkboxes[i], true);
            var buttons = Uia.Descendants(picker, Uia.ButtonType);
            if (buttons.Count == 0) throw new ZoomActionError("share-confirm-not-found");
            // Never share anything but the window asked for.
            if (!IsOnlyShareSelection(picker, windowTitle))
            {
                CloseSharePicker(picker);
                throw new ZoomActionError("window-to-share-not-selected");
            }
            Press(buttons[buttons.Count - 1]);
            if (!WaitUntil(IsSharing, WaitTimeoutMs)) throw new ZoomActionError("share-not-started");
            // Should something else be shared after all, stop it at once.
            bool? sharingWindow = null;
            WaitUntil(() => (sharingWindow = IsSharingWindow(windowTitle)) == true, 4000);
            if (sharingWindow == false)
            {
                StopShare();
                throw new ZoomActionError("shared-wrong-window");
            }
            return Changed(true);
        }

        public static Dictionary<string, object> StopShare()
        {
            var toolbars = TopWindows(ShareToolbarClass, true);
            if (toolbars.Count == 0) return Changed(false);
            // "Stop share" is the last share-toolbar button that shows a shortcut.
            El stop = null;
            foreach (var button in Uia.Descendants(Uia.FromHandle(toolbars[0]), Uia.ButtonType))
                if (TrailingHotkey.IsMatch(button.Name)) stop = button;
            if (stop == null) throw new ZoomActionError("stop-share-button-not-found");
            Press(stop);
            if (!WaitUntil(() => !IsSharing(), WaitTimeoutMs)) throw new ZoomActionError("share-not-stopped");
            return Changed(true);
        }

        // --- Setup assistant -------------------------------------------------------------

        /// <summary>Whether everything the Zoom Meeting Manager relies on can be
        /// found in this Zoom, for the setup assistant to report.</summary>
        public static Dictionary<string, object> Diagnose()
        {
            var result = new Dictionary<string, object>();
            var window = FindMeetingWindow();
            result["meeting"] = window != null;
            if (window == null) return result;

            List<El> toolbar = null;
            try
            {
                ControlPanel(window);
                toolbar = ToolbarButtons(window);
            }
            catch (ZoomActionError) { }
            result["toolbar"] = toolbar != null && toolbar.Count > 0;
            if (toolbar == null || toolbar.Count == 0) return result;

            var joined = AnyHotkey.IsMatch(toolbar[0].Name);
            result["audioJoined"] = joined;
            // Only knowable while joined: "Join audio" has no shortcut at all.
            result["audioShortcutDefault"] = joined ? (object)HasHotkey(toolbar[0].Name, HotkeyAudio) : null;
            var video = VideoButton(window);
            result["videoButton"] = video != null;
            result["videoShortcutDefault"] = video != null && HasHotkey(video.Name, HotkeyVideo);
            result["videoTitle"] = video == null ? null : FirstSegment(video.Name);

            El muteAll = null;
            try
            {
                muteAll = OpenParticipantsPanel(window);
            }
            catch (ZoomActionError) { }
            result["participantsPanel"] = muteAll != null || Uia.Descendants(window, Uia.ListType).Count > 0;
            // Only the host and co-hosts can mute everyone.
            result["hostControls"] = muteAll != null;
            return result;
        }

        /// <summary>Switches a two-state toolbar button (the microphone or the
        /// camera) once and reports its name before and after, so the setup
        /// assistant can learn both names (they're only shown in the user's
        /// Zoom language).</summary>
        static Dictionary<string, object> ToggleButton(El window, Func<El> find, string what)
        {
            var button = find();
            if (button == null) throw new ZoomActionError(what + "-button-not-found");
            var before = FirstSegment(button.Name);
            Focus(window);
            Press(button);
            string after = null;
            var changed = WaitUntil(() =>
            {
                var latest = find();
                after = latest == null ? null : FirstSegment(latest.Name);
                return after != null && after != before;
            }, WaitTimeoutMs);
            if (!changed) throw new ZoomActionError(what + "-not-changed");
            return new Dictionary<string, object> { { "after", after }, { "before", before } };
        }

        public static Dictionary<string, object> ToggleVideo()
        {
            var window = RequireMeetingWindow();
            ControlPanel(window);
            return ToggleButton(window, () => VideoButton(window), "video");
        }

        public static Dictionary<string, object> ToggleMic()
        {
            var window = RequireMeetingWindow();
            ControlPanel(window);
            if (!AudioJoined(window)) throw new ZoomActionError("audio-not-joined");
            return ToggleButton(window, () => MicButton(window), "mic");
        }

        /// <summary>Opens Zoom's share picker the way sharing would, checks that
        /// the window to share is offered and that sharing would select it,
        /// and closes it without sharing.</summary>
        public static Dictionary<string, object> TestSharePicker(string windowTitle, string shareTitle)
        {
            if (IsSharing()) throw new ZoomActionError("already-sharing");
            var window = RequireMeetingWindow();
            try
            {
                OpenSharePicker(window, shareTitle);
            }
            catch (ZoomActionError)
            {
                return new Dictionary<string, object> { { "opened", false }, { "windowListed", false } };
            }
            var picker = WaitForWindow(SharePickerClass, 5000);
            if (picker == null)
            {
                return new Dictionary<string, object> { { "opened", false }, { "windowListed", false } };
            }
            var problem = SelectShareWindow(picker, windowTitle);
            CloseSharePicker(picker);
            return new Dictionary<string, object>
            {
                { "opened", true },
                { "windowListed", problem != "window-to-share-not-found" },
                { "windowSelected", problem == null },
            };
        }

        // --- Requests ------------------------------------------------------------------

        static string GetString(Dictionary<string, object> request, string key)
        {
            object value;
            return request.TryGetValue(key, out value) && value != null ? value.ToString() : null;
        }

        static bool GetBool(Dictionary<string, object> request, string key)
        {
            object value;
            return request.TryGetValue(key, out value) && value is bool && (bool)value;
        }

        static List<string> GetStrings(Dictionary<string, object> request, string key)
        {
            var result = new List<string>();
            object value;
            if (request.TryGetValue(key, out value) && value is object[])
                foreach (var item in (object[])value) if (item != null) result.Add(item.ToString());
            return result;
        }

        /// <summary>Runs a command, then puts the mouse cursor and the focused
        /// window back the way the user had them: the actions click, hover and
        /// bring Zoom forward along the way.</summary>
        public static Dictionary<string, object> Handle(Dictionary<string, object> request)
        {
            var type = GetString(request, "type");
            if (type == "ping" || (type == "meeting" && !GetBool(request, "reveal"))) return Run(type, request);

            Native.Point cursor;
            var hasCursor = Native.GetCursorPos(out cursor);
            var foreground = Native.GetForegroundWindow();
            try
            {
                return Run(type, request);
            }
            finally
            {
                if (hasCursor) Native.SetCursorPos(cursor.X, cursor.Y);
                if (foreground != IntPtr.Zero) Native.BringToFront(foreground);
            }
        }

        static Dictionary<string, object> Run(string type, Dictionary<string, object> request)
        {
            switch (type)
            {
                case "ping":
                    return new Dictionary<string, object> { { "echo", GetString(request, "echo") }, { "version", 1 } };
                case "meeting":
                    return new Dictionary<string, object> { { "meeting", MeetingState(GetBool(request, "reveal")) } };
                case "join-audio": return JoinAudio();
                case "leave-audio": return LeaveAudio();
                case "set-video":
                    return SetVideo(GetBool(request, "on"), GetString(request, "onTitle"), GetString(request, "offTitle"));
                case "video-title": return VideoTitle();
                case "set-mic":
                    return SetMic(GetBool(request, "on"), GetString(request, "onTitle"), GetString(request, "offTitle"));
                case "mic-title": return MicTitle();
                case "mute-all": return MuteAll(GetBool(request, "allowSelfUnmute"));
                case "ask-all-to-unmute": return AskAllToUnmute();
                case "participants": return Participants();
                case "admit": return Admit(GetStrings(request, "names"));
                case "learn-hand-raised": return LearnHandRaised();
                case "raised-hands": return RaisedHands(GetString(request, "phrase"));
                case "press-participant-mic": return PressParticipantMic(GetString(request, "name"));
                case "share-entries": return ShareEntries();
                case "start-share":
                    return StartShare(GetString(request, "windowTitle") ?? "", GetString(request, "shareButtonTitle"));
                case "stop-share": return StopShare();
                case "diagnose":
                    return new Dictionary<string, object> { { "diagnosis", Diagnose() } };
                case "toggle-video": return ToggleVideo();
                case "toggle-mic": return ToggleMic();
                case "test-share-picker":
                    return TestSharePicker(GetString(request, "windowTitle") ?? "", GetString(request, "shareButtonTitle"));
                default: throw new ZoomActionError("unknown-command");
            }
        }
    }

    public static class Program
    {
        public static void Run()
        {
            // Real (physical) coordinates, so fallback clicks land on the right
            // spot on mixed-DPI multi-monitor setups.
            Native.SetProcessDpiAwarenessContext(Native.DpiAwarenessPerMonitorV2);

            var json = new JavaScriptSerializer();
            var stdout = Console.Out;
            stdout.WriteLine(json.Serialize(new Dictionary<string, object> { { "ready", true }, { "version", 1 } }));
            stdout.Flush();

            string line;
            while ((line = Console.In.ReadLine()) != null)
            {
                if (line.Trim().Length == 0) continue;
                object id = null;
                Dictionary<string, object> reply;
                try
                {
                    var request = json.DeserializeObject(line) as Dictionary<string, object>;
                    if (request == null) throw new ZoomActionError("invalid-request");
                    request.TryGetValue("id", out id);
                    reply = Helper.Handle(request);
                    reply["ok"] = true;
                }
                catch (ZoomActionError error)
                {
                    reply = new Dictionary<string, object> { { "error", error.Message }, { "ok", false } };
                }
                catch (ArgumentException)
                {
                    reply = new Dictionary<string, object> { { "error", "invalid-request" }, { "ok", false } };
                }
                catch (Exception error)
                {
                    Console.Error.WriteLine("Zoom helper error: " + error);
                    reply = new Dictionary<string, object> { { "error", "unexpected:" + error.Message }, { "ok", false } };
                }
                reply["id"] = id;
                stdout.WriteLine(json.Serialize(reply));
                stdout.Flush();
            }
        }
    }
}
