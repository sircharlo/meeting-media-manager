# Arata’i nō te mau fa’anahora’a {#settings-guide}

E fa’ata’a teie arata’i a’ano i te mau fa’anahora’a ato’a i roto i te M³, ma te tufa-’a’ano-hia ’ia au i te mau tuha’a. E tauturu te māramarama-maita’i-ra’a i teie mau fa’anahora’a ia ’oe i te fa’anaho maita’i i te M³ ’ia au i te mau hina’aro o tō ’oe amuira’a.

## Fa’anahora’a o te Mave {#application-configuration}

### Reo fa’a’ite {#display-language}

<!-- **Setting**: `localAppLang` -->

Mā’iti i te reo nō te tāpura o te M³. E ’ere teie i te mea ti’aturi i ni’a i te reo e fa’a’ohipahia nō te uta-mai i te mau mēdia.

Mau mā’itira’a (Options): Te mau reo ato’a e vai nei nō te tāpura (Perētānia, Paniora, Farāni, e te tahi atu mau reo)

Fa’anahora’a tumu: Reo Perētānia

### Mode Pōuri {#dark-mode}

<!-- **Setting**: `darkMode` -->

E fa’atere i te huru o te M³.

Mau mā’itira’a:

- Fa’a’ohipa-’aunoa-ra’a ’ia au i te fa’anahora’a o te rorouira
- Fa’a’ohipa i te huru pōuri i te mau taime ato’a
- Fa’a’ohipa i te huru māramarama i te mau taime ato’a

Fa’anahora’a tumu: ’Aunoa

### Mahana mātāmua o te hepetoma {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Fa’anaho i te mahana mātāmua o te hepetoma i ni’a i te tapura mahana.

Mau mā’itira’a: Tapati e tae atu i te Mahana mā’a

Fa’anahora’a tumu: Tapati

### Hurura’a o te mahana {#date-format}

<!-- **Setting**: `localDateFormat` -->

Te huru fa’a’ite i te mau mahana i ni’a i te M³.

Hi’ora’a: M AAAA MMMM

Fa'anahora'a tumu: M AAAA MMMM

### Fa’a’ohipa-’aunoa-ra’a i te taime e tomo ai {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Fa’a’ohipa-’aunoa-hia te M³ i te taime ’ia tū te rorouira.

Fa'anahora'a tumu: `Hape`

## Putuputura’a a te ’amuira’a {#congregation-meetings}

### I’oa o te ’amuira’a {#congregation-name}

<!-- **Setting**: `congregationName` -->

Te i’oa o tō ’oe ’amuira’a. E fa’a’ohipahia teie nō te fa’anahora’a e te fa’a’itera’a.

Fa’anahora’a tumu: ’Aita e mea (e tano ’ia fa’ata’ahia i te taime o te fa’anahora’a)

### Reo o te putuputura’a {#meeting-language}

<!-- **Setting**: `lang` -->

Te reo tumu nō te tairi-mana’o-ra’a i te mau rorouira. E tano teie ia tu’ati i te reo e fa’a’ohipahia i roto i te mau putuputura’a a tō ’oe ’amuira’a.

**Options**: All available languages from the official website of Jehovah's Witnesses

**Default**: English (E)

### Fallback Language {#fallback-language}

<!-- **Setting**: `langFallback` -->

A secondary language to use when media isn't available in the primary language.

**Options**: All available languages from the official website of Jehovah's Witnesses

**Default**: None

### Midweek Meeting Day {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

The day of the week when your midweek meeting is held.

Mau mā’itira’a: Tapati e tae atu i te Mahana mā’a

**Default**: None (must be set during setup)

### Midweek Meeting Time {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

The start time of your midweek meeting.

**Format**: HH:MM (24-hour format)

**Default**: None (must be set during setup)

### Weekend Meeting Day {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

The day of the week when your weekend meeting is held.

Mau mā’itira’a: Tapati e tae atu i te Mahana mā’a

**Default**: None (must be set during setup)

### Weekend Meeting Time {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

The start time of your weekend meeting.

**Format**: HH:MM (24-hour format)

**Default**: None (must be set during setup)

### Circuit Overseer Week {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

The week of the next circuit overseer's visit.

**Format**: MM/DD/YYYY

**Default**: None

### Memorial Date {#memorial-date}

<!-- **Setting**: `memorialDate` -->

The date of the next Memorial celebration.

**Format**: MM/DD/YYYY

**Default**: Automatically retrieved periodically

### Meeting Schedule Changes {#meeting-schedule-changes}

These settings allow you to configure temporary changes to your meeting schedule:

- **Change Date**: When the change takes effect
- **One-time Change**: Whether this is a permanent or temporary change
- **New Midweek Day**: New day for midweek meeting
- **New Midweek Time**: New time for midweek meeting
- **New Weekend Day**: New day for weekend meeting
- **New Weekend Time**: New time for weekend meeting

