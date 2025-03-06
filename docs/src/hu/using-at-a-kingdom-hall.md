<!-- markdownlint-disable no-inline-html -->

# Az M³ használata egy Királyság teremben {#using-m3-at-a-kingdom-hall}

Ez az útmutató végigvezeti Önt a **Meeting Media Manager (M³)** letöltésének, telepítésének és beállításának folyamatán egy Királyságteremben. Kövesse a lépéseket, hogy a gyülekezeti összejövetelek során zökkenőmentesen tudja kezelni a médiát.

## 1. Letöltés és telepítés {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. Töltse le az operációs rendszerének megfelelő verziót:
  - **Windows:**
    - A legtöbb Windows rendszerhez töltse le a <a :href="data.win64">meeting-media-manager-[VERSION]-x64.exe</a> fájlt.
    - Régebbi 32 bites Windows rendszerekhez töltse le a <a :href="data.win32">meeting-media-manager-[VERSION]-ia32.exe</a> fájlt.
    - A hordozható változathoz töltse le a <a :href="data.winPortable">meeting-media-manager-[VERSION]-portable.exe</a> fájlt.
  - **macOS:**
    - **M-sorozat (Apple Silicon)**: Töltse le a <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a> fájlt.
    - **Intel-alapú Mac számítógépek**: Töltse le a <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a> fájlt.
  - **Linux:**
    - Töltse le a <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a> fájlt.
2. Ha a letöltési linkek nem működnek, látogasson el az [M³ letöltési oldalra](https://github.com/sircharlo/meeting-media-manager/releases/latest), és töltse le manuálisan a megfelelő verziót.
3. Nyissa meg a telepítőt, és kövesse a képernyőn megjelenő utasításokat az M³ telepítéséhez.
4. Indítsa el az M³ programot.
5. Menjen végig a konfigurációs varázslón.

### Csak macOS: További lépések a telepítéshez {#additional-steps-for-macos-users}

:::warning Figyelem

Ez a szakasz csak a macOS-felhasználókra vonatkozik.

:::

Az Apple biztonsági intézkedései miatt a telepített M³ alkalmazás futtatásához a modern macOS rendszereken néhány további lépésre van szükség.

Futtassa a következő két parancsot a Terminálban, szükség szerint módosítva az M³ elérési útvonalát:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Figyelem

MacOS felhasználóként minden alkalommal, amikor telepíti vagy frissíti az M³ programot, követnie kell ezeket a lépéseket.

:::

:::info Magyarázat

Az első parancs _jelöli az alkalmazás kódját_. Erre azért van szükség, hogy az M³-program ne ismeretlen fejlesztőtől származó rosszindulatú alkalmazásként legyen azonosítva.

A második parancs _eltávolítja a karanténjelzőt_ az alkalmazásból. A karanténjelzés arra szolgál, hogy figyelmeztesse a felhasználókat az internetről letöltött, potenciálisan rosszindulatú alkalmazásokról.

:::

#### Alternatív módszer {#alternative-method-for-macos-users}

Ha az előző szakaszban leírt két parancs beírása után sem tudja elindítani az M³ programot, próbálja meg a következőket:

1. Nyissa meg a macOS rendszer **Adatvédelem és biztonság** beállításait.
2. Keresse meg az M³ nevű bejegyzést, és kattintson a **Megnyitás mindenképpen** gombra.
3. Ezután ismét figyelmeztetést kap, és azt a tanácsot kapja, hogy "ne nyissa meg, hacsak nem biztos benne, hogy megbízható forrásból származik." Kattintson a **Megnyitás mindenképpen** gombra.
4. Egy újabb figyelmeztetés jelenik meg, amelyben hitelesítenie kell magát az alkalmazás elindításához.
5. Az M³ programnak most már el kell indulnia.

Ha a fenti lépések követése után még mindig problémái vannak, kérjük, [nyisson egy problémát a GitHubon](https://github.com/sircharlo/meeting-media-manager/issues/new). Mindent meg fogunk tenni, hogy segítsünk.

### Csak macOS: A webhely megjelenítésének ismételt engedélyezése a frissítések után {#screen-sharing-issues}

:::warning Figyelem

Ez a szakasz csak a macOS-felhasználókra vonatkozik.

:::

Néhány macOS-felhasználó arról számolt be, hogy a webhelybemutatás nem működik az M³ frissítéseinek telepítése után.

Ha az M³ frissítése után a weboldal megjelenítésekor a médiaablak fekete, próbálja meg a következő lépéseket:

1. Nyissa meg a macOS rendszer **Adatvédelem és biztonság** beállításait.
2. Válassza a **Képernyőfelvétel** menüpontot.
3. Válassza ki a listából az M³ programot.
4. Kattintson a '-' (mínusz) gombra az eltávolításhoz.
5. Kattintson a `+` (plusz) gombra, és válassza ki az Alkalmazások mappából az M³ programot.
6. Előfordulhat, hogy a módosítás alkalmazásához újra kell indítani az M³ programot.

A fenti lépések után a képernyőmegosztásnak ismét a várt módon kell működnie.

:::tip Tipp

Ezek a lépések opcionálisak, és kihagyhatók, ha nem kívánja használni a weboldal bemutatása funkciót. Másrészt, ha tervezi a webhelybemutató funkció használatát, ajánlott minden frissítés után követni az alábbi lépéseket, hogy a funkció az elvárt módon működjön.

:::

## 2. Konfigurációs varázsló {#configuration-wizard}

### Az alkalmazás megjelenítési nyelve {#app-display-language}

Az M³ első indításakor a rendszer kéri, hogy válassza ki a kívánt **megjelenítési nyelvet**. Válassza ki azt a nyelvet, amelyet az M³ felületén kíván használni.

:::tip Tipp

Ez a nyelv nem kell, hogy megegyezzen azzal a nyelvvel, amelyen az M³ a médiatartalmakat letölti. A médiatartalmak letöltésének nyelve egy későbbi lépésben kerül beállításra.

:::

### Profil típusa {#profile-type}

A következő lépés a **profil típusának** kiválasztása. A Királyság-teremben történő szokásos beállításhoz válassza a **Szokásos** lehetőséget. Ez számos, a gyülekezeti összejöveteleken általánosan használt funkciót fog beállítani.

:::warning Figyelem

Csak akkor válassza a **Más** lehetőséget, ha olyan profilt hoz létre, amelyhez nem kell automatikusan médiatartalmakat letölteni. A médiaanyagokat manuálisan kell importálni az ezzel a profillal való használathoz. Ez a fajta profil elsősorban arra szolgál, hogy az M³ programot teokratikus iskolákon, összejöveteleken, kongresszusokon és egyéb különleges eseményeken használják.

Az **Egyéb** profiltípust ritkán kell használni. **A gyülekezeti összejövetelek során történő normál használathoz válassza a _Szokásos_ opciót.**

:::

### Automatikus gyülekezetkeresés {#automatic-congregation-lookup}

Az M³ megpróbálhatja automatikusan megkeresni a gyülekezet összejöveteleinek időpontját, nyelvét és formázott nevét.

Ehhez használja a **Gyülekezet keresése** gombot a gyülekezet neve mező mellett, és adja meg legalább részben a gyülekezet nevét és a várost.

Ha megtalálta és kiválasztotta a megfelelő gyülekezetet, az M³ előre kitölti az összes rendelkezésre álló információt, például a gyülekezet **nevét**, **az összejövetelek nyelvét** és **az összejövetelek napját és időpontját**.

:::info Megjegyzés

Ez a lekérdezés Jehova Tanúi hivatalos honlapjának nyilvánosan elérhető adatait használja.

:::

### A gyülekezet információinak kézi bevitele {#manual-entry-of-congregation-information}

Ha az automatikus keresés nem találta meg az Ön gyülekezetét, természetesen kézzel is megadhatja a szükséges adatokat. A varázsló lehetővé teszi, hogy felülvizsgálja és/vagy megadja a gyülekezet **nevét**, **az összejövetelek nyelvét**, valamint **az összejövetelek napját és időpontját**.

### Videók gyorsítótárazása az énekeskönyvből {#caching-videos-from-the-songbook}

Lehetősége lesz arra is, hogy **minden videót letöltsön az énekeskönyvből**. Ez az opció előre letölti az összes zenei videót, csökkentve ezzel a jövőbeni összejövetelekhez szükséges médiatartalmak betöltési idejét.

- **Előnyök:** Az összejövetelekre szánt médiafájlok sokkal gyorsabban elérhetők lesznek.
- **Hátrányok:** A média gyorsítótára jelentősen, körülbelül 5 GB-tal megnő.

:::tip Tipp

Ha a Királyság-terem számítógépe elegendő tárhellyel rendelkezik, akkor a hatékonyság és az érzékelhető teljesítmény növelése érdekében ajánlott **engedélyezni** ezt az opciót.

:::

### OBS Studio integráció konfigurálása (opcionális) {#obs-studio-integration-configuration}

Ha az Ön Királyság-terme **OBS Studio**-t használ a hibrid összejövetelek Zoom-on keresztüli közvetítésére, akkor az M³ automatikusan integrálható ezzel a programmal. A beállítás során a következő adatok megadásával konfigurálhatja az OBS Studio integrációját:

- **Port:** Az OBS Studio Websocket bővítményhez történő csatlakozáshoz használt portszám.
- **Jelszó:** Az OBS Studio Websocket bővítményhez történő csatlakozáshoz használt jelszó.
- **Jelenetek:** Az OBS jelenetek, amelyeket a média bemutatásakor fognak használni. Szüksége lesz egy jelenetre, amely a médiaablakot vagy a képernyőt veszi fel, és egy másikra, amely a pódiumot mutatja.

:::tip Tipp

Ha a gyülekezete rendszeresen tart hibrid összejöveteleket akkor **kifejezetten** ajánlott engedélyezni az OBS Studio integrációját.

:::

## 3. Élvezze az M³ program használatát {#enjoy-using-m3}

Miután a beállítási varázslóval elkészült, az M³ készen áll arra, hogy segítsen a gyülekezeti összejövetelek médiaanyagainak kezelésében és megjelenítésében. Élvezze az alkalmazás használatát! :tada:
