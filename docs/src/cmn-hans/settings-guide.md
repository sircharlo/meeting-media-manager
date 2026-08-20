# 设置指南

本综合指南按类别说明所有可用设置。了解这些设置，可以帮助你根据会众的实际需要配置 M³。 了解这些设置将有助于配置M3来完全满足您会众的需要。

## 应用程序配置

### 显示语言

<!-- **Setting**: `localAppLang` -->

选择 M³ 的界面语言。此设置不会影响媒体下载所使用的语言。 这只适用于媒体下载的语言。

**选项**：所有可用的界面语言（英语、西班牙语、法语等）

**默认**：英语（English）

### 暗色模式

<!-- **Setting**: `darkMode` -->

控制 M³ 的界面主题。

**选项**：

- **自动**：根据系统设置自动切换
- **深色**：始终使用暗色模式
- 始终使用浅色模式

**默认**：自动

### 每周的第一天

<!-- **Setting**: `firstDayOfWeek` -->

设置日历视图中每周从哪一天开始。

**选项**：星期日至星期六

**默认**：星期日

### 日期格式

<!-- **Setting**: `localDateFormat` -->

设置应用程序中日期的显示格式。

**示例**：D MMMM YYYY

**默认**：D MMMM YYYY

### 登录时自动启动

<!-- **Setting**: `autoStartAtLogin` -->

计算机启动时自动启动 M³。

**默认**：`false`

## 会众聚会 {#congregation-meetings}

### 会众名称 {#congregation-name}

<!-- **Setting**: `congregationName` -->

你的会众名称。 用来安排和显示。

**默认**：空（需要在初始设置期间设置）

### 聚会语言

<!-- **Setting**: `lang` -->

下载聚会媒体时使用的主要语言。通常应与会众聚会所使用的语言一致。 这应与您的会众聚会所使用的语言相匹配。

**选项**：耶和华见证人官方网站上提供的所有语言

**默认**：英语

### 备用媒体语言 {#fallback-language}

<!-- **Setting**: `langFallback` -->

当媒体在主要语言中不可用时使用的第二语言。

**选项**：耶和华见证人官方网站提供的所有语言

**默认**：无

### 周中聚会日 {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

周中聚会举行的星期几。

**选项**：星期日至星期六

**默认**：无（需在设置向导中设置）

### 周中聚会时间 {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

周中聚会开始的时间。

**格式**：HH:MM（24 小时制）

**Default**: 无（需在设置向导中设定）

### 周末聚会日 {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

周末聚会在哪一天举行。

**选项**：星期日至星期六

**默认**：无（需在设置向导中设置）

### 周末聚会时间

<!-- **Setting**: `weStartTime` -->

周末聚会开始的时间。

**Format**: HH:MM（24小时制）

**默认**：无（需要在初始设置中设置）

### 分区监督探访周 {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

下一次分区监督探访所在的星期。

**格式**：MM/DD/YYYY

**默认**：无

### 纪念聚会日期

<!-- **Setting**: `memorialDate` -->

下一次纪念聚会的日期。

**格式**：MM/DD/YYYY

**默认**：通常会自动获取

### 聚会时间安排变更

这些设置用于配置聚会时间安排的临时或长期变更：

- **变更日期**：新的时间安排从哪一天开始生效
- **只变更一周**：指定这次变更是一次性的，还是从此以后持续生效
- **新的周中聚会日**：周中聚会改到哪一天
- **新的周中聚会时间**：周中聚会新的开始时间
- **新的周末聚会日**：周末聚会改到哪一天
- **新的周末聚会时间**：周末聚会新的开始时间

### 自动更新聚会时间安排 {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

启用后，M³ 会定期检查耶和华见证人官方网站，查看会众当前和未来的聚会日期或时间是否有变化，并自动更新当前配置。

This only works for profiles that were added with congregation lookup and whose congregation name has not been manually changed. If synchronization was disabled because the congregation name changed, use **Enable schedule sync** to link the profile again.

#### 刷新聚会时间安排 {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

手动将当前和未来的聚会时间安排与官方网站提供的信息同步。

## 媒体和播放

### 计量连接

<!-- **Setting**: `meteredConnection` -->

如果当前网络流量有限，例如使用移动数据，可以启用此选项以减少数据使用量。

**Default**: `false`

### 启用媒体显示

<!-- **Setting**: `enableMediaDisplayButton` -->

启用媒体显示功能。如果需要在第二个显示器上显示媒体，必须启用此功能。 This is required to present media on a second monitor.

**Default**: `false`

#### 启用媒体预览 {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