## Media Retrieval and Playback {#media-retrieval-and-playback}

### Metered Connection {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Enable this if you're on a limited data connection to reduce bandwidth usage.

Fa'anahora'a tumu: `Hape`

### Media Display {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Enable the media display functionality. This is required to present media on a second monitor.

Fa'anahora'a tumu: `Hape`

#### Begin Playback Paused {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Start videos in a paused state when playback begins.

Fa'anahora'a tumu: `Hape`

### Background Music {#settings-guide-background-music}

#### Enable Music {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Enable background music functionality.

**Default**: `true`

#### Auto-Start Music {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Automatically start background music when M³ launches if appropriate.

**Default**: `true`

#### Meeting Stop Buffer {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

How many seconds before meeting start time to stop background music.

**Range**: 0-300 seconds

**Default**: 60 seconds

#### Music Volume {#music-volume}

<!-- **Setting**: `musicVolume` -->

Volume level for background music (1-100%).

**Default**: 100%

### Fa’anahora’a o te tairura’a {#cache-management}

#### Fa’ati’a i te tairura’a hau {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Fa’ati’a i te tairura’a hau nō te fa’anahora’a maita’i a’e.

Fa'anahora'a tumu: `Hape`

#### Putu’a tairura’a {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Vāhi fa’ata’ahia nō te tairura’a i te mau rorouira ha’amāramaramara’a.

Fa’anahora’a tumu: Vāhi i fa’ata’ahia e te rorouira

#### Fa’ati’a i te ha’amāua-’ōtohe-ra’a o te tairura’a {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Ha’amāua-’ōtohe-ra’a i te mau tairura’a tahito nō te fa’aherehere i te vāhi i ni’a i te pāhani rorouira.

**Default**: `true`

### Te hi’opo’ara’a i te putu’a {#settings-guide-folder-monitoring}

#### Fa’ati’a i te hi’opo’a-’ōtohe-ra’a putu’a {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Hi’opo’a i te hō’ē putu’a nō te ’imi i te mau rorouira ’āpī e te tāpiri-’ōtohe-ra’a i te reira i roto i te M³.

Fa'anahora'a tumu: `Hape`

#### Putu’a nō te hi’opo’a {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Te arata’i o te putu’a nō te hi’opo’a i te mau rorouira ’āpī.

Fa’anahora’a tumu: ’Aita

## Te mau tāpirira’a {#integrations}

### Tāpirira’a Zoom {#settings-guide-zoom-integration}

#### Fa’ati’a i te Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Fa’ati’a i te mau rāve’a tāpirira’a o te putuputura’a Zoom.

Fa'anahora'a tumu: `Hape`

#### Pāotira’a nō te fa’a’ite i te vairaa o te rorouira {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Pāotira’a nō ni’a i te tāhitohito nō te fa’a’ite i te vairaa o te rorouira Zoom.

**Default**: None

### Tāpirira’a OBS Studio {#settings-guide-obs-integration}

#### Enable OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Enable OBS Studio integration for automatic scene switching.

Fa'anahora'a tumu: `Hape`

:::warning Important Note

**Audio Configuration Required**: The OBS Studio integration only handles screen sharing. Audio from M³ media is **not automatically transmitted** to Zoom participants when using OBS Studio. You must configure Zoom's Original Audio settings or use "Share Computer Sound" to ensure meeting participants can hear the media. See the [User Guide](/user-guide#audio-configuration) for detailed audio setup instructions.

**Note**: The Zoom integration uses Zoom's native screen sharing which handles audio more seamlessly than OBS Studio integration.

:::

#### OBS Port {#obs-port}

<!-- **Setting**: `obsPort` -->

The port number for connecting to OBS Studio WebSocket.

**Default**: None

#### OBS Password {#obs-password}

<!-- **Setting**: `obsPassword` -->

The password for OBS Studio WebSocket connection.

**Default**: None

#### OBS Scenes {#obs-scenes}

Configure which OBS scenes to use for different purposes:

- **Camera Scene**: Scene showing the camera/lectern
- **Media Scene**: Scene for displaying media
- **Image Scene**: Scene for displaying images (for example, a PIP scene showing both media and the speaker)

#### OBS Advanced Options {#obs-advanced-options}

- **Postpone Images**: Delay sharing images to OBS until manually triggered
- **Quick Toggle**: Enable quick on/off toggle for OBS integration
- **Switch Scene After Media**: Automatically return to previous scene after media
- **Remember Previous Scene**: Remember and restore the previous scene
- **Hide Icons**: Hide OBS-related icons in the interface

:::warning Important Note

