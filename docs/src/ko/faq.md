# 자주 묻는 질문들 {#frequently-asked-questions}

## General Questions {#general-questions}

### :earth_americas: 이 애플리케이션은 집회 자료 혹은 기타 컨텐츠를 다운로드하기 위해 외부 사이트, 소스 혹은 "큐레이터"를 필요로 합니까? {#external-dependencies}

**아니오.** 본 애플리케이션은 JW Library와 비슷한 방식으로 동작합니다. 본 애플리케이션은 여호와의 증인 공식 웹사이트 및 공식 콘텐츠 전송 네트워크를 통해 직접 출판물, 미디어 자료 및 기타 콘텐츠를 다운로드합니다. 본 애플레케이션은 다운로드해야 할 미디어 및 이전에 다운로드한 콘텐츠가 업데이트되어 다시 다운로드 해야 하는 경우를 자동으로 판별해 다운로드합니다.

:::info 참고

본 애플리케이션의 소스 코드 전체가 공개되어 있으므로 누구나 애플리케이션의 동작 방식을 확인해 볼 수 있습니다.

:::

### :thinking: 이 애플리케이션은 여호와의 증인 공식 웹사이트의 이용 약관을 침해합니까? {#terms-of-use}

**아니오.** 여호와의 증인 공식 웹사이트 [이용 약관](https://www.jw.org/finder?docid=1011511&prefer=content) 은 본 애플리케이션이 제공하는 유형의 이용을 명시적으로 허용합니다. 다음은 해당 약관의 관련 발췌문(강조 추가)입니다.

> 사용자는 다음의 행위를 해서는 안 됩니다.
>
> 본 웹사이트에서 데이터, HTML, 이미지, 텍스트를 수집, 복사, 다운로드, 추출, 산출, 스크래핑하기 위한 소프트웨어 응용 프로그램, 도구, 기법을 배포 목적으로 만드는 행위. (본 웹사이트의 일반 자료에서 EPUB, PDF, MP3, MP4 파일과 같은 전자 파일을 다운로드할 목적으로 고안된 비상업적 무료 응용 프로그램을 배포해서는 안 된다는 뜻은 **아님** )

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

### :radioactive: 문제를 보고하려면 어떻게 해야 합니까? {#how-do-i-report-an-issue}

공식 GitHub 리포지터리에 [이슈를 발행](https://github.com/sircharlo/meeting-media-manager/issues) 해주시기 바랍니다. Include:

- Detailed description of the problem
- Steps to reproduce the issue
- Your operating system and M³ version
- Any error messages, logs and screenshots

### :new: 신기능 혹은 개선사항을 건의하려면 어떻게 해야 합니까? {#how-can-i-request-a-new-feature-or-enhancement}

공식 GitHub 리포지터리에 [토론](https://github.com/sircharlo/meeting-media-manager/discussions) 을 작성해주시기 바랍니다. Describe:

- The feature you'd like to see
- How it would benefit users
- Any specific requirements or preferences

### :handshake: 코드에 기여를 하려면 어떻게 해야합니까? {#how-can-i-contribute-some-code}

공식 GitHub 리포지터리의 [기여 가이드 문서](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) 를 참조하십시오. We welcome code contributions and Pull Requests!

### :globe_with_meridians: How can I help with translations? {#translations}

M³ uses Crowdin for translation management. You can contribute translations by:

1. Visiting the [Crowdin project](https://crowdin.com/project/meeting-media-manager)
2. Selecting your language
3. Translating strings that need work
4. Reviewing existing translations

### :x: 프로젝트를 위해 기부할 수 있습니까? {#can-i-make-a-donation-to-the-project}

프로젝트를 지원하는 것에 관심을 가져주셔서 감사합니다! 하지만, 마태복음 18:8의 정신에 의거해, 기부는 **받지 않으며** 앞으로도 받지 않을 것입니다. 본 애플리케이션은 사랑과 약간의 여유시간을 사용해 만들어졌습니다. 부디 즐겨주시기 바랍니다! :tada:

:::tip :book: 마태 10:8

"여러분이 거저 받았으니 거저 주십시오."

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
