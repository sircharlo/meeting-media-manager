<!-- markdownlint-disable no-duplicate-heading -->

# 更新内容

关于不同版本之间更改的完整清单，请参阅我们在 GitHub 上的 CHANGELOG.md文件。

## 25.5.0

### ✨ 新功能

- 🖼️ **OBS Delay Option for Images**: Add an OBS Studio setting to delay scene changes when displaying images, improving transitions.
- 🔊 **Support for `.m4a` Audio Format**: Add compatibility for `.m4a` audio files to expand supported media types.

### 🛠️ 改进和调整

- 🔍 **Restore Zoom with `Ctrl` + `Scroll`**: Re-enable immediate zooming with the control + scroll gesture for easier navigation.
- 👤 **Hide Unused CO Media**: Hide rather than skip unused media for Circuit Overseer visits to maintain a cleaner presentation.
- 🎵 **Improve Duplicate Song Indicator**: Enhance the visual cue for duplicate songs to make them easier to identify.

## 25.4.3

### 🛠️ 改进和调整

- ➕ **从 v25.4.x**清理媒体：从 v25 开始自动清理成为孤儿或置于错误位置的媒体。 第1至v25.4.2段，以确保媒体名单上没有媒体，或媒体处于错误的位置。

## 25.4.2

### 🛠️ 改进和调整

- ➕ **防止重复媒体**: 避免多次向媒体列表添加一些媒体项目。

## 25.4.1

### 🛠️ 改进和调整

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

### 🛠️ 改进和调整

- 🎬 **视频的多个开始/结束时间**: 允许单次视频多次出现在媒体列表中，有不同的自定义开始/结束时间。
- 📤 **在自动导出中包含分组媒体**: 自动导出分组媒体项目和其他媒体。
- 📡 **正确`.m4v`从JW API获取**: 确保`.m4v`文件正确从JW API获取。

## 25.3.1

### ✨ 新功能

- 🌏 **支持新语言：韩语**: 添加对韩语的支持, 扩大更多用户的访问。

### 🛠️ 改进和调整

- ⚡ **提高性能和 CPU 使用率**: 优化性能以降低CPU 使用率并提高效率。
- 🔄  **修复同步和崩溃问题**: 解决各种与同步和稳定相关的问题以提高可靠性。
- 📜 **显示现有会众的发布笔记**: 确保发布笔记只显示于已加载的会众中。

## 25.3.0

### ✨ 新功能

- 🎵 **用视频播放背景音乐** : 允许背景音乐在视频被查看时继续播放。
- 🎥 **手语媒体的视频**: 添加在媒体窗口中显示专为手语用户提供视频源的能力。
- 📅 **自动纪念聚会的日期和背景**: 自动检测和设置纪念聚会的日期并准备纪念背景图像。
- 📜 **在应用程序中显示发布笔记** : 在应用程序中直接显示发布笔记, 以便用户在更新后可以轻松地查看更改。

### 🛠️ 改进和调整

- :hig_voltage: **优化智能缓存清理**: 改进智能缓存清理机制以提高性能和效率。
- 📂 **正确的分区监督媒体位置**: 确保分区监督媒体放置在正确的部分。
- 📅 **排除纪念聚会该州的常规聚会媒体**: 防止为纪念聚会获取常规聚会媒体以防止错误。
- 📅 **隐藏纪念聚会那天的常规聚会部分**: 在纪念聚会中删除不必要的聚会部分以进行更清洁的布局。
- 📖 **修复手语圣经视频下载**: 正确地从 JWL 播放列表下载手语圣经章节视频。
