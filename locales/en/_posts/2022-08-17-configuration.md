---
tag: Configuration
title: Settings
ref: configuration
---

The Settings screen is divided into 4 sections. Most of the options are self-explanatory, but here are a few additional details.

### Application setup

| Setting | Explanation |
| ------- | ----------- |
| `Display language` | Sets the language in which M³ is displayed. <br><br> Thank you to our many contributors for translating the app in so many languages! If you want to help improve an existing translation or add a new one, please open up a new [discussion]({{site.github}}/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M%C2%B3+into+a+language+I+speak,+LANGUAGE). |
| `Folder in which to save media` | Meeting media will be saved to this folder for later sharing and use. |
| `Run app at system start-up` | If enabled, M³ will launch when the current user logs into the computer. <br><br> ***Note:** Unavailable on Linux.* |
| `Automatically initiate media sync` | If enabled, this option will automatically initiate a media sync 5 seconds after M³ is launched. <br><br> *To prevent the automatic sync from occurring when this setting is enabled, press the ⏸ (pause) button before the 5-second timer is up.* |
| `Open folder after media sync` | When enabled, the folder containing the downloaded media for the chosen week will open in the computer's file manager after the media sync is complete. |
| `Quit app after media sync` | If enabled, this option will automatically quit M³ 5 seconds after the media sync is complete. <br><br> *To prevent M³ from quitting automatically when this setting is enabled, press the 🏃 (person leaving/running) button before the 5-second timer is up.* |
| `Enable OBS Studio compatibility mode` | If enabled, this option will tap into OBS Studio to change scenes automatically as needed both before and after sharing media. <br><br> *If enabling this setting, make sure that OBS Studio is configured to use the `obs-websocket` plugin, which is what will enable M³ to communicate with OBS Studio. <br><br> Also, configure all needed scenes for media sharing and stage display in OBS. At the very least, you'll need a scene with a `Window Capture` (recommended) or `Display Capture` configured to capture the M³ media presentation window, or the screen on which the media will be presented. <br><br> You'll also need to configure all desired stage view scenes, for example: a shot of the lecturn, a wide shot of the stage, etc.* |
| `Port` | Port on which the `obs-websocket` plugin is configured to listen. |
| `Password` | Password configured in the `obs-websocket` plugin's settings. |
| `Default stage view scene in OBS Studio` | Select which scene should be selected by default when media presentation mode is launched. Usually a stage wide view, or a shot of the lectern. |
| `Media window scene in OBS Studio` | Select which scene is configured in OBS Studio to capture the M³ media window. |
| `Disable hardware acceleration` | Only enable this setting if you are experiencing issues with media presentation mode. Changing this setting will cause M³ to restart. |

### Congregation sync setup

See the [Congregation sync]({{page.lang}}/#congregation-sync) section for details on what this does exactly and how to configure this section.

### Media setup

| Setting | Explanation |
| ------- | ----------- |
| `Media language` | Select the language of your congregation or group. All media will be downloaded from JW.org in this language. |
| `Maximum resolution for videos` | Videos downloaded from JW.org will be downloaded at this resolution, or the next available lower resolution. Useful for limited or low-bandwidth situations. |
| `Convert media to MP4 format` | This will automatically convert all picture and audio files into MP4 format, for use with Zoom's [native MP4 sharing feature](assets/img/other/zoom-mp4-share.png) during fully remote congregation Zoom meetings. This includes all pictures and media files downloaded from JW.org, as well as additional media files added by the user or the VO. <br><br> ***Note:** This option is best suited for **remote-only** congregation Zoom meetings. If conducting either **hybrid** or **regular** congregation meetings, look into using [Media Presentation mode]({{page.lang}}/#present-media) by activating the `Present media on an external monitor or in a separate window` option instead, and disable this option.* |
| `Keep original media files after conversion` | If this setting is enabled, picture and audio files will be kept in the media folder after converting them to MP4 format, rather than being deleted. This will result in a slightly more cluttered media folder, and generally does not need to be enabled if sharing media through Zoom MP4 sharing. (`See Convert media to MP4 format` above.) <br><br> ***Note:** Only visible if `Convert media to MP4 format` is also enabled.* |
| `Present media on an external monitor or in a separate window` | This setting will allow you to use M³ to present pictures, videos and audio files during **hybrid** or **in-person** congregation meetings. can then be accessed by clicking the ▶️ (play) button on the main screen of M³. <br><br> The media presentation screen will automatically use an external monitor if present; if not, the media will be displayed in a separate, resizable window. <br><br> ***Note:** This option is best suited for either **hybrid** or **regular** congregation meetings. <br><br> If conducting **remote-only** congregation Zoom meetings, look into activating the `Convert media to MP4 format` option and sharing the media with Zoom's native MP4 sharing instead.* |
| `Background image for media presentation mode` | By default, M³ will attempt to fetch the current year's text in the language selected previously, in order to display it on a black background when in [Media Presentation mode]({{page.lang}}/#present-media) and no other media is being played. If the automatic yeartext retrieval fails for some reason, or if you wish to display a different background image, you can either use the 'Browse' button to select a custom picture, or the 'Refresh' button to try fetching the yeartext automatically again. <br><br> ***Note:** If [Congregation sync]({{page.lang}}/#congregation-sync) is enabled, selecting a custom background image will synchronize it for all congregation sync users automatically.* |
| `Create playlists for use with VLC` | Enable this if you want to generate playlists for every meeting automatically, which can then be loaded in VLC, if you are using that app to display media instead of [Media Presentation mode]({{page.lang}}/#present-media). |
| `Exclude all media from the th brochure` | If enabled, this will prevent media from the *Apply Yourself* brochure from being included at every midweek meeting. |
| `Exclude Enjoy Life Forever images outside the Congregation Bible Study` | If enabled, this will prevent images from the *Live Forever* book (*lff*) from being included, for example for student assignments during the midweek meeting. |

### Meeting setup

| Setting | Explanation |
| ------- | ----------- |
| `Midweek meeting` | Indicate the usual day and time for the midweek meeting; used for folder naming and automatic background music fade-out (see below). |
| `Weekend meeting` | Indicate the usual day and time for the weekend meeting. |
| `Enable button to play Kingdom songs on shuffle` | Enable a button on the main screen which will play Kingdom songs from the *sjjm* series, in random order. This is useful, for example, to play songs before and after meetings at the Kingdom Hall as background music. |
| `Song playback volume` | Sets the volume at which the background music will play. |
| `Automatically stop playing songs` | If `Enable button to play Kingdom songs on shuffle` is active, then this setting will allow you to specify a delay after which background music should be automatically stopped. This can be either a set number of minutes, or a predetermined number of seconds before the start of the meeting (in the case where the background music was started before a meeting). |

### Screenshots of the settings screen

{% include screenshots/configuration.html lang=site.data.en %}
