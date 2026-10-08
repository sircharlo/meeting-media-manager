"""Stands in for M³'s media window during the live Zoom test: a window with
the same title (so Zoom's share picker lists it) and a changing colour, so a
share is visibly live. Closes itself after the given number of seconds.

Usage: python scripts/zoom-live/fake-media-window.py [seconds]
"""

import sys
import tkinter as tk

TITLE = "Media Player - M³"  # src/constants/zoom.ts MEDIA_WINDOW_TITLE
COLORS = ["#1f6feb", "#8957e5", "#2da44e", "#bf8700"]

seconds = int(sys.argv[1]) if len(sys.argv) > 1 else 900
root = tk.Tk()
root.title(TITLE)
root.geometry("640x360+40+40")
label = tk.Label(root, text="M³ test media window", font=("Segoe UI", 28), fg="white")
label.pack(expand=True, fill="both")


def tick(index=0):
    label.configure(bg=COLORS[index % len(COLORS)])
    root.after(1000, tick, index + 1)


tick()
root.after(seconds * 1000, root.destroy)
root.mainloop()
