# 在王国聚会所使用M³

本指南将带你在王国聚会所下载、安装和设置\*\*Meeting Media Manager (M³)\*\*的过程。 遵循步骤以确保在聚会期间管理媒体的顺利设置。

## 1. 下载并安装

1. 访问 [M³下载页面](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Download the appropriate version for your operating system:
   - **Windows:**
     - For most Windows systems, download `meeting-media-manager-[VERSION]-x64.exe`.
     - For older 32-bit Windows systems, download `meeting-media-manager-[VERSION]-ia32.exe`.
   - **macOS:**
     - **M-series (Apple Silicon)**: Download `meeting-media-manager-[VERSION]-arm64.dmg`.
     - **Intel-based Macs**: Download `meeting-media-manager-[VERSION]-x64.dmg`.
   - **Linux:**
     - Download `meeting-media-manager-[VERSION]-x86_64.AppImage`.
3. 打开安装程序并按照屏幕上的说明安装M³。
4. 启动 M³。
5. 通过配置向导。

### macOS 用户的附加步骤

由于苹果的安全措施，还需要采取一些其他步骤来在近期macOS系统上运行M3。

首先，在终端中运行以下两个命令(按照需要，修改M3的路径)：

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::tip 说明

这些命令做了两件事，防止您的系统被检测到 M3 作为恶意应用程序：第一个命令在本地标记应用程序的代码。 第二种办法取消了申请中的检疫标志。 检疫标志用来警告用户已经从因特网下载过的应用程序。

:::

如果您在进入两个命令后仍然无法启动 M3，请尝试以下操作：

1. 打开 macOS 系统 **隐私与安全** 设置。
2. 查找M3的条目，然后点击按钮**随时打开**。
3. 然后您将再次被警告，并且建议您“除非您确定它来自一个可信的来源，请不要打开” 点击 **继续打开** 。
4. 将出现另一个警告，您需要在哪里进行身份验证才能启动应用程序。
5. M3现在应该成功启动。

如果您在关注所有这些步骤后仍然有问题，请[在GitHub上打开一个问题](https://github.com/sircharlo/meeting-media-manager/issues/new)。 我们会尽力提供帮助。

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

**其他**配置类型很少使用。 **在会众聚会期间正常使用时，请选择*常规*。**

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
