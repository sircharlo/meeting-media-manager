<!-- markdownlint-disable no-duplicate-heading -->

# Що нового

Для повного списку змін між версіями перегляньте наш файл CHANGELOG.md на GitHub.

## v26.7.9

### ✨ Нові функції

- ✨ **App-Wide Redesign**: A broad visual and interaction refresh across dialogs, the media list/header, Settings, and the Setup Wizard. The Setup Wizard is now a one-question-per-screen flow with a progress bar. All prompts were replaced with a consistent branded dialog, and PDF page-range selection (for publication and drag-and-drop imports) now uses a thumbnail-grid picker instead of a free-text prompt. Added a new Quick Start Guide tour after the Setup Wizard completes. Also includes refreshed card/header styling with dark-mode-aware shadows and several dark-mode contrast fixes (focused field labels, download-progress percentages).
- ✨ **Settings Page**: Reworked into a two-pane layout, with a new global Preferences section for auto-update/beta-update toggles moved out of the About dialog (which is now purely informational).
- ✨ **Add More Media Button**: Added a setting to choose exactly which meeting sections show the "add more media" shortcut button, along with a setting for a compact (icon-only) mode.
- ✨ **Media List**: Items now show loading skeletons while being added instead of appearing empty, media groups show a hidden-item count in their badge (e.g. "9 items (2 hidden)"), children within a group can be reordered via drag-and-drop, and at very narrow window widths items collapse into compact, tooltip-carrying chips instead of crowding the row.

## v26.7.7

### ✨ Нові функції

- ✨ **Media Preview Quality**: Media preview now renders video frames via canvas with high-quality downscaling, fixing jagged/blurry previews (especially on text-heavy content like songs). The preview also auto-disables itself if it has to repeatedly correct playback drift on a single video, with a one-click way to turn it back on.

## v26.7.6

### ✨ Нові функції

- ✨ **CBS Video Exclusion**: Added a setting to exclude Congregation Bible Study videos from specific publications (defaults to the **Walk Courageously With God** book), with a searchable publication picker.
- ✨ **Document Page Numbers**: Publication Media and JWPUB import listings now show each document's page number (or numbers when there are multiple pages) after its title. This can help you to quickly find specific media when you know the page number on which it is found.

## v26.7.4

### ✨ Нові функції

- ✨ **Missing Media Recovery**: Media items whose local file went missing (e.g. deleted by the cache auto-clear, or removed manually) now show a disabled play button, a "missing" caption naming the file to look for, and a new "Locate file" action to relink the item to a file on disk.
- ✨ **Compatibility Warning**: Added a dismissible banner warning users on soon-to-be-unsupported OS/architecture combos (macOS 12 Monterey and Windows 32-bit) to upgrade before future app updates require newer system support.

## v26.7.0

### ✨ Нові функції

- ✨ **Linked Audio Playback**: Added support for playing audio from one file together with video from another file. This can be useful for playing video slideshows with accompanying music.
- ✨ **Watched Media Layouts**: Added persistence for watched media items and section order across watched folders. This ensures that the media list is displayed the same way even when the watched folder is synced across devices.

## v26.6.1

### ✨ Нові функції

- ✨ **Media Preview**: Added a live media preview overlay that can be toggled on or off from the settings or from the display popup.
- ✨ **Search media**: Added a quick search box in the media list that allows you to quickly find media by title. To use it, simply use the standard keyboard shortcut for search (Ctrl+F or Cmd+F).
- ✨ **Filter settings**: Added a filter box to the settings page that allows you to find settings by keyword or category. To use it, simply click on the Search button in the top right corner of the settings page, or use the standard keyboard shortcut for search (Ctrl+F or Cmd+F).
- ✨ **Background Music Overlap Warning**: Added a warning notification when media is started while background music is playing. Users can choose to stop the background music from the notification.

## v26.6.0

### ✨ Нові функції

- ✨ **Timer**: Added analog display modes and timing report status.
- ✨ **Profiles**: Added profile settings import and export in Advanced settings and the Setup Wizard.
- ✨ **Media Window**: Added support for automatically hiding the media window after playback when it was initially hidden. This is practical when a remote speaker wants to display images, for example.

## v26.5.0

### ✨ Нові функції

- ✨ **PDF Import**: Added a new PDF import flow to the Publication Media dialog, allowing the PDF version of a publication to be automatically imported as individual images when desired.

## v26.4.8

### ✨ Нові функції

- ✨ **JW Stream**: Added JW Stream to the list of websites that can be mirrored.

## v26.4.0

### ✨ Нові функції

