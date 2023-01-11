---
tag: Configuration
title: Settings
ref: configuration
---

The Settings screen is divided into 4 sections. Most of the options are self-explanatory, but here are a few additional details.

### Application setup

| Setting | Explanation |
| ------- | ----------- |
| `Offline mode` | If enabled, M³ will not attempt to connect to JW.org or your congregation server. This is useful for when you have a poor internet connection and want to save bandwidth. |
| `Theme preference` | Select the theme you prefer. If you select `System`, M³ will use the system's theme. |
| `Congregation name` | The name of your congregation. This is used to support multiple congregations who share the same computer. |
| `Display language` | Sets the language in which M³ is displayed. <br><br> Thank you to our many contributors for translating the app in so many languages! If you want to help improve an existing translation or add a new one, please open up a new [discussion]({{site.github}}/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M%C2%B3+into+a+language+I+speak,+LANGUAGE). |
| `Folder in which to save media` | Meeting media will be saved to this folder for later sharing and use. |
| `Custom cache path` | By default, publications and other data are saved in a different directory for each user. You can change this directory if you want to share the cached data between multiple users on the same computer. |
| `Date format for meeting folders` | The date format used for the meeting folders. <br><br> ***Note:** When using a congregation server, please ensure that everyone configures the same date format.* |
| `Run app at system start-up` | If enabled, M³ will launch when the current user logs into the computer. <br><br> ***Note:** Unavailable on Linux.* |
| `Automatically initiate media sync` | If enabled, this option will automatically initiate a media sync 5 seconds after M³ is launched. <br><br> *To prevent the automatic sync from occurring when this setting is enabled, press the ⏸ (pause) button before the 5-second timer is up.* |
| `Open folder after media sync` | If enabled, the folder containing the downloaded media for the chosen week will open in the computer's file manager after the media sync is complete. |
| `Quit app after media sync` | If enabled, this option will automatically quit M³ 5 seconds after the media sync is complete. <br><br> *To prevent M³ from quitting automatically when this setting is enabled, press the 🏃 (person leaving/running) button before the 5-second timer is up.* |
| `Enable OBS Studio compatibility mode` | If enabled, this option will tap into OBS Studio to change scenes automatically as needed both before and after sharing media. <br><br> *If enabling this setting, make sure that OBS Studio is configured to use the `obs-websocket` plugin, which is what will enable M³ to communicate with OBS Studio. <br><br> Also, configure all needed scenes for media sharing and stage display in OBS. At the very least, you'll need a scene with a `Window Capture` (recommended) or `Display Capture` configured to capture the M³ media presentation window, or the screen on which the media will be presented. <br><br> You'll also need to configure all desired stage view scenes, for example: a shot of the lecturn, a wide shot of the stage, etc.* |
| `Port` | Port on which the `obs-websocket` plugin is configured to listen. |
| `Password` | Password configured in the `obs-websocket` plugin's settings. |
| `Default stage view scene in OBS Studio` | Select which scene should be selected by default when media presentation mode is launched. Usually a stage wide view, or a shot of the lectern. |
| `Media window scene in OBS Studio` | Select which scene is configured in OBS Studio to capture the M³ media window. |
| `OBS Studio scene to display Zoom participants` | An optional scene to quickly and efficiently manage the display of Zoom participants during hybrid meetings. <br><br> When this scene is configured, the behavior of the [Media Presentation mode]({{page.lang}}/#present-media) changes somewhat. When in this mode, a toggle button will appear which, when enabled, will cause the media window to be hidden, and the Zoom scene to be shown. The OBS scene picker will also be hidden. Sharing media will automatically show the media scene as per usual, and after sharing media, the media window will disappear immediately. <br><br> When the toggle is disabled, the media window and scene pickers will be shown again. |
| `Disable automatic app update` | When this option is enabled, M³ will not automatically self-update when closed. |
| `Disable hardware acceleration` | Only enable this setting if you are experiencing issues with media presentation mode. Changing this setting will cause M³ to restart. |

### Congregation sync setup

See the [Congregation sync]({{page.lang}}/#congregation-sync) section for details on what this does exactly and how to configure this section.

### Media setup

| Setting | Explanation |
| ------- | ----------- |
| `Media language` | Select the language of your congregation or group. All media will be downloaded from JW.org in this language. |
| `Fallback media language` | This language is used whenever the primary media language is not available. <br><br> For example, if you select Irish as your media language and English as your fallback, whenever a publication or video is not available in Irish, it will be fetched in English. |
| `Maximum resolution for videos` | Videos downloaded from JW.org will be downloaded at this resolution, or the next available lower resolution. Useful for limited or low-bandwidth situations. |
| `Enable subtitles for videos` | Enable this option if you want to fetch subtitles for videos, whenever available. Subtitles will be shown by default, but can be toggled on/off while presenting. |
| `Convert media to MP4 format` | This will automatically convert all picture and audio files into MP4 format, for use with Zoom's [native MP4 sharing feature](assets/img/other/zoom-mp4-share.png) during fully remote congregation Zoom meetings. This includes all pictures and media files downloaded from JW.org, as well as additional media files added by the user or the VO. <br><br> ***Note:** This option is best suited for **remote-only** congregation Zoom meetings. If conducting either **hybrid** or **regular** congregation meetings, look into using [Media Presentation mode]({{page.lang}}/#present-media) by activating the `Present media on an external monitor or in a separate window` option instead, and disable this option.* |
| `Keep original media files after conversion` | If this setting is enabled, picture and audio files will be kept in the media folder after being converted to MP4 format, rather than deleted. This will result in a slightly more cluttered media folder, and generally does not need to be enabled if sharing media through Zoom MP4 sharing. (See `Convert media to MP4 format` above.) <br><br> ***Note:** Only visible if `Convert media to MP4 format` is also enabled.* |
| `Present media on an external monitor or in a separate window` | This setting will allow you to use M³ to present pictures, videos and audio files during **hybrid** or **in-person** congregation meetings. The media playback management screen can then be accessed by clicking the ▶️ (play) button on the main screen of M³. <br><br> The media presentation screen will automatically use an external monitor if present; if not, the media will be displayed in a separate, resizable window. <br><br> ***Note:** This option is best suited for either **hybrid** or **regular** congregation meetings. <br><br> If conducting **remote-only** congregation Zoom meetings, look into activating the `Convert media to MP4 format` option and sharing the media with Zoom's native MP4 sharing instead.* |
| `Background image for media presentation mode` | By default, M³ will attempt to fetch the current year's text in the language selected previously, in order to display it on a black background when in [Media Presentation mode]({{page.lang}}/#present-media) and no other media is being played. If the automatic yeartext retrieval fails for some reason, or if you wish to display a different background image, you can either use the 'Browse' button to select a custom picture, or the 'Refresh' button to try fetching the yeartext automatically again. <br><br> ***Note:** If [Congregation sync]({{page.lang}}/#congregation-sync) is enabled, selecting a custom background image will synchronize it for all congregation sync users automatically.* |
| `Hide media window after media finished playing` | If enabled, the media window will be hidden immediately after each media file has finished playing. <br><br> ***Note:** This setting is especially useful for sign-language meetings.* |
| `Enable keyboard shortcuts during media playback` | This setting allows you to set custom key combinations to play and stop media. This is useful in combination with a USB remote control, for example. |
| `Create playlists for use with VLC` | Enable this if you want to generate playlists for every meeting automatically, which can then be loaded in VLC, if you are using that app to display media instead of [Media Presentation mode]({{page.lang}}/#present-media). |
| `Exclude all media from the th brochure` | If enabled, this will prevent media from the *Apply Yourself* brochure from being included at every midweek meeting. |
| `Exclude Enjoy Life Forever images outside the Congregation Bible Study` | If enabled, this will prevent images from the *Live Forever* book (*lff*) from being included, for example for student assignments during the midweek meeting. |
| `Include printed media when available` | If enabled, renderings of the printed editions of publications will be included when available. This could be useful for some tables or groups of images that are clearer in printed form. |

### Meeting setup

| Setting | Explanation |
| ------- | ----------- |
| `Special congregation` | If enabled, no media will be downloaded from JW.org. Only manually added media will be available. This is useful for theocratic schools, for example. |
| `Midweek meeting` | Indicate the usual day and time for the midweek meeting; used for folder naming and automatic background music fade-out (see below). |
| `Weekend meeting` | Indicate the usual day and time for the weekend meeting. |
| `Enable button to play Kingdom songs on shuffle` | Enable a button on the main screen which will play Kingdom songs from the *sjjm* series, in random order. This is useful, for example, to play songs before and after meetings at the Kingdom Hall as background music. To the right of this option is a button to download all available Kingdom songs, which could be useful to prevent buffering delays. |
| `Song playback volume` | Sets the volume at which the background music will play. |
| `Automatically stop playing songs` | If `Enable button to play Kingdom songs on shuffle` is active, then this setting will allow you to specify a delay after which background music should be automatically stopped. This can be either a set number of minutes, or a predetermined number of seconds before the start of the meeting (in the case where the background music was started before a meeting). |

### Screenshots of the settings screen

{% include screenshots/configuration.html lang=site.data.en %}
