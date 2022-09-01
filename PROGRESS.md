# TODOS

- [ ] Manage media: Allow to hide recurring media without cong server
- [ ] Release: Check if build artifacts work correctly for Windows and MacOS
- [ ] Test: test for 3 displays
- [ ] Test: test if auto updater works correctly
- [X] Cong sync: Allow navigation of cong sync folder through the treeview
- [X] Cong sync: Congregation sync
- [X] Cong sync: Sync custom media background when congregation sync is enabled
- [X] Manage media: Add local JWPUB file media to media list
- [X] Manage media: Edit local filename option
- [X] Manage media: Fix how recurring media works (currently unable to hide recurring media)
- [X] Manage media: Functionality to add local files to media list
- [X] Manage media: Option to add multiple local files at once
- [X] Manage media: Option to drag and drop files to add them to the media list
- [X] Manage media: Recurring media functionality
- [X] Media sync: Add missing sign language media (Some media is missing that is specific to sign language)
- [X] Media sync: Get meeting media from jw.org
- [X] Media sync: VLC / MP4 / PDF / SVG support
- [X] Misc: Add countdowns before auto sync/close
- [X] Misc: Convert flash to notify system with action buttons
- [X] Misc: Electron windows setup
- [X] Misc: Improve type definitions with combined MediaFile type
- [X] Misc: Save preferences locally
- [X] Misc: Shuffle music
- [X] Present media: Add media playback previous/next function from 22.8.0
- [X] Present media: Add played and video progress visuals to present page
- [X] Present media: Auto open meeting when first opening presentation mode if todays date it present or there is only one meeting
- [X] Present media: Implement video markers for sign language media
- [X] Present media: Make progress slider draggable when paused to change current progress / video scrubber
- [X] Present media: Media webpage
- [X] Present media: OBS integration
- [X] Present media: Presentation mode
- [X] Present media: Set custom start and end times for videos
- [X] Present media: Show OBS scenes as buttons when 6 or less from 22.8.0
- [X] Present media: Support for external display
- [X] Test: Make sure light mode looks good as well

## In Progress

- Nothing at the moment

## Known Bugs without immediate fix

- Volume animation on musicFadeOut does not work

## Bug Fixes

- Setting custom media background works instantly
- Correctly set app icon for Linux
- Download markers for sign language when adding a song with the song picker

## New Features

- DOCS: Documentation filter searches entire website and highlights results with yellow background
- DOCS: Documentation site now supports multiple languages. Time to translate my dear volunteers!
- MEDIA MANAGER: Auto determine drag and dropped file type (custom / jwpub)
- MEDIA SYNC: Auto remove hidden media if it was downloaded before
- MEDIA SYNC: Auto rename media when switching local language (also on cong server)
- MEDIA SYNC: Auto rename mediaList keys when switching date format
- MEDIA SYNC: Auto rename meeting folders when switching date format (also on cong server)
- MEDIA SYNC: Auto rename recurring files in other folders
- MEDIA SYNC: Prevent duplicate media from being added to media list by checking safeNames without prefix
- OBS: Auto detect scene change when changed from OBS directly
- OBS: Support for obs-websocket v5 (default is v4 for backwards compatibility, but can be changed in the settings)
- SETTINGS: Port field for cong sync is no longer necessary
- SETTINGS: Set your theme preference (light, dark, system) inside the app
- SETTINGS: Toggle password visibility

## Background Changes

- Implemented image html fraction in docs to make it easier to add an image
- Refactored docs to use sass instead of css
- Refactored the entire code base to be more stable and easier to maintain
- Using electron-store instead of home grown version
- Using webdav client instead of home grown version

The new documentation site is hosted [here](https://mtdvlpr.github.io/meeting-media-manager/en/)
