---
tag: Configuration
title: Beállítások
ref: configuration
---

A Beállítások képernyő 4 részre van osztva. A legtöbb beállítás könnyen érthető, de itt van néhány kiegészítő információ.

### Alkalmazás beállítása

| Beállítás | Magyarázat |
| `Megjelenítési nyelv` | Beállítja az M³ megjelenítési nyelvét. <br><br> Köszönjük számos közreműködőnknek, hogy az alkalmazást ilyen sok nyelvre lefordították! Ha szeretne segíteni egy meglévő fordítás javításában vagy egy új fordítás elkészítésében, kérjük, nyisson egy új ["discussion"]({{site.github}}/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M%C2%B3+into+a+language+I+speak,+LANGUAGE)-t (angol nyelven). |
| `Mappa, amelybe a médiát menteni kívánja` | Az összejövetel médiája ebbe a mappába kerül mentésre a későbbi megosztás és felhasználás céljából. |
| `Alkalmazás futtatása a rendszer indításakor` | Ha engedélyezve van, az M³ elindul, amikor a jelenlegi felhasználó bejelentkezik a számítógépre. <br><br> _**Megjegyzés:** Linux operációs-rendszeren nem elérhető._ |
| `Automatikus médiaszinkronizálás kezdeményezése` | Ha engedélyezi ezt a lehetőséget, akkor az alkalmazás betöltése után 5 másodperccel automatikusan elindul a médiaszinkronizálás. <br><br> _Az automatikus szinkronizálás megakadályozásához, amikor ez a beállítás aktív, nyomja meg a ⏸ (szünet) gombot az 5 másodperces időtartam letelte előtt._ |
| `Mappa megnyitása a médiaszinkronizálás után` | Ha engedélyezve van, a kiválasztott hét letöltött médiáját tartalmazó mappa megnyílik a számítógép fájlkezelőjében, miután a médiaszinkronizálás befejeződött. |
| `Kilépés az alkalmazásból a médiaszinkronizálás után` | Ha engedélyezte ezt az opciót, akkor a médiaszinkronizálás befejezése után 5 másodperccel automatikusan kilép az alkalmazásból. <br><br> _Annak megelőzésére, hogy az alkalmazás automatikusan kilépjen, amikor ez a beállítás engedélyezve van, nyomja meg a 🏃 (személy távozása/futása) gombot, mielőtt az 5 másodperces időzítő lejár._ |
| `_OBS Studio_ kompatibilitási mód engedélyezése` | Ha engedélyezte, ez az opció az OBS Studio-t használja, hogy a jeleneteket szükség szerint automatikusan módosítsa a média megosztása előtt és után. <br><br> _Ha engedélyezi ezt a beállítást, ellenőrizze, hogy az OBS Studio úgy van beállítva, hogy használja a `obs-websocket` bővítményt, amely lehetővé teszi az M³ számára az OBS Studio-val való kommunikációt. <br><br> Emellett konfigurálja az összes szükséges jelenetet a médiamegosztáshoz és a színpadi megjelenítéshez az OBS-ben. Legalább egy olyan jelenetre van szükséged, amelynek Ablak felvétele (ajánlott) vagy Kijelző Felvétele funkciója úgy van beállítva, hogy rögzítse az M³ médiaablakát, vagy azt a kijelzőt, amelyen a média megjelenítésre kerül. <br><br> Az összes kívánt színpadnézeti jelenetet is be kell állítania, például: egy felvétel a pulpitusról, átfogó felvétel a színpadról, etc._ |
| `Port` | Az a port, amelyre a `obs-websocket` bővítmény van konfigurálva. |
| `Jelszó` | Az `obs-websocket` bővítmény beállításaiban megadott jelszó. |
| `Alapértelmezett színpadkép jelenet az OBS Studio-ban` | Válassza ki, hogy melyik jelenet legyen alapértelmezés szerint kiválasztva, amikor a médiaprezentációs mód elindul. Általában egy teljes színpadkép vagy egy pódiumfelvétel. |
| `Médiaablak jelenet az OBS Studio-ban` | Válassza ki, hogy az OBS Studio-ban melyik jelenet van beállítva az M³ médiaablak rögzítésére. |
| `Hardveres gyorsítás kikapcsolása` | Csak akkor engedélyezze ezt a beállítást, ha a médialejátszás móddal kapcsolatban problémák merülnek fel. A beállítás megváltoztatása az M³ újraindulását eredményezi. |

### Gyülekezeti szinkronizálás beállítása

