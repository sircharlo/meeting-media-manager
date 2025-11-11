# Asetusopas {#settings-guide}

Tämä kattava opas selittää kaikki M³-sovelluksessa saatavilla olevat asetukset, järjestettynä eri kategorioihin. Kun ymmärrät nämä asetukset, voit määrittää M³:n toimimaan täydellisesti seurakuntasi tarpeiden mukaan.

## Sovelluksen määritykset {#application-configuration}

### Näyttökieli {#display-language}

<!-- **Setting**: `localAppLang` -->

Valitse kieli, jota M³:n käyttöliittymä käyttää. Tämä on erillinen kieli siitä, jota käytetään median latauksissa.

**Vaihtoehdot**: Kaikki saatavilla olevat käyttöliittymäkielet (englanti, espanja, ranska jne.)

**Oletus**: Englanti

### Tumma tila {#dark-mode}

<!-- **Setting**: `darkMode` -->

Hallitse M³:n ulkoasuteemaa.

**Vaihtoehdot**:

- Vaihda automaattisesti järjestelmäasetuksen mukaan
- Käytä aina tummaa tilaa
- Käytä aina vaaleaa tilaa

**Oletus**: Automaattinen

### Viikon ensimmäinen päivä {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Määritä, mikä viikonpäivä näytetään kalenterinäkymässä viikon ensimmäisenä päivänä.

**Vaihtoehdot**: Sunnuntaista lauantaihin

**Oletus**: Sunnuntai

### Päivämäärän muoto {#date-format}

<!-- **Setting**: `localDateFormat` -->

Muoto, jota sovellus käyttää päivämäärien näyttämiseen.

**Esimerkki**: D MMMM YYYY

**Oletus**: D MMMM YYYY

### Käynnistä automaattisesti sisäänkirjautumisen yhteydessä {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Käynnistä M³ automaattisesti, kun tietokone käynnistyy.

**Oletus**: `false`

## Seurakunnan kokoukset {#congregation-meetings}

### Seurakunnan nimi {#congregation-name}

<!-- **Setting**: `congregationName` -->

Seurakuntasi nimi. Tätä käytetään järjestely- ja näyttötarkoituksiin.

**Oletus**: Tyhjä (määritettävä käyttöönoton yhteydessä)

### Kokouksen kieli {#meeting-language}

<!-- **Setting**: `lang` -->

Pääkieli, jota käytetään median latauksissa. Tämän tulisi vastata seurakuntasi kokouksissa käytettyä kieltä.

**Vaihtoehdot**: Kaikki kielet, jotka ovat saatavilla Jehovan todistajien virallisella verkkosivustolla

**Oletus**: Englanti (E)

### Varakieli {#fallback-language}

<!-- **Setting**: `langFallback` -->

Toissijainen kieli, jota käytetään, kun media ei ole saatavilla ensisijaisella kielellä.

**Vaihtoehdot**: Kaikki kielet, jotka ovat saatavilla Jehovan todistajien virallisella verkkosivustolla

**Oletus**: Ei mitään

### Viikkokokouksen päivä {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

Viikonpäivä, jolloin seurakunnan **viikkokokous** pidetään.

**Vaihtoehdot**: Sunnuntaista lauantaihin

**Oletus**: Ei mitään (määritettävä käyttöönoton yhteydessä)

### Viikkokokouksen alkamisaika {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

**viikkokokouksen** alkamisaika.

**Muoto**: HH:MM (24 tunnin kellonaika)

**Oletus**: Ei mitään (määritettävä käyttöönoton yhteydessä)

### Viikonlopun kokouksen päivä {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

Viikonpäivä, jolloin **viikonlopun kokous** pidetään.

**Vaihtoehdot**: Sunnuntaista lauantaihin

**Oletus**: Ei mitään (määritettävä käyttöönoton yhteydessä)

### Viikonlopun kokouksen alkamisaika {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

**viikonlopun kokouksen** alkamisaika.

**Muoto**: HH:MM (24 tunnin kellonaika)

**Oletus**: Ei mitään (määritettävä käyttöönoton yhteydessä)

### Kierrosviikko {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

Seuraava **kierrosvalvojan** vierailuviikko.

**Muoto**: KK/PP/VVVV

**Oletus**: Ei mitään

### Muistotilaisuuden päivämäärä {#memorial-date}

<!-- **Setting**: `memorialDate` -->

Seuraavan **muistotilaisuuden** päivämäärä (beta-ominaisuus).

