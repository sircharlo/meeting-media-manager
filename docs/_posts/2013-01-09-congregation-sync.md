---
category: Configuration
title: 'Congregation sync'
layout: null
---

The brother designated as _videoconference organizer_ (VO) by the body of elders can use JWMMF to manage what media is made available to the technical A/V support team in his congregation.
The VO, or someone designated by him, can:

- upload **additional** media to be shared during a meeting, such as for the circuit overseer's visit, or for public speakers' talks
- **hide** media from JW.org that isn't relevant for a given meeting, for example, when a part has been replaced by the local branch
- add or remove **recurring** media, such as a year-text video, or an announcement slide

All who are synced to the same congregation will receive the exact same media after clicking the *Get media!* button.

> **Note:** Enabling congregation sync automatically disables and hides the *Offer to import additional media* option. When congregation sync is enabled, the VO or one of his team members will use the **☁️** (cloud) button on the main screen of JWMMF to [manage meeting or recurring media](#/manage-media).

Please note that the congregation sync feature is opt-in and entirely optional.


### How it works

The underlying syncing mechanism uses WebDAV. It requires the VO (or someone under his supervision) to either:

- set up a secured WebDAV server that is web-accessible, **or**
- use a third-party cloud storage service that supports the WebDAV protocol (see the *Congregation sync hostname* setting in the *Congregation sync setup* section below for more information).

All users that wish to be synchronized together should connect to the same WebDAV server using the connection information and credentials provided to them by their VO.

### Congregation sync setup


| Setting  | Explanation |
| ------------- | ------------- |
| `Congregation sync hostname` | Web address of the WebDAV server. Secure HTTP (HTTPS) is required. <br><br>You'll note that the label for this field is actually a button. Clicking it will show a list of WebDAV providers that have been known to be compatible with JWMMF, and will automatically prefill certain settings for those providers. Please note that this list is provided as a courtesy, and in no way represents an endorsement of any particular service or provider. The best server is always the one you own... |
| `Congregation sync port` | Usually 443 for standard HTTPS, but might differ depending on the site. |
| `Congregation sync username`  | Self-explanatory. |
| `Congregation sync password` | Self-explanatory. <br><br>**Note:** As detailed in their respective support pages, an app-specific password might need to be created for <a href="https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box" target="_blank">Box</a> and <a href="https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/" target="_blank">Koofr</a> in order to enable WebDAV connections to their services. |
| `Congregation sync folder` |  You can either type/paste in a path, or use your mouse to navigate to the target folder. Make sure that all congregation sync users input the same folder path; otherwise the sync won't work as expected. |
| `Congregation-wide settings`  | Once the VO has configured the *Media setup* and *Meeting setup* sections of the [JWMMF settings](#/configuration) on his own computer, he can then use this button to enforce certain settings for all congregation sync users (for example, meeting days, media language, conversion settings, and so on). This means that the selected settings will be forcefully applied for all synced users every time they open JWMMF. |


### Using congregation sync to manage media

Once the setup is complete, you're ready to start [managing media](#/manage-media) for your congregation's technical AV support team.