**Audio Configuration Required**: OBS Studio integration only handles video/scene switching. Audio from M³ media is **not automatically transmitted** to Zoom or OBS. The video stream works like a virtual camera without sound, just like a webcam. You must configure Zoom's Original Audio settings or use "Share Computer Sound" to ensure meeting participants can hear the media. See the [User Guide](/user-guide#audio-configuration) for detailed audio setup instructions.

**Alternative**: Consider using the Zoom integration instead, as it uses Zoom's native screen sharing which handles audio more seamlessly.

:::

### Custom Events {#custom-events}

#### Enable Custom Events {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Enable custom shortcuts that will be triggered when a specific event is detected (e.g., media is played, paused, or stopped).

Fa'anahora'a tumu: `Hape`

#### Custom Event Shortcuts {#custom-event-shortcuts}

##### Play Media Shortcut {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Shortcut that is triggered when media is played.

**Default**: None

##### Pause Media Shortcut {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Shortcut that is triggered when media is paused.

**Default**: None

##### Stop Media Shortcut {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Shortcut that is triggered when media is stopped.

**Default**: None

##### Last Song Shortcut {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Shortcut that is triggered when the last song is played during a meeting.

**Default**: None

## Advanced Settings {#advanced-settings}

### Keyboard Shortcuts {#settings-guide-keyboard-shortcuts}

#### Enable Keyboard Shortcuts {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Enable customizable keyboard shortcuts for media control.

Fa'anahora'a tumu: `Hape`

#### Media Control Shortcuts {#media-control-shortcuts}

Configure shortcuts for media playback:

- **Media Window**: Open/close media window
- **Previous Media**: Go to previous media item
- **Next Media**: Go to next media item
- **Pause/Resume**: Pause or resume media playback
- **Stop Media**: Stop media playback
- **Music Toggle**: Toggle background music

### Media Display {#media-display}

#### Enable Media Window Fade Transitions {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Enable fade-in/out transitions when showing or hiding the media window.

**Default**: `true`

#### Hide Media Logo {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Hide the logo in the media window.

Fa'anahora'a tumu: `Hape`

#### Maximum Resolution {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximum resolution for downloaded media files.

**Options**: 240p, 360p, 480p, 720p

**Default**: 720p

#### Include Printed Media {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Include media from the printed publications in media downloads.

**Default**: `true`

#### Exclude Footnotes {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Exclude footnote images from media downloads when possible.

Fa'anahora'a tumu: `Hape`

#### Exclude media from the Teaching brochure {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclude media from the Teaching (th) brochure from media downloads.

**Default**: `true`

### Subtitles {#subtitles}

#### Enable Subtitles {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Enable subtitle support for media playback.

Fa'anahora'a tumu: `Hape`

#### Subtitle Language {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Language for subtitles (can be different from media language).

**Options**: All available languages from the official website of Jehovah's Witnesses

**Default**: None

### Media Export {#settings-guide-media-export}

#### Enable Media Auto-Export {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Automatically export media files to a specified folder.

Fa'anahora'a tumu: `Hape`

#### Media Export Folder {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Folder path where media files will be automatically exported.

Fa’anahora’a tumu: ’Aita

#### Convert Files to MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

Convert exported media files to MP4 format for better compatibility.

Fa'anahora'a tumu: `Hape`

### Danger Zone {#danger-zone}

:::warning Fa’aarara’a

These settings should only be changed if you understand their implications.

:::

#### Base URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Base domain used to download publications and media.

**Default**: `jw.org`

#### Disable Media Fetching {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Completely disable automatic media downloads. Use this only for profiles that will be used for special events or other custom setups.

Fa'anahora'a tumu: `Hape`

## Tips for Optimal Configuration {#configuration-tips}

### For New Users {#new-users}

1. Start with the setup wizard to configure basic settings
2. Enable "Media Display Button" to access presentation features
3. Configure your meeting schedule accurately
4. Set up OBS integration if you use hybrid meetings

### For Advanced Users {#advanced-users}

1. Use folder monitoring to sync media from cloud storage
2. Enable media auto-export for backup purposes
3. Configure keyboard shortcuts for efficient operation
4. Configure Zoom integration for automatic screen sharing

### Performance Optimization {#performance-optimization}

1. Enable extra cache for better performance
2. Use appropriate maximum resolution for your needs
3. Configure cache auto-clear to manage disk space
4. Consider metered connection setting if on limited bandwidth

### Troubleshooting {#settings-guide-troubleshooting}

- If media isn't downloading, check your meeting schedule settings
- If OBS integration isn't working, verify port and password settings
- If performance is slow, try enabling extra cache or reducing resolution
- If you're having language issues, check both interface and media language settings
- If Zoom participants can't hear media audio, configure Zoom's Original Audio settings or use "Share Computer Sound"
- **Tip**: Consider using Zoom integration instead of OBS Studio for simpler audio handling
