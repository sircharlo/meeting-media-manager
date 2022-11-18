---
tag: Help
title: Műszaki használati jegyzetek
ref: usage-notes
---

Az alkalmazásnak probléma nélkül futnia kell a legtöbb modern —Windows, Linux vagy Mac rendszert futtató — számítógépen.

### Windows: Telepítés és első lépések

A telepítő megnyitásakor egy [hibajelzést](assets/img/other/win-smartscreen.png) kaphat, amely szerint "A Windows SmartScreen megakadályozta egy ismeretlen alkalmazás elindítását". Ennek az az oka, hogy az alkalmazás nem rendelkezik nagyszámú letöltéssel, és ezért a Windows nem "bízik meg" benne. Ennek megkerüléséhez egyszerűen kattintson a "További információ", majd a "Futtatás mindenképpen" elemre.

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

A Windowstól és a Linuxtól eltérően az automatikus frissítési funkció **nincs** implementálva a macOS rendszeren, és technikai okokból valószínűleg soha nem is lesz. A Mac-felhasználókkal azonban két dolog fog történni, amikor a frissítés elérhetővé válik:

- Az M³ megpróbálja letölteni és automatikusan megnyitni a frissítőcsomagot, majd Önnek manuálisan kell befejeznie a frissítés telepítését úgy, hogy a frissített programot az Alkalmazások mappába helyezi. Ezután a szokásos módon elindíthatják az újonnan frissített M³ programot az Alkalmazások mappából.
- Ha az előző lépés bármelyik szakaszában sikertelen, az M³ egy állandó értesítést jelenít meg, amely jelzi, hogy elérhető a frissítés, és hivatkozik erre a frissítésre. Az M³ főképernyőjének beállítások gombján egy piros, pulzáló értesítés is megjelenik. A beállítások képernyőn az M³ verziószám egy gombként fog megjelenni, amelyre kattintva automatikusan megnyílik a legújabb kiadás letöltési oldala.
