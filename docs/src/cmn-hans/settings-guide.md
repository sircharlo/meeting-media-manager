# 设置指南 {#settings-guide}

本综合指南按类别解释了M3中所有可用的设置。 了解这些设置将有助于配置M3来完全满足您会众的需要。 了解这些设置将有助于配置M3来完全满足您会众的需要。

## 应用程序配置 {#application-configuration}

### 显示语言 {#display-language}

<!-- **Setting**: `localAppLang` -->

选择 M3 界面语言。 这只适用于媒体下载的语言。 这只适用于媒体下载的语言。

**选项**：所有可用的界面语言 (英语、西班牙语、法语等)

**默认**：英文

### 暗色模式 {#dark-mode}

<!-- **Setting**: `darkMode` -->

控制 M3 的外观主题。

**选项**：

- 自动matically switch based on system preference
- Always use dark mode
- Always use light mode

**Default**: 自动

### 一周的第一天 {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

设置在日历视图中一周的起始日。

**Options**: 星期日 至 星期六

**Default**: Sunday

### 日期格式 {#date-format}

<!-- **Setting**: `localDateFormat` -->

Format used to display dates in the app.

**Example**: D MMMM YYYY

**Default**: D MMMM YYYY

### 登录时自动启动 {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

计算机启动时自动启动 M³。

**Default**: `false`

## 会众聚会 {#congregation-meetings}

### 会众名称 {#congregation-name}

<!-- **Setting**: `congregationName` -->

The name of your congregation. This is used for organization and display purposes.

**Default**: Empty (must be set during setup)

### 聚会语言 {#meeting-language}

<!-- **Setting**: `lang` -->

The primary language for media downloads. This should match the language used in your congregation's meetings.

**Options**: All available languages from the official website of Jehovah's Witnesses

**Default**: English (E)

### 后备语言 {#fallback-language}

<!-- **Setting**: `langFallback` -->

A secondary language to use when media isn't available in the primary language.

**Options**: All available languages from the official website of Jehovah's Witnesses

**Default**: None

### 周中聚会（星期几）{#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

周中聚会举行的星期几。

**Options**: 星期日 至 星期六

**Default**: 无（需在设置向导中设定）

### 周中聚会开始时间 {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

周中聚会的开始时间。

**Format**: HH:MM（24小时制）

**Default**: 无（需在设置向导中设定）

### 周末聚会（星期几）{#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

周末聚会举行的星期几。

**Options**: 星期日 至 星期六

**Default**: 无（需在设置向导中设定）

### 周末聚会开始时间 {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

周末聚会的开始时间。

**Format**: HH:MM（24小时制）

**Default**: 无（需在设置向导中设定）

### 分区监督探访周 {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

The week of the next circuit overseer's visit.

**Format**: MM/DD/YYYY

**Default**: None

### 纪念晚餐日期 {#memorial-date}

<!-- **Setting**: `memorialDate` -->

The date of the next Memorial celebration (beta feature).

**Format**: MM/DD/YYYY

**Default**: 自动matically retrieved periodically

### 聚会议程变更 {#meeting-schedule-changes}

These settings allow you to configure temporary changes to your meeting schedule:

- **Change Date**: When the change takes effect
- **One-time Change**: Whether this is a permanent or temporary change
- **New Midweek Day**: New day for midweek meeting
- **New Midweek Time**: New time for midweek meeting
- **New Weekend Day**: New day for weekend meeting
- **New Weekend Time**: New time for weekend meeting

## Media Retrieval and Playback {#media-retrieval-and-playback}

### 计量连接 {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Enable this if you're on a limited data connection to reduce bandwidth usage.

**Default**: `false`

### 媒体显示按钮 {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Enable the media display functionality. This is required to present media on a second monitor.

**Default**: `false`

#### Begin Playback Paused {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Start videos in a paused state when playback begins.

**Default**: `false`

### 背景音乐 {#settings-guide-background-music}

#### Enable Music {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Enable background music functionality.

**Default**: `true`

#### 自动-Start Music {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

自动matically start background music when M³ launches if appropriate.

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

### 缓存管理 {#cache-management}

#### Enable Extra Cache {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Enable additional caching for better performance.

**Default**: `false`

