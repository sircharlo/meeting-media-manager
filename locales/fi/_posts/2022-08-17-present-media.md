---
tag: Usage
title: Median esitystila
ref: present-media
---

### Mediaesitystilan käyttäminen

Mediaesitys- ja ohjaintilat on suunniteltu yksinkertaiseksi ja estämään virheitä kokousten aikana.

Kun vaihtoehto `Esitä media ulkoisella näytöllä tai erillisessä ikkunassa on käytössä`, mediaesitysnäyttö tulee automaattisesti näkyviin ulkoiselle näytölle, jos sellainen on, tai erillisessä, vedettävässä ja muutettavassa ikkunassa, jos ulkoista näyttöä ei havaittu.

Valmiustilassa mediaesitysnäytössä näkyy asetuksissa määritetty taustakuva. Jos taustakuvaa ei ole määritetty, M³ yrittää automaattisesti hakea ja näyttää vuositekstin.

Jos taustakuvaa ei ole määritetty asetuksissa eikä vuositekstiä voitu ladata automaattisesti, valmiustilassa näkyy musta tausta.

Mediaohjaintilaan pääsee napsauttamalla ▶️ (toisto) -painiketta M³:n päänäytössä tai käyttämällä pikanäppäintä <kbd>Alt D</kbd> (ulkoiselle näytölle).

Kun olet siirtynyt ohjaintilaan, kansion valintanäytössä voit valita päivämäärän, jona haluat näyttää median. Jos kuluvan päivän kansio on olemassa, se esivalitaan automaattisesti. Kun päivämäärä on valittu, voit silti muuttaa valittua päivämäärää milloin tahansa napsauttamalla päivämäärän valintapainiketta yläosassa.

### Median esittely

Toistaaksesi mediaa, paina haluamasi tiedoston ▶️ (toisto) -painiketta. Piilota media painamalla ⏹️ (pysäytys) -painiketta. Keskeytetty videota voidaan haluttaessa kelata taaksepäin tai kelata eteenpäin. Huomaa, että videoiden kohdalla pysäytyspainiketta on painettava **kahdesti**, jotta videota ei pysäytetä vahingossa ja ennenaikaisesti, kun sitä toistetaan seurakunnan puolesta. Videot pysähtyvät automaattisesti, kun ne on toistettu kokonaan.

### Hybridikokousten johtaminen M³:n, OBS Studion ja Zoomin yhdistelmällä

Ylivoimaisesti yksinkertaisin tapa jakaa mediaa hybridikokousten aikana on määrittää OBS Studio, M³ ja Zoom toimimaan yhdessä.

#### Alkukokoonpano: Valtakunnansalin tietokone

Aseta ulkoisen näytön resoluutioksi 1280x720 tai jotain lähelle sitä.

Määritä tietokoneen äänikortin lähtö menemään johonkin mikserin tuloista ja mikserin yhdistetty lähtö menemään tietokoneen äänikortin tuloon.

#### Alkukokoonpano: OBS Studio

Asenna OBS Studio tai lataa kannettava versio.

Jos käytät OBS Studion siirretävää versiota, asenna [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/)-laajennus, ja jos käytät OBS Studion siirrettävää versiota, lisää virtuaalikamera Windowsiin kaksoisnapsauttamalla mukana toimitettua asennuskomentosarjaa.

