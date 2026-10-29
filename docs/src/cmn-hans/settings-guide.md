# 设置指南 {#settings-guide}

本综合指南按类别说明 M³ 中所有可用的设置。了解这些设置，可以帮助你根据会众的实际需要配置 M³。

## 常规 {#application-configuration}

### 界面语言 {#display-language}

<!-- **Setting**: `localAppLang` -->

选择 M³ 的界面语言。此设置不会影响媒体下载所使用的语言。

**选项**：所有可用的界面语言（英语、西班牙语、法语等）

**默认**：英语（English）

### 主题设置 {#dark-mode}

<!-- **Setting**: `darkMode` -->

控制 M³ 的界面主题。

**选项**：

- 根据系统设置自动切换
- 始终使用深色模式
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

下载聚会媒体时使用的主要语言。这应与你的会众聚会所使用的语言一致。

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

**默认**：定期自动获取

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

此功能仅适用于通过会众搜索添加、且会众名称未被手动更改的配置。如果因会众名称被更改而停用了同步，请使用**启用时间安排同步**重新关联该配置。

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

启用媒体显示功能。如果要在第二个显示器上显示媒体，必须启用此功能。

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

**默认**：60 秒

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

**默认**：720p

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

选择在会众研经班期间不显示其中所提及视频的出版物。可按出版物标题或代号搜索。

**默认**：Walk Courageously With God（`wcg`）

#### 排除《教导》中的媒体 {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

不包括《教导》中的媒体。

**默认**：`true`

### 字幕 {#subtitles}

#### 启用字幕 {#enable-subtitles}

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

预先缓存所有诗歌视频，以提升性能。请注意，这会增加媒体缓存的大小。

**Default**: `false`

#### 缓存文件夹 {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

用于存储缓存媒体文件的自定义位置。

**默认**：系统默认位置

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

### 媒体导出 {#settings-guide-media-export}

#### 启用媒体自动导出 {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

按照日期安排，自动将媒体导出到指定的文件夹。

**Default**: `false`

#### 媒体导出文件夹 {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

设置用于自动导出媒体的文件夹。

**默认**：空

#### 将导出的文件转换为 MP4 {#convert-files-to-mp4}

**设置**：`convertFilesToMp4`

启用后，非视频文件会在导出前转换为 MP4 格式，以提高兼容性。

**Default**: `false`

### 共享文件夹（Dropbox、OneDrive、iCloud Drive、Google Drive） {#settings-guide-folder-monitoring}

这些设置位于 **集成** 类别中。

M³ 可以从由云存储应用（例如 Dropbox、OneDrive、iCloud Drive 或 Google Drive）同步的文件夹中，将媒体添加到您的聚会。当其他人为自己的节目准备媒体并共享给您，或在多台电脑上使用 M³ 时，这项功能非常有用。也可以使用这台电脑上或网络上的文件夹。

M³ 会在共享文件夹中为每个即将举行的聚会创建一个文件夹，并以聚会日期按“年-月-日”的格式命名（例如 `2026-03-25`）。将照片、视频、音频文件或 JW Library 播放列表放入聚会的文件夹，它们就会自动添加到该聚会的媒体列表中。如需为其他日期添加文件，请为该日期创建一个按相同方式命名的文件夹。共享文件夹中的其他内容都会被忽略。

:::tip 小贴士

请新建一个专门用于此用途的文件夹，例如“聚会媒体”，并在云存储应用中将其设置为始终保留在这台电脑上（通常称为“离线可用”），这样文件在聚会开始前就已准备好。

:::

#### 从共享文件夹添加媒体 {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

自动将放入共享文件夹的文件添加到对应的聚会。

**Default**: `false`

#### 共享文件夹 {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

要从中添加媒体的文件夹。设置向导可以为您完成设置。

**默认**：空

#### 删除过往聚会的文件夹 {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

一周结束后，删除该周带日期的文件夹及其中的文件，使共享文件夹保持整洁。由于文件夹是共享的，所有其他使用者那里的这些文件夹也会被删除。如需保留，请关闭此选项。

**默认**：`true`

## 聚会计时器 {#meeting-timer}

### 启用聚会计时器 {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

启用一个单独的计时器窗口，用于为聚会节目计时。这是一项测试功能，只有得到当地批准后才应启用。

**Default**: `false`

### 计时器窗口行为 {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

可以设置计时器窗口是否自动打开、节目参与者计时默认使用正计时还是倒计时、时钟使用 12 小时制还是 24 小时制，以及是否在操作图标中的计时器按钮上显示当前计时数值。

### 快速访问计时器 {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

选择从主窗口访问计时器的方式：

- **悬停在计时器按钮上时显示快捷控制**：将鼠标悬停在操作图标上的计时器按钮上，会显示正在计时的节目，以及“开始”“暂停”“停止”和“下一个节目”按钮，无需打开完整的计时器弹出窗口。默认开启。
- **在主窗口中显示计时器面板**：在主窗口右侧固定一个面板，始终显示完整的聚会节目列表和计时器控制按钮。完整的弹出窗口仍可从操作图标打开，用于窗口和显示设置。

### 远程计时器 {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemoteFocusLayout`, `timerRemotePort` -->

开启后，M³ 会在本地网络上以网页形式提供计时器显示的只读副本，供讲台上的平板电脑或手机使用：讲者可以看到剩余时间，而这些时间不会显示在会众的屏幕上或 Zoom 共享画面中。该网页会实时跟随计时器，包括聚会开始前的倒计时、时钟、超时颜色和举手提示，所有控制仍保留在 M³ 中。

With **Focus layout for the timer remote** on, the page shows the time in a large progress ring instead: teal while there's time to spare, yellow in the last minute, then red with the amount of overtime (`+02:18`). The Zoom participants whose hand is raised are listed beside it, in the order they raised them, with the first four by name and a count of the rest, and each new hand flashes a "Hand raised" banner for a few seconds while the hands stay listed. The default display remains the plain large time.

While the page is open, it keeps the device's screen awake, so a tablet at the lectern doesn't lock or dim mid-part. Where the browser doesn't allow that on the page's plain-HTTP address, it plays a silent video to hold the screen on instead.

要在设备上打开的地址会列在计时器弹出窗口中，并附有复制按钮。只有在其他程序已占用该端口时才需要更改端口。请注意，开启此功能时，同一网络上的任何人都可以打开该网页；网页上只显示计时器。

**默认**：`false`，端口 `8787`

### 计时器显示格式 {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

可以为当前时间和倒计时选择模拟或数字显示方式。倒计时警告指示器可以在最后一分钟内使模拟倒计时圆环逐渐变为警告颜色。

**带时间弧的模拟时钟** 倒计时格式会在模拟时钟表盘上以扇形显示节目的剩余时间，从分针一直到计划结束时间，一眼就能同时看到当前时间和剩余时间。超时部分会以超时颜色显示为第二个扇形。此格式也适用于聚会开始前的倒计时，并且在正计时模式下也可使用。

### 聚会倒计时和时间安排状态 {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

在预定的聚会开始前显示倒计时，并可选择显示聚会整体是提前还是超时。聚会倒计时只显示在计时器窗口，不会显示在主媒体屏幕上。

### 计时器外观和超时显示 {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

可以自定义计时器的文字大小和颜色，并设置超时提示，例如不同的背景和文字颜色、闪烁效果，以及在正计时模式下只显示超出的时间。

## 集成 {#integrations}

