<!-- markdownlint-disable no-duplicate-heading -->

# Changelog

For translations of the most important changes, see the [`./release-notes/`](./release-notes/) directory.

## 25.6.0

For the full list of changes between versions, see our [CHANGELOG.md](https://github.com/sircharlo/meeting-media-manager/blob/master/CHANGELOG.md).

## v25.6.0 Release Notes

### ✨ New Features

- ✨ **Metered connection setting**: Added a new setting to reduce download bandwidth usage on metered connections.
- ✨ **Improved streamed media handling**: Better support for streamed media, reducing latency-related issues.

### 🛠️ Improvements and Tweaks

- 🛠️ **Better mime type handling**: Improved support for MIME types for better media compatibility.
- 🛠️ **Enhanced navigation drawer**: Improved mini state handling and added tooltip display for better user navigation.
- 🛠️ **Linux compatibility**: Forced GTK 3 usage on Linux to prevent UI and launch issues.

### 🔧 Improvements to Codebase

- 🛠️ **Electron API error resilience**: Added optional chaining to better handle missing `electronApi` during font and API error operations.
- 🛠️ **Fix structuredClone error**: Addressed `DataCloneError` caused by attempting to clone unsupported objects.
- 🔧 **Main process refactor**: Improved handling of duplicate Electron instances and restructured main process logic.
- 🔧 **Performance optimization**: Replaced `JSON.parse(JSON.stringify(...))` with `structuredClone` where possible.
- 🔧 **Error handling**: Improved error catching for thumbnails and ignored HTTP 429 errors to reduce noise.

## 25.5.0

### ✨ New Features

- 🖼️ **OBS Delay Option for Images**: Add an OBS Studio setting to delay scene changes when displaying images, improving transitions.
- 🔊 **Support for `.m4a` Audio Format**: Add compatibility for `.m4a` audio files to expand supported media types.

### 🛠️ Improvements and Tweaks

- 🔍 **Restore Zoom with `Ctrl` + `Scroll`**: Re-enable immediate zooming with the control + scroll gesture for easier navigation.
- ➕ **Smaller Extra Media Button**: Make the "extra media" button more compact for a cleaner interface.
- 🗂️ **Assign Custom Media to Correct Section**: Ensure custom media is correctly attributed to the appropriate section of the meeting.
- 👤 **Hide Unused CO Media**: Hide rather than skip unused media for Circuit Overseer visits to maintain a cleaner presentation.
- 🎵 **Improve Duplicate Song Indicator**: Enhance the visual cue for duplicate songs to make them easier to identify.

## 25.4.3

### 🛠️ Improvements and Tweaks

- ➕ **Clean Up Media From v25.4.x**: Automatically clean up orphaned or misplaced media from v25.4.1 to v25.4.2 to ensure no media is missing or in the wrong place in the media list.

## 25.4.2

### 🛠️ Improvements and Tweaks

- ➕ **Prevent Duplicate Media**: Avoid adding some media items multiple times to the media list.

## 25.4.1

### 🛠️ Improvements and Tweaks

- 🎬 **Fix Custom Start/End Time Assignment**: Prevent custom start and end times from being incorrectly applied to the wrong video.
- 📝 **Allow Mismatched Subtitles**: Enable use of subtitles even when they do not perfectly match the media file.
- 🪟 **Disable Rounded Corners on Windows**: Remove rounded corners for the media window on Windows.
- 🖼 **Include Non-Referenced Images in Media List**: Ensure all non-referenced images are added to the media list for completeness.
- ➕ **Prevent Duplicate Media Sections**: Avoid creating multiple media sections for the same media item.
- 📥 **Preserve Playlist Order on Import**: Maintain the original order of JWL playlists during the import process.

## 25.4.0

### ✨ New Features

- 🇵🇭 **New Language: Tagalog**: Added support for Tagalog, expanding the app's multilingual capabilities.
- 🎞 **Support for `.m4v` Video Format**: Now supports playback of `.m4v` files to improve media compatibility.

### 🛠️ Improvements and Tweaks

- 🎬 **Multiple Start/End Times for Single Video**: Allow a single video to appear in the media list multiple times with different custom start/end times.
- 📦 **Skip `.jwlplaylist` Files in Video Conversion**: Improve processing by skipping unnecessary `.jwlplaylist` files during video conversion.
- 🛡 **Improve Error Handling**: Enhance robustness by handling unexpected errors more gracefully.
- 🚫 **Prevent Errors from Unreleased Songs**: Avoid crashes when meeting workbooks reference unreleased songs.
- 🗂 **Improve Watchtower Media Labels & Order**: Clarify media labeling and improve item ordering for Watchtower content.
- 📤 **Include Grouped Media in Auto Export**: Automatically export grouped media items along with others.
- 🔄 **Replace Missing Media When Available**: Automatically replace missing media files when they become available.
- 📡 **Correct `.m4v` Fetching from JW API**: Ensure `.m4v` files are correctly fetched from the JW API.
- 📆 **Fix Future Day Calculation**: Correctly determine a future day within a specific week for accurate media planning.

### 🔧 Improvements to Codebase

- ⚙️ **Optimize CI Pipeline**: Speed up development and deployment processes by improving the continuous integration pipeline.
- 📦 **Update Dependencies**: Keep the application secure and up to date by updating various dependencies.

## 25.3.1

### ✨ New Features

- 🌏 **New Language: Korean**: Add support for the Korean language, expanding accessibility for more users.

### 🛠️ Improvements and Tweaks

- ⚡ **Improve Performance & CPU Usage**: Optimize performance to reduce CPU usage and enhance efficiency.
- 🔄 **Fix Synchronization & Crash Issues**: Resolve various sync-related and stability issues to improve reliability.
- 📜 **Show Release Notes for Existing Congregations**: Ensure release notes are only displayed for congregations that are already loaded.

### 🔧 Improvements to Codebase

- ⏪ **Revert Problematic Dependency Updates**: Roll back recent dependency updates that caused issues, restoring stability.

## 25.3.0

### ✨ New Features

- 🎵 **Play Background Music with Videos**: Allow background music to continue playing while videos are being viewed.
- 🎥 **Camera Feed for Sign Language Media**: Add the ability to display a camera feed on the media window specifically for sign language users.
- 📅 **Automatic Memorial Date & Background**: Automatically detect and set the Memorial date and prepare the Memorial background image.
- 📜 **Show Release Notes In-App**: Display release notes directly in the application so users can easily review changes after an update.

### 🛠️ Improvements and Tweaks

- ⚡ **Optimize Smart Cache Clearing**: Improve the smart cache-clearing mechanism for better performance and efficiency.
- 📂 **Correct Circuit Overseer Media Placement**: Ensure Circuit Overseer media is placed in the correct section.
- 📅 **Exclude Regular Meeting Media for Memorial**: Prevent fetching standard meeting media for the Memorial to prevent errors.
- 📅 **Hide Regular Meeting Sections on Memorial**: Remove unnecessary meeting sections during the Memorial event for a cleaner layout.
- 📖 **Fix Sign Language Bible Video Downloads**: Correctly download Sign Language Bible chapter videos from JWL playlists.

### 🔧 Improvements to Codebase

- 📦 **Update & Move `mime` Package**: Relocate and update the `mime` package to the correct environment for better dependency management.
- 🔄 **Dependency Updates**: Update various dependencies to maintain stability and security.

## 25.2.1

### ✨ New Features

- 🔄 **Allow OBS Reconnection Attempts**: Introduce the possibility to manually force OBS to reconnect when needed.
- 🗑 **Auto Cleanup Old Export Date Folders**: Automatically remove outdated export date folders to keep storage organized.

### 🛠️ Improvements and Tweaks

- 🖼 **Fix Playlist Image Import**: Ensure playlist files correctly import all images.
- 📆 **Prevent JWLPlaylist Parsing as Date**: Fix an issue where JWLPlaylist files were mistakenly parsed as dates.
- 🎬 **Correctly Set OBS Scenes for Website Presentation**: Ensure OBS scenes are properly configured for website presentation.
- 🚫 **Correctly Set Disabled State**: Fix an issue where disabled states were not being applied correctly.

### 🔧 Improvements to Codebase

- 🛠 **Prevent Catching YAMLException**: Improve error handling by preventing unnecessary YAML exceptions.
- 📦 **Refactor Test and Regular Versions**: Separate test versions from regular versions for better clarity and management. (#4007)
- 🔄 **Update Dependencies**: Upgrade various dependencies to maintain stability and security.
- 🚨 **Revert Version Bump**: Roll back an unintended version bump.
- 📰 **Update Announcements**: Refresh the announcements section with new updates.

### 📑 Documentation & CI Updates

- 🔼 **Improve SEO**: Enhance documentation for better search engine optimization.
- 🔄 **Update Changelog**: Keep the changelog up to date with recent changes.
- ⚙️ **Bump Node Version**: Upgrade Node.js in the CI pipeline for better performance and compatibility.

## 25.2.0

### ✨ New Features

- 🌍 **Use System Locale by Default**: Automatically detect and use the system's locale for a more personalized experience.
- 🏷 **Tag Support for Exported Media**: Add metadata tags to exported media files for better organization.
- 🔄 **Automatic Beta to Stable Downgrade**: Allow automatic downgrades from beta versions to stable releases when necessary.
- 🌐 **Extract Latest MEPS Language Indexes**: Fetch the most recent MEPS language indexes directly from the official website, ensuring up-to-date language support.

### 🛠️ Improvements and Tweaks

- 🚫 **Prevent Media Flicker**: Improve sorting logic to prevent flickering when reordering media.
- 🖱 **Smooth Scrolling**: Enhance scroll behavior for a more seamless navigation experience.
- ⚠️ **Warn Before Closing with Background Music**: Show a warning when attempting to close the application while background music is playing.
- 📖 **Fix Study Bible Media Import**: Correct issues related to importing certain Study Bible media files.
- 🌍 **Translation Updates**: Improve and update translations across various supported languages.
- 📑 **Enhanced JWPUB Document List**: Improve the styling of the JWPUB document list for better readability.
- 📆 **Support YYYYMMDD Date Format**: Enable compatibility with YYYYMMDD date format for better regional support.
- 🎵 **Sign Language Song Handling**: Only overwrite song publication details for sign languages to preserve intended song publication
- 🌐 **Expanded MEPS Language Indexes**: Add more language indexes to improve multilingual support.
- 🗑 **Optimized File Removal Actions**: Improve efficiency when deleting files, reducing unnecessary operations.

### 🔧 Improvements to Codebase

- 🚨 **Ignore Third-Party Errors in Sentry**: Prevent unnecessary error reports caused by external dependencies.
- 📦 **Dependency Updates**: Upgrade various dependencies to maintain security and stability.
- 🗃 **Automatically Close Stale Translation Discussions**: Improve repository management by closing outdated translation discussions automatically.

## 25.1.1

### 🛠️ Improvements and Tweaks

- 🛠️ **Fix moving items between media lists**: Resolved an issue where media items could get lost when transferring them between lists.
- 🛠️ **Improve day mapping logic**: Fixed a potential error in the `friendlyDayToJsDay` function.

### 🔧 Improvements to Codebase

- 🔧 **Simplify Electron imports**: Refactored imports to improve code readability and maintainability.
- 🔧 **Expand test coverage**: Added tests for `fs utils` and fixed the `getParentDirectory` test.
- 🔧 **Dependency updates**: Updated dependencies and refreshed the `yarn.lock` file.
- 🔧 **Repository maintenance**: Updated the `.gitignore` file.

## 25.1.0

### ⚠️ Breaking Changes

- 🖼 **Media Window Title Change**: The media window title has been changed. If OBS Studio is set to capture the media window by title, it may stop working. Please update your OBS Studio window capture settings if necessary.

### ✨ New Features

- 📅 **Open Previous Dates**: Allow opening previous dates of the current week, which is useful when the meeting day is moved later in the week.
- 🛑 **Error Banner for OBS Studio**: Add an error banner when OBS Studio is not connected on a meeting day, ensuring users are alerted.
- 📚 **Group Media by Publication**: Group media from the same referred publication for a cleaner and more organized media overview.
- 🎵 **Duplicate Song Warning**: Show a warning if songs are listed more than once in the media list for weekend meetings.
- 🔄 **Future Schedule Planning**: Enable the planning of future meeting schedule changes, which is useful for yearly schedule changes or for the circuit overseer's visit to a neighboring congregation.

### 🛠️ Improvements and Tweaks

- 📘 **Bible Import Documentation**: Add Bible import features to the documentation website to help users understand and utilize this feature.
- 🔧 **Force Close Option**: Allow force closing the application when the UI is unresponsive, improving user control during freezes.
- 🖋 **Local Font Fallback**: When offline, correctly fallback to a local font file if available, ensuring smooth icon rendering.
- 🪟 **UI Improvements for Small Windows**: Enhance the user interface for smaller windows for better accessibility.
- 📖 **Hide Empty Tabs**: Hide empty study Bible media tabs to declutter the interface.
- 🤝 **Sign Language Behavior Alignment**: Align sign language behavior with JW Library Sign Language, by automatically hiding the media window and not showing the yeartext.
- 🔊 **Sign Language for Audio Bible**: Add support for sign language in the audio Bible feature, increasing accessibility.
- 🧹 **Automatic Cache Cleanup**: Automatically clean up old dates and cache periodically, keeping the application streamlined.
- 🇵🇭 **Preparations for Tagalog**: Make preparations for supporting the Tagalog language, expanding the app's accessibility.
- 🚫 **Hide Cast Button**: Remove the cast button on the media window to simplify the user interface.
- 🔍 **Better Zooming**: Improve first manual zoom-in by keeping the image centered, reducing the first zoom factor, and ensuring smooth transition.

### 🔧 Improvements to Codebase

- 🛠 **Sorting Logic Refactor**: Refactor sorting logic for improved stability and better performance.
- 📅 **Media Calendar Refactor**: Refactor the media calendar page for improved maintainability and ease of updates.
- ✅ **Unit Tests**: Add unit tests for better code stability and reliability, ensuring new changes do not break existing functionality.
- 📄 **Documentation Auto-Refresh**: Automatically refresh the documentation website on new releases, ensuring users always have the latest information.
- 🧹 **Improved ESlint Config**: Update ESlint configuration for cleaner and better code, maintaining high code quality standards.

## 24.12.2

### New Features

- 🌐 Allowed opening the website and navigating to a specific page **before presenting**.
- 💾 Added option for **MP4 conversion** of non-video media.
- 📦 Added **code signing and notarization for macOS version** to enable auto-updates.
- 🎥 Display **elapsed/remaining time** during video playback.
- 🎥 Added **manual time entry** for custom durations.
- 🚩 Introduced a **banner when auto-updates are disabled** to inform users.
- 📅 Enabled **beta update options** and banner for users who want early access to new features.
- 🔍 **Autofocus search fields** in dialogs.
- 🌐 Added initial support for **Haitian Creole**, **Kinyarwanda**, and **Slovak** languages.

### Improvements and Tweaks

- 💻 Improved **app icons** for better visual consistency.
- 📄 Enhanced **page titles** across the app for clarity.
- 🖼️ Improved **about modal icon size** and **media window title**.
- ⚙️ Improved **toggle settings and layout on small windows**.
- 🖱️ Introduced **auto-scroll when dragging media to window edges**.
- 🎥 Added an option to **hide icons from OBS scene switcher**.
- 🛠️ Added **beta icon** for pre-release versions.
- 🛠️ Adjusted **video progress bar styling** for accuracy.
- 🖥️ Restricted media window maximization to **multiple screens**.
- 🎵 Fixed **custom audio duration setting** issues.
- 🌐 Immediately applied **urlVariables** upon change.
- 🔄 Resolved issues with **spinning loader icon** and **refresh button placement** in media dialogs.
- 🎨 Improved **drag-and-drop loader styling** for consistency.
- 🖼️ Adjusted **about modal update toggle placement** and logo attention styling.
- 🎛️ Removed **size notification from media window** and replaced it with a tooltip.
- 🖱️ Restored **double-click action on media window** with improved results, preventing unintended maximize behavior.
- 🛠️ Added separate **loading states** for Study Bible.
- 🖼️ Unified grid styling for **song, Study Bible, and audio Bible views**.
- 📜 Fixed missing strings for **Hebrew, Aramaic, and Greek scriptures**.
- 📜 Resolved **Bible book name display issues** in certain cases.
- 🖼️ Fixed **long filename layout issues** in media items.
- 🛠️ Ensured dynamic **modal height** with friendly overflow enforcement.
- 📦 Fixed **download popup scroll issue** and spinner icon glitches.
- 🎨 Improved **banner color consistency**.
- 📜 Correctly handled **media language fallback order**.
- 🖼️ Display **intro pictures from _lff_ , _bt_ and _lmd_** when appropriate.
- 🎥 Fixed issues where certain **images didn’t render properly in MP4 exports**.
- 🎥 Correctly **load OBS scenes** in select inputs.
- 📦 Resolved **`ffmpeg` setup issues** to avoid unnecessary binary downloads.
- 🎥 Fixed **media shortcuts for CO visit**.
- 🔍 Improved **study Bible lookups and loading UI**.
- 🔧 Improved **pan-zoom handling**.
- 🚀 Made event listeners **passive** for better performance.

### Improvements to Codebase

- 🛠️ Refactored and simplified media item code for maintainability.
- 📦 Improved **error handling** and messaging across the app.
- 🛠️ Enhanced **code structure** by moving and optimizing utility functions.
- 📄 Updated documentation for **contributing guidelines** and download links.
- 🛠️ Improved workflows for **beta release cleanup** and CI schedules.
- 🌐 Cleaned up old locales and removed incomplete translations.
- 🖼️ Set **correct window icons** in development mode.

## 24.12.1

### New and Improved Features

- 🛠️ Improved **announcements** feature to allow for scopes.
- 🚩 **Warn users** when auto-updates are disabled or beta updates are enabled.
- 💻 Improved **macOS icons** for better visual consistency.
- 🎥 Added **time entry for custom durations**
- 🎥 Display **elapsed/remaining time** during video playback.

### Fixes

- 🖥️ Restricted media window **maximization** to when using multiple screens.
- 🌐 Immediately applied **urlVariables** upon change.
- 🔄 Resolved issues with **spinning loader icon** and **refresh button placement** in media dialogs.
- 🎨 Improved **drag-and-drop loader styling** for consistency.
- 🖼️ Adjusted **about modal update toggle placement** and logo styling.
- 🎛️ Removed **size notification from media window** and replaced it with a tooltip in the display popup.
- 🖼️ Unified **grid** styling for song, Study Bible, and audio Bible views.
- 📜 Fixed missing strings for **Hebrew and Greek scriptures**.
- 📜 Resolved **Bible book name display issues** in certain cases.
- 🖼️ Fixed **long filename layout issues** in media items.
- 🛠️ Ensured dynamic **modal height** with friendly overflow.
- 📦 Fixed **download popup scroll issue** and spinner icon glitches.
- 🎨 Improved **banner color consistency**.
- 📜 Correctly handle **media language fallback order**.
- 🖼️ Displayed **intro pictures** from _lff_ and _bt_ and _lmd_ when appropriate.
- 🌐 Initial support for **Haitian Creole**.

### Code improvements

- 📦 Improved **error handling** and messaging across the app.
- 🛠️ Enhanced **code structure** by moving and optimizing utility functions.
- 📄 Updated **documentation** for contributing guidelines and download links.
- 🛠️ Improved workflows for **beta release cleanup** and CI schedules.
- 🚀 Made event listeners **passive** for better performance.
- 🌐 Cleaned up old locales and removed incomplete translations.

## 24.12.0

### New Features

- 🧹 Added **cache folder customization** in settings and the wizard for better data control.
- 🎤 Introduced **audio Bible import** functionality.
- 📂 Added **auto-export media to folder** functionality.
- 📖 Included **non-book media** (e.g., appendices, introductions) from the study Bible.
- 🌐 Enabled **Italian** language support.
- 🎨 Updated icon assets and introduced **new media player icon**.

### Fixes

- 🖼️ Move **subtitle settings** to ensure better grouping in settings.
- 🖱️ Resolved **hover color issues** for list items.
- 📜 Fixed **study Bible style tweaks** and harmonized video title displays with study Bible tiles.
- 🎬 Corrected **ordering issues** for meetings with extra media.
- 🖥️ Fixed **window offscreen issues** by resetting window position when necessary.
- 🎛️ Fixed **slider tooltip position glitch** to ensure proper display.
- 🚪 Properly handled **public talk media** so it is displayed correctly in the list.
- 🔄 Resolved **issues with combined properties** from JWPUB files.
- 🎵 Fixed **S-34mp menu position** for better usability.
- 🛠️ Fixed **menu actions** to disable them as needed when media is active and adjusted menu icon placement.
- 🖼️ Corrected **window flicker** issues during screen transitions.
- ⚙️ Fixed **media access status logic** to avoid unnecessary calls on Linux.
- 🛠️ Resolved **zoom limit enforcement** for better usability while presenting the website.

### Improvements & Chores

- 🔨 Refactored and optimized **code** for reusability.
- 📚 Improved **documentation**.
- 🖼️ Implemented **custom scrolling styles and logic** instead of using `q-scroll-area` repeatedly.
- ✏️ Cleaned up SVGs and resolved typos in the documentation.
- 🛠️ Refactored **error handling** across Electron processes, including thumbnails and fetch contexts.
- 🚀 Improved **DX (Developer Experience)** with streamlined workflows and templates.

This release includes critical fixes, exciting new features, and numerous under-the-hood improvements to enhance performance, usability, and developer experience. Enjoy!

## 24.11.5

### New Features

- 🌐 Added a notification to **offer translation help** for missing translations.
- 🖼️ Implemented **extra media indicators** and improved visual feedback for media items.
- 🎤 Added support for **missing media from JW playlist files** and ensured they are added correctly from the watched folder.
- 📚 Added support for **Study Bible media**.
- 🖋️ Added **context menu button** for easy access to media actions in the media list.
- 🎧 Added a **portable Windows version** of the app for easier use on portable setups when needed.
- 🎶 Ensured **JW playlist item repeat settings** are honored.

### Fixes

- 🖼️ Fixed **hover effects** to work across the entire media item and properly set the menu target.
- 🎤 Resolved **incorrect song attributes** by setting the default to `false`.
- 🎬 Correctly handled **watched playlist files** to prevent issues with media management.
- 🖥️ Fixed **duplicate fetch calls** to optimize media fetching logic.
- 📅 Corrected **calendar day labels** that were appearing incorrectly in certain scenarios.
- 🎧 Fixed **media permission prompts on macOS** to only appear when needed.
- 📝 Fixed **CSP font-src issues** and ensured fonts are correctly handled.
- 📜 Prevented **duplicate error messages** from being shown during media fetch.
- 🖼️ Fixed **thumbnail file handling** by preventing unnecessary writes to watched folders.
- 🛑 **Prevented excessive window jumping** on macOS by adjusting fullscreen logic.
- 🧭 Fixed **congregation finder scroll positioning** to ensure correct navigation in modals.
- 🌍 Corrected **URL search params parsing** to fix incorrect URL behavior.

### Chores and Refactors

- ⚙️ Improved **code readability** across the app to make the codebase cleaner and more maintainable.
- ⚡ Optimized **performance of Quasar imports** for faster app startup and reduced bundle size.
- 📜 Updated **contributing guidelines** for clearer instructions on how to contribute.
- 🛠️ Refactored **locale handling** to make it more efficient and reliable when migrating locales.

### Documentation

- 📚 Added **direct download links** in the docs for easier access to required files.
- 🖥️ Updated the **installation documentation** for clarity and ease of access.

## 24.11.4

### New Features

- 🎼 Added **song grid view** to replace the song list for easier navigation and selection.

### Fixes and Improvements

- ✏️ **Minor rephrasing** of various UI text for better clarity.
- 🛑 Implemented **quit verification logic** for macOS `Cmd-Q` to prevent accidental exits.
- 🎵 Added **loading indicator to song picker** when refreshing songs for a smoother experience.
- 🎶 Improved **search and filters** in public talk media and song pickers to allow for partial text matches.
- 🌐 Adjusted **website aspect ratio on macOS** for better display.
- 🖼️ Fixed **thumbnail file path errors** that caused media thumbnails to fail in some cases.
- 📜 Properly reset **media import progress and drag-and-dropper**.
- 🎬 Ensured **new watched media** is added to the bottom of the list when sorted.
- 🖋️ Improved **fetch error handling** for more robust error messages.
- 🌐 Fixed **font URLs** to default to empty when `urlVariables` are missing.
- 🔗 Fixed **base URL checks** to skip unnecessary fetches when everything is already configured properly.
- 🎶 Improved **font-src CSP** for dynamic font loading.
- 🖼️ Fixed **cursor indicator errors** during website presentation.
- 📂 Caught **folder watcher errors** to prevent unexpected app behavior.
- 🌐 Request **media permissions on macOS** before showing the website window.

### Chores and Refactors

- 🚀 Greatly improved **performance responsiveness** on remote video popup and added pagination for better UX.
- 🌍 Moved from **localeCompare to Intl.Collator** for enhanced sorting and locale handling.
- 🛠️ Improved **types** for better type safety across the app.
- 🗂️ Added **missing publication file types** for better compatibility.

## 24.11.3

### New features

- 🖱️ Added **mouse cursor indicator** and **click animation** during website presentation.

### Fixes

- 📅 Fixed **calendar day labels** to display accurately based on user settings.
- 🎶 Ensure the the requested **section** was used when adding extra media for the midweek meeting.
- 🎵 Updated **opening song button** to ignore watched media.
- 🔢 Fixed an issue where **incorrect values** would show up in some menus.
- 🔗 Added **base URL validation** for improved setup accuracy.
- 🌐 Cleared up **language inconsistencies** across the interface.
- 🗄️ Improved **user data folder** management.

## 24.11.2

### New features

- 📂 Added **folder watcher feature** to monitor a specified folder for new media, useful for syncing media from a cloud folder.
- ➕ Added feature to **add media to specific meeting sections** using a new button on the Public Talk, Circuit Overseer, and Living as Christians headers.
- 🎬 **OBS Studio scenes** can now be activated either immediately, or after media has stopped playing.

### User interface

- 🖼️ Improved **audio file management** to show thumbnails and enable time slider and custom durations.
- 📅 Added **first day of the week setting** to customize the starting day in calendar views.
- 🎶 Changed **"concluding song" label** to "closing song".

### macOS improvements

- 🔒 Added prompt to **request media access** for website presentations on macOS.
- 🌐 Adjusted **website window behavior** to avoid forced-on-top setting when presenting a website.

### Fixes and improvements

- 📋 Improved handling of **long filenames**
- 🖥️ Fixed handling of **multiple monitors** on Windows
- 🔗 Fixed **URL handling** to correctly process `urlVariables` errors.
- 🌍 Fixed **JWPUB import** (such as S-34) for certain languages.
- 🛠️ Fixed **initial congregation selection** issue.
- 🖼️ Cache **extracted thumbnails** intelligently to prevent having to extract them repeatedly.
- 🧩 Improved **performance** by replacing adm-zip with decompress.
- 🛠️ Improved **error handling** and Sentry capturing.
- 🔐 Enhanced **type safety** and IPC code **cleanup**.
- 🛑 Updated to **cancel pending downloads** before closing the app.

## 24.11.1

### User Interface

- Fixed issue where **music button** didn't automatically start music in some cases
- New **Announcements** feature to be used when needed (for updates, etc.)
- Refined **public talk section** to stay visible during WE meetings
- Centered **website window** on the primary screen
- Improved **tooltip** for media scrubber to show information about scrubbing
- Fixed **nav drawer** display quirks

### Media and Scene Management

- Added **Instant Scene Picker** toggle in settings and improved scene switching when presenting websites
- Fixed **JW Playlist Import** to respect languages specified in playlist
- Resolved issues with **Hidden Media** and **Additional Media** visibility in the menu

### Download and File Management

- Switched to **Electron's Built-in Download** methods, replacing Axios for improved performance
- Enhanced **File Dialog Filters**
- Optimized **Drag-and-Drop Import** to show informative progress bars whenever appropriate
- Addressed **Sorting** issues with downloads

### macOS and System Improvements

- Added feature to **notify macOS users of new versions** when available
- Updated **macOS build artifacts** for better distribution
- Improved **Window State** handling for full-screen windows on macOS
- Added debug statements and debug options for **macOS**

### Behind the Scenes

- Removed **Axios** and **Synchronous FS Calls** to greatly improve performance
- Enhanced **Code Documentation** for better readability and maintenance
- Added **Type Checking** for better code stability and optimized **Type Imports**
- Addressed **Sentry** issues and removed redundant log output

### Miscellaneous Improvements

- Cleaned up **Console Logs** and reduced redundant messages
- Updated **Contributing Guidelines** and **Readme**
- Improved **Download Error Handling** to avoid unnecessary warnings on expected failures

## 24.11.0

### ✨ New Features

- **feat**: Presenting the website is now supported on macOS 🚀
- **feat**: Introduced keyboard shortcuts for stopping, pausing, and resuming media playback 🚀
- **feat**: Added support for setting the web address from which media should be downloaded 🚀
- **feat**: Added OBS Studio instant scene picker and overhauled scene picker functionality in settings
- **feat**: Expanded documentation website to support more languages

### 🔧 Fixes & Improvements

- **fix**: Intel Mac systems are now supported! 🚀
- **fix**: Various UI adjustments, such as image zoom reset icon visibility
- **fix**: Corrected issues in media handling, including hidden media visibility, JW video categories, and background music updates on profile change
- **fix**: Image zoom now resets when media is stopped
- **fix**: Enhanced date handling—fallback to today’s date for "Other" profiles, and hide the import button if no date selection was made
- **fix**: Corrected window state logic for macOS, including the system menu bar
- **fix**: Correct handling of undefined `mediaLinks`, nullable settings and other variable values in various functions

### 🛠️ Refactors & Chores

- **refactor**: Switched to asynchronous file handling and removed synchronous file system calls, greatly improving responsiveness
- **refactor**: Reorganized preload files for better modularity and IPC handling, and removed `electron/remote` dependency
- **refactor**: Consolidated imports, optimized Quasar components, and improved type safety across the codebase
- **chore**: Improved stability with enhanced security by disabling Node integration and enabling web security
- **chore**: Documented codebase, improved `Info.plist` handling on macOS, and added minimum macOS version requirement
- **chore**: Added Prettier formatting, code comments, and improved `lint-staged` configuration for better code consistency

### 📄 Documentation Updates

- **docs**: Enhanced FAQ link texts and navigation for clarity
- **docs**: Updated `README` to better guide contributors and included terms of use references

### ⚙️ CI/CD Enhancements

- **ci**: Updated Husky configurations for pre-commit and pre-push checks, fixed type checks, and enhanced build scripts for x64 and ARM64 on macOS
- **ci**: Refined artifact uploads and improved documentation generation

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
- Zoom and pan has been reworked to be accurate whether using the mouse-wheel or double click

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

- 🚀 New field which allows selecting the date of the next visit of the circuit overseer; when that week comes, the midweek meeting will change to Tuesday automatically and unnecessary media (closing songs and CBS media) will be skipped as well
- Added a loading indicator while files are being renamed
- Improved app icon for macOS (thanks [@advenimus](https://github.com/advenimus)!)
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
