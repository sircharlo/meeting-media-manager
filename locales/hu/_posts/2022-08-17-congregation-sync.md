---
tag: Configuration
title: Gyülekezet szinkronizálás
ref: congregation-sync
---

A vének testülete által _videokonferencia-szervezőnek_ (VO) kijelölt testvér az M³ segítségével kezelheti, hogy milyen médiát tesz elérhetővé a gyülekezete technikai Audio/Video támogató csoportja számára.

A videokonferencia szervezője vagy az általa kijelölt személy a következőket teheti:

- **kiegészítő** média feltöltése, amelyet az összejövetel során kell megosztani, például a körzetfelvigyázó látogatásához vagy a nyilvános előadók előadásaihoz.
- **elrejti** az olyan médiát a JW.org-ról, amely nem releváns az adott összejövetel szempontjából, például ha egy programrészt a helyi gyülekezet lecserélt.
- **ismétlődő** média hozzáadása vagy eltávolítása, például egy éviszöveges videó vagy egy bejelentés.

Mindenki, aki ugyanahhoz a gyülekezethez van szinkronizálva, pontosan ugyanazt a médiát fogja kapni, amikor a _Médiamappák frissítése_ gombra kattint.

Felhívjuk figyelmét, hogy a gyülekezet szinkronizálási funkció választható és teljesen opcionális.

### Hogyan működik

Az M³ szinkronizációs mechanizmusa WebDAV protokollt használ. Ez azt jelenti, hogy a videokonferencia szervezőjének (vagy valakinek az ő megbízásából) a következőket kell tennie:

- egy biztonságos WebDAV-kiszolgáló beállítása, amely az interneten keresztül elérhető, **vagy**
- olyan harmadik féltől származó felhő alapú tárhelyszolgáltatást használ, amely támogatja a WebDAV protokollt (lásd a Hosztnév beállítást az alábbi _Gyülekezeti szinkronizálás beállítása_ szakaszban).

A szinkronizálni szándékozó összes felhasználót ugyanahhoz a WebDAV-kiszolgálóhoz kell csatlakoztatni a videokonferencia-szervező által megadott kapcsolódási információk és hitelesítő adatok segítségével.

### Gyülekezeti szinkronizálás beállítása

| Beállítás | Magyarázat |
| ------- | ----------- |
| `Hosztnév` | A WebDAV-kiszolgáló webcíme. Biztonságos HTTP (HTTPS) kapcsolat használata szükséges. <br><br> _**Megjegyzés:** A mező címkéje valójában egy gomb, amelyre kattintva megjelenik az M³-al ismerten működő WebDAV-szolgáltatók listája, és automatikusan előre kitölti az adott szolgáltatók bizonyos beállításait. <br><br> Ez a lista kizárólag udvariasságból készült, és semmiképpen nem jelenti egy adott szolgáltatás vagy szolgáltató jóváhagyását. A legjobb szerver mindig az, amelyik az Öné..._ |
| `Felhasználónév` | Felhasználónév a WebDAV szolgáltatáshoz. |
| `Jelszó` | Jelszó a WebDAV szolgáltatáshoz. <br><br> _**Megjegyzés:** A megfelelő támogatási oldalakon leírtak szerint a [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) és a [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) esetében alkalmazásspecifikus jelszót kell létrehozni a szolgáltatásaikhoz való WebDAV-kapcsolat engedélyezéséhez._ |
| `Gyülekezet szinkronizációs mappa` | Ez az a mappa, amely minden gyülekezeti felhasználó számára a média szinkronizálására szolgál. Beírhat/beilleszthet egy elérési útvonalat, vagy egérrel navigálhat a célmappához. <br><br> _**Megjegyzés:** Győződjön meg róla, hogy minden gyülekezeti felhasználó ugyanazt a mappa elérési útvonalat adja meg, ellenkező esetben a szinkronizálás nem fog megfelelően működni._ |
| `Gyülekezet-szintű beállítások` | Miután a videokonferencia-szervező a saját számítógépén beállította a Média beállítása és Összejövetel beállítása szakaszokat a [Beállítások]({{page.lang}}/#configuration) ban, ezzel a gombbal érvényesíthet bizonyos beállításokat az összes gyülekezeti szinkronizációt végző felhasználó számára. (például az összejövetelek napjai, a média nyelve, a konvertálási beállítások stb.). Ez azt jelenti, hogy a kiválasztott beállítások minden alkalommal, amikor az M³ programot megnyitják, minden szinkronizált felhasználó esetén érvénybe lépnek. |

### A gyülekezeti szinkronizálás használata a média kezelésére

Ha a gyülekezeti szinkronizálás beállítása befejeződött, akkor készen áll a [Média kezelése]({{page.lang}}/#manage-media) elindítására a gyülekezet műszaki támogató csoportja részére.

### Képernyőképek a gyülekezeti szinkronizáció működéséről

{% include screenshots/congregation-sync.html lang=site.data.hu %}
