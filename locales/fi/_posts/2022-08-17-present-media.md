---
tag: Käyttö
title: Median esitystila
ref: present-media
---

### Mediaesitystilan käyttäminen

Mediaesitys- ja ohjaintilat on suunniteltu yksinkertaiseksi ja estämään virheitä kokousten aikana.

Kun vaihtoehto `Esitä media ulkoisella näytöllä tai erillisessä ikkunassa on käytössä`, mediaesitysnäyttö tulee automaattisesti näkyviin ulkoiselle näytölle, jos sellainen on, tai erillisessä, vedettävässä ja muutettavassa ikkunassa, jos ulkoista näyttöä ei havaittu.

Kun tila on käytössä, median esitysnäyttö näyttää taustakuvan, joka on määritetty asetuksissa. Jos taustakuvaa ei ole määritetty, M³ yrittää automaattisesti noutaa ja näyttää vuositekstin.

Jos taustakuvaa ei ole määritetty asetuksissa eikä vuositekstiä voitu ladata automaattisesti, valmiustilassa näkyy musta tausta.

Mediaohjaintilaan pääsee napsauttamalla ▶️ (toisto) -painiketta M³:n päänäytössä tai käyttämällä pikanäppäintä <kbd>Alt D</kbd> (ulkoiselle näytölle).

Mediantoistotilassa voi valita mille päivämäärälle haluat näyttää median. Jos nykyisen päivän kansio on olemassa, se valitaan automaattisesti. Kun päivämäärä on valittu, voit silti muuttaa valittua päivämäärää milloin tahansa klikkaamalla päivämäärän valintapainiketta, ylimmässä osiossa.

### Median esittely

Toistaaksesi mediaa, paina ▶️ (Toista) painiketta. Voit piilottaa median, paina ⏹️ (stop) painiketta. Videota voidaan kelata taakse tai eteenpäin vain pause-tilassa. Huomaa, että videoiden osalta, pysäytyspainiketta on painettava **kahdesti** estääksesi videon pysäyttämisen vahingossa. Videot pysähtyvät automaattisesti, kun ne ovat pelanneet kokonaan.

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

### Hybridikokousten johtaminen M³:n, OBS Studion ja Zoomin yhdistelmällä

Ylivoimaisesti yksinkertaisin tapa jakaa mediaa hybridikokousten aikana on määrittää OBS Studio, M³ ja Zoom toimimaan yhdessä.

#### Alkukokoonpano: Valtakunnansalin tietokone

Aseta ulkoisen näytön resoluutioksi 1280x720 tai jotain lähelle sitä.

Määritä tietokoneen äänikortin lähtö menemään johonkin mikserin tuloista ja mikserin yhdistetty lähtö menemään tietokoneen äänikortin tuloon.

#### Alkukokoonpano: OBS Studio

Asenna OBS Studio tai lataa kannettava versio.

Jos käytät OBS Studion siirretävää versiota, asenna [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/)-laajennus, ja jos käytät OBS Studion siirrettävää versiota, lisää virtuaalikamera Windowsiin kaksoisnapsauttamalla mukana toimitettua asennuskomentosarjaa.

