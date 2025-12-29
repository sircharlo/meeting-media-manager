# 常见问题

## 常规问题

### :earth_americas: 此应用是否依赖外部站点、源或“管理员”下载出版物和聚会媒体或其他文档？ {#external-dependencies}

**不。** 此应用程序的运转方式酷似 JW Library 应用。它直接从耶和华见证人的官方网站及其内容提供网络下载出版物、媒体和其他内容。应用程序自动决定需要下载的内容以及先前下载的内容不再是最新的，应该重新下载。 它直接从耶和华见证人的官方网站及其内容提供网络下载出版物、媒体和其他内容。 应用程序自动决定需要下载的内容以及先前下载的内容不再是最新的，应该重新下载。

:::info 备注

此应用程序的源代码可供所有人检查和验证应用里发生的事情。

:::

### :thinking: 本应用是否违反了耶和华见证人官方网站的使用条款？ {#terms-of-use}

**不**。[耶和华见证人官方网站使用条款](https://www.jw.org/finder?docid=1011511&prefer=content)明确允许我们正在做的用法。以下是相关摘录（重要部分已标明）： 以下是相关摘录（重要部分已标明）：

> 你不得：
>
> 从本网站收集、翻印、下载、撷取或采集数据、HTML、图像或文字，并制作应用程序、工具或技术，向公众分发 （**不限**本网站设计的非营利应用程序，提供大众免费下载电子档，如EPUB、PDF、MP3和MP4）。

### :question: M³ 支持哪些操作系统？ {#operating-systems}

M³ 支持 Windows、macOS 和 Linux：

- **Windows**：Windows 10 及更高版本（提供 64 位和 32 位版本）
- **macOS**：macOS 10.15 (Catalina) 及更高版本（支持 Intel 和 Apple Silicon）
- **Linux**：大多数现代 Linux 发行版（AppImage 格式）

### :globe_with_meridians: M³ 支持我的语言吗？ {#language-support}

**是的！** M³ 提供全面的多语言支持：

- **媒体**：可下载耶和华见证人官方网站上提供的数百种语言的媒体
- **应用界面**：M³ 界面提供多种语言可选
- **独立设置**：可在使用某种界面的同时下载另一种语言的媒体
- **后备语言**：当主要语言暂无媒体时可配置后备语言
- **字幕支持**：可下载并显示多语种字幕

## 安装与设置

### :computer: 如何下载并安装 M³？ {#installation}

请前往[下载页面](download)获取适用于您系统的版本，并参照[用户指南](user-guide)完成安装。

### :gear: 第一次如何进行设置？ {#first-time-setup}

M³ 提供向导，帮助完成关键配置：

1. 选择界面语言
2. 选择配置文件类型（常规或其他）
3. 配置会众信息
4. 设置聚会日程
5. 可选功能（如 OBS 集成）设置

## 媒体管理

### :desktop_computer: M³ 如何下载媒体？ {#media-download}

M³ 会自动为即将到来的聚会下载媒体：

1. 检查您的聚会日程
2. 判断所需媒体
3. 按所选语言从耶和华见证人官方网站下载
4. 以日期与聚会类型组织媒体
5. 缓存文件以便离线使用

### :calendar: 可以为特定日期下载媒体吗？ {#specific-dates}

是! 是的！M³ 允许您：

- 自动为即将到来的聚会下载媒体
- 为任何日期导入自定义媒体

### :open_file_folder: 如何导入我自己的媒体文件？ {#import-media}

可通过多种方式导入：

- **文件导入**：使用导入按钮添加视频、图像或音频
- **拖放**：将文件直接拖入 M³
- **文件夹监控**：监控文件夹以自动导入
- **JWPUB/播放列表**：导入出版物与播放列表

### :speaker: 可以导入“音频圣经”吗？ {#audio-bible}

是! 是的！M³ 包含一个音频圣经功能，允许您：

1. 选择圣经书卷与章节
2. 选择具体经文或经文范围
3. 下载音频录音
4. 在聚会中使用

## 演示功能

### :tv: 聚会中如何演示媒体？ {#present-media}

播放媒体：

1. 选择日期
2. 点击要演示的媒体项上的播放按钮（或使用快捷键）
3. 使用播放器控制暂停、跳转或停止
4. 对图片使用缩放/平移
5. 必要时设置自定义起止时间

### :keyboard: 有哪些键盘快捷键？ {#faq-keyboard-shortcuts}

M³ 支持自定义以下快捷键：

- 打开/关闭媒体窗口
- 上一项/下一项导航
- 播放/暂停/停止
- 背景音乐开关

<!-- - Fullscreen mode -->

### :notes: 背景音乐如何工作？ {#faq-background-music}

背景音乐功能包括：

- 应用启动后、聚会开始前自动播放
- 聚会开始前自动停止
- 聚会后可一键重新播放
- 独立音量控制
- 可配置提前停止缓冲时间

### :video_camera: 如何设置 Zoom 集成？ {#zoom-setup}

在设置中启用 Zoom 集成：

1. 在 M³ 设置中启用 Zoom 集成
2. 在 Zoom 中配置屏幕共享快捷键并确保其设置为“全局”。 确保缩放设置中的快捷方式为“全局”。
3. 演示媒体时，M³ 会自动开始/停止 Zoom 屏幕共享

## OBS Studio 集成

### :video_camera: 如何设置 OBS Studio 集成？ {#faq-obs-setup}

若要与 OBS Studio 集成：

1. 安装 OBS Studio 与 WebSocket 插件
2. 在 M³ 设置中启用 OBS 集成
3. 填写 OBS 端口与密码
4. 分别配置摄像机、媒体与图片场景
5. 测试播放

### :arrows_counterclockwise: 自动切换场景如何工作？ {#faq-scene-switching}

M³ 根据以下因素自动切换 OBS 场景：

- 媒体类型（视频、图片等）
- 您的场景配置
- 诸如“延迟显示图像（Postpone Images）”的设置
- 是否在媒体播放后返回先前场景

### :pause_button: 什么是“延迟显示图像（Postpone Images）”功能？ {#faq-postpone-images}

该功能会在您手动触发前，延迟把图片共享到 OBS。这对于以下情况很有用： This is useful for:

- 先向现场观众展示图片
- 更灵活地控制演示时机
- 避免过早切换场景

## 高级功能

### :cloud: 文件夹监控如何工作？ {#faq-folder-monitoring}

文件夹监控允许您：

1. 选择要监控的文件夹
2. 自动导入与 Dropbox、OneDrive 等云存储同步的新媒体文件

### :file_folder: 什么是媒体自动导出？ {#faq-media-export}

媒体自动导出将自动：

1. 把媒体文件导出到指定文件夹
2. 按日期与分区整理文件
3. 可选将文件转换为 MP4 格式
4. 保持聚会媒体文件的有序备份

### :family: 可以管理多个会众吗？ {#faq-multiple-congregations}

是! 是的！M³ 支持多个配置文件，用于：

- 不同会众
- 特别聚会/活动
- 不同小组
- 各自独立的设置与媒体

## 疑难解答 {#faq-troubleshooting}

### :warning: 媒体无法下载，我该检查什么？ What should I check? {#faq-media-not-downloading}

检查以下常见问题：

1. **聚会日程**：验证日期和时间是否正确
2. **语言设置**：确保媒体语言设置正确
3. **网络连接**：检查您的互联网连接
4. **语言可用性**：确认所选语言确有媒体可用

<!-- 5. **Manual Refresh**: Try manually refreshing to check for new media -->

### :video_camera: OBS 集成无法工作，我该核对什么？ What should I verify? {#faq-obs-not-working}

检查这些 OBS 相关问题：

1. **OBS 安装**：确保已安装 OBS Studio 并在运行
2. **WebSocket 插件**：验证插件已安装
3. **端口与密码**：核对您的 OBS 端口与密码设置
4. **防火墙**：确保防火墙未拦截连接

### :speaker: 使用 OBS Studio 时，M³ 会自动把媒体声音发送到 Zoom 吗？ {#audio-to-zoom}

**不会。** M³ 不会自动把媒体音频发送到 Zoom 或 OBS Studio。 视频流像虚拟摄像头一样是无声的，就像摄像头一样。 若要让 Zoom 自动“听到”电脑播放的音频，您需要确保 Zoom 能接收到电脑发出的音频信号，并在 Zoom 中启用 **原始音频（Original Audio）**。

**重要提示：**

- 每次开始 Zoom 会议前都需要启用“原始音频”
- 此设置与 M³ 无关——如果不使用 Zoom 的屏幕和音频共享功能，使用任何其他播放器都会遇到同样的音频问题
- “原始音频”设置有三个子选项——通常开启前两个，关闭第三个效果最佳
- 如果仍有音频问题，您可能需要改用 Zoom 的“共享电脑声音”功能
- 或者，考虑使用 Zoom 集成功能，因为它使用 Zoom 的原生屏幕共享。

**为什么需要这样做？**
M³ 在您的电脑上播放带有声音的媒体，但当使用 OBS Studio 时，此音频不会通过视频流自动传输到 Zoom。 “原始音频”设置允许 Zoom 在屏幕共享期间捕捉电脑上播放的音频（如果您的电脑配置正确，例如：电脑有第二个声卡用于媒体播放，Zoom 将其作为麦克风收听）。

### :snail: M³ 运行缓慢 ，如何改善？ {#performance-issues}

尝试以下性能优化：

1. **启用额外缓存**：在设置中开启额外的缓存
2. **关闭无关程序**：关闭不必要的应用程序
3. **检查磁盘空间**：确保有足够的可用磁盘空间
4. **降低分辨率**：降低最高分辨率设置

### :speech_balloon: 碰到语言相关问题，该检查什么？ What should I check? {#faq-language-issues}

核对以下语言设置：

1. **界面语言**：检查您的显示语言设置
2. **媒体语言**：核对您的媒体下载语言
3. **语言可用性**：确保该语言在耶和华见证人官方网站上可用
4. **后备语言**：尝试设置后备语言

## 支持与社区

### :radioactive: 如何反馈问题？ {#how-do-i-report-an-issue}

请在官方 GitHub 仓库[提交 issue](https://github.com/sircharlo/meeting-media-manager/issues)。 请附上：

- 问题的详细描述
- 复现步骤
- 您的操作系统与 M³ 版本
- 任何错误信息、日志和截图

### :new: 如何提出新功能建议？ :new: 如何提出新功能建议？ {#how-can-i-request-a-new-feature-or-enhancement}

请在官方 GitHub 仓库[发起讨论](https://github.com/sircharlo/meeting-media-manager/discussions)。 请说明：

- 您希望看到的功能
- 它将如何使普通用户受益
- 任何具体的要求或偏好

### :handshake: 我想贡献代码，该怎么做？ {#how-can-i-contribute-some-code}

请阅读官方 GitHub 仓库的[贡献指南](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md)。 我们欢迎代码贡献和 Pull Request！

### :globe_with_meridians: 我可以帮助翻译吗？ {#translations}

M³ 使用 Crowdin 管理翻译。 您可以通过以下方式参与：

1. 访问 [Crowdin 项目](https://crowdin.com/project/meeting-media-manager)
2. 选择您的语言
3. 翻译需要处理的字符串
4. 审核现有翻译

### :x: 可以向项目捐款吗？ {#can-i-make-a-donation-to-the-project}

Thank you for your interest in supporting the project! However, in the spirit of Matthew 10:8, donations are **not** accepted and never will be. This app was made with love and a little spare time. Please enjoy! :tada:

:::tip :book: 马太福音 10:8

“你们免费得来，也要无偿施与。”

:::

## 技术问题

### :computer: M³ 的硬件和软件要求是什么？ {#hardware-and-software-requirements}

M³ 设计用于在多种操作系统上运行：

- **Windows**：Windows 10及更高版本（提供64位和32位版本）
- **macOS**：macOS 10.15 (Catalina)及更高版本（支持Intel和Apple Silicon）
- **Linux**：大多数现代Linux发行版（AppImage格式）

M³ 的硬件要求如下：

- **最低**：4GB 内存，6GB 可用磁盘空间
- **推荐**：8GB 内存，建议提供 15GB 可用空间用于媒体缓存
- **网络**：下载媒体需要互联网连接

根据您使用的功能，M³ 可能还需要以下额外软件：

- **Zoom**：仅在使用 Zoom 集成功能时需要
- **OBS Studio**：仅在使用 OBS 集成功能时需要

### :floppy_disk: M³ 占用多少磁盘空间？ {#disk-space}

磁盘空间占用取决于：

- **媒体分辨率**：分辨率越高占用的空间越多
- **缓存内容**：媒体文件会缓存在本地
- **额外缓存**：开启额外的缓存会增加占用
- **导出媒体**：自动导出功能会占用额外空间

典型占用量在 2-10GB 之间，具体取决于设置和使用习惯。

### :shield: M³ 是否安全且重视隐私？ {#security-privacy}

是! 是的！M³ 在设计时充分考虑了安全与隐私：

- **本地存储**：所有聚会数据都存储在您的电脑本地
- **直接下载**：媒体直接从耶和华见证人官方网站下载
- **开源**：代码公开，任何人都可以审阅和验证
- **错误报告**：仅为报告错误之目的收集有限的数据

### :arrows_clockwise: M³ 多久检查一次更新？ {#update-frequency}

M³ 检查更新的频率：

- **应用更新**：每次打开应用时自动检查新版本
- **媒体更新**：每次打开应用时自动检查新的聚会媒体
- **语言更新**：根据需要动态检测新语言