- ✨ **Meeting Timer**: A new meeting timer feature has been added. It is optional and can be enabled in the advanced settings, if desired. The timer can be used to allow the media operator to keep track of the time spent on meeting parts, or to display the time spent on the current meeting part on a dedicated screen visible only to the speaker.

## v26.3.0

### ✨ Нові функції

- ✨ **Memorial Media**: Automatic Memorial media retrieval is now out of beta! The app will automatically download the Memorial Welcome Video and image to display during the Memorial, when available in the configured language.
- ✨ **Playback Speed**: Added playback speed control with visual indicator, and manual reset. This feature is only visible if enabled in the advanced settings.
- ✨ **Pinyin Songs**: Added a toggle for pinyin song substitution for meetings held in Chinese.

## v26.2.0

### ✨ Нові функції

- ✨ **Disk Space Check**: Added functionality to monitor and notify when disk space is low.

## v26.1.5

### ✨ Нові функції

- ✨ **Memorial Media**: Automatically fetch Memorial banner and intro video in supported languages when the Memorial date is selected.

## v26.1.0

### ✨ Нові функції

- ✨ **Automatic Meeting Schedule Sync**: Added the ability to automatically synchronize meeting dates and times with the official website. This feature is enabled by default and can be manually triggered or disabled in advanced settings.
- ✨ **Future Schedule Changes**: The app now includes future schedule changes when creating a congregation using the website lookup, if available.
- ✨ **Shared Cache for Machine-Wide Installations**: Machine-wide installations now share a common data folder by default, optimizing storage and bandwidth usage across multiple users on the same computer.

## v25.12.2

### ✨ Нові функції

- ✨ **Zoom/Pan buttons**: Added the ability to press and hold zoom and pan buttons for continuous adjustment.

## v25.12.0

### ✨ Нові функції

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

### ✨ Нові функції

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

### ✨ Нові функції

- ✨ **Setup Wizard – Zoom Step**: Added a Zoom integration step to the setup wizard for easier initial configuration.
- ✨ **Screen Picker Enhancements**: Show an accurate visual representation of all screens, as well as the main window’s current size and location, in the display popup. This makes it easier to choose the correct screen on which the media window should be displayed.
- ✨ **Media Window Preference**: The app will now remember the preferred screen on which the media window should be displayed, if specified by the user.

## v25.10.0

### ✨ Нові функції

- ✨ **Begin Playback Paused**: Added a new setting to allow playback to begin paused, which can be useful for AV operators to prepare their setup (such as starting Zoom sharing) before the media starts playing in the media window.
- ✨ **Update Notifications**: Users will now be notified of updates through an in-app banner, which will also allow the user to install updates immediately, instead of waiting for the next app restart.
- ✨ **Custom Events**: Added optional events hooks that can trigger keyboard shortcuts when certain events are detected. This can be useful for AV operators to execute actions automatically outside of the app. For example, smart lights could be turned on and off before and after media plays in auditoriums where projectors are used; or a script can be called after a meeting's last song has been played to automate various actions in a Zoom meeting.

## v25.9.1

### ✨ Нові функції

- ✨ **Media Window Always on Top & Fullscreen Behavior**: Fixed and improved always-on-top behavior for the media window, adjusting dynamically based on fullscreen state.
- ✨ **Date Display Format Setting**: Added a user setting to configure a date display format.
- ✨ **Media Crossfade**: Implemented crossfade transitions for media display, instead of the more abrupt fade-to-black transition that was present before.
- ✨ **Music Auto-Stop**: Optimized the behavior of the background music auto-stop to behave the same whether music was auto-started or not
- ✨ **macOS Click-Through on Inactive Windows**: Enabled mouse click passthrough on the main window for macOS, which should make it easier to control the app even when it's not focused.

## v25.9.0

### ✨ Нові функції

- ✨ **Download Popup Enhancements**: Added refresh button and download grouping by date in the download popup.
- ✨ **Watched Media Order Memory**: Added section order memory for watched media items.

## v25.8.3

### ✨ Нові функції

- ✨ **Media Window Fade Transitions**: Added a new advanced setting to make the media window fade in and out, providing smoother visual transitions.
- ✨ **Image Duration Control and Progress Tracking**: Added image duration control and progress tracking capabilities for repeated sections.

## v25.8.1

### ✨ Нові функції

- ✨ **Custom Media Sections**: Complete system for creating, editing, and managing custom media sections with color customization and drag-and-drop reordering.
- ✨ **Media Dividers**: Add titled dividers within media lists for better organization with top/bottom positioning options.
- ✨ **Section Repeat Mode**: Enable continuous playback within specific sections for seamless media loops.
- ✨ **Zoom Integration**: Automatic screen sharing start/stop coordination with media playback.

