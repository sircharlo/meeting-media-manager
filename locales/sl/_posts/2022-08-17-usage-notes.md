---
tag: Pomoč
title: Technical usage notes
ref: usage-notes
---

The app should run as is on most modern computers running Windows, Linux, or macOS.

### Windows: Installation and first launch

On opening the installer, you might get an [error](assets/img/other/win-smartscreen.png) indicating that "Windows SmartScreen prevented an unrecognized app from starting". This is due to the app not having a high number of downloads, and consequently not being explicitly "trusted" by Windows. To get around this, simply click on "More info", then "Run anyway".

### Linux: Installation and first launch

As per the [official AppImage documentation](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), if the app fails to open properly, confirm the output of the following command:

`sysctl kernel.unprivileged_userns_clone`

If the output is `0`, then the AppImage will **not** run unless you run the following command, followed by a reboot:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Make sure you read up on [what this entails](https://lwn.net/Articles/673597/) before you do this.

### macOS: Installation and first launch

If upon launching the app, you receive a warning that the app cannot be opened, either because "it was not downloaded from the App store" or because "the developer cannot be verified", then this [Apple support page](https://support.apple.com/en-ca/HT202491) will help you to get past that.

Če se prikaže sporočilo, da "nimaš dovoljenja za odprtje aplikacije", poskusi z nekaterimi rešitvami, omenjenimi na [tej strani](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860), na primer z naslednjim ukazom v programu `Terminal.app`:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Težave z dovoljenji za zvok ali mikrofon v macOS Sonoma

Nekateri uporabniki operacijskega sistema macOS Sonoma lahko naletijo na težavo, ko program M³ večkrat prikaže sporočilo o napaki, s katero javlja, da potrebuje dostop do mikrofona. Izvršitev naslednjega ukaza v `Terminal.app` je pri nekaterih odpravilo težavo:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Auto-update

Unlike Windows and Linux, auto-update functionality is **not** implemented on macOS, and for technical reasons probably never will be. However, one of two things will happen for macOS users when an update is available:

- M³ will attempt to download the update package and open it automatically, after which the user will have to manually complete the installation of the M³ update by dragging and dropping the updated app to their Applications folder. Then, they will be able to launch the newly updated M³ from their Applications folder as usual.
- If the previous step fails at any stage, M³ will display a persistent notification indicating that an update is available, with a link to the update itself. A red, pulsing notification will also be displayed on the settings button in the main screen of M³. The M³ version number in the settings screen will turn into a button that, once clicked, opens the latest release's download page automatically.
