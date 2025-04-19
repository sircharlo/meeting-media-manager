<!-- markdownlint-disable no-duplicate-heading -->

# 更新内容

关于不同版本之间更改的完整清单，请参阅我们在 GitHub 上的 CHANGELOG.md文件。

## 25.4.1

### 🛠️ 改进和调整

- 🎬 **Fix Custom Start/End Time Assignment**: Prevent custom start and end times from being incorrectly applied to the wrong video.
- 📝 **Allow Mismatched Subtitles**: Enable use of subtitles even when they do not perfectly match the media file.
- 🪟 **Disable Rounded Corners on Windows**: Remove rounded corners for the media window on Windows.
- 🖼 **Include Non-Referenced Images in Media List**: Ensure all non-referenced images are added to the media list for completeness.
- ➕ **Prevent Duplicate Media Sections**: Avoid creating multiple media sections for the same media item.
- 📥 **Preserve Playlist Order on Import**: Maintain the original order of JWL playlists during the import process.

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
