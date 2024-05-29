---
tag: 设定
title: 会众同步
ref: congregation-sync
---

被长老团体指定为 *视频会议组织者* (VO)的兄弟可以使用M³来管理向其聚会中的技术A/V支援组提供的媒体。

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

| 设置        | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `网址`      | WebDAV服务器的网络地址。 安全HTTP（HTTPS）是必需的。 <br><br> ***Note:** The Web address button, once clicked, will show a list of WebDAV providers that have been known to be compatible with M³, and will automatically prefill certain settings for those providers. <br><br> This list is provided as a courtesy, and in no way represents an endorsement of any particular service or provider. The best server is always the one you own...* |
| `用户名`     | Username for the WebDAV service.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `密码`      | Password for the WebDAV service. <br><br> ***Note:** As detailed in their respective support pages, an app-specific password might need to be created for [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) and [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) in order to enable WebDAV connections to their services.*                                   |
| `会众同步文件夹` | This is the folder that will be used to synchronize media for all congregation sync users. You can either type/paste in a path, or use your mouse to navigate to the target folder. <br><br> ***Note:** Make sure that all congregation sync users input the same folder path; otherwise the sync won't work as expected.*                                                                                                                   |
| `会众同步设置`  | Once the VO has configured the *Media setup* and *Meeting setup* sections of the [Settings]({{page.lang}}/#configuration) on his own computer, he can then use this button to enforce certain settings for all congregation sync users (for example, meeting days, media language, conversion settings, and so on). This means that the selected settings will be forcefully applied for all synced users every time they open M³.                       |

### Using congregation sync to manage media

Once the congregation sync setup is complete, you're ready to start [Managing media]({{page.lang}}/#manage-media) for your congregation's technical AV support team.

### Screenshots of congregation sync in action

{% include screenshots/congregation-sync.html lang=site.data.en %}
