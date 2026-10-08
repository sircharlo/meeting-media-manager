"""UI Automation helper behind M³'s Zoom Meeting Manager (Windows only).

M³'s Electron main process starts this script, reads the port it prints
(`ZOOM_HELPER_PORT=<port>`) and sends it HTTP requests. Each endpoint is one
complete Zoom action (join audio, mute everyone, start sharing, ...), because
Zoom closes its menus as soon as focus moves elsewhere, so the steps of an
action have to run back to back in this one process.

Zoom Workplace 7 exposes no control IDs, and every visible name is in the
user's Zoom language. So controls are found only by things that are the same
in every language:

- the keyboard shortcuts Zoom appends to button names ("..., Alt+A" for the
  microphone, "Alt+V" video, "Alt+M" mute everyone, "Alt+U" participants);
- window classes (the join-audio dialog, the mute-everyone dialog, menus...);
- control types and their order in a dialog or menu;
- titles that M³ controls (its media window) or that the user captured in
  M³'s settings (the video button in each state, the Share entry).

Controls are pressed through UI Automation patterns (Invoke, Toggle), which
don't move the user's mouse, falling back to a real click for the few Zoom
controls that don't support them.
"""

import ctypes
import hmac
import os
import re
import threading
import time
import traceback
from ctypes import wintypes

# Real (physical) coordinates, so fallback clicks land on the right spot on
# mixed-DPI multi-monitor setups. Must run before pywinauto is imported.
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
except Exception:
    pass

from flask import Flask, jsonify, request  # noqa: E402
from pywinauto import Desktop, mouse  # noqa: E402
from waitress import create_server  # noqa: E402

app = Flask(__name__)
desktop = Desktop(backend="uia")

# Any web page open in the user's browser can send requests to a localhost
# port, so every request must carry the secret M³ generated for this run.
# A custom header also makes browsers send a CORS preflight, which this
# server never approves.
AUTH_HEADER = "X-Zoom-Helper-Token"
AUTH_TOKEN = os.environ.get("ZOOM_HELPER_TOKEN", "")
user32 = ctypes.windll.user32

# UI Automation calls are serialized: two actions interleaving (e.g. the
# popup's status polling during an automation) would steal each other's
# focus and close each other's menus.
uia_lock = threading.Lock()

MEETING_WINDOW_CLASS = "ConfMultiTabContentWndClass"
CONTROL_PANEL_CLASS = "ZPControlPanelClass"
JOIN_AUDIO_DIALOG_CLASS = "zJoinAudioWndClass"
MUTE_ALL_DIALOG_CLASS = "zChangeNameWndClass"
MENU_CLASS = "WCN_ModelessWnd"
MORE_GRID_CLASS = "ZGridMultiLevelPopupWndClass"
SHARE_PICKER_CLASS = "ZPShareEntranceClass"
SHARE_TOOLBAR_CLASS = "ZPFloatToolbarClass"

HOTKEY_AUDIO = "Alt+A"
HOTKEY_VIDEO = "Alt+V"
HOTKEY_MUTE_ALL = "Alt+M"
HOTKEY_PARTICIPANTS = "%u"  # pywinauto syntax for Alt+U
HOTKEY_DEFAULT_SHARE = "%s"  # Zoom's default share shortcut, Alt+S

# A trailing "(Ctrl+Alt+Shift+A)" style shortcut in a control name. Key
# names are matched by shape only, since Zoom may translate them (e.g.
# "Strg" for Ctrl in German).
TRAILING_HOTKEY = re.compile(r"\((?:[^()\s+]+\+)+[^()\s+]+\)\s*$")
# Zoom names its menu separators "4 of 17" in every language.
MENU_SEPARATOR = re.compile(r"^\d+ of \d+$")
# "More" menu entries end with a translated "row R, column C N of M ..."
GRID_POSITION_SUFFIX = re.compile(r"^(.*?)\s+\S+\s+\d+,\s*\S+\s+\d+\s+\d+\s+\S+\s+\d+(?:\s.*)?$")
# Buttons whose tops are this close (in pixels) count as one row.
ROW_TOLERANCE = 8

WAIT_TIMEOUT_SECONDS = 8
POLL_INTERVAL_SECONDS = 0.2


class ZoomActionError(Exception):
    """An expected failure, reported to M³ as {ok: false, error}."""


# --- Windows and elements ---------------------------------------------------


def top_windows(class_name, visible_only=True):
    """Top-level windows of a class, found through Win32 because UI
    Automation's desktop listing misses Zoom's popup menus."""
    found = []

    @ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
    def callback(hwnd, _):
        if visible_only and not user32.IsWindowVisible(hwnd):
            return True
        buffer = ctypes.create_unicode_buffer(256)
        user32.GetClassNameW(hwnd, buffer, 256)
        if buffer.value == class_name:
            found.append(hwnd)
        return True

    user32.EnumWindows(callback, 0)
    return [desktop.window(handle=handle) for handle in found]


def wait_for(predicate, timeout=WAIT_TIMEOUT_SECONDS):
    deadline = time.monotonic() + timeout
    while True:
        result = predicate()
        if result or time.monotonic() >= deadline:
            return result
        time.sleep(POLL_INTERVAL_SECONDS)


def wait_for_window(class_name, timeout=WAIT_TIMEOUT_SECONDS):
    windows = wait_for(lambda: top_windows(class_name), timeout)
    return windows[0] if windows else None


def name_of(element):
    try:
        return element.element_info.name or ""
    except Exception:
        return ""


def descendants(window, control_type=None):
    try:
        if control_type:
            return window.descendants(control_type=control_type)
        return window.descendants()
    except Exception:
        return []


def has_hotkey(name, hotkey):
    return re.search(rf"(?<![\w+]){re.escape(hotkey)}(?![\w+])", name) is not None


def first_segment(name):
    """'Arrêter ma vidéo, Alt+V' -> 'Arrêter ma vidéo'."""
    return TRAILING_HOTKEY.sub("", (name or "").split(",")[0]).strip()


def press(element):
    """Invoke a control without moving the mouse, or click it if Zoom
    doesn't support Invoke on it."""
    try:
        element.invoke()
    except Exception:
        element.click_input()


def set_checked(checkbox, checked):
    want = 1 if checked else 0
    if checkbox.get_toggle_state() == want:
        return False
    try:
        checkbox.toggle()
    except Exception:
        checkbox.click_input()
    return True


def area(element):
    rect = element.rectangle()
    return rect.width() * rect.height()


def largest_button(dialog):
    """A dialog's main call to action, e.g. "Join with computer audio"."""
    buttons = descendants(dialog, "Button")
    return max(buttons, key=area) if buttons else None


def action_row_buttons(dialog):
    """A dialog's action buttons (e.g. Yes, No), left to right: the lowest
    row of buttons. Close buttons, in the title bar or a corner, sit higher
    up, and their names ("close", "Close", ...) can't be relied on."""
    buttons = descendants(dialog, "Button")
    if not buttons:
        return []
    lowest = max(button.rectangle().top for button in buttons)
    row = [b for b in buttons if abs(b.rectangle().top - lowest) <= ROW_TOLERANCE]
    return sorted(row, key=lambda button: button.rectangle().left)


def menu_groups(menu):
    """A menu's entries, in groups split at its separators."""
    groups = [[]]
    for item in descendants(menu, "MenuItem"):
        name = name_of(item)
        if MENU_SEPARATOR.match(name):
            groups.append([])
        elif name:
            groups[-1].append(item)
    return [group for group in groups if group]


def menu_items(menu):
    return [item for group in menu_groups(menu) for item in group]


def focus(window):
    try:
        window.set_focus()
    except Exception:
        pass
    time.sleep(0.2)


# --- Meeting window ---------------------------------------------------------


def find_meeting_window():
    for window in top_windows(MEETING_WINDOW_CLASS, visible_only=False):
        try:
            if window.child_window(class_name=CONTROL_PANEL_CLASS).exists(timeout=0):
                return window
        except Exception:
            continue
    return None


def require_meeting_window():
    window = find_meeting_window()
    if not window:
        raise ZoomActionError("meeting-not-found")
    return window


def control_panel(window):
    return window.child_window(class_name=CONTROL_PANEL_CLASS)


def toolbar_buttons(window):
    return descendants(control_panel(window), "Button")


def audio_joined(window):
    """Joined computer audio: the microphone button carries Zoom's Alt+A
    shortcut. Not joined: the same spot is a "Join audio" button without it."""
    return any(has_hotkey(name_of(b), HOTKEY_AUDIO) for b in toolbar_buttons(window))


def video_button(window):
    for button in toolbar_buttons(window):
        if has_hotkey(name_of(button), HOTKEY_VIDEO):
            return button
    return None


def is_sharing():
    return bool(top_windows(SHARE_TOOLBAR_CLASS))


def meeting_state():
    window = find_meeting_window()
    if not window:
        return {"found": False, "sharing": is_sharing()}
    button = video_button(window)
    return {
        "audioJoined": audio_joined(window),
        "found": True,
        "handle": window.handle,
        "participantsPanelOpen": mute_all_button(window) is not None,
        "sharing": is_sharing(),
        "title": window.window_text(),
        "videoTitle": first_segment(name_of(button)) if button else None,
    }


# --- Audio and video --------------------------------------------------------


def join_audio():
    window = require_meeting_window()
    if audio_joined(window):
        return {"changed": False}
    join_button = toolbar_buttons(window)[0]
    focus(window)
    press(join_button)
    dialog = wait_for_window(JOIN_AUDIO_DIALOG_CLASS, timeout=5)
    if dialog:
        button = largest_button(dialog)
        if not button:
            raise ZoomActionError("join-audio-button-not-found")
        press(button)
    if not wait_for(lambda: audio_joined(window)):
        raise ZoomActionError("audio-not-joined")
    return {"changed": True}


def leave_audio():
    window = require_meeting_window()
    if not audio_joined(window):
        return {"changed": False}
    # The arrow next to the microphone button is the toolbar's first menu.
    audio_menu = descendants(control_panel(window), "MenuItem")[0]
    focus(window)
    press(audio_menu)
    menu = wait_for_window(MENU_CLASS, timeout=4)
    if not menu:
        audio_menu.click_input()
        menu = wait_for_window(MENU_CLASS, timeout=4)
    if not menu:
        raise ZoomActionError("audio-menu-not-found")
    items = menu_items(menu)
    # "Leave computer audio" is the entry just before "Audio settings".
    if len(items) < 2:
        raise ZoomActionError("leave-audio-item-not-found")
    press(items[-2])
    if not wait_for(lambda: not audio_joined(window)):
        raise ZoomActionError("audio-not-left")
    return {"changed": True}


def set_video(on, on_title, off_title):
    window = require_meeting_window()
    button = video_button(window)
    if not button:
        raise ZoomActionError("video-button-not-found")
    current_title = first_segment(name_of(button))
    on_title, off_title = first_segment(on_title), first_segment(off_title)
    if not on_title or not off_title:
        raise ZoomActionError("video-titles-not-captured")
    if current_title not in (on_title, off_title):
        raise ZoomActionError(f"video-title-unrecognized:{current_title}")
    if (current_title == on_title) == on:
        return {"changed": False}
    focus(window)
    press(button)
    wanted = on_title if on else off_title
    changed = wait_for(
        lambda: (b := video_button(window)) and first_segment(name_of(b)) == wanted
    )
    if not changed:
        raise ZoomActionError("video-not-changed")
    return {"changed": True}


def video_title():
    window = require_meeting_window()
    button = video_button(window)
    if not button:
        raise ZoomActionError("video-button-not-found")
    return {"title": first_segment(name_of(button))}


# --- Participants -----------------------------------------------------------


def mute_all_button(window):
    for button in descendants(window, "Button"):
        if has_hotkey(name_of(button), HOTKEY_MUTE_ALL):
            return button
    return None


def open_participants_panel(window):
    button = mute_all_button(window)
    if button:
        return button
    focus(window)
    window.type_keys(HOTKEY_PARTICIPANTS)
    button = wait_for(lambda: mute_all_button(window), timeout=5)
    if not button:
        raise ZoomActionError("participants-panel-not-opened")
    return button


def mute_all(allow_self_unmute):
    window = require_meeting_window()
    button = open_participants_panel(window)
    focus(window)
    press(button)
    dialog = wait_for_window(MUTE_ALL_DIALOG_CLASS, timeout=5)
    if not dialog:
        raise ZoomActionError("mute-all-dialog-not-found")
    checkboxes = descendants(dialog, "CheckBox")
    if not checkboxes:
        raise ZoomActionError("allow-unmute-checkbox-not-found")
    set_checked(checkboxes[0], allow_self_unmute)
    buttons = action_row_buttons(dialog)
    if len(buttons) != 2:
        raise ZoomActionError("mute-all-confirm-not-found")
    press(buttons[0])  # Yes; No is to its right
    if not wait_for(lambda: not top_windows(MUTE_ALL_DIALOG_CLASS), timeout=4):
        raise ZoomActionError("mute-all-not-confirmed")
    return {"changed": True}


def ask_all_to_unmute():
    window = require_meeting_window()
    mute_all = open_participants_panel(window)
    controls = [
        c for c in descendants(window) if c.element_info.control_type in ("Button", "SplitButton")
    ]
    after_mute_all = controls[controls.index(mute_all) + 1 :] if mute_all in controls else []
    more = next(
        (c for c in after_mute_all if c.element_info.control_type == "SplitButton"),
        None,
    )
    if not more:
        raise ZoomActionError("participants-more-button-not-found")
    focus(window)
    more.click_input()  # Zoom doesn't support Invoke on this one
    menu = wait_for_window(MENU_CLASS, timeout=4)
    if not menu:
        raise ZoomActionError("participants-menu-not-found")
    # "Ask all to unmute" heads the menu, alone in its group. When nobody is
    # muted it isn't offered, and the first group holds on/off options that
    # must not be toggled by mistake.
    groups = menu_groups(menu)
    if not groups or len(groups[0]) != 1:
        focus(window)
        window.type_keys("{ESC}")
        raise ZoomActionError("ask-to-unmute-item-not-found")
    press(groups[0][0])
    return {"changed": True}


def participant_rows(window):
    """Rows of the participants list, split into the waiting room and the
    meeting. Section headers ("Waiting room (2)") only exist while someone
    is waiting; the waiting room is then the first section."""
    lists = descendants(window, "List")
    if not lists:
        return []
    rows = descendants(lists[0], "ListItem")
    headers = [i for i, row in enumerate(rows) if re.search(r"\(\d+\)", name_of(row).split(",")[0])]
    result = []
    for index, row in enumerate(rows):
        if index in headers:
            continue
        section = "meeting"
        if len(headers) >= 2 and headers[0] < index < headers[1]:
            section = "waiting"
        texts = [name_of(t) for t in descendants(row, "Text") if name_of(t)]
        result.append(
            {
                "details": name_of(row),
                "element": row,
                "name": texts[0] if texts else first_segment(name_of(row)),
                "section": section,
            }
        )
    return result


def participants():
    window = require_meeting_window()
    open_participants_panel(window)
    rows = participant_rows(window)
    return {"participants": [{k: v for k, v in row.items() if k != "element"} for row in rows]}


def waiting_row(window, name):
    for row in participant_rows(window):
        if row["section"] == "waiting" and row["name"] == name:
            return row
    return None


def admit(names):
    """Admit waiting participants by name (everyone waiting, if no names).
    Each waiting row reveals its "Admit" button only while hovered, and the
    list reshuffles after every admission, so rows are looked up afresh."""
    window = require_meeting_window()
    open_participants_panel(window)
    waiting = [
        row["name"]
        for row in participant_rows(window)
        if row["section"] == "waiting" and (not names or row["name"] in names)
    ]
    admitted = []
    for name in dict.fromkeys(waiting):
        row = waiting_row(window, name)
        if not row:
            continue
        rect = row["element"].rectangle()
        focus(window)
        mouse.move(coords=(rect.mid_point().x, rect.mid_point().y))
        time.sleep(0.5)
        row = waiting_row(window, name)
        buttons = [b for b in descendants(row["element"], "Button") if name_of(b)] if row else []
        if not buttons:
            continue
        press(buttons[0])
        if wait_for(lambda: waiting_row(window, name) is None, timeout=5):
            admitted.append(name)
    return {"admitted": admitted, "changed": bool(admitted)}


# --- Screen sharing ---------------------------------------------------------


def share_entries():
    """Toolbar buttons and "More" menu entries, for the user to pick which
    one is Share (its name depends on their Zoom language)."""
    window = require_meeting_window()
    entries = [
        first_segment(name_of(b))
        for b in toolbar_buttons(window)
        if not has_hotkey(name_of(b), HOTKEY_AUDIO) and not has_hotkey(name_of(b), HOTKEY_VIDEO)
    ]
    more = descendants(control_panel(window), "MenuItem")
    if more:
        focus(window)
        more[-1].click_input()
        grid = wait_for_window(MORE_GRID_CLASS, timeout=4)
        if grid:
            entries += [grid_entry_name(item) for item in descendants(grid, "TabItem")]
            focus(window)
            window.type_keys("{ESC}")
    return {"entries": [entry for entry in dict.fromkeys(entries) if entry]}


def grid_entry_name(item):
    """'Partager ligne 1, colonne 3 3 sur 14 épinglé' -> 'Partager': drops
    the translated "row R, column C, N of M, pinned" suffix by its shape."""
    name = name_of(item)
    match = GRID_POSITION_SUFFIX.match(name)
    return match.group(1).strip() if match else first_segment(name)


def open_share_picker(window, share_title):
    if top_windows(SHARE_PICKER_CLASS):
        return
    wanted = first_segment(share_title)
    if wanted:
        for button in toolbar_buttons(window):
            if first_segment(name_of(button)) == wanted:
                focus(window)
                press(button)
                return
        more = descendants(control_panel(window), "MenuItem")
        if more:
            focus(window)
            more[-1].click_input()
            grid = wait_for_window(MORE_GRID_CLASS, timeout=4)
            for item in descendants(grid, "TabItem") if grid else []:
                if grid_entry_name(item) == wanted or name_of(item).startswith(wanted):
                    item.click_input()
                    return
            focus(window)
            window.type_keys("{ESC}")
        raise ZoomActionError("share-button-not-found")
    # Nothing captured: try Zoom's default share shortcut.
    focus(window)
    window.type_keys(HOTKEY_DEFAULT_SHARE)


