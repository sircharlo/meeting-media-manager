# Найчастіші питання {#frequently-asked-questions}

## General Questions {#general-questions}

### :earth_americas: Чи залежить ця програма від зовнішніх сайтів, джерел або "кураторів" для завантаження публікацій, медіа для зібрань та іншого контенту? {#external-dependencies}

**Ні.** Додаток поводиться аналогічно як JW Library. Він завантажує публікації, медіа та інший контент безпосередньо з офіційного вебсайту Свідків Єгови та їх мережі надсилання контенту. Додаток автоматично визначає, що потрібно завантажити, та коли раніше завантажений контент більше не є актуальним і повинен бути завантажений заново.

:::info Примітка

Вихідний код цього додатку доступний для всіх, щоб дослідити його і перевірити, що відбувається під капотом програми.

:::

### :thinking: Чи цей додаток порушує Умови Використання офіційного сайту Свідків Єгови? {#terms-of-use}

**Ні.** [Умови використання](https://www.jw.org/finder?docid=1011511&prefer=content) офіційного вебсайту Свідків Єгови чітко дозволяють використання, яке ми здійснюємо. Ось відповідний уривок з цих умов (з виділенням):

> Ви не можете:
>
> Створювати з метою розповсюдження будь-яке програмне забезпечення, допоміжні програми та засоби програмного забезпечення, призначені для того, щоб збирати, копіювати, завантажувати, видобувати, витягувати або вибирати дані, HTML, зображення чи текст із цього сайту. (Це **не стосується** розповсюдження безкоштовних некомерційних програмних додатків, створених для завантаження електронних файлів, таких як EPUB, PDF, MP3 і MP4, доступних на цьому сайті для загалу.)

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

### :radioactive: Як я можу повідомити про проблему? {#how-do-i-report-an-issue}

Будь ласка, [подайте проблему](https://github.com/sircharlo/meeting-media-manager/issues) на офіційному репозиторії GitHub. Include:

- Detailed description of the problem
- Steps to reproduce the issue
- Your operating system and M³ version
- Any error messages, logs and screenshots

### :new: Як я можу запропонувати нову функцію або покращення? {#how-can-i-request-a-new-feature-or-enhancement}

Будь ласка, [відкрийте обговорення](https://github.com/sircharlo/meeting-media-manager/discussions) на офіційному репозиторії GitHub. Describe:

- The feature you'd like to see
- How it would benefit users
- Any specific requirements or preferences

### :handshake: Чи можу я зробити свій внесок у код? {#how-can-i-contribute-some-code}

Будь ласка, ознайомтесь з [посібником для контриб’юторів](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) на офіційному репозиторії GitHub. We welcome code contributions and Pull Requests!

### :globe_with_meridians: How can I help with translations? {#translations}

M³ uses Crowdin for translation management. You can contribute translations by:

1. Visiting the [Crowdin project](https://crowdin.com/project/meeting-media-manager)
2. Selecting your language
3. Translating strings that need work
4. Reviewing existing translations

### :x: Чи можу я зробити пожертву на проект? {#can-i-make-a-donation-to-the-project}

Дякуємо за вашу зацікавленість в підтримці проекту! Проте, згідно з духом з Матвія 10:8, пожертви **не приймаються** і ніколи не будуть. Цей додаток був створений з любовʼю та у наш вільний час. Будь ласка, насолоджуйтесь! :tada:

:::tip :book: Матвія 10:8

"Даром отримали – даром давайте."

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
