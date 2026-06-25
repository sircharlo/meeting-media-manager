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

### Date Format {#date-format}

<!-- **Setting**: `localDateFormat` -->

Format used to display dates in the app.

**Example**: D MMMM YYYY

**Default**: D MMMM YYYY

### Auto-Start at Login {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Automatically start M³ when the computer boots up.

**기본값**: `false`

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

**기본값**: 없음

### Midweek Meeting Day {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

The day of the week when your midweek meeting is held.

**Options**: Sunday through Saturday

**기본값**: 없음 (must be set during setup)

### Midweek Meeting Time {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

The start time of your midweek meeting.

**Format**: HH:MM (24-hour format)

**기본값**: 없음 (must be set during setup)

### Weekend Meeting Day {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

The day of the week when your weekend meeting is held.

**Options**: Sunday through Saturday

**기본값**: 없음 (must be set during setup)

### Weekend Meeting Time {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

The start time of your weekend meeting.

**Format**: HH:MM (24-hour format)

**기본값**: 없음 (must be set during setup)

### Circuit Overseer Week {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

The week of the next circuit overseer's visit.

**Format**: MM/DD/YYYY

**기본값**: 없음

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

### Automatic Meeting Schedule Updates {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

When enabled, M³ periodically checks the official website of Jehovah's Witnesses for meeting day and time changes and updates the current profile automatically.

This only works for profiles that were added with congregation lookup and whose congregation name has not been manually changed. If synchronization was disabled because the congregation name changed, use **Enable schedule sync** to link the profile again.

#### Refresh Meeting Schedule {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Manually synchronize the current and future meeting schedule with the information from the official website.

## Media Retrieval and Playback {#media-retrieval-and-playback}

### Metered Connection {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Enable this if you're on a limited data connection to reduce bandwidth usage.

**기본값**: `false`

### Media Display {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Enable the media display functionality. This is required to present media on a second monitor.

**기본값**: `false`

#### Enable Media Preview {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Show a live preview of the media window while an image or video is being displayed.

**Default**: `true`

#### Begin Playback Paused {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Start videos in a paused state when playback begins.

**기본값**: `false`

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

### Cache Management {#cache-management}

#### Enable Extra Cache {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Enable additional caching for better performance.

**기본값**: `false`

#### Cache Folder {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Custom location for storing cached media files.

**Default**: System default location

#### Enable Cache Auto-Clear {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Automatically clear old cached files to save disk space.

**Default**: `true`

### Folder Monitoring {#settings-guide-folder-monitoring}

#### Enable Folder Watcher {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Monitor a folder for new media files and automatically add them to M³.

**기본값**: `false`

#### Folder to Watch {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

The folder path to monitor for new media files.

**Default**: Empty

## 통합 {#integrations}

### Zoom Integration {#settings-guide-zoom-integration}

#### Zoom 활성화 {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Zoom 집회 통합 기능을 활성화합니다.

**기본값**: `false`

#### 화면 공유 단축키 {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Zoom 화면 공유를 실행하는 키보드 단축키입니다.

**기본값**: 없음

### OBS Studio Integration {#settings-guide-obs-integration}

#### OBS 활성화 {#enable-obs}

<!-- **Setting**: `obsEnable` -->

자동 장면 전환을 위해 OBS Studio 통합을 활성화합니다.

**기본값**: `false`

:::warning 중요한 참고 사항

