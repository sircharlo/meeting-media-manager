# Az M³ használata egy Királyság-teremben

Ez az útmutató végigvezeti Önt a **Meeting Media Manager (M³)** letöltésének, telepítésének és beállításának folyamatán egy Királyság-teremben. Kövesse ezeket a lépéseket, hogy zökkenőmentesen tudja a médiaanyagokat kezelni a gyülekezeti összejövetelek során.

## 1. Letöltés és telepítés

1. Látogasson el az [M³ letöltési oldalra](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Töltse le az operációs rendszerének megfelelő verziót (Windows, macOS vagy Linux).
3. Nyissa meg a telepítőt, és kövesse a képernyőn megjelenő utasításokat az M³ telepítéséhez.
4. Indítsa el az M³ programot.
5. Menjen végig a konfigurációs varázslón.

## 2) Konfigurációs varázsló

### Az alkalmazás megjelenítési nyelve

Az M³ első indításakor a rendszer kéri, hogy válassza ki a kívánt **megjelenítési nyelvet**. Válassza ki azt a nyelvet, amelyet az M³ felületén kíván használni.

:::tip Tipp

Ez a nyelv nem kell, hogy megegyezzen azzal a nyelvvel, amelyen az M³ a médiatartalmakat letölti. A médiatartalmak letöltésének nyelve egy későbbi lépésben kerül beállításra.

:::

### Profil típusa

A következő lépés a **profil típusának** kiválasztása. A Királyság-teremben történő szokásos beállításhoz válassza a **Szokásos** lehetőséget. Ez számos, a gyülekezeti összejöveteleken általánosan használt funkciót fog beállítani.

:::warning Figyelem

Csak akkor válassza a **Más** lehetőséget, ha olyan profilt hoz létre, amelyhez nem kell automatikusan médiatartalmakat letölteni. A médiaanyagokat manuálisan kell importálni az ezzel a profillal való használathoz. Ez a fajta profil elsősorban arra szolgál, hogy az M³ programot teokratikus iskolákon, összejöveteleken, kongresszusokon és egyéb különleges eseményeken használják.

Az **Egyéb** profiltípust ritkán kell használni. **A gyülekezeti összejövetelek során történő normál használathoz válassza a _Szokásos_ opciót.**

:::

### Automatikus gyülekezetkeresés

Az M³ megpróbálhatja automatikusan megkeresni a gyülekezet összejöveteleinek időpontját, nyelvét és formázott nevét.

Ehhez használja a **Gyülekezet keresése** gombot a gyülekezet neve mező mellett, és adja meg legalább részben a gyülekezet nevét és a várost.

Ha megtalálta és kiválasztotta a megfelelő gyülekezetet, az M³ előre kitölti az összes rendelkezésre álló információt, például a gyülekezet **nevét**, **az összejövetelek nyelvét** és **az összejövetelek napját és időpontját**.

:::info Megjegyzés

Ez a lekérdezés Jehova Tanúi hivatalos honlapjának nyilvánosan elérhető adatait használja.

:::

### A gyülekezeti információk kézi bevitele

Ha az automatikus keresés nem találta meg az Ön gyülekezetét, természetesen kézzel is megadhatja a szükséges adatokat. A varázsló lehetővé teszi, hogy felülvizsgálja és/vagy megadja a gyülekezet **nevét**, **az összejövetelek nyelvét**, valamint **az összejövetelek napját és időpontját**.

### Videók gyorsítótárazása az énekkönyvből

Lehetősége lesz arra is, hogy **minden videót letöltsön az énekkönyvből**. Ez az opció előre letölti az összes zenei videót, csökkentve ezzel a jövőbeni összejövetelekhez szükséges médiatartalmak betöltésének idejét.

- **Előnyök:** Az összejövetelekre szánt médiafájlok sokkal gyorsabban elérhetők lesznek.
- **Hátrányok:** A média gyorsítótára jelentősen, körülbelül 5 Gb-tal megnő.

:::tip Tipp

Ha a Királyság-terem számítógépe elegendő tárhellyel rendelkezik, akkor a hatékonyság és az érzékelhető teljesítmény növelése érdekében ajánlott **engedélyezni** ezt az opciót.

:::

### OBS Studio integráció konfigurálása (opcionális)

Ha az Ön Királyság-terme **OBS Studio**-t használ a hibrid összejövetelek Zoom-on keresztüli közvetítésére, akkor az M³ automatikusan integrálható ezzel a programmal. A beállítás során a következő adatok megadásával konfigurálhatja az OBS Studio integrációját:

- **Port:** Az OBS Studio Websocket bővítményhez történő csatlakozáshoz használt portszám.
- **Jelszó:** Az OBS Studio Websocket bővítményhez történő csatlakozáshoz használt jelszó.
- **Jelenetek:** Az OBS jelenetek, amelyeket a média bemutatásakor fognak használni. Szüksége lesz egy jelenetre, amely a médiaablakot vagy a képernyőt veszi fel, és egy másikra, amely a pódiumot mutatja.

:::tip Tipp

Ha a gyülekezete rendszeresen tart hibrid összejöveteleket akkor **kifejezetten** ajánlott engedélyezni az OBS Studio integrációját.

:::

## 3. Élvezze az M³ használatát

Miután a beállítási varázslóval elkészült, az M³ készen áll arra, hogy segítsen a gyülekezeti összejövetelek médiaanyagainak kezelésében és megjelenítésében. Élvezze az alkalmazás használatát! :tada:
