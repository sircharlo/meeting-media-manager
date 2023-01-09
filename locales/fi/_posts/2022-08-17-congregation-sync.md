---
tag: Asetukset
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

M³:n taustalla oleva synkronointimekanismi käyttää WebDAV:ta. This means that the VO (or someone under his supervision) needs to either:

- määriteltävä suojattu WebDAV-palvelin, joka on käytettävissä verkossa, **tai**
- käyttää kolmannen osapuolen pilvitallennuspalvelua, joka tukee WebDAV-protokollaa (katso Isäntänimi-asetus *Seurakunnan synkronoinnin asetukset* -osiossa alla).

Kaikkien käyttäjien, jotka haluavat olla synkronoitu yhdessä, on muodostettava yhteys samaan WebDAV-palvelimeen käyttämällä yhteystietoja ja valtuustietoja, jotka heidän VO:nsa on antanut heille.

### Seurakunnan synkronoinnin asetukset

| Asetus                           | Selitys                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Isäntänimi`                     | Web address of the WebDAV server. Secure HTTP (HTTPS) is required. <br><br> ***Note:** The label for this field is actually a button that, once clicked, will show a list of WebDAV providers that have been known to be compatible with M³, and will automatically prefill certain settings for those providers. <br><br> This list is provided as a courtesy, and in no way represents an endorsement of any particular service or provider. The best server is always the one you own...* |
| `Käyttäjätunnus`                 | WebDAV-palvelun käyttäjätunnus.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `Salasana`                       | Password for the WebDAV service. <br><br> ***Note:** As detailed in their respective support pages, an app-specific password might need to be created for [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) and [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) in order to enable WebDAV connections to their services.*                                                                                               |
| `Seurakunnan synkronointikansio` | This is the folder that will be used to synchronize media for all congregation sync users. You can either type/paste in a path, or use your mouse to navigate to the target folder. <br><br> ***Note:** Make sure that all congregation sync users input the same folder path; otherwise the sync won't work as expected.*                                                                                                                                                                               |
| `Seurakuntaasetukset`            | Once the VO has configured the *Media setup* and *Meeting setup* sections of the [Settings]({{page.lang}}/#configuration) on his own computer, he can then use this button to enforce certain settings for all congregation sync users (for example, meeting days, media language, conversion settings, and so on). This means that the selected settings will be forcefully applied for all synced users every time they open M³.                                                                                   |

### Seurakunnan synkronoinnin käyttäminen median hallintaan

Kun seurakunnan synkronoinnin määritys on valmis, olet valmis aloittamaan [Median hallinta]({{page.lang}}/#manage-media) seurakuntasi tekniselle AV-tukitiimille.

### Kuvakaappauksia seurakunnan synkronoinnista toiminnassa

{% include screenshots/congregation-sync.html lang=site.data.fi %}
