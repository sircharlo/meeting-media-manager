# JW Meeting Media Fetcher

Welcome! Here is a simple app that facilitates the downloading of media that will be considered during congregation meetings of Jehovah's Witnesses, to be used for example during personal study, to share using Zoom, or when using JW Library is not possible or feasible for various reasons.

## Prerequisites

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

## Installation and usage

Simply download the latest [installer](https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest) and run it. Once the setup is complete, a shortcut to the app will be placed on your desktop. Open the app, and configure the settings as you please. Once you execute the media sync, all downloaded media will be placed in the folder of your choosing.

## Using with Zoom

Of note is the setting to convert all images to MP4 files ("Enable beta MP4 generation"), which will allow for both pictures and videos to be shared using the native Zoom MP4 sharing feature (new as of February 1st, 2021). This would potentially be much easier and result in better quality for the meeting participants than sharing your local monitor or the media playback window through Zoom's screen sharing feature. 


## Does this app infringe the JW.org Terms of Use?

No, the JW.org [Terms of Use](https://www.jw.org/en/terms-of-use) actually *explicitly allow* this kind of usage. Here is the relevant excerpt from those terms(emphasis mine):

>You may not:
>
> Create for distribution purposes, any software applications, tools, or techniques that are specifically made to collect, copy, download, extract, harvest, or scrape data, HTML, images, or text from this site. **(This does *not* prohibit the distribution of free, non-commercial applications designed to download electronic files such as EPUB, PDF, MP3, and MP4 files from public areas of this site.)**

## Help!

If ever you run into any issues with the app or the underlying script, please let me know.

*- COS*
