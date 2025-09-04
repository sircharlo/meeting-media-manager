# Användarhandbok {#user-guide}

Denna omfattande användarhandbok hjälper dig att bemästra alla funktioner i M³, från grundläggande inställning till avancerade mediavisningstekniker.

## Komma igång {#getting-started}

### Första starten {#first-launch}

När du först startar M³, kommer du att guidas genom en installationsguide som kommer att konfigurera de viktigaste inställningarna för din församling:

1. **Välj ditt gränssnittsspråk** - Detta avgör vilket språk M³:s menyer och knappar kommer att visas i
2. **Välj profiltyp** - Välj "vanlig" för normal församlingsanvändning eller "Annat" för speciella evenemang
3. **Konfigurera församlingsinformation** - Ange din församlingsinformation eller använd funktionen automatisk uppslagning
4. **Konfigurera mötestid** - Konfigurera dag oc tid för vecko- och helgmötet
5. **Valfria funktioner** - Konfigurera OBS-integration, bakgrundsmusik och andra avancerade funktioner

:::tip Tips

Låt installationen ta sin tid - men har du bråttom så kan du alltid ändra dessa inställningar senare i inställningsmenyn.

:::

### Översikt av gränssnittet {#main-interface}

Huvudgränssnittet i M³ består av flera viktiga områden:

- **Sidnavigering** - Få tillgång till olika sektioner och inställningar
- **Kalendervy** - Bläddra media efter datum
- **Medielista** - Visa och hantera media för valda datum
- **Verktygsfältet** - Snabb åtkomst till vanliga funktioner
- **Statusfält** - Visar nedladdningsförlopp, och bakgrundsmusik och OBS Studio anslutningsstatus

## Mediehantering {#user-guide-media-management}

### Förstå kalendervyn {#calendar-view}

Kalendervyn visar ditt mötesschema och tillgänglig media:

- **Mötesdagar** - Markerade dagar visas när möten är schemalagda
- **Mediaindikatorer** - Ikoner visar vilka typer av media som är tillgängliga
- **Datumnavigering** - Använd piltangenterna för att navigera mellan månader

<!-- ### Downloading Media {#downloading-media}

::: info Note

Download speed depends on your internet connection and the size of media files. Videos typically take longer to download than images.

::: -->

### Organisera media {#organizing-media}

M³ organiserar automatiskt media efter typ och mötesdel:

- **Mötesdelar** - Media grupperas efter mötesdelar (Föreläsning, Guldkorn, etc.)
- **Anpassade mötesdelar** - Du kan skapa anpassade mötesdelar för ytterligare media om inget möte är planerat den dagen

## Mediavisning {#media-presentation}

### Öppna mediaspelaren {#opening-media-player}

Att visa media under ett möte:

1. Välj datum och media som du vill visa
2. Klicka på play-knappen eller använd kortkommandot
3. Mediet kommer att börja spela upp på mediedisplayen
4. Använd kontrollerna för att spela, pausa eller navigera genom media

### Mediaspelarinställningar {#media-player-controls}

Mediaspelaren erbjuder omfattande inställningsmöjligheter:

- **Spela/Pausa** - Startar eller pausar medieuppspelning
- **Stopp** - Stoppa uppspelning

<!-- - **Previous/Next** - Navigate between media items
- **Volume** - Adjust playback volume -->

<!-- - **Fullscreen** - Toggle fullscreen mode -->

- **Zoom/Pan** - Använd mushjulet för att zooma, dra för att panorera (bilder)

### Avancerade visningsfunktioner{#advanced-presentation}

#### Anpassad tidsinställning {#custom-timing}

Ställ in anpassade start- och sluttider för media:

<!-- 1. Right-click on a media item
2. Select "Edit Timing" -->

1. Klicka på varaktigheten av en video längst upp till vänster i miniatyrbilden
2. Ange start- och sluttider
3. Spara dina ändringar

#### Zooma och panorera {#zoom-pan}

För bilder och videor:

- \*\*Zooma in/ut \*\* - Använd mushjulet eller används kontrollerna på miniatyrbilden
- **Pan** - Klicka och dra miniatyren för att flytta runt bilden
- **Återställ Zoom** - Klicka för att återgå till original zoom

#### Kortkommandon {#user-guide-keyboard-shortcuts}

Ställ in anpassade kortkommandon för snabbare åtkomst. Observera att inga kortkommandon är inställda som standard.

\*\*Inbyggda mediekontroller \*\* (när huvudfönstret är fokuserat och visar medielistan):

