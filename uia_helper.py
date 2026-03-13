import json
import traceback

from flask import Flask, jsonify, request
from pywinauto import Application, Desktop, findwindows

app = Flask(__name__)


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
        # print(f"Legacy properties: {legacy_properties}")
        # print(f"Legacy properties: {legacy_properties['Help']}")
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


def _find_element_by_handle(target_handle):
    try:
        return Desktop(backend="uia").window(handle=int(target_handle))
    except Exception:
        return None


def _find_element_by_control_id(win, control_id):
    for d in win.descendants():
        if get_element_data(d).get("control_id") == control_id:
            return d
    return None


def _find_element_by_text(win, button_text):
    try:
        btn = win.child_window(title_re=f".*{button_text}.*", control_type="Button")
        if btn.exists():
            return btn
    except Exception:
        pass

    for d in win.descendants():
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
    def get_zoom_windows():
        windows = Desktop(backend="uia").windows()
        res = []
        for w in windows:
            class_name = w.class_name()
            # Filter for Zoom windows
            is_zoom = class_name in [
                "ConfMultiTabContentWndClass",
                "WCN_ModelessWnd",
                "zChangeNameWndClass",
                "zJoinAudioWndClass",
                "ZPMeetingWndClass",
            ]
            if is_zoom:
                is_main = False
                if class_name == "ConfMultiTabContentWndClass":
                    try:
                        # Create a WindowSpecification from the handle to use child_window
                        # Main Zoom window has a descendant with class ZPControlPanelClass (can be several levels deep)
                        win_spec = Desktop(backend="uia").window(handle=w.handle)
                        is_main = win_spec.child_window(
                            class_name="ZPControlPanelClass"
                        ).exists()
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
        result = get_zoom_windows()

        # If no main window found, try toggling Alt key to show controls
        if result and not any(w["main_zoom_window"] for w in result):
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
                    if any(w["main_zoom_window"] for w in result):
                        break
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
        search_criteria = {
            "class_name": class_name,
            "backend": "uia",
            "top_level_only": False,
        }
        if parent_handle:
            parent_win = Desktop(backend="uia").window(handle=int(parent_handle))
            search_criteria["parent"] = parent_win.element_info

        elements = findwindows.find_elements(**search_criteria)
        if not elements:
            raise LookupError(f"No elements found for class '{class_name}'")

        win = Desktop(backend="uia").window(handle=elements[0].handle)
    except Exception as e:
        error_msg = f"Dialog with class {class_name} not found relative to parent {parent_handle}: {str(e)}\n{traceback.format_exc()}"
        print(f"Error in dialog_children: {error_msg}")
        return jsonify({"success": False, "error": str(e)}), 500

    descendants = win.descendants()
    result = [get_element_data(d) for d in descendants if d.window_text()]
    print(f"Found {len(result)} descendants for class {class_name}")
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

        for d in win.descendants():
            try:
                try:
                    legacy_properties = d.legacy_properties()
                    print(legacy_properties)
                    help_text = legacy_properties.get("Help", "")
                except Exception:
                    help_text = ""

                if help_text and f'"{control_id}"' in help_text:
                    return jsonify({"success": True, "title": d.window_text()})
            except Exception:
                continue

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

        target = None
        for d in win.descendants():
            try:
                help_text = d.legacy_properties().get("Help", "")
                if help_text and f'"{control_id}"' in help_text:
                    target = d
                    break
            except Exception:
                continue

        if not target:
            return jsonify(
                {
                    "error": f"Element with controlID {control_id} not found",
                    "success": False,
                }
            ), 404

        state = {}
        try:
            # Try TogglePattern first
            state["toggle_state"] = target.get_toggle_state()  # 0=off, 1=on, 2=indet
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
    app.run(port=5000)
