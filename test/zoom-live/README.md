# Live Zoom test (local only)

`yarn test:zoom-live` checks the Zoom Meeting Manager against the real Zoom
desktop app on your computer:

- `zoom.live.test.ts` runs every action M³ performs (join/leave computer
  audio, host microphone and video on/off, mute everyone with and without
  self-unmute, ask everyone to unmute, both meeting sequences, sharing the
  media window) and verifies each one from the host's Zoom window and from
  the test participants' side.
- `zoom-startup.live.test.ts` runs the check M³ makes when it starts: it
  opens the meeting if needed and tests everything with the host alone, and
  only looks (pressing nothing anyone would notice) once others are in.
- `zoom-edge.live.test.ts` covers what real computers throw at it: Zoom's
  auto-hidden toolbar, a minimized Zoom window, every connected monitor,
  actions with nothing to do, a share picker so crowded that the media
  window is out of sight in it and partly covered by an always-on-top
  window (decoy windows, checking that the media window, and nothing else,
  gets shared), and side effects the helper must
  not have (moving the mouse at all, keeping focus, changing a Zoom
  setting).
- `zoom-hand.live.test.ts` covers raised hands: learning how Zoom marks one
  (with reactions on, and through Zoom's plain "Raise hand" button where
  they're turned off), learning again with the names M³ remembered, noticing
  a test participant's raised hand, and the ask-to-unmute and
  mute-and-lower-hand actions on that participant. Unlike the others, a
  failing step doesn't stop it: everything it saw is written to a report (see
  below), so a report from another Zoom language can be reproduced by
  switching this computer's Zoom to that language.

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
# capture). The microphone and video steps are skipped without their two
# names.
ZOOM_TEST_MIC_ON_TITLE=Mute
ZOOM_TEST_MIC_OFF_TITLE=Unmute
ZOOM_TEST_VIDEO_ON_TITLE=Stop Video
ZOOM_TEST_VIDEO_OFF_TITLE=Start Video
ZOOM_TEST_SHARE_BUTTON_TITLE=Share
# Only for zoom-hand.live.test.ts: the entry that raises a hand in YOUR Zoom
# language, as the setup assistant lists it (Portuguese "Levantar mão"). It is
# pressed once, as the user would pick it. Without it, that part is skipped:
# the test never guesses an entry, since the same list holds Record and
# Breakout rooms.
ZOOM_TEST_HAND_ENTRY=Raise hand
```

## Running

```sh
yarn test:zoom-live
```

Don't use the mouse or keyboard while it runs (about 3-5 minutes): one test
checks that the mouse never moves, admitting someone from the waiting room
takes a key press, and focus changes close Zoom's menus. The test starts the
meeting if it isn't open, opens a stand-in "Media Player - M³" window to
share, and the participants leave at the end.

## Reports

`zoom-hand.live.test.ts` writes what it saw to `reports/zoom-live/`
(gitignored, because it names this computer's Zoom controls and test
participants):

- `hand-<timestamp>.json`: every probe, in order, with what it was trying to
  find out (`wants`), whether it worked, how long it took, and Zoom's raw
  answer. `zoom` holds the other findings: M³'s Zoom names before and after
  learning (`settings.*`), the toolbar and "More" menu buttons (`entries`),
  Zoom's own wording for each participant (`rows`) and every control of a
  raised-hand row with its "More" menu (`inspect`). `verdicts` sums it up.
- `hand-<timestamp>.ndjson`: the same probes, one JSON object per line, for
  `jq` (for example `jq -r '.id + " " + .ok'`), plus the same one-line
  summary printed as it runs.

To compare with a report from another Zoom language, run it there and diff
the two files: the `phrase`, `handButtonTitle`, `reactButtonTitle` and
`lowerHandTitle` values are Zoom's own words, and a probe that failed carries
Zoom's `snapshot` (its toolbar names, the row's buttons and any dialog in the
way). Nothing is sent anywhere.

Pieces you can also run on their own:

- `node scripts/zoom-live/participants.mjs [count]` keeps test participants
  in the meeting until you stop it (Ctrl+C). While it runs, the tests and the
  in-app developer tool reuse those participants instead of joining new
  ones, which keeps Zoom from turning them away as a bot. The startup
  check's test with the host alone is skipped then.
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
