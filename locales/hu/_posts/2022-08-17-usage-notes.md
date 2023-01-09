---
tag: Súgó
title: Műszaki használati jegyzetek
ref: usage-notes
---

Az alkalmazásnak probléma nélkül futnia kell a legtöbb modern —Windows, Linux vagy Mac rendszert futtató — számítógépen.

### Windows: Telepítés és első lépések

On opening the installer, you might get an [error](assets/img/other/win-smartscreen.png) indicating that "Windows SmartScreen prevented an unrecognized app from starting". This is due to the app not having a high number of downloads, and consequently not being explicitly "trusted" by Windows. To get around this, simply click on "More info", then "Run anyway".

### Linux: Telepítés és első lépések

A [hivatalos AppImage dokumentáció](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html) szerint, ha az alkalmazás nem nyílik meg megfelelően, ellenőrizze a következő parancs kimenetét:

`ysctl kernel.unprivileged_userns_clone`

Ha a kimenet `0`, akkor az AppImage **nem** fog futni, hacsak nem futtatja a következő parancsot, amelyet egy újraindítás követ:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Mielőtt ezt megteszi, mindenképpen olvassa el, hogy [mivel jár ez](https://lwn.net/Articles/673597/).

### MacOS: Telepítés és első lépések

Ha az alkalmazás elindításakor figyelmeztetést kap, hogy az alkalmazás nem nyitható meg, mert "nem az App Store-ból lett letöltve", vagy mert "a fejlesztő nem ellenőrizhető", akkor ez az [Apple támogatási oldal](https://support.apple.com/en-ca/HT202491) segít, hogy túljusson ezen.

Ha azt az üzenetet kapja, hogy "nincs jogosultsága az alkalmazás megnyitásához", próbáljon ki néhány megoldást ezen [az oldalon](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860).

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### MacOS: Automatikus frissítés

Unlike Windows and Linux, auto-update functionality is **not** implemented on macOS, and for technical reasons probably never will be. However, one of two things will happen for Mac users when an update is available:

- M³ will attempt to download the update package and open it automatically, after which the user will have to manually complete the installation of the M³ update by dragging and dropping the updated app to their Applications folder. Then, they will be able to launch the newly updated M³ from their Applications folder as usual.
- If the previous step fails at any stage, M³ will display a persistent notification indicating that an update is available, with a link to the update itself. A red, pulsing notification will also be displayed on the settings button in the main screen of M³. The M³ version number in the settings screen will turn into a button that, once clicked, opens the latest release's download page automatically.
