---
tag: Användning
title: Hantera media
ref: manage-media
---

Mediahanteringsskärmen låter användaren lägga till eller ta bort media för ett givet möte, hantera återkommande media och till och med lägga till specialmedia för andra datum då inget möte normalt är schemalagt.

### Hantera media för en viss dag

För att hantera media för ett visst möte eller dag, klicka bara på den dagens ruta på huvudskärmen i M³. För att hantera media som upprepas vid varje möte, klicka på rutan för Återkommande media.

### Lägger till media

Så här **lägger du till** media från mediehanteringsskärmen.

| Alternativ | Förklaring |
| --- | --- |
| `Typ av uppladdning` | Välj mellan en av de tre `medietyperna` (se nedan). |
| `Media att lägga till` | Beror på vald `mediatyp` (se nedan). |
| `Filnamnsprefix` | Upp till 6 siffror kan läggas till före mediafilnamnen, för att hjälpa till med sorteringen. |
| `Medialista` | Detta visar de för närvarande planerade media för det valda datumet. |

I fältet `Media att lägga till` kommer du att presenteras med olika alternativ, beroende på vald mediatyp.

| `Mediatyp` | Fältet `Media att lägga till` |
| --- | --- |
| `Sång` | ... visa en meny med alla Riketssång-videor från *sjjm* -serien, på mediaspråket. Välj det här alternativet för att till exempel lägga till en sång för det offentliga föreläsningen, eller för kretsbesöket. <br><br> Den valda sången kommer automatiskt att laddas ner från JW.org, på församlingens eller gruppens språk, som konfigurerats i [Inställningar]({{page.lang}}/#configuration). |
| `JWPUB` | ... kan du bläddra till (eller dra och släppa) en JWPUB-fil. <br><br> Du blir då ombedd att välja det avsnitt eller kapitel som du vill lägga till media från. Detta kommer att lägga till både inbäddade och refererade medier från den delen i JWPUB-filen. <br><br> Ett exempel på en vanlig JWPUB-fil är S-34, men vilken JWPUB-fil som helst kan användas här. |
| `Anpassa` | ... kan du bläddra till (eller dra och släppa) andra mediefil(er) från din dator. <br><br> *Observera att alla PDF-filer och SVG-filer automatiskt konverteras till högupplösta bilder av M³.* |

### Ta bort, dölja och visa media

För att **ta bort**, **dölja** eller **visa** media, leta upp den mediefil du inte vill ha och klicka på den relevanta ikonen.

| En röd 🟥 (ta bort) ikon | En ☑️ (markerad kryssruta)-ikon | En 🔲-ikon (omarkerad kryssruta) |
| --- | --- | --- |
| Mediafilen lades till dagens media av dig eller mötesorganisatören. | Mediafilen refereras till i mötets material. <br><br> Den *kommer* att laddas ned från JW.org eller extraheras från aktuell publikation. | Mediafilen refereras till i mötets material. <br><br>Dold av dig eller av MO, så den kommer *inte* bli nedladdat eller tillagd som media. |

### Skärmdumpar av mediehanteringsskärmen

{% include screenshots/manage-media.html lang=site.data.sv %}
