<!-- markdownlint-disable no-duplicate-heading -->

# Was ist neu

Die vollständige Liste der Änderungen zwischen den Versionen finden Sie in unserer CHANGELOG.md Datei auf GitHub.

## v25.8.1

### ✨ Neue Funktionen

- ✨ **Custom Media Sections**: Complete system for creating, editing, and managing custom media sections with color customization and drag-and-drop reordering.
- ✨ **Media Dividers**: Add titled dividers within media lists for better organization with top/bottom positioning options.
- ✨ **Section Repeat Mode**: Enable continuous playback within specific sections for seamless media loops.
- ✨ **Zoom Integration**: Automatic screen sharing start/stop coordination with media playback.

### 🛠️ Verbesserungen und Optimierungen

- 🛠️ **Enhanced Section Headers**: New three-dots menu system with color picker, move up/down controls, repeat options, and delete functionality.
- ✨ **Inline Title Editing**: Edit media item titles directly in the interface without opening separate dialogs.
- 🛠️ **Improved Navigation**: Better keyboard shortcuts with scroll-to-selected functionality and enhanced media navigation.
- 🛠️ **Visual Enhancements**: Animation support during sorting operations and improved drag-and-drop visual feedback.

## 25.6.0

### ✨ Neue Funktionen

- ✨ **Metered connection setting**: Added a new setting to reduce download bandwidth usage on metered connections.
- ✨ **Improved streamed media handling**: Better support for streamed media, reducing latency-related issues.

### 🛠️ Verbesserungen und Optimierungen

- 🛠️ **Better mime type handling**: Improved support for MIME types for better media compatibility.
- 🛠️ **Enhanced navigation drawer**: Improved mini state handling and added tooltip display for better user navigation.
- 🛠️ **Linux compatibility**: Forced GTK 3 usage on Linux to prevent UI and launch issues.

## 25.5.0

### ✨ Neue Funktionen

- 🖼️ **OBS Delay Option for Images**: Add an OBS Studio setting to delay scene changes when displaying images, improving transitions.
- 🔊 **Support for `.m4a` Audio Format**: Add compatibility for `.m4a` audio files to expand supported media types.

### 🛠️ Verbesserungen und Optimierungen

- 🔍 **Restore Zoom with `Ctrl` + `Scroll`**: Re-enable immediate zooming with the control + scroll gesture for easier navigation.
- 👤 **Hide Unused CO Media**: Hide rather than skip unused media for Circuit Overseer visits to maintain a cleaner presentation.
- 🎵 **Improve Duplicate Song Indicator**: Enhance the visual cue for duplicate songs to make them easier to identify.

## 25.4.3

### 🛠️ Verbesserungen und Optimierungen

- ➕ **Clean Up Media From v25.4.x**: Automatically clean up orphaned or misplaced media from v25.4.1 to v25.4.2 to ensure no media is missing or in the wrong place in the media list.

## 25.4.2

### 🛠️ Verbesserungen und Optimierungen

- ➕ **Prevent Duplicate Media**: Avoid adding some media items multiple times to the media list.

## 25.4.1

### 🛠️ Verbesserungen und Optimierungen

- 🎬 **Fix Custom Start/End Time Assignment**: Prevent custom start and end times from being incorrectly applied to the wrong video.
- 📝 **Allow Mismatched Subtitles**: Enable use of subtitles even when they do not perfectly match the media file.
- 🪟 **Disable Rounded Corners on Windows**: Remove rounded corners for the media window on Windows.
- 🖼 **Include Non-Referenced Images in Media List**: Ensure all non-referenced images are added to the media list for completeness.
- ➕ **Prevent Duplicate Media Sections**: Avoid creating multiple media sections for the same media item.
- 📥 **Preserve Playlist Order on Import**: Maintain the original order of JWL playlists during the import process.

## 25.4.0

### ✨ Neue Funktionen

- 🇵🇭 **Neue Sprache: Tagalog**: Unterstützung für Taglog hinzugefügt, um die Mehrsprachigkeit der App zu erweitern.
- 🎞️ **Unterstützung des `.m4v` Video Format**: Unterstützt nun die Wiedergabe von `.m4v` Dateien, um die Medienkompatibilität zu verbessern.

### 🛠️ Verbesserungen und Optimierungen

- 🎬 **Mehrere Start/End-Zeiten für Einzelvideo**: Lasse ein einzelnes Video mehrfach in der Medienliste mit verschiedenen benutzerdefinierten Start-/Endzeiten erscheinen.
- 📤 **Gruppierte Medien in den Auto-Export einbeziehen**: Gruppierte Medienelemente automatisch zusammen mit anderen exportieren.
- 📡 **Korrektur beim Abruf von `.m4v` mittels JW API**: Sichergestellt, dass `.m4v` Dateien korrekt aus der JW API geholt werden.

## 25.3.1

### ✨ Neue Funktionen

- 🌏 **New Language: Korean**: Add support for the Korean language, expanding accessibility for more users.

### 🛠️ Verbesserungen und Optimierungen

- ⚡ **Leistungssteigerung und CPU-Auslastung**: Optimierte Performance um die CPU-Auslastung zu reduzieren und die Effizienz zu steigern.
- 🔄 **Synchronisation- & Absturzprobleme behoben**: Es wurden verschiedene Synchronisation- und Stabilitätsprobleme behoben, um die Zuverlässigkeit zu verbessern.
- 📜 **Versionshinweise für bestehende Versammlungen anzeigen**: Es wurde sichergestellt, dass Versionshinweise auch für bereits bestehende Versammlungen angezeigt werden.

## 25.3.0

### ✨ Neue Funktionen

- 🎵 **Hintergrundmusik mit Videos**: Ermöglicht Hintergrundmusik weiter abzuspielen, während Videos angezeigt werden.
- 🎥 **Camera Feed for Sign Language Media**: Add the ability to display a camera feed on the media window specifically for sign language users.
- 📅 **Automatic Memorial Date & Background**: Automatically detect and set the Memorial date and prepare the Memorial background image.
- 📜 **Show Release Notes In-App**: Display release notes directly in the application so users can easily review changes after an update.

### 🛠️ Verbesserungen und Optimierungen

- ⚡ **Optimize Smart Cache Clearing**: Improve the smart cache-clearing mechanism for better performance and efficiency.
- 📂 **Correct Circuit Overseer Media Placement**: Ensure Circuit Overseer media is placed in the correct section.
- 📅 **Exclude Regular Meeting Media for Memorial**: Prevent fetching standard meeting media for the Memorial to prevent errors.
- 📅 **Hide Regular Meeting Sections on Memorial**: Remove unnecessary meeting sections during the Memorial event for a cleaner layout.
- 📖 **Fix Sign Language Bible Video Downloads**: Correctly download Sign Language Bible chapter videos from JWL playlists.
