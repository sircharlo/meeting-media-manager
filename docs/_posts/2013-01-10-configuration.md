---
category: Configuration
title: 'Settings'
layout: null
#type: 'Configuration'

---

The Settings screen is divided into 4 sections. Most of the options are self-explanatory, but here are a few additional details.

### Application setup

<table>
    <thead>
        <tr>
            <th>Setting</th>
            <th>Explanation</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>Display language</code></td>
            <td>Sets the language in which JWMMF is displayed. <br><br>Thank you to our many contributors for translating the app in so many languages! If you want to help improve an existing translation or add a new one, please open up a new <a href="https://github.com/sircharlo/jw-meeting-media-fetcher/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+JWMMF+into+a+language+I+speak,+LANGUAGE" target="_blank">discussion</a>.</td>
        </tr>
        <tr>
            <td><code>Folder in which to save media</code></td>
            <td>Meeting media will be saved to this folder for later sharing and use.</td>
        </tr>
        <tr>
            <td><code>Run app at system start-up</code></td>
            <td>If enabled, JWMMF will launch when the current user logs into the computer. <br><br><blockquote><strong>Note:</strong> Unavailable on Linux.</blockquote></td>
        </tr>
        <tr>
            <td><code>Initiate media sync on app launch</code></td>
            <td>If enabled, this option will automatically initiate a media sync 5 seconds after JWMMF is launched. <br><br><blockquote>To prevent the automatic sync from occurring when this setting is enabled, press the ⏸ (pause) button before the 5-second timer is up.</blockquote></td>
        </tr>
        <tr>
            <td><code>Open folder after media sync</code></td>
            <td>When enabled, the folder containing the downloaded media for the chosen week will open in the computer's file manager after the media sync is complete.</td>
        </tr>
        <tr>
            <td><code>Quit app after media sync</code></td>
            <td>If enabled, this option will automatically quit JWMMF 5 seconds after the media sync is complete. <br><br><blockquote>To prevent JWMMF from quitting automatically when this setting is enabled, press the 🏃 (person leaving/running) button before the 5-second timer is up.</blockquote></td>
        </tr>
    </tbody>
</table>


### Congregation sync setup

See the [congregation sync](#/congregation-sync) section for details on what this does exactly and how to configure this section.


### Media setup

<table>
    <thead>
        <tr>
            <th>Setting</th>
            <th>Explanation</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>Media language</code></td>
            <td>Select the language of your congregation. All media will be downloaded from JW.org in this language.</td>
        </tr>
        <tr>
            <td><code>Maximum resolution for videos</code></td>
            <td>Videos downloaded from JW.org will be downloaded at this resolution, or the next available lower resolution. Useful for limited or low-bandwidth situations.</td>
        </tr>
        <tr>
            <td><code>Exclude all media from the th brochure</code></td>
            <td>If enabled, this will prevent media from the <em>Apply Yourself</em> brochure from being included at every midweek meeting.</td>
        </tr>
        <tr>
            <td><code>Exclude images from the lffi brochure</code></td>
            <td>If enabled, this will prevent images from the <em>Live Forever</em> brochure (<em>lffi</em>) from being included, for example for student assignments during the midweek meeting. Audio and video files from the <em>lffi</em> brochure are not affected by this setting.</td>
        </tr>
        <tr>
            <td><code>Exclude audio and video files from the lffi brochure</code></td>
            <td>If enabled, this will prevent audio and video files from the <em>Live Forever</em> brochure (<em>lffi</em>) from being included, for example for student assignments during the midweek meeting. Images from the <em>lffi</em> brochure are not affected by this setting.</td>
        </tr>
        <tr>
            <td><code>Offer to import additional media</code></td>
            <td>If enabled, you'll be presented with the <em>Additional media</em> screen when performing a media sync. That screen allows you to add additional media files into a given week's media. See [Managing media](#/manage-media). <br><br><strong>Note:</strong> This option will only be shown is [congregation sync](#/congregation-sync) is not enabled.</td>
        </tr>
        <tr>
            <td><code>Convert media to MP4 format</code></td>
            <td>This automatically converts all picture and audio files into MP4 format, for use with Zoom's <a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/zoom-mp4-share.png?raw=true" target="_blank">native MP4 sharing feature</a>. This includes all pictures and media files downloaded from JW.org, as well as additional media files added by the user or the VO. <br><br><blockquote>When using the option to share your desktop or an application in Zoom, the video resolution is dependent upon CPU usage, screen resolution, graphics card, and OS graphic system capabilities. Depending on how the video is shared, the overall quality of both the video share and the meeting for the user who is sharing may be affected. <br><br> However, when using the MP4 video share option, Zoom encodes the video from the file directly and shares it, effectively bypassing some of the limiting factors with standard content sharing. Allowing the Zoom client to handle the encoding and sharing minimizes CPU usage for the participant who is sharing, which allows for higher frame rates and smoother video playback for all participants. (Source: <a href="https://support.zoom.us/hc/en-us/articles/360051673592-Sharing-and-playing-a-video" target="_blank">Zoom support article</a>.)</blockquote></td>
        </tr>
        <tr>
            <td><code>Keep original media files after conversion</code></td>
            <td>If this setting is enabled, picture and audio files will be kept in the media folder after converting them to MP4 format, rather than being deleted. This will result in a slightly more cluttered media folder, and generally does not need to be enabled if sharing media through Zoom MP4 sharing. (See <code>Convert media to MP4 format</code> above.) <br><br><strong>Note:</strong> Only visible if <code>Convert media to MP4 format</code> is also enabled.</td>
        </tr>
    </tbody>
</table>



### Meeting setup

| Setting  | Explanation |
| ------------- | ------------- |
| `Midweek meeting` | Indicate the usual day and time for the midweek meeting; used for folder naming and smart music fade-out (see below). |
| `Weekend meeting` | Indicate the usual day and time for the weekend meeting. |
| `Enable button to play Kingdom songs on shuffle`  | Shows a button on the main screen which, once clicked, will play Kingdom songs from the *sjjm* series, in random order. This is useful, for example, to play songs before and after meetings at the Kingdom Hall as background music. |
| `Song playback volume` | Sets the volume at which the background music will play. |
| `Automatically stop playing songs`  | If `Enable button to play Kingdom songs on shuffle` is active, then this setting will allow you to specify a delay after which background music should be automatically stopped. <br><br>This can be either: <li>a set number of minutes, **or** </li><li>a predetermined number of seconds before the start of the meeting (in the case where the background music was started before a meeting).</li> |