此类别中还包括[共享文件夹](#settings-guide-folder-monitoring)设置，用于从 Dropbox、OneDrive、iCloud Drive 或 Google Drive 添加媒体。

### Zoom 集成 {#settings-guide-zoom-integration}

#### 启用 Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

启用 Zoom 聚会集成功能。

**默认**：`false`

#### 屏幕共享快捷键 {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

设置用于触发 Zoom“开始/停止屏幕共享”的键盘快捷键。

**默认**：无

#### Zoom 开始共享后自动聚焦媒体窗口 {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Zoom 开始屏幕共享后自动聚焦媒体窗口。通常不需要启用此选项，但在某些系统上，如果开始屏幕共享后媒体窗口经常失去焦点，启用此选项可能会有所帮助。

**默认**：`false`

### Zoom 会议管理器 {#zoom-meeting-manager}

Zoom 会议管理器（测试版，仅限 Windows）会在每次聚会前后为您操作 Zoom 桌面应用。开启此功能时会提供设置助手，逐步引导您完成每项自动操作。

#### M³ 操作 Zoom 时 {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Zoom 没有提供合适的自动化接口，因此 M³ 通过 Zoom 应用的辅助功能接口来操作它，即使 Zoom 隐藏了工具栏，也无需移动鼠标。不过，当 M³ 按下 Zoom 的按钮时，Zoom 仍会短暂地将自己的窗口置于前台；只有当 Zoom 对其他所有方式都没有反应时，才会作为最后手段移动鼠标。每当 M³ 操作 Zoom 时，它会在自己的窗口上覆盖显示“M³ 正在操作 Zoom”通知，说明正在进行的操作，并提供 **取消此自动操作** 按钮。设置助手进行检查和自检时也会显示同样的通知。全局键盘快捷键（默认为 `Ctrl+Alt+Escape`）仅在自动操作运行时有效，可以在任何地方取消自动操作，即使 Zoom 处于焦点状态也可以。取消后 M³ 会立即停止；Zoom 可能停留在操作到一半的状态，请检查一下。

**默认**：`Ctrl+Alt+Escape`

#### 举手助手 {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert` -->

聚会期间，M³ 会留意 Zoom 参与者列表中的举手情况。有人举手时，M³ 中的通知可以让您一键为该参与者 **取消静音**，在对方讲完后再一键 **将其静音并放下举手**。操作图标上的 Zoom 按钮也会列出举手的人，并提供相同的按钮。每项操作都会根据确切的名字，作用于该参与者在 Zoom 中自己的那一行；如果两位参与者同名，M³ 不会对其中任何一位进行操作。

如果启用了[聚会计时器](#meeting-timer)，计时器显示上还会为主席显示一只带有参与者名字的大手，计时器和 Zoom 弹出窗口中的 **举手提示** 按钮也可以手动显示它。这部分需要计时器显示；通知和按钮在没有计时器显示时也能使用。

Zoom 会用自己的语言标示举手，因此 M³ 需要先学会识别：在 Zoom 中打开聚会后，点击 **识别 Zoom 标示举手的方式**。 M³ 会举起您自己的手，读取 Zoom 在参与者列表中如何标示举手，以及用哪个菜单项放下举手，然后再把手放下。设置助手也会提供这一步骤。

**默认**：`false`

#### 窗口布局 {#zoom-meeting-manager-window-layout}

<!-- **Setting**: `zoomMeetingManagerWindowLayout` -->

M³ 可以把 Zoom 会议窗口和它自己的主窗口放到屏幕上你想要的位置。设置助手会分两步询问要放在哪里，你可以随时用这里的**选择布局**按钮重新打开这两步：

1. 在按实际排列显示的屏幕示意图上，选择用于 Zoom 会议的屏幕。媒体窗口占满的屏幕不会出现在选项中。如果 Zoom 的屏幕不是 M³ 所在的屏幕，请选择 Zoom 是单独使用这个屏幕，还是与 M³ 共用（这样 M³ 也会移到那里）。
2. 在按实际形状绘制的屏幕图上，拖动分隔条，在 M³ 和 Zoom 之间分配屏幕。分隔条会自动对齐常用比例（二分之一、三分之一、四分之一等）；按住 `Alt` 可以自由拖动。分隔条绝不会让窗口小于它的最小尺寸：参与者列表打开时，Zoom 需要更多空间。在竖屏上，两个窗口会上下排列。

Zoom 会议一打开，M³ 就会按你的要求打开 Zoom 的参与者列表，然后把两个窗口放到位。此后，它会让 Zoom 一直保持在原位：Zoom 自己移动窗口或调整窗口大小时（屏幕共享之后，或参与者列表打开或关闭时），M³ 会把它放回原位。如果你自己移动 Zoom 或调整它的大小，M³ 会让它留在你放置的位置，直到下一次聚会。每次 M³ 自行移动 Zoom 时，都会显示一则通知，并附有两个按钮，以防造成干扰：**不再移动 Zoom** 会在 M³ 重新启动前停止移动，**关闭** 会关闭窗口布局，直到你在这里重新开启。连接或移除屏幕时，M³ 会重新排列窗口；如果 Zoom 的屏幕已不在，Zoom 会与 M³ 共用屏幕，M³ 也会告诉你。

Zoom 共享媒体窗口时，会隐藏它自己的会议窗口，包括参与者列表。开启**共享时显示参与者列表**后，M³ 会在 Zoom 的位置用单独的窗口打开 Zoom 的参与者列表，让你仍然能看到谁举手要评论。如果你关闭它，它会保持关闭，直到下一次共享；共享停止时，Zoom 会自行关闭它，会议窗口也会回到原位。

如果 Zoom 的**Meeting window view**设置为**Dual window**（旧版 Zoom 中为**Use dual monitors**），Zoom 会打开第二个窗口（显示共享的屏幕或发言人）。 M³ 会把它全屏显示在媒体窗口所在的屏幕上，位于媒体窗口后面：隐藏媒体窗口即可看到它，例如查看参与者。

开启**使用 Windows 贴靠**后，M³ 会使用 Windows 自带的贴靠功能把两个窗口并排贴靠，就像你把它们拖到屏幕边缘一样，因此拖动两者之间的边框会同时调整两个窗口的大小。为此，M³ 会把每个窗口短暂地移到最前面。

Zoom 弹出窗口中的**排列窗口**按钮可以随时把一切放回原位。窗口布局按计算机保存，因为它取决于计算机的屏幕。

**默认**：关闭

### OBS Studio 集成 {#settings-guide-obs-integration}

#### 启用 OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

启用 OBS Studio 集成，以便自动切换场景。

**默认**：`false`

:::warning 重要提示

**需要配置音频**：OBS Studio 集成仅处理屏幕共享。使用 OBS Studio 时，M³ 媒体的音频**不会自动传输**给 Zoom 参与者。您必须配置 Zoom 原始音频设置或使用 “共享计算机声音” 以确保聚会参与者能够听到媒体。详细说明请参阅[用户指南](/user-guide#audio-configuration)。

**注意**：Zoom 集成使用 Zoom 原生的屏幕共享功能，处理音频比 OBS Studio 集成更加顺畅。

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

- **不要自动共享图片**：延迟将图片共享到 OBS，直到手动触发
- **快速场景切换器**：在界面中快速打开场景切换器
- **媒体播放结束后再切换场景**：等当前媒体播放完毕后再切换场景
- **恢复之前使用的场景**：媒体播放结束后恢复媒体播放前所使用的场景
- **隐藏图标**：在场景切换器中隐藏图标
- **录制控制**：从 M³ 中控制 OBS Studio 开始或停止录制

:::warning 重要提示

**需要音频配置**：OBS Studio 集成只处理视频/场景切换。来自 M³ 媒体的音频**不会自动传输**到 Zoom 或 OBS。视频流就像一个没有声音的虚拟摄像头，与网络摄像头一样。您必须配置 Zoom 原始音频设置或使用 “共享计算机声音” 以确保聚会参与者能够听到媒体。详细说明请参阅[用户指南](/user-guide#audio-configuration)。

**替代方案**：也可以考虑改用 Zoom 集成。它使用 Zoom 原生的屏幕共享功能，处理音频更加顺畅。

:::

### 自定义事件 {#custom-events}

#### 启用自定义事件 {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

启用自定义快捷键，当检测到特定事件（例如媒体播放、暂停或停止）时，将会触发这些快捷键。

**默认**：`false`

#### 自定义事件快捷键 {#custom-event-shortcuts}

##### 媒体播放快捷键 {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

媒体开始播放时发送的快捷键。

**默认**：无

##### 媒体暂停快捷键 {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

媒体暂停时发送的快捷键。

**默认**：无

##### 媒体停止快捷键 {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

媒体停止播放时发送的快捷键。

**默认**：无

##### 最后一首诗歌快捷键 {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

聚会期间播放最后一首诗歌时触发的快捷键。

**默认**：无

### 聚会录制 {#meeting-recordings}

#### 启用外部录制应用程序集成 {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

允许 M³ 通过键盘快捷键控制外部录制应用程序。 M³ 本身不会进行录制；当你在“聚会录制”窗口中点击**开始录制**或**停止录制**时，M³ 会发送设置好的快捷键。

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

### “添加更多媒体”按钮 {#add-more-media-button}

#### 显示“添加媒体”按钮的部分 {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

选择哪些聚会部分显示用于添加自定义媒体的按钮。顶部工具栏中的“添加媒体”按钮始终可用于所有部分。

**默认**：公众演讲、基督徒的生活、分区监督探访和自定义部分

#### “添加媒体”按钮使用紧凑模式 {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

在各部分的标题栏中，“添加更多媒体”/“添加诗歌”按钮仅显示图标。禁用此选项后，如果空间足够，按钮会在图标旁同时显示文字。

**默认**：`true`

### 媒体拖动手柄 {#media-drag-handle}

#### 显示拖动手柄 {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

在每个媒体项目上显示一个小型拖动手柄，以便通过拖动调整顺序。无论是否显示手柄，都可以直接拖动媒体项目的任意位置进行排序；此设置只影响手柄图标是否显示。

**默认**：`true`

### 聚会前后快速操作 {#before-after-meeting-quick-actions}

#### 显示聚会快速操作 {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

显示聚会前和聚会后的操作面板，其中包含背景音乐、录制等实用控制功能，以及可自定义的检查清单。

**默认**：`true`

聚会前和聚会后的检查清单类别及任务都可以在此设置部分中管理。你可以根据会众的实际需要添加、重命名、重新排序或删除类别和任务。

## 高级 {#advanced-settings}

### 配置设置导入和导出 {#profile-settings-transfer}

可以将当前配置的设置导出为 JSON 文件，也可以导入之前导出的配置设置文件。导入后会替换当前配置的设置。

### 危险区域 {#danger-zone}

:::warning 警告

只有在了解这些设置可能产生的影响时才应修改。

:::

#### 网站地址 {#base-url}

<!-- **Setting**: `baseUrl` -->

用于下载出版物和媒体的基础域名。

**默认**：`jw.org`

#### 禁用硬件加速 {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

重新启动 M³ 后禁用硬件加速。这可能有助于解决某些系统上的图形异常或崩溃问题，但通常不建议禁用。

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
2. 开启“启用媒体显示”以使用演示功能
3. 正确设置聚会日期和时间
4. 如果使用混合聚会，可以根据实际需要配置 Zoom 或 OBS Studio 集成

### 高级用户 {#advanced-users}

1. 使用共享文件夹从云存储（例如 Dropbox 或 OneDrive）添加媒体
2. 使用媒体自动导出功能将媒体保存到指定位置
3. 配置键盘快捷键，提高媒体操作效率
4. 配置 Zoom 集成，以便在媒体开始和停止播放时触发屏幕共享

### 性能优化 {#performance-optimization}

1. 缓存诗歌视频文件以提升性能
2. 根据需要选择合适的视频最高分辨率
3. 启用缓存自动清理，控制磁盘空间占用
4. 如果网络流量有限，可以启用按流量计费的网络连接设置

### 疑难解答 {#settings-guide-troubleshooting}

- 如果媒体没有下载，请检查聚会日期和时间设置
- 如果 OBS Studio 集成无法使用，请检查 WebSocket 端口、密码和场景设置
- 如果 M³ 运行缓慢，请尝试启用额外缓存或降低分辨率
- 如果语言显示不正确，请检查界面语言、媒体语言和字幕语言设置
- 如果 Zoom 参与者听不到媒体声音，请配置 Zoom 的原始音频设置或使用“共享计算机声音”
- **提示**：可以考虑使用 Zoom 集成代替 OBS Studio，以便更简单地处理音频