显示图片或视频时，在主界面中实时预览媒体窗口的内容。

**默认**：`true`

#### 以暂停状态开始播放

<!-- **Setting**: `beginPlaybackPaused` -->

开始播放音频或视频时，先保持暂停状态。

**Default**: `false`

### 背景音乐

#### 启用背景音乐

<!-- **Setting**: `enableMusicButton` -->

启用背景音乐播放功能。

**默认**：`true`

#### 自动开始播放背景音乐

<!-- **Setting**: `autoStartMusic` -->

在适当情况下，M³ 启动后会在聚会前自动开始播放背景音乐。

**默认**：`true`

#### 聚会停止缓冲

<!-- **Setting**: `meetingStopBufferSeconds` -->

设置在聚会开始前多少秒停止播放背景音乐。

**范围**：0-300 秒

**默认**：100 秒

#### 背景音乐音量

<!-- **Setting**: `musicVolume` -->

设置背景音乐的音量（1-100%）。

**默认**：100%

### 缓存管理

#### 启用额外缓存

<!-- **Setting**: `enableExtraCache` -->

缓存额外媒体，以改善加载和播放性能。

**Default**: `false`

#### 缓存文件夹

<!-- **Setting**: `cacheFolder` -->

设置缓存媒体文件的自定义存储位置。

**默认**：自动设置

#### 启用缓存自动清理

<!-- **Setting**: `enableCacheAutoClear` -->

自动清理未使用的缓存文件，以节省磁盘空间。

**默认**：`true`

### 监视文件夹

#### 启用文件夹监视

<!-- **Setting**: `enableFolderWatcher` -->

监视指定文件夹中的新媒体文件，并自动将其添加到 M³。

**Default**: `false`

#### 要监视的文件夹 {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

设置要监视新媒体文件的文件夹路径。

**默认**：空

## 集成

### Zoom 集成

#### 启用 Zoom

<!-- **Setting**: `zoomEnable` -->

Enable Zoom meeting integration features.

**Default**: `false`

#### 屏幕共享快捷键

<!-- **Setting**: `zoomScreenShareShortcut` -->

设置用于触发 Zoom“开始/停止屏幕共享”的键盘快捷键。

**默认**：无

### OBS Studio 集成

#### 启用 OBS Studio

<!-- **Setting**: `obsEnable` -->

启用 OBS Studio 集成，以便自动切换场景。

**Default**: `false`

:::warning 重要提示

