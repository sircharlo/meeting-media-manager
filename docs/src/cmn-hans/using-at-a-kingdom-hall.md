# 在王国聚会所使用M3

本指南将带你在王国聚会所下载、安装和设置\*\*Meeting Media Manager (M³)\*\*的过程。 遵循步骤以确保在聚会期间管理媒体的顺利设置。

## 1. 下载并安装

1. 访问 [M³下载页面](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. 下载您操作系统的适当版本 (Windows, macOS 或 Linux)。
3. 打开安装程序并按照屏幕上的说明安装M³。
4. 启动 M³。
5. 通过配置向导。

## 2) 配置向导

### 应用显示语言

当首次启动 M³ 时，您将被提示选择您喜欢的 **显示语言** 。 选择您想要M³用于其接口的语言。 选择您想要M³用于其接口的语言。

:::tip 小贴士

这不必与 M³ 下载媒体的语言相同。 媒体下载的语言是在稍后的步骤中配置的。 媒体下载的语言是在稍后的步骤中配置的。

:::

### 配置文件类型

下一步是选择一个 **配置类型**。 在王国聚会所中定期设置，请选择**常规**。 这将配置许多常用于会众聚会的特征。

:::warning 小贴士

You should only choose **Other** if you are creating a profile for which no media should be automatically downloaded. Media will have to be manually imported for use in this profile. This type of profile is used mostly to use M³ during theocratic schools, assemblies, conventions and other special events.

**其他**配置文件类型很少使用。 **为了正常使用会众聚会，请选择_常规_.**
::: **For normal use during congregation meetings, please choose _Regular_.**

:::

### 自动聚合查询

M3可以尝试自动找到您会众的的聚会安排、语言和格式化名称。

要这样做，请使用聚合名称字段旁边的 **会众查询** 按钮并输入至少部分聚合名称和城市。

一旦找到并选择了正确的会众，M3将预置所有可用信息。 比如你的会众的 **名称**、 **聚会语言**、 **聚会日起和时间**。

:::info 备注

查找使用耶和华见证人官方网站提供的公开数据。

:::

### 手动输入会众信息

如果无法自动找到您的会众，您可以手动输入所需的信息。 向导将帮助您检查和输入您的会众的 **名称**、**会众语言**、**聚会日起和时间**。 向导将帮助您检查和输入您的会众的 **名称**、**会众语言**、**聚会日起和时间**。

### Caching videos from the songbook

You will also be given the option of **caching all videos from the songbook**. This option pre-downloads all the songbook videos, reducing the time it takes to fetch media for meetings in the future.

- **Pros:** Meeting media will be available much faster.
- **Cons:** The size of the media cache will increase significantly, by approximately 5GB.

:::tip 小贴士

If your Kingdom Hall has sufficient storage space, it’s recommended to **enable** this option for efficiency and perceived performance.

:::

### OBS Studio Integration Configuration (Optional)

If your Kingdom Hall uses **OBS Studio** for broadcasting hybrid meetings over Zoom, M³ can automatically integrate with that program. During setup, you can configure the integration with OBS Studio by entering the following:

- **Port:** The port number used to connect to the OBS Studio Websocket plugin.
- **Password:** The password used to connect to the OBS Studio Websocket plugin.
- **Scenes:** The OBS scenes that will be used during media presentations. You'll need one scene that captures the media window or screen, and one that shows the stage.

:::tip 小贴士

::: tip Tip
If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.

:::

## 3. Enjoy using M³

Once the setup wizard is complete, M³ is ready to help manage and present media for congregation meetings. Enjoy using the app! :tada:
