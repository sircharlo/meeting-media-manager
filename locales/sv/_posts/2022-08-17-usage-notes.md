---
tag: Hjälp
title: Anmärkningar om teknisk användning
ref: usage-notes
---

Appen bör kunna köras som den är på de flesta moderna datorer som kör Windows, Linux eller Mac.

### Windows: Installation och första uppstart

On opening the installer, you might get an [error](assets/img/other/win-smartscreen.png) indicating that "Windows SmartScreen prevented an unrecognized app from starting". This is due to the app not having a high number of downloads, and consequently not being explicitly "trusted" by Windows. To get around this, simply click on "More info", then "Run anyway".

### Linux: Installation och första uppstart

Enligt [officiell AppImage-dokumentation](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), om appen inte öppnas ordentligt, bekräfta utmatningen av följande kommando:

`ysctl kernel.unprivileged_userns_clone`

Om utdata är `0` kommer AppImage **inte** att köras om du inte kör följande kommando, följt av en omstart:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Se till att du läser på [vad detta innebär](https://lwn.net/Articles/673597/) innan du gör detta.

### MacOS: Installation och första uppstart

Om du när du startar appen får en varning om att appen inte kan öppnas, antingen för att "den inte laddades ner från App Store" eller för att "utvecklaren inte kan verifieras", så hjälper denna [Apples supportsida](https://support.apple.com/en-ca/HT202491) dig att komma förbi det.

Om du får ett meddelande som indikerar att du "inte har behörighet att öppna programmet", försök med några lösningar från [denna sida](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860).

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### MacOS: Automatisk uppdatering

Unlike Windows and Linux, auto-update functionality is **not** implemented on macOS, and for technical reasons probably never will be. However, one of two things will happen for Mac users when an update is available:

- M³ will attempt to download the update package and open it automatically, after which the user will have to manually complete the installation of the M³ update by dragging and dropping the updated app to their Applications folder. Then, they will be able to launch the newly updated M³ from their Applications folder as usual.
- If the previous step fails at any stage, M³ will display a persistent notification indicating that an update is available, with a link to the update itself. A red, pulsing notification will also be displayed on the settings button in the main screen of M³. The M³ version number in the settings screen will turn into a button that, once clicked, opens the latest release's download page automatically.
