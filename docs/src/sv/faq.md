# Vanliga frågor {#frequently-asked-questions}

## Allmänna frågor {#general-questions}

### :earth_americas: Är den här appen beroende av externa sajter eller källor för att ladda ner publikationer och mötesmedia? {#external-dependencies}

**Nej.** Appen beter sig på samma sätt som JW Library. Den laddar ner publikationer och media direkt från Jehovas vittnens officiella hemsida. Appen bestämmer automatiskt vad som behöver laddas ner och när tidigare hämtat innehåll inte längre är uppdaterat och ska laddas ner.

:::info Info

Källkoden för denna app är tillgänglig för alla att undersöka och verifiera vad som händer under huven.

:::

### :thinking: Kränker denna app användningsvillkoren för Jehovas vittnens officiella hemsida? {#terms-of-use}

**Nej.** [Användarvillkor](https://www.jw.org/finder?docid=1011511&prefer=content) på Jehovas officiella hemsida tillåter uttryckligen den typ av användning som vi gör. Här är ett utdrag från dessa villkor (fetstilt av mig):

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

- **Mediaspråk**: Ladda ner media på något av hundratals språk som finns på Jehovas officiella hemsida
- **Gränssnittsspråk**: Använd M³:s gränssnitt på många olika språk
- **Oberoende inställningar**: Du kan använda gränssnittet på ett språk när du laddar ner media i ett annat

## Installation {#installation-setup}

### :computer: Hur installerar jag M³? {#installation}

Ladda ner lämplig version för ditt operativsystem från [releasessidan](https://github.com/sircharlo/meeting-media-manager/releases/latest) och följ installationsinstruktionerna i [installationsguiden](/using-at-a-kingdom-hall#download-and-install).

### :gear: Hur ställer jag in M³ för första gången? {#first-time-setup}

M³ innehåller en installationsguide som guidar dig genom den viktiga konfigurationen:

1. Språk för användargränssnitt
2. Välj profiltyp (ordinarie eller annat)
3. Konfigurera församlingsinformation
4. Ställ in mötesschema
5. Konfigurera valfria funktioner såsom OBS-integration

## Media Management {#faq-media-management}

### :download: How does M³ download media? {#media-download}

M³ automatically downloads media for upcoming meetings by:

1. Checking your meeting schedule
2. Determining what media is needed
3. Downloading from the official website of Jehovah's Witnesses in your selected language
4. Organizing media by date and meeting type
5. Caching files for offline use

### :calendar: Can I download media for specific dates? {#specific-dates}

Yes! M³ allows you to:

- Download media for upcoming meetings automatically
- Import custom media for any date

### :folder: How do I import my own media files? {#import-media}

You can import custom media in several ways:

- **File Import**: Use the import button to add videos, images, or audio files
- **Drag and Drop**: Drag files directly into M³
- **Folder Monitoring**: Set up a watched folder for automatic imports
- **JWPUB Files and Playlists**: Import publications and playlists

### :speaker: Can I import audio Bible recordings? {#audio-bible}

Yes! M³ includes an Audio Bible feature that allows you to:

1. Select Bible books and chapters
2. Choose specific verses or verse ranges
3. Download audio recordings
4. Use them at the meetings

## Presentation Features {#faq-presentation-features}

### :tv: How do I present media during meetings? {#present-media}

To present media:

1. Select the date
2. Click the play button on the media item you want to present or use keyboard shortcuts
3. Use the media player controls to pause, navigate, or stop playback
4. Use zoom/pan features for images
5. Set custom timing if needed

### :keyboard: What keyboard shortcuts are available? {#faq-keyboard-shortcuts}

M³ supports customizable keyboard shortcuts for:

- Opening/closing media window
- Previous/next media navigation
- Play/pause/stop controls
- Background music toggle

<!-- - Fullscreen mode -->

### :music: How does background music work? {#faq-background-music}

Background music features include:

- Automatic playback when M³ starts, before the meeting begins
- Automatic stop before meetings begin
- One-click restart after meetings
- Independent volume control
- Configurable stop buffer time

### :video_camera: How do I set up the Zoom integration? {#zoom-setup}

To integrate with Zoom:

1. Enable Zoom integration in M³ settings
2. Configure the screen sharing shortcut that is set up in Zoom. Se till att genvägen är "global" i Zooms inställningar.
3. M³ startar och stoppar automatiskt Zoom-skärmdelning under mediapresentationer

## OBS Studio Integration {#faq-obs-integration}

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

Yes! M³ stöder flera profiler för:

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

1. **OBS Installation**: Ensure OBS Studio is installed and running
2. **WebSocket Plugin**: Verify the WebSocket plugin is installed
3. **Port and Password**: Check your OBS port and password settings
4. **Firewall**: Ensure the firewall isn't blocking the connection

### :speaker: Does Meeting Media Manager automatically send the media audio to Zoom when using OBS Studio? {#audio-to-zoom}

**No.** M³ does not automatically send media audio to Zoom or OBS Studio. The video stream works like a virtual camera with no sound, just like a webcam. To have the music/video sound available in Zoom automatically, you need to ensure that Zoom 'hears' the audio feed coming from the computer, and then you should enable the **Original Audio** setting in Zoom.

**Important Notes:**

- You must enable Original Audio **every time** before starting a Zoom meeting
- This setting is not related to M³ - you would face the same audio issue when using any other media player and not using Zoom's screen and audio sharing features
- The Original Audio setting has three sub-options - typically the first two should be enabled and the third disabled for optimal audio quality
- If you're still experiencing audio issues, you may need to use Zoom's "Share Computer Sound" option instead
- Alternatively, look into using the Zoom integration instead, as it uses Zoom's native screen sharing.

**Why is this necessary?**
M³ plays media with sound on your computer, but this audio is not automatically transmitted through the video stream to Zoom when using OBS Studio. The Original Audio setting allows Zoom to capture the audio playing on your computer during screen sharing, if your computer is configured properly (for example: the computer has a second sound card that is used for media playback which Zoom listens to as a microphone.)

### :snail: M³ is running slowly. How can I improve performance? {#performance-issues}

Try these performance optimizations:

1. **Enable Extra Cache**: Turn on additional caching in settings
2. **Close Other Apps**: Close unnecessary applications
3. **Check Disk Space**: Ensure you have sufficient free disk space
4. **Reduce Resolution**: Lower the maximum resolution setting

### :speech_balloon: I'm having language issues. Vad ska jag kontrollera? {#faq-language-issues}

Verify these language settings:

1. **Interface Language**: Check your display language setting
2. **Media Language**: Verify your media download language
3. **Language Availability**: Ensure the media language is available on the official website of Jehovah's Witnesses
4. **Fallback Language**: Try setting a fallback language

## Support and Community {#support-community}

### :radioactive: Hur rapporterar jag ett problem? {#how-do-i-report-an-issue}

Vänligen skicka in en [issue](https://github.com/sircharlo/meeting-media-manager/issues) på det officiella GitHub-repositoriet. Include:

- Detailed description of the problem
- Steps to reproduce the issue
- Your operating system and M³ version
- Any error messages, logs and screenshots

### :new: Hur kan jag önska en ny funktion eller förbättring? {#how-can-i-request-a-new-feature-or-enhancement}

Vänligen öppna en [discussion](https://github.com/sircharlo/meeting-media-manager/diskussioner) på det officiella GitHub-repositoriet. Describe:

- The feature you'd like to see
- How it would benefit users
- Any specific requirements or preferences

### :handshake: Hur kan jag bidra med kodning? {#how-can-i-contribute-some-code}

[Se hur du kan bidra på] (https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) på det officiella GitHub-repositoriet. We welcome code contributions and Pull Requests!

### :globe_with_meridians: How can I help with translations? {#translations}

M³ uses Crowdin for translation management. You can contribute translations by:

1. Visiting the [Crowdin project](https://crowdin.com/project/meeting-media-manager)
2. Selecting your language
3. Translating strings that need work
4. Reviewing existing translations

### :x: Kan jag donera till projektet? {#can-i-make-a-donation-to-the-project}

Tack för ditt intresse för att stötta projektet! Men enligt tanken i Matteus 10:8 är donationer **inte** accepterade och kommer aldrig att bli det. Denna program är gjord med mycket kärlek och lite fritid. Njut! :tada:

:::tip :book: Matteus 10:8

"Det ni fått som gåva ska ni ge som gåva"

:::

## Technical Questions {#technical-questions}

### :floppy_disk: How much disk space does M³ use? {#disk-space}

Disk space usage depends on:

- **Mediarösning**: Högre upplösning använder mer utrymme
- **Cachat innehåll**: Mediefiler cachas lokalt
- **Extra cache**: Ytterligare caching kan öka användningen
- **Exporterade media**: Automatisk export funktioner använder ytterligare utrymme

Typisk användning varierar från 2-10GB beroende på inställningar och användning.

### :shield: Är M³ säker och sluten? {#security-privacy}

Yes! M³ är utformad med säkerhet och integritet i åtanke:

- **Lokal lagring**: Alla mötesdata lagras lokalt på din dator
- **Direktnedladdningar**: Media laddas ner direkt från Jehovas officiella hemsida
- **Öppen källkod**: Koden är öppen för granskning och verifiering
- **Felrapporter**: Begränsad mängd data samlas in för felrapporteringsändamål

### :arrows_clockwise: Hur ofta letar M³ efter uppdateringar? {#update-frequency}

M³ söker efter uppdateringar:

- **Applikationsuppdateringar**: Kontrollera automatiskt nya versioner varje gång appen öppnas
- **Media-uppdateringar**: Kontrollera automatiskt efter nya mötesmedier varje gång appen öppnas
- **Språkuppdateringar**: Dynamisk identifiering av nya språk efter behov
