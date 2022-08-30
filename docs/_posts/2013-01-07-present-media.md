---
category: Usage
title: 'Presenting media'
layout: null
---

### Using media presentation mode

The media presentation and controller modes are designed for simplicity and to prevent mistakes during meetings.

Once the option to "Present media on an external monitor or in a separate window" is enabled, the media presentation screen will automatically appear on the external monitor if present, or in a separate, draggable and resizable window if no external monitor was detected.

When in standby, the media presentation screen will display the background image that is configured in the settings. If no background image has been configured, then M³ will attempt to automatically fetch and display the yeartext.

If no background image is configured in the settings and the yeartext could not be loaded automatically, a black background will be displayed when on standby.

Media controller mode can be accessed by clicking the ▶️ (play) button on the main screen of M³, or by using the keyboard shortcut <kbd>Alt</kbd> <kbd>D</kbd> (for external **d**isplay).

Once you have entered controller mode, the folder selection screen will allow you to select the date for which you'd like to display media. If the current day's folder exists, it will automatically be preselected. Once a date is selected, you can still change the selected date at any time by clicking on the date selection button, in the top section.

### Presenting media

To play media, press the ▶️ (play) button for the file you'd like. To hide the media, press the ⏹️ (stop) button. A video can be rewound or fast-forwarded while paused, if desired. Please note that for videos, the stop button must be pressed **twice** to prevent accidentally and prematurely stopping a video while it is playing for the congregation. Videos will auto-stop when they have played in their entirety.

The bottom right has the "home" button, which will exit media controller mode, as well as the "hide/show media presentation window" button.

### Conducting hybrid meetings using a combination of M³, OBS Studio, and Zoom

By far the simplest way to share media during hybrid meetings is by configuring OBS Studio, M³ and Zoom to work together.

#### Initial configuration: Kingdom Hall computer

Set the external monitor's screen resolution to 1280x720, or something close to that.

Configure the computer sound card's output to go to one of the sound booth mixer's inputs, and the sound booth mixer's combined output to go to the computer's sound card input.

#### Initial configuration: OBS Studio

Install OBS Studio, or download the portable version.

If using the portable version of OBS Studio, install the [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) plugin, add the virtual camera to Windows by double-clicking the provided installation script.

