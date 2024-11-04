# 在王国聚会所使用M³

本指南将带你在王国聚会所下载、安装和设置\*\*Meeting Media Manager (M³)\*\*的过程。 遵循步骤以确保在聚会期间管理媒体的顺利设置。

## 1. 下载并安装

1. 访问 [M³下载页面](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. 下载您操作系统的适当版本 (Windows, macOS 或 Linux)。
3. 打开安装程序并按照屏幕上的说明安装M³。
4. 启动 M³。
5. 通过配置向导。

### Additional steps for macOS Users

Due to Apple's security measures, a few additional steps are required to run M³ on modern macOS systems.

First, run the following two commands in Terminal (modify the path to M³ as needed):

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::tip Explanation

These commands do two things that will prevent M³ from being detected as a malicious application on your system: the first one signs the application's code locally, and the second one removes the quarantine flag from the application. The quarantine flag is used to warn users about applications that have been downloaded from the internet.

:::

If you are still unable to launch M³ after entering the two commands, please try the following:

1. Open the macOS system **Privacy & Security** settings.
2. Find the entry for M³ and click the button to **Open Anyway**.
3. You will then be warned again, and given the advice to not "open this unless you are certain it is from a trustworthy source." Click **Open Anyway**.
4. Another warning will appear, where you’ll need to authenticate to launch the app.
5. M³ should now launch successfully.

If you still have issues after following all these steps, please [open an issue on GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). We will do our best to help.

## 2. 配置向导

### 应用显示语言

当首次启动 M³ 时，您将被提示选择您喜欢的 **显示语言** 。 选择您想要M³用于其接口的语言。 选择您想要M³用于其接口的语言。

:::tip 小贴士

这不必与 M³ 下载媒体的语言相同。 媒体下载的语言是在稍后的步骤中配置的。 媒体下载的语言是在稍后的步骤中配置的。

:::

### 配置文件类型

下一步是选择一个 **配置类型**。 在王国聚会所中定期设置，请选择**常规**。 这将配置许多常用于会众聚会的特征。

:::warning 小贴士

只有当您创建的配置不需要自动下载任何媒体内容时，您才应该选择**其他**。 在此配置中，媒体内容需要手动导入才能使用。 这种类型的配置主要用于在学校、分区及区域大会和其他特殊活动中使用M³。

**其他**配置类型很少使用。 **在会众聚会期间正常使用时，请选择_常规_。**

:::

### 自动会众查询

M³可以尝试自动找到您会众的的聚会安排、语言和正式名称。

要这样做，请使用聚合名称字段旁边的 **会众查询** 按钮并输入至少部分聚合名称和城市。

一旦找到并选择了正确的会众，M³将预置所有可用信息。 比如你的会众的 **名称**、 **聚会语言**、 **聚会日起及时间**。

:::info 备注

查找使用耶和华见证人官方网站提供的公开数据。

:::

### 手动输入会众信息

如果无法自动找到您的会众，您可以手动输入所需的信息。 向导将帮助您检查和输入您的会众的 **名称**、**会众语言**、**聚会日起和时间**。

### 缓存歌本中的视频

您还可以选择**缓存歌本中的所有视频**。 此选项预先下载所有歌本视频，减少将来获取会议媒体所需的时间。

- \*\*优点：\*\*聚会媒体加载速度更快。
- \*\*缺点：\*\*媒体缓存大小将显著增加，约5GB。

:::tip 小贴士

如果您的王国聚会所有足够的存储空间，建议**启用**此选项以提高效率和使用体验。

:::

### OBS Studio集成配置（可选）

如果您的王国聚会所使用**OBS Studio**通过Zoom进行混合聚会直播，M³可以自动与该程序集成。 在设置过程中，您可以通过输入以下内容来配置与OBS Studio的集成：

- \*\*端口：\*\*用于连接OBS Studio Websocket插件的端口号。
- \*\*密码：\*\*用于连接OBS Studio Websocket插件的密码。
- \*\*场景：\*\*在媒体播放期间将使用的OBS场景。 您需要一个场景来捕捉媒体窗口或屏幕，另一个场景来显示讲台。

:::tip 小贴士

如果您的会众定期举行混合会议，**强烈** 推荐您启用OBS Studio集成。

:::

## 3. 享受使用M³

设置向导完成后，M³就可以帮助管理和播放会众聚会的媒体内容了。 享受使用M³！ :tada:
