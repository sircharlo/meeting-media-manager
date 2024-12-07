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
     - For a portable version, download <a :href="data.winPortable">meeting-media-manager-[VERSION]-portable.exe</a>.
   - **macOS:**
     - **M-series (Apple Silicon)**: Download <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a>.
     - **Intel-based Macs**: Download <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a>.
   - **Linux:**
     - Download <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a>.
2. If the download links do not work, visit the [M³ download page](https://github.com/sircharlo/meeting-media-manager/releases/latest) and download the correct version manually.
3. Nyissa meg a telepítőt, és kövesse a képernyőn megjelenő utasításokat az M³ telepítéséhez.
4. Indítsa el az M³ programot.
5. Menjen végig a konfigurációs varázslón.

### macOS only: Additional installation steps {#additional-steps-for-macos-users}

:::warning Figyelem

This section only applies to macOS users.

:::

Due to Apple's security measures, a few additional steps are required to run the installed M³ app on modern macOS systems.

Run the following two commands in Terminal, modifying the path to M³ as needed:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Figyelem

As a macOS user, you will need to follow these steps every time you install or update M³.

:::

:::info Explanation

The first command _signs the application's code_. This is required to prevent M³ from being detected as a malicious application from an unknown developer.

The second command _removes the quarantine flag_ from the application. The quarantine flag is used to warn users about potentially malicious applications that have been downloaded from the internet.

:::

#### Alternative method {#alternative-method-for-macos-users}

If you are still unable to launch M³ after entering the two commands from the previous section, please try the following:

1. Open the macOS system **Privacy & Security** settings.
2. Find the entry for M³ and click the button to **Open Anyway**.
3. You will then be warned again, and given the advice to not "open this unless you are certain it is from a trustworthy source." Click **Open Anyway**.
4. Another warning will appear, where you’ll need to authenticate to launch the app.
5. M³ should now launch successfully.

If you still have issues after following all these steps, please [open an issue on GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). We will do our best to help.

### macOS only: Re-enabling website presentation after updates {#screen-sharing-issues}

:::warning Figyelem

This section only applies to macOS users.

:::

Some macOS users have reported that website presentation no longer works after installing updates to M³.

If the media window is black when presenting the website after updating M³, try the following steps:

1. Open the macOS system **Privacy & Security** settings.
2. Go to **Screen Recording**.
3. Select M³ in the list.
4. Click the `-` (minus) button to remove it.
5. Click the `+` (plus) button and select M³ from the Applications folder.
6. You may be prompted to relaunch M³ to apply the change.

After these steps, screen sharing should function as expected once again.

:::tip Tipp

These steps are optional and can be skipped if you do not plan to use the website presentation feature. On the other hand, if you do plan to use the website presentation feature, it is recommended to follow these steps after every update to ensure the feature works as expected.

:::

## 2. Configuration wizard {#configuration-wizard}

### App display language {#app-display-language}

Az M³ első indításakor a rendszer kéri, hogy válassza ki a kívánt **megjelenítési nyelvet**. Válassza ki azt a nyelvet, amelyet az M³ felületén kíván használni.

:::tip Tipp

Ez a nyelv nem kell, hogy megegyezzen azzal a nyelvvel, amelyen az M³ a médiatartalmakat letölti. A médiatartalmak letöltésének nyelve egy későbbi lépésben kerül beállításra.

:::

### Profile type {#profile-type}

A következő lépés a **profil típusának** kiválasztása. A Királyság-teremben történő szokásos beállításhoz válassza a **Szokásos** lehetőséget. Ez számos, a gyülekezeti összejöveteleken általánosan használt funkciót fog beállítani.

:::warning Figyelem

Csak akkor válassza a **Más** lehetőséget, ha olyan profilt hoz létre, amelyhez nem kell automatikusan médiatartalmakat letölteni. A médiaanyagokat manuálisan kell importálni az ezzel a profillal való használathoz. Ez a fajta profil elsősorban arra szolgál, hogy az M³ programot teokratikus iskolákon, összejöveteleken, kongresszusokon és egyéb különleges eseményeken használják.

Az **Egyéb** profiltípust ritkán kell használni. **A gyülekezeti összejövetelek során történő normál használathoz válassza a _Szokásos_ opciót.**

:::

### Automatic congregation lookup {#automatic-congregation-lookup}

Az M³ megpróbálhatja automatikusan megkeresni a gyülekezet összejöveteleinek időpontját, nyelvét és formázott nevét.

Ehhez használja a **Gyülekezet keresése** gombot a gyülekezet neve mező mellett, és adja meg legalább részben a gyülekezet nevét és a várost.

Ha megtalálta és kiválasztotta a megfelelő gyülekezetet, az M³ előre kitölti az összes rendelkezésre álló információt, például a gyülekezet **nevét**, **az összejövetelek nyelvét** és **az összejövetelek napját és időpontját**.

:::info Megjegyzés

Ez a lekérdezés Jehova Tanúi hivatalos honlapjának nyilvánosan elérhető adatait használja.

:::

### Manual entry of congregation information {#manual-entry-of-congregation-information}

Ha az automatikus keresés nem találta meg az Ön gyülekezetét, természetesen kézzel is megadhatja a szükséges adatokat. A varázsló lehetővé teszi, hogy felülvizsgálja és/vagy megadja a gyülekezet **nevét**, **az összejövetelek nyelvét**, valamint **az összejövetelek napját és időpontját**.

### Caching videos from the songbook {#caching-videos-from-the-songbook}

Lehetősége lesz arra is, hogy **minden videót letöltsön az énekeskönyvből**. Ez az opció előre letölti az összes zenei videót, csökkentve ezzel a jövőbeni összejövetelekhez szükséges médiatartalmak betöltési idejét.

- **Előnyök:** Az összejövetelekre szánt médiafájlok sokkal gyorsabban elérhetők lesznek.
- **Hátrányok:** A média gyorsítótára jelentősen, körülbelül 5 GB-tal megnő.

:::tip Tipp

Ha a Királyság-terem számítógépe elegendő tárhellyel rendelkezik, akkor a hatékonyság és az érzékelhető teljesítmény növelése érdekében ajánlott **engedélyezni** ezt az opciót.

:::

### OBS Studio Integration Configuration (Optional) {#obs-studio-integration-configuration}

Ha az Ön Királyság-terme **OBS Studio**-t használ a hibrid összejövetelek Zoom-on keresztüli közvetítésére, akkor az M³ automatikusan integrálható ezzel a programmal. A beállítás során a következő adatok megadásával konfigurálhatja az OBS Studio integrációját:

- **Port:** Az OBS Studio Websocket bővítményhez történő csatlakozáshoz használt portszám.
- **Jelszó:** Az OBS Studio Websocket bővítményhez történő csatlakozáshoz használt jelszó.
- **Jelenetek:** Az OBS jelenetek, amelyeket a média bemutatásakor fognak használni. Szüksége lesz egy jelenetre, amely a médiaablakot vagy a képernyőt veszi fel, és egy másikra, amely a pódiumot mutatja.

:::tip Tipp

Ha a gyülekezete rendszeresen tart hibrid összejöveteleket akkor **kifejezetten** ajánlott engedélyezni az OBS Studio integrációját.

:::

## 3. Enjoy using M³ {#enjoy-using-m3}

Miután a beállítási varázslóval elkészült, az M³ készen áll arra, hogy segítsen a gyülekezeti összejövetelek médiaanyagainak kezelésében és megjelenítésében. Élvezze az alkalmazás használatát! :tada:
