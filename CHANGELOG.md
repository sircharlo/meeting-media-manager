<!-- markdownlint-disable no-duplicate-heading -->

# Changelog

## 24.10.10

### ✨ New Features

- **new**: Added keyboard shortcuts to navigate to the next/previous media item
- **new**: Added a right-click menu to media items to hide media items and rename them
- **new**: Trimmed video times are now respected in imported JWL playlists

### 🎨 UI/UX

- **fix**: Improved pan-zoom behavior on double-click of image preview and scaling
- **fix**: Corrected pan-zoom maximum zoom
- **fix**: Hide media item actions in extra media menu and show only when there’s extra/hidden media
- **fix**: Full-screen windows on macOS can now be shared and controlled in Zoom correctly
- **fix**: Added tooltip to list all supported extensions
- **fix**: Improved button popups to show active states
- **fix**: Enhanced drag-and-drop sorting algorithm
- **fix**: Added a progress bar during imports
- **fix**: Made chips for paragraphs/songs take full width on very small screen sizes
- **fix**: Updated verbiage for imported media notifications
- **fix**: Optimized application menu for a better user experience on macOS
- **fix**: Added progress indicators and ensured a smoother user experience
- **fix**: Fixed download spinner color when menu active
- **fix**: Improved the navigation drawer color for active items in dark mode

### 🛠️ Code Refactors and Improvements

- **fix**: Dark mode setting was incorrectly detected as missing in some cases
- **refactor**: Removed unused strings and formatted codebase for consistency
- **fix**: Fixed typos, corrected errors, and improved linting throughout the codebase
- **fix**: Properly support `.mov` files and all possible image types ([reference](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types))
- **fix**: Optimized OBS integration by adding 'previous scene' restore functionality
- **fix**: Resolved potential drag/drop issue when no path is found
- **fix**: Disabled a Windows shortcut workaround that is no longer needed
- **fix**: Improved migration logic, ensured safe parsing, and refactored migration to simplify the process
- **refactor**: Implemented secure IPC communication for better application security
- **refactor**: Made send and log functions generic for better reusability
- **chore**: Ignored certain spellcheck (cspell) rules and fixed language order
- **chore**: Bumped Pinia dependency and other dependencies

### 📝 Documentation Updates

- **docs**: Improved navigation in FAQs and other documentation pages
- **docs**: Updated issue reporting link to point to the issue list
- **docs**: Added steps for correctly fetching the latest version
- **chore**: Updated Crowdin and docs configurations
- **chore**: Updated `CONTRIBUTING.md` and added terms of use reference in the README

### 📄 Updated Files

- Updated `CHANGELOG.md` and cleaned up unused strings

## 24.10.9

### ✨ New Features

- **feat**: Added an option to delete all extra media files for the currently selected day

### 🔧 Fixes & Improvements

- **fix**: Sentry improvements to properly track errors
- **fix**: Eliminated the return of the dreaded yellow outline 🟡
- **fix**: Corrected hover color for some buttons
- **fix**: Addressed some typos
- **fix**: Properly detect the CO visit date immediately after loading a profile instead of waiting to change the selected date
- **fix**: Hide overflow text from title bar behind ellipsis

## 🌍 New Translations

- **Many languages** got updated translations, including Ukrainian, Swahili, Russian, and Dutch (listed in reverse alphabetical order)

### 🛠️ Chores & Miscellaneous

- **chore**: Removed unused strings to clean up the codebase

## 24.10.8

### 🔧 Fixes & Improvements

- **new**: Improved music stopping logic to prevent a new song from starting if one is already playing
- **new**: Show feedback when setting and removing a custom background
- **new**: Hide overflow from app title behind ellipsis for cleaner appearance
- **new**: Show OBS Studio connection state on relevant fields in settings
- **new**: Prevent configuring scenes if OBS Studio is not connected
- **fix**: Properly retry errored-out meetings as needed
- **fix**: Restored and improved highlight color for selected media
- **fix**: Resolved layout glitch where banners and loaders sometimes conflicted
- **fix**: Improved storing and retrieval of app settings and download history
- **fix**: Corrected strings in app theme menu
- **fix**: Made "congratulations" message translatable

