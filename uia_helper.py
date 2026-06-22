import json
import traceback
from time import monotonic

from pywinauto import Application, Desktop, findwindows
from flask import Flask, jsonify, request
from waitress import create_server

app = Flask(__name__)
ZOOM_WINDOW_CLASS_NAMES = {
    "ConfMultiTabContentWndClass",
    "WCN_ModelessWnd",
    "zChangeNameWndClass",
    "ZGridMultiLevelPopupWndClass",
    "zJoinAudioWndClass",
    "ZPFloatToolbarClass",
    "ZPShareEntranceClass",
    "ZPMeetingWndClass",
}
MAIN_WINDOW_CACHE_TTL_SECONDS = 2
DESCENDANT_CACHE_TTL_SECONDS = 2

_main_window_cache = {}
_descendants_cache = {}


def get_element_data(element):
    data = {
        "title": element.window_text(),
        "handle": element.handle,
        "pid": element.process_id(),
        "class_name": element.class_name(),
        "control_type": element.friendly_class_name(),
    }
    # Help text often contains Zoom-specific JSON with controlID
    help_text = ""
    try:
        legacy_properties = element.legacy_properties()
        help_text = legacy_properties["Help"]
    except Exception:
        pass
    data["help_text"] = help_text

    if help_text and help_text.startswith("{"):
        try:
            help_json = json.loads(help_text)
            if "controlID" in help_json:
                data["control_id"] = help_json["controlID"]
            if "isEnabled" in help_json:
                data["is_enabled"] = help_json["isEnabled"]
        except Exception:
            pass
    return data


def _cache_key(win):
    return f"{win.process_id()}:{win.handle}"


def _extract_control_id_from_help(help_text):
    if not help_text or not help_text.startswith("{"):
        return None
    try:
        help_json = json.loads(help_text)
        return help_json.get("controlID")
    except Exception:
        return None


def _get_descendant_index(win, force_refresh=False):
    cache_key = _cache_key(win)
    now = monotonic()
    cached = _descendants_cache.get(cache_key)
    if (
        not force_refresh
        and cached
        and now - cached["timestamp"] < DESCENDANT_CACHE_TTL_SECONDS
    ):
        return cached["value"]

    descendants = []
    by_control_id = {}
    by_exact_text = {}
    for d in win.descendants():
        try:
            text = d.window_text()
        except Exception:
            text = ""

        control_id = None
        try:
            control_id = _extract_control_id_from_help(
                d.legacy_properties().get("Help", "")
            )
        except Exception:
            pass

        descendants.append(d)
        if control_id and control_id not in by_control_id:
            by_control_id[control_id] = d
        if text and text not in by_exact_text:
            by_exact_text[text] = d

    value = {
        "descendants": descendants,
        "by_control_id": by_control_id,
        "by_exact_text": by_exact_text,
    }
    _descendants_cache[cache_key] = {"timestamp": now, "value": value}
    return value


def _find_element_by_handle(target_handle):
    try:
        return Desktop(backend="uia").window(handle=int(target_handle))
    except Exception:
        return None


def _find_element_by_control_id(win, control_id):
    if not control_id:
        return None
    index = _get_descendant_index(win)
    if control_id in index["by_control_id"]:
        return index["by_control_id"][control_id]

    index = _get_descendant_index(win, force_refresh=True)
    return index["by_control_id"].get(control_id)


def _find_element_by_text(win, button_text):
    if not button_text:
        return None
    try:
        btn = win.child_window(title_re=f".*{button_text}.*", control_type="Button")
        if btn.exists():
            return btn
    except Exception:
        pass

    index = _get_descendant_index(win)
    if button_text in index["by_exact_text"]:
        return index["by_exact_text"][button_text]

    for d in index["descendants"]:
        if d.window_text() == button_text:
            return d
    return None


def _find_element_in_parent(window_handle, control_id, button_text):
    win = Desktop(backend="uia").window(handle=int(window_handle))

    if control_id:
        btn = _find_element_by_control_id(win, control_id)
        if btn:
            return btn

    if button_text:
        return _find_element_by_text(win, button_text)

    return None


@app.route("/windows", methods=["GET"])
def list_windows():
    target_class_name = request.args.get("class_name")

    def get_zoom_windows(class_name_filter=None):
        windows = Desktop(backend="uia").windows()
        res = []
        for w in windows:
            class_name = w.class_name()
            # Filter for Zoom windows or the requested class name
            if class_name_filter:
                is_match = class_name == class_name_filter
            else:
                is_match = class_name in ZOOM_WINDOW_CLASS_NAMES
            if is_match:
                is_main = False
                if class_name == "ConfMultiTabContentWndClass":
                    try:
                        cache_key = _cache_key(w)
                        now = monotonic()
                        cached = _main_window_cache.get(cache_key)
                        if (
                            cached
                            and now - cached["timestamp"] < MAIN_WINDOW_CACHE_TTL_SECONDS
                        ):
                            is_main = cached["value"]
                        else:
                            # Main Zoom window has descendant with class ZPControlPanelClass
                            win_spec = Desktop(backend="uia").window(handle=w.handle)
                            is_main = win_spec.child_window(
                                class_name="ZPControlPanelClass"
                            ).exists()
                            _main_window_cache[cache_key] = {
                                "timestamp": now,
                                "value": is_main,
                            }
                    except Exception:
                        pass
                res.append(
                    {
                        "title": w.window_text() or "",
                        "handle": w.handle,
                        "pid": w.process_id(),
                        "class_name": class_name,
                        "main_zoom_window": is_main,
                    }
                )
        return res

    try:
        result = get_zoom_windows(target_class_name)

        # If no main window found, try toggling Alt key to show controls (only for Zoom windows)
        if (
            not target_class_name
            and result
            and not any(w["main_zoom_window"] for w in result)
        ):
            # Try to send Alt to a ConfMultiTabContentWndClass first
            candidates = [
                w for w in result if w["class_name"] == "ConfMultiTabContentWndClass"
            ]
            if not candidates:
                candidates = result

            for w_info in candidates:
                try:
                    w = Desktop(backend="uia").window(handle=w_info["handle"])
                    w.set_focus()
                    w.type_keys("%")  # Alt key
                    result = get_zoom_windows()
                    # if any(w["main_zoom_window"] for w in result):
                    #    break
                except Exception:
                    continue
        return jsonify({"success": True, "result": result})
    except Exception as e:
        print(f"Error in list_windows: {traceback.format_exc()}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/dialog_children", methods=["GET"])
def dialog_children():
    class_name = request.args.get("class_name")
    parent_handle = request.args.get("parent_handle")
    if not class_name:
        return jsonify({"success": False, "error": "class_name is required"}), 400

    try:
        if parent_handle:
            parent_win = Desktop(backend="uia").window(handle=int(parent_handle))
            descendants = parent_win.descendants()
            scoped_matches = [d for d in descendants if d.class_name() == class_name]
            if not scoped_matches:
                raise LookupError(f"No elements found for class '{class_name}'")
            win = Desktop(backend="uia").window(handle=scoped_matches[0].handle)
        else:
            elements = findwindows.find_elements(
                class_name=class_name,
                backend="uia",
                top_level_only=False,
            )
            if not elements:
                raise LookupError(f"No elements found for class '{class_name}'")
            win = Desktop(backend="uia").window(handle=elements[0].handle)
    except Exception as e:
        error_msg = f"Dialog with class {class_name} not found relative to parent {parent_handle}: {str(e)}\n{traceback.format_exc()}"
        print(f"Error in dialog_children: {error_msg}")
        return jsonify({"success": False, "error": str(e)}), 500

    descendants = win.descendants()
    result = [get_element_data(d) for d in descendants if d.window_text()]
    return jsonify({"success": True, "result": result})


@app.route("/get_element_title", methods=["GET"])
def get_element_title():
    try:
        window_handle = request.args.get("window_handle", type=int)
        control_id = request.args.get("control_id")

        if not window_handle or not control_id:
            return (
                jsonify(
                    {
                        "error": "window_handle and control_id are required",
                        "success": False,
                    }
                ),
                400,
            )

        win = Desktop(backend="uia").window(handle=window_handle)
        target = _find_element_by_control_id(win, control_id)
        if target:
            return jsonify({"success": True, "title": target.window_text()})

        return jsonify(
            {
                "error": f"Element with controlID {control_id} not found",
                "success": False,
            }
        ), 404

    except Exception as e:
        print(f"Error in get_element_title: {traceback.format_exc()}")
        return jsonify({"error": str(e), "success": False}), 500


@app.route("/get_element_state", methods=["GET"])
def get_element_state():
    try:
        window_handle = request.args.get("window_handle", type=int)
        control_id = request.args.get("control_id")

        if not window_handle or not control_id:
            return (
                jsonify(
                    {
                        "error": "window_handle and control_id are required",
                        "success": False,
                    }
                ),
                400,
            )

        win = Desktop(backend="uia").window(handle=window_handle)
        target = _find_element_by_control_id(win, control_id)

        if not target:
            return jsonify(
                {
                    "error": f"Element with controlID {control_id} not found",
                    "success": False,
                }
            ), 404

        state = {}
        try:
            # Try TogglePattern first: 0=off, 1=on, 2=indeterminate
            state["toggle_state"] = target.get_toggle_state()
        except Exception:
            pass

        try:
            # Fallback to LegacyIAccessible state
            legacy = target.legacy_properties()
            state["legacy_state"] = legacy.get("State")
            state["value"] = legacy.get("Value")
        except Exception:
            pass

        return jsonify({"success": True, "state": state})

    except Exception as e:
        print(f"Error in get_element_state: {traceback.format_exc()}")
        return jsonify({"error": str(e), "success": False}), 500


@app.route("/click_button", methods=["POST"])
def click_button():
    data = request.json
    window_handle = data.get("window_handle")
    button_text = data.get("button")
    control_id = data.get("control_id")
    target_handle = data.get("handle")

    if not window_handle and not target_handle:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "window_handle (parent) or target_handle is required",
                }
            ),
            400,
        )

    try:
        btn = _find_element_by_handle(target_handle) if target_handle else None

        if not btn and window_handle:
            btn = _find_element_in_parent(window_handle, control_id, button_text)

        if not btn:
            raise LookupError("Element not found")

        btn.click_input()
        return jsonify({"success": True})
    except Exception as e:
        print(f"Error in click_button: {traceback.format_exc()}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/send_keys", methods=["POST"])
def send_keys():
    data = request.json
    window_handle = data.get("window_handle")
    keys = data.get("keys")
    if not window_handle or not keys:
        return (
            jsonify({"success": False, "error": "window_handle and keys are required"}),
            400,
        )

    try:
        app_obj = Application(backend="uia").connect(handle=int(window_handle))
        win = app_obj.window(handle=int(window_handle))
        win.set_focus()
        win.type_keys(keys)
        return jsonify({"success": True})
    except Exception as e:
        print(f"Error in send_keys: {traceback.format_exc()}")
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    # Let waitress bind with port=0 so the OS picks and reserves a free port
    # atomically for this process. This avoids the race in "pick a port first,
    # close socket, then serve(port=...)" patterns.
    server = create_server(app, host="127.0.0.1", port=0)
    print(f"ZOOM_HELPER_PORT={server.effective_port}", flush=True)
    server.run()
