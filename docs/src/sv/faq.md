# Vanliga frågor {#frequently-asked-questions}

## Allmänna frågor {#general-questions}

### :earth_americas: Är den här appen beroende av externa sajter eller källor för att ladda ner publikationer och mötesmedia? {#external-dependencies}

**Nej.** Appen beter sig på samma sätt som JW Library. Den laddar ner publikationer och media direkt från Jehovas vittnens officiella websida. Appen bestämmer automatiskt vad som behöver laddas ner och när tidigare hämtat innehåll inte längre är uppdaterat och ska laddas ner.

:::info Info

Källkoden för denna app är tillgänglig för alla att undersöka och verifiera vad som händer under huven.

:::

### :thinking: Kränker denna app användningsvillkoren för Jehovas vittnens officiella websida? {#terms-of-use}

**Nej.** [Användarvillkor](https://www.jw.org/finder?docid=1011511&prefer=content) på Jehovas officiella websida tillåter uttryckligen den typ av användning som vi gör. Här är ett utdrag från dessa villkor (fetstilt av mig):

> Du får inte:
>
> Skapa eller distribuera programvaror, verktyg eller tekniker som är utformade för att samla in, kopiera, ladda ner, extrahera, utvinna eller skrapa data, html, bilder eller text från den här webbplatsen. (Det här förbjuder **inte** distribuering av gratis, icke-kommersiella program som laddar ner digitala filer i format som epub, pdf, mp3 och mp4 från allmänna delar av den här webbplatsen.)

### :question: Vilka operativsystem stödjer M³? {#operating-systems}

M³ stöder Windows, macOS och Linux:

- **Windows**: Windows 10 och senare (64-bitars och 32-bitars versioner tillgängliga)
- **macOS**: macOS 10.15 (Catalina) och senare (Intel- och Apple Silicon stöd)
- **Linux**: De flesta moderna Linuxdistributioner (AppImage format)

### :globe_with_meridians: Fungerar M³ på mitt språk? {#language-support}

**Ja!** M³ ger omfattande stöd för flera språk:

- **Mediaspråk**: Ladda ner media på något av hundratals språk som finns på Jehovas officiella websida
- **Gränssnittsspråk**: Använd M³:s gränssnitt på många olika språk
- **Oberoende inställningar**: Du kan använda gränssnittet på ett språk när du laddar ner media i ett annat

## Installation {#installation-setup}

### :computer: Hur installerar jag M³? {#installation}

Ladda ner lämplig version för ditt operativsystem från [releasessidan](https://github.com/sircharlo/meeting-media-manager/releases/latest) och följ installationsinstruktionerna i [installationsguiden](/using-at-a-kingdom-hall#download-and-install).

### :gear: Hur ställer jag in M³ för första gången? {#first-time-setup}

M³ innehåller en installationsguide som guidar dig genom den viktiga konfigurationen:

1. Språk för användargränssnitt
2. Välj profiltyp (vanlig eller annan)
3. Konfigurera församlingsinformation
4. Ställ in mötesschema
5. Konfigurera valfria funktioner såsom OBS-integration

## Mediehantering {#faq-media-management}

### :download: Hur laddar M³ ner media? {#media-download}

M³ laddar automatiskt ner media för kommande möten genom att:

1. Kontrollera ditt mötesschema
2. Fastställer vilka medier som behövs
3. Ladda ner från den officiella websidan för Jehovas vittnen på ditt valda språk
4. Organiserar media efter datum och mötestyp
5. Cachning av filer för offline-användning

### :calendar: Kan jag ladda ner media för specifika datum? {#specific-dates}

Ja! M³ låter dig:

- Ladda ner media för kommande möten automatiskt
- Importera anpassat media för valfritt datum

### :folder: Hur importerar jag mina egna mediefiler? {#import-media}

Du kan importera anpassade medier på flera sätt:

- **Filimport**: Använd importknappen för att lägga till videor, bilder eller ljudfiler
- **Dra och släpp**: Dra filer direkt till M³
- **Mappövervakning**: Ställ in en bevakad mapp för automatisk import
- **JWPUB-filer och spellistor**: Importera publikationer och spellistor

### :speaker: Kan jag importera bibelinspelningar? {#audio-bible}

Ja! M³ innehåller en ljudbibel funktion som låter dig att:

1. Välja bibelböcker och kapitel
2. Välj specifika verser eller versintervall
3. Ladda ner ljudinspelning
4. Använd dem på mötena

## Visningsfunktioner {#faq-presentation-features}

### :tv: Hur visa jag media under mötena? {#present-media}

För att visa media:

1. Välj ett datum
2. Klicka på play-knappen på det medieobjekt du vill visa eller använd kortkommandot
3. Använd mediaspelarkontrollerna för att pausa, navigera eller stoppa uppspelning
4. Använd zoom/panorering för bilder
5. Ange anpassad tid om det behövs

### :keyboard: Vilka kortkommandon finns tillgängliga? {#faq-keyboard-shortcuts}

M³ stöder anpassningsbara kortkommandon för:

- Öppna/stänga mediafönster
- Föregående/nästa mediasavigering
- Spela/pausa/stoppa kontroller
- Växla bakgrundsmusik

<!-- - Fullscreen mode -->

### :music: Hur fungerar bakgrundsmusiken? {#faq-background-music}

Bakgrundsmusik funktioner inkluderar:

- Automatisk uppspelning när M³ startar, innan mötet börjar
- Automatisk stopp innan möten börjar
- Omstart med ett klick efter möten
- Oberoende volymkontroll
- Konfigurerbar stoppbufferttid

### :video_camera: Hur ställer jag in Zoomintegrationen? {#zoom-setup}

Integrera med Zoom:

1. Aktivera Zoom-integration i M³-inställningar
2. Konfigurera genvägen för skärmdelning som är konfigurerad i Zoom. Se till att genvägen är "global" i Zooms inställningar.
3. M³ startar och stoppar automatiskt Zoom-skärmdelning under mediavisning

## OBS Studiointegration {#faq-obs-integration}

### :video_camera: Hur ställer jag in OBS Studio-integrationen? {#faq-obs-setup}

Integrera M³ med OBS Studio:

1. Installera OBS Studio och WebSocket-pluginen
2. Aktivera OBS-integration i inställningarna för M³
3. Ange OBS port och lösenord
4. Konfigurera scener för kamera, media och bilder
5. Testa uppspelning

### :arrows_counterclockwise: Hur fungerar automatisk byte av scen? {#faq-scene-switching}

M³ växlar automatiskt OBS scener baserade på:

- Mediatyp (video, bild, etc.)
- Din scenkonfiguration
- Inställningar som "Skjut upp bilder"
- Om du vill återvända till föregående scen efter media

### :pause_button: Vad är funktionen "Skjut upp bilder"? {#faq-postpone-images}

Denna funktion försenar delning av bilder till OBS tills du manuellt utlöser dem. Detta är användbart för:

- Visar bilder för åhörarna i Rikets sal först
- Mer kontroll över timing
- Undvika för tidiga scenförändringar

## Avancerade funktioner {#faq-advanced-features}

### :cloud: Hur fungerar mappövervakning? {#faq-folder-monitoring}

Mappövervakning låter dig att:

1. Välj en mapp att bevaka för nya filer
2. Importera automatiskt nya mediefiler som synkroniseras med molnlagring som Dropbox eller OneDrive

### :file_folder: Vad är automatisk mediaexport? {#faq-media-export}

Automatisk media-export automatiskt:

1. Exporterar mediefiler till en angiven mapp
2. Organiserar filer efter datum och avsnitt
3. Konverterar filer till MP4-format (valfritt)
4. Upprätthåller en organiserad säkerhetskopiering av mötesmediefiler

### :family: Kan jag hantera flera församlingar? {#faq-multiple-congregations}

Ja! M³ stöder flera profiler för:

- Olika församlingar
- Särskilda händelser
- Olika grupper
- Separata inställningar och media för varje

## Felsökning {#faq-troubleshooting}

### :warning: Media laddas inte ned. Vad ska jag kontrollera? {#faq-media-not-downloading}

Kontrollera dessa vanliga problem:

1. **Mötesschema**: Kontrollera att dina mötesdagar och mötestider är korrekta
2. **Språkinställningar**: Se till att ditt mediaspråk är korrekt inställt
3. **Internetanslutning**: Kontrollera din internetanslutning
4. **Språktillgänglighet**: Verifiera media är tillgängligt på ditt valda språk

<!-- 5. **Manual Refresh**: Try manually refreshing to check for new media -->

### :video_camera: OBS-integrationen fungerar inte. Vad ska jag kontrollera? {#faq-obs-not-working}

Kontrollera dessa OBS-relaterade problem:

1. **OBS Installation**: Se till att OBS Studio är installerat och körs
2. **WebSocket Plugin**: Verifiera WebSocket plugin är installerad
3. **Port och Lösenord**: Kontrollera inställningarna för OBS port och lösenord
4. **Brandvägg**: Se till att brandväggen inte blockerar anslutningen

### :speaker: Skickar Meeting Media Manager automatiskt medieljud till Zoom när du använder OBS Studio? {#audio-to-zoom}

**Nej.** M³ skickar inte automatiskt medialjud till Zoom eller OBS Studio. Videoströmmen fungerar som en virtuell kamera utan ljud, precis som en webbkamera. För att automatiskt ha musik/videoljudet tillgängligt i Zoom, måste du se till att Zoom "hör" ljudflödet som kommer från datorn. och sedan bör du aktivera **Original Audio**-inställningen i Zoom.

**Viktigt:**

- Du måste aktivera Original Audio **varje gång** innan du startar ett Zoom-möte
- Den här inställningen är inte relaterad till M³ - du skulle möta samma ljudproblem när du använder någon annan mediaspelare och inte använder Zooms skärm- och ljuddelningsfunktioner
- Den ursprungliga ljudinställningen har tre delalternativ - typiskt de två första bör aktiveras och den tredje inaktiverade för optimal ljudkvalitet
- Om du fortfarande upplever ljudproblem, kan du behöva använda Zooms "Dela datorns ljud" alternativ istället
- Alternativt, titta in i att använda Zoom-integrationen istället, eftersom den använder Zooms inbyggda skärmdelning.

\*\*Varför är detta nödvändigt? \*
M³ spelar upp media med ljud på datorn, men detta ljud överförs inte automatiskt genom videoströmmen till Zoom när du använder OBS Studio. Med den ursprungliga ljudinställningen kan Zoom spela in ljudet på din dator under skärmdelning, om din dator är korrekt konfigurerad (till exempel: datorn har ett andra ljudkort som används för medieuppspelning som Zoom lyssnar på som mikrofon.)

### :snail: M³ går långsamt. Hur kan jag förbättra prestandan? {#performance-issues}

Prova dessa prestandaoptimeringar:

1. **Aktivera extra cache**: Slå på ytterligare cachelagring i inställningarna
2. **Stäng andra appar**: Stäng onödiga applikationer
3. **Kontrollera diskutrymme**: Se till att du har tillräckligt med ledigt diskutrymme
4. **Minska upplösning**: Sänk inställningen för maximal upplösning

### :speech_balloon: Jag har språkproblem. Vad ska jag kontrollera? {#faq-language-issues}

Verifiera dessa språkinställningar:

1. **Gränssnittsspråk**: Kontrollera dina inställningar för visningsspråk
2. **Mediespråk**: Verifiera ditt medianedladdningsspråk
3. **Språktillgänglighet**: Se till att mediespråket finns tillgängligt på Jehovas Vittnens officiella websida
4. **Fallback Språk**: Försök att ställa in ett reservspråk

## Stöd {#support-community}

### :radioactive: Hur rapporterar jag ett problem? {#how-do-i-report-an-issue}

Vänligen skicka in en [issue](https://github.com/sircharlo/meeting-media-manager/issues) på det officiella GitHub-repositoriet. Inklusive:

- Detaljerad beskrivning av felet
- Steg för att reproducera problemet
- Ditt operativsystem och version M³
- Eventuella felmeddelanden, loggar och skärmdumpar

### :new: Hur kan jag önska en ny funktion eller förbättring? {#how-can-i-request-a-new-feature-or-enhancement}

Vänligen öppna en [discussion](https://github.com/sircharlo/meeting-media-manager/diskussioner) på det officiella GitHub-repositoriet. Beskriv:

- Funktionen du vill se
- Hur det skulle gynna användare
- Specifika krav eller preferenser

### :handshake: Hur kan jag bidra med kodning? {#how-can-i-contribute-some-code}

[Se hur du kan bidra på] (https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) på det officiella GitHub-repositoriet. Vi välkomnar kodbidrag och Pull-förfrågningar!

### :globe_with_meridians: Hur kan jag hjälpa till med översättningen? {#translations}

M³ använder Crowdin för översättningshantering. Du kan bidra med översättningar genom att:

1. Besöka [Crowdin-projektet](https://crowdin.com/project/meeting-media-manager)
2. Välj ditt språk
3. Översätt de strängar som behöver förbättras
4. Granska befintliga översättningar

### :x: Kan jag donera till projektet? {#can-i-make-a-donation-to-the-project}

Tack för ditt intresse för att stötta projektet! Men enligt tanken i Matteus 10:8 är donationer **inte** accepterade och kommer aldrig att bli det. Denna program är gjord med mycket kärlek och lite fritid. Njut! :tada:

:::tip :book: Matteus 10:8

"Det ni fått som gåva ska ni ge som gåva"

:::

## Tekniska frågor {#technical-questions}

### :floppy_disk: Hur mycket diskutrymme använder M³? {#disk-space}

Användningen av diskutrymme beror på:

- **Mediarösning**: Högre upplösning använder mer utrymme
- **Cachat innehåll**: Mediefiler cachas lokalt
- **Extra cache**: Ytterligare caching kan öka användningen
- **Exporterade media**: Automatisk export funktioner använder ytterligare utrymme

Typisk användning varierar från 2-10GB beroende på inställningar och användning.

### :shield: Är M³ säker och sluten? {#security-privacy}

Ja! M³ är utformad med säkerhet och integritet i åtanke:

- **Lokal lagring**: Alla mötesdata lagras lokalt på din dator
- **Direktnedladdningar**: Media laddas ner direkt från Jehovas officiella websida
- **Öppen källkod**: Koden är öppen för granskning och verifiering
- **Felrapporter**: Begränsad mängd data samlas in för felrapporteringsändamål

### :arrows_clockwise: Hur ofta letar M³ efter uppdateringar? {#update-frequency}

M³ söker efter uppdateringar:

- **Applikationsuppdateringar**: Kontrollera automatiskt nya versioner varje gång appen öppnas
- **Media-uppdateringar**: Kontrollera automatiskt efter nya mötesmedier varje gång appen öppnas
- **Språkuppdateringar**: Dynamisk identifiering av nya språk efter behov
