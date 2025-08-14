# 常见问题 {#frequently-asked-questions}

## General Questions {#general-questions}

### :earth_americas: 此应用是否依赖外部站点、源或“管理员”下载出版物和聚会媒体或其他文档？ {#external-dependencies}

\*\*不。\*\*此应用程序的运转方式酷似JW Library应用。 它直接从耶和华见证人的官方网站及其内容提供网络下载出版物、媒体和其他内容。 应用程序自动决定需要下载的内容以及先前下载的内容不再是最新的，应该重新下载。

:::info 备注

此应用程序的源代码可供所有人检查和验证应用里发生的事情。

:::

### :thinking: 此应用是否违反了耶和华见证人官方网站的使用条款？ {#terms-of-use}

\*\*不。\*\*[耶和华见证人官方网站使用条款](https://www.jw.org/finder?docid=1011511&prefer=content)明确允许我们正在做的用法。 以下是相关摘录（重要部分已标明）：

> 你不得：
>
> 从本网站收集、翻印、下载、撷取或采集数据、HTML、图像或文字，并制作应用程序、工具或技术，向公众分发 （**不限**本网站设计的非营利应用程序，提供大众免费下载电子档，如EPUB、PDF、MP3和MP4）。

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

### :speech_balloon: I'm having language issues. What should I check? {#language-issues}

Verify these language settings:

1. **Interface Language**: Check your display language setting
2. **Media Language**: Verify your media download language
3. **Language Availability**: Ensure the media language is available on the official website of Jehovah's Witnesses
4. **Fallback Language**: Try setting a fallback language

## Support and Community {#support-community}

### :radioactive: 如何报告问题？ {#how-do-i-report-an-issue}

请在官方的 GitHub 仓库上[反馈问题](https://github.com/sircharlo/meeting-media-manager/issues)。 Include:

- Detailed description of the problem
- Steps to reproduce the issue
- Your operating system and M³ version
- Any error messages, logs and screenshots

### :new: 如何请求新功能或优化功能？ {#how-can-i-request-a-new-feature-or-enhancement}

请在官方的 GitHub 仓库 [打开讨论](https://github.com/sircharlo/meeting-media-manager/discussions) Describe:

- The feature you'd like to see
- How it would benefit users
- Any specific requirements or preferences

### :handshake: 如何贡献一些代码？ {#how-can-i-contribute-some-code}

请查看官方GitHub 仓库的[贡献指南](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md)。 We welcome code contributions and Pull Requests!

### :globe_with_meridians: How can I help with translations? {#translations}

M³ uses Crowdin for translation management. You can contribute translations by:

1. Visiting the [Crowdin project](https://crowdin.com/project/meeting-media-manager)
2. Selecting your language
3. Translating strings that need work
4. Reviewing existing translations

### :x: 如何为该项目做出捐献？ {#can-i-make-a-donation-to-the-project}

感谢您对支持该项目的兴趣！ 然而，本着马太福音10:8的精神，我们**不接受**捐款，永远不会接受。 这个应用程序是用爱心和花费一些时间制作的。 希望您喜欢！ :tada:

:::tip :book: 马太福音10:8

“你们​免费​得​来，也​要​无偿​施与”

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