Jos sinulla on OBS Studio v27 tai vanhempi, sinun on asennettava [obs-websocket](https://github.com/obsproject/obs-websocket)-laajennus. Obs-websocket sisältyy uudemmissa versiossa. Määritä portin numero ja salasana obs-websocketille.

Ota kaikki valintaruudut käyttöön OBS-asetuksissa kohdassa `General` > `System Tray`. Ota käyttöön laitteistokooderi, jos se on saatavilla kohdassa `Output` > `Streaming`. Valitse `Video` > `Base (kanvas) -Resolution`- ja `Output(Scaled) Resolution` -kohdassa `1280 x 720` ja valitse kohdasta `Downscale Filter`, valitse `Bilinear`.

Määritä vähintään kaksi kohtausta: yksi medianäyttöä varten (`Window Capture` tai `Display Capture`, kun hiiren osoitin ei ole käytössä ja oikea ikkunan otsikko/näyttö on valittuna) ja toinen lavanäkymä (`Video Capture Device` Salin kameran ollessa valittuna). Voit lisätä tarpeen mukaan niin monta kohtausta kun haluat, jossa kameraa on säädetty, lähennetty ja rajattu tarpeen mukaan (lavanäkymä, lukijanäkymä, pöytänäkymä jne.).

Lisää OBS Studion pikakuvake `--startvirtualcam`-parametrilla Windowsin käyttäjäprofiilin Käynnistys-kansioon varmistaaksesi, että OBS Studio käynnistyy automaattisesti, kun käyttäjä kirjautuu sisään.

#### Alkukokoonpano: Valtakunnan sali Zoom

Zoom tulee määrittää käyttämään kahta näyttöä. Ota käyttöön yleiset pikanäppäimet Zoomille valtakunnansalin äänen mykistämistä tai mykistystä varten Zoomissa (<kbd>Alt A</kbd>) ja valtakunnansalin videosyötteen käynnistämiseksi/pysäyttämiseksi Zoomissa ( <kbd>Alt V</kbd>).

Aseta oletus"mikrofoniksi" mikserin yhdistetty ulostulo (jotta kaikki valtakunnansalin äänijärjestelmän kautta kuuluva välitetään Zoomin kautta, mukaan lukien mikrofonit ja media) ja "kameraksi" OBS Studion tarjoama virtuaalikamera.

#### Alkukokoonpano: M³

Ota `Esitä media ulkoisella näytöllä tai erillisessä ikkunassa`-vaihtoehto käyttöön.

Ota käyttöön ja määritä OBS Studion yhteensopivuustila käyttämällä portti- ja salasanatietoja, jotka on määritetty OBS Studion määritysvaiheessa.

#### Kokouksen aloittaminen

Aloita Zoom-kokous ja siirrä toissijainen Zoom-kokousikkuna ulkoiseen näyttöön. Tee siitä halutessasi koko näyttö. Tässä kaikki etäkokouksen osallistujat näkyvät.

Kun Zoom-kokous näkyy ulkoisella näytöllä, avaa M³. Mediaesitysikkuna avautuu automaattisesti ulkoisen näytön Zoomin päälle. Synkronoi media tarvittaessa ja siirry mediaohjaintilaan napsauttamalla ▶️ (toisto) -painiketta M³:n päänäytössä tai <kbd>Alt D</kbd>.

Ota käyttöön valtakunnansalin videosyöte (<kbd>Alt V</kbd>) ja korosta valtakunnansalin videosyöte tarvittaessa, jotta Zoomin osallistujat näkevät valtakunnansalin näyttämön. Poista valtakunnansalin äänisyötteen mykistys Zoomissa (<kbd>Alt A</kbd>). Video- tai äänisyötettä ei tavallisesti ole tarpeen poistaa käytöstä Zoomissa kokouksen ajaksi.

Aloita taustamusiikin toisto painamalla vasemmassa alakulmassa olevaa painiketta tai <kbd>Alt K</kbd>.

#### Henkilökohtaisten osien lähettäminen valtakunnansalin näyttämöltä Zoomin kautta

Toimenpiteitä ei tarvita.

Erilaisia kamerakulmia/zoomauksia voidaan valita kokouksen aikana käyttämällä M³ mediatoiston ohjausikkunan alareunassa olevaa valikkoa; tämä valikko sisältää luettelon kaikista OBS:ssä määritetyistä kameranäkymän kohtauksista.

#### Median jakaminen valtakunnansalissa ja Zoomissa

Etsi mediaa, jonka haluat jakaa M³ mediatoiston ohjausikkunasta ja paina "toisto"-painiketta.

Kun olet lopettanut median jakamisen, paina "stop"-painiketta M³:ssa. Huomaa, että videot pysähtyvät automaattisesti valmistumisen jälkeen.

#### Näyttää Zoomin etäosapuolet valtakunnansalin näytöllä

Paina "piilota/näytä mediaesitysikkuna" -painiketta M³ mediaohjaimen näytön oikeassa alakulmassa tai <kbd>Alt Z</kbd> piilota. mediaesitysikkuna. Zoom-kokous näkyy nyt valtakunnansalin näytöllä.

> Jos osallistujalla on näytettävää mediaa, noudata **Median jakaminen valtakunnansalissa ja Zoomissa**-alaotsikon ohjeita.

Kun osallistuja on suorittanut osuutensa, paina "piilota/näytä mediaesitysikkuna" -painiketta M³ mediatoiston ohjausikkunan oikeassa alakulmassa tai <kbd>Alt Z</kbd>, näytä mediaesitysikkuna. Valtakunnansalin näyttö näyttää nyt vuositekstin.

### Hybridikokousten pitäminen vain M³:lla ja Zoomilla

Jos et jostain syystä halua käyttää OBS Studiota, seuraavat ehdotukset voivat auttaa sinua asettamaan asiat mahdollisimman yksinkertaisesti.

#### Alkukokoonpano: Valtakunnansalin tietokone

Sama kuin vastaava jakso yllä. Lisätty Zoomin yleinen pikanäppäin näytön jakamisen aloittamiseksi/pysäyttämiseksi (<kbd>Alt S</kbd>). "Kamera" on kamerasyöte valtakunnansalin kamerasta.

#### Alkukokoonpano: M³

Ota Esitä media ulkoisella näytöllä tai erillisessä ikkunassa-vaihtoehto käyttöön.
Kokouksen aloittaminen

Sama kuin vastaava jakso yllä.

#### Henkilökohtaisten osien lähettäminen valtakunnansalin näyttämöltä Zoomin kautta

Sama kuin vastaava jakso yllä.

#### Median jakaminen valtakunnansalissa ja Zoomissa

Aloita jakaminen Zoomissa painamalla <kbd>Alt S</kbd>. Valitse avautuvassa Zoomin jakamisikkunassa ulkoinen näyttö ja ota molemmat valintaruudut käyttöön vasemmassa alakulmassa (äänen ja videon optimointia varten). Vuositeksti jaetaan nyt Zoomissa.

Etsi mediaa, jonka haluat jakaa M³ mediatoiston ohjausikkunasta ja paina "toisto"-painiketta.

Kun olet lopettanut median jakamisen, lopeta zoomausnäytön jakaminen painamalla <kbd>Alt S</kbd>.

#### Näyttää Zoomin etäosapuolet valtakunnansalin näytöllä

Sama kuin vastaava jakso yllä.

### Kuvakaappaukset esitystilasta

{% include screenshots/present-media.html lang=site.data.fi %}
