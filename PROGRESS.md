# TODOS

- [ ] Add media playback previous/next function from 22.8.0
- [ ] Add missing sign language media (Some media is missing that is specific to sign language)
- [ ] Allow navigation of cong sync folder through the treeview
- [ ] Check if build artifacts work correctly for Windows and MacOS
- [ ] Convert flash to notify system with action buttons
- [ ] Fix how recurring media works
- [ ] Implement video markers for sign language media
- [ ] Improve docs translations by using more localized strings like how M3 itself does it
- [ ] Make progress slider draggable when paused to change current progress / video scrubber
- [ ] Sync custom media background when congregation sync is enabled
- [ ] Test for 3 displays
- [ ] Test if auto updater works correctly
- [X] Add local JWPUB file media to media list
- [X] Add played and video progress visuals to present page
- [X] Auto open meeting when first opening presentation mode if todays date it present or there is only one meeting
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
- [X] Show OBS scenes as buttons when 6 or less from 22.8.0
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

- DOCS: Documentation filter searches entire website and highlights results with yellow background
- DOCS: Documentation site now supports multiple languages. Time to translate my dear volunteers!
- MEDIA SYNC: Auto rename media when switching local language (also on cong server)
- MEDIA SYNC: Auto rename mediaList keys when switching date format
- MEDIA SYNC: Auto rename meeting folders when switching date format (also on cong server)
- MEDIA SYNC: Prevent duplicate media from being added to media list by checking safeNames without prefix
- OBS: Auto detect scene change when changed from OBS directly
- SETTINGS: Port field for cong sync is no longer necessary

## Background Changes

- Implemented image html fraction in docs to make it easier to add an image
- Refactored docs to use sass instead of css
- Refactored the entire code base to be more stable and easier to maintain
- Using electron-store instead of home grown version
- Using webdav client instead of home grown version

The new documentation site is hosted [here](https://mtdvlpr.github.io/meeting-media-manager/en/)
