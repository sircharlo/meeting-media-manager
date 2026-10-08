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
//   settings (the video button in each state, the Share entry).
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
        [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hwnd);
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
        [DllImport("user32.dll")] public static extern void mouse_event(uint flags, int dx, int dy, uint data, UIntPtr extra);
        [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);

        public static readonly IntPtr DpiAwarenessPerMonitorV2 = new IntPtr(-4);
        public const int SwRestore = 9;
        public const uint MouseLeftDown = 0x0002;
        public const uint MouseLeftUp = 0x0004;
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

        const string HotkeyAudio = "Alt+A";
        const string HotkeyVideo = "Alt+V";
        const string HotkeyMuteAll = "Alt+M";

        // A trailing "(Ctrl+Alt+Shift+A)" style shortcut in a control name.
        // Key names are matched by shape only, since Zoom may translate them
        // (e.g. "Strg" for Ctrl in German).
        static readonly Regex TrailingHotkey = new Regex(@"\((?:[^()\s+]+\+)+[^()\s+]+\)\s*$");
        // Zoom names its menu separators "4 of 17" in every language.
        static readonly Regex MenuSeparator = new Regex(@"^\d+ of \d+$");
        // "More" menu entries end with a translated "row R, column C N of M ..."
        static readonly Regex GridPositionSuffix = new Regex(@"^(.*?)\s+\S+\s+\d+,\s*\S+\s+\d+\s+\d+\s+\S+\s+\d+(?:\s.*)?$");
        static readonly Regex SectionHeader = new Regex(@"\(\d+\)");

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

        static void Click(El element)
        {
            Native.SetCursorPos(element.CenterX, element.CenterY);
            Thread.Sleep(50);
            Native.mouse_event(Native.MouseLeftDown, 0, 0, 0, UIntPtr.Zero);
            Native.mouse_event(Native.MouseLeftUp, 0, 0, 0, UIntPtr.Zero);
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
            panel = WaitFor(() =>
            {
                // Read afresh: Focus may just have restored a minimized window,
                // whose earlier position was off-screen.
                var rect = window.Raw.CurrentBoundingRectangle;
                var x = (rect.left + rect.right) / 2;
                var y = (rect.top + rect.bottom) / 2;
                Native.SetCursorPos(x, y);
                Thread.Sleep(50);
                Native.SetCursorPos(x + 20, y + 20);
                return Uia.FirstByClass(window, ControlPanelClass);
            }, found => found != null, 3000);
            if (panel == null) throw new ZoomActionError("meeting-toolbar-not-found");
            return panel;
        }

        static List<El> ToolbarButtons(El window)
        {
            return Uia.Descendants(ControlPanel(window), Uia.ButtonType);
        }

        static List<El> ToolbarMenus(El window)
        {
            return Uia.Descendants(ControlPanel(window), Uia.MenuItemType);
        }

        /// <summary>Joined computer audio: the microphone button carries Zoom's
        /// Alt+A shortcut. Not joined: the same spot is a "Join audio" button
        /// without it.</summary>
        static bool AudioJoined(El window)
        {
            foreach (var button in ToolbarButtons(window))
                if (HasHotkey(button.Name, HotkeyAudio)) return true;
            return false;
        }

        static El VideoButton(El window)
        {
            foreach (var button in ToolbarButtons(window))
                if (HasHotkey(button.Name, HotkeyVideo)) return button;
            return null;
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
            El video = toolbarVisible ? VideoButton(window) : null;
            return new Dictionary<string, object>
            {
                { "audioJoined", toolbarVisible ? (object)AudioJoined(window) : null },
                { "found", true },
                { "handle", window.Raw.CurrentNativeWindowHandle.ToInt64() },
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

        public static Dictionary<string, object> SetVideo(bool on, string onTitle, string offTitle)
        {
            var window = RequireMeetingWindow();
            var button = VideoButton(window);
            if (button == null) throw new ZoomActionError("video-button-not-found");
            var current = FirstSegment(button.Name);
            onTitle = FirstSegment(onTitle);
            offTitle = FirstSegment(offTitle);
            if (onTitle.Length == 0 || offTitle.Length == 0) throw new ZoomActionError("video-titles-not-captured");
            if (current != onTitle && current != offTitle) throw new ZoomActionError("video-title-unrecognized:" + current);
            if ((current == onTitle) == on) return Changed(false);
            Focus(window);
            Press(button);
            var wanted = on ? onTitle : offTitle;
            var done = WaitUntil(() =>
            {
                var latest = VideoButton(window);
                return latest != null && FirstSegment(latest.Name) == wanted;
            }, WaitTimeoutMs);
            if (!done) throw new ZoomActionError("video-not-changed");
            return Changed(true);
        }

        public static Dictionary<string, object> VideoTitle()
        {
            var window = RequireMeetingWindow();
            var button = VideoButton(window);
            if (button == null) throw new ZoomActionError("video-button-not-found");
            return new Dictionary<string, object> { { "title", FirstSegment(button.Name) } };
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
            foreach (var name in waiting)
            {
                var row = WaitingRow(window, name);
                if (row == null) continue;
                Focus(window);
                Hover(row.Element);
                Thread.Sleep(500);
                row = WaitingRow(window, name);
                if (row == null) continue;
                var buttons = Named(Uia.Descendants(row.Element, Uia.ButtonType));
                if (buttons.Count == 0) continue;
                Press(buttons[0]);
                var current = name;
                if (WaitUntil(() => WaitingRow(window, current) == null, 5000)) admitted.Add(name);
            }
            return new Dictionary<string, object> { { "admitted", admitted }, { "changed", admitted.Count > 0 } };
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
        /// which one is Share (its name depends on their Zoom language).</summary>
        public static Dictionary<string, object> ShareEntries()
        {
            var window = RequireMeetingWindow();
            var entries = new List<object>();
            foreach (var button in ToolbarButtons(window))
            {
                if (HasHotkey(button.Name, HotkeyAudio) || HasHotkey(button.Name, HotkeyVideo)) continue;
                var name = FirstSegment(button.Name);
                if (name.Length > 0 && !entries.Contains(name)) entries.Add(name);
            }
            var grid = OpenMoreGrid(window);
            if (grid != null)
            {
                foreach (var item in Uia.Descendants(grid, Uia.TabItemType))
                {
                    var name = GridEntryName(item);
                    if (name.Length > 0 && !entries.Contains(name)) entries.Add(name);
                }
                Focus(window);
                Escape();
            }
            return new Dictionary<string, object> { { "entries", entries } };
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

        public static Dictionary<string, object> StartShare(string windowTitle, string shareTitle)
        {
            if (IsSharing()) return Changed(false);
            var window = RequireMeetingWindow();
            OpenSharePicker(window, shareTitle);
            var picker = WaitForWindow(SharePickerClass, WaitTimeoutMs);
            if (picker == null) throw new ZoomActionError("share-picker-not-found");
            var target = WaitFor(() =>
            {
                foreach (var item in Uia.Descendants(picker, Uia.ListItemType))
                    if (item.Name == windowTitle) return item;
                return null;
            }, found => found != null, 4000);
            if (target == null)
            {
                Escape();
                throw new ZoomActionError("window-to-share-not-found");
            }
            Click(target); // list items don't support selection through UI Automation
            Thread.Sleep(300);
            // Share sound, then Optimize for video clips, in every language.
            var checkboxes = Uia.Descendants(picker, Uia.CheckBoxType);
            for (int i = 0; i < Math.Min(2, checkboxes.Count); i++) SetChecked(checkboxes[i], true);
            var buttons = Uia.Descendants(picker, Uia.ButtonType);
            if (buttons.Count == 0) throw new ZoomActionError("share-confirm-not-found");
            Press(buttons[buttons.Count - 1]);
            if (!WaitUntil(IsSharing, WaitTimeoutMs)) throw new ZoomActionError("share-not-started");
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
                case "mute-all": return MuteAll(GetBool(request, "allowSelfUnmute"));
                case "ask-all-to-unmute": return AskAllToUnmute();
                case "participants": return Participants();
                case "admit": return Admit(GetStrings(request, "names"));
                case "share-entries": return ShareEntries();
                case "start-share":
                    return StartShare(GetString(request, "windowTitle") ?? "", GetString(request, "shareButtonTitle"));
                case "stop-share": return StopShare();
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
