<!-- markdownlint-disable no-duplicate-heading -->

# Ni yapi Mpya

Kwa ajili ya orodha kamili ya mabadiliko baina ya toleo tofauti tofauti, ona CHANGELOG.md file kwenye GitHub.

## v25.12.0

### ✨ Vipengele Vipya

- ✨ **Multi-Select Context Menu**: Added support for right-click menu actions when multiple media items are selected.
- ✨ **Keyboard Shortcuts**: Added `Ctrl/Cmd+A` to select all media, `H` to hide selected media, and `Shift+Up/Down` for keyboard selection navigation.
- ✨ **Watchtower Study Video Settings**: Added a setting to exclude extra Watchtower study videos.
- ✨ **Collapsible Sections**: Added ability to collapse sections on non-meeting days for a cleaner view.
- ✨ **JW Events Website**: Added the ability to present the JW Events website in addition to the main official website.
- ✨ **Playlist Import Customization**: Allowed ability to customize the prefix that is added to media items when importing JW playlists.
- ✨ **Website Mirroring Navigation**: Added a toggle to automatically navigate to the media list after website mirroring is stopped.
- ✨ **OBS Recording Controls**: Added the ability to control OBS recordings.
- ✨ **Yeartext Preview**: Added the ability to preview next year's yeartext as of December of every year.
- ✨ **Update Notifications**: Added warning notifications if running a beta version or if updates are disabled, and improved update download progress display.
- ✨ **Hardware Acceleration Settings**: Added an option to permanently disable hardware acceleration if needed.

## v25.11.0

### ✨ Vipengele Vipya

- ✨ **JWPUB Media Selection**: Added a way to select individual media from JWPUB files.
- ✨ **Auto-Focus Media Window**: Added an optional setting to automatically focus the media window after Zoom screen sharing.
- ✨ **Cursor Overlay for TV Display**: Enhanced website window cursor overlay for better visibility of the mouse cursor on TV displays.
- ✨ **Meeting Recording**: Added a new meeting recording feature, to control an external recording app.
- ✨ **Site Search**: Added ability to search for media or publications on the site using smart search.
- ✨ **Easy Manual Publication Import**: Added functionality to easily import publications from JW.org, such as magazine, books, programs and invitations.
- ✨ **Sign Language Improvements**: Added confirmation before playing entire files for sign languages and support for selecting multiple clips, such as for when multiple paragraphs are to be read consecutively.
- ✨ **Clip Navigation**: Added duration display to clip list items and improved clip navigation.
- 🛠️ **Media Display**: Ensured media display becomes visible when playback starts, even if it was hidden before.

## v25.10.1

### ✨ Vipengele Vipya

- ✨ **Setup Wizard – Zoom Step**: Added a Zoom integration step to the setup wizard for easier initial configuration.
- ✨ **Screen Picker Enhancements**: Show an accurate visual representation of all screens, as well as the main window’s current size and location, in the display popup. This makes it easier to choose the correct screen on which the media window should be displayed.
- ✨ **Media Window Preference**: The app will now remember the preferred screen on which the media window should be displayed, if specified by the user.

## v25.10.0

### ✨ Vipengele Vipya

- ✨ **Begin Playback Paused**: Added a new setting to allow playback to begin paused, which can be useful for AV operators to prepare their setup (such as starting Zoom sharing) before the media starts playing in the media window.
- ✨ **Update Notifications**: Users will now be notified of updates through an in-app banner, which will also allow the user to install updates immediately, instead of waiting for the next app restart.
- ✨ **Custom Events**: Added optional events hooks that can trigger keyboard shortcuts when certain events are detected. This can be useful for AV operators to execute actions automatically outside of the app. For example, smart lights could be turned on and off before and after media plays in auditoriums where projectors are used; or a script can be called after a meeting's last song has been played to automate various actions in a Zoom meeting.

## v25.9.1

### ✨ Vipengele Vipya

