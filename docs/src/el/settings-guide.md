# Settings Guide {#settings-guide}

This comprehensive guide explains all the settings available in M³, organized by category. Understanding these settings will help you configure M³ to work perfectly for your congregation's needs.

## Application Configuration {#application-configuration}

### Display Language {#display-language}

<!-- **Setting**: `localAppLang` -->

Choose the language for M³'s interface. This is independent of the language used for media downloads.

**Options**: All available interface languages (English, Spanish, French, etc.)

**Default**: English

### Dark Mode {#dark-mode}

<!-- **Setting**: `darkMode` -->

Control the appearance theme of M³.

**Options**:

- Automatically switch based on system preference
- Always use dark mode
- Always use light mode

**Default**: Auto

### First Day of Week {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Set which day should be considered the first day of the week in the calendar view.

**Options**: Sunday through Saturday

**Default**: Sunday

### Auto-Start at Login {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Automatically start M³ when the computer boots up.

**Default**: `false`

## Congregation Meetings {#congregation-meetings}

### Congregation Name {#congregation-name}

<!-- **Setting**: `congregationName` -->

The name of your congregation. This is used for organization and display purposes.

**Default**: Empty (must be set during setup)

### Meeting Language {#meeting-language}

<!-- **Setting**: `lang` -->

The primary language for media downloads. This should match the language used in your congregation's meetings.

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

**Options**: Sunday through Saturday

**Default**: None (must be set during setup)

### Midweek Meeting Time {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

The start time of your midweek meeting.

**Format**: HH:MM (24-hour format)

**Default**: None (must be set during setup)

### Weekend Meeting Day {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

The day of the week when your weekend meeting is held.

**Options**: Sunday through Saturday

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

The date of the next Memorial celebration (beta feature).

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

**Default**: `false`

### Media Display {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Enable the media display functionality. This is required to present media on a second monitor.

**Default**: `false`

### Background Music {#background-music}

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

### Cache Management {#cache-management}

#### Enable Extra Cache {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Enable additional caching for better performance.

**Default**: `false`

#### Cache Folder {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Custom location for storing cached media files.

**Default**: System default location

#### Enable Cache Auto-Clear {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Automatically clear old cached files to save disk space.

**Default**: `true`

### Folder Monitoring {#folder-monitoring}

#### Enable Folder Watcher {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Monitor a folder for new media files and automatically add them to M³.

**Default**: `false`

#### Folder to Watch {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

The folder path to monitor for new media files.

**Default**: Empty

## Integrations {#integrations}

### Zoom Integration {#zoom-integration}

#### Enable Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Enable Zoom meeting integration features.

**Default**: `false`

#### Screen Share Shortcut {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Keyboard shortcut to trigger Zoom screen sharing.

**Default**: None

### OBS Studio Integration {#obs-integration}

#### Enable OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Enable OBS Studio integration for automatic scene switching.

**Default**: `false`

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

## Advanced Settings {#advanced-settings}

### Keyboard Shortcuts {#keyboard-shortcuts}

#### Enable Keyboard Shortcuts {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Enable customizable keyboard shortcuts for media control.

**Default**: `false`

#### Media Control Shortcuts {#media-control-shortcuts}

Configure shortcuts for media playback:

- **Media Window**: Open/close media window
- **Previous Media**: Go to previous media item
- **Next Media**: Go to next media item
- **Pause/Resume**: Pause or resume media playback
- **Stop Media**: Stop media playback
- **Music Toggle**: Toggle background music

### Media Display {#media-display}

#### Hide Media Logo {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Hide the logo in the media window.

**Default**: `false`

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

**Default**: `false`

#### Exclude media from the Teaching brochure {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclude media from the Teaching (th) brochure from media downloads.

**Default**: `true`

### Subtitles {#subtitles}

#### Enable Subtitles {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Enable subtitle support for media playback.

**Default**: `false`

#### Subtitle Language {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Language for subtitles (can be different from media language).

**Options**: All available languages from the official website of Jehovah's Witnesses

**Default**: None

### Media Export {#media-export}

#### Enable Media Auto-Export {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Automatically export media files to a specified folder.

**Default**: `false`

#### Media Export Folder {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Folder path where media files will be automatically exported.

**Default**: Empty

#### Convert Files to MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

Convert exported media files to MP4 format for better compatibility.

**Default**: `false`

### Danger Zone {#danger-zone}

:::warning Προειδοποίηση

These settings should only be changed if you understand their implications.

:::

#### Disable Media Fetching {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Completely disable automatic media downloads. Use this only for profiles that will be used for special events or other custom setups.

**Default**: `false`

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

### Troubleshooting {#troubleshooting}

- If media isn't downloading, check your meeting schedule settings
- If OBS integration isn't working, verify port and password settings
- If performance is slow, try enabling extra cache or reducing resolution
- If you're having language issues, check both interface and media language settings
- If Zoom participants can't hear media audio, configure Zoom's Original Audio settings or use "Share Computer Sound"
- **Tip**: Consider using Zoom integration instead of OBS Studio for simpler audio handling