def start_share(window_title, share_title):
    if is_sharing():
        return {"changed": False}
    window = require_meeting_window()
    open_share_picker(window, share_title)
    picker = wait_for_window(SHARE_PICKER_CLASS)
    if not picker:
        raise ZoomActionError("share-picker-not-found")

    def find_target():
        for item in descendants(picker, "ListItem"):
            if name_of(item) == window_title:
                return item
        return None

    target = wait_for(find_target, timeout=4)
    if not target:
        raise ZoomActionError("window-to-share-not-found")
    target.click_input()  # list items don't support SelectionItem
    time.sleep(0.3)
    # Share sound, then Optimize for video clips, in every language.
    for checkbox in descendants(picker, "CheckBox")[:2]:
        set_checked(checkbox, True)
    buttons = descendants(picker, "Button")
    if not buttons:
        raise ZoomActionError("share-confirm-not-found")
    press(buttons[-1])
    if not wait_for(is_sharing):
        raise ZoomActionError("share-not-started")
    return {"changed": True}


def stop_share():
    toolbars = top_windows(SHARE_TOOLBAR_CLASS)
    if not toolbars:
        return {"changed": False}
    # "Stop share" is the last share-toolbar button that shows a shortcut.
    buttons = [b for b in descendants(toolbars[0], "Button") if TRAILING_HOTKEY.search(name_of(b))]
    if not buttons:
        raise ZoomActionError("stop-share-button-not-found")
    press(buttons[-1])
    if not wait_for(lambda: not is_sharing()):
        raise ZoomActionError("share-not-stopped")
    return {"changed": True}


# --- HTTP -------------------------------------------------------------------


def respond(action):
    with uia_lock:
        try:
            return jsonify({"ok": True, **action()})
        except ZoomActionError as error:
            return jsonify({"error": str(error), "ok": False})
        except Exception as error:
            print(f"Zoom helper error: {traceback.format_exc()}", flush=True)
            return jsonify({"error": f"unexpected:{error}", "ok": False}), 500


def body():
    return request.get_json(silent=True) or {}


@app.before_request
def require_token():
    supplied = request.headers.get(AUTH_HEADER, "")
    if not AUTH_TOKEN or not hmac.compare_digest(supplied, AUTH_TOKEN):
        return jsonify({"error": "unauthorized", "ok": False}), 401
    return None


@app.get("/health")
def health_route():
    return jsonify({"ok": True})


@app.get("/meeting")
def meeting_route():
    return respond(lambda: {"meeting": meeting_state()})


@app.post("/audio/join")
def join_audio_route():
    return respond(join_audio)


@app.post("/audio/leave")
def leave_audio_route():
    return respond(leave_audio)


@app.post("/video")
def video_route():
    data = body()
    return respond(lambda: set_video(bool(data.get("on")), data.get("onTitle"), data.get("offTitle")))


@app.get("/video/title")
def video_title_route():
    return respond(video_title)


@app.post("/participants/mute-all")
def mute_all_route():
    allow = bool(body().get("allowSelfUnmute"))
    return respond(lambda: mute_all(allow))


@app.post("/participants/ask-all-to-unmute")
def ask_all_to_unmute_route():
    return respond(ask_all_to_unmute)


@app.get("/participants")
def participants_route():
    return respond(participants)


@app.post("/participants/admit")
def admit_route():
    names = body().get("names") or []
    return respond(lambda: admit(names))


@app.get("/share/entries")
def share_entries_route():
    return respond(share_entries)


@app.post("/share/start")
def start_share_route():
    data = body()
    return respond(lambda: start_share(data.get("windowTitle"), data.get("shareButtonTitle")))


@app.post("/share/stop")
def stop_share_route():
    return respond(stop_share)


if __name__ == "__main__":
    if not AUTH_TOKEN:
        raise SystemExit("ZOOM_HELPER_TOKEN must be set")
    # Let waitress bind with port=0 so the OS picks and reserves a free port
    # atomically for this process. This avoids the race in "pick a port first,
    # close socket, then serve(port=...)" patterns.
    server = create_server(app, host="127.0.0.1", port=0)
    print(f"ZOOM_HELPER_PORT={server.effective_port}", flush=True)
    server.run()
