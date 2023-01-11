---
tag: Käyttö
title: Median hallinta
ref: manage-media
---

Medianhallintanäytön avulla käyttäjä voi lisätä tai poistaa mediaa mitä tahansa kokousta varten, hallita toistuvaa mediaa ja jopa lisätä erityismediaa muille päivämäärille, joille ei normaalisti ole suunniteltu kokousta.

### Median hallinta jollekin tietylle päivälle

Voit hallita mediaa tiettyyn kokoukseen tai päivään, klikkaa tuon päivän ruutua M³:n päänäytössä. Jos haluat hallita mediaa, joka toistuu jokaisessa kokouksessa, klikkaa ruutua Toistuvaa mediatilaa.

### Median lisääminen

Näin voit **lisätä** mediaa medianhallintanäytöstä.

| Vaihtoehto               | Selitys                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `Latauksen tyyppi`       | Valitse yksi kolmesta `mediatyypistä` (katso alempaa).                                      |
| `Media lisättäväksi`     | Riippuu valitusta `mediatyypistä` (katso alempaa).                                          |
| `Tiedostonimen etuliite` | Mediatiedostojen nimien eteen voidaan lisätä enintään 6 numeroa lajittelun helpottamiseksi. |
| `Medialuettelo`          | Tämä näyttää valitulle päivämääräruudulle tällä hetkellä suunnitellun median.               |

`Media lisättäväksi`-kentässä sinulle esitetään erilaisia vaihtoehtoja valitun mediatyypin mukaan.

| `Mediatyyppi` | `Media lisättäväksi`-kenttä                                                                                                                                                                                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Laulu`       | ... näytä valikko, jossa on laulukirjan *sjjm* videot median kielellä. Valitse tämä vaihtoehto esimerkiksi lisätäksesi laulun esitelmään tai kierrosviikkoa varten. <br><br> Valittu laulu ladataan automaattisesti JW.org:sta, seurakunnan tai ryhmän kielellä, sellaisena kuin se on määritetty [Asetuksissa]({{page.lang}}/#configuration).                |
| `JWPUB`       | ... voit selata (tai vetää ja pudottaa) JWPUB tiedoston. <br><br> Tämän jälkeen sinua pyydetään valitsemaan osio tai luku, josta haluat lisätä mediaa. Tämä lisää JWPUB-tiedostosta sekä upotettuja että referoituja medioita. <br><br> Esimerkki yleisestä JWPUB tiedostosta on S-34, mutta mitä tahansa JWPUB tiedostoa voidaan käyttää täällä. |
| `Mukautettu`  | ... voit selata tai vetää ja pudottaa mihin tahansa muuhun mediatiedostoon tietokoneeltasi. <br><br> *Huomaa, että kaikki PDF- ja SVG-tiedostot muunnetaan automaattisesti korkean resoluution kuviksi M³:n avulla*                                                                                                                                           |

### Median poistaminen, piilottaminen ja näyttäminen

Jos haluat **poistaa**, **piilottaa** tai **näytä** median, etsi mediatiedosto, jota et halua, ja napsauta asianmukaista kuvaketta.

| Mediassa on punainen 🟥 (poista) -kuvake                    | Mediassa on ☑️ (valittu valintaruutu) -kuvake                                                                                      | Mediassa on kuvake 🔲 (valintaruutua ei ole valittu)                                                                                                                |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sinä tai VO lisäsi mediatiedoston kyseisen päivän mediaan. | Mediatiedostoon on viitattu kokouksen aineistossa. <br><br> Se ** ladataan JW.org tai uutetaan kyseisestä julkaisusta. | Mediatiedostoon on viitattu kokouksen aineistossa. <br><br> Sinä tai VJ on piiloittannut median joten sitä *ei* ole ladattu tai lisättu kokousmediaan. |

### Kuvakaappaukset medianhallintanäytöstä

{% include screenshots/manage-media.html lang=site.data.fi %}
