# 设置指南 {#settings-guide}

本综合指南按类别说明所有可用设置。了解这些设置，可以帮助你根据会众的实际需要配置 M³。了解这些设置将有助于配置M3来完全满足您会众的需要。

## 常规 {#application-configuration}

### 界面语言 {#display-language}

<!-- **Setting**: `localAppLang` -->

选择 M³ 的界面语言。此设置不会影响媒体下载所使用的语言。这只适用于媒体下载的语言。

**选项**：所有可用的界面语言（英语、西班牙语、法语等）

**默认**：英语（English）

### 主题设置 {#dark-mode}

<!-- **Setting**: `darkMode` -->

控制 M³ 的界面主题。

**选项**：

- **自动**：根据系统设置自动切换
- **深色**：始终使用暗色模式
- 始终使用浅色模式

**默认**：自动

### 每周的第一天 {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

设置日历视图中每周从哪一天开始。

**选项**：星期日至星期六

**默认**：星期日

### 日期格式 {#date-format}

<!-- **Setting**: `localDateFormat` -->

设置应用程序中日期的显示格式。

**示例**：D MMMM YYYY

**默认**：D MMMM YYYY

### 计算机启动时自动启动 {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

计算机启动时自动启动 M³。

**默认**：`false`

## 会众聚会 {#congregation-meetings}

### 会众名称 {#congregation-name}

<!-- **Setting**: `congregationName` -->

你的会众名称。用来安排和显示。

**默认**：空（需要在初始设置期间设置）

### 媒体语言 {#meeting-language}

<!-- **Setting**: `lang` -->

下载聚会媒体时使用的主要语言。通常应与会众聚会所使用的语言一致。这应与您的会众聚会所使用的语言相匹配。

**选项**：耶和华见证人官方网站上提供的所有语言

**默认**：英语

### 备用媒体语言 {#fallback-language}

<!-- **Setting**: `langFallback` -->

如果媒体没有会众主要语言的版本，可以在这里选择一种备用语言。

**选项**：耶和华见证人官方网站提供的所有语言

**默认**：无

### 周中聚会日 {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

选择周中聚会在哪一天举行。

**选项**：星期日至星期六

**默认**：无（需在设置向导中设置）

### 周中聚会时间 {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

选择周中聚会开始的时间。

**格式**：HH:MM（24 小时制）

**Default**: 无（需在设置向导中设定）

### 周末聚会日 {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

选择周末聚会在哪一天举行。

**选项**：星期日至星期六

**默认**：无（需在设置向导中设置）

### 周末聚会时间 {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

选择周末聚会开始的时间。

**Format**: HH:MM（24小时制）

**默认**：无（需在初始设置中设置）

### 分区监督探访周 {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

下一次分区监督探访所在的星期。

**格式**：MM/DD/YYYY

**默认**：无

### 纪念聚会日期 {#memorial-date}

<!-- **Setting**: `memorialDate` -->

下一次纪念聚会的日期。

**格式**：MM/DD/YYYY

**默认**：通常会自动获取

### 聚会时间安排变更 {#meeting-schedule-changes}

这些设置用于配置聚会时间安排的临时或长期变更：

- **变更日期**：新的时间安排从哪一天开始生效
- **仅对一周应用时间安排变更**：指定这次变更只应用于一个星期，还是从此以后持续生效
- **新的周中聚会日**：周中聚会改到哪一天
- **新的周中聚会时间**：周中聚会新的开始时间
- **新的周末聚会日**：周末聚会改到哪一天
- **新的周末聚会时间**：周末聚会新的开始时间

### 自动更新聚会时间安排 {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

启用后，M³ 会定期检查耶和华见证人官方网站，查看会众当前和未来的聚会日期或时间是否有变化，并自动更新当前配置。

此功能仅适用于通过会众搜索添加、且会众名称未被手动更改的配置。如果因手动更改会众名称而停用了同步，请使用**启用时间安排同步**重新关联当前配置。如果因聚合名称被更改而同步被禁用，请使用 **启用聚会时间同步** 重新链接配置文件。

#### 启用时间安排同步 {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

将当前配置重新关联到会众搜索，以便恢复自动更新聚会日期和时间。只有在手动更改会众名称后才会显示此选项，因为手动更改名称会导致原有的关联失效。