## v25.7.0

### ✨ Нові функції

- No new features for this release!

## 25.6.0

### ✨ Нові функції

- ✨ **Metered connection setting**: Added a new setting to reduce download bandwidth usage on metered connections.
- ✨ **Improved streamed media handling**: Better support for streamed media, reducing latency-related issues.

## 25.5.0

### ✨ Нові функції

- 🖼️ **OBS Delay Option for Images**: Add an OBS Studio setting to delay scene changes when displaying images, improving transitions.
- 🔊 **Support for `.m4a` Audio Format**: Add compatibility for `.m4a` audio files to expand supported media types.

## 25.4.0

### ✨ Нові функції

- 🇵🇭 **New Language: Tagalog**: Added support for Tagalog, expanding the app's multilingual capabilities.
- 🎞 **Support for `.m4v` Video Format**: Now supports playback of `.m4v` files to improve media compatibility.

## 25.3.1

### ✨ Нові функції

- 🌏 **Нова мова: корейська**: Додано підтримку корейської мови, що розширює доступність для більшої кількості користувачів.

## 25.3.0

### ✨ Нові функції

- 🎵 **Відтворення фонової музики з відео**: Дозволяє фоновій музиці продовжувати грати під час перегляду відео.
- 🎥 **Камера для медіа жестової мови**: Додано можливість відображати камеру на медіа вікні, спеціально для користувачів жестової мови.
- 📅 **Автоматична дата та фон для Спомину**: Автоматично визначає дату Спомину та готує фонове зображення для нього.
- 📜 **Показувати примітки до релізу в додатку**: Відображати примітки до релізу безпосередньо в додатку, щоб користувачі могли легко переглядати зміни після оновлення.

## 25.2.1

### ✨ Нові функції

- 🔄 **Allow OBS Reconnection Attempts**: Introduce the possibility to manually force OBS to reconnect when needed.
- 🗑 **Auto Cleanup Old Export Date Folders**: Automatically remove outdated export date folders to keep storage organized.

## 25.2.0

### ✨ Нові функції

- 🌍 **Use System Locale by Default**: Automatically detect and use the system's locale for a more personalized experience.
- 🏷 **Tag Support for Exported Media**: Add metadata tags to exported media files for better organization.
- 🔄 **Automatic Beta to Stable Downgrade**: Allow automatic downgrades from beta versions to stable releases when necessary.
- 🌐 **Extract Latest MEPS Language Indexes**: Fetch the most recent MEPS language indexes directly from the official website, ensuring up-to-date language support.

## 25.1.0

### ✨ Нові функції

- 📅 **Open Previous Dates**: Allow opening previous dates of the current week, which is useful when the meeting day is moved later in the week.
- 🛑 **Error Banner for OBS Studio**: Add an error banner when OBS Studio is not connected on a meeting day, ensuring users are alerted.
- 📚 **Group Media by Publication**: Group media from the same referred publication for a cleaner and more organized media overview.
- 🎵 **Duplicate Song Warning**: Show a warning if songs are listed more than once in the media list for weekend meetings.
- 🔄 **Future Schedule Planning**: Enable the planning of future meeting schedule changes, which is useful for yearly schedule changes or for the circuit overseer's visit to a neighboring congregation.

## 24.11.0

### ✨ Нові функції

- 🖥️ **Website Presentation on macOS**: Presenting the website is now supported on macOS 🚀
- ⌨️ **Playback Keyboard Shortcuts**: Introduced keyboard shortcuts for stopping, pausing, and resuming media playback 🚀
- 🌐 **Custom Media Download Address**: Added support for setting the web address from which media should be downloaded 🚀
- 🎬 **OBS Instant Scene Picker**: Added OBS Studio instant scene picker and overhauled scene picker functionality in settings
- 📖 **More Documentation Languages**: Expanded documentation website to support more languages

## 24.10.10

### ✨ Нові функції

- ⌨️ **Media Navigation Shortcuts**: Added keyboard shortcuts to navigate to the next/previous media item
- 🖱️ **Media Item Right-Click Menu**: Added a right-click menu to media items to hide media items and rename them
- ✂️ **Trimmed JWL Playlist Import**: Trimmed video times are now respected in imported JWL playlists

## 24.10.9

### ✨ Нові функції

- 🗑️ **Delete Extra Media for a Day**: Added an option to delete all extra media files for the currently selected day