- **Tab/Shift+Tab** - Navigera mellan medieobjekt
- **Upp/Ner pil** - Navigera mellan medieobjekt
- **Mellanslag** - Spela/Pausa media
- **Esc** - Stoppa media

**Anpassningsbara genvägar** (när aktiverat i inställningar):

- **Mediefönster** - Öppna/stäng mediefönstret
- **Föregående/Nästa media** - Navigera mellan medieobjekt
- **Pausa/Återuppspela** - Kontrollera uppspelning av media
- **Stoppa media** - Stoppa medieuppspelning
- **Musikväxling** - Styr bakgrundsmusiken

**Note (\*):** Global shortcut - available even when the app is not focused

## Bakgrundsmusik {#user-guide-background-music}

### Ställa in bakgrundsmusik {#background-music-setup}

Bakgrundsmusik spelas automatiskt före möten och stannar vid lämplig tidpunkt:

1. **Aktivera musik** - Aktivera bakgrundsmusik i inställningarna
2. **Autostart** - Musiken startar automatiskt när M³ startar
3. **Mötesstopp** - Musiken stannar automatiskt innan mötet börjar
4. **Manuell kontroll** - Använd musikknappen i statusfältet för att starta/stoppa manuellt
5. **Omstart** - Återuppta musik efter mötet med ett klick

## Zoomintegration {#user-guide-zoom-integration}

M³ kan integreras med Zoom för automatisk skärmdelning:

1. **Aktivera integration** - Slå på Zoom-integration i inställningar
2. **Konfigurera genväg** - Ställ in kortkommandot för skärmdelning som du angett i Zoom. Se till att kryssrutan "global" är markerad i Zoom.
3. **Automatisk kontroll** - M³ växlar automatiskt skärmdelning i Zoom efter behov
4. **Manuell åsidosättning** - Du kan fortfarande manuellt styra skärmdelning med Zoom om det behövs

## OBS Studiointegration {#user-guide-obs-integration}

### Ställa in OBS Integration {#user-guide-obs-setup}

Att använda M³ med OBS Studio för hybridmöten:

1. **Installera OBS Studio** - Ladda ner och installera OBS Studio
2. **Aktivera WebSocket** - Installera WebSocket-insticksmodulen i OBS
3. **Konfigurera M³** - Ange OBS-port och lösenord i M³-inställningarna
4. **Ställ in scener** - Skapa scener för kamera, media och annat innehåll
5. **Testa** - Kontrollera att uppspelningen fungerar korrekt

### OBS Scenhantering {#obs-scene-management}

M³ växlar automatiskt OBS scener under visning:

- **Kamerascen** - Visar podiet/kameravyn
- **Mediescen** - Visar medieinnehåll
- **Bildscen** - Visar bilder (kan skjutas upp om aktiverat)
- **Automatisk växling** - Scener ändras baserat på mediatyp och inställningar

### Avancerade OBS-funktioner {#advanced-obs}

#### Skjut upp bildvisning {#user-guide-postpone-images}

Aktivera detta alternativ för att fördröja delning av bilder till OBS tills manuellt aktiveras:

1. Aktivera "Skjut upp bilder" i OBS-inställningar
2. Bilder kommer endast att delas när du klickar på knappen för att visa dem med OBS Studio. Detta är användbart för att visa bilder för åhörarna först.

#### Scenväxlingsbeteende {#user-guide-scene-switching}

Konfigurera hur M³ hanterar scenförändringar:

- **Byt efter Media** - Återvänd automatiskt till föregående scen
- **Kom ihåg föregående scen** - Återställ scenen som var aktiv innan media

### Ljudkonfiguration för hybridmöten {#audio-configuration}

När du använder M³ med OBS Studio för hybridmöten (På plats + Zoom), måste du konfigurera ljudinställningar för att säkerställa att mötesdeltagarna kan höra ev. ljud:

#### Zoom ljudinställningar {#zoom-audio-settings}

**Före varje möte måste du aktivera Original Audio i Zoom:**

1. **Öppna Zoom** och gå till Inställningar
2. **Navigera till Audio** → **Avancerat**For
3. **Aktivera "Visa mötesalternativ för att "Aktivera Original Sound""**
4. **Bocka i "Inaktivera ekodämpning"** (första kryssrutan)
5. **Bocka i "Inaktivera brusdämpning"** (andra kryssrutan)
6. **Avmarkera "Inaktivera originalljud för musiker"** (tredje kryssrutan)
7. **Innan du startar varje möte**, klicka på knappen "Original Audio" i mötets kontroller

**Alternativ: Dela datorljud**
Om Original Audio inte fungerar bra i din inställning:

1. **Innan uppspelning av media**, gå till **Avancerat** fliken i Zooms skärmdelnings alternativ
2. **Bocka i "Datorljud"**
3. **Observera**: Det här alternativet måste aktiveras varje gång du startar en ny Zoom-session

**Bästa alternativ**: Överväg att använda M³:s Zoom-integration istället för OBS Studio, eftersom den använder Zooms inbyggda skärmdelning som hanterar ljud mer sömlöst och inte kräver en komplex ljudkonfiguration.

#### Varför ljudkonfiguration är nödvändig {#why-audio-config}

M³ spelar upp media med ljud på din dator, men detta ljud överförs **inte automatiskt** via videoströmmen till OBS Studio. Detta är samma beteende du skulle uppleva med någon annan mediaspelare.

**Ljudfrågan är inte relaterad till M³** - det är en begränsning av hur OBS Studio-videoströmning fungerar med Zoom. Videoströmmen fungerar som en virtuell kamera utan ljud, precis som en webbkamera, så du måste uttryckligen konfigurera Zoom för att fånga datorns ljud. Detta innebär att din dator har två ljudkort, och om inte kommer du förmodligen inte att kunna använda OBS Studio-integrationen framgångsrikt.

**Alternativ lösning**: Överväg att använda Zoomintegrationen istället, eftersom den använder Zooms inbyggda skärm och ljuddelning, som hanterar ljudet mer sömlöst.

#### Felsökning av ljudproblem {#audio-troubleshooting}

**Vanliga problem:**

- **Inget ljud i Zoom**: Kontrollera om Original Audio är aktiverat och korrekt konfigurerat
- **Dålig ljudkvalitet**: Verifiera de tre kryssrutorna för Original Audio är korrekt inställda
- **Ljud fungerar inte efter omstart av zoom**: Ursprungliga ljudinställningar måste vara aktiverade igen för varje ny Zoom-session

**Bästa praxis:**

- Testa ljudkonfiguration och delning innan mötet
- Skapa en checklista för ljudinställningar
- Överväg att använda "Dela datorljud" som backup
- **Överväg att använda Zoom-integration istället för OBS Studio** för enklare ljudhantering
- Se till att alla som sköter ljud/media känner till dessa inställningar

## Importera och hantera media {#media-import}

### Importera anpassad media {#importing-custom-media}

Lägg till dina egna mediefiler till M³:

1. **Filimport** - Använd importknappen för att lägga till videor, bilder eller ljudfiler
2. **Dra och släpp** - Dra filer direkt till M³
3. **Mappövervakning**: Ställ in en bevakad mapp för automatisk import
4. **JWPUB-filer och spellistor**: Importera publikationer och spellistor

### Hantera importerad media {#managing-imported-media}

- **Organisera efter datum** - Tilldela importerad media till specifika datum
- **Anpassade sektioner** - Skapa anpassade sektioner för bättre organisering
- **Redigera egenskaper** - Ändra rubriker, beskrivningar och timing
- **Ta bort media** - Ta bort oönskade medieobjekt

### Importera ljudbibeln {#audio-bible-import}

Importera ljudinspelningar av Bibelverser:

1. Klicka på knappen "Ljudbibel"
2. Välja Bibelbok och kapitel
3. Välj specifika verser eller versintervall
4. Ladda ner ljudfilerna
5. Använd dem

## Mappbevakning och export {#user-guide-folder-monitoring}

### Ställa in mappbevakning {#folder-monitoring-setup}

Bevaka en mapp för nya mediefiler:

1. **Aktivera mappbevakning** - Slå på mappbevakning i inställningar
2. **Välj mapp** - Välj den mapp som ska bevakas
3. **Automatisk import** - Nya filer läggs automatiskt till i M³
4. **Organiserat** - Filerna organiseras efter datum baserat på mappstrukturen

### Mediaexport {#user-guide-media-export}

Exportera media automatiskt till organiserade mappar:

1. **Aktivera automatisk export** - Slå på mediaexport i inställningar
2. **Välj exportera mapp** - Välj var du vill spara exporterade filer
3. **Automatisk organisering** - Filer organiseras efter datum och mötesdel
4. **Formatalternativ** - Konvertera filer till MP4 för bättre kompatibilitet

## Visning av websida {#website-presentation}

### Visa den officiella websidan {#presenting-the-website}

Dela den officiella websidan på externa skärmar:

1. **Öppna i webläget** - Klicka på visningsknappen för websidan
2. **Extern skärm** - Websidan öppnas i ett nytt fönster
3. **Navigering** - Använd webbläsarkontrollerna för att navigera

