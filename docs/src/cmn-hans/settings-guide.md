# 设置指南

本综合指南按类别解释了所有可用设置。 了解这些设置将有助于配置M3来完全满足您会众的需要。

## 应用程序配置

### 显示语言

<!-- **Setting**: `localAppLang` -->

选择 M3 界面语言。 这只适用于媒体下载的语言。

**选项**：所有可用的界面语言（英语、西班牙语、法语等）

**默认**：英语 (English)

### 暗色模式

<!-- **Setting**: `darkMode` -->

控制 M3 的外观主题。

**选项**：

- **自动**：根据系统偏好自动切换
- **深色**：始终使用暗色模式
- 始终使用浅色模式

**默认**：自动

### 一周的第一天

<!-- **Setting**: `firstDayOfWeek` -->

设置在日历视图中一周的起始日。

**选项**：星期日至星期六

**默认**：星期日

### 日期格式

<!-- **Setting**: `localDateFormat` -->

应用程序中显示日期的格式。

**示例**：D MMMM YYYY

**默认**：D MMMM YYYY

### 登录时自动启动

<!-- **Setting**: `autoStartAtLogin` -->

计算机启动时自动启动 M³。

**默认**: `false`

## 会众聚会 {#congregation-meetings}

### 会众名称 {#congregation-name}

<!-- **Setting**: `congregationName` -->

你的会众名称。 用来安排和显示。

**默认**：空（必须在设置期间设置）

### 聚会语言

<!-- **Setting**: `lang` -->

媒体下载的主要语言。 这应与您的会众聚会所使用的语言相匹配。

**选项**：耶和华见证人官方网站上提供的所有语言

**默认**：英语

### 后备语言 {#fallback-language}

<!-- **Setting**: `langFallback` -->

当媒体在主要语言中不可用时使用的第二语言。

**选项**：耶和华见证人官方网站上提供的所有语言

**默认**：无

### 周中聚会 {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

周中聚会举行的星期几。

**选项**：星期日至星期六

**默认**：无（需在设置向导中设置）

### 周中聚会时间 {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

周中聚会的开始时间。

**Format**: HH:MM（24小时制）

**Default**: 无（需在设置向导中设定）

### 周末聚会（星期几）{#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

周末聚会举行的星期几。

**选项**：星期日至星期六

**默认**：无（需在设置向导中设置）

### 周末聚会开始时间

<!-- **Setting**: `weStartTime` -->

周末聚会的开始时间。

**Format**: HH:MM（24小时制）

**Default**: 无（需在设置向导中设定）

### 分区监督探访周 {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

下次分区监督探访的周。

**格式**：MM/DD/YYYY

**默认**：无

### 纪念晚餐日期

<!-- **Setting**: `memorialDate` -->

The date of the next Memorial celebration (beta feature).

**格式**：MM/DD/YYYY

**默认**：定期自动获取

### 聚会议程变更

这些设置允许您配置聚会日程的临时更改：

- **更改日期**：更改生效的日期
- **一次性更改**：这是永久性还是临时性的更改
- **新的周中聚会日**：新的周中聚会日期
- **新的周中聚会时间**：新的周中聚会时间
- **新的周末聚会日**：新的周末聚会日期
- **新的周末聚会时间**：新的周末聚会时间

## 媒体检索与播放

### 计量连接

<!-- **Setting**: `meteredConnection` -->

如果您处于有限数据连接，请启用此项以减少带宽使用。

**Default**: `false`

### 启用媒体显示功能。这是在第二个显示器上演示媒体所必需的。

<!-- **Setting**: `enableMediaDisplayButton` -->

Enable the media display functionality. This is required to present media on a second monitor.

**Default**: `false`

#### 开始播放时暂停

<!-- **Setting**: `beginPlaybackPaused` -->

在播放开始时以暂停状态启动视频。

**Default**: `false`

### 背景音乐

#### 启用音乐

<!-- **Setting**: `enableMusicButton` -->

Enable background music functionality.

**默认**：`true`

#### 自动启动音乐

<!-- **Setting**: `autoStartMusic` -->

在适当的情况下，M³ 启动时自动开始播放背景音乐。

**默认**：`true`

#### 聚会停止缓冲

<!-- **Setting**: `meetingStopBufferSeconds` -->

聚会开始前多少秒停止背景音乐。

**范围**：0-300 秒

**默认**：100%

#### 音乐音量

<!-- **Setting**: `musicVolume` -->

背景音乐音量（1-100%）。

**默认**：`false`

### 缓存管理

#### 启用额外缓存

<!-- **Setting**: `enableExtraCache` -->

启用额外缓存以获得更好的性能。

**Default**: `false`

#### 缓存文件夹

<!-- **Setting**: `cacheFolder` -->

存储缓存媒体文件的自定义位置。

**默认**：`true`

#### 启用缓存自动清除

<!-- **Setting**: `enableCacheAutoClear` -->

自动清除旧的缓存文件以节省磁盘空间。

**默认**：`true`

### 监控文件夹

#### 启用文件夹监控

<!-- **Setting**: `enableFolderWatcher` -->

监控文件夹中的新媒体文件并自动将其添加到 M³。

**Default**: `false`

#### Folder to Watch {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

要监控新媒体文件的文件夹路径。

**默认**：空

## 集成

### Zoom 集成

#### 启用 Zoom

<!-- **Setting**: `zoomEnable` -->

Enable Zoom meeting integration features.

**Default**: `false`

#### Screen Share Shortcut

<!-- **Setting**: `zoomScreenShareShortcut` -->

触发 Zoom 屏幕共享的键盘快捷键。

**默认**：无

### OBS Studio 集成

#### 启用 OBS

<!-- **Setting**: `obsEnable` -->

启用 OBS Studio 集成，实现自动场景切换。

**Default**: `false`

:::warning 新手提示

**需要配置音频**：OBS Studio 集成仅处理屏幕共享。使用 OBS Studio 时，M³ 媒体的音频**不会自动传输**给 Zoom 与会者。您必须配置 Zoom 的“原始音频 (Original Audio)”设置或使用“共享电脑声音”以确保与会者能听到媒体。有关详细的音频设置说明，请参阅[用户指南](/user-guide#audio-configuration)。 **需要配置音频**：OBS Studio 集成仅处理视频/场景切换。M³ 媒体的音频**不会自动传输**给 Zoom 或 OBS。视频流就像一个没有声音的虚拟摄像头，因此您必须明确配置 Zoom 以捕获计算机的音频。有关详细的音频设置说明，请参阅[用户指南](/user-guide#audio-configuration)。 You must configure Zoom's Original Audio settings or use "Share Computer Sound" to ensure meeting participants can hear the media. See the [User Guide](/user-guide#audio-configuration) for detailed audio setup instructions.

**提示**：Zoom 集成使用 Zoom 的原生屏幕共享，处理音频比 OBS Studio 集成更无缝。

:::

#### OBS 端口

<!-- **Setting**: `obsPort` -->

OBS Studio WebSocket 连接密码。

**默认**：无

#### OBS 密码

<!-- **Setting**: `obsPassword` -->

连接 OBS Studio WebSocket 的端口号。

**默认**：无

#### OBS 场景

配置不同用途的 OBS 场景：

- **摄像头场景**：显示摄像头/讲台的场景
- **媒体场景**：显示媒体的场景
- **图像场景**：显示图像的场景（例如显示媒体和发言人的画中画场景）

#### OBS 高级选项

- **延迟图像 (Postpone Images)**：延迟将图像共享到 OBS，直到手动触发
- **快速切换**：在界面中启用 OBS 集成的快速开启/关闭切换
- **媒体后切换场景**：媒体结束后自动返回之前的场景
- **记住上一个场景**：记住并恢复上一个场景
- **隐藏图标**：在界面中隐藏与 OBS 相关的图标

:::warning Important Note

**Audio Configuration Required**: OBS Studio integration only handles video/scene switching. Audio from M³ media is **not automatically transmitted** to Zoom or OBS. The video stream works like a virtual camera without sound, just like a webcam. You must configure Zoom's Original Audio settings or use "Share Computer Sound" to ensure meeting participants can hear the media. See the [User Guide](/user-guide#audio-configuration) for detailed audio setup instructions.

**替代方案**：考虑改用 Zoom 集成，因为它使用 Zoom 的原生屏幕共享，处理音频更无缝。

:::

### 自定义事件快捷键

#### 启用自定义事件

<!-- **Setting**: `enableCustomEvents` -->

启用自定义快捷键，当检测到特定事件（例如媒体播放、暂停或停止）时，将会触发这些快捷键。

**Default**: `false`

#### 自定义事件

##### Play Media Shortcut

<!-- **Setting**: `customEventMediaPlayShortcut` -->

媒体播放时触发的快捷键。

**默认**：无

##### Pause Media Shortcut

<!-- **Setting**: `customEventMediaPauseShortcut` -->

媒体暂停时触发的快捷键。

**默认**：无

##### Stop Media Shortcut

<!-- **Setting**: `customEventMediaStopShortcut` -->

媒体停止时触发的快捷键。

**默认**：无

##### Last Song Shortcut

<!-- **Setting**: `customEventLastSongShortcut` -->

聚会期间播放最后一首歌曲时触发的快捷键。

**默认**：无

## 高级设置

### 键盘快捷键

#### 启用键盘快捷键

<!-- **Setting**: `enableKeyboardShortcuts` -->

启用媒体控制的可自定义键盘快捷键。

**Default**: `false`

#### Media Control Shortcuts

配置媒体播放快捷键：

- **媒体窗口**：打开/关闭媒体窗口
- **上一个媒体**：转到上一个媒体项
- **下一个媒体**：转到下一个媒体项
- **暂停/恢复**：暂停或恢复媒体播放
- **停止播放**：停止播放媒体
- **背景音乐开关**：切换背景音乐状态

### 媒体显示

#### 启用媒体窗口淡入淡出过渡

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

在显示或隐藏媒体窗口时启用淡入/淡出过渡效果。

**默认**：`true`

#### Hide Media Logo

<!-- **Setting**: `hideMediaLogo` -->

在媒体窗口中隐藏徽标。

**Default**: `false`

#### Maximum Resolution

<!-- **Setting**: `maxRes` -->

下载媒体文件的最高分辨率。

**选项**：240p, 360p, 480p, 720p

**默认**：720p

#### Include Printed Media

<!-- **Setting**: `includePrinted` -->

在媒体下载中包含纸本出版物的媒体。

**默认**：`true`

#### Exclude Footnotes

<!-- **Setting**: `excludeFootnotes` -->

尽可能在媒体下载中排除脚注图像。

**Default**: `false`

#### Exclude media from the Teaching brochure

<!-- **Setting**: `excludeTh` -->

在媒体下载中排除《致力于教导》（th）手册的媒体。

**默认**：`true`

### 字幕语言

#### 启用字幕

<!-- **Setting**: `enableSubtitles` -->

启用媒体播放的字幕支持。

**Default**: `false`

#### 字幕

<!-- **Setting**: `langSubtitles` -->

Language for s字幕语言（可以与媒体语言不同）。

**选项**：耶和华见证人官方网站上提供的所有语言

**默认**：无

### 媒体导出文件夹

#### 启用媒体自动导出

<!-- **Setting**: `enableMediaAutoExport` -->

将媒体文件自动导出到指定文件夹。

**Default**: `false`

#### 媒体导出

<!-- **Setting**: `mediaAutoExportFolder` -->

自动导出媒体文件夹的路径。

**默认**：空

#### Convert Files to MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

将导出的媒体文件转换为 MP4 格式以获得更好的兼容性。

**Default**: `false`

### 危险区域

:::warning 小贴士

只有在理解其后果的情况下才应更改这些设置。

:::

#### Base URL

<!-- **Setting**: `baseUrl` -->

用于下载出版物和媒体的基础域名。

**默认**：`jw.org`

#### Disable Media Fetching

<!-- **Setting**: `disableMediaFetching` -->

完全禁用自动媒体下载。仅用于特殊活动或其他自定义设置的配置文件。 完全禁用自动媒体下载。仅用于特殊活动或其他自定义设置的配置文件。 Use this only for profiles that will be used for special events or other custom setups.

**Default**: `false`

## 最佳配置提示

### 新手提示 {#new-users}

1. 使用设置向导配置基本设置
2. 启用“媒体显示按钮”以访问演示功能
3. 准确配置您的聚会日程
4. 如果您使用混合聚会，请设置 OBS 集成

### 进阶提示 {#advanced-users}

1. 使用文件夹监控从云存储同步媒体
2. 启用媒体自动导出以进行备份
3. 配置键盘快捷键以提高操作效率
4. 配置 Zoom 集成以实现自动屏幕共享

### 性能优化

1. 启用额外缓存以获得更好的性能
2. 根据您的需求选择合适的最高分辨率
3. 配置缓存自动清除以管理磁盘空间
4. 如果带宽有限，请考虑计量连接设置

### 疑难解答 {#settings-guide-troubleshooting}

- 如果媒体未下载，请检查您的聚会日程设置
- 如果 OBS 集成不起作用，请验证端口和密码设置
- 如果性能缓慢，请尝试启用额外缓存或降低分辨率
- 如果遇到语言问题，请检查界面和媒体语言设置
- 如果 Zoom 与会者听不到媒体音频，请配置 Zoom 的“原始音频”设置或使用“共享电脑声音”
- **提示**：考虑使用 Zoom 集成而不是 OBS Studio，以简化音频处理