Install the [obs-websocket](https://github.com/obsproject/obs-websocket) plugin. For the moment, <code>v5</code> is not supported in M³, so make sure that you install the latest version of <code>v4</code> (currently <code>4.9.1-compat</code>) to avoid any issues. Configure a port number and password for obs-websocket.

In the OBS settings, under `General` > `System Tray`, enable all checkboxes. Under `Output` > `Streaming`, enable a hardware encoder if available. Under `Video` > `Base (Canvas) Resolution` and `Output (Scaled) Resolution`, choose `1280x720`, and under `Downscale Filter`, choose `Bilinear`.

Set up at least 2 scenes: one for the media display (`Window Capture` or `Display Capture` with the mouse cursor disabled and the appropriate window title/monitor selected), and one for the stage view (`Video Capture Device` with the KH camera selected). You may add as many scenes as required, with the camera adjusted, zoomed-in and cropped as needed (lectern view, conductor and reader view, table view, etc.).

Add a shortcut to OBS Studio, with the `--startvirtualcam` parameter, to the Startup folder of the Windows user profile, to ensure that OBS Studio gets started automatically when the user logs in.

#### Initial configuration: Kingdom Hall Zoom

Zoom should be configured to use dual monitors. Enable global keyboard shortcuts for Zoom for muting/unmuting the Kingdom Hall **a**udio in Zoom (<kbd>Alt</kbd> <kbd>A</kbd>), and starting/stopping the Kingdom Hall **v**ideo feed in Zoom (<kbd>Alt</kbd> <kbd>V</kbd>).

Set the default "microphone" to be sound booth mixer's combined output (so that everything that is heard over the Kingdom Hall sound system is transmitted over Zoom, including microphones and media) and the "camera" to be the virtual camera provided by OBS Studio.

#### Initial configuration: M³

Enable the "Present media on an external monitor or in a separate window" option.

Enable and configure OBS Studio compatibility mode, using the port and password information configured in the OBS Studio configuration step. Configure which scene is set up as the media window scene in OBS, and which scene should be the default view that will be activated when media presentation mode starts.

#### Starting the meeting

Start the Zoom meeting, and move the secondary Zoom meeting window to the external monitor. Make it fullscreen if desired. This is where any remote meeting participants will be displayed for the congregation to see.

Once the Zoom meeting is being displayed on the external monitor, open M³. The media presentation window will automatically open on top of Zoom on the external monitor. Sync media if necessary, and enter media controller mode by clicking the ▶️ (play) button on the main screen of M³, or <kbd>Alt</kbd> <kbd>D</kbd>.

Enable the Kingdom Hall video feed (<kbd>Alt</kbd> <kbd>V</kbd>), and spotlight the Kingdom Hall video feed if necessary so that Zoom participants see the Kingdom Hall stage. Unmute the Kingdom Hall audio feed in Zoom (<kbd>Alt</kbd> <kbd>A</kbd>). It should not be necessary to disable the video or audio feed in Zoom for the duration of the meeting.

Start background music playback using the button on the bottom left, or <kbd>Alt</kbd> <kbd>K</kbd>.

#### Broadcasting in-person parts from the Kingdom Hall stage over Zoom

No action necessary.

Various camera angles/zoom can be chosen during the meeting by using the menu on the bottom of the M³ media playback control window; this menu will contain a list of all configured camera view scenes in OBS.

#### Sharing media at the Kingdom Hall and over Zoom

Find the media you want to share in the M³ media playback control window, and press the "play" button.

When you're done sharing media, press the "stop" button in M³. Note that videos automatically stop upon completion.

#### Displaying remote Zoom participants on the Kingdom Hall monitor

Press the "hide/show media presentation window" button in the lower right corner of the M³ media controller screen, or <kbd>Alt</kbd> <kbd>Z</kbd>, to **hide** the media presentation window. The Zoom meeting will now be visible on the Kingdom Hall monitor.

<blockquote>If the participant has media to show, follow the steps under the <strong>Sharing media at the Kingdom Hall and over Zoom</strong> subheading.</blockquote>

Once the participant has finished their part, press the "hide/show media presentation window" button in the lower right corner of the M³ media playback control window, or <kbd>Alt</kbd> <kbd>Z</kbd>, to **show** the media presentation window. The Kingdom Hall monitor will now show the yeartext.


### Conducting hybrid meetings using only M³ and Zoom

If you do not wish to use OBS Studio for any reason, the following suggestions will perhaps help you to set things up as simply as possible.

#### Initial configuration: Kingdom Hall Zoom

Same as corresponding section above, with the addition of the global keyboard shortcut for Zoom for starting/stopping screen **s**haring (<kbd>Alt</kbd> <kbd>S</kbd>). The "camera" will be the camera feed from the Kingdom Hall camera.

#### Initial configuration: M³

Enable the "Present media on an external monitor or in a separate window" option.

#### Starting the meeting

Same as corresponding section above.

#### Broadcasting in-person parts from the Kingdom Hall stage over Zoom

Same as corresponding section above.

#### Sharing media at the Kingdom Hall and over Zoom

Start sharing in Zoom by hitting <kbd>Alt</kbd> <kbd>S</kbd>. In the Zoom sharing window that pops up, choose the external monitor and enable both checkboxes on the bottom left (for sound and video optimization). The yeartext will now be shared over Zoom.

Find the media you want to share in the M³ media playback control window, and press the "play" button. The media will now be visible to those at the Kingdom Hall, and shared over Zoom.

When you're done sharing media, hit <kbd>Alt</kbd> <kbd>S</kbd> to end Zoom screen sharing. The Kingdom Hall monitor will now show the yeartext.

#### Displaying remote Zoom participants on the Kingdom Hall monitor

Same as corresponding section above.

### Screenshots

<table class="showcase">
<tr>
<td><a href="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/launch-presentation-mode.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/launch-presentation-mode.png?raw=true"></a></td>
<td>Button to enter media controller mode</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/meeting-picker.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/meeting-picker.png?raw=true"></a></td>
<td>Selecting a meeting for which to display media</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/default-background.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/default-background.png?raw=true"></a></td>
<td>Default media background, with automatically generated yeartext</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/media-list.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/media-list.png?raw=true"></a></td>
<td>List of media that is ready to be presented</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/standby-mode.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/standby-mode.png?raw=true"></a></td>
<td>M³ media presentation in standby mode</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/play-picture.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/play-picture.png?raw=true"></a></td>
<td>Displaying a picture</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/video-playing.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/video-playing.png?raw=true"></a></td>
<td>Playing a video</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/video-scrub.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/meeting-media-manager/blob/master/docs/screenshots/video-scrub.png?raw=true"></a></td>
<td>Moving to a specific time in a video</td>
</tr>
</table>
