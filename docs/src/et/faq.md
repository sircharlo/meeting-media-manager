# Korduma kippuvad küsimused {#frequently-asked-questions}

## Üldised küsimused {#general-questions}

### :earth_americas: Kas see rakendus kasutab väljaannete ja koosolekute meedia allalaadimiseks väliseid saite, allikaid või "kuraatoreid"? {#external-dependencies}

\*\*Ei. See rakendus töötab sarnaselt JW Library rakendusele. Väljaanded ja meedia laetakse alla Jw. org ametlikult lehelt ja serveritest. Rakendus määrab automaatselt kindlaks, mida on vaja alla laadida ja millal varem alla laaditud sisu ei ole enam ajakohane ja tuleks uuesti alla laadida.

:::info Märkus

Selle rakenduse lähtekood on kõigile kättesaadav, et uurida ja kontrollida, mis toimub nö. kapoti all.

:::

### :thinking: Kas see rakendus rikub Jehoova tunnistajate ametliku veebisaidi kasutustingimusi? {#terms-of-use}

**Ei.** Jehoova tunnistajate ametliku veebisaidi [kasutustingimused] (https://www.jw.org/finder?docid=1011511&prefer=content) lubavad selgesõnaliselt sellist kasutamist, mida me teeme. Siin on väljavõte nendest mõtetest (tsiteeritult):

> Te ei tohi:
>
> Luua levitamise eesmärgil tarkvararakendusi, tööriistu või muid tehnilisi lahendusi, mis võimaldavad koguda, kaasa arvatud scraping ja harvesting, kopeerida, alla laadida või lahti pakkida andmeid, HTML-i, pilte või teksti sellelt saidilt. (Keeld **ei kehti** tasuta, mitteärilistel eesmärkidel loodud rakenduste kohta, mille eesmärk on võimaldada alla laadida elektroonilisi faile, näiteks EPUB-, PDF-, MP3- ja MP4-vormingus faile selle saidi avalikust osast.)

### :question: Milliseid operatsioonisüsteeme M³ toetab? {#operating-systems}

M³ toetab Windowsit, macOS-i ja Linuxit:

- **Windows**: Windows 10 ja uuemad versioonid (saadaval 64-bitine ja 32-bitine versioon)
- **macOS**: macOS 10.15 (Catalina) ja uuemad versioonid (toetab Intel ja Apple Silicon protsessoreid)
- **Linux**: enamik kaasaegseid Linuxi distributsioone (AppImage-vorming)

### :globe_with_meridians: Kas M³ töötab minu keeles? {#language-support}

**Jah!** M³ pakub laiaulatuslikku mitmekeelset tuge:

- **Meedia**: Lae alla meedia sadades keeltes, mis on saadaval Jehoova tunnistajate ametlikul veebisaidil
- **Rakenduse liides**: Kasutage M³ liidest paljudes erinevates keeltes
- **Sõltumatud seaded**: saate kasutada liidest ühes keeles, samal ajal kui meedia alla laadite teises keeles
- **Varukeeled**: konfigureerige varukeeled juhuks, kui meedia ei ole saadaval esimeses keeles
- **Subtiitrite tugi**: erinevates keeltes subtiitrite allalaadimine ja kuvamine

## Paigaldamine ja seadistamine {#installation-setup}

### :computer: Kuidas saan M³ alla laadida ja paigaldada? {#installation}

Lae alla sobiv versioon [alla laadimise lehelt](download) ja järgi [kasutusjuhendis](user-guide) toodud juhiseid.

### :gear: Kuidas seadistada M³ esimest korda? {#first-time-setup}

M³ sisaldab seadistusviisardit, mis juhendab teid oluliste seadistuste tegemisel:

1. Vali oma kasutajaliidese keel
2. Vali profiili tüüp (tavaline või muu)
3. Konfigureeri koguduse andmed
4. Koosta koosolekute ajakava
5. Seadista valikulised funktsioonid, nagu OBS-iga koostöö

## Põhimeedia haldus {#faq-media-management}

### :desktop_computer: Kuidas M³ meediat alla laadib? {#media-download}

M³ laadib automaatselt alla meedia eelseisvate koosolekute jaoks järgmiselt:

1. Kontrollib koosolekute ajakava
2. Määrab kindlaks millist meediaüksusi on vaja
3. Laeb alla meediaüksused Jehoova tunnistajate ametlikult veebilehelt valitud keeles
4. Organiseerib meediaüksused vatavalt kuupäevale ja koosolekule
5. Failide salvestamine offline-kasutamiseks

### :calendar: Kas ma saan alla laadida meediat kindlate kuupäevade jaoks? {#specific-dates}

Jah! M³ võimaldab sul:

- Laadida automaatselt alla eelseisvate koosolekute meediafailid
- Importida kohandatud meedia mis tahes kuupäeva jaoks

### :open_file_folder: Kuidas importida oma meediafailid? {#import-media}

Sa saad importida kohandatud meediat mitmel viisil:

- **Failide importimine**: Kasutage importimise nuppu, et lisada videoid, pilte või helifaile
- **Lohistamine ja kleepimine**: Lohistage failid otse M³-e
- **Kausta jälgimine**: seadista jälgitav kaust automaatseks importimiseks
- **JWPUB-failid ja esitusloendid**: importige väljaanded ja esitusloendid

### :speaker: Can I import audio Bible recordings? {#audio-bible}

Jah! M³ includes an Audio Bible feature that allows you to:

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

### :notes: How does background music work? {#faq-background-music}

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

Jah! M³ supports multiple profiles for:

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

- **Windows**: Windows 10 ja uuemad versioonid (saadaval 64-bitine ja 32-bitine versioon)
- **macOS**: macOS 10.15 (Catalina) ja uuemad versioonid (toetab Intel ja Apple Silicon protsessoreid)
- **Linux**: enamik kaasaegseid Linuxi distributsioone (AppImage-vorming)

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

Jah! M³ is designed with security and privacy in mind:

- **Local Storage**: All meeting data is stored locally on your computer
- **Direct Downloads**: Media is downloaded directly from the official website of Jehovah's Witnesses
- **Open Source**: The code is open for review and verification
- **Bug Reports**: Limited data may be collected for bug reporting purposes

### :arrows_clockwise: How often does M³ check for updates? {#update-frequency}

M³ checks for updates:

- **Application Updates**: Automatically checks for new versions every time the app is opened
- **Media Updates**: Automatically checks for new meeting media every time the app is opened
- **Language Updates**: Dynamic detection of new languages as needed
