---
tag: Usage
title: Median hallinta
ref: manage-media
---

Medianhallintanäytön avulla käyttäjä voi lisätä tai poistaa mediaa mitä tahansa kokousta varten, hallita toistuvaa mediaa ja jopa lisätä erityismediaa muille päivämäärille, joille ei normaalisti ole suunniteltu kokousta.

### Median hallinta jollekin tietylle päivälle

Hallitaksesi tietyn kokouksen tai päivän mediaa, napsauta kyseisen päivän ruutua M³:n päänäytössä. Voit hallita jokaisessa kokouksessa toistuvaa mediaa napsauttamalla Toistuva media -ruutua.

### Median lisääminen

Näin voit **lisätä** mediaa medianhallintanäytöstä.

| Vaihtoehto           | Selitys                                         |
| ---------------- | --------------------------------------------------- |
| `Latauksen tyyppi` | Valitse yksi kolmesta `mediatyypistä` (katso alempaa). |
| `Media lisättäväksi`   | Riippuu valitusta `mediatyypistä` (katso alempaa).      |
| `Tiedostonimen etuliite` | Mediatiedostojen nimien eteen voidaan lisätä enintään 6 numeroa lajittelun helpottamiseksi. |
| `Medialuettelo` | Tämä näyttää valitulle päivämääräruudulle tällä hetkellä suunnitellun median. |

`Media lisättäväksi`-kentässä sinulle esitetään erilaisia vaihtoehtoja valitun mediatyypin mukaan.

| `Mediatyyppi` | `Media lisättäväksi`-kenttä |
| ------------ | ------------------------ |
| `Laulu` | ... näytä valikko, jossa on kaikki sjjm -sarjan Valtakunnan lauluvideot mediakielellä. Valitse tämä vaihtoehto esimerkiksi lisätäksesi laulun julkiseen puheeseen tai kierrosvalvojan vierailuja varten. <br><br> Valittu kappale ladataan automaattisesti osoitteesta JW.org seurakunnan tai ryhmän kielellä [Asetukset]({{page.lang}}/#configuration)-kohdassa määritetyllä tavalla. |
| `JWPUB` | ... voit selata (tai vetää ja pudottaa) JWPUB-tiedostoon. <br><br> Sen jälkeen sinua pyydetään valitsemaan osio tai luku, josta haluat lisätä mediaa. Tämä lisää sekä upotetun että viitatun median kyseisestä osiosta JWPUB-tiedostoon. <br><br> Esimerkki yleisesti käytetystä JWPUB-tiedostosta on S-34, mutta mitä tahansa JWPUB-tiedostoa voidaan käyttää tässä. |
| `Mukautettu` | ... voit selata (tai vetää ja pudottaa) mitä tahansa mediatiedostoja tietokoneeltasi. <br><br> _Huomaa, että M³ muuntaa kaikki PDF- ja SVG-tiedostot automaattisesti korkearesoluutioisiksi kuviksi._ |

### Median poistaminen, piilottaminen ja näyttäminen

Jos haluat **poistaa**, **piilottaa** tai **näytä** median, etsi mediatiedosto, jota et halua, ja napsauta asianmukaista kuvaketta.

| Mediassa on punainen 🟥 (poista) -kuvake | Mediassa on ☑️ (valittu valintaruutu) -kuvake | Mediassa on kuvake 🔲 (valintaruutua ei ole valittu). |
| ---------------------- | --------------------------- | ------------------------------ |
| Sinä tai VO lisäsi mediatiedoston kyseisen päivän mediaan. | Mediatiedostoon viitataan kokouksen materiaalissa. <br><br> Se _ladataan_ osoitteesta JW.org tai poimitaan asiaankuuluvasta julkaisusta. | Mediatiedostoon viitataan kokouksen materiaalissa. <br><br> Sinä tai VO piilotit sen, joten sitä _ei_ ladata tai lisätä kokouksen mediaan. |

### Kuvakaappaukset medianhallintanäytöstä

{% include screenshots/manage-media.html lang=site.data.fi %}
