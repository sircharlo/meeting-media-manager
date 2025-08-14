# Pogosto zastavljena vprašanja {#frequently-asked-questions}

## General Questions {#general-questions}

### :earth_americas: Ali je ta program odvisen od zunanjih spletnih mest, virov ali „skrbnikov“ za prenašanje publikacij, multimedijske vsebine za shode ali drugih vsebin? {#external-dependencies}

**Ne.** Program se obnaša podobno kot JW Library. Publikacije, multimedijsko vsebino in drugo prenaša neposredno z uradnega spletnega mesta Jehovovih prič in njegovega omrežja za dostavo vsebin. Program samodejno ugotovi, kaj je treba prenesti in kdaj predhodno prenesena vsebina ni več posodobljena in jo je treba zato ponovno prenesti.

:::info Opomba

Izvorna koda tega programa je na voljo vsem, da jo lahko preučijo in preverijo, kaj se dogaja pod pokrovom.

:::

### :thinking: Ali ta program krši pogoje uporabe uradnega spletnega mesta Jehovovih prič? {#terms-of-use}

**Ne.** [Pogoji uporabe](https://www.jw.org/finder?docid=1011511&prefer=content) uradnega spletnega mesta Jehovovih prič izrecno dovoljujejo takšno uporabo, kot jo izvajamo mi. Navajamo odlomek iz teh pogojev (poudarili mi):

> Ni vam dovoljeno:
>
> z namenom razširjanja razviti kakršne koli aplikacije programske opreme, orodja ali tehnike, ki je namensko narejena za zbiranje, kopiranje, prenašanje, izvlačenje, nabiranje ali luščenje podatkov, HTML-ja, slik ali besedila s tega spletnega mesta (to **ne** prepoveduje razširjanja brezplačnih, nekomercialnih aplikacij, ki so namenjene prenašanju elektronskih datotek, na primer datotek EPUB, PDF, MP3 in MP4, z javno dostopnih strani tega spletnega mesta)

### :question: What operating systems does M³ support? {#operating-systems}

M³ supports Windows, macOS, and Linux:

- **Windows**: Windows 10 and later (64-bit and 32-bit versions available)
- **macOS**: macOS 10.15 (Catalina) and later (Intel and Apple Silicon support)
- **Linux**: Most modern Linux distributions (AppImage format)

### :globe_with_meridians: Does M³ work in my language? {#language-support}

**Yes!** M³ provides comprehensive multi-language support:

- **Media Languages**: Download media in any of hundreds of languages available on the official website of Jehovah's Witnesses
- **Interface Languages**: Use M³'s interface in many different languages
- **Independent Settings**: You can use the interface in one language while downloading media in another

## Installation and Setup {#installation-setup}

### :computer: How do I install M³? {#installation}

Download the appropriate version for your operating system from the [releases page](https://github.com/sircharlo/meeting-media-manager/releases/latest) and follow the installation instructions in the [setup guide](/using-at-a-kingdom-hall#download-and-install).

### :gear: How do I set up M³ for the first time? {#first-time-setup}

M³ includes a setup wizard that guides you through the essential configuration:

1. Choose your interface language
2. Select profile type (Regular or Other)
3. Configure congregation information
4. Set up meeting schedule
5. Configure optional features like OBS integration

## Media Management {#media-management}

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

## Presentation Features {#presentation-features}

### :tv: How do I present media during meetings? {#present-media}

To present media:

1. Select the date
2. Click the play button on the media item you want to present or use keyboard shortcuts
3. Use the media player controls to pause, navigate, or stop playback
4. Use zoom/pan features for images
5. Set custom timing if needed

### :keyboard: What keyboard shortcuts are available? {#keyboard-shortcuts}

M³ supports customizable keyboard shortcuts for:

- Opening/closing media window
- Previous/next media navigation
- Play/pause/stop controls
- Background music toggle

<!-- - Fullscreen mode -->

### :music: How does background music work? {#background-music}

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

## OBS Studio Integration {#obs-integration}

### :video_camera: How do I set up the OBS Studio integration? {#obs-setup}

To integrate with OBS Studio:

1. Install OBS Studio and the WebSocket plugin
2. Enable OBS integration in M³ settings
3. Enter the OBS port and password
4. Configure scenes for camera, media, and images
5. Test playback

### :arrows_counterclockwise: How does automatic scene switching work? {#scene-switching}

M³ automatically switches OBS scenes based on:

- Media type (video, image, etc.)
- Your scene configuration
- Settings like "Postpone Images"
- Whether to return to previous scene after media

### :pause_button: What is the "Postpone Images" feature? {#postpone-images}

This feature delays sharing images to OBS until you manually trigger them. This is useful for:

- Showing images to in-person audience first
- Having more control over timing
- Avoiding premature scene changes

## Advanced Features {#advanced-features}

### :cloud: How does folder monitoring work? {#folder-monitoring}

Folder monitoring allows you to:

1. Select a folder to watch for new files
2. Automatically import new media files that are synced with cloud storage like Dropbox or OneDrive

### :file_folder: What is media auto-export? {#media-export}

Media auto-export automatically:

1. Exports media files to a specified folder
2. Organizes files by date and section
3. Converts files to MP4 format (optional)
4. Maintains an organized backup of meeting media files

### :family: Can I manage multiple congregations? {#multiple-congregations}

Yes! M³ supports multiple profiles for:

- Different congregations
- Special events
- Different groups
- Separate settings and media for each

## Troubleshooting {#troubleshooting}

### :warning: Media isn't downloading. What should I check? {#media-not-downloading}

Check these common issues:

1. **Meeting Schedule**: Verify your meeting days and times are correct
2. **Language Settings**: Ensure your media language is set correctly
3. **Internet Connection**: Check your internet connection
4. **Language Availability**: Verify media is available in your selected language

<!-- 5. **Manual Refresh**: Try manually refreshing to check for new media -->

### :video_camera: The OBS integration isn't working. What should I verify? {#obs-not-working}

Check these OBS-related issues:

1. **OBS Installation**: Ensure OBS Studio is installed and running
2. **WebSocket Plugin**: Verify the WebSocket plugin is installed
3. **Port and Password**: Check your OBS port and password settings
4. **Firewall**: Ensure the firewall isn't blocking the connection

### :snail: M³ is running slowly. How can I improve performance? {#performance-issues}

Try these performance optimizations:

1. **Enable Extra Cache**: Turn on additional caching in settings
2. **Close Other Apps**: Close unnecessary applications
3. **Check Disk Space**: Ensure you have sufficient free disk space
4. **Reduce Resolution**: Lower the maximum resolution setting

### :speech_balloon: I'm having language issues. What should I check? {#language-issues}

Verify these language settings:

1. **Interface Language**: Check your display language setting
2. **Media Language**: Verify your media download language
3. **Language Availability**: Ensure the media language is available on the official website of Jehovah's Witnesses
4. **Fallback Language**: Try setting a fallback language

## Support and Community {#support-community}

### :radioactive: Kako prijavim težavo? {#how-do-i-report-an-issue}

[Težavo prijavi](https://github.com/sircharlo/meeting-media-manager/issues) na uradni spletni strani GitHub repository. Include:

- Detailed description of the problem
- Steps to reproduce the issue
- Your operating system and M³ version
- Any error messages, logs and screenshots

### :new: Kako lahko zaprosim za novo funkcijo ali izboljšavo? {#how-can-i-request-a-new-feature-or-enhancement}

Na uradni spletni strani GitHub repository [odpri razpravo](https://github.com/sircharlo/meeting-media-manager/discussions). Describe:

- The feature you'd like to see
- How it would benefit users
- Any specific requirements or preferences

### :handshake: Kako lahko prispevam k pisanju kode? {#how-can-i-contribute-some-code}

[Oglej si vodnik za prispevanje](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) na uradni spletni strani GitHub repository. We welcome code contributions and Pull Requests!

### :globe_with_meridians: How can I help with translations? {#translations}

M³ uses Crowdin for translation management. You can contribute translations by:

1. Visiting the [Crowdin project](https://crowdin.com/project/meeting-media-manager)
2. Selecting your language
3. Translating strings that need work
4. Reviewing existing translations

### :x: Ali lahko doniram za projekt? {#can-i-make-a-donation-to-the-project}

Zahvaljujemo se ti za tvoje zanimanje za podporo projekta! Vendar v duhu tega, kar piše v Mateju 10:8, donacij **ne** sprejemamo in jih tudi nikoli ne bomo. Ta program je bil narejen z ljubeznijo in nekaj prostega časa. Uživaj v uporabi programa! :tada:

:::tip :book: Matej 10:8

"Zastonj ste prejeli, zastonj dajajte."

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

Yes! M³ is designed with security and privacy in mind:

- **Local Storage**: All meeting data is stored locally on your computer
- **Direct Downloads**: Media is downloaded directly from the official website of Jehovah's Witnesses
- **Open Source**: The code is open for review and verification
- **Bug Reports**: Limited data may be collected for bug reporting purposes

### :arrows_clockwise: How often does M³ check for updates? {#update-frequency}

M³ checks for updates:

- **Application Updates**: Automatically checks for new versions every time the app is opened
- **Media Updates**: Automatically checks for new meeting media every time the app is opened
- **Language Updates**: Dynamic detection of new languages as needed
