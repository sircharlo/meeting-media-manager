---
tag: Usage
title: Meedia esitlusrežiim
ref: present-media
---

### Meediumiesitlusrežiimi kasutamine

Meediumiesitluse ja kontrolleri režiimid on loodud lihtsuse huvides ja koosolekutel vigade vältimiseks.

Kui valik `Esita meediat teisel monitoril või eraldi aknas` on lubatud, ilmub meediumiesitluse ekraan automaatselt välisele monitorile, kui see on olemas, või eraldi, lohistatavas ja suurust muudetavas aknas, kui välist monitori ei tuvastatud.

When in standby, the media presentation screen will display the background image that is configured in the settings. If no background image has been configured, then M³ will attempt to automatically fetch and display the yeartext.

Kui seadetes pole taustapilti konfigureeritud ja aastateksti ei saanud automaatselt laadida, kuvatakse ooterežiimis must taust.

Meediumikontrolleri režiimile pääseb juurde, klõpsates M³ põhiekraanil nuppu ▶️ (esita) või kasutades kiirklahvi <kbd>Alt D</kbd> (välise kuva jaoks).

Once you have entered controller mode, the folder selection screen will allow you to select the date for which you'd like to display media. If the current day's folder exists, it will automatically be preselected. Once a date is selected, you can still change the selected date at any time by clicking on the date selection button, in the top section.

### Meedia esitlemine

To play media, press the ▶️ (play) button for the file you'd like. To hide the media, press the ⏹️ (stop) button. A video can be rewound or fast-forwarded while paused, if desired. Please note that for videos, the stop button must be pressed **twice** to prevent accidentally and prematurely stopping a video while it is playing for the congregation. Videos will auto-stop when they have played in their entirety.

### Extra Features

M³ has a few extra features that can be used to enhance the media presentation experience.

#### Present JW.org

To present JW.org, you can press the ⋮ (ellipsis) button at the top of the screen, and select `Open JW.org`. This will open a new controller window with JW.org loaded. The media window will also display JW.org. Now you can use the controller window to navigate JW.org, and the media window will display your actions. When you are done presenting JW.org, you can close the controller window, and continue with the normal media presentation mode.

#### Zoom and pan images

When an image is being displayed, you can scroll the mouse wheel while hovering over the image preview to zoom in and out. Alternatively, you can also double click on the image preview to zoom in. Double clicking will alternate between 1.5x, 2x, 3x, 4x and back to 1x zoom. You can also hold and drag the image to pan around the image.

#### Sort the media list

The media list can be sorted by clicking the sort button at the top right of the screen. The media items will have a button appear next to them that can be used to drag the media item up or down in the list. When you are satisfied with the order, you can click the sort button again to lock the order.

#### Add a last-minute song

If you need to add a last-minute song to the media list, you can press the `♫ +` (add song) button at the top of the screen. A dropdown will appear with a list of all the Kingdom songs. When you select one, it will immediately be added to the top of the media list and it can be played instantly. It will either stream the song from JW.org, or play the song from the local cache if it was previously downloaded.

### Hübriidkoosolekute läbiviimine, kasutades M³, OBS Studio ja Zoom kombinatsiooni

Kõige lihtsam viis meediumite jagamiseks hübriidkoosolekute ajal on konfigureerida OBS Studio, M³ ja Zoom koos töötama.

#### Algkonfiguratsioon: kuningriigisaali arvuti

Seadke välise monitori ekraani eraldusvõimeks 1280x720 või midagi sellele lähedast.

Konfigureerige arvuti helikaardi väljund ühele mikseri sisendile ja mikseri kombineeritud väljund arvuti helikaardi sisendile.

#### Esialgne konfiguratsioon: OBS Studio

Installige OBS Studio või laadige alla kaasaskantav versioon.

Kui kasutate OBS Studio kaasaskantavat versiooni, installige pistikprogramm [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) ja kui kasutate OBS Studio kaasaskantavat versiooni, lisage virtuaalkaamera Windowsile, topeltklõpsates kaasasoleval installiskriptil.