Jos sinulla on OBS Studio v27 tai vanhempi, sinun täytyy asentaa [obs-websocket](https://github.com/obsproject/obs-websocket) plugin. Muuten obs-websocket sisältyy. Määritä obs-websocketin porttinumero ja salasana.

OBS asetuksissa kohdassa `Yleistä` > `Järjestelmän ilmoitusalue`, salli kaikki valintaruudut. Ota `Output` > `Streaming`käyttöön laitteistoenkooderi jos käytettävissä. Kohteena `Video` > `Base (Canvas)` ja `Output (Scaled)`, valitse `1280x720`, ja alle `Alamittakaavan Suodatin`, valitse `Bilinear`.

Määritä vähintään 2 skeneä: yksi mediatiedonäytölle (`Ikkunan kaappaus` tai `Näyttö` kun hiiren kursori on poistettu käytöstä ja sopiva ikkunan otsikko/näyttö valittu), ja toinen näyttämölle (`Video Capture Laite` salin kamera valittu). Voit lisätä niin monta skenea kuin tarvitset, kamera on säädetty, zoomed-in ja rajataan tarpeen mukaan (puhuja ja lukijan näkymä jne.).

Lisää OBS Studion pikakuvake `--startvirtualcam`-parametrilla Windowsin käyttäjäprofiilin Käynnistys-kansioon varmistaaksesi, että OBS Studio käynnistyy automaattisesti, kun käyttäjä kirjautuu sisään.

#### Alkukokoonpano: Valtakunnan sali Zoom

Zoom on konfiguroitava käyttämään kahta näyttöä. Ota käyttöön globaali näppäimistön pikakuvakkeet Zoomia varten, jotta voit mykistää tai poistaa mykistys salin ääntä Zoomissa (<kbd>Alt A</kbd>), ja aloittaa / lopettaa salin video syöte Zoomiin (<kbd>Alt V</kbd>).

Aseta oletus"mikrofoniksi" mikserin yhdistetty ulostulo (jotta kaikki valtakunnansalin äänijärjestelmän kautta kuuluva välitetään Zoomin kautta, mukaan lukien mikrofonit ja media) ja "kameraksi" OBS Studion tarjoama virtuaalikamera.

#### Alkukokoonpano: M³

Ota `Esitä media ulkoisella näytöllä tai erillisessä ikkunassa`-vaihtoehto käyttöön.

Ota käyttöön ja määritä OBS Studion yhteensopivuustila käyttämällä portti- ja salasanatietoja, jotka on määritetty OBS Studion määritysvaiheessa.

#### Kokouksen aloittaminen

Aloita Zoom-kokous ja siirrä toissijainen zoomausikkuna ulkoiseen näyttöön. Tee se halutessasi koko näytölle. Tässä kohdassa kaikki etäkokouksen osallistujat näytetään seurakunnalle.

Kun Zoom-kokous on näkyvissä ulkoisessa näytössä, avaa M³. Median esitysikkuna aukeaa automaattisesti ulkoisen monitorin Zoom päälle. Synkronoi mediaa tarvittaessa ja kirjoita mediasäätimen tila klikkaamalla ▶️ (play) painiketta M3:n pääruudulla, tai <kbd>Alt D</kbd>.

Ota käyttöön salin video syöte (<kbd>Alt V</kbd>), ja spotlightaa salin video syöte tarvittaessa, jotta Zoom osallistujat näkevät salin lavan. Poista mykistys salin äänisyötteestä Zoomissa (<kbd>Alt A</kbd>). Ei pitäisi olla tarpeen poistaa video- tai äänilähtöä Zoomista kokouksen aikana.

Aloita taustamusiikin toisto painamalla vasemmassa alakulmassa olevaa painiketta tai <kbd>Alt K</kbd>.

#### Lähettää osa salin lavaa Zoomin kautta

Toimenpiteitä ei tarvita.

Erilaisia kamerakulmia/zoomauksia voidaan valita kokouksen aikana käyttämällä M³ mediatoiston ohjausikkunan alareunassa olevaa valikkoa; tämä valikko sisältää luettelon kaikista OBS:ssä määritetyistä kameranäkymän kohtauksista.

#### Median jakaminen valtakunnansalissa ja Zoomissa

Etsi mediaa, jonka haluat jakaa M³ mediatoiston ohjausikkunasta ja paina "toisto"-painiketta.

Kun olet valmis jakaamaan mediaa, paina "pysäytä" -painiketta M³:ssa. Huomaa, että videot pysähtyvät automaattisesti kun ne on valmiita.

#### Näyttää Zoomin etäosapuolet valtakunnansalin näytöllä

Paina "piilota / näytä median esitysikkuna" -painiketta M³ media ikkunan alakulmassa, tai <kbd>Alt Z</kbd>, **piiloittaa** median esitysikkunan. Zoom kokous tulee nyt näkyviin salin näyttööni.

> Jos osallistujalla on näytettävää mediaa, noudata **Median jakaminen valtakunnansalissa ja Zoomissa**-alaotsikon ohjeita.

Kun osallistuja on suorittanut osuutensa, paina "piilota / näytä median esitysikkuna" -painiketta M³-median oikeassa alakulmassa, tai <kbd>Alt Z</kbd>, **näyttää** medianäyttö ikkunan. Salin näytössä näkyy nyt vuositeksti.

### Hybridikokousten pitäminen vain M³:lla ja Zoomilla

Jos et jostain syystä halua käyttää OBS Studiota, seuraavat ehdotukset voivat auttaa sinua asettamaan asiat mahdollisimman yksinkertaisesti.

#### Alkukokoonpano: Valtakunnansalin tietokone

Sama kuin vastaava jakso yllä. Lisäämällä globaalin näppäimistön pikanäppäimen Zoom näytön jakamisen käynnistämistä tai pysäyttämistä varten (<kbd>Alt S</kbd>). "Kamera" on salin kamerasyöte.

#### Alkukokoonpano: M³

Ota `Esitä media ulkoisella näytöllä tai erillisessä ikkunassa`-vaihtoehto käyttöön.

#### Kokouksen aloittaminen

Sama kuin vastaava jakso yllä.

#### Henkilökohtaisten osien lähettäminen valtakunnansalin näyttämöltä Zoomin kautta

Sama kuin vastaava jakso yllä.

#### Median jakaminen valtakunnansalissa ja Zoomissa

Aloita jakaminen Zoomissa painamalla<kbd>Alt S</kbd>. Zoomauksen jakamisikkunassa, joka ponnahtaa ylös, valitse ulkoinen näyttö ja ota käyttöön molemmat vasemmassa alakulmassa olevat valintaruudut (äänen ja videon optimointi). Vuositeksti jaetaan nyt Zoomin kautta.

Etsi mediaa, jonka haluat jakaa M³ mediatoiston ohjausikkunasta ja paina "toisto"-painiketta.

Kun olet lopettanut median jakamisen, lopeta zoomausnäytön jakaminen painamalla <kbd>Alt S</kbd>.

#### Näyttää Zoomin etäosapuolet valtakunnansalin näytöllä

Sama kuin vastaava jakso yllä.

### Kuvakaappaukset esitystilasta

{% include screenshots/present-media.html lang=site.data.fi %}
