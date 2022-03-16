---
category: Usage
title: 'Presenting media'
layout: null
---

The media presentation mode is designed for simplicity and to prevent mistakes during meetings.

### Entering media presentation mode

Media presentation mode can be accessed by clicking the ▶️ (play) button on the main screen of JWMMF.

Once you have entered presentation mode, the media presentation screen will automatically appear on the external monitor if present, or in a separate, draggable and resizable window in the case where no external monitor was detected.

The folder selection screen allows you to select the date for which you'd like to display media. If the current day's folder exists, it will automatically be preselected. Once a date is selected, you may still change the selected date at any time by clicking on the date selection button, in the top left.

### Presenting media

When in standby, the media presentation screen will display the background image that is configured in the settings. If no background image has been configured, then JWMMF will attempt to automatically display the yeartext on Windows computers.

<blockquote>For automatic yeartext display to work properly, JW Library needs to have been used at least once to display the yeartext on an external monitor. Note that this feature has only been tested on Windows computers.</blockquote>

If no background image is configured in the settings and the yeartext could not be loaded automatically, a black background will be displayed when on standby.

To play media, press the ▶️ (play) button for the file you'd like. To hide the media, press the ⏹️ (stop) button. A video can be paused and played if necessary. When paused, a video can be rewound or fast-forwarded, if desired. Please note that for videos, the stop button must be pressed **twice** to prevent accidentally and prematurely stopping a video while it is playing for the congregation.

The bottom right has the "power/shutdown" button, which will exit media presentation mode when pressed twice, as well as the "hide/show media presentation screen" button.

### Conducting hybrid meetings using JWMMF and Zoom

Here are a few notes that will no doubt help you to set up hybrid meetings at the Kingdom Hall using Zoom and JWMMF.

#### Initial configuration: Zoom

**Zoom** should be configured to use dual monitors. It's also recommended to enable global keyboard shortcuts for Zoom for starting/stopping screen sharing (<kbd>Alt</kbd> <kbd>S</kbd>), muting/unmuting the KH audio in Zoom (<kbd>Alt</kbd> <kbd>A</kbd>), and starting/stopping the KH video feed in Zoom (<kbd>Alt</kbd> <kbd>V</kbd>).

#### Initial configuration: JWMMF

Not much is required in terms of initial configuration in JWMMF, other than making sure that the media presentation mode button is enabled.

#### Starting the meeting

Start the Zoom meeting, and move the secondary Zoom meeting window to the external monitor. Make it fullscreen if desired. This is where any remote meeting participants will be displayed for the congregation to see.

Once the Zoom meeting is being displayed on the external monitor, open JWMMF. Sync media if necessary, and enter media presentation mode. The media presentation window will automatically open on top of Zoom on the external monitor.

Start background music playback using the button on the bottom left.

#### Broadcasting in-person parts from the Kingdom Hall stage over Zoom

Enable the KH video feed (<kbd>Alt</kbd> <kbd>V</kbd>), and spotlight the KH video feed if necessary so that Zoom participants see the KH stage. Unmute the KH audio feed in Zoom (<kbd>Alt</kbd> <kbd>A</kbd>).

#### Sharing media at the Kingdom Hall and over Zoom

Start sharing in Zoom by hitting <kbd>Alt</kbd> <kbd>S</kbd>. In the Zoom sharing window that pops up, choose the external monitor and enable both checkboxes on the bottom left (for sound and video optimization). The yeartext will now be shared over Zoom.

Find the media you want to share in the JWMMF media playback control window, and press the "play" button. The media will now be visible to those at the Kingdom Hall, and shared over Zoom.

When you're done sharing media, hit <kbd>Alt</kbd> <kbd>S</kbd> to end Zoom screen sharing. The KH monitor will now show the yeartext.

#### Displaying remote Zoom participants on the KH monitor

Press the "hide/show media presentation screen" button in the lower right corner of the JWMMF media playback control window to **hide** the media presentation window. The Zoom meeting will now be visible on the KH monitor.

<blockquote>If the participant has media to show, follow the steps under the *Sharing media at the Kingdom Hall and over Zoom* subheading.</blockquote>

Once the participant has finished their part, press the "hide/show media presentation screen" button in the lower right corner of the JWMMF media playback control window to **show** the media presentation window. The KH monitor will now show the yeartext.

### Screenshots

<table class="showcase">
<tr>
<td><a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/launch-presentation-mode.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/launch-presentation-mode.png?raw=true"></a></td>
<td>Button to enter media presentation mode</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/meeting-picker.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/meeting-picker.png?raw=true"></a></td>
<td>Selecting a meeting for which to display media</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/default-background.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/default-background.png?raw=true"></a></td>
<td>Default media background, with automatically generated yeartext</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/media-list.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/media-list.png?raw=true"></a></td>
<td>List of media that is ready to be presented</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/standby-mode.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/standby-mode.png?raw=true"></a></td>
<td>JWMMF media presentation in standby mode</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/play-picture.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/play-picture.png?raw=true"></a></td>
<td>Displaying a picture</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/video-playing.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/video-playing.png?raw=true"></a></td>
<td>Playing a video</td>
</tr>
<tr>
<td><a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/video-scrub.png?raw=true" target="_blank"><img src="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/video-scrub.png?raw=true"></a></td>
<td>Moving to a specific time in a video</td>
</tr>
</table>
