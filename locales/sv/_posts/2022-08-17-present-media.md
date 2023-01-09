---
tag: Usage
title: Mediapresentationsläge
ref: present-media
---

### Använda mediapresentationsläge

Mediepresentationen och kontrolllägena är designade för enkelhet och för att förhindra misstag under möten.

När alternativet `Visa media på en extern skärm eller i ett separat fönster` är aktiverat, kommer mediapresentationsskärmen automatiskt att visas på den externa monitorn om den finns, eller i ett separat, dragbart och storleksändringsbart fönster om ingen extern monitor upptäcktes.

When in standby, the media presentation screen will display the background image that is configured in the settings. If no background image has been configured, then M³ will attempt to automatically fetch and display the yeartext.

Om ingen bakgrundsbild är konfigurerad i inställningarna och årstexten inte kunde laddas automatiskt, kommer en svart bakgrund att visas i standbyläge.

Mediekontrollläget kan nås genom att klicka på knappen ▶️ (spela upp) på huvudskärmen i M³, eller genom att använda kortkommandot <kbd>Alt D</kbd> (för extern skärm).

Once you have entered controller mode, the folder selection screen will allow you to select the date for which you'd like to display media. If the current day's folder exists, it will automatically be preselected. Once a date is selected, you can still change the selected date at any time by clicking on the date selection button, in the top section.

### Presentera media

To play media, press the ▶️ (play) button for the file you'd like. To hide the media, press the ⏹️ (stop) button. A video can be rewound or fast-forwarded while paused, if desired. Please note that for videos, the stop button must be pressed **twice** to prevent accidentally and prematurely stopping a video while it is playing for the congregation. Videos will auto-stop when they have played in their entirety.

### Genomför hybridmöten med en kombination av M³, OBS Studio och Zoom

Det överlägset enklaste sättet att dela media under hybridmöten är att konfigurera OBS Studio, M³ och Zoom för att fungera tillsammans.

#### Första konfiguration: Rikets sal-dator

Ställ in den externa bildskärmens skärmupplösning till 1280x720, eller något i närheten av det.

Konfigurera datorns ljudkorts utgång så att den går till en av mixerns ingångar och mixerns kombinerade utgång för att gå till datorns ljudkortsingång.

#### Initial konfiguration: OBS Studio

Installera OBS Studio, eller ladda ner den portabla versionen.

Om du använder den portabla versionen av OBS Studio, installera plugin-programmet [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) och om du använder den portabla versionen av OBS Studio, lägg till den virtuella kameran till Windows genom att dubbelklicka på det medföljande installationsskriptet.

