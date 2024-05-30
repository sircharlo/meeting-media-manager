---
tag: 帮助
title: 技术注释
ref: usage-notes
---

这个应用应该像在运行Windows、Linux或 macOS的大多数现代计算机上一样运行。

### Windows：安装和首次启动

打开安装程序时，您可能会收到一条[错误](assets/img/other/win-smartscreen.png)消息，提示“Windows SmartScreen 阻止了一个未识别的应用启动”。 这是因为应用程序下载次数不多，Windows没有明确“信任”。 要绕过这个问题，请单击"更多信息"，然后"无论如何运行"。

### Linux：安装和首次启动

按照[官方 AppImage 文档](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html)，如果应用未能正常打开, 确认以下命令的输出：

`sysctl kernel.unprivileged_userns_clone`

如果输出是`0`，那么除非您运行以下命令并重新启动，否则 AppImage 将**无法**运行：

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

请确保您已阅读[这意味着什么](https://lwn.net/Articles/673597/)。

### macOS: 安装和首次启动

如果在启动应用时您收到了一个警告，无法打开应用， 或者因为“它没有从应用商店下载”，或者因为“开发者无法验证”， 那么此 [Apple支持页](https://support.apple.com/en-ca/HT202491) 将帮助您过去。

如果您收到一条消息，表明您“没有权限打开应用程序”，那么尝试从 [此页](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860)中的一些解决方案，例如在 `Terminal 中运行以下命令。`：

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: 在 macOS Sonoma 中具有音频或麦克风权限的问题

由于macOS Sonoma，有些用户可能会遇到M³反复发出错误消息的问题，表明它需要访问麦克风。 在 `Terminal.app` 中执行以下命令能解决一些问题：

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS：自动更新

不同于 Windows 和 Linux，自动更新功能在macOS上**没能实现**，出于技术原因，可能永远无法实现。 然而，当可用更新时，macOS 用户将发生两件事之一：

- M³将尝试下载更新包并自动打开它，此后用户将需要手动完成M³更新，拖拽更新应用到应用程序文件夹中。 然后，他们将能够像以前一样从其应用程序文件夹中启动更新了的M³。
- 如果前一步骤在任何阶段都失败， M³将显示一个持续的通知，说有一个可用的更新，并链接到更新。 一个红色的拉动通知也将显示在M³主屏幕上的设置按钮上。 设置界面中的M³版本号将会变成一个按钮，一旦点击，将自动打开最新版本的下载页面。
