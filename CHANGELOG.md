# Changelog

## 23.4.1

### New or improved features

- More complete translations
- The main M3 window now allows for a smaller window width

### Bug fixes

- Correctly present media that has been sorted

## 23.4.0

### New or improved features

- Ability to force updates to install critical bug fixes when necessary

### Bug fixes

- Correctly download songs for Watchtower editions February 2023 and later
- Correctly download songs that appear multiple times per week
- Correctly toggle subtitle position
- Don't try to fetch media items on startup when offline
- Fix OBS optional image scene for `obs-websocket` V4

## 23.3.2

### Bug fixes

- Fix global layout bug for input fields
- Fix "select video from jw.org" feature not working in some use cases

## 23.3.1

### New or improved features

- The tabs in settings have an icon for easier recognition
- Zoom and pan has been reworked to be accurate whether using the mousewheel or double click

### Bug fixes

- Don't try to fetch non-existing meeting media for the week of the Memorial
- Subtitles are now individually rendered according to their intended positions by default
- Zoom and pan is now reset when changing or "stopping" pictures
- Various minor bugfixes

## 23.3.0

### New or improved features

- 🚀 Zoom integration! Automate various Zoom actions, like toggling video/microphone/spotlight or allow to unmute (see [#1303](https://github.com/sircharlo/meeting-media-manager/pull/1303) for details). It's still a beta feature, so make sure you test it thoroughly before use during meetings. Also, always verify that the automation was executed successfully.
- A new optional setting to configure a OBS Studio scene to be used for showing images (useful to show a picture-in-picture style overlay)
- New language: Romanian (thanks [@baciucristian](https://github.com/baciucristian)!)
- New prefix schema: `{heading number}-{part number}-{media number}`. Media for the _Treasures_ section starts with `01`, _Apply Yourselves_ starts with `02`, and _Living as Christians_ with `03`.
- Support showing `.jfif` images

### Bug fixes

- Always link to the correct M³ release from the update notification and settings screen.
- Correctly install beta updates on macOS
- Ignore `.title` files when converting media to MP4

## 23.2.2

### New or improved features

- 🚀 Quickly access the manage media screen while presenting (top bar > `⋮` > `Manage media`)
- 🚀 Option to automatically start playing background music before meetings
- Added an option to enable beta updates
- Improved the video custom start/end time feature
- Ability to start playing the first media item a custom number of minutes and seconds before the meeting starts
- When presenting JW.org, the website controller will now more accurately depict what is shown on the media window
- The circuit overseer date picker now allows selecting Tuesdays, and weeks will start on the correct day depending on the user's language
- Several UX improvements

### Bug fixes

- Activate OBS Studio media scene when presenting JW.org
- Immediately toggle subtitles when toggled in settings
- OBS Studio scene shortcuts won't change the scene while media is active
- Show a warning when congregation server web address is invalid
- Show a warning when OBS Studio scene does not exist

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

- 🚀 New field which allows selecting the date of the next visit of the circuit overseer; when that week comes, the midweek meeting will change to Tuesday automatically and unnecessary media (concluding songs and CBS media) will be skipped as well
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