If you have OBS Studio v27 or older, you need to install the [obs-websocket](https://github.com/obsproject/obs-websocket) plugin. Otherwise obs-websocket is included. Configure a port number and password for obs-websocket.

In the OBS settings, under `General` > `System Tray`, enable all checkboxes. Under `Output` > `Streaming`, enable a hardware encoder if available. Under `Video` > `Base (Canvas) Resolution` and `Output (Scaled) Resolution`, choose `1280x720`, and under `Downscale Filter`, choose `Bilinear`.

Set up at least 2 scenes: one for the media display (`Window Capture` or `Display Capture` with the mouse cursor disabled and the appropriate window title/monitor selected), and one for the stage view (`Video Capture Device` with the KH camera selected). You may add as many scenes as required, with the camera adjusted, zoomed-in and cropped as needed (lectern view, conductor and reader view, table view, etc.).

Lägg till en genväg till OBS Studio, med parametern `--startvirtualcam`, till Startup-mappen i Windows användarprofil, för att säkerställa att OBS Studio startar automatiskt när användaren loggar in.

#### Initial konfiguration: Kingdom Hall Zoom

Zoom should be configured to use dual monitors. Enable global keyboard shortcuts for Zoom to mute/unmute the Kingdom Hall audio in Zoom (<kbd>Alt A</kbd>), and start/stop the Kingdom Hall video feed in Zoom (<kbd>Alt V</kbd>).

Ställ in standard "mikrofon" för att vara mixerns kombinerade utgång (så att allt som hörs över Rikets sals ljudsystem sänds över Zoom, inklusive mikrofoner och media) och "kameran" att vara den virtuella kameran från OBS Studio .

#### Första konfiguration: M³

Aktivera alternativet `Visa media på en extern skärm eller i ett separat fönster`.

Aktivera och konfigurera OBS Studio-kompatibilitetsläget med hjälp av port- och lösenordsinformationen som konfigurerats i OBS Studio-konfigurationssteget.

#### Startar mötet

Start the Zoom meeting, and move the secondary Zoom meeting window to the external monitor. Make it fullscreen if desired. This is where any remote meeting participants will be displayed for the congregation to see.

Once the Zoom meeting is being displayed on the external monitor, open M³. The media presentation window will automatically open on top of Zoom on the external monitor. Sync media if necessary, and enter media controller mode by clicking the ▶️ (play) button on the main screen of M³, or <kbd>Alt D</kbd>.

Enable the Kingdom Hall video feed (<kbd>Alt V</kbd>), and spotlight the Kingdom Hall video feed if necessary so that Zoom participants see the Kingdom Hall stage. Unmute the Kingdom Hall audio feed in Zoom (<kbd>Alt A</kbd>). It should not be necessary to disable the video or audio feed in Zoom for the duration of the meeting.

Starta uppspelning av bakgrundsmusik med knappen längst ner till vänster, eller <kbd>Alt K</kbd>.

#### Sänder delar från Rikets salens podie över Zoom

Ingen åtgärd krävs.

Olika kameravinklar/zoom kan väljas under mötet genom att använda menyn längst ned i M³ mediauppspelningskontrollfönstret; den här menyn innehåller en lista över alla konfigurerade kameravyscener i OBS.

#### Dela media i Rikets sal och över Zoom

Hitta media du vill dela i M³ medieuppspelningskontrollfönstret och tryck på "spela upp"-knappen.

When you're done sharing media, press the "stop" button in M³. Note that videos automatically stop upon completion.

#### Visar fjärrzoomdeltagare på Rikets sals monitor

Press the "hide/show media presentation window" button in the lower right corner of the M³ media controller screen, or <kbd>Alt Z</kbd>, to **hide** the media presentation window. The Zoom meeting will now be visible on the Kingdom Hall monitor.

> Om deltagaren har media att visa, följ stegen under underrubriken **Dela media i Rikets sal och över Zoom**.

Once the participant has finished their part, press the "hide/show media presentation window" button in the lower right corner of the M³ media playback control window, or <kbd>Alt Z</kbd>, to **show** the media presentation window. The Kingdom Hall monitor will now show the yeartext.

### Genomför hybridmöten med endast M³ och Zoom

Om du av någon anledning inte vill använda OBS Studio, kan följande förslag kanske hjälpa dig att ställa in saker och ting så enkelt som möjligt.

#### Första konfiguration: Rikets sal-dator

Same as corresponding section above. With the addition of the global keyboard shortcut for Zoom for starting/stopping screen sharing (<kbd>Alt S</kbd>). The "camera" will be the camera feed from the Kingdom Hall camera.

#### Första konfiguration: M³

Aktivera alternativet `Visa media på en extern skärm eller i ett separat fönster`.

#### Startar mötet

Samma som motsvarande avsnitt ovan.

#### Sänder delar från Rikets salens podie över Zoom

Samma som motsvarande avsnitt ovan.

#### Dela media i Rikets sal och över Zoom

Start sharing in Zoom by hitting <kbd>Alt S</kbd>. In the Zoom sharing window that pops up, choose the external monitor and enable both checkboxes on the bottom left (for sound and video optimization). The yeartext will now be shared over Zoom.

Hitta media du vill dela i M³ medieuppspelningskontrollfönstret och tryck på "spela upp"-knappen.

När du är klar med att dela media, tryck på <kbd>Alt S</kbd> för att avsluta delning av zoomskärm.

#### Visar fjärrzoomdeltagare på Rikets sals monitor

Samma som motsvarande avsnitt ovan.

### Skärmdumpar av presentationsläge

{% include screenshots/present-media.html lang=site.data.sv %}
