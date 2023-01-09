---
tag: Usage
title: Median esitystila
ref: present-media
---

### Mediaesitystilan käyttäminen

Mediaesitys- ja ohjaintilat on suunniteltu yksinkertaiseksi ja estämään virheitä kokousten aikana.

Kun vaihtoehto `Esitä media ulkoisella näytöllä tai erillisessä ikkunassa on käytössä`, mediaesitysnäyttö tulee automaattisesti näkyviin ulkoiselle näytölle, jos sellainen on, tai erillisessä, vedettävässä ja muutettavassa ikkunassa, jos ulkoista näyttöä ei havaittu.

When in standby, the media presentation screen will display the background image that is configured in the settings. If no background image has been configured, then M³ will attempt to automatically fetch and display the yeartext.

Jos taustakuvaa ei ole määritetty asetuksissa eikä vuositekstiä voitu ladata automaattisesti, valmiustilassa näkyy musta tausta.

Mediaohjaintilaan pääsee napsauttamalla ▶️ (toisto) -painiketta M³:n päänäytössä tai käyttämällä pikanäppäintä <kbd>Alt D</kbd> (ulkoiselle näytölle).

Once you have entered controller mode, the folder selection screen will allow you to select the date for which you'd like to display media. If the current day's folder exists, it will automatically be preselected. Once a date is selected, you can still change the selected date at any time by clicking on the date selection button, in the top section.

### Median esittely

To play media, press the ▶️ (play) button for the file you'd like. To hide the media, press the ⏹️ (stop) button. A video can be rewound or fast-forwarded while paused, if desired. Please note that for videos, the stop button must be pressed **twice** to prevent accidentally and prematurely stopping a video while it is playing for the congregation. Videos will auto-stop when they have played in their entirety.

### Hybridikokousten johtaminen M³:n, OBS Studion ja Zoomin yhdistelmällä

Ylivoimaisesti yksinkertaisin tapa jakaa mediaa hybridikokousten aikana on määrittää OBS Studio, M³ ja Zoom toimimaan yhdessä.

#### Alkukokoonpano: Valtakunnansalin tietokone

Aseta ulkoisen näytön resoluutioksi 1280x720 tai jotain lähelle sitä.

Määritä tietokoneen äänikortin lähtö menemään johonkin mikserin tuloista ja mikserin yhdistetty lähtö menemään tietokoneen äänikortin tuloon.

#### Alkukokoonpano: OBS Studio

Asenna OBS Studio tai lataa kannettava versio.

Jos käytät OBS Studion siirretävää versiota, asenna [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/)-laajennus, ja jos käytät OBS Studion siirrettävää versiota, lisää virtuaalikamera Windowsiin kaksoisnapsauttamalla mukana toimitettua asennuskomentosarjaa.

