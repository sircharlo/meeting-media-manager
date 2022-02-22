---
category: Help
title: Technical usage notes
layout: null
---

The app should run as is on most modern computers running Windows, Linux, or Mac.

### Windows

#### Installation and first launch

On opening the installer, you might get <a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/win-smartscreen.png?raw=true" target="_blank">an error</a> indicating that "Windows SmartScreen prevented an unrecognized app from starting". This is due to the app not having a high number of downloads, and consequently not being explicitly "trusted" by Windows. To get around this, simply click on "More info", then "Run anyway".

### Linux

#### Installation and first launch

As per the <a href="https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html" target="_blank">official AppImage documentation</a>, if the app fails to open properly, confirm the output of the following command:

`sysctl kernel.unprivileged_userns_clone`

If the output is `0`, then the AppImage will **not** run unless you run the following command, followed by a reboot:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Make sure you read up on <a href="https://lwn.net/Articles/673597/" target="_blank">what this change entails</a> before you do this.

### Mac

#### Installation and first launch

If upon launching the app, you receive a warning that the app cannot be opened, either because "it was not downloaded from the App store" or because "the developer cannot be verified", then this <a href="https://support.apple.com/en-ca/HT202491" target="_blank">Apple support page</a> will help you to get past that.

If you get a message indicating that you "do not have permission to open the application", then try some solutions from <a href="https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860" target="_blank">this page</a>. For example, you could try running this command in Terminal:

`codesign --force --deep --sign - "/path/to/JW Meeting Media Fetcher.app"`

#### Auto-update

Unlike Windows and Linux, auto-update functionality is **not** implemented on macOS, and for technical reasons probably never will be. However, one of two things will happen for Mac users when an update is available:

- JWMMF will attempt to download the update package and open it automatically, after which it will quit. The user will then have to manually complete the installation of the JWMMF update by dragging and dropping the updated app to their Applications folder, after which they will be able to launch the newly updated JWMMF from their Applications folder.

- If the previous step fails at any stage, JWMMF will display a persistent notification indicating that an update is available, with a link to the update itself. A red, pulsing notification will also be displayed on the settings button in the main screen of JWMMF. The JWMMF version number in the settings screen will turn into a button that, once clicked, opens the latest release's download page automatically.
