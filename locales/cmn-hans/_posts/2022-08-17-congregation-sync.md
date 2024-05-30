---
tag: 设定
title: 会众同步
ref: congregation-sync
---

被长老团体指定为*视频会议组织者*（VO）的弟兄可以使用M³来管理其会众的技术A/V支援组使用的媒体。

VO（或由其指定的人）可以：

- 上传**附加**媒体以便在聚会时分享，例如用于分区监督的探访或公众演讲
- **隐藏**JW.org的媒体，这些媒体与某次聚会无关，例如，当一个节目被本地分部办事处替换时
- 添加或删除**重复的**媒体，比如全年经文视频或宣布内容

所有被同步到同一会众的人都会在点击*更新媒体文件夹*按钮时收到完全相同的媒体。

请注意该会众同步功能是选择性的，可以不选择使用。

### 如何运作

M³的基础同步机制使用WebDAV 。 这意味着VO（或其监督下的某人）需要：

- 设置一个安全的可以访问web的WebDAV服务器，**或**
- 使用支持WebDAV协议的第三方云存储服务（见*会众同步设置*部分中的*网页地址*设置）。

所有想要同步的用户都需要使用他们的VO向他们提供的连接信息和资格证书连接到相同的WebDAV服务器。

### 会众同步设置

| 设置        | 说明                                                                                                                                                                                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `网址`      | WebDAV服务器的网络地址。 安全HTTP（HTTPS）是必需的。 <br><br> ***注:** 一旦点击，Web地址按钮，将显示已知与M³兼容的WebDAV供应商列表，并将自动为这些供应商预设某些设置。 <br><br>此列表仅供参考，绝不代表对任何特定服务或提供者的认可。 最好的服务器总是你拥有的服务器...*                                                                                    |
| `用户名`     | WebDAV服务的用户名。                                                                                                                                                                                                                                                                |
| `密码`      | WebDAV服务的密码。 <br><br> ***注：**详见各自的支持页面，为了启用WebDAV连接到他们的服务，可能需要为[Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box)和[Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/)创建一个针对应用程序的密码。* |
| `会众同步文件夹` | 这是用于同步所有会众同步用户的媒体的文件夹。 您可以在路径中键入/粘贴，也可以使用鼠标导航到目标文件夹。 <br><br> ***注：**请确保所有会众同步用户输入相同的文件夹路径；否则同步将无法正常工作。*                                                                                                                                                         |
| `会众同步设置`  | 一旦VO在他自己的电脑上配置了[设置]({{page.lang}}/#configuration)里面的*媒体设置*和*聚会设置*部分，他就可以使用这个按钮来强制对所有会众同步用户执行某些设置（例如，聚会日、媒体语言、转换设置等）。 这意味着每次打开M³时，所有同步用户都将被强制应用选定的设置。                                                                                                                         |

### Using congregation sync to manage media

Once the congregation sync setup is complete, you're ready to start [Managing media]({{page.lang}}/#manage-media) for your congregation's technical AV support team.

### Screenshots of congregation sync in action

{% include screenshots/congregation-sync.html lang=site.data.en %}