If you have OBS Studio v27 or older, you need to install the [obs-websocket](https://github.com/obsproject/obs-websocket) plugin. Otherwise obs-websocket is included. Configure a port number and password for obs-websocket.

In the OBS settings, under `General` > `System Tray`, enable all checkboxes. Under `Output` > `Streaming`, enable a hardware encoder if available. Under `Video` > `Base (Canvas) Resolution` and `Output (Scaled) Resolution`, choose `1280x720`, and under `Downscale Filter`, choose `Bilinear`.

Set up at least 2 scenes: one for the media display (`Window Capture` or `Display Capture` with the mouse cursor disabled and the appropriate window title/monitor selected), and one for the stage view (`Video Capture Device` with the KH camera selected). You may add as many scenes as required, with the camera adjusted, zoomed-in and cropped as needed (lectern view, conductor and reader view, table view, etc.).

Lisää OBS Studion pikakuvake `--startvirtualcam`-parametrilla Windowsin käyttäjäprofiilin Käynnistys-kansioon varmistaaksesi, että OBS Studio käynnistyy automaattisesti, kun käyttäjä kirjautuu sisään.

#### Alkukokoonpano: Valtakunnan sali Zoom

Zoom should be configured to use dual monitors. Enable global keyboard shortcuts for Zoom to mute/unmute the Kingdom Hall audio in Zoom (<kbd>Alt A</kbd>), and start/stop the Kingdom Hall video feed in Zoom (<kbd>Alt V</kbd>).

Aseta oletus"mikrofoniksi" mikserin yhdistetty ulostulo (jotta kaikki valtakunnansalin äänijärjestelmän kautta kuuluva välitetään Zoomin kautta, mukaan lukien mikrofonit ja media) ja "kameraksi" OBS Studion tarjoama virtuaalikamera.

#### Alkukokoonpano: M³

Ota `Esitä media ulkoisella näytöllä tai erillisessä ikkunassa`-vaihtoehto käyttöön.

Ota käyttöön ja määritä OBS Studion yhteensopivuustila käyttämällä portti- ja salasanatietoja, jotka on määritetty OBS Studion määritysvaiheessa.

#### Kokouksen aloittaminen

Start the Zoom meeting, and move the secondary Zoom meeting window to the external monitor. Make it fullscreen if desired. This is where any remote meeting participants will be displayed for the congregation to see.

Once the Zoom meeting is being displayed on the external monitor, open M³. The media presentation window will automatically open on top of Zoom on the external monitor. Sync media if necessary, and enter media controller mode by clicking the ▶️ (play) button on the main screen of M³, or <kbd>Alt D</kbd>.

Enable the Kingdom Hall video feed (<kbd>Alt V</kbd>), and spotlight the Kingdom Hall video feed if necessary so that Zoom participants see the Kingdom Hall stage. Unmute the Kingdom Hall audio feed in Zoom (<kbd>Alt A</kbd>). It should not be necessary to disable the video or audio feed in Zoom for the duration of the meeting.

Aloita taustamusiikin toisto painamalla vasemmassa alakulmassa olevaa painiketta tai <kbd>Alt K</kbd>.

#### Henkilökohtaisten osien lähettäminen valtakunnansalin näyttämöltä Zoomin kautta

Toimenpiteitä ei tarvita.

Erilaisia kamerakulmia/zoomauksia voidaan valita kokouksen aikana käyttämällä M³ mediatoiston ohjausikkunan alareunassa olevaa valikkoa; tämä valikko sisältää luettelon kaikista OBS:ssä määritetyistä kameranäkymän kohtauksista.

#### Median jakaminen valtakunnansalissa ja Zoomissa

Etsi mediaa, jonka haluat jakaa M³ mediatoiston ohjausikkunasta ja paina "toisto"-painiketta.

When you're done sharing media, press the "stop" button in M³. Note that videos automatically stop upon completion.

#### Näyttää Zoomin etäosapuolet valtakunnansalin näytöllä

Press the "hide/show media presentation window" button in the lower right corner of the M³ media controller screen, or <kbd>Alt Z</kbd>, to **hide** the media presentation window. The Zoom meeting will now be visible on the Kingdom Hall monitor.

> Jos osallistujalla on näytettävää mediaa, noudata **Median jakaminen valtakunnansalissa ja Zoomissa**-alaotsikon ohjeita.

Once the participant has finished their part, press the "hide/show media presentation window" button in the lower right corner of the M³ media playback control window, or <kbd>Alt Z</kbd>, to **show** the media presentation window. The Kingdom Hall monitor will now show the yeartext.

### Hybridikokousten pitäminen vain M³:lla ja Zoomilla

Jos et jostain syystä halua käyttää OBS Studiota, seuraavat ehdotukset voivat auttaa sinua asettamaan asiat mahdollisimman yksinkertaisesti.

#### Alkukokoonpano: Valtakunnansalin tietokone

Same as corresponding section above. With the addition of the global keyboard shortcut for Zoom for starting/stopping screen sharing (<kbd>Alt S</kbd>). The "camera" will be the camera feed from the Kingdom Hall camera.

#### Alkukokoonpano: M³

Ota `Esitä media ulkoisella näytöllä tai erillisessä ikkunassa`-vaihtoehto käyttöön.

#### Kokouksen aloittaminen

Sama kuin vastaava jakso yllä.

#### Henkilökohtaisten osien lähettäminen valtakunnansalin näyttämöltä Zoomin kautta

Sama kuin vastaava jakso yllä.

#### Median jakaminen valtakunnansalissa ja Zoomissa

Start sharing in Zoom by hitting <kbd>Alt S</kbd>. In the Zoom sharing window that pops up, choose the external monitor and enable both checkboxes on the bottom left (for sound and video optimization). The yeartext will now be shared over Zoom.

Etsi mediaa, jonka haluat jakaa M³ mediatoiston ohjausikkunasta ja paina "toisto"-painiketta.

Kun olet lopettanut median jakamisen, lopeta zoomausnäytön jakaminen painamalla <kbd>Alt S</kbd>.

#### Näyttää Zoomin etäosapuolet valtakunnansalin näytöllä

Sama kuin vastaava jakso yllä.

### Kuvakaappaukset esitystilasta

{% include screenshots/present-media.html lang=site.data.fi %}
