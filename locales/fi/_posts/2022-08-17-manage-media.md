---
tag: Usage
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

| `Mediatyyppi` | `Media lisättäväksi`-kenttä                                                                                                                                                                                                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Laulu`       | ... show a menu with all Kingdom song videos from the *sjjm* series, in the media language. Choose this option for example to add a song for the public talk, or for circuit overseer visits. <br><br> The selected song will be automatically downloaded from JW.org, in the congregation or group's language, as configured in the [Settings]({{page.lang}}/#configuration). |
| `JWPUB`       | ... allow you to browse to (or drag and drop) a JWPUB file. <br><br> You'll then be prompted to select the section, or chapter, from which you'd like to add media. This will add both embedded and referenced media from that section in the JWPUB file. <br><br> An example of a commonly used JWPUB file is the S-34, but any JWPUB file can be used here.      |
| `Mukautettu`  | ... allow you to browse to (or drag and drop) any other media file(s) from your computer. <br><br> *Note that all PDF and SVG files will automatically be converted into high-resolution images by M³.*                                                                                                                                                                        |

### Median poistaminen, piilottaminen ja näyttäminen

Jos haluat **poistaa**, **piilottaa** tai **näytä** median, etsi mediatiedosto, jota et halua, ja napsauta asianmukaista kuvaketta.

| Mediassa on punainen 🟥 (poista) -kuvake                    | Mediassa on ☑️ (valittu valintaruutu) -kuvake                                                                                                                | Mediassa on kuvake 🔲 (valintaruutua ei ole valittu).                                                                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sinä tai VO lisäsi mediatiedoston kyseisen päivän mediaan. | The media file is referenced in the meeting's material. <br><br> It *will* be downloaded from JW.org or extracted from the relevant publication. | The media file is referenced in the meeting's material. <br><br> It was hidden by you or the VO, so it *will not* be downloaded or added to the meeting's media. |

### Kuvakaappaukset medianhallintanäytöstä

{% include screenshots/manage-media.html lang=site.data.fi %}