**오디오 구성 필요**: OBS Studio 통합은 화면 공유만 처리합니다. OBS Studio 사용 시 M³ 미디어의 오디오는 Zoom 참가자에게 **자동으로 전송되지 않습니다**. 집회 참석자가 오디오를 들을 수 있도록 Zoom의 원본 오디오 설정을 구성하거나 "컴퓨터 소리 공유"를 사용해야 합니다. 자세한 오디오 설정 지침은 [사용자 가이드](/user-guide#audio-configuration)를 참조하세요.

**참고**: Zoom 통합은 Zoom 기본 화면 공유를 사용하므로 OBS Studio 통합보다 오디오 처리가 더 자연스럽습니다.

:::

#### OBS 포트 {#obs-port}

<!-- **Setting**: `obsPort` -->

OBS Studio WebSocket에 연결할 포트 번호입니다.

**기본값**: 없음

#### OBS 비밀번호 {#obs-password}

<!-- **Setting**: `obsPassword` -->

OBS Studio WebSocket 연결 비밀번호입니다.

**기본값**: 없음

#### OBS 장면 {#obs-scenes}

Configure which OBS scenes to use for different purposes:

- **Camera Scene**: Scene showing the camera/lectern
- **Media Scene**: Scene for displaying media
- **Image Scene**: Scene for displaying images (for example, a PIP scene showing both media and the speaker)

#### 고급 OBS 옵션 {#obs-advanced-options}

- **Postpone Images**: Delay sharing images to OBS until manually triggered
- **빠른 전환**: OBS 통합을 빠르게 켜고 끄는 토글 활성화
- **미디어 후 장면 전환**: 미디어 재생 후 이전 장면으로 자동 복귀
- **Remember Previous Scene**: Remember and restore the previous scene
- **Hide Icons**: Hide OBS-related icons in the interface
- **Recording Controls**: Show controls that start and stop OBS recording from M³

:::warning 중요한 참고 사항

**오디오 구성 필요**: OBS Studio 통합은 비디오/장면 전환만 처리합니다. M³ 미디어 오디오는 Zoom 또는 OBS로 **자동 전송되지 않습니다**. 비디오 스트림은 웹캠처럼 소리 없는 가상 카메라로 동작합니다. 집회 참석자가 오디오를 들을 수 있도록 Zoom의 원본 오디오 설정을 구성하거나 "컴퓨터 소리 공유"를 사용해야 합니다. 자세한 오디오 설정 지침은 [사용자 가이드](/user-guide#audio-configuration)를 참조하세요.

**Alternative**: Consider using the Zoom integration instead, as it uses Zoom's native screen sharing which handles audio more seamlessly.

:::

### 사용자 지정 이벤트 {#custom-events}

#### 사용자 지정 이벤트 활성화 {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

특정 이벤트(예: 미디어 재생/일시정지/중지)가 감지되면 트리거되는 사용자 지정 단축키를 활성화합니다.

**기본값**: `false`

#### Custom Event Shortcuts {#custom-event-shortcuts}

##### Play Media Shortcut {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Shortcut that is triggered when media is played.

**기본값**: 없음

##### Pause Media Shortcut {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Shortcut that is triggered when media is paused.

**기본값**: 없음

##### Stop Media Shortcut {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Shortcut that is triggered when media is stopped.

**기본값**: 없음

##### Last Song Shortcut {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Shortcut that is triggered when the last song is played during a meeting.

**기본값**: 없음

### Meeting Recordings {#meeting-recordings}

#### Enable External Recording App Integration {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Let M³ control a separate recording application with keyboard shortcuts. This does not record inside M³; it sends the configured shortcuts when you press **Start Recording** or **Stop Recording** in the meeting recordings popup.

This option is hidden when OBS recording controls are enabled. If you use OBS Studio, use the OBS recording controls in the OBS integration instead.

**기본값**: `false`

#### Recording Shortcuts and Folder {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Configure the keyboard shortcut that starts recording, the optional shortcut that stops recording, and the folder where the external app saves recordings. If no stop shortcut is provided, M³ reuses the start shortcut. When a folder is configured, M³ shows a button to open it.

### Meeting Timer {#meeting-timer}

#### Enable Meeting Timer {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Enable a separate timer window for timing meeting parts. This is a beta feature and should only be enabled if approved locally.

**기본값**: `false`

#### Timer Window Behavior {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configure whether the timer window opens automatically, whether participant timers count up or down by default, whether the clock uses 12-hour or 24-hour time, and whether the current timer value is shown on the action island timer button.

#### Timer Display Formats {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Choose analog or digital display formats for the time of day and countdown timers. The countdown warning indicator can shift the analog countdown ring toward a warning color during the final minute.

#### Meeting Countdown and Schedule Status {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Show a countdown before scheduled meetings and optionally display whether the meeting is ahead of or behind schedule. The meeting countdown appears only on the timer display, not on the main media display.

#### Timer Appearance and Overtime {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Customize the timer text size and colors, and configure overtime indicators such as alternate colors, blinking, and showing only the elapsed overtime amount in count-up mode.

## 고급 설정 {#advanced-settings}

### Keyboard Shortcuts {#settings-guide-keyboard-shortcuts}

#### 키보드 단축키 활성화 {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

미디어 제어용 사용자 지정 키보드 단축키를 활성화합니다.

**기본값**: `false`

#### Media Control Shortcuts {#media-control-shortcuts}

Configure shortcuts for media playback:

- **Media Window**: Open/close media window
- **Previous Media**: Go to previous media item
- **Next Media**: Go to next media item
- **Pause/Resume**: Pause or resume media playback
- **Stop Media**: Stop media playback
- **Music Toggle**: Toggle background music

### Media Display {#media-display}

#### 미디어 창 페이드 전환 활성화 {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

미디어 창을 표시하거나 숨길 때 페이드 인/아웃 전환을 활성화합니다.

**Default**: `true`

#### Enable Playback Speed Control {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Allow audio and video playback speed to be adjusted from the media item's context menu.

**기본값**: `false`

#### Hide Media Logo {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Hide the logo in the media window.

**기본값**: `false`

#### Maximum Resolution {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximum resolution for downloaded media files.

**Options**: 240p, 360p, 480p, 720p, 1080p

**Default**: 720p

#### Include Printed Media {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Include media from the printed publications in media downloads.

**Default**: `true`

#### Exclude Footnotes {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Exclude footnote images from media downloads when possible.

**기본값**: `false`

#### Exclude Additional Watchtower Study Videos {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Exclude additional videos that are referenced in Watchtower Study paragraphs.

**기본값**: `false`

#### Exclude media from the Teaching brochure {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclude media from the Teaching (th) brochure from media downloads.

**Default**: `true`

### 자막 {#subtitles}

#### 자막 활성화 {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

미디어 재생 시 자막 지원을 활성화합니다.

**기본값**: `false`

#### Subtitle Language {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Language for subtitles (can be different from media language).

**Options**: All available languages from the official website of Jehovah's Witnesses

**기본값**: 없음

### Media Export {#settings-guide-media-export}

#### Enable Media Auto-Export {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Automatically export media files to a specified folder.

**기본값**: `false`

#### Media Export Folder {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Folder path where media files will be automatically exported.

**Default**: Empty

#### Convert Files to MP4 {#convert-files-to-mp4}

**설정**: `convertFilesToMp4`

Convert exported media files to MP4 format for better compatibility.

**기본값**: `false`

### Profile Settings Transfer {#profile-settings-transfer}

Export the current profile's settings to a JSON file or import a previously exported profile settings file. Importing replaces the current profile's settings.

### Danger Zone {#danger-zone}

:::warning Warning

These settings should only be changed if you understand their implications.

:::

#### Base URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Base domain used to download publications and media.

**Default**: `jw.org`

#### Disable Hardware Acceleration {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Disable hardware acceleration after restarting M³. This may help with graphical glitches or crashes on some systems, but is not otherwise recommended.

**기본값**: `false`

#### Suppress Hardware Acceleration Reminder {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Hide the reminder to re-enable hardware acceleration after it has been manually disabled.

**기본값**: `false`

#### Disable Media Fetching {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Completely disable automatic media downloads. Use this only for profiles that will be used for special events or other custom setups.

**기본값**: `false`

## Tips for Optimal Configuration {#configuration-tips}

### 신규 사용자 {#new-users}

1. Start with the setup wizard to configure basic settings
2. 프레젠테이션 기능을 사용하려면 "미디어 표시 버튼"을 활성화하세요
3. Configure your meeting schedule accurately
4. Set up OBS integration if you use hybrid meetings

### 고급 사용자 {#advanced-users}

1. Use folder monitoring to sync media from cloud storage
2. 백업 용도로 미디어 자동 내보내기를 활성화하세요
3. Configure keyboard shortcuts for efficient operation
4. Configure Zoom integration for automatic screen sharing

### 성능 최적화 {#performance-optimization}

1. 더 나은 성능을 위해 추가 캐시를 활성화하세요
2. Use appropriate maximum resolution for your needs
3. Configure cache auto-clear to manage disk space
4. Consider metered connection setting if on limited bandwidth

### 문제 해결 {#settings-guide-troubleshooting}

- If media isn't downloading, check your meeting schedule settings
- If OBS integration isn't working, verify port and password settings
- If performance is slow, try enabling extra cache or reducing resolution
- If you're having language issues, check both interface and media language settings
- If Zoom participants can't hear media audio, configure Zoom's Original Audio settings or use "Share Computer Sound"
- **Tip**: Consider using Zoom integration instead of OBS Studio for simpler audio handling
