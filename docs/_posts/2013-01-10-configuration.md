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
      <td>If enabled, JWMMF will launch when the current user logs into the computer. <br><br>
        <blockquote><strong>Note:</strong> Unavailable on Linux.</blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Initiate media sync on app launch</code></td>
      <td>If enabled, this option will automatically initiate a media sync 5 seconds after JWMMF is launched. <br><br>
        <blockquote>To prevent the automatic sync from occurring when this setting is enabled, press the ⏸ (pause) button before the 5-second timer is up.</blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Open folder after media sync</code></td>
      <td>When enabled, the folder containing the downloaded media for the chosen week will open in the computer's file manager after the media sync is complete.</td>
    </tr>
    <tr>
      <td><code>Quit app after media sync</code></td>
      <td>If enabled, this option will automatically quit JWMMF 5 seconds after the media sync is complete. <br><br>
        <blockquote>To prevent JWMMF from quitting automatically when this setting is enabled, press the 🏃 (person leaving/running) button before the 5-second timer is up.</blockquote>
      </td>
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
      <td>If enabled, you'll be presented with the <em>Additional media</em> screen when performing a media sync. That screen allows you to add additional media files into a given week's media. See <a href="#/manage-media">Managing media</a>. <br><br>
        <blockquote><strong>Note:</strong> This option will only be shown is <a href="#/congregation-sync">congregation sync</a> is not enabled.</blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Convert media to MP4 format</code></td>
      <td>This automatically converts all picture and audio files into MP4 format, for use with Zoom's <a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/zoom-mp4-share.png?raw=true" target="_blank">native MP4 sharing feature</a>. This includes all pictures and media files downloaded from JW.org, as well as additional media files added by the user or the VO.
      <br><br><blockquote><strong>Note:</strong> This option is best suited for <strong>remote-only</strong> congregation Zoom meetings. If conducting either <strong>hybrid</strong> or <strong>regular</strong> congregation meetings, look into using <a href="#/present-media">media presentation mode</a> by activating the <code>Enable button to present media on an external monitor or in a separate window</code> option instead, and disable this option.</blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Keep original media files after conversion</code></td>
      <td>If this setting is enabled, picture and audio files will be kept in the media folder after converting them to MP4 format, rather than being deleted. This will result in a slightly more cluttered media folder, and generally does not need to be enabled if sharing media through Zoom MP4 sharing. (See <code>Convert media to MP4 format</code> above.)
        <br><br>
        <blockquote><strong>Note:</strong> Only visible if <code>Convert media to MP4 format</code> is also enabled.</blockquote>
      </td>
    </tr>
  </tbody>
</table>



### Meeting setup

<table>
  <thead>
    <tr>
      <th>Setting</th>
      <th>Explanation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>Midweek meeting</code></td>
      <td>Indicate the usual day and time for the midweek meeting; used for folder naming and smart music fade-out (see below).</td>
    </tr>
    <tr>
      <td><code>Weekend meeting</code></td>
      <td>Indicate the usual day and time for the weekend meeting.</td>
    </tr>
    <tr>
      <td><code>Enable button to play Kingdom songs on shuffle</code> </td>
      <td>Shows a button on the main screen which, once clicked, will play Kingdom songs from the <em>sjjm</em> series, in random order. This is useful, for example, to play songs before and after meetings at the Kingdom Hall as background music.</td>
    </tr>
    <tr>
      <td><code>Song playback volume</code></td>
      <td>Sets the volume at which the background music will play.</td>
    </tr>
    <tr>
      <td><code>Automatically stop playing songs</code></td>
      <td>If <code>Enable button to play Kingdom songs on shuffle</code> is active, then this setting will allow you to specify a delay after which background music should be automatically stopped. <br><br>This can be either:
      <ul><li>a set number of minutes, <strong>or</strong></li>
        <li>a predetermined number of seconds before the start of the meeting (in the case where the background music was started before a meeting).</li></ul>
      </td>
    </tr>
    <tr>
      <td><code>Enable button to present media on an external monitor or in a separate window</code></td>
      <td>This setting will allow you to use JWMMF to present pictures, videos and audio files during congregation meetings, for example at the Kingdom Hall. <a href="#/present-media">Media presentation mode</a> can be accessed by clicking the ▶️ (play) button on the main screen of JWMMF.<br><br>The media presentation screen will automatically use an external monitor if present; if not, the media will be displayed in a separate, resizable window.
      <br><br><blockquote><strong>Note:</strong> This option is best suited for either <strong>hybrid</strong> or <strong>regular</strong> congregation meetings.<br><br>
      If conducting <strong>remote-only</strong> congregation Zoom meetings, look into activating the <code>Convert media to MP4 format</code> option and sharing the media with Zoom's native MP4 sharing instead.</blockquote></td>
    </tr>
    <tr>
      <td><code>Background image for media presentation mode</code></td>
      <td>This setting allows you to configure a background image, such as the yeartext, to be automatically displayed in the JWMMF media presentation window when no other media is being played.
      <br><br>
      <blockquote><strong>Note:</strong> If <a href="#/congregation-sync">congregation sync</a> is enabled, then the selected background image will be synced for all congregation sync users automatically.</blockquote></td>
    </tr>
  </tbody>
</table>

### Screenshots

<table class="showcase">
<tr>
<td><a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/settings-1.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/settings-1.png?raw=true"></a></td>
<td>Application configuration</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/settings-3.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/settings-3.png?raw=true"></a></td>
<td>Media fetching and sync setup</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/settings-4.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/settings-4.png?raw=true"></a></td>
<td>Meeting date and time setup</td>
</tr>
</table>
