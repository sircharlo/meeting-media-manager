# Welcome!

JW Meeting Media Fetcher, or JWMMF for short, is an app that facilitates the downloading of media that will be considered during congregation meetings of Jehovah's Witnesses. This is especially useful when using JW Library is not possible or feasible for various reasons, during personal study, or to share media with others during congregation Zoom meetings.

![Media sync in progress](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/00-hero.gif?raw=true)

## Installation and usage

Simply download the latest installer [from here](https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest) and run it.

> **Trouble installing?** Check the *Technical usage notes* section for help.

Once the setup is complete, a shortcut to the app will be placed on your desktop. Open the app, and configure the settings as you please.

After configuring the app, simply go to the [main screen](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/01-main.png?raw=true) and push the big blue button to sync media. All downloaded media will be placed in the folder of your choosing.

## Configuration

Most of the options in the [Settings screen](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/02-settings.png?raw=true) are self-explanatory, but here are a few additional details about some of them.

### Enable button to play Kingdom songs on shuffle

Shows a button which will play Kingdom songs in random order. This is useful to play songs before and after meetings at the Kingdom Hall as background music.

### Automatically stop playing songs

If the previous setting (*Enable button to play Kingdom songs on shuffle*) is enabled, then toggling this setting will allow you to specify the period after which the background music should be automatically stopped. This can be either a set number of minutes, or a predetermined number of seconds before the start of the meeting (in the case where the background music was started before a  meeting).

### Offer to import additional media

If enabled, you'll be presented with the [Additional media screen](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/03-upload.png?raw=true) when performing a media sync. That screen allows you to add additional media files into a given week's media.

There are 3 categories of media files that can be imported.

- **Song:** Choose this to add a song, for a public talk during the weekend meeting for example. After choosing the song number, it will be automatically downloaded for you.
- **JWPUB:** Choose this to automatically import media from any JWPUB file (for example, the S-34). Upon choosing the JWPUB file, you will be prompted to select the section from which you'd like to import media.
- **Custom:** Choose this to select any other media file from your computer.

### Convert media to MP4 format

This automatically converts all picture and audio files into MP4 format. This includes files downloaded from JW.org, as well as files imported using the *import additional media* feature mentioned above (if enabled).

This allows all media files to be shared in Zoom using its [native MP4 sharing feature](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/05-zoom.png?raw=true), rather than sharing your local monitor or your media playback app's window.

> **Why do it this way?** As explained by a Zoom [support article](https://support.zoom.us/hc/en-us/articles/360051673592-Sharing-and-playing-a-video), "video files can be opened within Zoom’s built-in video player and shared, without other participants viewing the playback controls. Sharing your video with the built-in player, instead of as part of a shared screen or application, improves the quality of shared videos, providing a smoother and more stable viewing experience for your viewers."

### Congregation-level media syncing (☁️)

The brother designated as _videoconference organizer_ (VO) by the body of elders can use JWMMF to manage what media will be available to the person or team taking care of media for any given meeting. For example, he can:

- upload additional media to be shared during a meeting (such as for the circuit overseer's visit, or for public speakers' talks)
- hide media that for one reason or another is not relevant for a given meeting (for example, when a part has been replaced by another one by the local branch)
- make recurring media available, to be shared at every meeting (such as a yeartext video, or an announcement slide)

Please note that enabling congregation-level media syncing automatically disables the *Offer to import additional media* option. This is by design. When congregation-level media syncing is enabled, please use the **☁️** button on the main screen of the app to upload any additional media to the WebDAV server. This ensures that all who are taking care of media in your congregation receive the necessary media upon clicking the *Get media!* button.

> **Note:** Usage of the congregation-level media syncing features is entirely optional. No data is shared or uploaded to any third  parties in the process. The underlying congregation-level syncing mechanism uses WebDAV, and simply requires the VO (or someone under his supervision) to maintain a secured WebDAV server. All users from a congregation that wish to be synchronized together should connect to the VO's WebDAV server using the connection information that he provides them. To do so, go to Settings, then click on the **☁️** button.

## Does this app depend on external sites, sources or curators to download publications and meeting media?

**No.** The app behaves similarly to JW Library. It downloads data such as publications and media directly from one source only: the official JW website and its content delivery network. At runtime, the app automatically determines what needs to be downloaded, such as media files and publications. The source code is available for all to examine and verify this.

## Does this app infringe the JW.org Terms of Use?

**No.** The JW.org [Terms of Use](https://www.jw.org/en/terms-of-use) actually *explicitly allow* the kind of usage that we are making. Here is the relevant excerpt from those terms (emphasis mine):

>You may not:
>
> Create for distribution purposes, any software applications, tools, or techniques that are specifically made to collect, copy, download, extract, harvest, or scrape data, HTML, images, or text from this site. (This does *not* prohibit the distribution of free, non-commercial applications designed to download electronic files such as EPUB, PDF, MP3, and MP4 files from public areas of this site.)

## Technical usage notes
The app should run as is on most modern computers running Windows, Linux, or Mac.

##### Windows
On opening the installer, you might get [an error](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/07-win-smartscreen.png?raw=true) indicating that "Windows SmartScreen prevented an unrecognized app from starting". This is due to the app not having a high number of downloads, and consequently not being explicitly "trusted" by Windows. To get around this, simply click on "More info", then "Run anyway".
##### Linux
As per the [official AppImage documentation](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html):

> AppImages based on Electron require the kernel to be configured in a certain way to allow for its sandboxing to work as intended (specifically, the kernel needs to be allowed to provide “unprivileged namespaces”). Many distributions come with this configured out of the box (like Ubuntu for instance), but some do not (for example Debian).

Simply put, this means that if the AppImage fails to open properly, then you'll need to confirm the output of the following command:

`sysctl kernel.unprivileged_userns_clone`

If the output is `kernel.unprivileged_userns_clone = 0`, then the AppImage will not run unless you run the following command and then reboot:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Before you do this however, make sure you read up on what this change entails, for example [here](https://lwn.net/Articles/673597/).

##### Mac
For technical reasons, the auto-updater does not work on Macs. Mac users will instead see a red, pulsing notification on the main screen of the app and in Settings when an update is available. Clicking on the notification in Settings will open the latest release's download page automatically.

Additionally, if upon launching the app, you receive a warning that the app cannot be opened, either because "it was not downloaded from the App store" or "the developer cannot be verified", then this [Apple support page](https://support.apple.com/en-ca/HT202491) will help you to get past that.

If you get a message indicating that you "do not have permission to open the application", then try some solutions from [this page](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860). For example, you could try running this command in Terminal:

`codesign --force --deep --sign - "/path/to/JW Meeting Media Fetcher.app"`

## Help, there's a problem

If ever you run into any issues with the app or the underlying script, please use [GitHub Issues](https://github.com/sircharlo/jw-meeting-media-fetcher/issues) to let me know.

## I have an idea for a great new feature!

I'm open to suggestions! Please use [GitHub Discussions](https://github.com/sircharlo/jw-meeting-media-fetcher/discussions) to let me know.
