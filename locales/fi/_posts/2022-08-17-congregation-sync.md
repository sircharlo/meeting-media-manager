---
tag: Asetukset
title: Seurakunnan synkronointi
ref: congregation-sync
---

Vanhinten *videokonferenssien järjestäjäksi* (VJ) nimeämä veli voi käyttää M³:a hallitakseen, mitä mediaa on saatavilla hänen seurakuntansa teknisen A/V-tukitiimin käyttöön.

VJ tai hänen nimeämänsä henkilö voi:

- lataa **lisä** mediaa jaettavaksi kokouksen aikana, kuten kierrosvalvojan vierailua tai julkisten puhujien puheita varten
- **piilota** JW.org:sta media, joka ei ole relevanttia tietyn kokouksen kannalta, esimerkiksi kun paikallinen haaratoimisto on korvannut ohjelmanosan
- lisää tai poista **toistuva** media, kuten vuositekstivideo tai ilmoitusdia

Kaikki samaan seurakuntaan synkronoidut saavat sitten täsmälleen saman median, kun he napsauttavat *Päivitä mediakansiot*-painiketta.

Huomaa, että seurakunnan synkronointiominaisuus on valinnainen.

### Kuinka se toimii

M³:n taustalla oleva synkronointimekanismi käyttää WebDAV:ta. Tämä tarkoittaa, että VJ:n (tai jonkun hänen valvonnassaan olevan) on joko:

- määriteltävä suojattu WebDAV-palvelin, joka on käytettävissä verkossa, **tai**
- käytä kolmannen osapuolen pilvitallennuspalvelua, joka tukee WebDAV-protokollaa (katso*Web address* asetusta *Seurakunnan synkronoinnin asetukset* -osiossa alla).

Kaikkien käyttäjien, jotka haluavat olla synkronoitu yhdessä, on muodostettava yhteys samaan WebDAV-palvelimeen käyttämällä yhteystietoja ja valtuustietoja, jotka heidän VJ:nsa on antanut heille.

### Seurakunnan synkronoinnin asetukset

| Asetus | Selitys |
| --- | --- |
| `Isäntänimi` | WebDAV palvelimen verkko-osoite. Turvallinen HTTP (HTTPS) on pakollinen. <br><br> ***Huomautus:** Tämän kentän etiketti on itse asiassa painike, joka kerran klikattu, näyttää luettelon WebDAV tarjoajista, joiden tiedetään olevan yhteensopivia M³:n kanssa ja automaattisesti esitäyttää tietyt asetukset kyseisille tarjoajille. <br><br> Tämä luettelo on vain esimerkki eikä se millään tavoin merkitse suosittelemme tiettyä palvelua tai palveluntarjoajaa. Paras palvelin on aina se, jonka itse omistat...* |
| `Käyttäjätunnus` | WebDAV-palvelun käyttäjätunnus. |
| `Salasana` | WebDAV-palvelun salasana. <br><br> ***Huomautus:** Kunkin tukisivun mukaisesti sovelluskohtainen salasana saattaa olla tarpeen luoda [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) ja [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) varten, jotta WebDAV yhteydet heidän palveluihinsa toimisi.* |
| `Seurakunnan synkronointikansio` | Tämä on kansio jota käytetään synkronoimaan median kaikille seurakunnan käyttäjille. Voit joko kirjoittaa tai liittää polun tai käyttää hiirtäsi navigoidaksesi kohdekansioon. <br><br> ***Huomautus:** Varmista, että kaikki seurakunnan synkronointikäyttäjät syöttävät saman hakemiston; muuten synkronointi ei toimi odotetusti.* |
| `Seurakuntaasetukset` | Kun VJ on määrittänyt *Mediaasetukset* ja *Kokousasetukset* osassa [Asetukset]({{page.lang}}/#configuration) omalla tietokoneellaan, hän voi sitten käyttää tätä painiketta valvoakseen tiettyjä asetuksia kaikille seurakunnan synkronoinnin käyttäjille (esimerkiksi kokouspäivät, median kieli, muuntoasetukset, ja niin edelleen). Tämä tarkoittaa, että valittuja asetuksia sovelletaan kaikille synkronoiduille käyttäjille aina, kun he avaavat M3:n. |

### Seurakunnan synkronoinnin käyttäminen median hallintaan

Kun seurakunnan synkronoinnin määritys on valmis, olet valmis aloittamaan [Median hallinta]({{page.lang}}/#manage-media) seurakuntasi tekniselle AV-tukitiimille.

### Kuvakaappauksia seurakunnan synkronoinnista toiminnassa

{% include screenshots/congregation-sync.html lang=site.data.fi %}
