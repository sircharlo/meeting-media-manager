<!-- markdownlint-disable no-duplicate-heading -->

# 更新内容

关于不同版本之间更改的完整清单，请参阅我们在 GitHub 上的 CHANGELOG.md文件。

## v26.1.0

### ✨ 新功能

- ✨ **Automatic Meeting Schedule Sync**: Added the ability to automatically synchronize meeting dates and times with the official website. This feature is enabled by default and can be manually triggered or disabled in advanced settings.
- ✨ **Future Schedule Changes**: The app now includes future schedule changes when creating a congregation using the website lookup, if available.
- ✨ **Shared Cache for Machine-Wide Installations**: Machine-wide installations now share a common data folder by default, optimizing storage and bandwidth usage across multiple users on the same computer.

## v25.12.2

### ✨ 新功能

- ✨ **Zoom/Pan buttons**: Added the ability to press and hold zoom and pan buttons for continuous adjustment.

## v25.12.0

### ✨ 新功能

- ✨ **Multi-Select Context Menu**: Added support for right-click menu actions when multiple media items are selected.
- ✨ **Keyboard Shortcuts**: Added `Ctrl/Cmd+A` to select all media, `H` to hide selected media, and `Shift+Up/Down` for keyboard selection navigation.
- ✨ **Watchtower Study Video Settings**: Added a setting to exclude extra Watchtower study videos.
- ✨ **Collapsible Sections**: Added ability to collapse sections on non-meeting days for a cleaner view.
- ✨ **JW Events Website**: Added the ability to present the JW Events website in addition to the main official website.
- ✨ **Playlist Import Customization**: Allowed ability to customize the prefix that is added to media items when importing JW playlists.
- ✨ **Website Mirroring Navigation**: Added a toggle to automatically navigate to the media list after website mirroring is stopped.
- ✨ **OBS Recording Controls**: Added the ability to control OBS recordings.
- ✨ **Yeartext Preview**: Added the ability to preview next year's yeartext as of December of every year.
- ✨ **Update Notifications**: Added warning notifications if running a beta version or if updates are disabled, and improved update download progress display.
- ✨ **Hardware Acceleration Settings**: Added an option to permanently disable hardware acceleration if needed.

## v25.11.0

### ✨ 新功能

- ✨ **JWPUB Media Selection**: Added a way to select individual media from JWPUB files.
- ✨ **Auto-Focus Media Window**: Added an optional setting to automatically focus the media window after Zoom screen sharing.
- ✨ **Cursor Overlay for TV Display**: Enhanced website window cursor overlay for better visibility of the mouse cursor on TV displays.
- ✨ **Meeting Recording**: Added a new meeting recording feature, to control an external recording app.
- ✨ **Site Search**: Added ability to search for media or publications on the site using smart search.
- ✨ **Easy Manual Publication Import**: Added functionality to easily import publications from JW.org, such as magazine, books, programs and invitations.
- ✨ **Sign Language Improvements**: Added confirmation before playing entire files for sign languages and support for selecting multiple clips, such as for when multiple paragraphs are to be read consecutively.
- ✨ **Clip Navigation**: Added duration display to clip list items and improved clip navigation.
- 🛠️ **Media Display**: Ensured media display becomes visible when playback starts, even if it was hidden before.

## v25.10.1

### ✨ 新功能

- ✨ **Setup Wizard – Zoom Step**: Added a Zoom integration step to the setup wizard for easier initial configuration.
- ✨ **Screen Picker Enhancements**: Show an accurate visual representation of all screens, as well as the main window’s current size and location, in the display popup. This makes it easier to choose the correct screen on which the media window should be displayed.
- ✨ **Media Window Preference**: The app will now remember the preferred screen on which the media window should be displayed, if specified by the user.

## v25.10.0

### ✨ 新功能

- ✨ **开始播放停止**：添加了一个新的设置，允许播放开始暂停。这可能有助于AV操作员在媒体窗口开始播放之前准备他们的其他程序(例如开始Zoom共享)。
- ✨ **更新通知**：用户现在将通过应用内横幅通知更新， 这也将允许用户立即安装更新，而不是等待下一个应用程序重启。
- ✨ **自定义事件**：在检测到某些事件时添加了可触发键盘快捷键的可选事件。 这可能有助于AV操作员自动在应用之外执行操作。 例如，在媒体在使用投影仪的讲堂聚会之前和之后可以打开和关闭智能灯； 或者一个脚本可以在聚会最后一首歌曲播放后自动在Zoom会议上调用。

## v25.9.1

### ✨ 新功能

- ✨ **媒体窗口总是在顶部 & 全屏行为**：修复并改进媒体窗口的顶部行为，并根据全屏状态动态调整。
- ✨ **日期显示格式设置**: 添加了一个用户设置来配置日期显示格式。
- ✨ **媒体相互淡入淡出** : 实现媒体显示的交叉淡入淡出的过渡，而不是以前存在的更突然淡出到黑色的过渡。
- ✨ **音乐自动停止**：优化后台音乐自动停止的行为，不论音乐是否自动启动。
- ✨ **macOS点击不活跃窗口**: 启用鼠标单击主窗口的 macOS, 这将使它更容易控制应用程序，即使它没有对准。

## v25.9.0

### ✨ 新功能

- ✨ **下载弹出增强功能**：添加刷新按钮并在下载弹出窗口中按日期分组。
- ✨ **观看媒体顺序**: 添加了观看媒体项目的部分顺序存储。

## v25.8.3

### ✨ 新功能

- ✨ **媒体窗口淡入淡出**: 添加了一个新的高级设置，使媒体窗口淡入淡出, 提供更安全的视觉过渡.
- ✨ **图像持续时间控制和进度跟踪**：为重复的章节增加图像持续时间控制和进度跟踪能力。

## v25.8.1

### ✨ 新功能

- ✨ **自定义媒体部分**: 创建、编辑和管理自定义媒体部分的完整系统，包括颜色定制和拖放重排序。
- ✨ **媒体分割线**: 在媒体列表中添加标题分隔符, 以便更好地组织顶部/底部定位选项。
- ✨ **部分循环播放**: 启用针对无缝媒体循环的特定部分内连续播放。
- ✨ **Zoom集成**: 自动分享屏幕开始/停止与媒体播放的协调。

### 🛠️ Improvements and Tweaks

- 🛠️ **部分名称**: 新建三点菜单系统，带颜色选择器、向上/向下移动控制器、重复选项和删除功能。
- ✨ **内嵌标题编辑**: 直接在接口中编辑媒体项目标题而不打开单独对话框。
- 🛠️ **改进导航**: 使用滚动到选定功能更好的键盘快捷键和增强媒体导航。
- 🛠️ **视觉效果优化**: 动态支持在排序操作和改进拖放视觉反馈。

## 25.6.0

### ✨ 新功能

- ✨ **计量连接设置**：添加了新设置，以减少计量连接上的下载带宽使用量。
- ✨ **改进了流媒体处理**：更好地支持流媒体，减少与延迟相关的问题。

### 🛠️ Improvements and Tweaks

- 🛠️ **更好的 MIME 类型处理**：改进了对 MIME 类型的支持，以提高媒体兼容性。
- 🛠️ **增强导航抽屉**: 改进微型状态处理和添加工具提示显示以改善用户导航。
- 🛠️ **Linux 兼容性**: Linux上强制使用 GTK 3 来防止UI 和启动问题。

## 25.5.0

### ✨ 新功能

- 🖼️ **OBS 延迟选项用于图像**: 添加 OBS Studio 设置以在显示图像时延迟场景更改, 改进离子对。
- 🔊 **支持 `.m4a` 音频格式**: 增加`.m4a`音频文件的兼容性以扩展支持的媒体类型。

### 🛠️ Improvements and Tweaks

- 🔍 **恢复使用 `Ctrl` + `Scroll`**：重新启用以控制+滚动手势立即缩放以方便导航。
- 👤 **隐藏未使用的CO媒体**: 分区监督探访期间，隐藏而不是跳过未使用的媒体来保持较清洁的演示。
- 🎵 **改进重复歌曲指示器**: 提升重复歌曲的视觉提示, 使其更容易识别。

## 25.4.3

### 🛠️ Improvements and Tweaks

- ➕ **从 v25.4.x**清理媒体：从 v25 开始自动清理成为孤儿或置于错误位置的媒体。 第1至v25.4.2段，以确保媒体名单上没有媒体，或媒体处于错误的位置。

## 25.4.2

### 🛠️ Improvements and Tweaks

- ➕ **防止重复媒体**: 避免多次向媒体列表添加一些媒体项目。

## 25.4.1

### 🛠️ Improvements and Tweaks

- 🎬 **修复自定义开始/结束时间分配**: 防止自定义开始和结束时间被错误地应用到错误的视频中。
- 📝 **允许不匹配字幕**: 启用使用字幕，即使它们不完全匹配媒体文件。
- 🪟 **禁用Windows上的圆角**: 移除窗口上媒体窗口的圆角。
- 🖼️ **包括媒体列表中未引用的图像**: 确保所有未引用的图像被添加到媒体列表中以获取完整性。
- ➕ **防止媒体部分重复**: 避免为同一个媒体项目创建多个媒体部分。
- 📥 **在导入时保留播放列表顺序**: 在导入过程中保持JWL播放列表的原始顺序。

## 25.4.0

### ✨ 新功能

- 🇵🇭 **新语言: Tagalog** : 添加对 Tagalog的支持，扩展应用程序的多语言功能。
- 🎞 **支持`.m4v`视频格式**：现在支持播放`.m4v`文件，以提高媒体兼容性。

### 🛠️ Improvements and Tweaks

- 🎬 **视频的多个开始/结束时间**: 允许单次视频多次出现在媒体列表中，有不同的自定义开始/结束时间。
- 📤 **在自动导出中包含分组媒体**: 自动导出分组媒体项目和其他媒体。
- 📡 **正确`.m4v`从JW API获取**: 确保`.m4v`文件正确从JW API获取。

## 25.3.1

### ✨ 新功能

- 🌏 **支持新语言：韩语**: 添加对韩语的支持, 扩大更多用户的访问。

### 🛠️ Improvements and Tweaks

- ⚡ **提高性能和 CPU 使用率**: 优化性能以降低CPU 使用率并提高效率。
- 🔄  **修复同步和崩溃问题**: 解决各种与同步和稳定相关的问题以提高可靠性。
- 📜 **显示现有会众的发布笔记**: 确保发布笔记只显示于已加载的会众中。

## 25.3.0

### ✨ 新功能

- 🎵 **用视频播放背景音乐** : 允许背景音乐在视频被查看时继续播放。
- 🎥 **手语媒体的视频**: 添加在媒体窗口中显示专为手语用户提供视频源的能力。
- 📅 **自动纪念聚会的日期和背景**: 自动检测和设置纪念聚会的日期并准备纪念背景图像。
- 📜 **在应用程序中显示发布笔记** : 在应用程序中直接显示发布笔记, 以便用户在更新后可以轻松地查看更改。

### 🛠️ Improvements and Tweaks

- :hig_voltage: **优化智能缓存清理**: 改进智能缓存清理机制以提高性能和效率。
- 📂 **正确的分区监督媒体位置**: 确保分区监督媒体放置在正确的部分。
- 📅 **排除纪念聚会该州的常规聚会媒体**: 防止为纪念聚会获取常规聚会媒体以防止错误。
- 📅 **隐藏纪念聚会那天的常规聚会部分**: 在纪念聚会中删除不必要的聚会部分以进行更清洁的布局。
- 📖 **修复手语圣经视频下载**: 正确地从 JWL 播放列表下载手语圣经章节视频。
