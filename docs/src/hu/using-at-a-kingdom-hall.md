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

### Profile type

A következő lépés a **profil típusának** kiválasztása. A Királyság-teremben történő szokásos beállításhoz válassza a **Szokásos** lehetőséget. Ez számos, a gyülekezeti összejöveteleken általánosan használt funkciót fog beállítani.

:::warning Figyelem

Csak akkor válassza a **Más** lehetőséget, ha olyan profilt hoz létre, amelyhez nem kell automatikusan médiatartalmakat letölteni. A médiaanyagokat manuálisan kell importálni az ezzel a profillal való használathoz. This type of profile is used mostly to use M³ during theocratic schools, assemblies, conventions and other special events.

The **Other** profile type is rarely used. **For normal use during congregation meetings, please choose _Regular_.**

:::

### Automatic congregation lookup

M³ can attempt to automatically find your congregation's meeting schedule, language, and formatted name.

To do so, use the **Congregation Lookup** button next to the congregation name field and enter at least part of the congregation's name and city.

Once the correct congregation is found and selected, M³ will prefill all available information, such as your congregation's **name**, **meeting language**, and **meeting days and times**.

:::info Note

This lookup uses publicly available data from the official website of Jehovah's Witnesses.

:::

### Manual entry of congregation information

If the automated lookup did not find your congregation, you can of course manually enter the required information. The wizard will allow you to review and/or enter your congregation's **name**, **meeting language**, and **meeting days and times**.

### Caching videos from the songbook

You will also be given the option of **caching all videos from the songbook**. This option pre-downloads all the songbook videos, reducing the time it takes to fetch media for meetings in the future.

- **Pros:** Meeting media will be available much faster.
- **Cons:** The size of the media cache will increase significantly, by approximately 5GB.

:::tip Tipp

If your Kingdom Hall has sufficient storage space, it’s recommended to **enable** this option for efficiency and perceived performance.

:::

### OBS Studio Integration Configuration (Optional)

If your Kingdom Hall uses **OBS Studio** for broadcasting hybrid meetings over Zoom, M³ can automatically integrate with that program. During setup, you can configure the integration with OBS Studio by entering the following:

- **Port:** The port number used to connect to the OBS Studio Websocket plugin.
- **Password:** The password used to connect to the OBS Studio Websocket plugin.
- **Scenes:** The OBS scenes that will be used during media presentations. You'll need one scene that captures the media window or screen, and one that shows the stage.

:::tip Tipp

If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.

:::

## 3. Enjoy using M³

Once the setup wizard is complete, M³ is ready to help manage and present media for congregation meetings. Enjoy using the app! :tada:
