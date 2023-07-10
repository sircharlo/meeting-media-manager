---
tag: Configuration
title: Občinska sinhronizacija
ref: congregation-sync
---

The brother designated as *videoconference organizer* (VO) by the body of elders can use M³ to manage what media is made available to the technical A/V support team in his congregation.

The VO, or someone designated by him, can:

- upload **additional** media to be shared during a meeting, such as for the circuit overseer's visit, or for public speakers' talks
- **hide** media from JW.org that isn't relevant for a given meeting, for example, when a part has been replaced by the local branch
- add or remove **recurring** media, such as a year-text video, or an announcement slide

All who are synced to the same congregation will then receive the exact same media when they click the *Update media folders* button.

Please note that the congregation sync feature is opt-in and entirely optional.

### How it works

M³'s underlying sync mechanism uses WebDAV. This means that the VO (or someone under his supervision) needs to either:

- set up a secured WebDAV server that is web-accessible, **or**
- use a third-party cloud storage service that supports the WebDAV protocol (see the *Web address* setting in the *Congregation sync setup* section below).

All users that wish to be synchronized together will need to connect to the same WebDAV server using the connection information and credentials provided to them by their VO.

### Congregation sync setup

| Setting                      | Explanation                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Web address`                | Web address of the WebDAV server. Secure HTTP (HTTPS) is required. <br><br> ***Note:** The Web address button, once clicked, will show a list of WebDAV providers that have been known to be compatible with M³, and will automatically prefill certain settings for those providers. <br><br> This list is provided as a courtesy, and in no way represents an endorsement of any particular service or provider. The best server is always the one you own...* |
| `Username`                   | Username for the WebDAV service.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `Password`                   | Password for the WebDAV service. <br><br> ***Note:** As detailed in their respective support pages, an app-specific password might need to be created for [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) and [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) in order to enable WebDAV connections to their services.*                                                                   |
| `Congregation sync folder`   | This is the folder that will be used to synchronize media for all congregation sync users. You can either type/paste in a path, or use your mouse to navigate to the target folder. <br><br> ***Note:** Make sure that all congregation sync users input the same folder path; otherwise the sync won't work as expected.*                                                                                                                                                   |
| `Congregation-wide settings` | Once the VO has configured the *Media setup* and *Meeting setup* sections of the [Settings]({{page.lang}}/#configuration) on his own computer, he can then use this button to enforce certain settings for all congregation sync users (for example, meeting days, media language, conversion settings, and so on). This means that the selected settings will be forcefully applied for all synced users every time they open M³.                                                       |

### Using congregation sync to manage media

Once the congregation sync setup is complete, you're ready to start [Managing media]({{page.lang}}/#manage-media) for your congregation's technical AV support team.

### Screenshots of congregation sync in action

{% include screenshots/congregation-sync.html lang=site.data.en %}