- ✨ **Media Window Always on Top & Fullscreen Behavior**: Fixed and improved always-on-top behavior for the media window, adjusting dynamically based on fullscreen state.
- ✨ **Date Display Format Setting**: Added a user setting to configure a date display format.
- ✨ **Media Crossfade**: Implemented crossfade transitions for media display, instead of the more abrupt fade-to-black transition that was present before.
- ✨ **Music Auto-Stop**: Optimized the behavior of the background music auto-stop to behave the same whether music was auto-started or not.
- ✨ **macOS Click-Through on Inactive Windows**: Enabled mouse click passthrough on the main window for macOS, which should make it easier to control the app even when it's not focused.

## v25.9.0

### ✨ Vipengele Vipya

- ✨ **Download Popup Enhancements**: Added refresh button and download grouping by date in the download popup.
- ✨ **Watched Media Order Memory**: Added section order memory for watched media items.

## v25.8.3

### ✨ Vipengele Vipya

- ✨ **Media Window Fade Transitions**: Added a new advanced setting to make the media window fade in and out, providing smoother visual transitions.
- ✨ **Image Duration Control and Progress Tracking**: Added image duration control and progress tracking capabilities for repeated sections.

## v25.8.1

### ✨ Vipengele Vipya

- ✨ **Custom Media Sections**: Complete system for creating, editing, and managing custom media sections with color customization and drag-and-drop reordering.
- ✨ **Media Dividers**: Add titled dividers within media lists for better organization with top/bottom positioning options.
- ✨ **Section Repeat Mode**: Enable continuous playback within specific sections for seamless media loops.
- ✨ **Zoom Integration**: Automatic screen sharing start/stop coordination with media playback.

### 🛠️ Maboresho na Marekebisho

- 🛠️ **Enhanced Section Headers**: New three-dots menu system with color picker, move up/down controls, repeat options, and delete functionality.
- ✨ **Inline Title Editing**: Edit media item titles directly in the interface without opening separate dialogs.
- 🛠️ **Improved Navigation**: Better keyboard shortcuts with scroll-to-selected functionality and enhanced media navigation.
- 🛠️ **Visual Enhancements**: Animation support during sorting operations and improved drag-and-drop visual feedback.

## 25.6.0

### ✨ Vipengele Vipya

- ✨ **Metered connection setting**: Added a new setting to reduce download bandwidth usage on metered connections.
- ✨ **Improved streamed media handling**: Better support for streamed media, reducing latency-related issues.

### 🛠️ Maboresho na Marekebisho

- 🛠️ **Better mime type handling**: Improved support for MIME types for better media compatibility.
- 🛠️ **Enhanced navigation drawer**: Improved mini state handling and added tooltip display for better user navigation.
- 🛠️ **Linux compatibility**: Forced GTK 3 usage on Linux to prevent UI and launch issues.

## 25.5.0

### ✨ Vipengele Vipya

- 🖼️ **OBS Delay Option for Images**: Add an OBS Studio setting to delay scene changes when displaying images, improving transitions.
- 🔊 **Support for `.m4a` Audio Format**: Add compatibility for `.m4a` audio files to expand supported media types.

### 🛠️ Maboresho na Marekebisho

- 🔍 **Restore Zoom with `Ctrl` + `Scroll`**: Re-enable immediate zooming with the control + scroll gesture for easier navigation.
- 👤 **Hide Unused CO Media**: Hide rather than skip unused media for Circuit Overseer visits to maintain a cleaner presentation.
- 🎵 **Improve Duplicate Song Indicator**: Enhance the visual cue for duplicate songs to make them easier to identify.

## 25.4.3

### 🛠️ Maboresho na Marekebisho

- ➕ **Clean Up Media From v25.4.x**: Automatically clean up orphaned or misplaced media from v25.4.1 to v25.4.2 to ensure no media is missing or in the wrong place in the media list.

## 25.4.2

### 🛠️ Maboresho na Marekebisho

- ➕ **Prevent Duplicate Media**: Avoid adding some media items multiple times to the media list.

## 25.4.1

### 🛠️ Maboresho na Marekebisho

- 🎬 **Fix Custom Start/End Time Assignment**: Prevent custom start and end times from being incorrectly applied to the wrong video.
- 📝 **Allow Mismatched Subtitles**: Enable use of subtitles even when they do not perfectly match the media file.
- 🪟 **Disable Rounded Corners on Windows**: Remove rounded corners for the media window on Windows.
- 🖼 **Include Non-Referenced Images in Media List**: Ensure all non-referenced images are added to the media list for completeness.
- ➕ **Prevent Duplicate Media Sections**: Avoid creating multiple media sections for the same media item.
- 📥 **Preserve Playlist Order on Import**: Maintain the original order of JWL playlists during the import process.

## 25.4.0

### ✨ Vipengele Vipya

- 🇵🇭 **New Language: Tagalog**: Added support for Tagalog, expanding the app's multilingual capabilities.
- 🎞 **Support for `.m4v` Video Format**: Now supports playback of `.m4v` files to improve media compatibility.

### 🛠️ Maboresho na Marekebisho

- 🎬 **Multiple Start/End Times for Single Video**: Allow a single video to appear in the media list multiple times with different custom start/end times.
- 📤 **Include Grouped Media in Auto Export**: Automatically export grouped media items along with others.
- 📡 **Correct `.m4v` Fetching from JW API**: Ensure `.m4v` files are correctly fetched from the JW API.

## 25.3.1

### ✨ Vipengele Vipya

- 🌏 **New Language: Korean**: Add support for the Korean language, expanding accessibility for more users.

### 🛠️ Maboresho na Marekebisho

- ⚡ **Improve Performance & CPU Usage**: Optimize performance to reduce CPU usage and enhance efficiency.
- 🔄 **Fix Synchronization & Crash Issues**: Resolve various sync-related and stability issues to improve reliability.
- 📜 **Show Release Notes for Existing Congregations**: Ensure release notes are only displayed for congregations that are already loaded.

## 25.3.0

### ✨ Vipengele Vipya

- 🎵 **Cheza Mziki wa usuli pamoja na Video**: Wezesha mziki wa usuli kuchezwa video zitazamapwo.
- 🎥 \*\* Onyesha video ya kamera kwa ajili ya Lugha ya Ishara\*\*: Uwezo wa kuonyesha video ya kamera kwenye scrini kwa ajili ya watumiaji wa Lugha ya Ishara.
- 📅 **Ongeza kiotomatiki tarehe ya Ukumbusho na Picha ya Usuli**: Tambua kiotomatiki na kuweka tarehe ya Ukumbusho na kutayarisha picha ya usuli ya Ukumbusho.
- 📜 **Onyesha habari ya visasisho kwenye programu**: Onyesha habari kuhusu visasisho kwenye programu ili watumiaji waweze kuona mabadiliko baada ya kusasisha programu.

### 🛠️ Maboresho na Marekebisho

- ⚡ **Boresha Usafishaji wa Cache**: Boresha utaratibu mahiri wa kufuta cache kwa utendakazi bora.
- **Uwekaji Sahihi wa Midia ya Msimamizi wa Mzunguko**: Hakikisha media ya Mwangalizi wa Mzunguko imewekwa katika sehemu sahihi.
- 📅 **Tenganisha midia ya mikutano ya Kawaida kutoka kwa Ukumbusho**: Zuia kupakua kwa midia ya kawaida ya mkutano kwa ajili ya Ukumbusho ili kuzuia makosa.
- 📅 **Ficha Sehemu za Mikutano ya Kawaida kwenye Ukumbusho**: Ondoa sehemu za mikutano zisizo za lazima wakati wa tukio la Ukumbusho ili upate mpangilio safi zaidi.
- 📖 **Rekebisha Vipakuliwa vya Video za Biblia katika Lugha ya Ishara**: Pakua kwa usahihi video za sura za Biblia katika Lugha ya Ishara kutoka kwa orodha za kucheza za JWL.
