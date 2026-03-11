# uia_helper.py
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
        print(f"Legacy properties: {legacy_properties}")
        print(f"Legacy properties: {legacy_properties['Help']}")
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


@app.route("/windows", methods=["GET"])
def list_windows():
    try:
        windows = Desktop(backend="uia").windows()
        result = []
        for w in windows:
            title = w.window_text()
            class_name = w.class_name()

            # Filter for Zoom windows
            is_zoom = class_name in [
                "ConfMultiTabContentWndClass",
                "WCN_ModelessWnd",
                "zJoinAudioWndClass",
                "ZPMeetingWndClass",
            ]

            print(w, w.class_name())

            if is_zoom:
                result.append(
                    {
                        "title": title or "",
                        "handle": w.handle,
                        "pid": w.process_id(),
                        "class_name": class_name,
                    }
                )
        return jsonify({"success": True, "result": result})
    except Exception as e:
        print(f"Error in list_windows: {traceback.format_exc()}")
        return jsonify({"success": False, "error": str(e)}), 500


# List all children of a window (buttons, text elements, panes, etc.)
# @app.route("/window_children", methods=["GET"])
# def window_children():
#     window_handle = request.args.get("window_handle")
#     if not window_handle:
#         return jsonify({"success": False, "error": "window_handle is required"}), 400
#     try:
#         win = Desktop(backend="uia").window(handle=int(window_handle))
#         descendants = win.descendants()
#         result = [get_element_data(d) for d in descendants if d.window_text()]
#         print(f"Found {len(result)} descendants with text")
#         return jsonify({"success": True, "result": result})
#     except Exception as e:
#         print(f"Error in window_children: {traceback.format_exc()}")
#         return jsonify({"success": False, "error": str(e)}), 500


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
            # Find the parent element first
            parent_win = Desktop(backend="uia").window(handle=int(parent_handle))
            search_criteria["parent"] = parent_win.element_info

        elements = findwindows.find_elements(**search_criteria)
        if not elements:
            raise Exception("Not found")

        # Use first match
        win = Desktop(backend="uia").window(handle=elements[0].handle)
    except Exception as e:
        error_msg = f"Dialog with class {class_name} not found relative to parent {parent_handle}: {str(e)}\n{traceback.format_exc()}"
        print(f"Error in dialog_children: {error_msg}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                }
            ),
            500,
        )

    descendants = win.descendants()
    result = [get_element_data(d) for d in descendants if d.window_text()]
    print(f"Found {len(result)} descendants for class {class_name}")
    return jsonify({"success": True, "result": result})


# Find button by text in a specified window handle and click it
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
        descendants = win.descendants()

        for d in descendants:
            try:
                # Check help text for controlID
                help_text = ""
                try:
                    legacy_properties = d.legacy_properties()
                    print(legacy_properties)
                    help_text = legacy_properties.get("Help", "")
                except:
                    help_text = ""

                if help_text and f'"{control_id}"' in help_text:
                    return jsonify({"success": True, "title": d.window_text()})
            except:
                continue

        return jsonify(
            {
                "error": f"Element with controlID {control_id} not found",
                "success": False,
            }
        ), 404

    except Exception as e:
        print(f"Error in get_element_title: {traceback.format_exc()}")
        return (
            jsonify(
                {
                    "error": str(e),
                    "success": False,
                    "traceback": traceback.format_exc(),
                }
            ),
            500,
        )


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

    # Find the target element
    try:
        btn = None
        
        # 1. Try by handle if provided
        if target_handle:
            try:
                btn = Desktop(backend="uia").window(handle=int(target_handle))
            except:
                btn = None
        
        # 2. Otherwise search within parent window
        if not btn and window_handle:
            win = Desktop(backend="uia").window(handle=int(window_handle))
            
            if control_id:
                # Search by control_id in descendants
                descendants = win.descendants()
                for d in descendants:
                    elem_data = get_element_data(d)
                    if elem_data.get("control_id") == control_id:
                        btn = d
                        break

            if not btn and button_text:
                # Try smarter search for button_text in descendants if child_window fails or to be more generic
                # First try child_window for speed
                try:
                    # Try it as a button first
                    btn = win.child_window(title_re=f".*{button_text}.*", control_type="Button")
                    if not btn.exists():
                        btn = None
                except:
                    btn = None
                
                if not btn:
                    # Fallback: search all descendants for matching title
                    descendants = win.descendants()
                    for d in descendants:
                        if d.window_text() == button_text:
                            btn = d
                            break

        if not btn:
            raise Exception("Element not found")

        btn.click_input()
        return jsonify({"success": True})
    except Exception as e:
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in click_button: {error_msg}")
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
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in send_keys: {error_msg}")
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5000)