### Webinställningar {#website-controls}

- **Navigering** - Vanliga webbläsarkontroller
- **Uppdatera** - Ladda om den aktuella sidan
- **Stäng** - Avsluta websidan visningsläge

## Avancerade funktioner {#user-guide-advanced-features}

### Flera församlingar {#user-guide-multiple-congregations}

Hantera flera församlingar eller grupper:

1. **Skapa profiler** - Ställ in separata profiler för olika församlingar
2. **Växla profiler** - Använd församlingsväljaren för att växla mellan profiler
3. **Separata inställningar** - Varje profil har sina egna inställningar och media
4. **Delade resurser** - Mediefiler delas mellan profiler när det är möjligt

### Kortkommandon {#keyboard-shortcuts-guide}

Ställ in anpassade kortkommandon för snabbare åtkomst:

1. **Aktivera genvägar** - Aktivera kortkommandon i inställningarna
2. **Konfigurera genvägar** - Ställ in genvägar för vanliga åtgärder
3. **Öva** - Lär dig dina genvägar för snabbare hantering
4. **Anpassa** - Justera genvägar för att passa dina behov

## Felsökning {#troubleshooting-guide}

### Vanliga problem {#common-issues}

#### Media laddas inte ner {#user-guide-media-not-downloading}

- Kontrollera dina inställningar för mötesschemat
- Verifiera internetanslutning
- Kontrollera om media är tillgängligt på ditt valda språk

#### OBS Integrationen fungerar inte {#user-guide-obs-not-working}

- Verifiera att OBS WebSocket plugin är installerad
- Kontrollera port- och lösenordsinställningar
- Kontrollera att OBS körs

#### Ljudproblem i Zoom/OBS {#audio-issues}

- **Inget ljud i Zoom**: Aktivera Original Audio i Zoom-inställningarna och före varje möte
- **Dålig ljudkvalitet**: Kontrollera de tre ursprungliga ljudrutorna (första två aktiverade, tredje inaktiverade)
- **Ljud fungerar inte efter omstart av zoom**: Ursprungliga ljudinställningar måste vara aktiverade igen för varje ny Zoom-session
- **Alternativ lösning**: Använd alternativet "Dela datorljud" i Zoom skärmdelning

#### Prestandaproblem {#user-guide-performance-issues}

- Aktivera extra cache
- Minska maximal upplösning
- Rensa gamla cachade filer
- Kontrollera tillgängligt diskutrymme

#### Språkproblem {#user-guide-language-issues}

- Kontrollera inställningar för mediaspråk
- Se till att språket är tillgängligt på JW.org
- Prova ett reservspråk
- Verifiera dessa språkinställningar

### Få hjälp {#getting-help}

Om du stöter på problem:

1. **Kontrollera dokumentation** - Granska denna guide och annan tillgänglig dokumentation
2. **Sökproblem** - Leta efter liknande ärenden på GitHub
3. **Rapportera problem** - Skapa ett nytt ärende med detaljerad information

## Bästa praxis {#best-practices}

### Före möten {#before-meetings}

1. **Kontrollera nerladdningar** - Se till att alla medier är hämtade
2. **Testa utrustningen** - Verifiera bildskärmar och ljudarbeten
3. **Förbered Media** - Granska och organisera media för mötet, se till att inga mediefiler saknas
4. **Konfigurera Audio** - För hybridmöten, aktivera Original Audio i Zoom eller konfigurera "Dela datorljud"

### Under möten {#during-meetings}

1. **Håll dig fokuserad** - Använd det rena och störningsfria gränssnittet
2. **Använd genvägar** - Använd tangentbordsgenvägar för en smidig drift
3. **Övervaka Audio** - Håll ett öga på volymnivåerna, om det är en del av ditt ansvar
4. **Förbered dig** - Ha nästa medieobjekt redo
5. **Verifiera ljud** - För hybridmöten, se till att zoomdeltagarna kan höra media

### Efter möten {#after-meetings}

1. **Starta bakgrundsmusik** - Starta uppspelning av bakgrundsmusik
2. **Planera framåt** - Förbered dig för nästa möte genom att se till att allt är på plats
3. **Städa upp** - Stäng mediaspelaren när du är redo att lämna

### Regelbundet underhåll {#regular-maintenance}

1. **Uppdatera M³** - Håll programmet uppdaterat
2. **Rensa cache** - Rensa gamla cachade filer regelbundet
3. **Kontrollera inställningar** - Granska och uppdatera inställningarna efter behov
