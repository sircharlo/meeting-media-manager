---
tag: Help
title: Tekniset käyttöohjeet
ref: usage-notes
---

Sovelluksen pitäisi toimia useimmissa nykyaikaisissa Windows-, Linux- tai Mac-tietokoneissa.

### Windows: Asennus ja ensimmäinen käynnistys

On opening the installer, you might get an [error](assets/img/other/win-smartscreen.png) indicating that "Windows SmartScreen prevented an unrecognized app from starting". This is due to the app not having a high number of downloads, and consequently not being explicitly "trusted" by Windows. To get around this, simply click on "More info", then "Run anyway".

### Linux: Asennus ja ensimmäinen käynnistys

[virallinen AppImage-dokumentaatio](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html):n mukaisesti, jos sovellus ei avaudu kunnolla, vahvista seuraavan komennon tulos:

`ysctl kernel.unprivileged_userns_clone`

Jos tulos on `0`, AppImage **ei** suoriteta, ellet suorita seuraavaa komentoa ja sen jälkeen uudelleenkäynnistystä:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Muista lukea [mitä tämä pitää sisällään](https://lwn.net/Articles/673597/) ennen kuin teet tämän.

### MacOS: Asennus ja ensimmäinen käynnistys

Jos saat sovelluksen käynnistämisen yhteydessä varoituksen, että sovellusta ei voi avata, joko siksi, että "se ei ole ladattu App Storesta" tai koska "kehittäjää ei voida vahvistaa", tämä [Applen tukisivu](https://support.apple.com/en-ca/HT202491) auttaa sinua pääsemään ohi että.

Jos saat viestin, joka ilmoittaa, että sinulla ei ole oikeutta avata sovellusta, kokeile joitain ratkaisuja osoitteesta [tämä sivu](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860).

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### MacOS: Automaattinen päivitys

Unlike Windows and Linux, auto-update functionality is **not** implemented on macOS, and for technical reasons probably never will be. However, one of two things will happen for Mac users when an update is available:

- M³ will attempt to download the update package and open it automatically, after which the user will have to manually complete the installation of the M³ update by dragging and dropping the updated app to their Applications folder. Then, they will be able to launch the newly updated M³ from their Applications folder as usual.
- If the previous step fails at any stage, M³ will display a persistent notification indicating that an update is available, with a link to the update itself. A red, pulsing notification will also be displayed on the settings button in the main screen of M³. The M³ version number in the settings screen will turn into a button that, once clicked, opens the latest release's download page automatically.