If you have OBS Studio v27 or older, you need to install the [obs-websocket](https://github.com/obsproject/obs-websocket) plugin. Otherwise obs-websocket is included. Configure a port number and password for obs-websocket.

In the OBS settings, under `General` > `System Tray`, enable all checkboxes. Under `Output` > `Streaming`, enable a hardware encoder if available. Under `Video` > `Base (Canvas) Resolution` and `Output (Scaled) Resolution`, choose `1280x720`, and under `Downscale Filter`, choose `Bilinear`.

Set up at least 2 scenes: one for the media display (`Window Capture` or `Display Capture` with the mouse cursor disabled and the appropriate window title/monitor selected), and one for the stage view (`Video Capture Device` with the KH camera selected). You may add as many scenes as required, with the camera adjusted, zoomed-in and cropped as needed (lectern view, conductor and reader view, table view, etc.).

Lisage OBS Studio otsetee parameetriga `--startvirtualcam` Windowsi kasutajaprofiili käivituskausta tagamaks, et OBS Studio käivitub kasutaja sisselogimisel automaatselt.

#### Esialgne konfiguratsioon: Kuningriigisaali suum

Zoom should be configured to use dual monitors. Enable global keyboard shortcuts for Zoom to mute/unmute the Kingdom Hall audio in Zoom (<kbd>Alt A</kbd>), and start/stop the Kingdom Hall video feed in Zoom (<kbd>Alt V</kbd>).

Seadke vaikimisi "mikrofon" mikseri kombineeritud väljundiks (nii et kõik kuningriigisaali helisüsteemi kaudu kostuv heli edastatakse Zoomi kaudu, sealhulgas mikrofonid ja meedia) ja "kaameraks" OBS Studio pakutav virtuaalne kaamera.

#### Esialgne konfiguratsioon: M³

Lubage valik `Esita meediat teisel monitoril või eraldi aknas`.

Lubage ja konfigureerige OBS Studio ühilduvusrežiim, kasutades OBS Studio seadistamise etapis konfigureeritud pordi ja parooli teavet.

#### Koosoleku alustamine

Start the Zoom meeting, and move the secondary Zoom meeting window to the external monitor. Make it fullscreen if desired. This is where any remote meeting participants will be displayed for the congregation to see.

Once the Zoom meeting is being displayed on the external monitor, open M³. The media presentation window will automatically open on top of Zoom on the external monitor. Sync media if necessary, and enter media controller mode by clicking the ▶️ (play) button on the main screen of M³, or <kbd>Alt D</kbd>.

Enable the Kingdom Hall video feed (<kbd>Alt V</kbd>), and spotlight the Kingdom Hall video feed if necessary so that Zoom participants see the Kingdom Hall stage. Unmute the Kingdom Hall audio feed in Zoom (<kbd>Alt A</kbd>). It should not be necessary to disable the video or audio feed in Zoom for the duration of the meeting. Make sure that "Original sound for musicians" is enabled in Zoom, to ensure the best audio quality for remote meeting participants.

Alustage taustamuusika taasesitamist vasakpoolses allnurgas oleva nupu või <kbd>Alt K</kbd> abil.

#### Kuningriigisaali lavalt osade otseülekanne Zoomi kaudu

Tegevus pole vajalik.

Koosoleku ajal saab valida erinevaid kaameranurki/suumi, kasutades M³ meedia taasesituse juhtakna allosas olevat menüüd; see menüü sisaldab kõigi OBS-is konfigureeritud kaameravaate stseenide loendit.

#### Meedia jagamine kuningriigisaalis ja Zoomi kaudu

Otsige M³ meedia taasesituse juhtaknas üles meedium, mida soovite jagada, ja vajutage nuppu "Esita".

When you're done sharing media, press the "stop" button in M³. Note that videos automatically stop upon completion.

#### Suumi kaugosalejate kuvamine kuningriigisaali monitoril

Press the "hide/show media presentation window" button in the lower right corner of the M³ media controller screen, or <kbd>Alt Z</kbd>, to **hide** the media presentation window. The Zoom meeting will now be visible on the Kingdom Hall monitor.

> Kui osalejal on näidata meediat, järgige alampealkirja **Meedia jagamine kuningriigisaalis ja Zoomi kaudu** all olevaid juhiseid.

Once the participant has finished their part, press the "hide/show media presentation window" button in the lower right corner of the M³ media playback control window, or <kbd>Alt Z</kbd>, to **show** the media presentation window. The Kingdom Hall monitor will now show the yeartext.

### Hübriidkoosolekute läbiviimine, kasutades ainult M³ ja Zoom

Kui te ei soovi mingil põhjusel OBS Studiot kasutada, aitavad järgmised soovitused teil asju võimalikult lihtsalt seadistada.

#### Algkonfiguratsioon: kuningriigisaali arvuti

Same as corresponding section above. With the addition of the global keyboard shortcut for Zoom for starting/stopping screen sharing (<kbd>Alt S</kbd>). The "camera" will be the camera feed from the Kingdom Hall camera.

#### Esialgne konfiguratsioon: M³

Lubage valik `Esita meediat teisel monitoril või eraldi aknas`.

#### oosoleku alustamine

Sama, mis ülaltoodud vastav jaotis.

#### Kuningriigisaali lavalt osade otseülekanne Zoomi kaudu

Sama, mis ülaltoodud vastav jaotis.

#### Meedia jagamine kuningriigisaalis ja Zoomi kaudu

Start sharing in Zoom by hitting <kbd>Alt S</kbd>. In the Zoom sharing window that pops up, choose the external monitor and enable both checkboxes on the bottom left (for sound and video optimization). The yeartext will now be shared over Zoom.

Otsige M³ meedia taasesituse juhtaknas üles meedium, mida soovite jagada, ja vajutage nuppu "Esita".

Kui olete meedia jagamise lõpetanud, vajutage suumiekraani jagamise lõpetamiseks <kbd>Alt S</kbd>.

#### Suumi kaugosalejate kuvamine kuningriigisaali monitoril

Sama, mis ülaltoodud vastav jaotis.

### Esitlusrežiimi ekraanipildid

{% include screenshots/present-media.html lang=site.data.et %}
