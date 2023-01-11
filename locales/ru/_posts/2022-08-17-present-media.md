---
tag: Использование
title: Media Presentation mode
ref: present-media
---

### Использование режима презентации медиа

The media presentation and controller modes are designed for simplicity and to prevent mistakes during meetings.

Once the option `Present media on an external monitor or in a separate window` is enabled, the media presentation screen will automatically appear on the external monitor if present, or in a separate, draggable and resizable window if no external monitor was detected.

When in standby, the media presentation screen will display the background image that is configured in the settings. If no background image has been configured, then M³ will attempt to automatically fetch and display the yeartext.

If no background image is configured in the settings and the yeartext could not be loaded automatically, a black background will be displayed when on standby.

Media controller mode can be accessed by clicking the ▶️ (play) button on the main screen of M³, or by using the keyboard shortcut <kbd>Alt D</kbd> (for external display).

Once you have entered controller mode, the folder selection screen will allow you to select the date for which you'd like to display media. If the current day's folder exists, it will automatically be preselected. Once a date is selected, you can still change the selected date at any time by clicking on the date selection button, in the top section.

### Презентация мультимедиа

To play media, press the ▶️ (play) button for the file you'd like. To hide the media, press the ⏹️ (stop) button. A video can be rewound or fast-forwarded while paused, if desired. Please note that for videos, the stop button must be pressed **twice** to prevent accidentally and prematurely stopping a video while it is playing for the congregation. Videos will auto-stop when they have played in their entirety.

### Проведение гибридных встреч, используя M³, OBS Studio, и Zoom

By far the simplest way to share media during hybrid meetings is by configuring OBS Studio, M³ and Zoom to work together.

#### Начальная конфигурация: Компьютер Зала Царства

Установите разрешение экрана внешнего монитора на 1280x720.

Configure the computer sound card's output to go to one of the sound booth mixer's inputs, and the sound booth mixer's combined output to go to the computer's sound card input.

#### Начальная конфигурация: OBS Studio

Install OBS Studio, or download the portable version.

If using the portable version of OBS Studio, install the [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) plugin, and if using the portable version of OBS Studio, add the virtual camera to Windows by double-clicking the provided installation script.

If you have OBS Studio v27 or older, you need to install the [obs-websocket](https://github.com/obsproject/obs-websocket) plugin. Otherwise obs-websocket is included. Configure a port number and password for obs-websocket.

In the OBS settings, under `General` > `System Tray`, enable all checkboxes. Under `Output` > `Streaming`, enable a hardware encoder if available. Under `Video` > `Base (Canvas) Resolution` and `Output (Scaled) Resolution`, choose `1280x720`, and under `Downscale Filter`, choose `Bilinear`.

Set up at least 2 scenes: one for the media display (`Window Capture` or `Display Capture` with the mouse cursor disabled and the appropriate window title/monitor selected), and one for the stage view (`Video Capture Device` with the KH camera selected). You may add as many scenes as required, with the camera adjusted, zoomed-in and cropped as needed (lectern view, conductor and reader view, table view, etc.).

Add a shortcut to OBS Studio, with the `--startvirtualcam` parameter, to the Startup folder of the Windows user profile, to ensure that OBS Studio gets started automatically when the user logs in.

#### Начальная конфигурация: Zoom Зала Царства

Zoom should be configured to use dual monitors. Enable global keyboard shortcuts for Zoom to mute/unmute the Kingdom Hall audio in Zoom (<kbd>Alt A</kbd>), and start/stop the Kingdom Hall video feed in Zoom (<kbd>Alt V</kbd>).

Set the default "microphone" to be sound booth mixer's combined output (so that everything that is heard over the Kingdom Hall sound system is transmitted over Zoom, including microphones and media) and the "camera" to be the virtual camera provided by OBS Studio.

#### Начальная конфигурация: M³

Enable the `Present media on an external monitor or in a separate window` option.

Enable and configure OBS Studio compatibility mode, using the port and password information configured in the OBS Studio configuration step.

#### Начало встречи

Start the Zoom meeting, and move the secondary Zoom meeting window to the external monitor. Make it fullscreen if desired. This is where any remote meeting participants will be displayed for the congregation to see.

Once the Zoom meeting is being displayed on the external monitor, open M³. The media presentation window will automatically open on top of Zoom on the external monitor. Sync media if necessary, and enter media controller mode by clicking the ▶️ (play) button on the main screen of M³, or <kbd>Alt D</kbd>.

Enable the Kingdom Hall video feed (<kbd>Alt V</kbd>), and spotlight the Kingdom Hall video feed if necessary so that Zoom participants see the Kingdom Hall stage. Unmute the Kingdom Hall audio feed in Zoom (<kbd>Alt A</kbd>). It should not be necessary to disable the video or audio feed in Zoom for the duration of the meeting.

Start background music playback using the button on the bottom left, or <kbd>Alt K</kbd>.

#### Трансляция частей со сцены Зала Царства на Zoom

Никаких действий не требуется.

Various camera angles/zoom can be chosen during the meeting by using the menu on the bottom of the M³ media playback control window; this menu will contain a list of all configured camera view scenes in OBS.

#### Презентация мультимедиа в Зале Царства и через Zoom

Find the media you want to share in the M³ media playback control window, and press the "play" button.

When you're done sharing media, press the "stop" button in M³. Note that videos automatically stop upon completion.

#### Отображение удаленных участников Zoom на мониторе Зала Царства

Press the "hide/show media presentation window" button in the lower right corner of the M³ media controller screen, or <kbd>Alt Z</kbd>, to **hide** the media presentation window. The Zoom meeting will now be visible on the Kingdom Hall monitor.

> Если удаленному участнику нужно показать медиа, следуйте шагам в подразделе **Презентация мультимедиа в Зале Царства и через Zoom**.

Once the participant has finished their part, press the "hide/show media presentation window" button in the lower right corner of the M³ media playback control window, or <kbd>Alt Z</kbd>, to **show** the media presentation window. The Kingdom Hall monitor will now show the yeartext.

### Conducting hybrid meetings using only M³ and Zoom

If you do not wish to use OBS Studio for any reason, the following suggestions will perhaps help you to set things up as simply as possible.

#### Initial configuration without OBS: Kingdom Hall computer

Same as corresponding section above. With the addition of the global keyboard shortcut for Zoom for starting/stopping screen sharing (<kbd>Alt S</kbd>). The "camera" will be the camera feed from the Kingdom Hall camera.

#### Initial configuration without OBS: M³

Enable `the Present media on an external monitor or in a separate window` option.

#### Starting the meeting without OBS

То же, что и в соответствующем разделе выше.

#### Broadcasting in-person parts from the Kingdom Hall stage over Zoom without OBS

Same as corresponding section above.

#### Sharing media at the Kingdom Hall and over Zoom without OBS

Start sharing in Zoom by hitting <kbd>Alt S</kbd>. In the Zoom sharing window that pops up, choose the external monitor and enable both checkboxes on the bottom left (for sound and video optimization). The yeartext will now be shared over Zoom.

Find the media you want to share in the M³ media playback control window, and press the "play" button.

When you're done sharing media, hit <kbd>Alt S</kbd> to end Zoom screen sharing.

#### Displaying remote Zoom participants on the Kingdom Hall monitor without OBS

Same as corresponding section above.

### Screenshots of Presentation Mode

{% include screenshots/present-media.html lang=site.data.ru %}