**Muoto**: KK/PP/VVVV

**Oletus**: Haetaan automaattisesti säännöllisin väliajoin

### Kokousaikataulun muutokset {#meeting-schedule-changes}

Näillä asetuksilla voit määrittää tilapäisiä muutoksia kokousaikatauluun:

- **Muutospäivämäärä**: Päivä, jona muutos astuu voimaan
- **Kertaluonteinen muutos**: Onko kyseessä pysyvä vai tilapäinen muutos
- **Uusi viikkokokouksen päivä**: Uusi päivä **viikkokokoukselle**
- **Uusi viikkokokouksen aika**: Uusi alkamisaika **viikkokokoukselle**
- **Uusi viikonlopun kokouksen päivä**: Uusi päivä **viikonlopun kokoukselle**
- **Uusi viikonlopun kokouksen aika**: Uusi alkamisaika **viikonlopun kokoukselle**

## Median haku ja toisto {#media-retrieval-and-playback}

### Mittaroitu yhteys {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Ota tämä asetus käyttöön, jos käytät rajoitettua datayhteyttä, jotta kaistanleveyden käyttöä voidaan vähentää.

**Oletus**: `false`

### Medianäyttö {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Ota käyttöön medianäyttötoiminto. Tämä on välttämätöntä median esittämiseksi toisella näytöllä.

**Oletus**: `false`

#### Aloita toisto keskeytettynä {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Käynnistä videot taukotilassa, kun toisto alkaa.

**Oletus**: `false`

### Taustamusiikki {#settings-guide-background-music}

#### Ota musiikki käyttöön {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Ota käyttöön taustamusiikkitoiminto.

**Oletus**: `true`

#### Käynnistä musiikki automaattisesti {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Käynnistä taustamusiikki automaattisesti, kun M³ avataan, jos se on tarkoituksenmukaista.

**Oletus**: `true`

#### Musiikin pysäytyspuskuri ennen kokousta {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Kuinka monta sekuntia ennen kokouksen alkua taustamusiikki pysäytetään.

**Vaihteluväli**: 0–300 sekuntia

**Oletus**: 60 sekuntia

#### Musiikin äänenvoimakkuus {#music-volume}

<!-- **Setting**: `musicVolume` -->

Taustamusiikin äänenvoimakkuus (1–100 %).

**Oletus**: 100 %

### Välimuistin hallinta {#cache-management}

#### Ota lisävälimuisti käyttöön {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Ota käyttöön lisävälimuisti suorituskyvyn parantamiseksi.

**Oletus**: `false`

#### Välimuistikansio {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Mukautettu sijainti, johon välimuistitetut mediatiedostot tallennetaan.

**Oletus**: Järjestelmän oletussijainti

#### Ota automaattinen välimuistin tyhjennys käyttöön {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Tyhjennä automaattisesti vanhat välimuistitiedostot levytilan säästämiseksi.

**Oletus**: `true`

### Kansion seuranta {#settings-guide-folder-monitoring}

#### Ota kansioseuranta käyttöön {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Seuraa kansiota uusien mediatiedostojen varalta ja lisää ne automaattisesti M³:een.

**Oletus**: `false`

#### Seurattava kansio {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Kansion polku, jota seurataan uusien mediatiedostojen varalta.

**Oletus**: Tyhjä

## Integraatiot {#integrations}

### Zoom-integraatio {#settings-guide-zoom-integration}

#### Ota Zoom käyttöön {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Ota käyttöön Zoom-kokouksiin liittyvät integraatio-ominaisuudet.

**Oletus**: `false`

#### Näytönjakopikanäppäin {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Pikanäppäin Zoomin näytönjaon käynnistämiseksi.

**Oletus**: Ei mitään

### OBS Studio -integraatio {#settings-guide-obs-integration}

#### Ota OBS käyttöön {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Ota käyttöön OBS Studion integraatio automaattista näyttämön vaihtoa varten.

**Oletus**: `false`

:::warning Varoitus

