---
tag: Configuration
title: Asetukset
ref: configuration
---

Asetukset-näyttö on jaettu 4 osaan. Useimmat vaihtoehdot ovat itsestään selviä, mutta tässä on muutamia lisätietoja.

### Sovelluksen asetukset

| Asetus | Selitys |
| ------- | ----------- |
| `Näytön kieli` | Asettaa kielen, jolla M³ näytetään. <br><br> Kiitos monille avustajillemme sovelluksen kääntämisestä niin monille kielille! Jos haluat auttaa parantamaan olemassa olevaa käännöstä tai lisätä uuden, avaa uusi ["discussion"]({{site.github}}/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M%C2%B3+into+a+language+I+speak,+LANGUAGE). |
| `Kansio, johon media tallennetaan` | Kokousmedia tallennetaan tähän kansioon myöhempää jakamista ja käyttöä varten. |
| `Käynnistä sovellus järjestelmän käynnistyksen yhteydessä` | Jos käytössä, M³ käynnistyy, kun nykyinen käyttäjä kirjautuu sisään tietokoneeseen. <br><br> _**Huomaa:** ei saatavilla Linuxissa._ |
| `Aloita median synkronointi automaattisesti` | Jos tämä asetus on käytössä, tämä vaihtoehto aloittaa mediasynkronoinnin automaattisesti 5 sekunnin kuluttua M³:n käynnistämisestä. <br><br> _Voit estää automaattisen synkronoinnin tapahtumisen, kun tämä asetus on käytössä, painamalla ⏸ (tauko) -painiketta ennen kuin 5 sekunnin ajastin on kulunut._ |
| `Avaa kansio mediasynkronoinnin jälkeen` | Kun tämä on käytössä, valitun viikon ladatun median sisältävä kansio avautuu tietokoneen tiedostonhallinnassa median synkronoinnin päätyttyä. |
| `Sulje sovellus median synkronoinnin jälkeen` | Jos tämä vaihtoehto on käytössä, M³ sulkeutuu automaattisesti 5 sekunnin kuluttua median synkronoinnin päättymisestä. <br><br> _Estä M³ sulkeutumasta automaattisesti, kun tämä asetus on käytössä, painamalla 🏃 (henkilö lähtee/juoksu) -painiketta ennen kuin 5 sekunnin ajastin on kulunut._ |
| `Ota OBS Studion yhteensopivuustila käyttöön` | Jos tämä asetus on käytössä, tämä vaihtoehto koskettaa OBS Studiota vaihtaakseen kohtauksia automaattisesti tarpeen mukaan sekä ennen median jakamista että sen jälkeen. <br><br> _Jos otat tämän asetuksen käyttöön, varmista, että OBS Studio on määritetty käyttämään `obs-websocket`-laajennusta, jonka avulla M³ voi kommunikoida OBS Studion kanssa. <br><br> Määritä myös kaikki tarvittavat kohtaukset median jakamiseen ja näyttämiseen OBS:ssä. Tarvitset ainakin kohtauksen, jossa on `Window Capture` (suositus) tai `Display Capture`, joka on määritetty kaappaamaan M³-mediaesitysikkuna, tai näyttö, jossa mediaa esitellään. <br><br> Sinun on myös määritettävä kaikki haluamasi lavanäkymäkohtaukset, esimerkiksi: Kuva lavalta, laaja kuva lavalta, etc._ |
| `Portti` | Portti, jota `obs-websocket`-laajennus on määritetty kuuntelemaan. |
| `Salasana` | Salasana on määritetty `obs-websocket`-laajennuksen asetuksissa. |
| `Lavanäkymän oletuskohtaus OBS Studiossa` | Valitse, mikä kohtaus valitaan oletusarvoisesti, kun mediaesitystila käynnistetään. Yleensä lavan laajuinen näkymä tai kuva puhujapuhelimesta. |
| `Mediaikkunakohtaus OBS Studiossa` | Valitse, mikä kohtaus on määritetty OBS Studiossa kaappaamaan M³-mediaikkunaa. |
| `Poista laitteistokiihdytys käytöstä` | Ota tämä asetus käyttöön vain, jos sinulla on ongelmia mediaesitystilan kanssa. Tämän asetuksen muuttaminen aiheuttaa M³:n uudelleenkäynnistyksen. |

### Seurakunnan synkronoinnin asetukset

Katso [Seurakunnan synkronointi]({{page.lang}}/#congregation-sync) -osiosta lisätietoja siitä, mitä tämä tekee ja kuinka tämä osio määritetään.

### Mediaasetukset

| Asetus | Selitys |
| ------- | ----------- |
| `Median kieli` | Valitse seurakuntasi tai ryhmäsi kieli. Kaikki media ladataan JW.orgista tällä kielellä. |
| `Maksimiresoluutio videoille` | JW.org-sivustolta ladatut videot ladataan tällä resoluutiolla tai seuraavalla saatavilla olevalla pienemmällä resoluutiolla. Hyödyllinen rajoitetuissa tai pienen kaistanleveyden tilanteissa. |
| `Muunna media MP4-muotoon` | Tämä muuntaa automaattisesti kaikki kuva- ja äänitiedostot MP4-muotoon käytettäväksi Zoomin["native MP4 sharing feature"](assets/img/other/zoom-mp4-share.png)-ominaisuuden kanssa **täysin etänä** seurakunnan Zoom-kokouksissa. Tämä sisältää kaikki JW.org:sta ladatut kuvat ja mediatiedostot sekä käyttäjän tai VO:n lisäämät muut mediatiedostot. <br><br> _**Huomaa:** tämä vaihtoehto soveltuu parhaiten **vain etänä** pidettäviin seurakunnan Zoom-kokouksiin. Jos pidät joko **hybridi** tai **tavallisia** seurakunnan kokouksia, harkitse [Median esitystila]({{page.lang}}/#present-media) käyttöä aktivoimalla sen sijaan vaihtoehto `Esitä media ulkoisella näytöllä tai erillisessä ikkunassa` ja poista tämä vaihtoehto käytöstä._ |
| `Säilytä alkuperäiset mediatiedostot muuntamisen jälkeen` | Jos tämä asetus on käytössä, kuva- ja äänitiedostot säilytetään mediakansiossa sen jälkeen, kun ne on muunnettu MP4-muotoon, sen sijaan, että niitä poistettaisiin. Tämä johtaa hieman sekaisempaan mediakansioon, eikä sitä yleensä tarvitse ottaa käyttöön, jos mediaa jaetaan Zoom MP4 -jaon kautta. (Katso `Muunna media MP4-muotoon` yllä.) <br><br> _**Huomaa:** näkyy vain, jos myös `Muunna media MP4-muotoon` on käytössä._ |
| `Esitä media ulkoisella näytöllä tai erillisessä ikkunassa` | Tämän asetuksen avulla voit käyttää M³:ta kuvien, videoiden ja äänitiedostojen esittämiseen **hybridi**- tai **henkilökohtaisissa** seurakunnan kokouksissa. voidaan sitten käyttää napsauttamalla ▶️ (toisto) -painiketta M³:n päänäytössä. <br><br> Mediaesitysnäyttö käyttää automaattisesti ulkoista näyttöä, jos se on käytössä; jos ei, media näytetään erillisessä, kokoa muutettavassa ikkunassa. <br><br> _**Huomaa:** tämä vaihtoehto sopii parhaiten joko **hybridi** tai **tavallisiin** seurakunnan kokouksiin. <br><br> Jos pidät **vain etäkäytön** seurakunnan Zoom-kokouksia, harkitse Muunna media MP4-muotoon-vaihtoehdon aktivoimista ja median jakamista Zoomin alkuperäisen MP4-jaon avulla._ |
| `Mediaesitystilan taustakuva` | Oletuksena M³ yrittää noutaa kuluvan vuositekstin aiemmin valitulla kielellä näyttääkseen sen mustalla taustalla, kun [Median esitystila]({{page.lang}}/#present-media)-tilassa ja muuta mediaa ei toisteta. Jos automaattinen vuositekstin haku epäonnistuu jostain syystä tai jos haluat näyttää erilaisen taustakuvan, voit joko käyttää 'Selaa'-painiketta valitaksesi mukautetun kuvan tai 'Päivitä'-painiketta yrittääksesi hakea vuositekstin automaattisesti uudelleen. <br><br> _**Huomaa:** Jos [Seurakunnan synkronointi]({{page.lang}}/#congregation-sync) on käytössä, mukautetun taustakuvan valitseminen synkronoi sen automaattisesti kaikille seurakunnan synkronoinnin käyttäjille._ |
| `Luo soittolistoja käytettäväksi _VLC:n_ kanssa` | Ota tämä käyttöön, jos haluat luoda jokaiselle kokoukselle automaattisesti soittolistoja, jotka voidaan sitten ladata VLC:hen, jos käytät kyseistä sovellusta median näyttämiseen [Median esitystila]({{page.lang}}/#present-media):n sijaan. |
| `Jätä kaikki media pois th-esitteestä` | Jos tämä on käytössä, tämä estää _Hae itseäsi_ -esitteen median sisällyttämisen jokaiseen keskiviikon kokoukseen. |
| `Jätä kuvat pois _lffi_-esitteestä` | Jos tämä on käytössä, tämä estää kuvien lisäämisen _Live Forever_ -esitteestä (_lffi_) esimerkiksi opiskelijoiden tehtäviin viikkokokouksen aikana. |

### Kokousasetukset

| Asetus | Selitys |
| ------- | ----------- |
| `Viikkokokous` | Ilmoita viikkokokouksen tavallinen päivä ja aika; käytetään kansioiden nimeämiseen ja taustamusiikin automaattiseen häivytykseen (katso alla). |
| `Viikonlopun kokous` | Ilmoita tavallinen päivä ja aika viikonlopun kokoukselle. |
| `Ota käyttöön painike toistaaksesi Valtakunnanlauluja satunnaistoistona` | Ota käyttöön päänäytössä painike, joka toistaa Kingdom-kappaleita _sjjm_-sarjasta satunnaisessa järjestyksessä. Tästä on hyötyä esimerkiksi soitettaessa lauluja ennen ja jälkeen valtakunnansalin kokouksia taustamusiikkina. |
| `Kappaleen toiston äänenvoimakkuus` | Asettaa äänenvoimakkuuden, jolla taustamusiikki toistetaan. |
| `Lopeta kappaleiden toisto automaattisesti` | Jos `Ota käyttöön painike toistaaksesi Valtakunnanlauluja satunnaistoistona` on aktiivinen, tämän asetuksen avulla voit määrittää viiveen, jonka jälkeen taustamusiikki lopetetaan automaattisesti. Tämä voi olla joko: tietyn määrän minuutteja tai ennalta määrätty määrä sekunteja ennen kokouksen alkua (jos taustamusiikki aloitettiin ennen kokousta). |

### Kuvakaappaukset asetusnäytöstä

{% include screenshots/configuration.html lang=site.data.fi %}