**需要配置音频**：OBS Studio 集成仅处理屏幕共享。使用 OBS Studio 时，M³ 媒体的音频**不会自动传输**给 Zoom 与会者。您必须配置 Zoom 的“原始音频 (Original Audio)”设置或使用“共享电脑声音”以确保与会者能听到媒体。有关详细的音频设置说明，请参阅[用户指南](/user-guide#audio-configuration)。 **需要配置音频**：OBS Studio 集成只负责视频和场景切换。M³ 媒体的声音不会通过视频流自动传输给 Zoom。视频流类似一个没有声音的虚拟摄像头。 您必须配置 Zoom 原始音频设置或使用 “共享计算机声音” 以确保聚会参与者能够听到媒体。 详细说明请参阅[用户指南](/user-guide#audio-configuration)。

**提示**：也可以考虑使用 Zoom 集成。Zoom 集成使用 Zoom 原生的屏幕共享功能，因此音频处理通常更方便。

:::

#### OBS 端口

<!-- **Setting**: `obsPort` -->

OBS Studio WebSocket 连接所使用的端口号。

**默认**：无

#### OBS 密码

<!-- **Setting**: `obsPassword` -->

OBS Studio WebSocket 连接所使用的密码。

**默认**：无

#### OBS 场景

可以为不同用途设置 OBS 场景：

- **摄像机场景**：显示摄像头或讲台画面的场景
- **媒体场景**：显示媒体窗口的场景
- **图片场景**：专门用于显示图片的场景，例如同时显示媒体和发言人的画中画场景

#### OBS 高级选项

- **延迟图片（Postpone Images）**：在手动触发前，不向 Zoom 参与者显示图片
- **快速场景切换器**：在界面中快速打开场景切换器
- **媒体播放结束后切换场景**：等当前媒体播放完毕后再切换场景
- **记住之前使用的场景**：媒体播放结束后恢复媒体播放前所使用的场景
- **隐藏图标**：在场景切换器中隐藏图标
- **录制控制**：从 M³ 中控制 OBS Studio 开始或停止录制

:::warning Important Note

**需要音频配置**：OBS Studio 集成只处理视频/场景切换。 来自 M3 媒体的音频**不会自动传输**到 Zoom 或 OBS。 视频流像一个没有声音的虚拟摄像头，类似于摄像头一样。 您必须配置 Zoom 原始音频设置或使用 “共享计算机声音” 以确保聚会参与者能够听到媒体。 详细说明请参阅[用户指南](/user-guide#audio-configuration)。

**替代方案**：可以考虑改用 Zoom 集成，因为它使用 Zoom 原生屏幕共享，音频处理通常更直接。

:::

### 自定义事件

#### 自定义事件快捷键

<!-- **Setting**: `enableCustomEvents` -->

启用自定义快捷键，当检测到特定事件（例如媒体播放、暂停或停止）时，将会触发这些快捷键。

**Default**: `false`

#### 启用自定义事件

##### 媒体播放快捷键

<!-- **Setting**: `customEventMediaPlayShortcut` -->

媒体开始播放时发送的快捷键。

**默认**：无

##### 媒体停止快捷键

<!-- **Setting**: `customEventMediaPauseShortcut` -->

媒体停止播放时发送的快捷键。

**默认**：无

##### 媒体暂停快捷键

<!-- **Setting**: `customEventMediaStopShortcut` -->

媒体暂停时发送的快捷键。

**默认**：无

##### Last Song Shortcut

<!-- **Setting**: `customEventLastSongShortcut` -->

聚会期间播放最后一首歌曲时触发的快捷键。

**默认**：无

### 聚会录制 {#meeting-recordings}

#### 启用外部录制应用程序集成 {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

允许 M³ 通过键盘快捷键控制另一个录制应用程序。M³ 本身不会进行录制；当你在“聚会录制”窗口中点击**开始录制**或**停止录制**时，M³ 会向外部应用程序发送设置好的快捷键。 This does not record inside M³; it sends the configured shortcuts when you press **Start Recording** or **Stop Recording** in the meeting recordings popup.

启用 OBS 录制控制后，此选项会被隐藏。如果使用 OBS Studio，请改用 OBS 集成中的录制控制。 If you use OBS Studio, use the OBS recording controls in the OBS integration instead.

**Default**: `false`

#### 录制快捷键和文件夹 {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

设置开始录制所使用的快捷键、可选的停止录制快捷键，以及外部应用程序保存录制文件的文件夹。 If no stop shortcut is provided, M³ reuses the start shortcut. When a folder is configured, M³ shows a button to open it.

### 聚会计时器 {#meeting-timer}

#### 启用聚会计时器 {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

启用一个单独的计时器窗口，用于为聚会节目计时。这是一项测试功能，只有得到当地批准后才应启用。 This is a beta feature and should only be enabled if approved locally.

**Default**: `false`

#### 计时器窗口行为 {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

可以设置计时器窗口是否自动打开、节目参与者计时默认使用正计时还是倒计时、时钟使用 12 小时制还是 24 小时制，以及是否在操作区域的计时器按钮上显示当前计时值。

#### 计时器显示格式 {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

可以为当前时间和倒计时选择模拟或数字显示方式。 The countdown warning indicator can shift the analog countdown ring toward a warning color during the final minute.

#### 聚会倒计时和时间安排状态 {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Show a countdown before scheduled meetings and optionally display whether the meeting is ahead of or behind schedule. 聚会倒计时只显示在计时器窗口，不会显示在主媒体屏幕上。

#### 计时器外观和超时显示 {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

可以自定义计时器的文字大小和颜色，并设置超时提示，例如不同的背景和文字颜色、闪烁效果，以及在正计时模式下只显示超出的时间。

## 高级设置

### 键盘快捷键

#### 启用键盘快捷键

<!-- **Setting**: `enableKeyboardShortcuts` -->

启用可自定义的媒体控制键盘快捷键。

**Default**: `false`

#### 媒体控制快捷键

可以设置以下快捷键：

- **媒体窗口**：显示或隐藏媒体窗口
- **上一个媒体**：前往上一个媒体项目
- **下一个媒体**：前往下一个媒体项目
- **暂停/继续**：暂停或继续播放媒体
- **停止媒体**：停止当前媒体
- **背景音乐**：开始或停止播放背景音乐

### 媒体显示

#### 启用媒体窗口淡入淡出效果

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

显示或隐藏媒体窗口时使用淡入淡出效果。

**默认**：`true`

#### 启用播放速度控制 {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

允许从媒体项目的菜单中调整音频和视频的播放速度。

**Default**: `false`

#### 隐藏媒体标志

<!-- **Setting**: `hideMediaLogo` -->

在媒体窗口中隐藏 JW 标志。

**Default**: `false`

#### 最高分辨率

<!-- **Setting**: `maxRes` -->

设置下载媒体文件时使用的最高分辨率。

**选项**：240p、360p、480p、720p、1080p

**默认**：`false`

#### 包括印刷版媒体

<!-- **Setting**: `includePrinted` -->

如果印刷版出版物中有电子版没有的媒体，也包括这些媒体。

**默认**：`true`

#### Exclude Footnotes

<!-- **Setting**: `excludeFootnotes` -->

尽可能在媒体下载中排除脚注图像。

**Default**: `false`

#### 排除《守望台》研究班段落中额外提到的视频 {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

不包括《守望台》研究班文章段落中额外提到的视频。

**Default**: `false`

#### 排除《教导》中的媒体

<!-- **Setting**: `excludeTh` -->

不包括《教导》中的媒体。

**默认**：`true`

### 字幕语言

#### 启用字幕

<!-- **Setting**: `enableSubtitles` -->

启用媒体播放的字幕支持。

**默认**：`false`

#### 启用字幕

<!-- **Setting**: `langSubtitles` -->

设置字幕的语言，可以与媒体语言不同。

**选项**：耶和华见证人官方网站上提供的所有语言

**默认**：无

### 媒体导出文件夹

#### 媒体自动导出

<!-- **Setting**: `enableMediaAutoExport` -->

设置自动导出媒体文件的目标文件夹。

**默认**：`false`

#### 启用媒体自动导出

<!-- **Setting**: `mediaAutoExportFolder` -->

自动将媒体文件导出到指定文件夹。

**默认**：空

#### 将文件转换为 MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

将导出的非视频媒体转换为 MP4，以提高兼容性。

**默认**：`false`

### 配置设置导入和导出 {#profile-settings-transfer}

可以将当前配置的设置导出为 JSON 文件，也可以导入之前导出的配置设置文件。导入后会替换当前配置的设置。 导入替换当前配置文件的设置。

### 危险区域

:::warning 小贴士

只有在了解这些设置可能产生的影响时才应修改。

:::

#### Base URL

<!-- **Setting**: `baseUrl` -->

用于下载出版物和媒体的基础域名。

**默认**：`false`

#### 关闭硬件加速提醒 {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `disableHardwareAcceleration` -->

重新启动 M³ 后禁用硬件加速。这可能有助于解决某些系统上的图形异常或崩溃问题，但通常不建议禁用。 This may help with graphical glitches or crashes on some systems, but is not otherwise recommended.

**默认**：`false`

#### 禁用硬件加速 {#disable-hardware-acceleration}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

手动禁用硬件加速后，不再显示重新启用硬件加速的提醒。

**默认**：`false`

#### 禁用媒体获取

<!-- **Setting**: `disableMediaFetching` -->

完全禁用自动媒体下载。仅用于特殊活动或其他自定义设置的配置文件。 完全禁用自动媒体下载。仅用于特殊活动或其他自定义设置的配置文件。 Use this only for profiles that will be used for special events or other custom setups.

**默认**：`false`

## 最佳配置提示

### 新用户 {#new-users}

1. 使用初始设置完成基本配置
2. 启用“媒体显示”，以便在外部屏幕上显示媒体
3. 正确设置聚会日期和时间
4. 如果使用混合聚会，可以根据实际需要配置 Zoom 或 OBS Studio 集成

### 高级用户 {#advanced-users}

1. 使用文件夹监控从云存储同步媒体
2. 使用媒体自动导出功能将媒体保存到指定位置
3. 配置键盘快捷键，提高媒体操作效率
4. 配置 Zoom 集成，以便在媒体开始和停止时触发屏幕共享

### 性能优化

1. 根据需要启用额外缓存
2. 根据需要选择合适的最高分辨率
3. 启用缓存自动清理，控制磁盘空间占用
4. 如果网络流量有限，可以启用按流量计费的网络连接设置

### 疑难解答 {#settings-guide-troubleshooting}

- 如果媒体没有下载，请检查聚会日期和时间设置
- 如果 OBS Studio 集成无法使用，请检查 WebSocket 端口、密码和场景设置
- 如果 M³ 运行缓慢，请尝试启用额外缓存或降低分辨率
- 如果语言显示不正确，请检查界面语言、媒体语言和字幕语言设置
- 如果 Zoom 参与者听不到媒体声音，请检查计算机音频配置，并根据需要启用 Zoom 的“原始音频”或“共享计算机声音”
- **提示**：也可以考虑改用 Zoom 集成。Zoom 集成使用 Zoom 原生的屏幕共享功能，因此音频处理通常更方便。