A [Gyülekezet szinkronizálás]({{page.lang}}/#congregation-sync) szakaszban részletesen megtudhatja, hogy ez pontosan mit jelent, és hogyan kell ezt a részt beállítani.

### Média beállítása

| Beállítás | Magyarázat |
| `Média nyelve` | Válassza ki a gyülekezete vagy csoportja nyelvét. Minden médiatartalom ezen a nyelven kerül letöltésre a JW.org-ról. |
| `Maximális felbontás a videókhoz` | A JW.org-ról letöltött videók ebben a felbontásban vagy a következő rendelkezésre álló felbontásban kerülnek letöltésre. Hasznos forgalmi díjas vagy alacsony sávszélességű internetkapcsolat esetén. |
| `Média konvertálása MP4 formátumba` | Ez automatikusan átalakítja az összes kép- és hangfájlt MP4 formátumba, hogy a Zoom["native MP4 sharing feature"](assets/img/other/zoom-mp4-share.png)segítségével használhassa a **teljesen online** gyülekezeti Zoom összejövetelek során. Ez magában foglalja a JW.org-ról letöltött összes képet és médiafájlt, valamint a felhasználó vagy a videokonferencia-szervező által hozzáadott további médiafájlokat. <br><br> _**Megjegyzés:** Ez az opció a **kizárólag Zoom-on tartott** gyülekezeti összejövetelekhez a legalkalmasabb. Ha **hibrid** vagy **hagyományos** gyülekezeti összejöveteleket tartanak, akkor nézze meg a [Médiabemutató mód]({{page.lang}}/#present-media) használatát a `Média megjelenítése külső megjelenítőn vagy külön ablakban` opció aktiválásával, és kapcsolja ki ezt az opciót._ |
| `Az eredeti médiafájlok megtartása a konvertálás után` | Ha ez a beállítás engedélyezve van, a kép- és hangfájlok az MP4 formátumba konvertálás után a média mappában maradnak, és nem kerülnek törlésre. Ez egy némileg zsúfoltabb médiamappát eredményez, és általában nem kell engedélyezni, ha a Zoom MP4 megosztás funkcióval osztja meg a médiát. (Lásd a fenti `Média konvertálása MP4 formátumba`-t.) <br><br> _**Megjegyzés:** Csak akkor látható, ha a `Média konvertálása MP4 formátumba` is engedélyezve van._ |
| `Média megjelenítése külső megjelenítőn vagy külön ablakban` | Ez a beállítás lehetővé teszi, hogy az M³ segítségével képeket, videókat és hangfájlokat mutasson be **hibrid** vagy **személyes** gyülekezeti összejövetelek során. A ezután az M³ főképernyőjén a ▶️ (lejátszás) gombra kattintva érhető el. <br><br> A médiabemutató képernyő automatikusan egy külső monitort használ, ha van ilyen; ha nincs, a média egy különálló, átméretezhető ablakban jelenik meg. <br><br> _**Megjegyzés:** Ez a lehetőség leginkább **hibrid** vagy **hagyományos** gyülekezeti összejövetelekhez alkalmas. <br><br> Ha **kizárólag online** gyülekezeti Zoom összejöveteleket szervez, érdemes a Média konvertálása MP4 formátumba opciót aktiválni, és a médiát a Zoom beépített MP4 megosztójával megosztani._ |
| `Háttérkép a média megjelenítési módban` | Alapértelmezés szerint az M³ megpróbálja lekérni az aktuális éviszöveget az előzőleg kiválasztott nyelven, hogy azt fekete háttérrel megjelenítse, amikor [Médiabemutató mód]({{page.lang}}/#present-media) üzemmódban van, és nincs más média lejátszás alatt. Ha az automatikus éviszöveg lekérés valamilyen okból nem sikerül, vagy ha más háttérképet szeretne megjeleníteni, akkor vagy a "Tallózás" gombbal választhat ki egy egyéni képet, vagy a "Frissítés" gombbal próbálhatja meg újra automatikusan lekérni az évszöveget. <br><br> _**Megjegyzés:** Ha a [Gyülekezet szinkronizálás]({{page.lang}}/#congregation-sync) engedélyezve van, az egyéni háttérkép kiválasztásával az összes gyülekezeti felhasználó számára automatikusan megtörténik a szinkronizálás._ |
| `Lejátszási listák készítése _VLC_ használatához` | Engedélyezze ezt a beállítást, ha automatikusan lejátszási listákat szeretne létrehozni minden egyes összejövetelhez, amelyeket aztán a VLC programban használhat, ha azt az alkalmazást használja a média megjelenítésére a [Médiabemutató mód]({{page.lang}}/#present-media) helyett. |
| `Minden médiatartalom kihagyása a _th_ kiadványból` | Ha engedélyezve van, ez megakadályozza, hogy az _Odaadóan foglalkozz a felolvasással és a tanítással!_ című kiadványból származó média minden hét közbeni összejövetelen megjelenjen. |
| `Képek kihagyása az _lffi_ kiadványból` | Ha engedélyezve van, ez megakadályozza, hogy a _Boldogan élhetsz örökké!_ kiadványból (_lffi_) származó képek megjelenjenek, például a hétközbeni összejövetelen a tanulói feladatokhoz. |

### Összejövetel beállítása

| Beállítás | Magyarázat |
| `Hétköznapi összejövetel` | A hétközi összejövetel szokásos napjának és időpontjának feltüntetése; a mappák elnevezéséhez és a háttérzene automatikus kikapcsolásához használatos (lásd alább). |
| `Hétvégi összejövetel` | Adja meg a hétvégi összejövetel szokásos napját és időpontját. |
| `Engedélyező gomb a Királyság-énekek véletlenszerű lejátszásához` | Bekapcsol egy gombot a főképernyőn, amely az _Énekeljünk örömmel (sjj)_ című kiadványból véletlenszerű sorrendben lejátssza az énekeket. Ez hasznos például arra, hogy a Királyság-teremben tartott összejövetelek előtt és után háttérzeneként lejátsszuk a dalokat. |
| `A lejátszás hangereje` | Beállítja a háttérzene lejátszásának hangerejét. |
| `A dalok lejátszásának automatikus leállítása` | Ha a `Engedélyező gomb a Királyság-énekek véletlenszerű lejátszásához` aktív, akkor ezzel a beállítással megadhat egy késleltetést, amely után a háttérzene automatikusan leáll. Ez lehet a következő: meghatározott számú perc, vagy előre meghatározott számú másodperccel a megbeszélés kezdete előtt (abban az esetben, ha a háttérzene az összejövetel előtt indult el). |

### Képernyőképek a beállítási ablakról

{% include screenshots/configuration.html lang=site.data.hu %}
