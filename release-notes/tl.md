<!-- markdownlint-disable no-duplicate-heading -->

# Ano'ng Bago

Para sa makita ang lahat ng mga update, tingnan ang aming CHANGELOG.md na file sa GitHub.

## v25.9.1

### ✨ Mga Bagong Feature

- ✨ **Media Window Always on Top & Fullscreen Behavior**: Fixed and improved always-on-top behavior for the media window, adjusting dynamically based on fullscreen state.
- ✨ **Date Display Format Setting**: Added a user setting to configure a date display format.
- ✨ **Media Crossfade**: Implemented crossfade transitions for media display, instead of the more abrupt fade-to-black transition that was present before.
- ✨ **Music Auto-Stop**: Optimized the behavior of the background music auto-stop to behave the same whether music was auto-started or not.
- ✨ **macOS Click-Through on Inactive Windows**: Enabled mouse click passthrough on the main window for macOS, which should make it easier to control the app even when it's not focused.

## v25.9.0

### ✨ Mga Bagong Feature

- ✨ **Download Popup Enhancements**: Added refresh button and download grouping by date in the download popup.
- ✨ **Watched Media Order Memory**: Added section order memory for watched media items.

## v25.8.3

### ✨ Mga Bagong Feature

- ✨ **Media Window Fade Transitions**: Added a new advanced setting to make the media window fade in and out, providing smoother visual transitions.
- ✨ **Image Duration Control and Progress Tracking**: Added image duration control and progress tracking capabilities for repeated sections.

## v25.8.1

### ✨ Mga Bagong Feature

- ✨ **Custom Media Sections**: Complete system for creating, editing, and managing custom media sections with color customization and drag-and-drop reordering.
- ✨ **Media Dividers**: Add titled dividers within media lists for better organization with top/bottom positioning options.
- ✨ **Section Repeat Mode**: Enable continuous playback within specific sections for seamless media loops.
- ✨ **Zoom Integration**: Automatic screen sharing start/stop coordination with media playback.

### 🛠️ Mga Pinahusay at Inayos

- 🛠️ **Enhanced Section Headers**: New three-dots menu system with color picker, move up/down controls, repeat options, and delete functionality.
- ✨ **Inline Title Editing**: Edit media item titles directly in the interface without opening separate dialogs.
- 🛠️ **Improved Navigation**: Better keyboard shortcuts with scroll-to-selected functionality and enhanced media navigation.
- 🛠️ **Visual Enhancements**: Animation support during sorting operations and improved drag-and-drop visual feedback.

## 25.6.0

### ✨ Mga Bagong Feature

- ✨ **Metered connection setting**: Added a new setting to reduce download bandwidth usage on metered connections.
- ✨ **Improved streamed media handling**: Better support for streamed media, reducing latency-related issues.

### 🛠️ Mga Pinahusay at Inayos

- 🛠️ **Better mime type handling**: Improved support for MIME types for better media compatibility.
- 🛠️ **Enhanced navigation drawer**: Improved mini state handling and added tooltip display for better user navigation.
- 🛠️ **Linux compatibility**: Forced GTK 3 usage on Linux to prevent UI and launch issues.

## 25.5.0

### ✨ Mga Bagong Feature

- 🖼️ **OBS Delay Option for Images**: Add an OBS Studio setting to delay scene changes when displaying images, improving transitions.
- 🔊 **Support for `.m4a` Audio Format**: Add compatibility for `.m4a` audio files to expand supported media types.

### 🛠️ Mga Pinahusay at Inayos

- 🔍 **Restore Zoom with `Ctrl` + `Scroll`**: Re-enable immediate zooming with the control + scroll gesture for easier navigation.
- 👤 **Hide Unused CO Media**: Hide rather than skip unused media for Circuit Overseer visits to maintain a cleaner presentation.
- 🎵 **Improve Duplicate Song Indicator**: Enhance the visual cue for duplicate songs to make them easier to identify.

## 25.4.3

### 🛠️ Mga Pinahusay at Inayos

- ➕ **Clean Up Media Mula sa v25.4.x**: Awtomatikong linisin ang mga maling nailagay na media mula v25.4.1 hanggang v25.4.2 upang matiyak na walang nawawalang media o nasa maling lugar sa media list.

