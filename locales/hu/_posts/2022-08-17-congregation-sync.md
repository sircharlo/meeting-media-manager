---
tag: Configuration
title: Gyülekezet szinkronizálás
ref: congregation-sync
---

A vének testülete által *videokonferencia-szervezőnek* (VO) kijelölt testvér az M³ segítségével kezelheti, hogy milyen médiát tesz elérhetővé a gyülekezete technikai Audio/Video támogató csoportja számára.

A videokonferencia szervezője vagy az általa kijelölt személy a következőket teheti:

- **kiegészítő** média feltöltése, amelyet az összejövetel során kell megosztani, például a körzetfelvigyázó látogatásához vagy a nyilvános előadók előadásaihoz
- **elrejti** az olyan médiát a JW.org-ról, amely nem releváns az adott összejövetel szempontjából, például ha egy programrészt a helyi gyülekezet lecserélt
- **ismétlődő** média hozzáadása vagy eltávolítása, például egy éviszöveges videó vagy egy bejelentés

Mindenki, aki ugyanahhoz a gyülekezethez van szinkronizálva, pontosan ugyanazt a médiát fogja kapni, amikor a *Médiamappák frissítése* gombra kattint.

Felhívjuk figyelmét, hogy a gyülekezet szinkronizálási funkció választható és teljesen opcionális.

### Hogyan működik

M³'s underlying sync mechanism uses WebDAV. This means that the VO (or someone under his supervision) needs to either:

- egy biztonságos WebDAV-kiszolgáló beállítása, amely az interneten keresztül elérhető, **vagy**
- use a third-party cloud storage service that supports the WebDAV protocol (see the *Web address* setting in the *Congregation sync setup* section below).

A szinkronizálni szándékozó összes felhasználót ugyanahhoz a WebDAV-kiszolgálóhoz kell csatlakoztatni a videokonferencia-szervező által megadott kapcsolódási információk és hitelesítő adatok segítségével.

### Gyülekezeti szinkronizálás beállítása

| Beállítás                          | Magyarázat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Hosztnév`                         | Web address of the WebDAV server. Secure HTTP (HTTPS) is required. <br><br> ***Note:** The label for this field is actually a button that, once clicked, will show a list of WebDAV providers that have been known to be compatible with M³, and will automatically prefill certain settings for those providers. <br><br> This list is provided as a courtesy, and in no way represents an endorsement of any particular service or provider. The best server is always the one you own...* |
| `Felhasználónév`                   | Felhasználónév a WebDAV szolgáltatáshoz.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `Jelszó`                           | Password for the WebDAV service. <br><br> ***Note:** As detailed in their respective support pages, an app-specific password might need to be created for [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) and [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) in order to enable WebDAV connections to their services.*                                                                                               |
| `Gyülekezet szinkronizációs mappa` | This is the folder that will be used to synchronize media for all congregation sync users. You can either type/paste in a path, or use your mouse to navigate to the target folder. <br><br> ***Note:** Make sure that all congregation sync users input the same folder path; otherwise the sync won't work as expected.*                                                                                                                                                                               |
| `Gyülekezet-szintű beállítások`    | Once the VO has configured the *Media setup* and *Meeting setup* sections of the [Settings]({{page.lang}}/#configuration) on his own computer, he can then use this button to enforce certain settings for all congregation sync users (for example, meeting days, media language, conversion settings, and so on). This means that the selected settings will be forcefully applied for all synced users every time they open M³.                                                                                   |

### A gyülekezeti szinkronizálás használata a média kezelésére

Ha a gyülekezeti szinkronizálás beállítása befejeződött, akkor készen áll a [Média kezelése]({{page.lang}}/#manage-media) elindítására a gyülekezet műszaki támogató csoportja részére.

### Képernyőképek a gyülekezeti szinkronizáció működéséről

{% include screenshots/congregation-sync.html lang=site.data.hu %}
