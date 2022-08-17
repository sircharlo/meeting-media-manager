---
tag: Configuration
title: 'Settings'
ref: configuration
---

The Settings screen is divided into 4 sections. Most of the options are self-explanatory, but here are a few additional details.

### Application setup

<table>
<tbody>
    <tr>
      <td><code>Display language</code></td>
      <td>
        Sets the language in which M³ is displayed.<br>
        <br>
        Thank you to our many contributors for translating the app in so many languages! If you want to help improve an existing translation or add a new one, please open up a new <a href="https://github.com/sircharlo/meeting-media-manager/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M³+into+a+language+I+speak,+LANGUAGE">discussion</a>.
      </td>
    </tr>
    <tr>
      <td><code>Folder in which to save media</code></td>
      <td>Meeting media will be saved to this folder for later sharing and use.</td>
    </tr>
    <tr>
      <td><code>Run app at system start-up</code></td>
      <td>If enabled, M³ will launch when the current user logs into the computer.<br>
      <br>
      <blockquote><strong>Note:</strong> Unavailable on Linux.</blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Automatically initiate media sync</code></td>
      <td>
        If enabled, this option will automatically initiate a media sync 5 seconds after M³ is launched.<br>
        <br>
        <blockquote>
          To prevent the automatic sync from occurring when this setting is enabled, press the ⏸ (pause) button before the 5-second timer is up.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Open folder after media sync</code></td>
      <td>
        When enabled, the folder containing the downloaded media for the chosen week will open in the computer's file manager after the media sync is complete.
      </td>
    </tr>
    <tr>
      <td><code>Quit app after media sync</code></td>
      <td>
        If enabled, this option will automatically quit M³ 5 seconds after the media sync is complete.<br>
        <br>
        <blockquote>
          To prevent M³ from quitting automatically when this setting is enabled, press the 🏃 (person leaving/running) button before the 5-second timer is up.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Enable<em>OBS Studio</em> compatibility mode</code></td>
      <td>
        If enabled, this option will tap into OBS Studio to change scenes automatically as needed both before and after sharing media.<br>
        <br>
        <blockquote>
          If enabling this setting, make sure that OBS Studio is configured to use the <code>obs-websockets</code> plugin, which is what will enable M³ to communicate with OBS Studio.<br>
          <br>
          Also, configure all needed scenes for media sharing and stage display in OBS. At the very least, you'll need a scene with a <code>Window Capture</code> (recommended) or <code>Display Capture</code> configured to capture the M³ media presentation window, or the screen on which the media will be presented.<br>
          <br>
          You'll also need to configure all desired stage view scenes, for example:
          <ul>
            <li>a shot of the lectern</li>
            <li>a wide shot of the stage</li>
            <li>the lectern and reader mics together</li>
            <li>a shot of the table</li>
          </ul>
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Port</code></td>
      <td>Port on which the <code>obs-websockets</code> plugin is configured to listen.
      </td>
    </tr>
    <tr>
      <td><code>Password</code></td>
      <td>Password configured in the <code>obs-websockets</code> plugin's settings.
      </td>
    </tr>
    <tr>
      <td><code>Default stage view scene in OBS Studio</code></td>
      <td>
        Select which scene should be selected by default when media presentation mode is launched. Usually a stage wide view, or a shot of the lectern.
      </td>
    </tr>
    <tr>
      <td><code>Media window scene in OBS Studio</code></td>
      <td>Select which scene is configured in OBS Studio to capture the M³ media window.</td>
    </tr>
    <tr>
      <td><code>Disable hardware acceleration</code></td>
      <td>
        Only enable this setting if you are experiencing issues with media presentation mode. Changing this setting will cause M³ to restart.
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
      <td>Select the language of your congregation or group. All media will be downloaded from JW.org in this language.</td>
    </tr>
    <tr>
      <td><code>Maximum resolution for videos</code></td>
      <td>
        Videos downloaded from JW.org will be downloaded at this resolution, or the next available lower resolution. Useful for limited or low-bandwidth situations.
      </td>
    </tr>
    <tr>
      <td><code>Convert media to MP4 format</code></td>
      <td>
        This will automatically convert all picture and audio files into MP4 format, for use with Zoom's <a href="assets/img/other/zoom-mp4-share.png">native MP4 sharing feature</a> during <strong>fully remote</strong> congregation Zoom meetings. This includes all pictures and media files downloaded from JW.org, as well as additional media files added by the user or the VO.<br>
        <br>
        <blockquote>
          <strong>Note:</strong> This option is best suited for <strong>remote-only</strong> congregation Zoom meetings. If conducting either <strong>hybrid</strong> or <strong>regular</strong> congregation meetings, look into using <a href="en/#/present-media">media presentation mode</a> by activating the <code>Enable button to present media on an external monitor or in a separate window</code> option instead, and disable this option.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Keep original media files after conversion</code></td>
      <td>
        If this setting is enabled, picture and audio files will be kept in the media folder after converting them to MP4 format, rather than being deleted. This will result in a slightly more cluttered media folder, and generally does not need to be enabled if sharing media through Zoom MP4 sharing. (See <code>Convert media to MP4 format</code> above.)<br>
        <br>
        <blockquote><strong>Note:</strong> Only visible if <code>Convert media to MP4 format</code> is also enabled.</blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Enable button to present media on an external monitor or in a separate window</code></td>
      <td>
        This setting will allow you to use M³ to present pictures, videos and audio files during <strong>hybrid</strong> or <strong>in-person</strong> congregation meetings. <a href="en/#/present-media">Media presentation mode</a> can then be accessed by clicking the ▶️ (play) button on the main screen of M³.<br>
        <br>
        The media presentation screen will automatically use an external monitor if present; if not, the media will be displayed in a separate, resizable window.<br>
        <br>
        <blockquote>
          <strong>Note:</strong> This option is best suited for either <strong>hybrid</strong> or <strong>regular</strong> congregation meetings.<br>
          <br>
          If conducting <strong>remote-only</strong> congregation Zoom meetings, look into activating the <code>Convert media to MP4 format</code> option and sharing the media with Zoom's native MP4 sharing instead.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Background image for media presentation mode</code></td>
      <td>
        By default, M³ will attempt to fetch the current year's text in the language selected previously, in order to display it on a black background when in <a href="en/#/present-media">media presentation mode</a> and no other media is being played. If the automatic yeartext retrieval fails for some reason, or if you wish to display a different background image, you can either use the "Browse" button to select a custom picture, or the "Refresh" button to try fetching the yeartext automatically again.<br>
        <br>
        <blockquote>
          <strong>Note:</strong> If <a href="en/#/congregation-sync">congregation sync</a> is enabled, selecting a custom background image will synchronize it for all congregation sync users automatically.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Create playlists for use with<em>VLC</em></code></td>
      <td>
        Enable this if you want to generate playlists for every meeting automatically, which can then be loaded in VLC, if you are using that app to display media instead of <a href="en/#/present-media">media presentation mode</a>.
      </td>
    </tr>
    <tr>
      <td><code>Exclude all media from the<em>th</em>brochure</code></td>
      <td>If enabled, this will prevent media from the<em>Apply Yourself</em>brochure from being included at every midweek meeting.</td>
    </tr>
    <tr>
      <td><code>Exclude audio and video files from the<em>lffi</em>brochure</code></td>
      <td>
        If enabled, this will prevent audio and video files from the<em>Live Forever</em>brochure (<em>lffi</em>) from being included, for example for student assignments during the midweek meeting. Images from the<em>lffi</em>brochure are not affected by this setting.
      </td>
    </tr>
    <tr>
      <td><code>Exclude images from the<em>lffi</em>brochure</code></td>
      <td>
        If enabled, this will prevent images from the<em>Live Forever</em>brochure (<em>lffi</em>) from being included, for example for student assignments during the midweek meeting. Audio and video files from the<em>lffi</em> brochure are not affected by this setting.
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
      <td>Indicate the usual day and time for the midweek meeting; used for folder naming and automatic background music fade-out (see below).</td>
    </tr>
    <tr>
      <td><code>Weekend meeting</code></td>
      <td>Indicate the usual day and time for the weekend meeting.</td>
    </tr>
    <tr>
      <td><code>Enable button to play Kingdom songs on shuffle</code> </td>
      <td>
        Enable a button on the main screen which will play Kingdom songs from the <em>sjjm</em> series, in random order. This is useful, for example, to play songs before and after meetings at the Kingdom Hall as background music.
      </td>
    </tr>
    <tr>
      <td><code>Song playback volume</code></td>
      <td>Sets the volume at which the background music will play.</td>
    </tr>
    <tr>
      <td><code>Automatically stop playing songs</code></td>
      <td>
        If <code>Enable button to play Kingdom songs on shuffle</code> is active, then this setting will allow you to specify a delay after which background music should be automatically stopped.<br>
        <br>
        This can be either:
        <ul>
          <li>a set number of minutes, <strong>or</strong></li>
          <li>
            a predetermined number of seconds before the start of the meeting (in the case where the background music was started before a meeting).
          </li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

### Screenshots of the settings screen

<table class="showcase" markdown="0">
{% include image.html src="settings/app.png" alt="Application configuration" %}
{% include image.html src="settings/media.png" alt="Media fetch and sync setup" %}
{% include image.html src="settings/meeting.png" alt="Meeting date and time setup" %}
</table>
