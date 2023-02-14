# Changelog

## 23.2.1

### New or improved features

- 🚀 Videos can now be added directly from JW.org! Useful, for example, to add Governing Body Update videos for presentation during midweek meetings
- 🚀 Added subheadings to presentation mode, simplifying navigation between meeting parts
- Added a representation of the mouse cursor while presenting JW.org on the external monitors (still a beta feature)
- Option to automatically play the first media item a predetermined number of minutes before a meeting's start
- Option to manually reconnect to OBS Studio while in presentation mode
- Zooming and panning a picture will now be done more gradually on the external monitors, to avoid abrupt picture motion for the audience
- Several enhancements to the subtitle feature
- Several minor UI improvements

### Bug fixes

- Only try to create new directories on synchronization server once per save action
- Prevent closing M³ when presenting JW.org
- When a directory is locked on synchronization server, show a friendly warning
- System theme will now be used on the initial congregation selection screen 

## 23.2.0

### New or improved features

- 🚀 New field which allows selecting the date of the next visit of the Circuit Overseer; when that week comes, the midweek meeting will change to Tuesday automatically and unnecessary media (concluding songs and CBS media) will be skipped as well
- Added a loading indicator while files are being renamed
- Improved app icon for MacOS (thanks [@advenimus](https://github.com/advenimus)!)
- Improved media prefixes for weekend meetings (reserve `01` for public talk opening song, and `02` for public talk images)

### Bug fixes

- Allow to clear Zoom scene
- Catch download errors and show friendly warnings
- Correctly parse synchronization server response
- Disable pause button until video started
- Fixed some spelling mistakes
- Show a friendly warning when a directory can not be accessed

## 23.1.1

### New or improved features

- 🚀 A new OBS scene selector for making the display of Zoom participants easier (see [#987](https://github.com/sircharlo/meeting-media-manager/pull/987) and [#1022](https://github.com/sircharlo/meeting-media-manager/pull/1022) for details)
- 🚀 You can now set a custom cache location to store publications and media cache
- Added informational icons with tooltips for settings that are not immediately clear
- New language: Slovak (thanks [@madroots](https://github.com/madroots)!)
- New language: Ukrainian (thanks [@mchaplyak](https://github.com/mchaplyak)!)
- Small UI improvements

### Bug fixes

- Better checks for OBS integration
- Fixed the logic to recognize printed images
- Force refresh of yeartext and fonts the when clearing the cache
- Media from the _Enjoy Life Forever_ brochure is correctly ignored again when appropriate
- Show a warning when the media folder could not be opened automatically from M³
- Show a warning when the yeartext is not available in your language
- The media window no longer has rounded corners in windowed mode for macOS (thanks [@riggles](https://github.com/riggles)!)
- Video scrubber correctly shows progress when pausing a video
- When starting shuffle music more than one hour before the meeting, the countdown now works correctly
- Several other small bug fixes

## 23.1.0

### New or improved features

- 🚀 A song can now be added to the media list directly from the media presentation screen, for use during meetings
- 🚀 Added option to include printed media whenever available
- Images from _lff_ for parts other than the Congregation Bible Study can once again be excluded
- Improved the look and feel of the settings screen
- "Click again" tooltips now stay visible when clicked, making it clear that a second click is required
- _Enjoy Life Forever_ videos are now only included during the Congregation Bible Study
- Added a clear warning when a file is locked on a congregation server

### Bug fixes

- Correctly sort folders and files in the congregation sync directory tree
- Fixed incorrect filename sorting when adding or uploading media files
- Delete/hide actions in congregation server are now only activated on corresponding button click, and not filename click
- Fixed an issue where media from some JWPUB files wouldn't be imported properly in some edge cases
- Fixed an issue where the wrong language for media would be used in some edge cases
- Refresh languages from JW.org when they were not correctly fetched before
- Set OBS Studio scene correctly when using keyboard shortcuts
- Fixed an issue where the OBS Studio scene would sometimes be set to "nothing"
- Clear download and cache statistics after every media sync
