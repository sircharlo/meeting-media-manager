---
category: Help
title: Technical usage notes
layout: null
---

The app should run as is on most modern computers running Windows, Linux, or Mac.

### Windows
On opening the installer, you might get <a href="https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/docs/screenshots/win-smartscreen.png?raw=true" target="_blank">an error</a> indicating that "Windows SmartScreen prevented an unrecognized app from starting". This is due to the app not having a high number of downloads, and consequently not being explicitly "trusted" by Windows. To get around this, simply click on "More info", then "Run anyway".

### Linux
As per the <a href="https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html" target="_blank">official AppImage documentation</a>, if the app fails to open properly, confirm the output of the following command:

`sysctl kernel.unprivileged_userns_clone`

If the output is:

`0`

... then the AppImage will **not** run unless you run the following command, followed by a reboot:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Make sure you read up on <a href="https://lwn.net/Articles/673597/" target="_blank">what this change entails</a> before you do this.

### Mac

For technical reasons, the auto-updater does not work on macOS (and probably never will). Mac users will however see a red, pulsing notification on the main screen of JWMMF, and in the settings, when an update is available. Clicking on the notification in Settings will open the latest release's download page automatically.

If upon launching the app, you receive a warning that the app cannot be opened, either because "it was not downloaded from the App store" or because "the developer cannot be verified", then this <a href="https://support.apple.com/en-ca/HT202491" target="_blank">Apple support page</a> will help you to get past that.

If you get a message indicating that you "do not have permission to open the application", then try some solutions from <a href="https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860" target="_blank">this page</a>. For example, you could try running this command in Terminal:

`codesign --force --deep --sign - "/path/to/JW Meeting Media Fetcher.app"`