#### Cache Folder {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Custom location for storing cached media files.

**Default**: System default location

#### Enable Cache 自动-Clear {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

自动matically clear old cached files to save disk space.

**Default**: `true`

### 文件夹监控 {#settings-guide-folder-monitoring}

#### Enable Folder Watcher {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Monitor a folder for new media files and automatically add them to M³.

**Default**: `false`

#### Folder to Watch {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

The folder path to monitor for new media files.

**Default**: Empty

## Integrations {#integrations}

### Zoom 集成 {#settings-guide-zoom-integration}

#### Enable Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Enable Zoom meeting integration features.

**Default**: `false`

#### Screen Share Shortcut {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Keyboard shortcut to trigger Zoom screen sharing.

**Default**: None

### OBS Studio 集成 {#settings-guide-obs-integration}

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
- **Switch Scene After Media**: 自动matically return to previous scene after media
- **Remember Previous Scene**: Remember and restore the previous scene
- **Hide Icons**: Hide OBS-related icons in the interface

:::warning Important Note

**Audio Configuration Required**: OBS Studio integration only handles video/scene switching. Audio from M³ media is **not automatically transmitted** to Zoom or OBS. The video stream works like a virtual camera without sound, just like a webcam. You must configure Zoom's Original Audio settings or use "Share Computer Sound" to ensure meeting participants can hear the media. See the [User Guide](/user-guide#audio-configuration) for detailed audio setup instructions.

**Alternative**: Consider using the Zoom integration instead, as it uses Zoom's native screen sharing which handles audio more seamlessly.

:::

### 自定义事件 {#custom-events}

#### Enable Custom Events {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Enable custom shortcuts that will be triggered when a specific event is detected (e.g., media is played, paused, or stopped).

**Default**: `false`

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

### 键盘快捷键 {#settings-guide-keyboard-shortcuts}

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

### 媒体显示 {#media-display}

#### Enable Media Window Fade Transitions {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Enable fade-in/out transitions when showing or hiding the media window.

**Default**: `true`

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

### 字幕 {#subtitles}

#### Enable Subtitles {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Enable subtitle support for media playback.

**Default**: `false`

#### Subtitle Language {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Language for subtitles (can be different from media language).

**Options**: All available languages from the official website of Jehovah's Witnesses

**Default**: None

### 媒体导出 {#settings-guide-media-export}

#### Enable Media 自动-Export {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

自动matically export media files to a specified folder.

**Default**: `false`

#### Media Export Folder {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Folder path where media files will be automatically exported.

**Default**: Empty

#### Convert Files to MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

Convert exported media files to MP4 format for better compatibility.

**Default**: `false`

### 危险区域 {#danger-zone}

:::warning 小贴士

These settings should only be changed if you understand their implications.

:::

#### Base URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Base domain used to download publications and media.

**Default**: `jw.org`

#### Disable Media Fetching {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Completely disable automatic media downloads. Use this only for profiles that will be used for special events or other custom setups.

**Default**: `false`

## Tips for Optimal Configuration {#configuration-tips}

### 新手提示 {#new-users}

1. Start with the setup wizard to configure basic settings
2. Enable "Media Display Button" to access presentation features
3. Configure your meeting schedule accurately
4. Set up OBS integration if you use hybrid meetings

### 进阶提示 {#advanced-users}

1. Use folder monitoring to sync media from cloud storage
2. Enable media auto-export for backup purposes
3. Configure keyboard shortcuts for efficient operation
4. Configure Zoom integration for automatic screen sharing

### 性能优化 {#performance-optimization}

1. Enable extra cache for better performance
2. Use appropriate maximum resolution for your needs
3. Configure cache auto-clear to manage disk space
4. Consider metered connection setting if on limited bandwidth

### 疑难解答 {#settings-guide-troubleshooting}

- If media isn't downloading, check your meeting schedule settings
- If OBS integration isn't working, verify port and password settings
- If performance is slow, try enabling extra cache or reducing resolution
- If you're having language issues, check both interface and media language settings
- If Zoom participants can't hear media audio, configure Zoom's Original Audio settings or use "Share Computer Sound"
- **Tip**: Consider using Zoom integration instead of OBS Studio for simpler audio handling
