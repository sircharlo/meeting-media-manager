# Veelgestelde vragen {#frequently-asked-questions}

## Algemene vragen {#general-questions}

### :earth_americas: Maakt deze applicatie gebruik van externe websites, bronnen of diensten om de publicaties en vergadering media te downloaden? {#external-dependencies}

**Nee**. De applicatie werkt hetzelfde als JW Library. De publicaties en media worden direct van de officiële website van Jehovah's Getuigen en zijn CDN gedownload. De app bepaalt automatisch wat er moet worden gedownload en wanneer eerder gedownloade inhoud niet meer up-to-date is en opnieuw moet worden gedownload.

:::info Opmerking

De broncode voor deze app is voor iedereen beschikbaar om te onderzoeken en controleren wat er onder de motorkap gebeurt.

:::

### :thinking: Schendt deze app de Gebruiksvoorwaarden van de officiële website van Jehovah's Getuigen? {#terms-of-use}

**Nee** De [gebruiksvoorwaarden](https://www.jw.org/finder?docid=1011511&prefer=content) van de officiële website van Jehovah's Getuigen staat expliciet het soort gebruik toe dat we maken. Hier is het relevante stukje van de gebruiksvoorwaarden (nadruk toegevoegd):

> Het is niet toegestaan:
>
> voor distributiedoeleinden software-applicaties, tools of technieken te ontwikkelen die specifiek worden gemaakt om gegevens, HTML, afbeeldingen of tekst van deze site te verzamelen, te kopiëren, te downloaden of te extraheren. (het is **wel** toegestaan om gratis, niet-commerciële sofware-applicaties te distribueren die ontwikkeld zijn om elektronische bestanden zoals EPUB, PDF, MP3 en MP4 te downloaden van openbare delen van deze site.)

### :question: Welke besturingssystemen ondersteunt M³? {#operating-systems}

M³ ondersteunt Windows, macOS en Linux:

- **Windows**: Windows 10 en later (64-bits- en 32-bitsversies beschikbaar)
- **macOS**: macOS 10.15 (Catalina) en later (ondersteuning voor Intel en Apple Silicon)
- **Linux**: De meeste moderne Linux-distributies (AppImage-formaat)

### :globe_with_meridians: Werkt M³ in mijn taal? {#language-support}

**Ja!** M³ biedt uitgebreide meertalige ondersteuning:

- **Media Talen**: Download media in een van de honderden talen die beschikbaar zijn op de officiële website van Jehovah’s Getuigen
- **Interface Talen**: Gebruik de interface van M³ in veel verschillende talen
- **Onafhankelijke Instellingen**: Je kunt de interface in de ene taal gebruiken terwijl je media in een andere taal downloadt

## Installatie en Setup {#installation-setup}

### :inbox_tray: Download M³ {#download}

Download de juiste versie voor jouw besturingssysteem vanaf de [releases-pagina](https://github.com/sircharlo/meeting-media-manager/releases/latest).

### :computer: Hoe installeer ik M³? {#installation}

Download de juiste versie voor jouw besturingssysteem vanaf de [releases-pagina](https://github.com/sircharlo/meeting-media-manager/releases/latest) en volg de installatie-instructies in de [installatiegids](/using-at-a-kingdom-hall#download-and-install).

### :gear: Hoe stel ik M³ voor de eerste keer in? {#first-time-setup}

M³ bevat een configuratiewizard die je door de essentiële instellingen leidt:

1. Kies je interfacetaal
2. Selecteer het profieltype (Standaard of Anders)
3. Congregatiegegevens configureren
4. Vergaderschema instellen
5. Optionele functies configureren, zoals OBS-integratie

## Mediabeheer {#faq-media-management}

### :download: Hoe downloadt M³ media? {#media-download}

M³ downloadt automatisch media voor komende vergaderingen door:

1. Je vergaderschema controleren
2. Bepalen welke media nodig is
3. Downloaden van de officiële website van Jehovah’s Getuigen in de door jou geselecteerde taal
4. Media organiseren op datum en vergadertype
5. Bestanden cachen voor offline gebruik

### :calendar: Kan ik media downloaden voor specifieke data? {#specific-dates}

Ja! Met M³ kun je:

- Media voor komende vergaderingen automatisch downloaden
- Aangepaste media importeren voor elke datum

### :folder: Hoe importeer ik mijn eigen mediabestanden? {#import-media}

Je kunt op verschillende manieren aangepaste media importeren:

- **Bestanden importeren**: Gebruik de importknop om video's, afbeeldingen of audiobestanden toe te voegen
- **Slepen en neerzetten**: Sleep bestanden direct naar M³
- **Mapbewaking**: Stel een bewaakte map in voor automatische import
- **JWPUB-bestanden en afspeellijsten**: Publicaties en afspeellijsten importeren

### :speaker: Kan ik audiobijbelopnamen importeren? {#audio-bible}

Ja! M³ bevat een Audio Bijbel-functie waarmee je:

1. Selecteer bijbelboeken en hoofdstukken
2. Kies specifieke verzen of versbereiken
3. Audio-opnamen downloaden
4. Gebruik ze tijdens de vergaderingen

## Presentatiefuncties {#faq-presentation-features}

### :tv: Hoe presenteer ik media tijdens vergaderingen? {#present-media}

Om media te presenteren:

1. Selecteer de datum
2. Klik op de afspeelknop van het media-item dat je wilt presenteren of gebruik sneltoetsen
3. Gebruik de mediabediening om het afspelen te pauzeren, te navigeren of te stoppen
4. Gebruik zoom- en panfuncties voor afbeeldingen
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

Ja! M³ supports multiple profiles for:

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

### :radioactive: Hoe kan ik een probleem melden? {#how-do-i-report-an-issue}

Maak alsjeblieft een [issue](https://github.com/sircharlo/meeting-media-manager/issues) aan op de officiële GitHub repository. Include:

- Detailed description of the problem
- Steps to reproduce the issue
- Your operating system and M³ version
- Any error messages, logs and screenshots

### :new: Hoe kan ik een nieuwe functie of verbetering aanvragen? {#how-can-i-request-a-new-feature-or-enhancement}

Maak alsjeblieft een [discussie](https://github.com/sircharlo/meeting-media-manager/discussions) aan op de officiële GitHub repository. Describe:

- The feature you'd like to see
- How it would benefit users
- Any specific requirements or preferences

### :handshake: Hoe kan ik wat code bijdragen? {#how-can-i-contribute-some-code}

Bekijk alsjeblieft de [handleiding om bij te dragen](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) op de officiële GitHub repository. We welcome code contributions and Pull Requests!

### :globe_with_meridians: How can I help with translations? {#translations}

M³ uses Crowdin for translation management. You can contribute translations by:

1. Visiting the [Crowdin project](https://crowdin.com/project/meeting-media-manager)
2. Selecting your language
3. Translating strings that need work
4. Reviewing existing translations

### :x: Kan ik doneren aan het project? {#can-i-make-a-donation-to-the-project}

Bedankt voor je interesse in het ondersteunen van het project! Echter, in de geest van Mattheüs 10:8, worden donaties **niet** geaccepteerd en dat zal ook nooit veranderen. Deze applicatie is gemaakt met liefde en beetje vrije tijd. Geniet ervan! :tada:

:::tip :book: Mattheüs 10:8

"Voor niets heb je gekregen, voor niets moet je geven."

:::

## Technical Questions {#technical-questions}

### :floppy_disk: How much disk space does M³ use? {#disk-space}

Disk space usage depends on:

- **Media Resolution**: Higher resolutions use more space
- **Cached Content**: Media files are cached locally
- **Extra Cache**: Additional caching can increase usage
- **Exported Media**: Auto-export features use additional space

Typical usage ranges from 2-10GB depending on settings and usage.

### :shield: Is M³ secure and private? {#security-privacy}

Ja! M³ is designed with security and privacy in mind:

- **Local Storage**: All meeting data is stored locally on your computer
- **Direct Downloads**: Media is downloaded directly from the official website of Jehovah's Witnesses
- **Open Source**: The code is open for review and verification
- **Bug Reports**: Limited data may be collected for bug reporting purposes

### :arrows_clockwise: How often does M³ check for updates? {#update-frequency}

M³ checks for updates:

- **Application Updates**: Automatically checks for new versions every time the app is opened
- **Media Updates**: Automatically checks for new meeting media every time the app is opened
- **Language Updates**: Dynamic detection of new languages as needed
