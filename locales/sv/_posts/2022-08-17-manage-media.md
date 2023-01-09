---
tag: Usage
title: Hantera media
ref: manage-media
---

Mediahanteringsskärmen låter användaren lägga till eller ta bort media för ett givet möte, hantera återkommande media och till och med lägga till specialmedia för andra datum då inget möte normalt är schemalagt.

### Hantera media för en viss dag

To manage media for a certain meeting or day, simply click on that day's tile on the main screen of M³. To manage media that be repeated at every meeting, click on the Recurring media tile.

### Lägger till media

Så här **lägger du till** media från mediehanteringsskärmen.

| Alternativ             | Förklaring                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `Typ av uppladdning`   | Välj mellan en av de tre `medietyperna` (se nedan).                                          |
| `Media att lägga till` | Beror på vald `mediatyp` (se nedan).                                                         |
| `Filnamnsprefix`       | Upp till 6 siffror kan läggas till före mediafilnamnen, för att hjälpa till med sorteringen. |
| `Medialista`           | Detta visar de för närvarande planerade media för det valda datumet.                         |

I fältet `Media att lägga till` kommer du att presenteras med olika alternativ, beroende på vald mediatyp.

| `Mediatyp` | Fältet `Media att lägga till`                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Sång`     | ... show a menu with all Kingdom song videos from the *sjjm* series, in the media language. Choose this option for example to add a song for the public talk, or for circuit overseer visits. <br><br> The selected song will be automatically downloaded from JW.org, in the congregation or group's language, as configured in the [Settings]({{page.lang}}/#configuration). |
| `JWPUB`    | ... allow you to browse to (or drag and drop) a JWPUB file. <br><br> You'll then be prompted to select the section, or chapter, from which you'd like to add media. This will add both embedded and referenced media from that section in the JWPUB file. <br><br> An example of a commonly used JWPUB file is the S-34, but any JWPUB file can be used here.      |
| `Anpassa`  | ... allow you to browse to (or drag and drop) any other media file(s) from your computer. <br><br> *Note that all PDF and SVG files will automatically be converted into high-resolution images by M³.*                                                                                                                                                                        |

### Ta bort, dölja och visa media

För att **ta bort**, **dölja** eller **visa** media, leta upp den mediefil du inte vill ha och klicka på den relevanta ikonen.

| Media har en röd 🥥 (radera) ikon                                    | Media har en ☑️ (markerad kryssruta)-ikon                                                                                                                    | Media har en 🔲-ikon (omarkerad kryssruta)                                                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mediafilen lades till dagens media av dig eller mötesorganisatören. | The media file is referenced in the meeting's material. <br><br> It *will* be downloaded from JW.org or extracted from the relevant publication. | The media file is referenced in the meeting's material. <br><br>Dold av dig eller av MO, så det kommer *inte* bli nedladdat eller tillagd som media. |

### Skärmdumpar av mediehanteringsskärmen

{% include screenshots/manage-media.html lang=site.data.sv %}
