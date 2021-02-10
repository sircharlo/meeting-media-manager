# Welcome!

Here is a simple app that facilitates the downloading of media that will be considered during congregation meetings of Jehovah's Witnesses, to be used for example during personal study, to share using Zoom, or when using JW Library is not possible or feasible for various reasons.

![Main screen of app](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/01-main.png?raw=true)

## Installation and usage

Simply download the latest installer [from here](https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest) and run it. Once the setup is complete, a shortcut to the app will be placed on your desktop. Open the app, and configure the settings as you please.

![Settings screen of app](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/02-settings.png?raw=true)

After configuring the app, execute the media sync, and all downloaded media will be placed in the folder of your choosing.

## Using with Zoom

Of note is the setting to convert all media to MP4 format (**Settings > Convert all media to MP4**). This allows pictures and audio files to be shared along with videos using the native Zoom MP4 sharing feature (new as of February 1st, 2021). This is much easier and results in better quality for the meeting participants than simply sharing your local monitor or your media playback app's window through Zoom's screen sharing feature.

![Zoom Video share feature](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/05-zoom.png?raw=true)

## Congregation media syncing

The brother designated as _videoconference organizer_ by the body of elders can use **JWMMF** to manage what media will be available to the person taking care of media for a given meeting. For example, he can:

- upload additional media to be shared for a meeting (such as for the circuit overseer's visit, or for public speakers' talks)
- hide media that for one reason or another is not relevant for a given meeting
- make recurring media available, to be shared at every meeting (such as a yeartext video, or an announcement slide)

![Upload screen of app](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/03-upload.png?raw=true)

Usage of these features is entirely optional, and requires a connection to an SFTP server. All users from a congregation that wish to be syncronized should connect to the same SFTP server and directory using the **Settings > Local congregation SFTP server** screen.

![Upload settings screen of app](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/04-upload-settings.png?raw=true)

## App usage notes

The app should run as is on most modern computers running Windows, Linux, or Mac.

### Windows

There are no specific prerequisites.

### Linux

As per the [official AppImage documentation](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html):

>AppImages based on Electron require the kernel to be configured in a certain way to allow for its sandboxing to work as intended (specifically, the kernel needs to be allowed to provide “unprivileged namespaces”). Many distributions come with this configured out of the box (like Ubuntu for instance), but some do not (for example Debian).

Simply put, this means that if the AppImage fails to open properly, then you can confirm the output of the following command:

`sysctl kernel.unprivileged_userns_clone`

If the output is `kernel.unprivileged_userns_clone = 0`, then the AppImage will not run unless you run the following command and then reboot:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Before you do this, make sure you read up on what this change entails, for example [here](https://lwn.net/Articles/673597/).

### Mac

For various technical reasons, the auto-updater does not yet work on Macs. Mac users will have to periodically check for updates to this app and install them on their own.

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
