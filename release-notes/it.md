<!-- markdownlint-disable no-duplicate-heading -->

# What's New

Per l'elenco completo delle modifiche tra le versioni, consultare il file CHANGELOG.md su GitHub.

## v25.8.1

### ✨ Nuove Funzionalità

- ✨ **Custom Media Sections**: Complete system for creating, editing, and managing custom media sections with color customization and drag-and-drop reordering.
- ✨ **Media Dividers**: Add titled dividers within media lists for better organization with top/bottom positioning options.
- ✨ **Section Repeat Mode**: Enable continuous playback within specific sections for seamless media loops.
- ✨ **Zoom Integration**: Automatic screen sharing start/stop coordination with media playback.

### 🛠️ Miglioramenti e modifiche

- 🛠️ **Enhanced Section Headers**: New three-dots menu system with color picker, move up/down controls, repeat options, and delete functionality.
- ✨ **Inline Title Editing**: Edit media item titles directly in the interface without opening separate dialogs.
- 🛠️ **Improved Navigation**: Better keyboard shortcuts with scroll-to-selected functionality and enhanced media navigation.
- 🛠️ **Visual Enhancements**: Animation support during sorting operations and improved drag-and-drop visual feedback.

## 25.6.0

### ✨ Nuove Funzionalità

- ✨ **Impostazione di connessione a consumo**: Aggiunta una nuova impostazione per ridurre l'utilizzo della banda di download sulle connessioni a consumo.
- ✨ **Migliorata la gestione dei media in streaming**: Migliore supporto per i media in streaming, riducendo i problemi legati alla latenza.

### 🛠️ Miglioramenti e modifiche

- 🛠️ **Migliore gestione dei tipi mime**: Migliorato il supporto per i tipi MIME per una migliore compatibilità dei media.
- 🛠️ **Enhanced navigation drawer**: Improved mini state handling and added tooltip display for better user navigation.
- 🛠️ **Compatibilità Linux**: Utilizzo forzato di GTK 3 su Linux per prevenire problemi di interfaccia utente e lancio.

## 25.5.0

### ✨ Nuove Funzionalità

- 🖼️ **OBS Delay Option for Images**: Add an OBS Studio setting to delay scene changes when displaying images, improving transitions.
- 🔊 **Support for `.m4a` Audio Format**: Add compatibility for `.m4a` audio files to expand supported media types.

### 🛠️ Miglioramenti e modifiche

- 🔍 **Restore Zoom with `Ctrl` + `Scroll`**: Re-enable immediate zooming with the control + scroll gesture for easier navigation.
- 👤 **Hide Unused CO Media**: Hide rather than skip unused media for Circuit Overseer visits to maintain a cleaner presentation.
- 🎵 **Improve Duplicate Song Indicator**: Enhance the visual cue for duplicate songs to make them easier to identify.

## 25.4.3

### 🛠️ Miglioramenti e modifiche

- ➕ **Pulisci i media dalla v25.4.x**: Pulisci automaticamente i media orfani o non piazzati dalla v25.4.1 a v25.4.2 per assicurarsi che nessun supporto manchi o nel posto sbagliato nella lista dei media.

## 25.4.2

### 🛠️ Miglioramenti e modifiche

- ➕ **Impedire i Media Duplicati**: Evita di aggiungere più volte alcuni elementi multimediali all'elenco multimediale.

## 25.4.1

### 🛠️ Miglioramenti e modifiche

- 🎬 **Fix Custom Start/End Time Assignment**: Prevent custom start and end times from being incorrectly applied to the wrong video.
- 📝 **Allow Mismatched Subtitles**: Enable use of subtitles even when they do not perfectly match the media file.
- 🪟 **Disable Rounded Corners on Windows**: Remove rounded corners for the media window on Windows.
- 🖼 **Include Non-Referenced Images in Media List**: Ensure all non-referenced images are added to the media list for completeness.
- ➕ **Prevent Duplicate Media Sections**: Avoid creating multiple media sections for the same media item.
- 📥 **Preserve Playlist Order on Import**: Maintain the original order of JWL playlists during the import process.

## 25.4.0

### ✨ Nuove Funzionalità

- 🇵🇭 **New Language: Tagalog**: Added support for Tagalog, expanding the app's multilingual capabilities.
- 🎞 **Support for `.m4v` Video Format**: Now supports playback of `.m4v` files to improve media compatibility.

### 🛠️ Miglioramenti e modifiche

- 🎬 **Multiple Start/End Times for Single Video**: Allow a single video to appear in the media list multiple times with different custom start/end times.
- 📤 **Include Grouped Media in Auto Export**: Automatically export grouped media items along with others.
- 📡 **Correct `.m4v` Fetching from JW API**: Ensure `.m4v` files are correctly fetched from the JW API.

## 25.3.1

### ✨ Nuove Funzionalità

- 🌏 **New Language: Korean**: Add support for the Korean language, expanding accessibility for more users.

### 🛠️ Miglioramenti e modifiche

- ⚡ **Improve Performance & CPU Usage**: Optimize performance to reduce CPU usage and enhance efficiency.
- 🔄 **Fix Synchronization & Crash Issues**: Resolve various sync-related and stability issues to improve reliability.
- 📜 **Show Release Notes for Existing Congregations**: Ensure release notes are only displayed for congregations that are already loaded.

## 25.3.0

### ✨ Nuove Funzionalità

- 🎵 **Play Background Music with Videos**: Allow background music to continue playing while videos are being viewed.
- 🎥 **Camera Feed for Sign Language Media**: Add the ability to display a camera feed on the media window specifically for sign language users.
- 📅 **Automatic Memorial Date & Background**: Automatically detect and set the Memorial date and prepare the Memorial background image.
- 📜 **Show Release Notes In-App**: Display release notes directly in the application so users can easily review changes after an update.

### 🛠️ Miglioramenti e modifiche

- ⚡ **Optimize Smart Cache Clearing**: Improve the smart cache-clearing mechanism for better performance and efficiency.
- 📂 **Correct Circuit Overseer Media Placement**: Ensure Circuit Overseer media is placed in the correct section.
- 📅 **Exclude Regular Meeting Media for Memorial**: Prevent fetching standard meeting media for the Memorial to prevent errors.
- 📅 **Hide Regular Meeting Sections on Memorial**: Remove unnecessary meeting sections during the Memorial event for a cleaner layout.
- 📖 **Fix Sign Language Bible Video Downloads**: Correctly download Sign Language Bible chapter videos from JWL playlists.
