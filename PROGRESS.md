# TODOS

- [ ] Check if build artifacts work correctly for Windows and MacOS
- [ ] Convert flash to notify system with action buttons
- [ ] Fix how recurring media works
- [ ] Make progress slider draggable when paused to change current progress / video scrubber??
- [ ] Test for 3 displays
- [X] Add local JWPUB file media to media list
- [X] Add played and video progress visuals to present page
- [X] Congregation sync
- [X] Edit local filename option
- [X] Electron windows setup
- [X] Functionality to add local files to media list
- [X] Get meeting media from jw.org
- [X] Improve type definitions with combined MediaFile type
- [X] Make sure light mode looks good as well
- [X] Media webpage
- [X] OBS integration
- [X] Option to add multiple local files at once
- [X] Option to drag and drop files to add them to the media list
- [X] Presentation mode
- [X] Recurring media functionality
- [X] Save preferences locally
- [X] Set custom start and end times for videos
- [X] Shuffle music
- [X] Support for external display
- [X] VLC / MP4 / PDF / SVG support

## In Progress

- Nothing at the moment

## Known Bugs

- Volume animation on musicFadeOut does not work

## Bug Fixes

- Setting custom media background works instantly
- Correctly set app icon for Linux

## New Features

- Using electron-store instead of home grown version
- Using webdav client instead of home grown version
- Use translation for song and paragraph in file names
- Auto rename media when switching local language (also on cong server)
- Auto rename meeting folders when switching date format (also on cong server)
- Auto rename mediaList keys when switching date format
- Prevent duplicate media from being added to media list by checking safeNames without prefix
