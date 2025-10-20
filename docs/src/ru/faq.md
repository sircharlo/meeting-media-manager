# Часто задаваемые вопросы {#frequently-asked-questions}

## Общие вопросы {#general-questions}

### :earth_americas: Зависит ли это приложение от внешних сайтов, источников или "кураторов", чтобы загружать публикации, мультимедиа и других файлов для встреч? {#external-dependencies}

**Нет.** Приложение работает аналогично JW Library. Оно загружает публикации, мультимедиа и другие файлы непосредственно с официального сайта Свидетелей Иеговы. Приложение автоматически определяет, что нужно скачать, и когда ранее загруженный контент устарел и если следует повторно скачать его.

:::info Примечание

Исходный код этого приложения доступен для всех желающих, чтобы изучить и проверить, что происходит за кадром.

:::

### :thinking: Нарушает ли это приложение условия использования официального сайта Свидетелей Иеговы? {#terms-of-use}

**Нет.** [Условия использования](https://www.jw.org/finder?docid=1011511&prefer=content) официального сайта Свидетелей Иеговы явно допускают тот вид использования, который мы делаем. Вот соответствующая выдержка из этих условий:

> Вы не можете:
>
> создавать с целью распространения какие бы то ни было компьютерные приложения, программы и методы, которые были специально разработаны для того, чтобы собирать, копировать, скачивать, извлекать данные, HTML, изображения или текст с этого сайта, а также осуществлять комплексный поиск, сбор и интеллектуальный анализ данных  (при этом **не запрещается** распространение бесплатных, некоммерческих приложений, разработанных для скачивания электронных файлов — например, файлов в формате EPUB, PDF, MP3 и MP4 — из общедоступного пространства этого сайта);

### :question: Какие операционные системы поддерживает M3? {#operating-systems}

M3 поддерживает Windows, macOS и Linux:

- **Windows**: Windows 10 и выше (64-разрядная и 32-разрядная версия)
- **macOS**: macOS 10.15 (Катализатор) и выше (Intel и Apple Silicon support)
- **Linux**: Самые современные дистрибутивы Linux (в формате AppImage)

### :globe_with_meridians: M3 работает на моем языке? {#language-support}

**Да!** M3 обеспечивает полную поддержку многоязычных языков:

- **Media**: Download media in any of hundreds of languages available on the official website of Jehovah's Witnesses
- **App Interface**: Use M³'s interface in many different languages
- **Независимые настройки**: Вы можете использовать интерфейс на одном языке при загрузке мультимедиа на другой
- **Fallback languages**: Configure fallback languages for when media isn't available in the primary language
- **Subtitle support**: Download and display subtitles in various languages

## Установка и установка {#installation-setup}

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

- **Windows**: Windows 10 и выше (64-разрядная и 32-разрядная версия)
- **macOS**: macOS 10.15 (Катализатор) и выше (Intel и Apple Silicon support)
- **Linux**: Самые современные дистрибутивы Linux (в формате AppImage)

M³ has the following hardware requirements:

- **Minimum**: 4GB RAM, 6GB free disk space
- **Recommended**: 8GB RAM, 15GB free disk space for media caching
- **Network**: Internet connection for media downloads

Depending on the features you use, M³ also requires the following additional software:

- **Zoom**: Required only if using Zoom integration features
- **OBS Studio**: Required only if using OBS integration features

### :floppy_disk: Сколько дискового пространства M3 используется? {#disk-space}

Использование дискового пространства зависит от:

- **Разрешение медиа-файлов**: Более высокое разрешение занимает больше места
- **Кэшированное содержимое**: Медиа файлы кэшируются локально
- **Дополнительный кэш**: Дополнительное кэширование может увеличить использование
- **Экспортированные медиа**: возможности автоэкспорта используют дополнительное пространство

Типичное использование колеблется от 2 до 10 ГБ в зависимости от настроек и использования.

### :shield: Безопасный и приватный M3? {#security-privacy}

Yes! М3 разработан с учетом безопасности и конфиденциальности:

- **Локальное хранилище**: Все данные встречи хранятся локально на вашем компьютере
- **Прямые закачки**: Медиа загружаются непосредственно с официального сайта Свидетелей Иеговы
- **Открытый исходный код**: код открыт для проверки и проверки
- **Отчеты об ошибках**: Ограниченные данные могут быть собраны в целях сообщения об ошибках

### :arrows_clockwise: Как часто M3 проверяет наличие обновлений? {#update-frequency}

M3 проверки на обновления:

- **Обновления приложений**: Автоматическая проверка новых версий при каждом открытии приложения
- **Медиа-обновления**: Автоматическая проверка новых носителей при каждом открытии приложения
- **Языковые обновления**: динамическое определение новых языков при необходимости
