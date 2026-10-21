# Settings Guide {#settings-guide}

This comprehensive guide explains all the settings available in M³, organized by category. Understanding these settings will help you configure M³ to work perfectly for your congregation's needs.

## General {#application-configuration}

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

#### Enable Schedule Sync {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Re-links the current profile to congregation lookup so automatic meeting day and time updates can resume. Only shown once the congregation name has been changed manually, since that's what breaks the link in the first place.

#### Refresh Meeting Schedule {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Manually synchronize the current and future meeting schedule with the information from the official website.

## Media & Playback {#media-retrieval-and-playback}

### Metered Connection {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Enable this if you're on a limited data connection to reduce bandwidth usage.

**Default**: `false`

### Media Display {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Enable the media display functionality. This is required to present media on a second monitor.

**Default**: `false`

#### Enable Media Preview {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Show a live preview of the media window while an image or video is being displayed.

**Default**: `true`

#### Begin Playback Paused {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Start videos in a paused state when playback begins.

**Default**: `false`

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

### Playback and Download Options {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### Enable Media Window Fade Transitions {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Enable fade-in/out transitions when showing or hiding the media window.

**Default**: `true`

#### Enable Playback Speed Control {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Allow audio and video playback speed to be adjusted from the media item's context menu.

**Default**: `false`

#### Hide Media Logo {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Hide the logo in the media window.

**Default**: `false`

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

**Default**: `false`

#### Exclude Additional Watchtower Study Videos {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Exclude additional videos that are referenced in Watchtower Study paragraphs.

**Default**: `false`

#### Exclude Congregation Bible Study Videos {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Choose publications whose referenced videos should not be shown during the Congregation Bible Study. Search by publication title or symbol.

**Default**: Walk Courageously With God (`wcg`)

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

### Cache Management {#cache-management}

#### Cache Songbook Video Files {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Cache all songbook videos ahead of time for better performance. Note that this increases the size of the media cache.

**Default**: `false`

#### Cache Folder {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Custom location for storing cached media files.

**Default**: System default location

#### Enable Cache Auto-Clear {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Automatically clear old cached files to save disk space.

**Default**: `true`

### Pinyin Song Titles {#pinyin-song-titles}

#### Prefer Pinyin Songs {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

When a pinyin version of a meeting song is found in the pinyin song folder, use it instead of the standard song.

**Default**: `false`

#### Pinyin Song Folder {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

Folder containing pinyin video songs (e.g. `sjjm_s-Pi_CHS_066_r720P.mp4`). When a pinyin file matching the meeting song number is found, it will be played instead of the standard song.

**Default**: Empty

### Media Export {#settings-guide-media-export}

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

### Shared Folder (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

These settings are in the **Integrations** category.

M³ can add media to your meetings from a folder kept in sync by a cloud storage app, such as Dropbox, OneDrive, iCloud Drive or Google Drive. This is useful when others prepare media for their parts and share it with you, or when M³ is used on more than one computer. A folder on this computer or on your network works too.

M³ creates a folder inside the shared folder for each upcoming meeting, named with the meeting's date written as year-month-day (for example, `2026-03-25`). Put photos, videos, audio files or JW Library playlists in a meeting's folder, and they're added to that meeting's media list automatically. To add files for another day, create a folder for it, named the same way. Anything else in the shared folder is ignored.

::: tip Tip

Create a new folder used only for this, such as "Meeting media", and set it to always stay on this computer in your cloud storage app (often called "available offline"), so the files are ready before the meeting starts.

:::

#### Add Media From a Shared Folder {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Add the files put in the shared folder to the right meeting automatically.

**Default**: `false`

#### Shared Folder {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

The folder to add media from. The setup wizard offers to set it up for you.

**Default**: Empty

#### Delete Past Meeting Folders {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

When a week is over, delete that week's dated folders, along with the files in them, to keep the shared folder tidy. Since the folder is shared, they're also deleted for everyone else who uses it. Turn this off to keep them.

**Default**: `true`

## Meeting Timer {#meeting-timer}

### Enable Meeting Timer {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Enable a separate timer window for timing meeting parts. This is a beta feature and should only be enabled if approved locally.

**Default**: `false`

### Timer Window Behavior {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configure whether the timer window opens automatically, whether participant timers count up or down by default, whether the clock uses 12-hour or 24-hour time, and whether the current timer value is shown on the action island timer button.

### Quick Access to the Timer {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Choose how the timer is reached from the main window:

- **Quick controls when hovering the timer button**: hovering the timer button on the action island shows the part being timed, with Start, Pause, Stop and Next part buttons, without opening the full timer popup. On by default.
- **Show a timer panel in the main window**: keeps the whole list of meeting parts and the timer controls in a panel docked on the right side of the main window, always in view. The full popup remains available from the action island for the window and display settings.

### Timer Remote {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemotePort` -->

When turned on, M³ serves a read-only copy of the timer display as a web page on your local network, for a tablet or phone at the lectern: the speaker sees the remaining time without it being on the congregation's screen or in a Zoom share. The page follows the timer in real time, including the pre-meeting countdown, the clock, overtime colors and the hand alert, and all the controls stay in M³.

The addresses to open on the device are listed in the timer popup, with a copy button. Change the port only if another program already uses it. Note that anyone on the same network can open the page while this is on; it shows nothing but the timer.

**Default**: `false`, port `8787`

### Timer Display Formats {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Choose analog or digital display formats for the time of day and countdown timers. The countdown warning indicator can shift the analog countdown ring toward a warning color during the final minute.

The **Analog clock with time arc** countdown format shows the time left for a part as a wedge on an analog clock face, from the minute hand to the planned end, so one glance shows both the time of day and what's left. Overtime shows as a second wedge in the overtime color. It also applies to the pre-meeting countdown and works in count-up mode.

### Meeting Countdown and Schedule Status {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Show a countdown before scheduled meetings and optionally display whether the meeting is ahead of or behind schedule. The meeting countdown appears only on the timer display, not on the main media display.

### Timer Appearance and Overtime {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Customize the timer text size and colors, and configure overtime indicators such as alternate colors, blinking, and showing only the elapsed overtime amount in count-up mode.

## Integrations {#integrations}