_Äänimääritykset vaaditaan_\*: OBS Studio -integraatio hallitsee vain näytönjakoa. M³:n median ääni **ei siirry automaattisesti** Zoom-osallistujille OBS Studion kautta. Zoomin alkuperäiset ääniasetukset on määritettävä tai käytettävä vaihtoehtoa ”Jaa tietokoneen ääni”, jotta osallistujat kuulevat median. Katso tarkemmat ohjeet [Käyttöoppaasta](/user-guide#audio-configuration).

**Huom**: Zoom-integraatio käyttää Zoomin omaa näytönjakoa, joka käsittelee äänen sujuvammin kuin OBS Studio -integraatio.

:::

#### OBS-portti {#obs-port}

<!-- **Setting**: `obsPort` -->

Porttinumero, jota käytetään yhteyteen OBS Studion WebSocketiin.

**Oletus**: Ei mitään

#### OBS-salasana {#obs-password}

<!-- **Setting**: `obsPassword` -->

Salasana OBS Studion WebSocket-yhteyttä varten.

**Oletus**: Ei mitään

#### OBS näyttämöt {#obs-scenes}

Määritä, mitä OBS näyttämöitä käytetään eri tarkoituksiin:

- **Kameranäyttämö**: Näyttää kameran tai puhujalavan
- **Medianäyttämö**: Näyttää median
- **Kuvanäyttämö**: Näyttää kuvia (esimerkiksi kuva-kuvassa, jossa näkyvät sekä media että puhuja)

#### OBS:n lisäasetukset {#obs-advanced-options}

- **Viivästetyt kuvat**: Viivästää kuvien jakamisen OBS:iin, kunnes se käynnistetään manuaalisesti
- **Pikatila**: Ota käyttöön nopea päälle/pois-kytkin OBS-integraatiolle
- **Vaihda näyttämö median jälkeen**: Palaa automaattisesti edelliseen näyttämön median päätyttyä
- **Muista edellinen näyttämö**: Muistaa ja palauttaa edellisen näyttämön
- **Piilota kuvakkeet**: Piilottaa OBS:iin liittyvät kuvakkeet käyttöliittymästä

:::warning Varoitus

**Äänimääritykset vaaditaan**: OBS Studio -integraatio hallitsee vain video- ja näyttämön vaihtoa. M³:n median ääni **ei siirry automaattisesti** Zoomiin tai OBS:iin. Videovirta toimii kuten virtuaalikamera ilman ääntä, kuten verkkokamera. Zoomin alkuperäiset ääniasetukset on määritettävä tai käytettävä vaihtoehtoa ”Jaa tietokoneen ääni”, jotta osallistujat kuulevat median. Katso tarkemmat ohjeet [Käyttöoppaasta](/user-guide#audio-configuration).

**Vaihtoehto**: Harkitse Zoom-integraation käyttöä, sillä se käsittelee ääntä sujuvammin.

:::

### Mukautetut tapahtumat {#custom-events}

#### Ota mukautetut tapahtumat käyttöön {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Ota käyttöön mukautetut pikanäppäimet, jotka laukeavat tiettyjen tapahtumien yhteydessä (esimerkiksi kun media toistetaan, keskeytetään tai pysäytetään).

**Oletus**: `false`

#### Mukautetut tapahtumapikanäppäimet {#custom-event-shortcuts}

##### Median toistopikanäppäin {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Pikanäppäin, joka laukeaa, kun mediaa toistetaan.

**Oletus**: Ei mitään

##### Median taukopikanäppäin {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Pikanäppäin, joka laukeaa, kun media keskeytetään.

**Oletus**: Ei mitään

##### Median pysäytyspikanäppäin {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Pikanäppäin, joka laukeaa, kun media pysäytetään.

**Oletus**: Ei mitään

##### Viimeisen laulun pikanäppäin {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Pikanäppäin, joka laukeaa, kun kokouksen viimeinen laulu toistetaan.

**Oletus**: Ei mitään

## Lisäasetukset {#advanced-settings}

### Pikanäppäimet {#settings-guide-keyboard-shortcuts}

#### Ota pikanäppäimet käyttöön {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Ota käyttöön mukautettavat pikanäppäimet median hallintaa varten.

**Oletus**: `false`

#### Medianhallinnan pikanäppäimet {#media-control-shortcuts}

Määritä pikanäppäimet median toistamiseen:

- **Medianäyttö**: Avaa tai sulje medianäyttö
- **Edellinen media**: Siirry edelliseen mediatiedostoon
- **Seuraava media**: Siirry seuraavaan mediatiedostoon
- **Tauko/Jatka**: Keskeytä tai jatka median toistoa
- **Pysäytä media**: Pysäytä median toisto
- **Musiikki päälle/pois**: Vaihda taustamusiikin tila

### Median näyttö {#media-display}

#### Ota mediaikkunan himmennys siirtymissä käyttöön {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Ota käyttöön himmennys siirtymissä, kun mediaikkuna näytetään tai piilotetaan.

**Oletus**: `true`

#### Piilota median logo {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Piilota logo medianäytössä.

**Oletus**: `false`

#### Suurin resoluutio {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Ladattujen mediatiedostojen suurin resoluutio.

**Vaihtoehdot**: 240p, 360p, 480p, 720p

**Oletus**: 720p

#### Sisällytä painettu media {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Sisällytä painetuista julkaisuista peräisin oleva media ladattaviin tiedostoihin.

**Oletus**: `true`

#### Jätä alaviitteet pois {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Jätä alaviitteiden kuvat pois median latauksista, jos mahdollista.

**Oletus**: `false`

#### Jätä opetusesitteen media pois {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Jätä **Opetusesitteestä (th)** peräisin oleva media pois median latauksista.

**Oletus**: `true`

### Tekstitykset {#subtitles}

#### Ota tekstitykset käyttöön {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Ota käyttöön tekstitysten tuki median toistossa.

**Oletus**: `false`

#### Tekstitysten kieli {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Tekstitysten kieli (voi olla eri kuin median kieli).

**Vaihtoehdot**: Kaikki kielet, jotka ovat saatavilla Jehovan todistajien virallisella verkkosivustolla

**Oletus**: Ei mitään

### Median vienti {#settings-guide-media-export}

#### Ota median automaattinen vienti käyttöön {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Vie mediatiedostot automaattisesti määritettyyn kansioon.

**Oletus**: `false`

#### Median vientikansio {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Kansio, johon mediatiedostot viedään automaattisesti.

**Oletus**: Tyhjä

#### Muunna tiedostot MP4-muotoon {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

Muunna viedyt mediatiedostot MP4-muotoon paremman yhteensopivuuden saavuttamiseksi.

**Oletus**: `false`

### Vaaravyöhyke {#danger-zone}

:::warning Varoitus

Näitä asetuksia tulisi muuttaa vain, jos ymmärrät muutosten vaikutukset.

:::

#### Perus-URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Perusverkkotunnus, jota käytetään julkaisujen ja median lataamiseen.

**Oletus**: `jw.org`

#### Poista median lataus käytöstä {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Poista automaattiset medialataukset kokonaan käytöstä. Käytä tätä vain profiileissa, jotka on tarkoitettu erityistapahtumiin tai mukautettuihin kokoonpanoihin.

**Oletus**: `false`

## Vinkkejä optimaaliseen asetukseen {#configuration-tips}

### Uusille käyttäjille {#new-users}

1. Aloita määritysoppaalla perusasetusten määrittämiseksi
2. Ota käyttöön **"Medianäyttöpainike"** esitystoimintojen käyttöön
3. Määritä kokousaikataulu tarkasti
4. Ota käyttöön OBS-integraatio, jos käytät hybridikokouksia

### Edistyneille käyttäjille {#advanced-users}

1. Käytä kansioseurantaa median synkronoimiseksi pilvitallennuksen kanssa
2. Ota käyttöön median automaattinen vienti varmuuskopiointia varten
3. Määritä pikanäppäimet tehokkaaseen käyttöön
4. Ota käyttöön Zoom-integraatio automaattista näytönjakoa varten

### Suorituskyvyn optimointi {#performance-optimization}

1. Ota käyttöön lisävälimuisti suorituskyvyn parantamiseksi
2. Valitse tarpeitasi vastaava enimmäisresoluutio
3. Ota käyttöön automaattinen välimuistin tyhjennys levytilan hallitsemiseksi
4. Ota mittaroitu yhteys käyttöön, jos käytät rajoitettua kaistaa

### Vianmääritys {#settings-guide-troubleshooting}

- Jos media ei lataudu, tarkista kokousaikatauluasetukset
- Jos OBS-integraatio ei toimi, tarkista portti- ja salasana-asetukset
- Jos suorituskyky on hidas, kokeile lisätä välimuistia tai alentaa resoluutiota
- Jos kohtaat kieliongelmia, tarkista sekä käyttöliittymän että median kieliasetukset
- Jos Zoom-osallistujat eivät kuule mediaääntä, määritä Zoomin alkuperäiset ääniasetukset tai käytä vaihtoehtoa **"Jaa tietokoneen ääni"**
- **Vinkki**: Harkitse Zoom-integraation käyttöä OBS Studion sijaan helpompaa äänenhallintaa varten
