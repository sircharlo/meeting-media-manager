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

Az M³ alapjául szolgáló szinkronizálási mechanizmus a WebDAV protokollt használja. Ez azt jelenti, hogy a Videokonferencia-szervezőnek (vagy valakinek a felügyelete alatt) a következőket kell tennie:

- egy biztonságos WebDAV-kiszolgáló beállítása, amely az interneten keresztül elérhető, **vagy**
- olyan harmadik féltől származó felhőalapú tárhelyszolgáltatást kell igénybe vennie, amely támogatja a WebDAV protokollt (lásd a *Webcím* beállítást a *Szinkronizálás beállítása* szakaszban).

A szinkronizálni szándékozó összes felhasználót ugyanahhoz a WebDAV-kiszolgálóhoz kell csatlakoztatni a videokonferencia-szervező által megadott kapcsolódási információk és hitelesítő adatok segítségével.

### Gyülekezeti szinkronizálás beállítása

| Beállítás                          | Magyarázat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Hosztnév`                         | A WebDAV-kiszolgáló webcíme. Biztonságos HTTP (HTTPS) szükséges. <br><br> ***Megjegyzés:**Ennek a mezőnek a címkéje valójában egy gomb, amelyre kattintva megjelenik az M³ programmal együttműködő WebDAV szolgáltatók listája, és automatikusan kitölti az adott szolgáltatók bizonyos beállításait. <br><br> Ez a lista kizárólag kedvességből készült, és semmiképpen nem jelenti egy adott szolgáltatás vagy szolgáltató támogatását. A legjobb szerver mindig az, amelyik az Ön tulajdonában van...*                        |
| `Felhasználónév`                   | Felhasználónév a WebDAV szolgáltatáshoz.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `Jelszó`                           | Jelszó a WebDAV szolgáltatáshoz. <br><br> ***Megjegyzés:** Ahogy azt a megfelelő támogatási oldalakon részletesen leírják, a [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) és a [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) esetében alkalmazásspecifikus jelszót kell létrehozni a szolgáltatásaikhoz való WebDAV-kapcsolat engedélyezéséhez.*                                                                                                     |
| `Gyülekezet szinkronizációs mappa` | Ez az a mappa, amely a média szinkronizálására szolgál az összes – gyülekezeti szinkronizálást végző – felhasználó számára. Beírhat/beilleszthet egy elérési utat, vagy az egérrel navigálhat a célmappához. <br><br> ***Megjegyzés:** Győződjön meg róla, hogy minden gyülekezeti szinkronizáló felhasználó ugyanazt a mappa elérési útvonalat adja meg, különben a szinkronizálás nem fog megfelelően működni.*                                                                                                                            |
| `Gyülekezet-szintű beállítások`    | Miután a Videokonferencia-szervező a saját számítógépén konfigurálta a *Média beállítás* és a *Összejövetel beállítás* szakaszokat a [ Beállításokban]({{page.lang}}/#configuration), ezzel a gombbal érvényesíthet bizonyos beállításokat az összes gyülekezeti szinkronizáló felhasználó számára (például az összejövetelek napjai, a média nyelve, a konvertálási beállítások stb.). Ez azt jelenti, hogy a kiválasztott beállítások kötelezően alkalmazásra kerülnek az összes szinkronizált felhasználóra, valahányszor megnyitják az M³ programot. |

### A gyülekezeti szinkronizálás használata a média kezelésére

Miután a gyülekezeti szinkronizálás beállítása befejeződött, megkezdheti a [Média kezelését]({{page.lang}}/#manage-media) a gyülekezet műszaki támogató csapata számára.

### Képernyőképek a gyülekezeti szinkronizáció működéséről

{% include screenshots/congregation-sync.html lang=site.data.hu %}
