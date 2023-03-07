---
tag: Súgó
title: Műszaki használati jegyzetek
ref: usage-notes
---

Az alkalmazásnak változatlanul futnia kell a legtöbb modern, Windows, Linux vagy macOS operációs rendszert futtató számítógépen.

### Windows: Telepítés és első lépések

A telepítő megnyitásakor előfordulhat, hogy egy [hiba](assets/img/other/win-smartscreen.png) jelzi, hogy "A Windows SmartScreen megakadályozta egy fel nem ismert alkalmazás elindítását". Ennek oka, hogy az alkalmazás nem rendelkezik nagyszámú letöltéssel, és ezért a Windows nem "bízik meg" benne. Ennek megkerüléséhez egyszerűen kattintson a "További információk", majd a "Futtatás mindenképpen" gombra.

### Linux: Telepítés és első lépések

A [hivatalos AppImage dokumentáció](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html) szerint, ha az alkalmazás nem nyílik meg megfelelően, ellenőrizze a következő parancs kimenetét:

`sysctl kernel.unprivileged_userns_clone`

Ha a kimenet `0`, akkor az AppImage **nem** fog futni, hacsak nem futtatja a következő parancsot, amelyet egy újraindítás követ:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Mielőtt ezt megteszi, mindenképpen olvassa el, hogy [mivel jár ez](https://lwn.net/Articles/673597/).

### macOS: Telepítés és első használatba vétel

Ha az alkalmazás elindításakor figyelmeztetést kap, hogy az alkalmazás nem nyitható meg, mert "nem az App Store-ból lett letöltve", vagy mert "a fejlesztő nem ellenőrizhető", akkor ez az [Apple támogatási oldal](https://support.apple.com/en-ca/HT202491) segít, hogy túljusson ezen.

Ha azt az üzenetet kapja, hogy "nincs jogosultsága az alkalmazás megnyitásához", próbáljon ki néhány megoldást ezen [az oldalon](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860).

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Automatikus frissítés

A Windowstól és a Linux-tól eltérően az automatikus frissítési funkció **nem** elérhető a macOS-en, és technikai okokból valószínűleg soha nem is lesz. A macOS-felhasználók esetében azonban két dolog fog történni, amikor a frissítés elérhetővé válik:

- Az M³ megpróbálja letölteni a frissítőcsomagot, és automatikusan megnyitja azt, majd a felhasználónak kézzel kell befejeznie az M³ frissítés telepítését a frissített alkalmazásnak az Alkalmazások mappába történő húzásával. Ezután a szokásos módon elindíthatja az újonnan frissített M³ programot az Alkalmazások mappából.
- Ha az előző lépés bármelyik szakaszában sikertelen, az M³ egy állandó értesítést jelenít meg, amely jelzi, hogy elérhető a frissítés, és hivatkozik magára a frissítésre. Az M³ főképernyőjének beállítások gombján egy piros, pulzáló értesítés is megjelenik. A beállítások képernyőn az M³ verziószám egy gombbá változik, amelyre kattintva automatikusan megnyílik a legújabb kiadás letöltési oldala.
