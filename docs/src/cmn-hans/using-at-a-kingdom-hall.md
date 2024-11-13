# 在王国聚会所使用M³ {#using-m3-at-a-kingdom-hall}

本指南将带你在王国聚会所下载、安装和设置\*\*Meeting Media Manager (M³)\*\*的过程。 遵循步骤以确保在聚会期间管理媒体的顺利设置。

## 1. 下载并安装 {#download-and-install}

1. 访问 [M³下载页面](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. 下载您操作系统的适当版本：
   - **Windows:**
     - 对于大多数Windows系统，下载 `meeting-media-manager-[VERSION]-x64.exe` 。
     - 对于较旧的32位Windows系统，请下载 `meeting-media-manager-[VERSION]-ia32.exe` 。
   - **MacOS:**
     - **M系列(Apple Silicon)**: 下载 `meeting-media-manager-[VERSION]-arm64.dmg`。
     - **Intel系列 Mac**：下载 `meeting-media-manager-[VERSION]-x64.dmg`。
   - **Linux:**
     - 下载 `meeting-media-manager-[VERSION]-x86_64.AppImage` 。
3. 打开安装程序并按照屏幕上的说明安装M³。
4. 启动 M³。
5. 通过配置向导。

### macOS only: Additional installation steps {#additional-steps-for-macos-users}

:::warning 小贴士

This section only applies to macOS users.

:::

Due to Apple's security measures, a few additional steps are required to run the installed M³ app on modern macOS systems.

Run the following two commands in Terminal, modifying the path to M³ as needed:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning 提示

As a macOS user, you will need to follow these steps every time you install or update M³.

:::

:::info 说明

The first command _signs the application's code_. This is required to prevent M³ from being detected as a malicious application from an unknown developer.

The second command _removes the quarantine flag_ from the application. The quarantine flag is used to warn users about potentially malicious applications that have been downloaded from the internet.

:::

#### Alternative method {#alternative-method-for-macos-users}

If you are still unable to launch M³ after entering the two commands from the previous section, please try the following:

1. 打开 macOS 系统 **隐私与安全** 设置。
2. 查找M3的条目，然后点击按钮**随时打开**。
3. 然后您将再次被警告，并且建议您“除非您确定它来自一个可信的来源，请不要打开” 点击 **继续打开** 。
4. 将出现另一个警告，您需要在哪里进行身份验证才能启动应用程序。
5. M3现在应该成功启动。

如果您在关注所有这些步骤后仍然有问题，请[在GitHub上打开一个问题](https://github.com/sircharlo/meeting-media-manager/issues/new)。 我们会尽力提供帮助。

### macOS only: Re-enabling website presentation after updates {#screen-sharing-issues}

:::warning 提示

This section only applies to macOS users.

:::

Some macOS users have reported that website presentation no longer works after installing updates to M³.

If the media window is black when presenting the website after updating M³, try the following steps:

1. 打开 macOS 系统 **隐私与安全** 设置。
2. Go to **Screen Recording**.
3. Select M³ in the list.
4. Click the `-` (minus) button to remove it.
5. Click the `+` (plus) button and select M³ from the Applications folder.
6. You may be prompted to relaunch M³ to apply the change.

After these steps, screen sharing should function as expected once again.

:::tip 小贴士

These steps are optional and can be skipped if you do not plan to use the website presentation feature. On the other hand, if you do plan to use the website presentation feature, it is recommended to follow these steps after every update to ensure the feature works as expected.

:::

## 2. 配置向导 {#configuration-wizard}

### 应用显示语言 {#app-display-language}

当首次启动 M³ 时，您将被提示选择您喜欢的 **显示语言** 。 选择您想要M³用于其接口的语言。 选择您想要M³用于其接口的语言。

:::tip 小贴士

这不必与 M³ 下载媒体的语言相同。 媒体下载的语言是在稍后的步骤中配置的。 媒体下载的语言是在稍后的步骤中配置的。

:::

### 配置文件类型 {#profile-type}

下一步是选择一个 **配置类型**。 在王国聚会所中定期设置，请选择**常规**。 这将配置许多常用于会众聚会的特征。

:::warning 提示

只有当您创建的配置不需要自动下载任何媒体内容时，您才应该选择**其他**。 在此配置中，媒体内容需要手动导入才能使用。 这种类型的配置主要用于在学校、分区及区域大会和其他特殊活动中使用M³。

**其他**配置类型很少使用。 **在会众聚会期间正常使用时，请选择_常规_。**

:::

### 会众自动查询 {#automatic-congregation-lookup}

M³可以尝试自动找到您会众的的聚会安排、语言和正式名称。

要这样做，请使用聚合名称字段旁边的 **会众查询** 按钮并输入至少部分聚合名称和城市。

一旦找到并选择了正确的会众，M³将预置所有可用信息。 比如你的会众的 **名称**、 **聚会语言**、 **聚会日起及时间**。

:::info 备注

查找使用耶和华见证人官方网站提供的公开数据。

:::

### 会众信息的手动输入 {#manual-entry-of-congregation-information}

如果无法自动找到您的会众，您可以手动输入所需的信息。 向导将帮助您检查和输入您的会众的 **名称**、**会众语言**、**聚会日起和时间**。

### 正在从歌曲中缓存视频 {#caching-videos-from-the-songbook}

您还可以选择**缓存歌本中的所有视频**。 此选项预先下载所有歌本视频，减少将来获取会议媒体所需的时间。

- \*\*优点：\*\*聚会媒体加载速度更快。
- \*\*缺点：\*\*媒体缓存大小将显著增加，约5GB。

:::tip 小贴士

如果您的王国聚会所有足够的存储空间，建议**启用**此选项以提高效率和使用体验。

:::

### OBS 工作室集成配置 (可选) {#obs-studio-integration-configuration}

如果您的王国聚会所使用**OBS Studio**通过Zoom进行混合聚会直播，M³可以自动与该程序集成。 在设置过程中，您可以通过输入以下内容来配置与OBS Studio的集成：

- \*\*端口：\*\*用于连接OBS Studio Websocket插件的端口号。
- \*\*密码：\*\*用于连接OBS Studio Websocket插件的密码。
- \*\*场景：\*\*在媒体播放期间将使用的OBS场景。 您需要一个场景来捕捉媒体窗口或屏幕，另一个场景来显示讲台。

:::tip 小贴士

如果您的会众定期举行混合会议，**强烈** 推荐您启用OBS Studio集成。

:::

## 3. 享受使用 M³ {#enjoy-using-m3}

设置向导完成后，M³就可以帮助管理和播放会众聚会的媒体内容了。 享受使用M³！ :tada:
