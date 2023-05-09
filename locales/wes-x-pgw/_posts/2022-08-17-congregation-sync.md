---
tag: Configuration
title: Congregation sync
ref: congregation-sync
---

The brother wey the body of elders don choose make e be the *Person wey de organize una video conference* (Organizer) fit use M³ for manage which pictures and videos go be available for the technical A/V support team for e congregation.

The Organizer, or someone wey e ask, fit:

- upload **additional** pictures or videos for share-am during a meeting, like when the circuit overseer go come, or for public talks
- **hide** media from JW.org wey una no go need for the meeting, for example when the branch don replace one part make una discuss something else
- add or remove **pictures and videos wey you go need every time**, like one yeartext video or some slide with announcement

Everybody wey de sync for the same congregation, them go really get the same pictures and videos when them de click the button for *Update media folders*.

Remember say you no need use the congregation sync feature, but you fit use-am if you want.

### How e de work

M³ de use WebDAV for inside when we de sync things. This one mean say the Organizer (or someone wey e de ask) need do one of this things:

- set up one secure WebDAV server wey we fit reach for Internet, **or**
- use one cloud service wey some company de offer. E need support the WebDAV protocol (see the setting *Web address* for the section *Congregation sync setup* below).

All people wey want sync the same things go need connect to the same WebDAV server. The Organizer suppose tell everybody the connection login data.

### Congregation sync setup

| Setting                    | Wetin e mean                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Web address`              | Web address for the WebDAV server. You go need secure HTTP (they call-am HTTPS). <br><br> ***Note:** The Web address button, when you click-am, go show some WebDAV services wey M³ fit use. When you choose one, we go enter the settings for that one. <br><br> We just want give you some ideas. We show the list, but e no be like we de gree or recommend one of this offers. The better server na always the one wey you own yourself…*                    |
| `User name`                | User name for the WebDAV service.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `Password`                 | Password for the WebDAV service. <br><br>***Note:** You go need one app password when you want to connect to [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) or [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) for WebDAV.*                                                                                                                                                              |
| `Congregation sync folder` | This na the folder wey we go use for sync pictures and videos for all congregation sync users. You fit type or paste one path. Or just click the target folder. <br><br>***Note:** Make sure say everybody go fill the same folder path; or sync no go work like you expect-am.*                                                                                                                                                                                             |
| `Congregation settings`    | After the Organizer don set up the *Picture and video setup* and *Meeting setup* sections for the [Settings]({{page.lang}}/#configuration) on e own computer, e fit click this button for copy some settings to all people wey use congregation sync (for example, meeting days, language for pictures and videos, settings for convert MP4, and so on). This one mean say the settings wey e choose go overwrite this settings for everybody wey open M³ and sync with this connection. |

### Use congregation sync for manage pictures and videos

After you don finish congregation sync setup, you fit start [manage pictures and videos]({{page.lang}}/#manage-media) for una technical A/V support team.

### See how congregation sync de work

{% include screenshots/congregation-sync.html lang=site.data.wes-x-pgw %}
