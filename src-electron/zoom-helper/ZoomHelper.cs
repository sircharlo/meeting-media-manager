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
// Controls are pressed without moving the user's mouse: through UI
// Automation (Invoke, Toggle, or a control's default action), or else
// through mouse and key messages sent to Zoom's own windows, which Zoom's
// popups take. A real click is the last resort, for a control Zoom answers
// none of those ways. Zoom still brings itself forward when its buttons
// are pressed, so each request gives the focus back afterwards.
//
// It uses the native COM UI Automation API (through an interop assembly
// zoom-helper.ps1 generates from Windows' own UIAutomationCore.dll): the
// managed System.Windows.Automation API is over ten times slower on Zoom's
// windows.

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
        [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint processId);
        [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint attach, uint attachTo, bool doAttach);
        [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
        [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr hwnd);
        [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr hwnd);
        [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int key);
        [DllImport("user32.dll")] public static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint flags);
        [DllImport("user32.dll")] public static extern bool GetMonitorInfo(IntPtr monitor, ref MonitorInfo info);
        [DllImport("user32.dll")] public static extern bool GetWindowPlacement(IntPtr hwnd, ref WindowPlacement placement);
        [DllImport("user32.dll")] public static extern bool SetWindowPlacement(IntPtr hwnd, ref WindowPlacement placement);
        [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr hwnd, int attribute, out Rect value, int size);
        // Windows 10 2004 and later only (see IsArranged).
        [DllImport("user32.dll")] public static extern bool IsWindowArranged(IntPtr hwnd);

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
        [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hwnd, uint msg, IntPtr wParam, IntPtr lParam);
        [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr hwnd, uint msg, IntPtr wParam, IntPtr lParam);
        [DllImport("user32.dll")] public static extern bool ScreenToClient(IntPtr hwnd, ref Point point);
        [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr parent, EnumWindowsProc callback, IntPtr lParam);
        [DllImport("user32.dll")] public static extern IntPtr ChildWindowFromPointEx(IntPtr parent, Point point, uint flags);
        public const uint WmKeyDown = 0x0100;
        public const uint WmKeyUp = 0x0101;
        public const uint WmMouseMove = 0x0200;
        public const uint WmLButtonDown = 0x0201;
        public const uint WmLButtonUp = 0x0202;
        public const uint WmMouseWheel = 0x020A;
        public const int MkLButton = 0x0001;
        public const uint CwpSkipInvisible = 0x0001;
        public const uint CwpSkipTransparent = 0x0004;
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
        [StructLayout(LayoutKind.Sequential)]
        public struct MonitorInfo
        {
            public int Size;
            public Rect Monitor;
            public Rect Work;
            public uint Flags;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct WindowPlacement
        {
            public int Length;
            public int Flags;
            public int ShowCommand;
            public Point MinPosition;
            public Point MaxPosition;
            public Rect Normal;
        }
        [DllImport("user32.dll")] public static extern void mouse_event(uint flags, int dx, int dy, uint data, UIntPtr extra);
        [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);

        public static readonly IntPtr DpiAwarenessPerMonitorV2 = new IntPtr(-4);
        // SW_SHOWNOACTIVATE: restores a minimized or maximized window without
        // activating it. (SwShowNoActivate below is SW_SHOWNA.)
        public const int SwRestoreNoActivate = 4;
        public const int SwShowNormal = 1;
        public const int SwShowNoActivate = 8;
        public const int SwRestore = 9;
        public const uint SwpNoZOrder = 0x0004;
        public const int DwmwaExtendedFrameBounds = 9;
        public const uint MonitorDefaultToNearest = 2;
        public const uint KeyExtended = 0x0001;
        public const byte VkShift = 0x10;
        public const byte VkControl = 0x11;
        public const byte VkLeftWindows = 0x5B;
        public const byte VkRightWindows = 0x5C;
        public const byte VkLeft = 0x25;
        public const byte VkRight = 0x27;
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
        public const byte VkSpace = 0x20;
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
        public const int LegacyIAccessiblePattern = 10018;
        public const int ScrollItemPattern = 10017;
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
            return FindAll(root, controlType == 0
                ? Automation.CreateTrueCondition()
                : Automation.CreatePropertyCondition(ControlTypeProperty, controlType));
        }

        /// <summary>The descendants of any of these control types.</summary>
        public static List<El> Descendants(El root, int[] controlTypes)
        {
            var condition = Automation.CreatePropertyCondition(ControlTypeProperty, controlTypes[0]);
            for (int i = 1; i < controlTypes.Length; i++)
                condition = Automation.CreateOrCondition(condition, Automation.CreatePropertyCondition(ControlTypeProperty, controlTypes[i]));
            return FindAll(root, condition);
        }

        static List<El> FindAll(El root, IUIAutomationCondition condition)
        {
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

    /// <summary>Names of Zoom's controls in the user's language, as M3 has
    /// learned them so far: sent with every request ("titles"), so controls
    /// are found by name rather than by Zoom's shortcuts, which the user may
    /// have changed. Whatever a request learns anew goes back in its reply
    /// ("learned") for M3 to keep.</summary>
    public static class Known
    {
        public static string MicOn;
        public static string MicOff;
        public static string JoinAudio;
        public static string Participants;
        public static string MuteAll;
        public static string StopShare;
        public static readonly Dictionary<string, object> Learned = new Dictionary<string, object>();

        public static void Load(Dictionary<string, object> request)
        {
            Learned.Clear();
            object value;
            var titles = request.TryGetValue("titles", out value) ? value as Dictionary<string, object> : null;
            MicOn = Get(titles, "micOn");
            MicOff = Get(titles, "micOff");
            JoinAudio = Get(titles, "joinAudio");
            Participants = Get(titles, "participants");
            MuteAll = Get(titles, "muteAll");
            StopShare = Get(titles, "stopShare");
        }

        static string Get(Dictionary<string, object> titles, string key)
        {
            object value;
            if (titles == null || !titles.TryGetValue(key, out value) || value == null) return null;
            var title = Helper.FirstSegment(value.ToString());
            return title.Length == 0 ? null : title;
        }

        public static Dictionary<string, object> Titles()
        {
            return new Dictionary<string, object>
            {
                { "joinAudio", JoinAudio }, { "micOff", MicOff }, { "micOn", MicOn },
                { "muteAll", MuteAll }, { "participants", Participants }, { "stopShare", StopShare },
            };
        }

        /// <summary>Remembers a name just seen, when it's news.</summary>
        public static void Learn(string key, string title)
        {
            if (string.IsNullOrEmpty(title)) return;
            switch (key)
            {
                case "joinAudio": if (JoinAudio == title) return; JoinAudio = title; break;
                case "participants": if (Participants == title) return; Participants = title; break;
                case "muteAll": if (MuteAll == title) return; MuteAll = title; break;
                case "stopShare": if (StopShare == title) return; StopShare = title; break;
                default: return;
            }
            Learned[key] = title;
        }
    }

    /// <summary>Notices the user moving or resizing one of Zoom's windows
    /// themselves (by its title bar or borders, including Windows' snapping
    /// by mouse), by window class: Windows reports those, and only those, as
    /// move/size loops, never a program's own moves. M3 then leaves the
    /// window where the user put it rather than putting it back (see
    /// src/helpers/zoom-layout.ts). The hook needs a message loop, so it runs
    /// on a thread of its own, started by the first window-layout request.</summary>
    public static class MoveWatch
    {
        delegate void WinEventProc(IntPtr hook, uint eventType, IntPtr hwnd, int objectId, int childId, uint thread, uint time);

        [StructLayout(LayoutKind.Sequential)]
        struct Message
        {
            public IntPtr Window;
            public uint Id;
            public IntPtr WParam;
            public IntPtr LParam;
            public uint Time;
            public int X;
            public int Y;
        }

        [DllImport("user32.dll")] static extern IntPtr SetWinEventHook(uint min, uint max, IntPtr module, WinEventProc proc, uint processId, uint threadId, uint flags);
        [DllImport("user32.dll")] static extern int GetMessage(out Message message, IntPtr window, uint min, uint max);
        [DllImport("user32.dll")] static extern bool TranslateMessage(ref Message message);
        [DllImport("user32.dll")] static extern IntPtr DispatchMessage(ref Message message);

        const uint EventMoveSizeStart = 0x000A;
        const uint EventMoveSizeEnd = 0x000B;
        const uint OutOfContext = 0x0000;
        const uint SkipOwnProcess = 0x0002;

        // Kept here so the delegate outlives the native hook.
        static WinEventProc callback;
        static int started;
        // By window class: being moved now, and when it was last.
        static readonly Dictionary<string, bool> moving = new Dictionary<string, bool>();
        static readonly Dictionary<string, long> lastEndTicks = new Dictionary<string, long>();

        public static void Start(params string[] classNames)
        {
            if (Interlocked.Exchange(ref started, 1) == 1) return;
            var watched = new HashSet<string>(classNames);
            var thread = new Thread(() => Loop(watched));
            thread.IsBackground = true;
            thread.Start();
        }

        static void Loop(HashSet<string> watched)
        {
            callback = (hook, eventType, hwnd, objectId, childId, thread, time) =>
            {
                if (objectId != 0 || hwnd == IntPtr.Zero) return; // the window itself
                var buffer = new StringBuilder(256);
                Native.GetClassName(hwnd, buffer, buffer.Capacity);
                var className = buffer.ToString();
                if (!watched.Contains(className)) return;
                lock (moving)
                {
                    moving[className] = eventType == EventMoveSizeStart;
                    if (eventType == EventMoveSizeEnd) lastEndTicks[className] = DateTime.UtcNow.Ticks;
                }
            };
            SetWinEventHook(EventMoveSizeStart, EventMoveSizeEnd, IntPtr.Zero, callback, 0, 0, OutOfContext | SkipOwnProcess);
            Message message;
            while (GetMessage(out message, IntPtr.Zero, 0, 0) > 0)
            {
                TranslateMessage(ref message);
                DispatchMessage(ref message);
            }
        }

        /// <summary>Whether the user is moving or resizing a window of the
        /// class right now.</summary>
        public static bool Moving(string className)
        {
            lock (moving)
            {
                bool value;
                return moving.TryGetValue(className, out value) && value;
            }
        }

        /// <summary>How long ago the user last finished moving or resizing a
        /// window of the class, in milliseconds; null if they haven't since
        /// the helper started.</summary>
        public static object MillisecondsSinceMove(string className)
        {
            lock (moving)
            {
                long ticks;
                if (!lastEndTicks.TryGetValue(className, out ticks)) return null;
                return (long)TimeSpan.FromTicks(DateTime.UtcNow.Ticks - ticks).TotalMilliseconds;
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
        const string ReactionPanelClass = "ZPReactionWndClass";
        // A panel popped out of the meeting window ("Open in new window"),
        // such as the participants panel, which Zoom then keeps opening there.
        const string PoppedOutPanelClass = "ZPlistPopupContainerWndClass";
        // The video thumbnail Zoom shows in place of the meeting window in
        // its mini view.
        const string FloatVideoClass = "ZPFloatVideoWndClass";
        // Zoom's annotation layer, laid over whatever is being shared.
        const string AnnotationLayerClass = "ZoomAnnoWindowWndClass";

        // Zoom's default shortcuts. They only help find a control the first
        // time: once a control's name (in the user's Zoom language) is
        // learned, it's found by name, so changed shortcuts don't matter.
        const string HotkeyVideo = "Alt+V";
        const string HotkeyMuteAll = "Alt+M";
        const string HotkeyParticipants = "Alt+U";
        // Toolbar buttons that are clearly neither Share nor React, and in two
        // cases must never be pressed to find out: End (Alt+Q) and Record
        // (Alt+R).
        static readonly string[] OtherButtonHotkeys = { "Alt+Q", "Alt+R", "Alt+H", "Alt+U", "Alt+I" };

        // A trailing "(Ctrl+Alt+Shift+A)" style shortcut in a control name.
        // Key names are matched by shape only, since Zoom may translate them
        // (e.g. "Strg" for Ctrl in German).
        // Japanese Zoom writes it with full-width brackets, "（Alt+I）".
        static readonly Regex TrailingHotkey = new Regex(@"[(（](?:[^()（）\s+]+\+)+[^()（）\s+]+[)）]\s*$");
        // Zoom names its menu separators "4 of 17" in every language.
        static readonly Regex MenuSeparator = new Regex(@"^\d+ of \d+$");
        // "More" menu entries end with a translated "row R, column C N of M ..."
        static readonly Regex GridPositionSuffix = new Regex(@"^(.*?)\s+\S+\s+\d+,\s*\S+\s+\d+\s+\d+\s+\S+\s+\d+(?:\s.*)?$");
        static readonly Regex SectionHeader = new Regex(@"[(（]\d+[)）]");
        // The participants panel's heading, "Participants (3)" in every
        // language (full-width brackets in Japanese), with its title apart.
        static readonly Regex CountedTitle = new Regex(@"^(.*?)\s*[(（]\d+[)）]\s*$");
        // Any keyboard shortcut ("Alt+A", "Ctrl+Alt+Shift+A", "Strg+Umschalt+S").
        static readonly Regex AnyHotkey = new Regex(@"(?<![\w+])[\p{L}]+(?:\+[\p{L}\p{N}]+)+(?![\w+])");
        // The Reactions button's trailing "(Ctrl+Shift+Y)", matched by shape
        // like TrailingHotkey.
        static readonly Regex ReactHotkey = new Regex(@"[(（](?:[^()（）\s+]+\+){2}Y[)）]\s*$");

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

        static string ClassOf(IntPtr handle)
        {
            var buffer = new StringBuilder(256);
            Native.GetClassName(handle, buffer, buffer.Capacity);
            return buffer.ToString();
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
        // Zoom separates the pieces of a name with a comma: ",", or "、" and
        // "，" in Japanese and Chinese.
        static readonly char[] SegmentSeparators = { ',', '、', '，' };

        static string[] SplitSegments(string name)
        {
            return (name ?? "").Split(SegmentSeparators);
        }

        public static string FirstSegment(string name)
        {
            var first = SplitSegments(name)[0];
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

        // Whether this request moved the mouse (only ever as a last resort),
        // so it's put back afterwards (see RunRestoringInput).
        static bool cursorMoved;

        static void MoveCursor(int x, int y)
        {
            cursorMoved = true;
            Native.SetCursorPos(x, y);
        }

        /// <summary>Brings a window forward, un-minimizing it: for real key
        /// presses and the last-resort mouse paths. Zoom's controls are
        /// otherwise pressed without the focus.</summary>
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

        /// <summary>The window an element is drawn in: the nearest one up its
        /// tree (a child window, such as Zoom's toolbar).</summary>
        static IntPtr OwnWindowOf(El element)
        {
            try
            {
                var walker = Uia.Automation.RawViewWalker;
                var current = element.Raw;
                for (int depth = 0; current != null && depth < 30; depth++)
                {
                    var handle = current.CurrentNativeWindowHandle;
                    if (handle != IntPtr.Zero) return handle;
                    current = walker.GetParentElement(current);
                }
            }
            catch (Exception) { }
            return IntPtr.Zero;
        }

        /// <summary>The top-level window an element belongs to.</summary>
        static IntPtr TopWindowOf(El element)
        {
            var own = OwnWindowOf(element);
            return own == IntPtr.Zero ? IntPtr.Zero : Native.GetAncestor(own, Native.GaRoot);
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
            MoveCursor(x, y);
            Thread.Sleep(50);
            Native.mouse_event(Native.MouseLeftDown, 0, 0, 0, UIntPtr.Zero);
            Native.mouse_event(Native.MouseLeftUp, 0, 0, 0, UIntPtr.Zero);
        }

        /// <summary>A real click: the last resort.</summary>
        static void Click(El element)
        {
            // A control read from Zoom's hidden toolbar (see ControlPanel) is
            // only there to click once the toolbar shows.
            var own = OwnWindowOf(element);
            if (own != IntPtr.Zero && !Native.IsWindowVisible(own) && ClassOf(own) == ControlPanelClass)
            {
                Native.ShowWindow(own, Native.SwShowNoActivate);
                Thread.Sleep(150);
            }
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
            MoveCursor(element.CenterX, element.CenterY);
        }

        // Real key presses go to whatever has the focus: Zoom must have been
        // brought forward. Never post Alt to Zoom instead: posted Alt key
        // messages upset its tracking of a lone Alt, which toggles its
        // "Always show meeting controls" setting.
        static void AltKey(char key)
        {
            byte vk = (byte)char.ToUpperInvariant(key);
            Native.keybd_event(Native.VkMenu, 0, 0, UIntPtr.Zero);
            TapKey(vk);
            Native.keybd_event(Native.VkMenu, 0, Native.KeyUp, UIntPtr.Zero);
        }

        static void TapKey(byte vk)
        {
            Native.keybd_event(vk, 0, 0, UIntPtr.Zero);
            Native.keybd_event(vk, 0, Native.KeyUp, UIntPtr.Zero);
        }

        static void Escape()
        {
            TapKey(Native.VkEscape);
        }

        /// <summary>Escape sent to a window, without the focus: Zoom's popups,
        /// menus and dialogs take it (the meeting window itself doesn't).</summary>
        static void PostEscape(IntPtr handle)
        {
            // lParam: one press of the key with scan code 1 (Escape), then its release.
            Native.PostMessage(handle, Native.WmKeyDown, new IntPtr(Native.VkEscape), new IntPtr(0x00010001));
            Native.PostMessage(handle, Native.WmKeyUp, new IntPtr(Native.VkEscape), new IntPtr(unchecked((int)0xC0010001)));
        }

        /// <summary>Closes one of Zoom's popups or dialogs with Escape: sent to
        /// it, and only if that didn't close it, typed with the window
        /// brought forward. False if it's still open.</summary>
        static bool CloseWithEscape(IntPtr handle)
        {
            PostEscape(handle);
            if (WaitUntil(() => !Native.IsWindowVisible(handle), 1500)) return true;
            Native.BringToFront(handle);
            Thread.Sleep(150);
            Escape();
            return WaitUntil(() => !Native.IsWindowVisible(handle), 1500);
        }

        /// <summary>Closes every open window of a class (Zoom's menus, its
        /// "More" menu) with Escape.</summary>
        static void CloseAll(string className)
        {
            foreach (var handle in TopWindows(className, true)) CloseWithEscape(handle);
        }

        /// <summary>Invokes a control without moving the mouse. False if Zoom
        /// doesn't support Invoke on it (or turns it down).</summary>
        static bool TryInvoke(El element)
        {
            try
            {
                var pattern = element.Raw.GetCurrentPattern(Uia.InvokePattern) as IUIAutomationInvokePattern;
                if (pattern == null) return false;
                pattern.Invoke();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        /// <summary>Carries out a control's default action without moving the
        /// mouse: what the entries of Zoom's "More" menu support instead of
        /// Invoke. False if Zoom doesn't support it there (or turns it
        /// down).</summary>
        static bool TryDefaultAction(El element)
        {
            try
            {
                var pattern = element.Raw.GetCurrentPattern(Uia.LegacyIAccessiblePattern) as IUIAutomationLegacyIAccessiblePattern;
                if (pattern == null) return false;
                pattern.DoDefaultAction();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        static bool HasKeyboardFocus(El element)
        {
            try
            {
                return element.Raw.CurrentHasKeyboardFocus != 0;
            }
            catch (Exception)
            {
                return false; // the element went away
            }
        }

        /// <summary>Selects a list entry without the mouse, when it supports it.</summary>
        static bool TrySelect(El element)
        {
            try
            {
                var pattern = element.Raw.GetCurrentPattern(Uia.SelectionItemPattern) as IUIAutomationSelectionItemPattern;
                if (pattern == null) return false;
                pattern.Select();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        /// <summary>Brings a control into view without the mouse wheel, when it
        /// supports it.</summary>
        static bool TryScrollIntoView(El element)
        {
            try
            {
                var pattern = element.Raw.GetCurrentPattern(Uia.ScrollItemPattern) as IUIAutomationScrollItemPattern;
                if (pattern == null) return false;
                pattern.ScrollIntoView();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        // Mouse messages sent straight to one of Zoom's windows, without
        // moving the mouse. Zoom's popups (its "More" menu, the share window
        // and toolbar, the mini view) act on them; the meeting window itself
        // only follows the real mouse.

        /// <summary>Zoom's innermost visible window at a screen point, inside
        /// one of its top-level windows: the one that handles the mouse
        /// there.</summary>
        static IntPtr ChildWindowAt(IntPtr top, int x, int y)
        {
            var current = top;
            for (int depth = 0; depth < 10; depth++)
            {
                var client = new Native.Point { X = x, Y = y };
                Native.ScreenToClient(current, ref client);
                var child = Native.ChildWindowFromPointEx(current, client, Native.CwpSkipInvisible | Native.CwpSkipTransparent);
                if (child == IntPtr.Zero || child == current) break;
                current = child;
            }
            return current;
        }

        /// <summary>A screen point as a mouse message's lParam for a window.</summary>
        static IntPtr ClientPoint(IntPtr window, int x, int y)
        {
            var client = new Native.Point { X = x, Y = y };
            Native.ScreenToClient(window, ref client);
            return new IntPtr(((client.Y & 0xFFFF) << 16) | (client.X & 0xFFFF));
        }

        /// <summary>Tells one of Zoom's windows the mouse is over a point, as
        /// hovering it would.</summary>
        static void PostHover(IntPtr top, int x, int y)
        {
            var target = ChildWindowAt(top, x, y);
            for (int i = 0; i < 3; i++)
            {
                Native.PostMessage(target, Native.WmMouseMove, IntPtr.Zero, ClientPoint(target, x + i, y + i));
                Thread.Sleep(40);
            }
        }

        /// <summary>A click sent to the window a control is drawn in, at its
        /// middle. False if it can't be sent: the control has no place on
        /// screen, or its window went away.</summary>
        static bool TryPostClick(El element)
        {
            var top = TopWindowOf(element);
            if (top == IntPtr.Zero || element.Area == 0) return false;
            try
            {
                if (element.Raw.CurrentIsOffscreen != 0) return false;
            }
            catch (Exception)
            {
                return false; // the element went away
            }
            var target = ChildWindowAt(top, element.CenterX, element.CenterY);
            var point = ClientPoint(target, element.CenterX, element.CenterY);
            if (!Native.PostMessage(target, Native.WmMouseMove, IntPtr.Zero, point)) return false;
            Thread.Sleep(50);
            Native.PostMessage(target, Native.WmLButtonDown, new IntPtr(Native.MkLButton), point);
            Thread.Sleep(30);
            return Native.PostMessage(target, Native.WmLButtonUp, IntPtr.Zero, point);
        }

        /// <summary>A turn of the mouse wheel sent to a window, over a screen
        /// point (wheel messages carry screen coordinates).</summary>
        static void PostWheel(IntPtr window, int x, int y, int delta)
        {
            var wParam = new IntPtr(unchecked((int)((uint)(delta & 0xFFFF) << 16)));
            Native.PostMessage(window, Native.WmMouseWheel, wParam, new IntPtr(((y & 0xFFFF) << 16) | (x & 0xFFFF)));
        }

        /// <summary>Opens the menu behind a control: through Invoke first (no
        /// mouse), and if Zoom takes the Invoke but shows no menu, through a
        /// real click. Null if no menu showed up either way.</summary>
        static El OpenMenuFrom(El control, int timeoutMs)
        {
            if (TryInvoke(control))
            {
                var menu = WaitForWindow(MenuClass, Math.Min(timeoutMs, 1500));
                if (menu != null) return menu;
            }
            Click(control);
            return WaitForWindow(MenuClass, timeoutMs);
        }

        /// <summary>Presses a control without moving the mouse: Invoke, else
        /// its default action (the "More" menu's entries), else a click sent
        /// to its window ("Stop share", the mini view's buttons, which turn
        /// both down). A real click only if none of those can be done.</summary>
        static void Press(El element)
        {
            // Zoom turns some Invoke calls down (COMException, or
            // InvalidOperationException through the interop).
            if (TryInvoke(element) || TryDefaultAction(element) || TryPostClick(element)) return;
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
                Press(checkbox);
            }
            return true;
        }

        // --- Dialogs and menus -------------------------------------------------

        /// <summary>A dialog's main action button: the tallest below the
        /// title bar, the widest among equals. Not the largest by area: the
        /// join-audio dialog's "Test speaker and microphone" link is a wide,
        /// flat button that outgrows "Join with computer audio" in some
        /// languages (Korean).</summary>
        static El MainActionButton(El dialog)
        {
            var top = dialog.Raw.CurrentBoundingRectangle.top;
            El best = null;
            foreach (var button in Uia.Descendants(dialog, Uia.ButtonType))
            {
                if (button.Rect.top < top + 48) continue; // title bar: Close
                var height = button.Rect.bottom - button.Rect.top;
                var width = button.Rect.right - button.Rect.left;
                var bestHeight = best == null ? -1 : best.Rect.bottom - best.Rect.top;
                var bestWidth = best == null ? -1 : best.Rect.right - best.Rect.left;
                if (height > bestHeight || (height == bestHeight && width > bestWidth)) best = button;
            }
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

        /// <summary>Whether a menu entry is an on/off option.</summary>
        static bool IsToggleItem(El item)
        {
            try { return item.Raw.GetCurrentPattern(Uia.TogglePattern) != null; }
            catch (Exception) { return false; }
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

        /// <summary>Zoom's mini view: the meeting window is hidden behind a
        /// small floating video thumbnail (which the user may have chosen,
        /// or Zoom when another window took the screen).</summary>
        static bool InMiniView()
        {
            return TopWindows(FloatVideoClass, true).Count > 0;
        }

        /// <summary>Brings the meeting window back from Zoom's mini view:
        /// the thumbnail shows its controls while hovered, the last of which
        /// (after Hide video, microphone, camera and Share) shows the full
        /// meeting window. The thumbnail is told the mouse is over it and that
        /// button is sent a click (it turns Invoke down); only if that doesn't
        /// bring the meeting back is the mouse really moved there, which
        /// Handle undoes.</summary>
        static El ExitMiniView()
        {
            var floats = TopWindows(FloatVideoClass, true);
            if (floats.Count == 0) return null;
            var handle = floats[0];
            Native.Rect rect;
            if (!Native.GetWindowRect(handle, out rect)) return null;
            var x = (rect.Left + rect.Right) / 2;
            var y = (rect.Top + rect.Bottom) / 2;
            var thumbnail = Uia.FromHandle(handle);
            for (int attempt = 0; attempt < 2; attempt++)
            {
                var quiet = attempt == 0;
                if (quiet) PostHover(handle, x, y);
                else MoveCursor(x, y);
                var show = WaitFor(() => LastControlRowButton(thumbnail), found => found != null, 2000);
                if (show == null) continue;
                if (quiet) Press(show);
                else Click(show);
                var window = WaitFor(FindMeetingWindow, found => found != null, 4000);
                if (window != null) return window;
            }
            return null;
        }

        /// <summary>The rightmost button of the thumbnail's control row (its
        /// drag handles sit lower and are tiny).</summary>
        static El LastControlRowButton(El thumbnail)
        {
            El last = null;
            foreach (var button in Uia.Descendants(thumbnail, Uia.ButtonType))
            {
                if (button.Rect.bottom - button.Rect.top < 24) continue;
                if (last == null || button.Rect.left > last.Rect.left) last = button;
            }
            return last;
        }

        static El RequireMeetingWindow()
        {
            var window = FindMeetingWindow() ?? ExitMiniView();
            if (window == null) throw new ZoomActionError("meeting-not-found");
            // Zoom's controls are pressed without the focus, but a minimized
            // meeting window is brought back first.
            var handle = window.Raw.CurrentNativeWindowHandle;
            if (!Native.IsIconic(handle)) return window;
            Focus(window);
            return Uia.FromHandle(handle);
        }

        /// <summary>The meeting toolbar's own window, whether Zoom shows it or
        /// not. Zoom hides the toolbar a few seconds after the mouse stops
        /// moving over the meeting, and a hidden toolbar vanishes from the
        /// meeting's UI Automation tree; but it's a child window of the
        /// meeting, which still exposes its buttons (and their Invoke)
        /// through its handle. Null if it can't be read that way.</summary>
        static El ToolbarWindow(El window)
        {
            var found = IntPtr.Zero;
            Native.EnumChildWindows(window.Raw.CurrentNativeWindowHandle, delegate (IntPtr hwnd, IntPtr lParam)
            {
                if (ClassOf(hwnd) != ControlPanelClass) return true;
                found = hwnd;
                return false;
            }, IntPtr.Zero);
            if (found == IntPtr.Zero) return null;
            try
            {
                var toolbar = Uia.FromHandle(found);
                return Uia.Descendants(toolbar, Uia.ButtonType).Count > 0 ? toolbar : null;
            }
            catch (Exception)
            {
                return null; // the window went away
            }
        }

        /// <summary>The meeting toolbar, read as it is, shown or hidden (see
        /// ToolbarWindow). Only if it can't be read that way is it brought
        /// back into view the way Zoom expects, by moving the mouse over the
        /// meeting.</summary>
        static El ControlPanel(El window)
        {
            var panel = Uia.FirstByClass(window, ControlPanelClass) ?? ToolbarWindow(window);
            if (panel != null) return panel;
            Focus(window);
            var handle = window.Raw.CurrentNativeWindowHandle;
            Func<El> reveal = () => WaitFor(() =>
            {
                // Read afresh: Focus may just have restored a minimized window,
                // whose earlier position was off-screen.
                Native.Point point;
                VisiblePoint(handle, window.Raw.CurrentBoundingRectangle, out point);
                MoveCursor(point.X, point.Y);
                Thread.Sleep(50);
                var nudge = ShowsAt(handle, point.X + 20, point.Y + 20) ? 20 : -20;
                MoveCursor(point.X + nudge, point.Y + nudge);
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

        /// <summary>Whether the host is joined to computer audio. The toolbar
        /// always starts with the microphone button, or with "Join audio"
        /// while not joined: told apart by their learned names, and failing
        /// those by the keyboard shortcut Zoom shows in the microphone's name
        /// (and not in "Join audio"'s), which also teaches the latter.</summary>
        enum AudioState { Joined, NotJoined, Unknown }

        /// <summary>Unknown when the first button has no shortcut and no
        /// learned name: "Join audio", or a microphone whose shortcut the
        /// user removed, before the setup assistant learned its names.</summary>
        static AudioState GetAudioState(El window)
        {
            var buttons = ToolbarButtons(window);
            if (buttons.Count == 0) return AudioState.NotJoined;
            var name = FirstSegment(buttons[0].Name);
            if (name.Length > 0 && (name == Known.MicOn || name == Known.MicOff)) return AudioState.Joined;
            if (name.Length > 0 && name == Known.JoinAudio) return AudioState.NotJoined;
            return AnyHotkey.IsMatch(buttons[0].Name) ? AudioState.Joined : AudioState.Unknown;
        }

        static bool AudioJoined(El window)
        {
            return GetAudioState(window) == AudioState.Joined;
        }

        /// <summary>The microphone button, which only exists once joined to
        /// computer audio (null otherwise).</summary>
        static El MicButton(El window)
        {
            if (!AudioJoined(window)) return null;
            var buttons = ToolbarButtons(window);
            return buttons.Count > 0 ? buttons[0] : null;
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

        /// <summary>What's going on in Zoom. Without `reveal`, it never changes
        /// anything on screen (M³ polls it): it reads the toolbar even while
        /// Zoom hides it (see ToolbarWindow), but leaves the mini view as it
        /// is, so the audio and video states are unknown (null) there.
        /// `toolbarVisible` tells whether Zoom shows its toolbar.</summary>
        static Dictionary<string, object> MeetingState(bool reveal)
        {
            var sharing = IsSharing();
            var window = FindMeetingWindow();
            if (window == null && reveal) window = ExitMiniView();
            if (window == null)
            {
                // While sharing, Zoom hides the meeting window behind its share
                // toolbar, and in its mini view behind a thumbnail: still in a
                // meeting.
                var miniView = InMiniView();
                return new Dictionary<string, object> { { "found", sharing || miniView }, { "miniView", miniView }, { "sharing", sharing } };
            }
            var toolbarVisible = Uia.FirstByClass(window, ControlPanelClass) != null;
            var toolbarRead = toolbarVisible || ToolbarWindow(window) != null;
            if (!toolbarRead && reveal)
            {
                try
                {
                    ControlPanel(window);
                    toolbarVisible = toolbarRead = true;
                }
                catch (ZoomActionError) { }
            }
            El mic = toolbarRead ? MicButton(window) : null;
            El video = toolbarRead ? VideoButton(window) : null;
            return new Dictionary<string, object>
            {
                { "audioJoined", toolbarRead ? (object)(mic != null) : null },
                { "dialogs", ZoomDialogClasses() },
                { "zoomVersion", CachedZoomVersion() },
                { "found", true },
                { "handle", window.Raw.CurrentNativeWindowHandle.ToInt64() },
                { "micTitle", mic == null ? null : FirstSegment(mic.Name) },
                { "participantsPanelOpen", ParticipantsPanelOpen(window) },
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

        /// <summary>Joins computer audio through the toolbar's first button.
        /// When it can't be told whether that button is "Join audio" or a
        /// microphone without a shortcut (see GetAudioState), the press
        /// decides: Zoom's join-audio dialog means "Join audio"; a button
        /// that only changed its name was the microphone, which is pressed
        /// again to put it back, and the user is asked instead
        /// (audioStateUnknown).</summary>
        public static Dictionary<string, object> JoinAudio()
        {
            var window = RequireMeetingWindow();
            var state = GetAudioState(window);
            if (state == AudioState.Joined) return Changed(false);
            var buttons = ToolbarButtons(window);
            if (buttons.Count == 0) throw new ZoomActionError("join-audio-button-not-found");
            var nameBefore = FirstSegment(buttons[0].Name);
            Press(buttons[0]);
            // Whichever comes first: Zoom's join-audio dialog, or (not knowing
            // which button that was) the button changing its name.
            El dialog = null;
            var renamed = false;
            WaitUntil(() =>
            {
                var dialogs = TopWindows(JoinAudioDialogClass, true);
                if (dialogs.Count > 0)
                {
                    dialog = Uia.FromHandle(dialogs[0]);
                    return true;
                }
                if (state != AudioState.Unknown) return false;
                var latest = ToolbarButtons(window);
                renamed = latest.Count > 0 && FirstSegment(latest[0].Name) != nameBefore;
                return renamed;
            }, 5000);
            if (dialog != null)
            {
                var button = MainActionButton(dialog);
                if (button == null) throw new ZoomActionError("join-audio-button-not-found");
                Press(button);
                Known.Learn("joinAudio", nameBefore);
            }
            else if (renamed)
            {
                // A two-state button: the microphone. Put it back.
                var latest = ToolbarButtons(window);
                if (latest.Count > 0) Press(latest[0]);
                WaitUntil(() =>
                {
                    var now = ToolbarButtons(window);
                    return now.Count > 0 && FirstSegment(now[0].Name) == nameBefore;
                }, 4000);
                return new Dictionary<string, object> { { "audioStateUnknown", true }, { "changed", false } };
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
            // The first button now reads "Join audio", worth remembering.
            var after = ToolbarButtons(window);
            if (after.Count > 0 && GetAudioState(window) == AudioState.Unknown) Known.Learn("joinAudio", FirstSegment(after[0].Name));
            return Changed(true);
        }

        /// <summary>Puts a two-state toolbar button (the microphone or the camera)
        /// in the state named `on ? onTitle : offTitle`, telling its states
        /// apart by the names captured in M³'s settings. `what` ("mic",
        /// "video") starts the error names.</summary>
        static Dictionary<string, object> SetButtonState(Func<El> find, string what, bool on, string onTitle, string offTitle)
        {
            var button = find();
            if (button == null) throw new ZoomActionError(what + "-button-not-found");
            var current = FirstSegment(button.Name);
            onTitle = FirstSegment(onTitle);
            offTitle = FirstSegment(offTitle);
            if (onTitle.Length == 0 || offTitle.Length == 0) throw new ZoomActionError(what + "-titles-not-captured");
            if (current != onTitle && current != offTitle) throw new ZoomActionError(what + "-title-unrecognized:" + current);
            if ((current == onTitle) == on) return Changed(false);
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
            return SetButtonState(() => VideoButton(window), "video", on, onTitle, offTitle);
        }

        /// <summary>Unmutes or mutes the host's microphone, which only exists
        /// once joined to computer audio.</summary>
        public static Dictionary<string, object> SetMic(bool on, string onTitle, string offTitle)
        {
            var window = RequireMeetingWindow();
            if (!AudioJoined(window)) throw new ZoomActionError("audio-not-joined");
            return SetButtonState(() => MicButton(window), "mic", on, onTitle, offTitle);
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

        /// <summary>Where the participants panel is: in the meeting window, or
        /// in a window of its own once the host popped it out (Zoom's "Open
        /// in new window"). That window is titled like the panel's heading
        /// ("Participants (15)") and holds the same list and buttons.</summary>
        static El PanelHost(El window)
        {
            foreach (var handle in TopWindows(PoppedOutPanelClass, true))
            {
                try
                {
                    var popped = Uia.FromHandle(handle);
                    if (CountedTitle.IsMatch(popped.Name) && Uia.Descendants(popped, Uia.ListType).Count > 0) return popped;
                }
                catch (Exception) { } // the window went away
            }
            return window;
        }

        /// <summary>The participants panel's heading ("Participants (3)"): the
        /// text with a count in brackets that isn't part of a list (waiting
        /// room section headers are), or the title of the panel's own window
        /// once popped out. Null while the panel is closed.</summary>
        static El ParticipantsHeading(El window)
        {
            var host = PanelHost(window);
            if (host != window) return host;
            var lists = Uia.Descendants(window, Uia.ListType);
            foreach (var text in Uia.Descendants(window, Uia.TextType))
            {
                if (!CountedTitle.IsMatch(text.Name)) continue;
                var inList = false;
                foreach (var list in lists) if (Contains(list.Rect, text)) inList = true;
                if (!inList) return text;
            }
            return null;
        }

        /// <summary>The participants list: the first list under the panel's
        /// heading (the chat panel, which also holds a list, opens below it),
        /// or the popped-out panel's list. Null while the panel is
        /// closed.</summary>
        static El ParticipantsList(El window)
        {
            var host = PanelHost(window);
            var lists = Uia.Descendants(host, Uia.ListType);
            if (lists.Count == 0) return null;
            if (host != window) return lists[0];
            var heading = ParticipantsHeading(window);
            if (heading == null) return lists[0];
            lists.Sort((a, b) => a.Rect.top.CompareTo(b.Rect.top));
            foreach (var list in lists)
                if (list.Rect.top >= heading.Rect.top && list.Rect.right > heading.Rect.left && list.Rect.left < heading.Rect.right) return list;
            return lists[0];
        }

        static bool ParticipantsPanelOpen(El window)
        {
            return ParticipantsHeading(window) != null || MuteAllButton(window) != null;
        }

        /// <summary>The "Mute all" button at the bottom of the participants
        /// panel, which only the host and co-hosts have: by its learned name,
        /// else by Zoom's Alt+M shortcut, else by its place, [Invite] [Mute
        /// all] [More, a split button] under the participants list.</summary>
        static El MuteAllButton(El window)
        {
            var buttons = Uia.Descendants(PanelHost(window), Uia.ButtonType);
            var known = ByName(buttons, Known.MuteAll);
            if (known != null) return known;
            El found = null;
            foreach (var button in buttons)
                if (HasHotkey(button.Name, HotkeyMuteAll)) found = button;
            if (found == null) found = MuteAllByLayout(window, buttons);
            if (found != null) Known.Learn("muteAll", FirstSegment(found.Name));
            return found;
        }

        /// <summary>The plain buttons in the row under the participants list
        /// ([Invite] [Mute all], for the host), left to right.</summary>
        static List<El> PanelRowButtons(El window)
        {
            var row = new List<El>();
            var list = ParticipantsList(window);
            if (list == null) return row;
            foreach (var button in Named(Uia.Descendants(PanelHost(window), Uia.ButtonType)))
                if (button.Rect.top >= list.Rect.bottom - RowTolerance && button.Rect.right > list.Rect.left && button.Rect.left < list.Rect.right) row.Add(button);
            row.Sort((a, b) => a.Rect.left.CompareTo(b.Rect.left));
            return row;
        }

        /// <summary>The buttons under the participants list, for the user to
        /// pick which one mutes everyone when M3 can't tell.</summary>
        public static Dictionary<string, object> PanelEntries()
        {
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            var entries = new List<object>();
            foreach (var button in PanelRowButtons(window))
            {
                var name = FirstSegment(button.Name);
                if (name.Length > 0 && !entries.Contains(name)) entries.Add(name);
            }
            return new Dictionary<string, object> { { "entries", entries } };
        }

        /// <summary>Presses the panel button the user picked as "Mute all":
        /// it's the one if Zoom asks to confirm muting everyone (a dialog of
        /// its own class, in every language), which is answered No, and is
        /// then remembered. Otherwise whatever it opened is dismissed.</summary>
        public static Dictionary<string, object> TestMuteAllEntry(string title)
        {
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            var button = ByName(PanelRowButtons(window), FirstSegment(title ?? ""));
            if (button == null) throw new ZoomActionError("mute-all-entry-not-found");
            var before = ZoomWindows();
            Press(button);
            var dialog = WaitForWindow(MuteAllDialogClass, 4000);
            if (dialog == null)
            {
                return new Dictionary<string, object> { { "isMuteAll", false }, { "windowsLeft", DismissNewWindows(before) } };
            }
            var buttons = ActionRowButtons(dialog);
            if (buttons.Count > 0) Press(buttons[buttons.Count - 1]); // No, to the right of Yes
            if (!WaitUntil(() => TopWindows(MuteAllDialogClass, true).Count == 0, 4000))
                CloseWithEscape(dialog.Raw.CurrentNativeWindowHandle);
            Known.Learn("muteAll", FirstSegment(button.Name));
            return new Dictionary<string, object> { { "isMuteAll", true } };
        }

        static El MuteAllByLayout(El window, List<El> buttons)
        {
            var more = PanelMoreButton(window);
            if (more == null) return null;
            El nearest = null;
            foreach (var button in buttons)
            {
                if (Math.Abs(button.Rect.top - more.Rect.top) > RowTolerance || button.Rect.left >= more.Rect.left) continue;
                if (nearest == null || button.Rect.left > nearest.Rect.left) nearest = button;
            }
            return nearest;
        }

        /// <summary>The participants panel's own "More" button (host only):
        /// the split button in the row under the participants list; the ones
        /// in the rows belong to participants.</summary>
        static El PanelMoreButton(El window)
        {
            var list = ParticipantsList(window);
            if (list == null) return null;
            foreach (var split in Uia.Descendants(PanelHost(window), Uia.SplitButtonType))
                if (split.Rect.top >= list.Rect.bottom - RowTolerance && split.Rect.right > list.Rect.left && split.Rect.left < list.Rect.right) return split;
            return null;
        }

        /// <summary>Presses the toolbar's Participants button: known by its
        /// learned name or Zoom's Alt+U shortcut, in the toolbar or in "More"
        /// (which opens the panel straight away). False if it's nowhere to
        /// be found.</summary>
        static bool PressParticipantsButton(El window)
        {
            var buttons = ToolbarButtons(window);
            El button = null;
            foreach (var candidate in buttons)
                if (HasHotkey(candidate.Name, HotkeyParticipants)) button = candidate;
            if (button == null) button = ByName(buttons, Known.Participants);
            if (button != null)
            {
                Known.Learn("participants", FirstSegment(button.Name));
                Press(button);
                return true;
            }
            if (string.IsNullOrEmpty(Known.Participants)) return false;
            var grid = OpenMoreGrid(window);
            if (grid == null) return false;
            El entry;
            if (GridEntries(grid).TryGetValue(Known.Participants, out entry))
            {
                Press(entry);
                return true;
            }
            CloseAll(MoreGridClass);
            return false;
        }

        /// <summary>Remembers what the open participants panel shows: its
        /// title (the Participants button's name, wherever Zoom keeps the
        /// button) and the "Mute all" button's name.</summary>
        static void LearnParticipantsNames(El window)
        {
            var heading = ParticipantsHeading(window);
            if (heading != null) Known.Learn("participants", CountedTitle.Match(heading.Name).Groups[1].Value.Trim());
            MuteAllButton(window);
        }

        /// <summary>Opens the participants panel, through its button (see
        /// PressParticipantsButton) or else Zoom's Alt+U. When neither works,
        /// M3 asks the user which entry it is (participants-button-not-found),
        /// as it does for Share; a button that was found but opened no panel
        /// is participants-panel-not-opened.</summary>
        static void OpenParticipantsPanel(El window)
        {
            if (!ParticipantsPanelOpen(window))
            {
                var pressed = PressParticipantsButton(window);
                if (!pressed)
                {
                    Focus(window);
                    AltKey('U');
                }
                if (!WaitUntil(() => ParticipantsPanelOpen(window), 5000))
                    throw new ZoomActionError(pressed ? "participants-panel-not-opened" : "participants-button-not-found");
            }
            LearnParticipantsNames(window);
        }

        public static Dictionary<string, object> MuteAll(bool allowSelfUnmute)
        {
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            var button = MuteAllButton(window);
            if (button == null) throw new ZoomActionError("mute-all-button-not-found");
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
            var more = PanelMoreButton(window);
            if (more == null) throw new ZoomActionError("participants-more-button-not-found");
            var menu = OpenMenuFrom(more, 4000);
            if (menu == null) throw new ZoomActionError("participants-menu-not-found");
            // "Ask all to unmute" heads the menu's first group, joined by
            // "Clear all feedback" while anyone has a reaction or hand up.
            // Where it isn't offered, the first group holds on/off options
            // (which support the Toggle pattern) that must not be toggled by
            // mistake.
            var groups = MenuGroups(menu);
            var first = groups.Count == 0 ? null : groups[0];
            if (first == null || first.Count < 1 || first.Count > 2 || IsToggleItem(first[0]))
            {
                CloseAll(MenuClass);
                throw new ZoomActionError("ask-to-unmute-item-not-found");
            }
            Press(first[0]);
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
            var list = ParticipantsList(window);
            if (list == null) return result;
            var rows = Uia.Descendants(list, Uia.ListItemType);
            var headers = new List<int>();
            for (int i = 0; i < rows.Count; i++)
                if (SectionHeader.IsMatch(SplitSegments(rows[i].Name)[0])) headers.Add(i);
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

        /// <summary>Admits a waiting participant without the mouse: selecting
        /// their row gives it the keyboard focus (Zoom comes forward), and
        /// Space then admits them, as the row's name says ("..., press Space
        /// to admit"). The key is only pressed once the row surely has the
        /// focus, so it can't reach anything else. False if it wasn't
        /// pressed.</summary>
        static bool AdmitByKeyboard(El panel, Row row)
        {
            if (!TrySelect(row.Element)) return false;
            if (!WaitUntil(() => HasKeyboardFocus(row.Element), 1000))
            {
                // Zoom didn't come forward by itself.
                Focus(panel);
                if (!HasKeyboardFocus(row.Element)) return false;
            }
            TapKey(Native.VkSpace);
            return true;
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
            var panel = PanelHost(window);
            var handle = panel.Raw.CurrentNativeWindowHandle;
            foreach (var name in waiting)
            {
                var current = name;
                var row = WaitingRow(window, current);
                if (row == null) continue;
                // Zoom only paints the Admit button while the row is hovered;
                // some versions expose it all the time (no mouse needed). Zoom
                // 7 doesn't, but takes Space on the row (see AdmitByKeyboard).
                // Only if neither works is the row really hovered.
                var unhovered = Named(Uia.Descendants(row.Element, Uia.ButtonType));
                var pressed = unhovered.Count > 0 && TryInvoke(unhovered[0]);
                if (!pressed && AdmitByKeyboard(panel, row))
                    pressed = WaitUntil(() => WaitingRow(window, current) == null, 3000);
                if (!pressed)
                {
                    Focus(panel);
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
                    pressed = ShowsAt(handle, row.Element.CenterX, row.Element.CenterY)
                        ? pressAdmit()
                        : Lifted(handle, pressAdmit);
                }
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
            foreach (var piece in SplitSegments(details))
            {
                var trimmed = piece.Trim();
                if (trimmed.Length > 0) result.Add(trimmed);
            }
            return result;
        }

        /// <summary>The one row of a person in the meeting. Two people with the
        /// same name can't be told apart, so neither is acted on.</summary>
        static Row UniqueMeetingRow(El window, string name)
        {
            Row found = null;
            foreach (var row in ParticipantRows(window))
            {
                if (row.Section != "meeting" || row.Name != name) continue;
                if (found != null) throw new ZoomActionError("participant-name-ambiguous");
                found = row;
            }
            return found;
        }

        static bool Contains(tagRECT outer, El inner)
        {
            return inner.Rect.left >= outer.left && inner.Rect.right <= outer.right
                && inner.Rect.top >= outer.top && inner.Rect.bottom <= outer.bottom;
        }

        /// <summary>A participant row's buttons (the microphone one first,
        /// "More" last), checked to belong to that very row: found by name and
        /// inside its rectangle. Zoom only paints them while the row is
        /// hovered, but exposes them (and their Invoke) all the time. Null if
        /// the row is gone or has no buttons.</summary>
        static List<El> HoveredRowButtons(El window, string name)
        {
            var hovered = UniqueMeetingRow(window, name);
            if (hovered == null) return null;
            var buttons = new List<El>();
            foreach (var button in Named(Uia.Descendants(hovered.Element, Uia.ButtonType)))
                if (Contains(hovered.Element.Rect, button)) buttons.Add(button);
            foreach (var button in Named(Uia.Descendants(hovered.Element, Uia.SplitButtonType)))
                if (Contains(hovered.Element.Rect, button)) buttons.Add(button);
            if (buttons.Count == 0) return null;
            buttons.Sort((a, b) => a.Rect.left.CompareTo(b.Rect.left));
            return buttons;
        }

        /// <summary>Runs an action on a row's buttons. They're read without
        /// moving the mouse; only a row that exposes none is hovered for real
        /// (lifting the window above always-on-top ones if needed, see Admit),
        /// which `hovered` reports.</summary>
        static T WithRowButtons<T>(El window, Row row, string name, Func<List<El>, T> action, T notFound, out bool hovered)
        {
            hovered = false;
            var buttons = HoveredRowButtons(window, name);
            if (buttons != null) return action(buttons);

            hovered = true;
            var panel = PanelHost(window);
            var handle = panel.Raw.CurrentNativeWindowHandle;
            Focus(panel);
            Func<T> run = () =>
            {
                Hover(row.Element);
                Thread.Sleep(500);
                var found = HoveredRowButtons(window, name);
                return found == null ? notFound : action(found);
            };
            return ShowsAt(handle, row.Element.CenterX, row.Element.CenterY) ? run() : Lifted(handle, run);
        }

        static T WithRowButtons<T>(El window, Row row, string name, Func<List<El>, T> action, T notFound)
        {
            bool hovered;
            return WithRowButtons(window, row, name, action, notFound, out hovered);
        }

        /// <summary>Opens a row's "More" menu (its last button) and returns the
        /// menu, or null.</summary>
        static El OpenRowMenu(El window, Row row, string name)
        {
            El menu = null;
            var opened = WithRowButtons(window, row, name, buttons =>
            {
                if (buttons.Count < 2) return false;
                menu = OpenMenuFrom(buttons[buttons.Count - 1], 4000);
                return true;
            }, false);
            return opened ? menu : null;
        }

        /// <summary>A participant row's hover buttons, told apart by name first:
        /// the host's own Mute/Unmute button names (learned by the setup
        /// assistant), the "Lower hand" and "Ask to unmute" names (learned
        /// from the first rows M3 acts on). Only a button nobody could name
        /// falls back to Zoom's layout, [Lower hand, only while the hand is up]
        /// [microphone] [video, when any] [More, a split button], which also
        /// teaches the names; a stale learned name is then replaced rather
        /// than refused. A row that fits neither is left alone.</summary>
        sealed class RowLayout
        {
            public string AskToUnmuteTitle;
            public El LowerHand;
            public string LowerHandTitle;
            public El Mic;
            public bool Unmuted;
        }

        static El ByName(List<El> buttons, string title)
        {
            if (string.IsNullOrEmpty(title)) return null;
            foreach (var button in buttons)
                if (FirstSegment(button.Name) == title) return button;
            return null;
        }

        static RowLayout ReadRowLayout(List<El> buttons, string micOnTitle, string micOffTitle, string lowerHandTitle, string askToUnmuteTitle, bool handRaised)
        {
            var plain = new List<El>();
            foreach (var button in buttons)
                if (button.ControlType != Uia.SplitButtonType) plain.Add(button); // "More" is the split button
            var layout = new RowLayout();

            // By name.
            layout.LowerHand = ByName(plain, lowerHandTitle);
            layout.Mic = ByName(plain, micOnTitle);
            if (layout.Mic != null) layout.Unmuted = true;
            if (layout.Mic == null) layout.Mic = ByName(plain, micOffTitle);
            if (layout.Mic == null) layout.Mic = ByName(plain, askToUnmuteTitle);

            // By place, for what no name could tell.
            if (handRaised && layout.LowerHand == null)
            {
                // [Lower hand] [microphone] [video?]: two or three buttons,
                // the first of which is no microphone button.
                if (plain.Count < 2 || plain.Count > 3) return null;
                if (layout.Mic == plain[0]) return null;
                layout.LowerHand = plain[0];
                layout.LowerHandTitle = FirstSegment(plain[0].Name);
            }
            if (layout.Mic == null)
            {
                var rest = new List<El>();
                foreach (var button in plain) if (button != layout.LowerHand) rest.Add(button);
                // [microphone] [video?]: one or two buttons.
                if (rest.Count < 1 || rest.Count > 2) return null;
                layout.Mic = rest[0];
                var micTitle = FirstSegment(layout.Mic.Name);
                // Not Mute, not Unmute: "Ask to unmute", worth remembering.
                if (micTitle != micOnTitle && micTitle != micOffTitle) layout.AskToUnmuteTitle = micTitle;
            }
            if (layout.LowerHand == layout.Mic) return null;
            return layout;
        }

        static List<string> MenuItemNames(El menu)
        {
            var names = new List<string>();
            foreach (var item in MenuItems(menu)) names.Add(FirstSegment(item.Name));
            return names;
        }

        static void CloseMenu()
        {
            CloseAll(MenuClass);
        }

        // --- The host's own hand ----------------------------------------------------

        static bool IsOtherButton(El button)
        {
            foreach (var hotkey in OtherButtonHotkeys)
                if (HasHotkey(button.Name, hotkey)) return true;
            return false;
        }

        /// <summary>The toolbar's Reactions button, known by its shortcut
        /// (Ctrl+Shift+Y) or else by its name, learned earlier or picked by
        /// the user (never one of the OtherButtonHotkeys buttons). Null while
        /// Zoom keeps it in its "More" menu, as it does once the toolbar runs
        /// out of room (the participants panel narrows it).</summary>
        static El ReactButton(El window, string reactTitle)
        {
            var buttons = ToolbarButtons(window);
            foreach (var button in buttons)
                if (ReactHotkey.IsMatch(button.Name)) return button;
            buttons.RemoveAll(IsOtherButton);
            return ByName(buttons, reactTitle);
        }

        /// <summary>Opens Zoom's Reactions panel, the way sharing opens its
        /// picker: through the toolbar's Reactions button, else its entry in
        /// "More" (found by its name). From "More", Zoom only moves the button
        /// onto the toolbar, so it's then pressed there. `learnedTitle` is the
        /// button's name. When the button can't be found, or a button found by
        /// name opens no Reactions panel, M³ asks the user which entry it is
        /// (react-button-not-found), as it does for Share.</summary>
        static El OpenReactionPanel(El window, string reactTitle, out string learnedTitle)
        {
            learnedTitle = reactTitle;
            var open = TopWindows(ReactionPanelClass, true);
            if (open.Count > 0) return Uia.FromHandle(open[0]);
            var before = ZoomWindows();
            var button = ReactButton(window, reactTitle);
            if (button == null && !string.IsNullOrEmpty(reactTitle))
            {
                var grid = OpenMoreGrid(window);
                if (grid != null)
                {
                    El entry;
                    GridEntries(grid).TryGetValue(reactTitle, out entry);
                    if (entry == null)
                    {
                        CloseAll(MoreGridClass);
                    }
                    else
                    {
                        Press(entry);
                        var panel = WaitForWindow(ReactionPanelClass, 1500);
                        if (panel != null) return panel;
                        if (TopWindows(SharePickerClass, true).Count > 0) throw NotReactButton(before);
                        button = WaitFor(() => ReactButton(window, reactTitle), found => found != null, 3000);
                    }
                }
            }
            if (button == null) throw new ZoomActionError("react-button-not-found");
            learnedTitle = FirstSegment(button.Name);
            // Invoke first (no mouse); a real click if Zoom takes the Invoke
            // but shows nothing, as it sometimes does. The button toggles the
            // panel, so a click that follows a slow Invoke can close what had
            // just opened: in that case, one more press.
            if (TryInvoke(button))
            {
                var panel = WaitForWindow(ReactionPanelClass, 3000);
                if (panel != null) return panel;
            }
            Click(ReactButton(window, learnedTitle) ?? button);
            var opened = WaitForWindow(ReactionPanelClass, 4000);
            if (opened == null)
            {
                var again = ReactButton(window, learnedTitle) ?? button;
                Press(again);
                opened = WaitForWindow(ReactionPanelClass, 3000);
            }
            if (opened != null) return opened;
            // Only a button known by its shortcut is surely the Reactions one.
            if (!ReactHotkey.IsMatch(button.Name)) throw NotReactButton(before);
            throw new ZoomActionError("reaction-panel-not-found");
        }

        /// <summary>Gives up on an entry that turned out not to be React,
        /// closing whatever it opened instead (Zoom's share window, say).</summary>
        static ZoomActionError NotReactButton(Dictionary<IntPtr, string> before)
        {
            var pickers = TopWindows(SharePickerClass, true);
            if (pickers.Count > 0) CloseSharePicker(Uia.FromHandle(pickers[0]));
            DismissNewWindows(before);
            return new ZoomActionError("react-button-not-found");
        }

        /// <summary>The Reactions panel's "Raise hand" button ("Lower hand"
        /// while the hand is up): the topmost of the buttons spanning the
        /// panel. The one under it, "Be right back", turns off the host's
        /// audio and video, so only the topmost is ever taken.</summary>
        static El HandButton(El panel)
        {
            var area = panel.Raw.CurrentBoundingRectangle;
            var width = area.right - area.left;
            if (width < 100) return null; // still opening
            El hand = null;
            foreach (var button in Uia.Descendants(panel, Uia.ButtonType))
            {
                if (button.Rect.right - button.Rect.left < width * 0.6) continue;
                if (hand == null || button.Rect.top < hand.Rect.top) hand = button;
            }
            return hand;
        }

        static void CloseReactionPanel(El panel)
        {
            // Zoom usually closes it once a button in it is pressed.
            if (WaitUntil(() => TopWindows(ReactionPanelClass, true).Count == 0, 600)) return;
            CloseWithEscape(panel.Raw.CurrentNativeWindowHandle);
        }

        /// <summary>Presses the Reactions panel's hand button and returns its
        /// name, unless it's still named `notTitle` (what it said before the
        /// hand went up: a button that didn't turn into "Lower hand" is no
        /// hand button).</summary>
        static string PressHandButton(El window, string reactTitle, string notTitle, out string learnedReactTitle)
        {
            var panel = OpenReactionPanel(window, reactTitle, out learnedReactTitle);
            var hand = WaitFor(() => HandButton(panel), found => found != null, 2000);
            var title = hand == null ? null : FirstSegment(hand.Name);
            if (hand == null || title == notTitle)
            {
                CloseReactionPanel(panel);
                throw new ZoomActionError("hand-button-not-found");
            }
            Press(hand);
            CloseReactionPanel(panel);
            return title;
        }

        /// <summary>Learns how Zoom marks a raised hand in the user's language:
        /// raises the host's own hand from the Reactions panel, reads what
        /// Zoom added to the host's row in the participants list, then lowers
        /// it again and makes sure the words went away.</summary>
        public static Dictionary<string, object> LearnHandRaised(string reactTitle)
        {
            var window = RequireMeetingWindow();
            // Looked for before the participants panel narrows the toolbar.
            var react = ReactButton(window, reactTitle);
            if (react != null) reactTitle = FirstSegment(react.Name);
            OpenParticipantsPanel(window);
            var before = MeetingRowDetails(window);
            if (before.Count == 0) throw new ZoomActionError("participants-not-found");
            string learnedReactTitle;
            var raiseTitle = PressHandButton(window, reactTitle, null, out learnedReactTitle);
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

            string ignored;
            PressHandButton(window, learnedReactTitle, raiseTitle, out ignored);
            var lowered = WaitUntil(() =>
            {
                string now;
                return MeetingRowDetails(window).TryGetValue(name, out now) && !Segments(now).Contains(phrase);
            }, 5000);
            if (!lowered) throw new ZoomActionError("hand-not-lowered");

            // The "Lower hand" button of other people's rows (the host's own
            // row names its hand button differently) is learned from the first
            // raised hand M3 acts on.
            return new Dictionary<string, object> { { "phrase", phrase }, { "reactButtonTitle", learnedReactTitle } };
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

        /// <summary>Mutes (on = false) or unmutes (on = true) one participant
        /// through the microphone button of their row, found by name (see
        /// FindMicButton) and pressed only when it would go the wanted way.
        /// Nothing is pressed when the name is missing or shared by two people,
        /// or when the microphone button can't be told apart for sure.</summary>
        public static Dictionary<string, object> SetParticipantMic(string name, bool on, string micOnTitle, string micOffTitle, string lowerHandTitle, string askToUnmuteTitle, string phrase)
        {
            if (string.IsNullOrEmpty(name)) throw new ZoomActionError("participant-name-missing");
            if (string.IsNullOrEmpty(micOnTitle)) throw new ZoomActionError("mic-titles-not-captured");
            var muteTitle = FirstSegment(micOnTitle);
            var unmuteTitle = FirstSegment(micOffTitle ?? "");
            var lowerTitle = FirstSegment(lowerHandTitle ?? "");
            var askTitle = FirstSegment(askToUnmuteTitle ?? "");
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            var row = UniqueMeetingRow(window, name);
            if (row == null) throw new ZoomActionError("participant-not-found");
            var before = row.Details;
            string buttonTitle = null;
            string learnedLowerHandTitle = null;
            string learnedAskToUnmuteTitle = null;
            var found = false;
            bool hovered;
            var handRaised = !string.IsNullOrEmpty(phrase) && Segments(row.Details).Contains(phrase);
            var pressed = WithRowButtons(window, row, name, buttons =>
            {
                var layout = ReadRowLayout(buttons, muteTitle, unmuteTitle, lowerTitle, askTitle, handRaised);
                if (layout == null) return false;
                found = true;
                buttonTitle = FirstSegment(layout.Mic.Name);
                learnedLowerHandTitle = layout.LowerHandTitle;
                learnedAskToUnmuteTitle = layout.AskToUnmuteTitle;
                if (layout.Unmuted == on) return false; // already as wanted
                Press(layout.Mic);
                return true;
            }, false, out hovered);
            if (!found) throw new ZoomActionError("participant-mic-button-not-found");
            // Muting changes the row at once; asking someone to unmute only
            // sends them a request, so the row may well stay as it was.
            var changed = pressed && WaitUntil(() =>
            {
                Row latest = null;
                try { latest = UniqueMeetingRow(window, name); } catch (ZoomActionError) { }
                return latest != null && latest.Details != before;
            }, 3000);
            return new Dictionary<string, object>
            {
                { "askToUnmuteTitle", learnedAskToUnmuteTitle },
                { "buttonTitle", buttonTitle },
                { "changed", changed },
                { "hovered", hovered },
                { "lowerHandTitle", learnedLowerHandTitle },
                { "pressed", pressed },
            };
        }

        /// <summary>Lowers one participant's hand through the "Lower hand" button
        /// their row shows first while hovered and the hand is up (see
        /// ReadRowLayout). No other button is ever pressed; nothing happens
        /// when the hand isn't up.</summary>
        public static Dictionary<string, object> LowerParticipantHand(string name, string lowerHandTitle, string phrase, string micOnTitle, string micOffTitle, string askToUnmuteTitle)
        {
            if (string.IsNullOrEmpty(name)) throw new ZoomActionError("participant-name-missing");
            if (string.IsNullOrEmpty(phrase)) throw new ZoomActionError("hand-phrase-not-learned");
            var lowerTitle = FirstSegment(lowerHandTitle ?? "");
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            var row = UniqueMeetingRow(window, name);
            if (row == null) throw new ZoomActionError("participant-not-found");
            if (!Segments(row.Details).Contains(phrase)) return Changed(false);
            string learnedLowerHandTitle = null;
            bool hovered;
            var pressed = WithRowButtons(window, row, name, buttons =>
            {
                var layout = ReadRowLayout(buttons, FirstSegment(micOnTitle ?? ""), FirstSegment(micOffTitle ?? ""), lowerTitle, FirstSegment(askToUnmuteTitle ?? ""), true);
                if (layout == null || layout.LowerHand == null) return false;
                learnedLowerHandTitle = layout.LowerHandTitle;
                Press(layout.LowerHand);
                return true;
            }, false, out hovered);
            if (!pressed) throw new ZoomActionError("lower-hand-item-not-found");
            var lowered = WaitUntil(() =>
            {
                Row latest = null;
                try { latest = UniqueMeetingRow(window, name); } catch (ZoomActionError) { }
                return latest != null && !Segments(latest.Details).Contains(phrase);
            }, 4000);
            if (!lowered) throw new ZoomActionError("hand-not-lowered");
            return new Dictionary<string, object> { { "changed", true }, { "hovered", hovered }, { "lowerHandTitle", learnedLowerHandTitle } };
        }

        /// <summary>Diagnostics: everything a participant's row shows, hovered
        /// (every control's type, name and position) and the entries of its
        /// "More" menu, which is closed again. Presses nothing else.</summary>
        public static Dictionary<string, object> InspectParticipant(string name)
        {
            if (string.IsNullOrEmpty(name)) throw new ZoomActionError("participant-name-missing");
            var window = RequireMeetingWindow();
            OpenParticipantsPanel(window);
            var row = UniqueMeetingRow(window, name);
            if (row == null) throw new ZoomActionError("participant-not-found");
            var controls = new List<object>();
            var hovered = WithRowButtons(window, row, name, buttons =>
            {
                var latest = UniqueMeetingRow(window, name);
                if (latest == null) return false;
                foreach (var control in Uia.Descendants(latest.Element))
                {
                    controls.Add(new Dictionary<string, object>
                    {
                        { "inRow", Contains(latest.Element.Rect, control) },
                        { "left", control.Rect.left },
                        { "name", control.Name },
                        { "top", control.Rect.top },
                        { "type", control.ControlType },
                    });
                }
                return true;
            }, false);
            var menuItems = new List<object>();
            string menuError = null;
            try
            {
                var again = UniqueMeetingRow(window, name);
                var menu = again == null ? null : OpenRowMenu(window, again, name);
                if (menu == null) menuError = "menu-not-opened";
                else
                {
                    foreach (var item in Uia.Descendants(menu, Uia.MenuItemType))
                        menuItems.Add(new Dictionary<string, object> { { "name", item.Name }, { "type", item.ControlType } });
                    CloseMenu();
                }
            }
            catch (ZoomActionError error) { menuError = error.Message; }
            return new Dictionary<string, object>
            {
                { "controls", controls },
                { "details", row.Details },
                { "hovered", hovered },
                { "menuError", menuError },
                { "menuItems", menuItems },
                { "rowRect", new Dictionary<string, object> { { "bottom", row.Element.Rect.bottom }, { "left", row.Element.Rect.left }, { "right", row.Element.Rect.right }, { "top", row.Element.Rect.top } } },
            };
        }

        // --- Screen sharing -----------------------------------------------------------

        static string GridEntryName(El item)
        {
            var match = GridPositionSuffix.Match(item.Name);
            return match.Success ? match.Groups[1].Value.Trim() : FirstSegment(item.Name);
        }

        // A word with a digit in it: "1", "1/12", Korean "1행", Japanese "行1".
        static readonly Regex NumberToken = new Regex(@"\d");

        /// <summary>The "More" menu's entries by their titles. Zoom appends
        /// each entry's place to its name in the user's language and word
        /// order: "Partager ligne 1, colonne 1 1 sur 12 épinglé" (French),
        /// "공유 1행, 1열 1/12 고정됨" (Korean). The title is what comes
        /// before the first number, less any word every entry has there
        /// (French "ligne"), which belongs to the place, not the title.</summary>
        static Dictionary<string, El> GridEntries(El grid)
        {
            var items = Uia.Descendants(grid, Uia.TabItemType);
            var heads = new List<List<string>>();
            foreach (var item in items)
            {
                var head = new List<string>();
                foreach (var word in Regex.Split(item.Name, @"[\s,，、]+"))
                {
                    if (word.Length == 0) continue;
                    if (NumberToken.IsMatch(word)) break;
                    head.Add(word);
                }
                heads.Add(head);
            }
            // A last word shared by every entry (and never the whole title)
            // is the row word.
            string shared = null;
            foreach (var head in heads)
            {
                if (head.Count < 2) { shared = null; break; }
                var last = head[head.Count - 1];
                if (shared == null) shared = last;
                else if (shared != last) { shared = null; break; }
            }
            var entries = new Dictionary<string, El>();
            for (int i = 0; i < items.Count; i++)
            {
                var head = heads[i];
                if (shared != null) head.RemoveAt(head.Count - 1);
                var title = head.Count > 0 ? string.Join(" ", head.ToArray()) : GridEntryName(items[i]);
                if (!entries.ContainsKey(title)) entries[title] = items[i];
            }
            return entries;
        }

        static El OpenMoreGrid(El window)
        {
            var menus = ToolbarMenus(window);
            if (menus.Count == 0) return null;
            // "More" is the toolbar's last menu; it opens a grid, not a menu.
            // Invoke first (no mouse); a real click if Zoom shows nothing.
            var moreButton = menus[menus.Count - 1];
            if (TryInvoke(moreButton))
            {
                var grid = WaitForWindow(MoreGridClass, 1500);
                if (grid != null) return grid;
            }
            Click(moreButton);
            return WaitForWindow(MoreGridClass, 4000);
        }

        /// <summary>Toolbar buttons and "More" menu entries, for the user to pick
        /// which one is Share, or React (their names depend on their Zoom
        /// language). They are kept apart because "More" entries don't show
        /// their shortcuts, so dangerous ones like Record can't be left out
        /// there.</summary>
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
                if (IsOtherButton(toolbar[i])) continue;
                var name = FirstSegment(toolbar[i].Name);
                if (name.Length > 0 && !entries.Contains(name)) entries.Add(name);
            }
            var grid = OpenMoreGrid(window);
            if (grid != null)
            {
                foreach (var name in GridEntries(grid).Keys)
                    if (name.Length > 0 && !entries.Contains(name) && !moreEntries.Contains(name)) moreEntries.Add(name);
                CloseAll(MoreGridClass);
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
                    Press(button);
                    return;
                }
            }
            var grid = OpenMoreGrid(window);
            if (grid != null)
            {
                El entry;
                if (GridEntries(grid).TryGetValue(wanted, out entry))
                {
                    Press(entry);
                    return;
                }
                CloseAll(MoreGridClass);
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

        /// <summary>Whether a share picker entry stands for the window: its
        /// name contains the window's title. Zoom adds the entry's place in
        /// its group to the name (", 7 of 10"), worded in the user's
        /// language, so nothing more exact can be relied on; M3's media
        /// window title is distinctive enough.</summary>
        static bool IsShareItemFor(El item, string windowTitle)
        {
            return (item.Name ?? "").Contains(windowTitle);
        }

        /// <summary>The picker's entry for the window: the shortest name
        /// containing its title (another window whose title contains it too
        /// would be longer). Should that still pick the wrong window,
        /// StartShare notices and stops the share.</summary>
        static El ShareItem(El picker, string windowTitle)
        {
            El found = null;
            foreach (var item in Uia.Descendants(picker, Uia.ListItemType))
                if (IsShareItemFor(item, windowTitle) && (found == null || item.Name.Length < found.Name.Length)) found = item;
            return found;
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
        /// clicked: through UI Automation where the entry supports it, else by
        /// sending the picker turns of the mouse wheel, and only if it ignores
        /// those, with the real wheel.</summary>
        static El ScrollShareItemIntoReach(El picker, string windowTitle)
        {
            var item = ShareItem(picker, windowTitle);
            for (int i = 0; i < 12 && item != null; i++)
            {
                if (IsClickable(item)) return item;
                if (TryScrollIntoView(item))
                {
                    Thread.Sleep(300);
                    item = ShareItem(picker, windowTitle);
                    if (item != null && IsClickable(item)) return item;
                    if (item == null) break;
                }
                var area = picker.Raw.CurrentBoundingRectangle;
                var middle = (area.top + area.bottom) / 2;
                var delta = item.CenterY > middle ? -Native.WheelDelta : Native.WheelDelta;
                var top = item.Rect.top;
                PostWheel(picker.Raw.CurrentNativeWindowHandle, item.CenterX, middle, delta);
                Thread.Sleep(300);
                item = ShareItem(picker, windowTitle);
                if (item == null || item.Rect.top != top) continue;
                MoveCursor(item.CenterX, middle);
                Thread.Sleep(50);
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
                    if (!IsShareItemFor(item, windowTitle)) return false;
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
                // Without the mouse: selecting the entry through UI Automation
                // where Zoom allows it, else sending the picker a click on it
                // (which Zoom takes); a real click for the last attempt.
                var last = attempt == 2;
                if (!TrySelect(item) && !TryInvoke(item) && (last || !TryPostClick(item))) Click(item);
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
            if (!CloseWithEscape(picker.Raw.CurrentNativeWindowHandle))
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
            // "Stop share" is known by its learned name, else as the last
            // share-toolbar button that shows a shortcut.
            var buttons = Uia.Descendants(Uia.FromHandle(toolbars[0]), Uia.ButtonType);
            var stop = ByName(buttons, Known.StopShare);
            if (stop == null)
            {
                foreach (var button in buttons)
                    if (TrailingHotkey.IsMatch(button.Name)) stop = button;
                if (stop != null) Known.Learn("stopShare", FirstSegment(stop.Name));
            }
            if (stop == null) throw new ZoomActionError("stop-share-button-not-found");
            // It turns Invoke down, but takes a click sent to it; a real
            // click if sharing goes on all the same.
            Press(stop);
            if (!WaitUntil(() => !IsSharing(), 2500) && IsSharing()) Click(stop);
            if (!WaitUntil(() => !IsSharing(), WaitTimeoutMs)) throw new ZoomActionError("share-not-stopped");
            return Changed(true);
        }

        static List<El> ShareToolbarButtons()
        {
            var toolbars = TopWindows(ShareToolbarClass, true);
            if (toolbars.Count == 0) throw new ZoomActionError("not-sharing");
            return Named(Uia.Descendants(Uia.FromHandle(toolbars[0]), Uia.ButtonType));
        }

        /// <summary>The share toolbar's buttons while sharing, for the user to
        /// pick which one stops sharing when M3 can't tell. Zoom exposes the
        /// toolbar's status texts as (invokable) buttons too, so they're
        /// listed as well; pressing one does no harm.</summary>
        public static Dictionary<string, object> ShareToolbarEntries()
        {
            var entries = new List<object>();
            foreach (var button in ShareToolbarButtons())
            {
                var name = FirstSegment(button.Name);
                if (name.Length > 0 && !entries.Contains(name)) entries.Add(name);
            }
            return new Dictionary<string, object> { { "entries", entries } };
        }

        /// <summary>Presses the share toolbar button the user picked as "Stop
        /// share": it's the one if sharing stops, and is then remembered.
        /// Otherwise whatever it opened is dismissed.</summary>
        public static Dictionary<string, object> TestStopShareEntry(string title)
        {
            var button = ByName(ShareToolbarButtons(), FirstSegment(title ?? ""));
            if (button == null) throw new ZoomActionError("stop-share-entry-not-found");
            var before = ZoomWindows();
            Press(button);
            var stopped = WaitUntil(() => !IsSharing(), 5000);
            if (stopped) Known.Learn("stopShare", FirstSegment(button.Name));
            return new Dictionary<string, object> { { "stopped", stopped }, { "windowsLeft", stopped ? new List<object>() : DismissNewWindows(before) } };
        }

        // --- Setup assistant -------------------------------------------------------------

        /// <summary>Whether everything the Zoom Meeting Manager relies on can be
        /// found in this Zoom, for the setup assistant to report.</summary>
        public static Dictionary<string, object> Diagnose()
        {
            var result = new Dictionary<string, object>();
            var window = FindMeetingWindow() ?? ExitMiniView();
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

            result["audioJoined"] = AudioJoined(window);
            var video = VideoButton(window);
            result["videoButton"] = video != null;
            result["videoTitle"] = video == null ? null : FirstSegment(video.Name);

            // Opening the panel also learns the names to open it by next time.
            try
            {
                OpenParticipantsPanel(window);
            }
            catch (ZoomActionError error)
            {
                // The user can then point M3 to the Participants button.
                result["participantsButtonMissing"] = error.Message == "participants-button-not-found";
            }
            result["participantsPanel"] = ParticipantsPanelOpen(window);
            // Only the host and co-hosts can mute everyone.
            result["hostControls"] = MuteAllButton(window) != null;
            // The user can then point M3 to the "Mute all" button, if any.
            result["muteAllButtonMissing"] = (bool)result["participantsPanel"] && !(bool)result["hostControls"];
            return result;
        }

        /// <summary>Switches a two-state toolbar button (the microphone or the
        /// camera) once and reports its name before and after, so the setup
        /// assistant can learn both names (they're only shown in the user's
        /// Zoom language).</summary>
        static Dictionary<string, object> ToggleButton(Func<El> find, string what)
        {
            var button = find();
            if (button == null) throw new ZoomActionError(what + "-button-not-found");
            var before = FirstSegment(button.Name);
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
            return ToggleButton(() => VideoButton(window), "video");
        }

        /// <summary>`assumeAudioJoined`: the user said computer audio is
        /// joined, where M3 can't tell (see JoinAudio).</summary>
        public static Dictionary<string, object> ToggleMic(bool assumeAudioJoined)
        {
            var window = RequireMeetingWindow();
            ControlPanel(window);
            if (assumeAudioJoined && GetAudioState(window) == AudioState.Unknown)
            {
                return ToggleButton(() =>
                {
                    var buttons = ToolbarButtons(window);
                    return buttons.Count > 0 ? buttons[0] : null;
                }, "mic");
            }
            if (!AudioJoined(window)) throw new ZoomActionError("audio-not-joined");
            return ToggleButton(() => MicButton(window), "mic");
        }

        /// <summary>Opens Zoom's share picker the way sharing would, checks that
        /// the window to share is offered and that sharing would select it,
        /// and closes it without sharing.</summary>
        public static Dictionary<string, object> TestSharePicker(string windowTitle, string shareTitle)
        {
            if (IsSharing()) throw new ZoomActionError("already-sharing");
            var window = RequireMeetingWindow();
            var before = ZoomWindows();
            El picker = null;
            try
            {
                OpenSharePicker(window, shareTitle);
                picker = WaitForWindow(SharePickerClass, 5000);
            }
            catch (ZoomActionError) { }
            if (picker == null)
            {
                // A wrong entry may have opened something else: close it.
                return new Dictionary<string, object> { { "opened", false }, { "windowListed", false }, { "windowsLeft", DismissNewWindows(before) } };
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

        // --- Window layout -------------------------------------------------------------
        //
        // M3 can put Zoom's meeting window, and its own, where the user chose in
        // the setup assistant, and keep Zoom there (src/helpers/zoom-layout.ts
        // decides when). Plain Win32 only: no UI Automation, and no focus or
        // input unless asked to snap with Windows. Rectangles are in physical
        // pixels (this process is per-monitor DPI aware) and stand for what's
        // visible of a window: Windows puts an invisible resize border around
        // most windows (7 pixels at 100 % scaling, left, right and bottom),
        // which placing a window allows for.

        /// <summary>Zoom's visible meeting windows: the meeting itself first
        /// (the one with the toolbar, not minimized, else the biggest), then,
        /// with Zoom's "Use dual monitors" on, its second window (the shared
        /// screen or the speaker). Win32 only, for the frequent layout checks;
        /// actions go by FindMeetingWindow.</summary>
        static List<IntPtr> MeetingWindowHandles()
        {
            var handles = TopWindows(MeetingWindowClass, true);
            var scores = new Dictionary<IntPtr, long>();
            foreach (var handle in handles)
            {
                var frame = VisibleFrame(handle);
                long area = Math.Max(0, frame.Right - frame.Left) * (long)Math.Max(0, frame.Bottom - frame.Top);
                long score = Native.IsIconic(handle) ? 0 : area;
                if (HasChildWindow(handle, ControlPanelClass)) score += 1L << 40;
                scores[handle] = score;
            }
            handles.Sort((a, b) => scores[b].CompareTo(scores[a]));
            return handles;
        }

        static bool HasChildWindow(IntPtr parent, string className)
        {
            var found = false;
            Native.EnumChildWindows(parent, delegate (IntPtr hwnd, IntPtr lParam)
            {
                if (ClassOf(hwnd) != className) return true;
                found = true;
                return false;
            }, IntPtr.Zero);
            return found;
        }

        /// <summary>What's visible of a window: its bounds without the
        /// invisible resize border.</summary>
        static Native.Rect VisibleFrame(IntPtr handle)
        {
            Native.Rect frame;
            if (Native.DwmGetWindowAttribute(handle, Native.DwmwaExtendedFrameBounds, out frame, Marshal.SizeOf(typeof(Native.Rect))) == 0)
                return frame;
            Native.GetWindowRect(handle, out frame);
            return frame;
        }

        static bool SameRect(Native.Rect a, Native.Rect b, int tolerance)
        {
            return Math.Abs(a.Left - b.Left) <= tolerance && Math.Abs(a.Top - b.Top) <= tolerance &&
                Math.Abs(a.Right - b.Right) <= tolerance && Math.Abs(a.Bottom - b.Bottom) <= tolerance;
        }

        static Dictionary<string, object> RectReply(Native.Rect rect)
        {
            return new Dictionary<string, object>
            {
                { "height", rect.Bottom - rect.Top }, { "width", rect.Right - rect.Left }, { "x", rect.Left }, { "y", rect.Top },
            };
        }

        static Native.Rect? GetRect(Dictionary<string, object> request, string key)
        {
            object value;
            var rect = request.TryGetValue(key, out value) ? value as Dictionary<string, object> : null;
            if (rect == null) return null;
            try
            {
                int x = ToInt(rect["x"]), y = ToInt(rect["y"]), width = ToInt(rect["width"]), height = ToInt(rect["height"]);
                if (width <= 0 || height <= 0) return null;
                return new Native.Rect { Left = x, Top = y, Right = x + width, Bottom = y + height };
            }
            catch (Exception)
            {
                throw new ZoomActionError("invalid-request");
            }
        }

        static int ToInt(object value)
        {
            return (int)Math.Round(Convert.ToDouble(value));
        }

        static bool arrangedUnsupported;

        /// <summary>Whether Windows counts the window as snapped. False where
        /// Windows can't tell (before Windows 10 2004).</summary>
        static bool IsArranged(IntPtr handle)
        {
            if (arrangedUnsupported) return false;
            try
            {
                return Native.IsWindowArranged(handle);
            }
            catch (EntryPointNotFoundException)
            {
                arrangedUnsupported = true;
                return false;
            }
        }

        static Native.MonitorInfo? MonitorOf(IntPtr handle)
        {
            var info = new Native.MonitorInfo { Size = Marshal.SizeOf(typeof(Native.MonitorInfo)) };
            var monitor = Native.MonitorFromWindow(handle, Native.MonitorDefaultToNearest);
            if (monitor == IntPtr.Zero || !Native.GetMonitorInfo(monitor, ref info)) return null;
            return info;
        }

        static Dictionary<string, object> LayoutState(IntPtr handle)
        {
            var frame = VisibleFrame(handle);
            var monitor = MonitorOf(handle);
            return new Dictionary<string, object>
            {
                { "arranged", IsArranged(handle) },
                { "frame", RectReply(frame) },
                // Covering the whole screen, taskbar included: Zoom's own full
                // screen (or M3 put it there: Zoom's second window).
                { "fullScreen", monitor.HasValue && SameRect(frame, monitor.Value.Monitor, 1) },
                { "handle", handle.ToInt64() },
                { "maximized", Native.IsZoomed(handle) },
                { "minimized", Native.IsIconic(handle) },
            };
        }

        /// <summary>Where Zoom's meeting windows are (see
        /// MeetingWindowHandles), and whether the user is moving one or last
        /// did how long ago (see MoveWatch). Reads only: M3 polls it.</summary>
        static Dictionary<string, object> WindowLayout()
        {
            MoveWatch.Start(MeetingWindowClass, PoppedOutPanelClass);
            var handles = MeetingWindowHandles();
            var lists = TopWindows(PoppedOutPanelClass, true);
            var layout = new Dictionary<string, object>
            {
                { "meeting", handles.Count > 0 ? LayoutState(handles[0]) : null },
                { "miniView", InMiniView() },
                // The participants list in a window of its own: while sharing
                // (see ShareParticipants), or for good once popped out.
                { "participants", lists.Count > 0 ? LayoutState(lists[0]) : null },
                { "second", handles.Count > 1 ? LayoutState(handles[1]) : null },
                { "sharing", IsSharing() },
                { "userMovedListMsAgo", MoveWatch.MillisecondsSinceMove(PoppedOutPanelClass) },
                { "userMovedMsAgo", MoveWatch.MillisecondsSinceMove(MeetingWindowClass) },
                { "userMoving", MoveWatch.Moving(MeetingWindowClass) || MoveWatch.Moving(PoppedOutPanelClass) },
            };
            return new Dictionary<string, object> { { "layout", layout } };
        }

        /// <summary>Puts what's visible of a window at a rectangle, without the
        /// focus: restored first if minimized or maximized. The invisible
        /// border depends on the screen's scaling, so it's measured again once
        /// the window is on its new screen, which then gets placed again.
        /// Returns where the window ended up: Zoom keeps a minimum size.</summary>
        static Native.Rect PlaceWindow(IntPtr handle, Native.Rect target)
        {
            if (Native.IsIconic(handle) || Native.IsZoomed(handle))
            {
                Native.ShowWindow(handle, Native.SwRestoreNoActivate);
                Thread.Sleep(250); // let the restore animation finish
            }
            var frame = VisibleFrame(handle);
            for (int attempt = 0; attempt < 3 && !SameRect(frame, target, 1); attempt++)
            {
                Native.Rect bounds;
                Native.GetWindowRect(handle, out bounds);
                int left = frame.Left - bounds.Left, top = frame.Top - bounds.Top;
                int right = bounds.Right - frame.Right, bottom = bounds.Bottom - frame.Bottom;
                Native.SetWindowPos(handle, IntPtr.Zero, target.Left - left, target.Top - top,
                    target.Right - target.Left + left + right, target.Bottom - target.Top + top + bottom,
                    Native.SwpNoZOrder | Native.SwpNoActivate);
                Thread.Sleep(100);
                var placed = VisibleFrame(handle);
                // Unchanged: the window holds on to its minimum size.
                var stuck = SameRect(placed, frame, 0);
                frame = placed;
                if (stuck) break;
            }
            return frame;
        }

        static bool ModifierHeld()
        {
            foreach (var key in new[] { Native.VkShift, Native.VkControl, Native.VkMenu, Native.VkLeftWindows, Native.VkRightWindows })
                if ((Native.GetAsyncKeyState(key) & 0x8000) != 0) return true;
            return false;
        }

        /// <summary>Snaps a window to the left or right half of its screen
        /// with Windows' own snapping (Win+Left or Win+Right), as if the user
        /// had: Windows then treats it as snapped (dragging the border it
        /// shares with a snapped neighbour resizes both). The keys are typed
        /// for real, so only with the window really in front and no modifier
        /// key held, which would otherwise send them to another window or
        /// combine them with the user's own (Win+L locks the computer). The
        /// window is first put at its target, unsnapped: Win+Right on a window
        /// already snapped right sends it to the next screen. False if it
        /// didn't snap.</summary>
        static bool SnapWithWindows(IntPtr handle, Native.Rect target, bool left)
        {
            if (IsArranged(handle))
            {
                // Setting a window's placement back unsnaps it.
                var placement = new Native.WindowPlacement { Length = Marshal.SizeOf(typeof(Native.WindowPlacement)) };
                Native.GetWindowPlacement(handle, ref placement);
                placement.ShowCommand = Native.SwRestoreNoActivate;
                Native.SetWindowPlacement(handle, ref placement);
            }
            PlaceWindow(handle, target);
            Native.BringToFront(handle);
            Thread.Sleep(150);
            if (Native.GetForegroundWindow() != handle || ModifierHeld()) return false;
            var arrow = left ? Native.VkLeft : Native.VkRight;
            Native.keybd_event(Native.VkLeftWindows, 0, Native.KeyExtended, UIntPtr.Zero);
            Native.keybd_event(arrow, 0, Native.KeyExtended, UIntPtr.Zero);
            Native.keybd_event(arrow, 0, Native.KeyExtended | Native.KeyUp, UIntPtr.Zero);
            Native.keybd_event(Native.VkLeftWindows, 0, Native.KeyExtended | Native.KeyUp, UIntPtr.Zero);
            return WaitUntil(() => IsArranged(handle), 1500);
        }

        /// <summary>Puts Zoom's meeting window, its second window (with Zoom's
        /// "Use dual monitors" on), its participants list in a window of its
        /// own (while sharing) and M3's main window where M3 worked out (each
        /// optional), first snapping Zoom and M3 side by side with Windows
        /// when asked ("zoom-left" or "zoom-right"; the exact sizes are set
        /// afterwards, which keeps them snapped). Replies with where each
        /// window ended up, and whether Windows snapped them.</summary>
        public static Dictionary<string, object> PlaceWindows(Dictionary<string, object> request)
        {
            var zoomTarget = GetRect(request, "zoom");
            var secondTarget = GetRect(request, "second");
            var listTarget = GetRect(request, "participants");
            var m3Target = GetRect(request, "m3");
            object handleValue;
            var m3 = m3Target.HasValue && request.TryGetValue("m3Handle", out handleValue) && handleValue != null
                ? new IntPtr(Convert.ToInt64(handleValue))
                : IntPtr.Zero;
            if (m3 != IntPtr.Zero && !Native.IsWindow(m3)) m3 = IntPtr.Zero;
            var snap = GetString(request, "snap");

            var handles = MeetingWindowHandles();
            var lists = TopWindows(PoppedOutPanelClass, true);
            if (handles.Count == 0 && (zoomTarget.HasValue || lists.Count == 0)) throw new ZoomActionError("meeting-not-found");

            var snapped = false;
            if ((snap == "zoom-left" || snap == "zoom-right") && zoomTarget.HasValue && m3 != IntPtr.Zero)
            {
                var zoomLeft = snap == "zoom-left";
                snapped = SnapWithWindows(handles[0], zoomTarget.Value, zoomLeft) &&
                    SnapWithWindows(m3, m3Target.Value, !zoomLeft);
            }
            var placed = new Dictionary<string, object> { { "snapped", snapped } };
            if (zoomTarget.HasValue) placed["zoom"] = RectReply(PlaceWindow(handles[0], zoomTarget.Value));
            if (m3 != IntPtr.Zero) placed["m3"] = RectReply(PlaceWindow(m3, m3Target.Value));
            if (secondTarget.HasValue && handles.Count > 1) placed["second"] = RectReply(PlaceWindow(handles[1], secondTarget.Value));
            if (listTarget.HasValue && lists.Count > 0) placed["participants"] = RectReply(PlaceWindow(lists[0], listTarget.Value));
            return new Dictionary<string, object> { { "placed", placed } };
        }

        /// <summary>While sharing, Zoom hides its meeting window, participants
        /// list included (and showing it again by hand only shows it blank):
        /// this opens the list in a window of its own instead, through the
        /// share toolbar's Participants button, known by Zoom's Alt+U or the
        /// name learned for the toolbar's. Zoom closes that window once
        /// sharing stops. Replies whether it was opened (false: already open).</summary>
        public static Dictionary<string, object> ShareParticipants()
        {
            if (TopWindows(PoppedOutPanelClass, true).Count > 0) return Changed(false);
            var buttons = ShareToolbarButtons();
            El button = null;
            foreach (var candidate in buttons)
                if (HasHotkey(candidate.Name, HotkeyParticipants)) button = candidate;
            if (button == null) button = ByName(buttons, Known.Participants);
            if (button == null) throw new ZoomActionError("participants-button-not-found");
            Press(button);
            if (WaitForWindow(PoppedOutPanelClass, 4000) == null) throw new ZoomActionError("participants-panel-not-opened");
            return Changed(true);
        }

        // --- Diagnostics ---------------------------------------------------------------

        /// <summary>What Zoom showed when an action failed, for M3's error
        /// reports: Zoom's version, its visible windows' classes, the names
        /// of its toolbar and participants panel buttons, those of its other
        /// windows (dialogs in the way) and of the share toolbar, and the
        /// names M3 knows. Nothing personal: no window titles, no participant
        /// rows, nothing in a list. Reads only, without moving the mouse or
        /// focus.</summary>
        public static Dictionary<string, object> Snapshot()
        {
            var snapshot = new Dictionary<string, object>();
            try
            {
                snapshot["zoomVersion"] = ZoomVersion();
                snapshot["windows"] = ZoomWindowClasses();
                snapshot["dialogs"] = DialogControlNames();
                var sharing = IsSharing();
                snapshot["sharing"] = sharing;
                if (sharing) snapshot["shareToolbar"] = ShareToolbarControlNames();
                snapshot["titles"] = Known.Titles();
                var window = FindMeetingWindow();
                snapshot["meeting"] = window != null;
                if (window == null) return snapshot;
                var panel = Uia.FirstByClass(window, ControlPanelClass);
                snapshot["toolbarVisible"] = panel != null;
                if (panel == null) panel = ToolbarWindow(window);
                if (panel != null)
                {
                    snapshot["toolbar"] = Names(Uia.Descendants(panel, Uia.ButtonType));
                    snapshot["toolbarMenus"] = Names(Uia.Descendants(panel, Uia.MenuItemType));
                }
                snapshot["participantsPanelOpen"] = ParticipantsPanelOpen(window);
                snapshot["panelRow"] = Names(PanelRowButtons(window));
            }
            catch (Exception error)
            {
                snapshot["error"] = error.Message;
            }
            return snapshot;
        }

        static List<object> Names(List<El> elements)
        {
            var names = new List<object>();
            foreach (var element in elements) if (element.Name.Length > 0) names.Add(element.Name);
            return names;
        }

        // A snapshot stays small and quick whatever Zoom has open.
        const int SnapshotMaxWindows = 8;
        const int SnapshotMaxNames = 25;
        const int SnapshotMaxNameLength = 120;
        const int SnapshotWindowsBudgetMs = 1500;

        static readonly int[] SnapshotControlTypes =
        {
            Uia.ButtonType, Uia.CheckBoxType, Uia.MenuItemType, Uia.TabItemType, Uia.SplitButtonType,
        };

        /// <summary>Zoom's other visible windows (dialogs and popups that may
        /// be in the way), keyed by class and size, with their controls'
        /// names (see ControlNames).</summary>
        static Dictionary<string, object> DialogControlNames()
        {
            var dialogs = new Dictionary<string, object>();
            var elapsed = System.Diagnostics.Stopwatch.StartNew();
            foreach (var entry in ZoomWindows())
            {
                if (dialogs.Count >= SnapshotMaxWindows || elapsed.ElapsedMilliseconds > SnapshotWindowsBudgetMs) break;
                if (IsZoomMainWindow(entry.Value)) continue;
                Native.Rect rect;
                if (!Native.GetWindowRect(entry.Key, out rect)) continue;
                var key = entry.Value + " " + (rect.Right - rect.Left) + "x" + (rect.Bottom - rect.Top);
                var unique = key;
                for (int n = 2; dialogs.ContainsKey(unique); n++) unique = key + " #" + n;
                dialogs[unique] = ControlNames(entry.Key);
            }
            return dialogs;
        }

        static List<object> ShareToolbarControlNames()
        {
            var toolbars = TopWindows(ShareToolbarClass, true);
            return toolbars.Count == 0 ? new List<object>() : ControlNames(toolbars[0]);
        }

        /// <summary>The names of a window's buttons, menu entries, checkboxes
        /// and tabs, capped. None inside a list: Zoom lists people, chat
        /// messages and the windows offered for sharing.</summary>
        static List<object> ControlNames(IntPtr handle)
        {
            var names = new List<object>();
            try
            {
                var window = Uia.FromHandle(handle);
                var lists = Uia.Descendants(window, Uia.ListType);
                foreach (var element in Uia.Descendants(window, SnapshotControlTypes))
                {
                    if (names.Count >= SnapshotMaxNames) break;
                    if (element.Name.Length == 0) continue;
                    if (lists.Exists(list => Contains(list.Rect, element))) continue;
                    var name = element.Name.Length > SnapshotMaxNameLength
                        ? element.Name.Substring(0, SnapshotMaxNameLength) + "..."
                        : element.Name;
                    if (!names.Contains(name)) names.Add(name);
                }
            }
            catch (Exception) { } // the window went away
            return names;
        }

        static string cachedZoomVersion;
        static DateTime cachedZoomVersionAt = DateTime.MinValue;

        /// <summary>Zoom's version, read again at most once a minute: M3
        /// polls the meeting state, and a changed version means Zoom was
        /// updated (and restarted) meanwhile.</summary>
        static string CachedZoomVersion()
        {
            if ((DateTime.UtcNow - cachedZoomVersionAt).TotalSeconds > 60)
            {
                cachedZoomVersion = ZoomVersion();
                cachedZoomVersionAt = DateTime.UtcNow;
            }
            return cachedZoomVersion;
        }

        static string ZoomVersion()
        {
            try
            {
                foreach (var process in System.Diagnostics.Process.GetProcessesByName("Zoom"))
                {
                    var version = process.MainModule.FileVersionInfo.FileVersion;
                    if (!string.IsNullOrEmpty(version)) return version;
                }
            }
            catch (Exception) { }
            return null;
        }

        /// <summary>The classes of Zoom's visible top-level windows.</summary>
        static List<object> ZoomWindowClasses()
        {
            var classes = new List<object>();
            foreach (var className in ZoomWindows().Values)
                if (!classes.Contains(className)) classes.Add(className);
            return classes;
        }

        /// <summary>Zoom's visible top-level windows (from any of its
        /// processes: dialogs may come from another than the meeting's), by
        /// handle, with their classes.</summary>
        static Dictionary<IntPtr, string> ZoomWindows()
        {
            var zoomPids = new HashSet<uint>();
            foreach (var process in System.Diagnostics.Process.GetProcessesByName("Zoom")) zoomPids.Add((uint)process.Id);
            var windows = new Dictionary<IntPtr, string>();
            Native.EnumWindows(delegate (IntPtr hwnd, IntPtr lParam)
            {
                if (!Native.IsWindowVisible(hwnd)) return true;
                uint pid;
                Native.GetWindowThreadProcessId(hwnd, out pid);
                if (!zoomPids.Contains(pid)) return true;
                // Zoom's hidden helper windows count as visible but have no
                // size (notification and accessibility relays).
                Native.Rect rect;
                if (!Native.GetWindowRect(hwnd, out rect) || rect.Right <= rect.Left || rect.Bottom <= rect.Top) return true;
                var buffer = new StringBuilder(256);
                Native.GetClassName(hwnd, buffer, buffer.Capacity);
                windows[hwnd] = buffer.ToString();
                return true;
            }, IntPtr.Zero);
            return windows;
        }

        // Zoom windows that are never dialogs to dismiss: the meeting, its
        // mini view, its popped-out panels (such as the participants list),
        // sharing (the toolbar, the annotation layer and its button), Zoom's
        // home window, its menus' shadows, its notification toasts (one shows
        // as sharing starts and stays briefly after it stops) and its corner
        // notices (the "talking while muted" prompt, and the "note taking is
        // now available" notice that closes itself after 30 seconds).
        static readonly string[] ZoomMainWindowClasses =
        {
            MeetingWindowClass, FloatVideoClass, PoppedOutPanelClass, ShareToolbarClass, AnnotationLayerClass,
            "ZPAnnotateEntryPointClass", "ZPPTMainFrmWndClassEx", "ZPToolBarParentWndClass",
            "ZoomShadowFrameClass", "VideoFrameWndClass", "DsToast", "CVoiceActivityDetectedDlgCls",
        };

        /// <summary>Whether a window is one of Zoom's own rather than a dialog
        /// or popup that may be in the way. Windows of a generic "ATL:" class
        /// (named after a memory address, so it changes between runs) are
        /// Zoom's too, such as the share preview.</summary>
        static bool IsZoomMainWindow(string className)
        {
            return Array.IndexOf(ZoomMainWindowClasses, className) >= 0 || className.StartsWith("ATL:", StringComparison.Ordinal);
        }

        /// <summary>The classes of Zoom's other visible windows: dialogs and
        /// popups that may be in the way (e.g. the invite dialog).</summary>
        static List<object> ZoomDialogClasses()
        {
            var classes = new List<object>();
            foreach (var className in ZoomWindows().Values)
                if (!IsZoomMainWindow(className) && !classes.Contains(className)) classes.Add(className);
            return classes;
        }

        /// <summary>Closes the dialogs a wrong pick opened: Zoom's windows
        /// that weren't there before, by Escape, else by their title bar's
        /// close button. Returns the classes of those still open, so M3 can
        /// say a window is in the way.</summary>
        static List<object> DismissNewWindows(Dictionary<IntPtr, string> before)
        {
            var left = new List<object>();
            foreach (var entry in ZoomWindows())
            {
                if (before.ContainsKey(entry.Key) || IsZoomMainWindow(entry.Value)) continue;
                var handle = entry.Key;
                if (CloseWithEscape(handle)) continue;
                var close = TitleBarCloseButton(handle);
                if (close != null)
                {
                    Press(close);
                    if (WaitUntil(() => !Native.IsWindowVisible(handle), 1500)) continue;
                }
                left.Add(entry.Value);
            }
            return left;
        }

        /// <summary>A window's close button: the rightmost button in its top
        /// strip. Null if there's none there (then nothing is pressed).</summary>
        static El TitleBarCloseButton(IntPtr handle)
        {
            Native.Rect rect;
            if (!Native.GetWindowRect(handle, out rect)) return null;
            El close = null;
            foreach (var button in Uia.Descendants(Uia.FromHandle(handle), Uia.ButtonType))
            {
                if (button.Rect.top > rect.Top + 48 || button.Rect.right < rect.Right - 80) continue;
                if (close == null || button.Rect.left > close.Rect.left) close = button;
            }
            return close;
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

        /// <summary>Runs a command, then gives the focus back to the window
        /// that had it: Zoom brings itself forward when its controls are
        /// pressed. The mouse is put back too, should a last resort have moved
        /// it (only then: the user may have moved it meanwhile).</summary>
        public static Dictionary<string, object> Handle(Dictionary<string, object> request)
        {
            Known.Load(request);
            var type = GetString(request, "type");
            var reply = type == "ping" || type == "window-layout" || (type == "meeting" && !GetBool(request, "reveal"))
                ? Run(type, request)
                : RunRestoringInput(type, request);
            if (Known.Learned.Count > 0) reply["learned"] = new Dictionary<string, object>(Known.Learned);
            return reply;
        }

        static Dictionary<string, object> RunRestoringInput(string type, Dictionary<string, object> request)
        {
            Native.Point cursor;
            var hasCursor = Native.GetCursorPos(out cursor);
            var foreground = Native.GetForegroundWindow();
            cursorMoved = false;
            try
            {
                return Run(type, request);
            }
            finally
            {
                if (hasCursor && cursorMoved) Native.SetCursorPos(cursor.X, cursor.Y);
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
                case "learn-hand-raised": return LearnHandRaised(GetString(request, "reactButtonTitle"));
                case "raised-hands": return RaisedHands(GetString(request, "phrase"));
                case "set-participant-mic":
                    return SetParticipantMic(GetString(request, "name"), GetBool(request, "on"), GetString(request, "micOnTitle"), GetString(request, "micOffTitle"), GetString(request, "lowerHandTitle"), GetString(request, "askToUnmuteTitle"), GetString(request, "phrase"));
                case "inspect-participant": return InspectParticipant(GetString(request, "name"));
                case "lower-participant-hand":
                    return LowerParticipantHand(GetString(request, "name"), GetString(request, "lowerHandTitle"), GetString(request, "phrase"), GetString(request, "micOnTitle"), GetString(request, "micOffTitle"), GetString(request, "askToUnmuteTitle"));
                case "share-entries": return ShareEntries();
                case "panel-entries": return PanelEntries();
                case "test-mute-all-entry": return TestMuteAllEntry(GetString(request, "title"));
                case "share-toolbar-entries": return ShareToolbarEntries();
                case "test-stop-share-entry": return TestStopShareEntry(GetString(request, "title"));
                case "start-share":
                    return StartShare(GetString(request, "windowTitle") ?? "", GetString(request, "shareButtonTitle"));
                case "stop-share": return StopShare();
                case "diagnose":
                    return new Dictionary<string, object> { { "diagnosis", Diagnose() } };
                case "toggle-video": return ToggleVideo();
                case "toggle-mic": return ToggleMic(GetBool(request, "assumeAudioJoined"));
                case "test-share-picker":
                    return TestSharePicker(GetString(request, "windowTitle") ?? "", GetString(request, "shareButtonTitle"));
                case "window-layout": return WindowLayout();
                case "place-windows": return PlaceWindows(request);
                case "share-participants": return ShareParticipants();
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
                    // Only an action in Zoom that failed is worth a look at Zoom.
                    if (error.Message != "unknown-command" && error.Message != "invalid-request") reply["snapshot"] = Helper.Snapshot();
                }
                catch (ArgumentException)
                {
                    reply = new Dictionary<string, object> { { "error", "invalid-request" }, { "ok", false } };
                }
                catch (Exception error)
                {
                    Console.Error.WriteLine("Zoom helper error: " + error);
                    reply = new Dictionary<string, object> { { "error", "unexpected:" + error.Message }, { "ok", false }, { "snapshot", Helper.Snapshot() } };
                }
                reply["id"] = id;
                stdout.WriteLine(json.Serialize(reply));
                stdout.Flush();
            }
        }
    }
}
