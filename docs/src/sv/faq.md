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

- **Media**: Download media in any of hundreds of languages available on the official website of Jehovah's Witnesses
- **App Interface**: Use M³'s interface in many different languages
- **Oberoende inställningar**: Du kan använda gränssnittet på ett språk när du laddar ner media i ett annat
- **Fallback languages**: Configure fallback languages for when media isn't available in the primary language
- **Subtitle support**: Download and display subtitles in various languages

## Installation {#installation-setup}

### :computer: How do I download and install M³? {#installation}

Download the appropriate version from the [Download page](download) and follow the steps in the [User Guide](user-guide).

### :gear: How do I set up M³ for the first time? {#first-time-setup}

M³ includes a setup wizard that guides you through the essential configuration:

1. Choose your interface language
2. Select profile type (Regular or Other)
3. Configure congregation information
4. Set up meeting schedule
5. Configure optional features like OBS integration

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
2. Configure the screen sharing shortcut that is set up in Zoom. Ensure that shortcut is "global" in Zoom's settings.
3. M³ will automatically start and stop Zoom screen sharing during media presentations

## OBS Studio Integration {#faq-obs-integration}

### :video_camera: How do I set up the OBS Studio integration? {#faq-obs-setup}

To integrate with OBS Studio:

1. Install OBS Studio and the WebSocket plugin
2. Enable OBS integration in M³ settings
3. Enter the OBS port and password
4. Configure scenes for camera, media, and images
5. Test playback

### :arrows_counterclockwise: How does automatic scene switching work? {#faq-scene-switching}

M³ automatically switches OBS scenes based on:

- Media type (video, image, etc.)
- Your scene configuration
- Settings like "Postpone Images"
- Whether to return to previous scene after media

### :pause_button: What is the "Postpone Images" feature? {#faq-postpone-images}

This feature delays sharing images to OBS until you manually trigger them. This is useful for:

- Showing images to in-person audience first
- Having more control over timing
- Avoiding premature scene changes

## Advanced Features {#faq-advanced-features}

### :cloud: How does folder monitoring work? {#faq-folder-monitoring}

Folder monitoring allows you to:

1. Select a folder to watch for new files
2. Automatically import new media files that are synced with cloud storage like Dropbox or OneDrive

### :file_folder: What is media auto-export? {#faq-media-export}

Media auto-export automatically:

1. Exports media files to a specified folder
2. Organizes files by date and section
3. Converts files to MP4 format (optional)
4. Maintains an organized backup of meeting media files

### :family: Can I manage multiple congregations? {#faq-multiple-congregations}

Yes! M³ supports multiple profiles for:

- Different congregations
- Special events
- Different groups
- Separate settings and media for each

## Troubleshooting {#faq-troubleshooting}

### :warning: Media isn't downloading. What should I check? {#faq-media-not-downloading}

Check these common issues:

1. **Meeting Schedule**: Verify your meeting days and times are correct
2. **Language Settings**: Ensure your media language is set correctly
3. **Internet Connection**: Check your internet connection
4. **Language Availability**: Verify media is available in your selected language

<!-- 5. **Manual Refresh**: Try manually refreshing to check for new media -->

### :video_camera: The OBS integration isn't working. What should I verify? {#faq-obs-not-working}

Check these OBS-related issues:

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

### :speech_balloon: I'm having language issues. What should I check? {#faq-language-issues}

Verify these language settings:

1. **Interface Language**: Check your display language setting
2. **Media Language**: Verify your media download language
3. **Language Availability**: Ensure the media language is available on the official website of Jehovah's Witnesses
4. **Fallback Language**: Try setting a fallback language

## Support and Community {#support-community}

### :radioactive: How do I report an issue? {#how-do-i-report-an-issue}

Please [file an issue](https://github.com/sircharlo/meeting-media-manager/issues) on the official GitHub repository. Include:

- Detailed description of the problem
- Steps to reproduce the issue
- Your operating system and M³ version
- Any error messages, logs and screenshots

### :new: How can I request a new feature or enhancement? {#how-can-i-request-a-new-feature-or-enhancement}

Please [open a discussion](https://github.com/sircharlo/meeting-media-manager/discussions) on the official GitHub repository. Describe:

- The feature you'd like to see
- How it would benefit users
- Any specific requirements or preferences

### :handshake: How can I contribute some code? {#how-can-i-contribute-some-code}

Please [see the contributing guide](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) on the official GitHub repository. We welcome code contributions and Pull Requests!

### :globe_with_meridians: How can I help with translations? {#translations}

M³ uses Crowdin for translation management. You can contribute translations by:

1. Visiting the [Crowdin project](https://crowdin.com/project/meeting-media-manager)
2. Selecting your language
3. Translating strings that need work
4. Reviewing existing translations

### :x: Can I make a donation to the project? {#can-i-make-a-donation-to-the-project}

Thank you for your interest in supporting the project! However, in the spirit of Matthew 10:8, donations are **not** accepted and never will be. This app was made with love and a little spare time. Please enjoy! :tada:

:::tip :book: Matthew 10:8

"You received free, give free."

:::

## Technical Questions {#technical-questions}

### :computer: What hardware and software requirements does M³ have? {#hardware-and-software-requirements}

M³ is designed to work on a wide range of operating systems:

- **Windows**: Windows 10 och senare (64-bitars och 32-bitars versioner tillgängliga)
- **macOS**: macOS 10.15 (Catalina) och senare (Intel- och Apple Silicon stöd)
- **Linux**: De flesta moderna Linuxdistributioner (AppImage format)

M³ has the following hardware requirements:

- **Minimum**: 4GB RAM, 6GB free disk space
- **Recommended**: 8GB RAM, 15GB free disk space for media caching
- **Network**: Internet connection for media downloads

Depending on the features you use, M³ also requires the following additional software:

- **Zoom**: Required only if using Zoom integration features
- **OBS Studio**: Required only if using OBS integration features

### :floppy_disk: Hur mycket diskutrymme använder M³? {#disk-space}

Användningen av diskutrymme beror på:

- **Mediarösning**: Högre upplösning använder mer utrymme
- **Cachat innehåll**: Mediefiler cachas lokalt
- **Extra cache**: Ytterligare caching kan öka användningen
- **Exporterade media**: Automatisk export funktioner använder ytterligare utrymme

Typisk användning varierar från 2-10GB beroende på inställningar och användning.

### :shield: Är M³ säker och sluten? {#security-privacy}

Yes! M³ är utformad med säkerhet och integritet i åtanke:

- **Lokal lagring**: Alla mötesdata lagras lokalt på din dator
- **Direktnedladdningar**: Media laddas ner direkt från Jehovas officiella websida
- **Öppen källkod**: Koden är öppen för granskning och verifiering
- **Felrapporter**: Begränsad mängd data samlas in för felrapporteringsändamål

### :arrows_clockwise: Hur ofta letar M³ efter uppdateringar? {#update-frequency}

M³ söker efter uppdateringar:

- **Applikationsuppdateringar**: Kontrollera automatiskt nya versioner varje gång appen öppnas
- **Media-uppdateringar**: Kontrollera automatiskt efter nya mötesmedier varje gång appen öppnas
- **Språkuppdateringar**: Dynamisk identifiering av nya språk efter behov