#### 刷新聚会时间安排 {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

手动将当前和未来的聚会日期和时间与官方网站提供的信息同步。

## 媒体和播放 {#media-retrieval-and-playback}

### 按流量计费的网络连接 {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

如果当前网络流量有限，例如使用移动数据，可以启用此选项以减少数据使用量。

**Default**: `false`

### 启用媒体显示 {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

启用媒体显示功能。如果需要在第二个显示器或外部屏幕上显示媒体，必须启用此功能。 This is required to present media on a second monitor.

**Default**: `false`

#### 启用媒体预览 {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

显示图片或视频时，在主界面中实时预览媒体窗口的画面。

**默认**：`true`

#### 以暂停状态开始播放 {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

开始播放音频或视频时，先保持暂停状态。

**Default**: `false`

### 背景音乐 {#settings-guide-background-music}

#### 启用背景音乐 {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

启用背景音乐播放功能。

**默认**：`true`

#### 自动开始播放背景音乐 {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

如果聚会将在 M³ 启动后的几分钟或几小时内开始，背景音乐会自动开始播放。

**默认**：`true`

#### 聚会开始前停止音乐 {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

设置在聚会开始前多少秒停止播放背景音乐。

**范围**：0-300 秒

**默认**：100 秒

#### 背景音乐音量 {#music-volume}

<!-- **Setting**: `musicVolume` -->

设置背景音乐的播放音量（1-100%）。

**默认**：100%

### 播放和下载选项 {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### 启用媒体窗口淡入淡出效果 {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

显示或隐藏媒体窗口时使用淡入淡出效果。

**默认**：`true`

#### 启用播放速度控制 {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

允许通过媒体项目的菜单调整音频和视频的播放速度。

**Default**: `false`

#### 隐藏媒体标志 {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

在媒体显示窗口中隐藏 JW 标志。

**Default**: `false`

#### 视频最高分辨率 {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

设置下载媒体文件时使用的最高分辨率。

**选项**：240p、360p、480p、720p、1080p

**默认**：自动设置

#### 包括印刷版中的媒体 {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

如果印刷版出版物中有电子版中可能没有的其他媒体，也包括这些媒体。

**默认**：`true`

#### 排除脚注中的媒体 {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

尽可能在媒体下载中排除脚注图像。

**Default**: `false`

#### 排除《守望台》研究班段落中额外提到的视频 {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

不包括《守望台》研究班文章段落中额外提到的视频。

**Default**: `false`

#### 排除会众研经班出版物中的视频 {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

选择在会众研经班期间不显示其中所提及视频的出版物。可以按出版物标题或代号搜索。可按出版物标题或代号搜索。

**默认**：Walk Courageously With God（`wcg`）

#### 排除《教导》中的媒体 {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

不包括《教导》中的媒体。

**默认**：`true`

### 启用字幕 {#subtitles}

#### 字幕 {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

启用媒体播放的字幕支持。

**Default**: `false`

#### 字幕语言 {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

设置字幕的语言，可以与媒体语言不同。

**选项**：耶和华见证人官方网站上提供的所有语言

**默认**：无

### 缓存管理 {#cache-management}

#### 缓存诗歌视频文件 {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

缓存额外媒体，以改善加载和播放性能。

**Default**: `false`

#### 缓存文件夹 {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

设置出版物和媒体等缓存文件的存储位置。如果留空，应用程序会自动进行设置。

**浅色**：始终使用浅色模式

#### 启用缓存自动清理 {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

自动清理未使用的缓存文件，以释放磁盘空间。

**默认**：`true`

### 拼音版诗歌 {#pinyin-song-titles}

#### 优先使用拼音版诗歌 {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

如果在拼音诗歌文件夹中找到相应的聚会诗歌拼音版，就优先使用拼音版，而不是标准版。

**Default**: `false`

#### 拼音诗歌文件夹 {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

包含拼音版诗歌视频的文件夹（例如 `sjjm_s-Pi_CHS_066_r720P.mp4`）。如果找到与聚会诗歌编号相符的拼音版文件，就会播放该文件，而不是标准版诗歌。

**默认**：空

### 启用自动导出 {#settings-guide-media-export}

#### 自动导出文件夹 {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

按照日期安排，自动将媒体导出到指定的文件夹。

**Default**: `false`

#### 媒体导出 {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

设置用于自动导出媒体的文件夹。

**默认**：空

#### 将导出的文件转换为 MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

启用后，非视频文件会在导出前转换为 MP4 格式，以提高兼容性。

**Default**: `false`

### 启用文件夹监视 {#settings-guide-folder-monitoring}

#### 监视文件夹 {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

监视指定文件夹。如果有新的媒体文件加入，会自动将它们添加到媒体列表。

**Default**: `false`

#### 要监视的文件夹 {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

设置要监视新媒体文件的文件夹路径。

**默认**：空

## 启用聚会计时器 {#meeting-timer}

### 聚会计时器 {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

启用一个单独的计时器窗口，用于为聚会节目参与者计时。只有得到当地长老批准后才应启用此功能。这是一项测试功能，只有得到当地批准后才应启用。

**Default**: `false`

### 计时器窗口行为 {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

可以设置计时器窗口是否自动打开、节目参与者计时默认使用正计时还是倒计时、时钟使用 12 小时制还是 24 小时制，以及是否在操作图标中的计时器按钮上显示当前计时数值。

### 计时器显示格式 {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

可以为当前时间和倒计时选择模拟或数字显示方式。倒计时警告指示器可以在最后一分钟内使模拟倒计时圆环逐渐变为警告颜色。

### 聚会倒计时和时间安排状态 {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

在预定的聚会开始前显示倒计时，并可选择显示聚会整体是提前还是超时。聚会倒计时只显示在计时器窗口，不会显示在主媒体屏幕上。

### 计时器外观和超时显示 {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

可以自定义计时器的文字大小和颜色，并设置超时提示，例如不同的背景和文字颜色、闪烁效果，以及在正计时模式下只显示超出的时间。

## 集成 {#integrations}

### 启用 Zoom {#settings-guide-zoom-integration}

#### Zoom 集成 {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

启用 Zoom 聚会集成功能。

**默认**：`false`

#### 屏幕共享快捷键 {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

设置用于触发 Zoom“开始/停止屏幕共享”的键盘快捷键。

**默认**：无

#### Zoom 开始共享后自动聚焦媒体窗口 {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Zoom 开始屏幕共享后自动聚焦媒体窗口。通常不需要启用，但如果某些系统在开始共享后媒体窗口经常失去焦点，可以尝试启用此项。通常不需要启用此选项，但在某些系统上，如果开始屏幕共享后媒体窗口经常失去焦点，启用此选项可能会有所帮助。

**默认**：`false`

### 启用 OBS Studio {#settings-guide-obs-integration}

#### OBS Studio 集成 {#enable-obs}

<!-- **Setting**: `obsEnable` -->

启用 OBS Studio 集成，以便自动切换场景。

**默认**：`false`

:::warning 优先使用拼音版诗歌 {#enable-pinyin-songs}

**需要配置音频**：OBS Studio 集成仅处理屏幕共享。使用 OBS Studio 时，M³ 媒体的音频**不会自动传输**给 Zoom 与会者。您必须配置 Zoom 的“原始音频 (Original Audio)”设置或使用“共享电脑声音”以确保与会者能听到媒体。有关详细的音频设置说明，请参阅[用户指南](/user-guide#audio-configuration)。**需要配置音频**：OBS Studio 集成只负责视频和场景切换。M³ 媒体的声音不会通过视频流自动传输给 Zoom。视频流类似一个没有声音的虚拟摄像头。您必须配置 Zoom 原始音频设置或使用 “共享计算机声音” 以确保聚会参与者能够听到媒体。详细说明请参阅[用户指南](/user-guide#audio-configuration)。

**提示**：也可以考虑使用 Zoom 集成。Zoom 集成使用 Zoom 原生的屏幕共享功能，因此媒体共享和音频处理通常更方便

:::

#### OBS 端口 {#obs-port}

<!-- **Setting**: `obsPort` -->

OBS Studio WebSocket 连接所使用的端口号。

**默认**：无

#### OBS 密码 {#obs-password}

<!-- **Setting**: `obsPassword` -->

OBS Studio WebSocket 连接所使用的密码。

**默认**：无

#### OBS 场景 {#obs-scenes}

可以为不同用途设置 OBS 场景：

- **摄像机场景**：显示摄像头或讲台画面的场景
- **媒体场景**：显示媒体窗口的场景
- **图片场景**：专门用于显示图片的场景，例如同时显示媒体和发言人的画中画场景

#### OBS 高级选项 {#obs-advanced-options}

- **不要自动共享图片**：在手动触发前，不向 Zoom 参与者显示图片
- **快速场景切换器**：在界面中快速打开场景切换器
- **媒体播放结束后再切换场景**：等当前媒体播放完毕后再切换场景
- **恢复之前使用的场景**：媒体播放结束后恢复媒体播放前所使用的场景
- **隐藏图标**：在场景切换器中隐藏图标
- **录制控制**：从 M³ 中控制 OBS Studio 开始或停止录制

:::warning Important Note

**需要音频配置**：OBS Studio 集成只处理视频/场景切换。来自 M3 媒体的音频**不会自动传输**到 Zoom 或 OBS。视频流像一个没有声音的虚拟摄像头，类似于摄像头一样。您必须配置 Zoom 原始音频设置或使用 “共享计算机声音” 以确保聚会参与者能够听到媒体。详细说明请参阅[用户指南](/user-guide#audio-configuration)。

**提示**：也可以考虑使用 Zoom 集成。Zoom 集成使用 Zoom 原生的屏幕共享功能，因此媒体共享和音频处理通常更方便。

:::

### 自定义事件快捷键 {#custom-events}

#### 启用自定义事件 {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

启用自定义快捷键，当检测到特定事件（例如媒体播放、暂停或停止）时，将会触发这些快捷键。

**默认**：`false`

#### 媒体暂停快捷键 {#custom-event-shortcuts}

##### 媒体播放快捷键 {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

媒体开始播放时发送的快捷键。

**默认**：无

##### 启用自定义事件集成。检测到媒体开始播放、暂停、停止或聚会最后一首诗歌播放等事件时，M³ 可以发送指定的键盘快捷键。 {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

媒体暂停时发送的快捷键。

**默认**：无

##### 媒体停止快捷键 {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

媒体停止播放时发送的快捷键。

**默认**：无

##### 最后一首诗歌快捷键 {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

聚会期间播放最后一首歌曲时触发的快捷键。

**默认**：无

### 聚会录制 {#meeting-recordings}

#### 启用外部录制应用程序集成 {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

允许 M³ 通过键盘快捷键控制外部录制应用程序。M³ 本身没有内置录制功能；在“聚会录制”窗口中点击**开始录制**或**停止录制**时，M³ 会向外部应用程序发送设置好的快捷键。 M³ 本身不会进行录制；当你在“聚会录制”窗口中点击**开始录制**或**停止录制**时，M³ 会向外部应用程序发送设置好的快捷

启用 OBS 录制控制后，此选项会被隐藏。如果使用 OBS Studio，请改用 OBS Studio 集成中的录制功能。

**默认**：`false`

#### 录制快捷键和文件夹 {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

设置开始录制所使用的快捷键、可选的停止录制快捷键，以及外部应用程序保存录制文件的文件夹。如果未设置停止快捷键，M³ 会继续使用开始录制的快捷键。设置文件夹后，M³ 会显示用于打开该文件夹的按钮。

## 界面和快捷键 {#interface-shortcuts}

### 键盘快捷键 {#settings-guide-keyboard-shortcuts}

#### 启用键盘快捷键 {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

启用可自定义的媒体控制键盘快捷键。

**默认**：`false`

#### 媒体控制快捷键 {#media-control-shortcuts}

可以设置以下快捷键：

- **媒体窗口**：显示或隐藏媒体窗口
- **上一个媒体项目**：前往上一个媒体项目
- **下一个媒体项目**：前往下一个媒体项目
- **播放/暂停媒体**：播放或暂停当前媒体
- **停止媒体**：停止播放当前媒体
- **背景音乐**：开始或停止播放背景音乐

### “添加媒体”按钮使用紧凑模式 {#add-more-media-button}

#### 显示“添加媒体”按钮的部分 {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

选择哪些聚会部分显示用于添加自定义媒体的按钮。顶部工具栏中的“添加媒体”按钮始终可用于所有部分。

**默认**：公众演讲、基督徒的生活、分区监督探访和自定义部分

#### “添加更多媒体”按钮 {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

在各部分的标题栏中，“添加更多媒体”/“添加诗歌”按钮仅显示图标。禁用此选项后，如果空间足够，按钮会在图标旁同时显示文字。

**默认**：`true`

### 媒体拖动手柄 {#media-drag-handle}

#### 显示拖动手柄 {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

在每个媒体项目上显示一个小型拖动手柄，以便通过拖动调整顺序。在每个媒体项目上显示一个小手柄，用于拖动并重新排序。无论是否显示手柄，都可以直接拖动媒体项目的任意位置进行排序；此设置只影响手柄图标是否显示。

**默认**：`true`

### 聚会前后快速操作 {#before-after-meeting-quick-actions}

#### 显示聚会快速操作 {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

显示聚会前和聚会后的操作面板，其中包含背景音乐、录制等实用控制功能，以及可自定义的检查清单。

**默认**：`true`

聚会前和聚会后的检查清单类别及任务都可以在此设置部分中管理。你可以根据会众的实际需要添加、重命名、重新排序或删除类别和任务。

## 高级 {#advanced-settings}

### 配置设置导入和导出 {#profile-settings-transfer}

可以将当前配置的设置导出为 JSON 文件，也可以导入之前导出的配置设置文件。导入后，当前配置的设置会被导入文件中的设置替换。导入替换当前配置文件的设置。

### 危险区域 {#danger-zone}

:::warning 小贴士

只有在了解这些设置可能产生的影响时才应修改。

:::

#### 网站地址 {#base-url}

<!-- **Setting**: `baseUrl` -->

用于下载出版物和媒体的基础域名。

**深色**：始终使用深色模式

#### 禁用硬件加速 {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

在 M³ 中禁用硬件加速。更改此设置后需要重新启动应用程序才能生效。这可能有助于解决某些系统上的图像异常或崩溃问题，但一般不建议禁用。这可能有助于解决某些系统上的图形异常或崩溃问题，但通常不建议禁用。

**默认**：`false`

#### 关闭硬件加速提醒 {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

如果手动禁用了硬件加速，此选项会关闭重新启用硬件加速的提醒。

**默认**：`false`

#### 禁用媒体获取 {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

完全禁用自动媒体下载。仅用于特殊活动或其他自定义设置的配置文件。

**默认**：`false`

## 最佳配置提示 {#configuration-tips}

### 新用户 {#new-users}

1. 使用初始设置完成基本配置
2. 启用“媒体显示”，以便在外部屏幕上显示媒体
3. 正确设置聚会日期和时间
4. 如果使用混合聚会，可以根据实际需要配置 Zoom 或 OBS Studio 集成

### 高级用户 {#advanced-users}

1. 使用文件夹监控从云存储同步媒体
2. 使用媒体自动导出功能将媒体保存到指定位置
3. 配置键盘快捷键，提高媒体操作效率
4. 配置 Zoom 集成，以便在媒体开始和停止播放时触发屏幕共享

### 性能优化 {#performance-optimization}

1. 缓存所有诗歌视频，以提高性能。请注意，这会增加媒体缓存占用的空间。
2. 根据需要选择合适的视频最高分辨率
3. 启用缓存自动清理，控制磁盘空间占用
4. 如果网络流量有限，可以启用按流量计费的网络连接设置

### 疑难解答 {#settings-guide-troubleshooting}

- 如果媒体没有下载，请检查聚会日期和时间设置
- 如果 OBS Studio 集成无法使用，请检查 WebSocket 端口、密码和场景设置
- 如果 M³ 运行缓慢，请尝试启用额外缓存或降低分辨率
- 如果语言显示不正确，请检查界面语言、媒体语言和字幕语言设置
- 如果 Zoom 参与者听不到媒体声音，请检查计算机和 Zoom 的音频配置
- **需要配置音频**：OBS Studio 集成主要负责视频和场景切换。M³ 媒体的声音不会通过视频流自动传输给 Zoom 参与者。视频流类似于一个没有声音的虚拟摄像头。你必须正确配置 Zoom 的“原始音频（Original Audio）”或其他适当的音频传输方式，以确保参与者能够听到媒体声音。详细说明请参阅[用户指南](/user-guide#audio-configuration)。
