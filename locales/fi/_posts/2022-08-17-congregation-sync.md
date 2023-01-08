---
tag: Configuration
title: Seurakunnan synkronointi
ref: congregation-sync
---

Vanhinten *videokonferenssien järjestäjäksi* (VO) nimeämä veli voi käyttää M³:a hallitakseen, mitä mediaa on saatavilla hänen seurakuntansa teknisen A/V-tukitiimin käyttöön.

VO tai hänen nimeämänsä henkilö voi:

- lataa **lisä** mediaa jaettavaksi kokouksen aikana, kuten kierrosvalvojan vierailua tai julkisten puhujien puheita varten
- **piilota** JW.org:sta media, joka ei ole relevanttia tietyn kokouksen kannalta, esimerkiksi kun paikallinen haaratoimisto on korvannut ohjelmanosan
- lisää tai poista **toistuva** media, kuten vuositekstivideo tai ilmoitusdia

Kaikki samaan seurakuntaan synkronoidut saavat sitten täsmälleen saman median, kun he napsauttavat *Päivitä mediakansiot_-painiketta.

Huomaa, että seurakunnan synkronointiominaisuus on valinnainen.

### Kuinka se toimii

M³:n taustalla oleva synkronointimekanismi käyttää WebDAV:ia. Tämä tarkoittaa, että VO:n (tai jonkun hänen valvonnassaan olevan henkilön) on joko:

- määriteltävä suojattu WebDAV-palvelin, joka on käytettävissä verkossa, **tai**
- käyttää kolmannen osapuolen pilvitallennuspalvelua, joka tukee WebDAV-protokollaa (katso Isäntänimi-asetus *Seurakunnan synkronoinnin asetukset* -osiossa alla).

Kaikkien käyttäjien, jotka haluavat olla synkronoitu yhdessä, on muodostettava yhteys samaan WebDAV-palvelimeen käyttämällä yhteystietoja ja valtuustietoja, jotka heidän VO:nsa on antanut heille.

### Seurakunnan synkronoinnin asetukset

| Asetus | Selitys |
| ------- | ----------- |
| `Isäntänimi` | WebDAV-palvelimen Web-osoite. Suojattu HTTP (HTTPS) vaaditaan. <br><br> **Huomaa:** Tämän kentän tunniste on itse asiassa painike, jota napsautettuasi näyttää luettelon WebDAV-palveluntarjoajista, joiden tiedetään olevan yhteensopivia M³:n kanssa, ja joka täyttää automaattisesti tietyt asetukset näiden tarjoajien kohdalla. <br><br> Tämä luettelo on annettu kohteliaisuuden vuoksi, eikä se millään tavalla edusta minkään tietyn palvelun tai palveluntarjoajan hyväksyntää. Paras palvelin on aina se, jonka omistat...* |
| `Käyttäjätunnus` | WebDAV-palvelun käyttäjätunnus. |
| `Salasana` |WebDAV-palvelun salasana. <br><br> ***Huomaa:** Kuten niiden vastaavilla tukisivuilla on kerrottu, [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) ja [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) on ehkä luotava sovelluskohtainen salasana, jotta WebDAV-yhteydet voidaan ottaa käyttöön niiden palveluihin.* |
| `Seurakunnan synkronointikansio` | Tämä on kansio, jota käytetään median synkronointiin kaikille seurakunnan synkronoinnin käyttäjille. Voit joko kirjoittaa tai liittää polun tai navigoida kohdekansioon hiiren avulla. <br><br> ***Huomaa:** Varmista, että kaikki seurakunnan synkronoinnin käyttäjät syöttävät saman kansiopolun. muuten synkronointi ei toimi odotetulla tavalla.* |
| `Seurakuntaasetukset` | Kun VO on määrittänyt [Asetukset]({{page.lang}}/#configuration) *Mediaasetukset* ja *Kokousasetukset* omalla tietokoneella, hän voi käyttää tätä painiketta pakottaakseen tiettyjä asetuksia kaikki seurakunnan synkronoinnin käyttäjät (esimerkiksi kokouspäivät, median kieli, muunnosasetukset ja niin edelleen). Tämä tarkoittaa, että valittuja asetuksia sovelletaan pakollisesti kaikille synkronoiduille käyttäjille aina, kun he avaavat M³. |

### Seurakunnan synkronoinnin käyttäminen median hallintaan

Kun seurakunnan synkronoinnin määritys on valmis, olet valmis aloittamaan [Median hallinta]({{page.lang}}/#manage-media) seurakuntasi tekniselle AV-tukitiimille.

### Kuvakaappauksia seurakunnan synkronoinnista toiminnassa

{% include screenshots/congregation-sync.html lang=site.data.fi %}
