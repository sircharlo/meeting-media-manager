# Live Zoom test (local only)

`yarn test:zoom-live` checks the Zoom Meeting Manager against the real Zoom
desktop app on your computer:

- `zoom.live.test.ts` runs every action M³ performs (join/leave computer
  audio, host video on/off, mute everyone with and without self-unmute, ask
  everyone to unmute, both meeting sequences, sharing the media window) and
  verifies each one from the host's Zoom window and from the test
  participants' side.
- `zoom-edge.live.test.ts` covers what real computers throw at it: Zoom's
  auto-hidden toolbar, a minimized Zoom window, every connected monitor,
  actions with nothing to do, a share picker so crowded that the media
  window is out of sight in it and partly covered by an always-on-top
  window (decoy windows, checking that the media window, and nothing else,
  gets shared), and side effects the helper must
  not have (moving the mouse for good, keeping focus, changing a Zoom
  setting).

It never runs in CI or in `yarn test:unit`. The same checks are available in
development builds from the Zoom popup ("Test Zoom integration").

> Use a test meeting you host, never a real congregation meeting: the test
> mutes everyone, admits people from the waiting room, and shares a window.

## Requirements

- Windows, with the Zoom desktop app signed in as the host of the test
  meeting.
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
  in the meeting until you stop it (Ctrl+C). While it runs, the tests and the
  in-app developer tool reuse those participants instead of joining new
  ones, which keeps Zoom from turning them away as a bot.
- `powershell -ExecutionPolicy Bypass -File scripts/zoom-live/fake-media-window.ps1`
  opens the stand-in media window.

## Troubleshooting

- **"Zoom turned the test participants away"**: Zoom's web client sometimes
  rejects automated browsers, more often after many joins in a short time.
  The participants retry a few times; wait a while and run it again, and
  keep a participants session running between runs (see above).
- **The meeting ends after 40 minutes**: a free Zoom account limits meetings
  with three or more people. Rerun the test; it starts a new meeting.
- **A step fails after a Zoom update**: Zoom's window classes or the order of
  its controls may have changed. `src-electron/zoom-helper/ZoomHelper.cs`
  explains what each action relies on.