## 25.4.2

### 🛠️ Mga Pinahusay at Inayos

- ➕ **Pigilan ang Dobleng Media**: Iwasang magdagdag ng ilang mga media item nang maraming ulit sa media list.

## 25.4.1

### 🛠️ Mga Pinahusay at Inayos

- 🎬 **Fix Custom Start/End Time Assignment**: Prevent custom start and end times from being incorrectly applied to the wrong video.
- 📝 **Allow Mismatched Subtitles**: Enable use of subtitles even when they do not perfectly match the media file.
- 🪟 **Disable Rounded Corners on Windows**: Remove rounded corners for the media window on Windows.
- 🖼 **Include Non-Referenced Images in Media List**: Ensure all non-referenced images are added to the media list for completeness.
- ➕ **Prevent Duplicate Media Sections**: Avoid creating multiple media sections for the same media item.
- 📥 **Preserve Playlist Order on Import**: Maintain the original order of JWL playlists during the import process.

## 25.4.0

### ✨ Mga Bagong Feature

- 🇵🇭 **Bagong Wika: Tagalog**: Idinagdag ang Tagalog, pinalawak ang paggamit ng app sa iba't ibang wika.
- 🎞 **Tulong sa `.m4v` Video Format**: Ngayon ay mayroon nang playback para sa `.m4v` files upang palawakin ang media compatibility.

### 🛠️ Mga Pinahusay at Inayos

- 🎬 **Multiple Start/End Times sa Iisang Video**: Isang video na lamang sa media list na lilitaw nang higit sa isang beses na may iba-ibang start/end times.
- 📤 **Isama ang Grouped Media sa Auto Export**: Awtomatikong i-export ang mga item sa grouped media kasama ng iba pa.
- 📡 **Wastong Pagkuha ng `.m4v` Mula sa JW API**: Sinigurong ang mga `.m4v` file ay wastong nakuha mula sa JW API.

## 25.3.1

### ✨ Mga Bagong Feature

- 🌏 **Bagong Wika: Korean**: Idinagdag ang Korean, pinalawak ang paggamit ng app sa iba't ibang wika.

### 🛠️ Mga Pinahusay at Inayos

- ⚡ **Pinahusay na Kakayahan at Paggamit ng CPU**: Pinahusay na kakayahan ng CPU upang magamit nang mabuti.
- 🔄 **Pag-ayos sa Pag-synchronize at mga Crash Issues**: Paglutas may kinalaman sa mga problemang ito.
- 📜 **Pagpapakita ng mga Release Notes sa mga Kongregasyon**: Sinisiguradong naka-display ang mga release notes sa mga kongregasyon.

## 25.3.0

### ✨ Mga Bagong Feature

- 🎵 **Mag-play ng Background Music kasama ang Video**: Patuloy na pag-play ng background music habang tinitingnan ang mga video.
- 🎥 **Camera Feed para sa Sign Language Media**: Magpakita ng camera feed sa media window para sa mga gumagamit ng sign language.
- 📅 **Awtomatikong Petsa ng Memoryal at Background**: Awtomatikong tukuyin at i-set ang petsa ng Memoryal at ihanda ang background image para rito.
- 📜 **Ipakita ang Release Notes sa App**: Ipakita ang release notes sa mismong application upang makita ng mga gumagamit ang mga binago pagtapos ng update.

### 🛠️ Mga Pinahusay at Inayos

- ⚡ \*\*Pag-optimize ng Smart Cache Clearing: Pinaganda ang awtomatikong clearing ng cache.
- 📂 **Wastong Media para sa Circuit Overseer**: Tinitiyak na ang media para sa Circuit Overseer ay mailalagay sa tamang seksyon.
- 📅 **Pag-alis ng Media para sa Pulong para sa Memoryal**: Pagpigil sa pagkuha ng karaniwang meeting media para sa Memoryal upang maiwasan ang error.
- 📅 **Pagtago ng mga Meeting Section sa Memoryal**: Mas malinis na layout habang Memoryal.
- 📖 **Inayos na Pag-download ng Sign Language Bible Video**: Tamang pag-download ng mga video sa bawat kabanata ng Bibliya sa wikang Sign Language mula sa JWL playlist.
