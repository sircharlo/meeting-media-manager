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

- **Multimedijska vsebina**: Prenesi multimedijsko vsebino v katerem koli od več sto jezikov, ki so na voljo na uradnem spletnem mestu Jehovovih prič
- **Vmesnik aplikacije**: Uporabi vmesnik M³ v več različnih jezikih
- **Independent Settings**: You can use the interface in one language while downloading media in another
- **Nadomestni jeziki**: Nastavi nadomestne jezike za primere, ko multimedijska vsebina ni na voljo v glavnem jeziku
- **Podpora za podnapise**: Prenesi in prikaži podnapise v različnih jezikih

## Installation and Setup {#installation-setup}

### :computer: Kako prenesem in namestim program M³? {#installation}

Ustrezno različico prenesi s strani za [Prenos] (download) in sledi korakom v [Uporabniškem vodniku] (user-guide).

### :gear: Kako prvič nastavim M³? {#first-time-setup}

M³ vključuje čarovnik za nastavitev, ki te vodi skozi osnovno konfiguracijo:

1. Izberi jezik uporabniškega vmesnika
2. Izberi vrsto profila (običajen ali drug)
3. Nastavi podatke o občini
4. Nastavi urnik shodov
5. Nastavi dodatne funkcije, kot je povezovanje z OBS

## Upravljanje multimedijske vsebine {#faq-media-management}

### :desktop_computer: Kako M³ prenese multimedijsko vsebino? {#media-download}

M³ samodejno prenese multimedijsko vsebino za prihajajoče shode:

1. Preverjanje urnika shodov
2. Ugotavljanje, katera multimedijska vsebina je potrebna
3. Prenašanje s spletnega mesta Jehovovih prič v izbranem jeziku
4. Razvrščanje multimedijske vsebine po datumu in vrsti shoda
5. Shranjevanje datotek v predpomnilnik za uporabo brez internetne povezave

### :calendar: Ali lahko prenesem multimedijsko vsebino za določene datume? {#specific-dates}

Da! M³ ti omogoča:

- Samodejno prenesi multimedijsko vsebino za prihajajoče shode
- Uvozi prilagojeno multimedijsko vsebino za kateri koli datum

### :open_file_folder: Kako lahko uvozim lastne multimedijske datoteke? {#import-media}

Prilagojeno multimedijsko vsebino lahko uvoziš na več načinov:

- **Uvoz datotek**: Uporabi gumb za uvoz, da dodaš videoposnetke, slike ali zvočne datoteke
- **Povleci in spusti**: Povleci datoteke neposredno v M³
- **Nadzorovanje mape**: Nastavi nadzorovano mapo za samodejni uvoz
- **Datoteke JWPUB in seznami predvajanja**: Uvozi publikacije in sezname predvajanja

### :speaker: Ali lahko uvozim zvočne posnetke Svetega pisma? {#audio-bible}

Da! M³ vključuje funkcijo Avdio Biblija, ki ti omogoča:

1. izbiro svetopisemskih knjig in poglavij,
2. izbiro posameznih vrstic ali razpone vrstic,
3. prenašanje zvočnih posnetkov,
4. uporabo na shodih.

## Funkcije predstavitve {#faq-presentation-features}

### :tv: Kako predvajam multimedijsko vsebino med shodi? {#present-media}

Če želiš predvajati multimedijsko vsebino:

1. izberi datum,
2. klikni gumb za predvajanje ob želeni vsebini ali uporabi bližnjice na tipkovnici,
3. Uporabi kontrolnike predvajalnika za premor, pomikanje ali zaustavitev,
4. uporabi funkcije povečave/pomanjšave za slike,
5. po potrebi nastavi časovni razpored po meri.

### :keyboard: Katere bližnjice na tipkovnici so na voljo? {#faq-keyboard-shortcuts}

M³ podpira prilagodljive bližnjice za:

- odprtje/zaprtje okna z mediji,
- premik na prejšnjo/naslednjo vsebino,
- predvajanje/premor/zaustavitev,
- vklop/izklop glasbe v ozadju.

<!-- - Fullscreen mode -->

### :notes: Kako deluje glasba v ozadju? {#faq-background-music}

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

Da! M³ podpira več profilov za:

- različne občine,
- posebne dogodke,
- različne skupine,
- ločene nastavitve in medije za vsako od teh.

## Odpravljanje težav {#faq-troubleshooting}

### :warning: Multimedijska vsebina se ne prenaša s spleta. Kaj naj preverim? {#faq-media-not-downloading}

Preveri naslednje pogoste težave:

1. **Razpored shodov**: Preveri, ali so dnevi in ure shodov pravilno nastavljeni
2. **Jezikovne nastavitve**: Preveri, ali je izbran pravilen jezik multimedijske vsebine
3. **Internetna povezava**: Preveri internetno povezavo
4. **Razpoložljivost jezika**: Preveri, ali je vsebina na voljo v izbranem jeziku

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

### :speech_balloon: I'm having language issues. Kaj naj preverim? {#faq-language-issues}

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

- **Windows**: Windows 10 and later (64-bit and 32-bit versions available)
- **macOS**: macOS 10.15 (Catalina) and later (Intel and Apple Silicon support)
- **Linux**: Most modern Linux distributions (AppImage format)

M³ has the following hardware requirements:

- **Minimum**: 4GB RAM, 6GB free disk space
- **Recommended**: 8GB RAM, 15GB free disk space for media caching
- **Network**: Internet connection for media downloads

Depending on the features you use, M³ also requires the following additional software:

- **Zoom**: Required only if using Zoom integration features
- **OBS Studio**: Required only if using OBS integration features

### :floppy_disk: How much disk space does M³ use? {#disk-space}

Disk space usage depends on:

- **Media Resolution**: Higher resolutions use more space
- **Cached Content**: Media files are cached locally
- **Extra Cache**: Additional caching can increase usage
- **Exported Media**: Auto-export features use additional space

Typical usage ranges from 2-10GB depending on settings and usage.

### :shield: Is M³ secure and private? {#security-privacy}

Da! M³ is designed with security and privacy in mind:

- **Local Storage**: All meeting data is stored locally on your computer
- **Direct Downloads**: Media is downloaded directly from the official website of Jehovah's Witnesses
- **Open Source**: The code is open for review and verification
- **Bug Reports**: Limited data may be collected for bug reporting purposes

### :arrows_clockwise: How often does M³ check for updates? {#update-frequency}

M³ checks for updates:

- **Application Updates**: Automatically checks for new versions every time the app is opened
- **Media Updates**: Automatically checks for new meeting media every time the app is opened
- **Language Updates**: Dynamic detection of new languages as needed
