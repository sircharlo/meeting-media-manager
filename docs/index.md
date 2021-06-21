# Welcome!

Here is a simple app that facilitates the downloading of media that will be considered during congregation meetings of Jehovah's Witnesses, to be used for example during personal study, to share using Zoom, or when using JW Library is not possible or feasible for various reasons.

![Main screen of app](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/01-main.png?raw=true)

## Installation and usage

Simply download the latest installer [from here](https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest) and run it. Once the setup is complete, a shortcut to the app will be placed on your desktop. Open the app, and configure the settings as you please.

![Settings screen of app](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/02-settings.png?raw=true)

After configuring the app, execute the media sync, and all downloaded media will be placed in the folder of your choosing.

## Using with Zoom

Of note is the setting to convert downloaded media to MP4 format (**Settings > Convert downloaded media to MP4**). This allows pictures and audio files to be shared along with videos using the native Zoom MP4 sharing feature (new as of February 1st, 2021). This is much easier and results in better quality for the meeting participants than simply sharing your local monitor or your media playback app's window through Zoom's screen sharing feature.

The **Enable conversion of external media** toggle will allow you to quickly add external media to the MP4 conversion queue after the media sync has taken place. This would enable you, for example, to add your own custom pictures so that they too can be shared as MP4 files.

![Zoom Video share feature](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/05-zoom.png?raw=true)

## Congregation media syncing

The brother designated as _videoconference organizer_ by the body of elders can use **JWMMF** to manage what media will be available to the person or team taking care of media for a given meeting. For example, he can:

- upload additional media to be shared for a meeting (such as for the circuit overseer's visit, or for public speakers' talks)
- hide media that for one reason or another is not relevant for a given meeting
- make recurring media available, to be shared at every meeting (such as a yeartext video, or an announcement slide)

![Upload screen of app](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/03-upload.png?raw=true)

Usage of these congregation-level syncing features is entirely optional, and requires a connection to a WebDAV server. All users from a congregation that wish to be synchronized should connect to the same WebDAV server and directory using the **Settings > WebDAV server** screen.

![Upload settings screen of app](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/04-upload-settings.png?raw=true)

## App usage notes

The app should run as is on most modern computers running Windows, Linux, or Mac.

### Windows

There are no specific prerequisites.

### Linux

As per the [official AppImage documentation](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html):

>AppImages based on Electron require the kernel to be configured in a certain way to allow for its sandboxing to work as intended (specifically, the kernel needs to be allowed to provide “unprivileged namespaces”). Many distributions come with this configured out of the box (like Ubuntu for instance), but some do not (for example Debian).

Simply put, this means that if the AppImage fails to open properly, then you'll need to confirm the output of the following command:

`sysctl kernel.unprivileged_userns_clone`

If the output is `kernel.unprivileged_userns_clone = 0`, then the AppImage will not run unless you run the following command and then reboot:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Before you do this however, make sure you read up on what this change entails, for example [here](https://lwn.net/Articles/673597/).

### Mac

For technical reasons, the auto-updater does not work on Macs. Mac users will however see a button displayed on the main screen of the app when an update is available. Clicking on this button will take you to the latest release's download page automatically.

![Mac app error](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/06-mac-error.png?raw=true)

If after launching the app, you receive a message such as the one above, then try running this command in Terminal:

`codesign --force --deep --sign - "/Applications/JW Meeting Media Fetcher.app"`

## Does this app depend on external sites, sources or curators to download publications or media?

No, the app behaves similarly to JW Library in that it downloads data such as publications and media directly from the official JW website and content delivery network. The media and publications to be downloaded are automatically determined at runtime. The source code is available for all to examine and verify this.

## Does this app infringe the JW.org Terms of Use?

No, the JW.org [Terms of Use](https://www.jw.org/en/terms-of-use) actually *explicitly allow* this kind of usage. Here is the relevant excerpt from those terms(emphasis mine):

>You may not:
>
> Create for distribution purposes, any software applications, tools, or techniques that are specifically made to collect, copy, download, extract, harvest, or scrape data, HTML, images, or text from this site. **(This does *not* prohibit the distribution of free, non-commercial applications designed to download electronic files such as EPUB, PDF, MP3, and MP4 files from public areas of this site.)**

## Help, there's a problem

If ever you run into any issues with the app or the underlying script, please use [GitHub Issues](https://github.com/sircharlo/jw-meeting-media-fetcher/issues) to let me know.

## I have an idea for a great new feature!

I'm open to suggestions! Please use [GitHub Discussions](https://github.com/sircharlo/jw-meeting-media-fetcher/discussions) to let me know.

*- COS*