### 🌍 New Translations

- **Hungarian**: Now supported with full translation 🎉
- **Progress updates** on translations across multiple languages

### 🛠️ Chores & Miscellaneous

- **chore**: Added Pinia to Sentry for better state tracking
- **chore**: Enable zip format for better macOS updates

## 24.10.7

### 🔧 Fixes & Enhancements

- **fix**: Resolved a navigation style bug on initial load
- **fix**: Moved the songbook cache setting to a better place in settings
- **fix**: Truncate long OBS Studio scene titles
- **fix**: Prevented issues with font caching that prevented icons from showing up in some cases where the app was offline
- **fix**: Allowed copy-paste shortcuts to work seamlessly
- **fix**: Import button label now displays correctly on menu buttons even with smaller windows
- **fix**: Reverted Formkit drag-and-drop, fixing issues with file dropping into the app
- **fix**: Minor grammar improvements and corrections in the UI
- **fix**: Select menu values weren't displaying as expected in some cases
- **fix**: The wrong application data directory was being used in some cases
- **new**: Remember media window position between sessions
- **new**: Added developer console to allowed shortcuts

### 🛠️ Chores & Miscellaneous

- **chore**: Updated Crowdin configuration file for better translation management
- **chore**: Improved developer experience (DX) and updated target settings
- **chore**: Fixed rebuild failing on Linux
- **chore**: Re-added missing files from a previous build
- **chore**: Migrated to a new and improved way to persist settings

### 📝 Documentation & CI

- **docs**: Fixed the issue creation link in the bug report template
- **ci**: Updated Mergify configuration for automation improvements
- **ci**: Updated Crowdin and other build-related YAML files
- **chore**: Performed redirects on every session on docs website

### 📄 Updated Files

- Updated `README.md`

## 🎉 24.10.6 🚀

### ✨ New User Interface

We've completely revamped the app! Say goodbye to complicated workflows and hello to a **fresh, intuitive design**! The new interface makes everything **super easy** and enjoyable to use.

### 🎥 Simplified Media Management

Managing media is now **a breeze**! We've eliminated all those tricky steps like media prefixes and confusing option clicks. Now you can **drag and drop** with ease. Everything is designed to help **streamline tasks**, especially for audio-video attendants.

### 🌟 Key Goals of this Update

1. **Simplicity**: We've made the app as easy as possible to use.
2. **Functionality**: Everything you need to **play and manage media** for meetings is included.

## 24.4.8

### New or improved features

- Option to disable checking for updates

## 24.4.7

### Bug Fixes

- Keep the highest found number of Kingdom songs

## 24.4.6

### Bug Fixes

- Correctly fetch media from public watchtowers

## 24.4.5

### Maintenance

- Update deprecation banner

## 24.4.4

### Maintenance

- Show deprecation banner advising of new version

## 24.4.2

### Maintenance

- Update Zoom SDK before the old one is deprecated

## 24.4.1

### New or improved features

- New language: Chinese Mandarin (Simplified) (thanks [@heymenshan](https://github.com/heymenshan)!)

### Bug fixes

- Prevent recursively processing midweek meeting references

## 24.4.0

### Bug fixes

- Dynamically get the correct number of Kingdom Songs

## 24.2.0

### Bug fixes

- Correctly sanitize filenames with an apostrophe
- Correctly save time values when only changing the hour
- Disabled save button while saving
- Exclude songs with described audio from song picker

## 24.1.0

### New or improved features

- New language: Pangasinan (thanks [@lorenpajarits](https://github.com/lorenpajarits)!)

### Bug fixes

- Exclude songs with described audio from background music playback

## 23.12.0

### New or improved features

- New language: Iloko / Ilokano (thanks [@bridenkenn](https://github.com/bridenkenn)!)
- New language: Tagalog (thanks [@bridenkenn](https://github.com/bridenkenn)!)

### Bug fixes

- Correctly process JWL playlist items with special characters
- Correctly validate video timestamp

## 23.11.0

### New or improved features

- Preparations for the new Meeting Workbook format
- Skip Bearing Witness media for Circuit Overseer visits

### Bug fixes

- Only save Meeting Workbook headings if they are actually present

## 23.10.1

### Bug fixes

- Fix edge case where mwb images would not be fetched correctly

## 23.10.0

### New or improved features

- New language: Afrikaans (thanks [@DickyBird69](https://github.com/DickyBird69)!)
- New language: Greek (thanks [@jimrp](https://github.com/jimrp)!)
- New language: Romany (Southern Greece) (thanks [@jimrp](https://github.com/jimrp)!)

### Bug fixes

- Correctly fetch some Watchtower footnotes
- Correctly get Meeting Workbook headings when an uneven result is returned
- Download media in correct order for some languages

## 23.8.1

### Bug fixes

- Updated dependencies

## 23.8.0

### New or improved features

- Added ability to drag-and-drop JW Library playlists directly into the media management screen
- Playing audio files will no longer fade out the yeartext

### Bug fixes

- Improved fallback for when languages weren't fetched or updated successfully
- Improved JSON file reading, writing and error catching

## 23.6.1

### New or improved features

- 🚀 Ability to import playlists from JW Library
- New language: Slovenian (thanks [@brobic74](https://github.com/brobic74)!)
- Support `.heic` files
- Support `.m4v` files

### Bug fixes

- Correctly fetch tracts

## 23.5.0

### New or improved features

- Only auto release beta releases when there are actual changes (features, fixes, translations)
- Option to exclude media from footnotes in Watchtower Studies
- Support `.webp` files

### Bug fixes

- Always include `lff` lesson header image
- Use correct paragraph number for referenced videos

## 23.4.4

### Bug fixes

- Fetch missing referenced videos for Watchtower Studies

## 23.4.3

### Bug fixes

- Correctly fetch (sign-language) videos for Watchtower Studies

## 23.4.2

### Bug fixes

- Always ignore correct song for circuit overseer visit
- Correctly fetch jw languages when missing
- Correctly fetch some media that's in a different language than the publication

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
- Fix "select video from the official website of Jehovah's Witnesses" feature not working in some use cases

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

- 🚀 Zoom integration! Automate various Zoom actions, like toggling video/microphone/spotlight or allow to un-mute (see [#1303](https://github.com/sircharlo/meeting-media-manager/pull/1303) for details). It's still a beta feature, so make sure you test it thoroughly before use during meetings. Also, always verify that the automation was executed successfully.
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
- When presenting the official website of Jehovah's Witnesses, the website controller will now more accurately depict what is shown on the media window
- The circuit overseer date picker now allows selecting Tuesdays, and weeks will start on the correct day depending on the user's language
- Several UX improvements

### Bug fixes

- Activate OBS Studio media scene when presenting the official website of Jehovah's Witnesses
- Immediately toggle subtitles when toggled in settings
- OBS Studio scene shortcuts won't change the scene while media is active
- Show a warning when congregation server web address is invalid
- Show a warning when OBS Studio scene does not exist

## 23.2.1

### New or improved features

- 🚀 Videos can now be added directly from the official website of Jehovah's Witnesses! Useful, for example, to add Governing Body Update videos for presentation during midweek meetings
- 🚀 Added subheadings to presentation mode, simplifying navigation between meeting parts
- Added a representation of the mouse cursor while presenting the official website of Jehovah's Witnesses on the external monitors (still a beta feature)
- Option to automatically play the first media item a predetermined number of minutes before a meeting's start
- Option to manually reconnect to OBS Studio while in presentation mode
- Zooming and panning a picture will now be done more gradually on the external monitors, to avoid abrupt picture motion for the audience
- Several enhancements to the subtitle feature
- Several minor UI improvements

### Bug fixes

- Only try to create new directories on synchronization server once per save action
- Prevent closing M³ when presenting the official website of Jehovah's Witnesses
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
- Refresh languages from the official website of Jehovah's Witnesses when they were not correctly fetched before
- Set OBS Studio scene correctly when using keyboard shortcuts
- Fixed an issue where the OBS Studio scene would sometimes be set to "nothing"
- Clear download and cache statistics after every media sync