This category also holds the [shared folder](#settings-guide-folder-monitoring) settings, for adding media from Dropbox, OneDrive, iCloud Drive or Google Drive.

### Zoom Integration {#settings-guide-zoom-integration}

#### Enable Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Enable Zoom meeting integration features.

**Default**: `false`

#### Screen Share Shortcut {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Keyboard shortcut to trigger Zoom screen sharing.

**Default**: None

#### Auto-Focus Media Window {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Automatically focus the media window after Zoom screen sharing starts. This is usually not required, but can help on some systems if the media window regularly loses focus after screen sharing starts.

**Default**: `false`

### Zoom Meeting Manager {#zoom-meeting-manager}

The Zoom Meeting Manager (beta, Windows only) operates the Zoom desktop app for you around each meeting. Its setup assistant, offered when you turn it on, walks you through each automation.

#### While M³ Operates Zoom {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Zoom offers no proper automation interface, so M³ drives the Zoom app through its accessibility interface, which works without the mouse for nearly everything (the participants list, its menus, the Share window). A few actions can still have to move the mouse or the focused window for a moment, for example to bring Zoom's auto-hidden toolbar back. Whenever that happens, M³ covers its own window with a "M³ is operating Zoom" notice naming what is going on, with a **Cancel this automation** button. The same notice shows during the setup assistant's checks and the self-test. A global keyboard shortcut (default `Ctrl+Alt+Escape`), active only while an automation runs, cancels it from anywhere, even while Zoom has the focus. Cancelling stops M³ at once; Zoom may then be left part-way, so check it.

**Default**: `Ctrl+Alt+Escape`

#### Raised-Hand Helper {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert` -->

During a meeting, M³ watches Zoom's participants list for raised hands. When someone raises their hand, a notification in M³ lets you **unmute** that participant with one click, and, once they are done speaking, **mute them again and lower their hand** with another. The Zoom button on the action island lists the raised hands with the same buttons. Every action goes to that participant's own row in Zoom, by their exact name; if two participants share a name, M³ touches neither.

If the [meeting timer](#meeting-timer) is enabled, a large hand with the participant's name also appears on the timer display for the chairman, and a **Hand alert** button in the timer and Zoom popups shows it by hand. This part needs the timer display; the notifications and buttons work without it.

Zoom marks raised hands in its own language, so M³ first needs to learn how: with your meeting open in Zoom, click **Learn how Zoom marks raised hands**. M³ raises your own hand, reads how Zoom marks it in the participants list and which menu entry lowers it, then lowers it again. The setup assistant offers this step too.

**Default**: `false`

### OBS Studio Integration {#settings-guide-obs-integration}

#### Enable OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Enable OBS Studio integration for automatic scene switching.

**Default**: `false`

::: warning Important Note

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

- **Do Not Automatically Share Images**: Delay sharing images to OBS until manually triggered
- **Quick Toggle**: Enable quick on/off toggle for OBS integration
- **Switch Scene After Media**: Automatically return to previous scene after media
- **Remember Previous Scene**: Remember and restore the previous scene
- **Hide Icons**: Hide OBS-related icons in the interface
- **Recording Controls**: Show controls that start and stop OBS recording from M³

::: warning Important Note

**Audio Configuration Required**: OBS Studio integration only handles video/scene switching. Audio from M³ media is **not automatically transmitted** to Zoom or OBS. The video stream works like a virtual camera without sound, just like a webcam. You must configure Zoom's Original Audio settings or use "Share Computer Sound" to ensure meeting participants can hear the media. See the [User Guide](/user-guide#audio-configuration) for detailed audio setup instructions.

**Alternative**: Consider using the Zoom integration instead, as it uses Zoom's native screen sharing which handles audio more seamlessly.

:::

### Custom Events {#custom-events}

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

### Meeting Recordings {#meeting-recordings}

#### Enable External Recording App Integration {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Let M³ control a separate recording application with keyboard shortcuts. This does not record inside M³; it sends the configured shortcuts when you press **Start Recording** or **Stop Recording** in the meeting recordings popup.

This option is hidden when OBS recording controls are enabled. If you use OBS Studio, use the OBS recording controls in the OBS integration instead.

**Default**: `false`

#### Recording Shortcuts and Folder {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Configure the keyboard shortcut that starts recording, the optional shortcut that stops recording, and the folder where the external app saves recordings. If no stop shortcut is provided, M³ reuses the start shortcut. When a folder is configured, M³ shows a button to open it.

## Interface & Shortcuts {#interface-shortcuts}

### Keyboard Shortcuts {#settings-guide-keyboard-shortcuts}

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

### Add More Media Button {#add-more-media-button}

#### Sections with an Add Media Button {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Choose which meeting sections show their own button for adding your own media, in addition to the "Add media" button in the top toolbar, which always works for every section.

**Default**: Public Talk, Living as Christians, Circuit Overseer's Visit, and Custom sections

#### Compact Add Media Button {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

Only show an icon for the "Add more media"/"Add a song" button in section headers. When disabled, the button also shows text alongside the icon when there's enough room.

**Default**: `true`

### Media Drag Handle {#media-drag-handle}

#### Show Drag Handle {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Show a small handle on each media item for dragging it to reorder. Media items can always be reordered by dragging anywhere on them; this only affects whether the handle icon itself is shown.

**Default**: `true`

### Before/After Meeting Quick Actions {#before-after-meeting-quick-actions}

#### Show Meeting Quick Actions {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Show a before-meeting panel and an after-meeting panel with useful controls (background music, recording) and a customizable checklist for each.

**Default**: `true`

The checklist categories and tasks for both the before-meeting and after-meeting panels are managed from this same settings section: add, rename, reorder, or delete categories and tasks as needed for your congregation.

## Advanced {#advanced-settings}

### Profile Settings Transfer {#profile-settings-transfer}

Export the current profile's settings to a JSON file or import a previously exported profile settings file. Importing replaces the current profile's settings.

### Danger Zone {#danger-zone}

::: warning Warning

These settings should only be changed if you understand their implications.

:::

#### Base URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Base domain used to download publications and media.

**Default**: `jw.org`

#### Disable Hardware Acceleration {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Disable hardware acceleration after restarting M³. This may help with graphical glitches or crashes on some systems, but is not otherwise recommended.

**Default**: `false`

#### Suppress Hardware Acceleration Reminder {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Hide the reminder to re-enable hardware acceleration after it has been manually disabled.

**Default**: `false`

#### Disable Media Fetching {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Completely disable automatic media downloads. Use this only for profiles that will be used for special events or other custom setups.

**Default**: `false`

## Tips for Optimal Configuration {#configuration-tips}

### For New Users {#new-users}

1. Start with the setup wizard to configure basic settings
2. Turn on "Enable media playback" to access presentation features
3. Configure your meeting schedule accurately
4. Set up OBS integration if you use hybrid meetings

### For Advanced Users {#advanced-users}

1. Use a shared folder to add media from cloud storage, such as Dropbox or OneDrive
2. Enable media auto-export for backup purposes
3. Configure keyboard shortcuts for efficient operation
4. Configure Zoom integration for automatic screen sharing

### Performance Optimization {#performance-optimization}

1. Cache songbook video files for better performance
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
