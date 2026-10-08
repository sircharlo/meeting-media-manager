# Live Zoom test (local only)

`yarn test:zoom-live` checks the Zoom Meeting Manager against the real Zoom
desktop app on your computer. It runs every action M³ performs (join/leave
computer audio, host video on/off, mute everyone with and without
self-unmute, ask everyone to unmute, both meeting sequences, sharing the media
window) and verifies each one from the host's Zoom window and from the test
participants' side.

It never runs in CI or in `yarn test:unit`. The same checks are available in
development builds from the Zoom popup ("Test Zoom integration").

> Use a test meeting you host, never a real congregation meeting: the test
> mutes everyone, admits people from the waiting room, and shares a window.

## Requirements

- Windows, with the Zoom desktop app signed in as the host of the test
  meeting.
- Python with the helper's packages: `python -m pip install -r requirements.txt`.
- Google Chrome (the test participants run in it, through Playwright).

## Setup

Create `.env.zoom-test` at the repo root (it's gitignored):

```ini
ZOOM_TEST_MEETING_ID=1234567890
ZOOM_TEST_PASSCODE=1234
# 0-5 browser participants joining through Zoom's web client
ZOOM_TEST_PARTICIPANTS=3
# Names of Zoom's controls in YOUR Zoom language (what M³'s Settings
# capture). The video steps are skipped without the two video names.
ZOOM_TEST_VIDEO_ON_TITLE=Stop Video
ZOOM_TEST_VIDEO_OFF_TITLE=Start Video
ZOOM_TEST_SHARE_BUTTON_TITLE=Share
```

## Running

```sh
yarn test:zoom-live
```

Don't use the mouse or keyboard while it runs (about 3-5 minutes): Zoom only
reacts to some controls through real clicks, and focus changes close its
menus. The test starts the meeting if it isn't open, opens a stand-in
"Media Player - M³" window to share, and the participants leave at the end.

Pieces you can also run on their own:

- `node scripts/zoom-live/participants.mjs [count]` keeps test participants
  in the meeting and prints a local control port (see the script's header).
- `python scripts/zoom-live/fake-media-window.py` opens the stand-in media
  window.

## Troubleshooting

- **"Zoom turned the test participants away"**: Zoom's web client sometimes
  rejects automated browsers, more often after many joins in a short time.
  The participants retry a few times; wait a while and run it again.
- **The meeting ends after 40 minutes**: a free Zoom account limits meetings
  with three or more people. Rerun the test; it starts a new meeting.
- **A step fails after a Zoom update**: Zoom's window classes or the order of
  its controls may have changed. `uia_helper.py` explains what each action
  relies on.
