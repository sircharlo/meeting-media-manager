---
tag: Usage
title: Hantera media
ref: manage-media
---

Mediahanteringsskärmen låter användaren lägga till eller ta bort media för ett givet möte, hantera återkommande media och till och med lägga till specialmedia för andra datum då inget möte normalt är schemalagt.

### Hantera media för en viss dag

För att hantera media för ett visst möte eller en viss dag, klicka helt enkelt på dagens ruta på huvudskärmen i M³. För att hantera media som upprepas vid varje möte, klicka på rutan Återkommande media.

### Lägger till media

Så här **lägger du till** media från mediehanteringsskärmen.

| Alternativ           | Förklaring                                         |
| ---------------- | --------------------------------------------------- |
| `Typ av uppladdning` | Välj mellan en av de tre `medietyperna` (se nedan). |
| `Media att lägga till`   | Beror på vald `mediatyp` (se nedan).       |
| `Filnamnsprefix` | Upp till 6 siffror kan läggas till före mediafilnamnen, för att hjälpa till med sorteringen. |
| `Medialista` | Detta visar de för närvarande planerade media för det valda datumet. |

I fältet `Media att lägga till` kommer du att presenteras med olika alternativ, beroende på vald mediatyp.

| `Mediatyp` | Fältet `Media att lägga till` |
| ------------ | ------------------------ |
| `Sång` | ... visa en meny med alla Riketssång-låtvideor från _sjjm_-serien, på mediespråket. Välj det här alternativet för att till exempel lägga till en sång för det offentliga talet eller för kretstillsyningsbesök. <br><br> Den valda låten kommer automatiskt att laddas ner från JW.org, på församlingens eller gruppens språk, som konfigurerats i [inställningar]({{page.lang}}/#configuration). |
| `JWPUB` | ... låter dig bläddra till (eller dra och släppa) en JWPUB-fil. <br><br> Du kommer sedan att bli ombedd att välja avsnittet, eller kapitlet, från vilket du vill lägga till media. Detta kommer att lägga till både inbäddade och refererade media från det avsnittet i JWPUB-filen. <br><br> Ett exempel på en vanlig JWPUB-fil är S-34, men vilken JWPUB-fil som helst kan användas här. |
| `Anpassa` | ... låter dig bläddra till (eller dra och släpp) andra mediafiler från din dator. <br><br> _Observera att alla PDF- och SVG-filer automatiskt kommer att konverteras till högupplösta bilder av M³._ |

### Ta bort, dölja och visa media

För att **ta bort**, **dölja** eller **visa** media, leta upp den mediefil du inte vill ha och klicka på den relevanta ikonen.

| Media har en röd 🥥 (radera) ikon | Media har en ☑️ (markerad kryssruta)-ikon | Media har en 🔲-ikon (omarkerad kryssruta) |
| ---------------------- | --------------------------- | ------------------------------ |
| Mediafilen lades till dagens media av dig eller VO. | Mediefilen hänvisas till i mötets material. <br><br> Den _kommer_ att laddas ner från JW.org eller extraheras från den relevanta publikationen. | Mediefilen hänvisas till i mötets material. <br><br> Den gömdes av dig eller VO, så den _kommer inte_ att laddas ner eller läggas till i mötets media. |

### Skärmdumpar av mediehanteringsskärmen

{% include screenshots/manage-media.html lang=site.data.sv %}
