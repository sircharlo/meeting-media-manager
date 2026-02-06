# Felhasználói útmutató {#user-guide}

Ez az átfogó felhasználói útmutató segít elsajátítani az M³ összes funkcióját, az alapvető beállításoktól a fejlett médiaprezentációs módszerekig.

## Első lépések {#getting-started}

### Letöltés és telepítés {#download-and-install}

A legújabb verziót a [Letöltési oldalról](download) szerezheti be. A legjobb verziót javasolja az adott eszközhöz, és mutatja a legújabb verziót.

### Első indítás {#first-launch}

Amikor először indítja el az M³ programot, egy beállítási varázsló végigvezeti Önt a gyülekezetéhez szükséges alapvető beállítások konfigurálásán:

1. **Válassza ki a felület nyelvét** - Ez határozza meg, hogy az M³ menüi és gombjai milyen nyelven jelennek meg
2. **Profil típus kiválasztása** - Normál gyülekezeti használatra válassza a „Rendszeres” lehetőséget, különleges eseményekre pedig az „Egyéb” lehetőséget
3. **Gyülekezeti adatok beállítása** - Adja meg a gyülekezeti adatokat, vagy használja az automatikus keresési funkciót
4. **Összejövetelek ütemezésének beállítása** - Állítsa be a hétközbeni és hétvégi összejövetelek időpontjait
5. **Opcionális funkciók** - Az OBS integráció, a háttérzene és egyéb fejlett funkciók konfigurálása

:::tip Tipp

A beállítás során ne spóroljon az idővel – később ezeket a beállításokat bármikor megváltoztathatja a Beállítások menüben.

:::

### Fő Felület Áttekintése {#main-interface}

A fő M³ felület több kulcsfontosságú területből áll:

- **Navigációs menü** - Hozzáférés a különböző menüpontokhoz és beállításokhoz
- **Naptár nézet** - Média böngészése dátum szerint
- **Médialista** – A kiválasztott dátumokhoz tartozó média megtekintése és kezelése
- **Eszköztár** - Gyors hozzáférés a gyakori funkciókhoz
- **Állapotjelző sáv** – Megjeleníti a letöltés előrehaladását, a háttérzenét és az OBS Studio kapcsolat állapotát

## Médiakezelés {#user-guide-media-management}

### A Naptárnézet megértése {#calendar-view}

A naptárnézetben látható az összejövetelek ütemezése és a rendelkezésre álló média:

- **Összejövetelek napjai** – A kiemelt napok jelzik, hogy mikorra vannak beütemezve az összejövetelek
- **Médiajelzők** – Az ikonok jelzik, hogy milyen típusú média áll rendelkezésre
- **Dátum navigáció** - A nyílgombokkal lehet a hónapok között lapozni

<!-- ### Downloading Media {#downloading-media}

::: info Note

Download speed depends on your internet connection and the size of media files. Videos typically take longer to download than images.

::: -->

### Média szervezése {#organizing-media}

Az M³ automatikusan rendezi a médiát az összejövetel típusa és részei szerint:

- **Összejövetel szakaszok** – A média az összejövetel részei szerint van csoportosítva (Nyilvános Előadás, Szellemi Kicsek, stb.)
- **Egyéni szakaszok** – Ha az adott napon nincs tervezett összejövetel, egyéni szakaszokat hozhat létre további médiaelemek számára

## Médiaprezentáció {#media-presentation}

### A Médialejátszó megnyitása {#opening-media-player}

A média bemutatása egy összejövetelen:

1. Válassza ki a dátumot és a bemutatni kívánt médiaelemet
2. Kattintson a lejátszás gombra, vagy használja a gyorsbillentyűt
3. A média lejátszása megkezdődik a képernyőn
4. A vezérlőkkel lejátszhat, szüneteltethet vagy navigálhat a médiatartalmak között

### Médialejátszó vezérlők {#media-player-controls}

A médialejátszó többféle vezérlést biztosít:

- **Lejátszás/Szünet** - A média lejátszásának elindítása vagy szüneteltetése
- **Stop** - Leállítja a lejátszást

<!-- - **Previous/Next** - Navigate between media items
- **Volume** - Adjust playback volume -->

<!-- - **Fullscreen** - Toggle fullscreen mode -->

- **Nagyítás/Pásztázás** - Az egérgörgővel nagyíthat, húzással pásztázhat (képek esetén)

### Haladó Prezentációs Funkciók {#advanced-presentation}

#### Egyéni időzítés {#custom-timing}

Állítson be egyéni kezdési és befejezési időpontokat a médiákhoz:

<!-- 1. Right-click on a media item
2. Select "Edit Timing" -->

1. Kattintson a videó időtartamára a miniatűr bal felső sarkában
2. Állítsa be a kezdési és befejezési időpontokat
3. Mentse el a változtatásokat

#### Nagyítás és pásztázás {#zoom-pan}

Képek és videók:

- **Nagyítás/kicsinyítés** - Használja az egérgörgőt vagy a miniatűr képen található nagyító gombokat
- **Pásztázás** - Kattintson és húzza a miniatűrt a kép mozgatásához
- **Zoom visszaállítás** - Kattintson ide, hogy visszatérjen az eredeti nagyításhoz

#### Billentyűparancsok {#user-guide-keyboard-shortcuts}

Konfiguráljon egyéni billentyűparancsokat a gyors hozzáféréshez. Ne feledje, hogy alapértelmezés szerint nincsenek beállítva billentyűparancsok.

**Beépített Média Vezérlők** (amikor a főablak aktív és a médialista látható):

- **Tab/Shift+Tab** - Navigálás a médiaelemek között
- **Fel/le nyíl** - Navigálás a médiaelemek között
- **Szóköz** - Média lejátszása/szüneteltetése
- **Escape** - Média leállítása

**Testreszabható gyorsbillentyűk** (ha engedélyezve van a beállításokban):

- **Médiaablak** - Médiaablak megnyitása/bezárása
- **Előző/Következő média** - Navigálás a médiaelemek között
- **Szünet/Folytatás** - A média lejátszásának vezérlése
- **Média leállítása** - A média lejátszásának leállítása
- **Zene kapcsoló** - Háttérzene vezérlése

**_Megjegyzés (_):** Globális gyorsbillentyű – akkor is elérhető, ha az alkalmazás nincs fókuszban

## Háttérzene {#user-guide-background-music}

### Háttérzene beállítása {#background-music-setup}

A háttérzene automatikusan elindul az összejövetel előtt és a megfelelő időben leáll:

1. **Zene engedélyezése** - A háttérzene engedélyezése a beállításokban
2. **Automatikus indítás** – A zene automatikusan elindul, amikor az M³ elindul, ha ez szükséges
3. **Összejövetel leállítás** – A zene automatikusan leáll az összejövetel megkezdése előtt
4. **Kézi vezérlés** – Az állapotjelző sávon található zene gombbal indíthatja el/állíthatja le kézzel a lejátszást
5. **Újraindítás** – Egy kattintással folytathatja a zene lejátszását az összejövetel után

## Zoom integráció {#user-guide-zoom-integration}

Az M³ integrálható a Zoommal az automatikus képernyőmegosztáshoz:

1. **Integráció engedélyezése** - Kapcsolja be a Zoom integrációt a beállításokban
2. **Gyorsbillentyű beállítása** – Állítsa be a Zoomban konfigurált képernyőmegosztási gyorsbillentyűt. Győződjön meg arról, hogy a Zoom alkalmazásban be van jelölve a „global” jelölőnégyzet.
3. **Automatikus vezérlés** – Az M³ szükség szerint automatikusan be- és kikapcsolja a képernyő megosztását a Zoom alkalmazásban
4. **Kézi felülírás** – Szükség esetén továbbra is kézzel vezérelheti a képernyő megosztását a Zoom segítségével

## OBS Studio Integration {#user-guide-obs-integration}

### Setting Up OBS Integration {#user-guide-obs-setup}

To use M³ with OBS Studio for hybrid meetings:

1. **Install OBS Studio** - Download and install OBS Studio
2. **Enable WebSocket** - Install the WebSocket plugin in OBS
3. **Configure M³** - Enter OBS port and password in M³ settings
4. **Set Up Scenes** - Create scenes for camera, media, and other content
5. **Test** - Verify playback works properly

### OBS Scene Management {#obs-scene-management}

M³ automatically switches OBS scenes during presentations:

- **Camera Scene** - Shows the lectern/camera view
- **Media Scene** - Displays media content
- **Image Scene** - Shows images (can be postponed if enabled)
- **Automatic Switching** - Scenes change based on media type and settings

### Advanced OBS Features {#advanced-obs}

#### Postpone Images {#user-guide-postpone-images}

Enable this option to delay sharing images to OBS until manually triggered:

1. Enable "Postpone Images" in OBS settings
2. Images will only be shared when you click the button to show them using OBS Studio. This is useful for showing images to in-person audience first.

#### Scene Switching Behavior {#user-guide-scene-switching}

Configure how M³ handles scene changes:

- **Switch After Media** - Automatically return to previous scene
- **Remember Previous Scene** - Restore the scene that was active before media

### Audio Configuration for Hybrid Meetings {#audio-configuration}

When using M³ with OBS Studio for hybrid meetings (in-person + Zoom), you need to configure audio settings to ensure meeting participants can hear the media:

#### Zoom Audio Settings {#zoom-audio-settings}

**Before every meeting, you must enable Original Audio in Zoom:**

1. **Open Zoom** and go to Settings
2. **Navigate to Audio** → **Advanced**
3. **Enable "Show in-meeting option to 'Enable Original Sound'"**
4. **Check "Disable echo cancellation"** (first checkbox)
5. **Check "Disable noise suppression"** (second checkbox)
6. **Uncheck "Disable high-fidelity music mode"** (third checkbox)
7. **Before starting each meeting**, click the "Original Audio" button in the meeting controls

**Alternative: Share Computer Sound**
If Original Audio doesn't work well in your setup:

1. **Before playing media**, go to **Advanced** tab in Zoom screen sharing options
2. **Check "Share computer sound"**
3. **Note**: This option must be enabled every time you start a new Zoom session

**Best Alternative**: Consider using M³'s Zoom integration instead of OBS Studio, as it uses Zoom's native screen sharing which handles audio more seamlessly and doesn't require complex audio configuration.

#### Why Audio Configuration is Necessary {#why-audio-config}

M³ plays media with sound on your computer, but this audio is **not automatically transmitted** through the video stream to OBS Studio. This is the same behavior you would experience with any other media player.

**The audio issue is not related to M³** - it's a limitation of how OBS Studio video streaming works with Zoom. The video stream acts like a virtual camera without sound, just like a webcam, so you must explicitly configure Zoom to capture the computer's audio. This implies that your computer has two sound cards, and if this isn't the case, you probably won't be able to use the OBS Studio integration successfully.

**Alternative Solution**: Consider using the Zoom integration instead, as it uses Zoom's native screen and audio sharing, which handles audio more seamlessly.

#### Troubleshooting Audio Issues {#audio-troubleshooting}

**Common Problems:**

- **No audio in Zoom**: Check if Original Audio is enabled and properly configured
- **Poor audio quality**: Verify the three Original Audio checkboxes are set correctly
- **Audio not working after Zoom restart**: Original Audio settings must be re-enabled for each new Zoom session

**Best Practices:**

- Test audio configuration and sharing before meetings
- Create a checklist for audio setup
- Consider using "Share Computer Sound" as a backup option
- **Consider using Zoom integration instead of OBS Studio** for simpler audio handling
- Ensure all AV operators are familiar with these settings

## Média importálása és kezelése {#media-import}

### Egyéni média importálása {#importing-custom-media}

Adja hozzá saját médiafájljait az M³-hoz:

1. **Fájl importálása** - Az importálás gombbal videókat, képeket vagy hangfájlokat adhat hozzá
2. **Húzás és elhelyezés** - Húzza a fájlokat közvetlenül az M³-ba
3. **Mappafigyelés** – Állítson be egy figyelt mappát az automatikus importáláshoz
4. **JWPUB fájlok és lejátszási listák** - Kiadványok és lejátszási listák importálása
5. **Nyilvános előadások médiafájlja (S-34 / S-34mp)** – Nyilvános előadások médiafájljainak importálása S‑34 vagy S‑34mp JWPUB fájlok segítségével

### Importált média kezelése {#managing-imported-media}

- **Dátum szerint rendezés** - Az importált médiafájlok hozzárendelése meghatározott dátumokhoz
- **Egyéni szakaszok** - Egyéni szakaszok létrehozása a szervezéshez
- **Tulajdonságok szerkesztése** – Címek, leírások és időzítés módosítása
- **Média eltávolítása** - A nem kívánt médiaelemek törlése

### Hangos Biblia importálása {#audio-bible-import}

Bibliaversek hangfelvételeinek importálása:

1. Kattintson a „Hangfelvétel a Bibliából” gombra
2. Válassza ki a Bibliai könyvet és fejezetet
3. Kiválasszon konkrét verseket vagy szakaszokat
4. Töltse le az audio fájlokat
5. Használja őket

## Mappafigyelés és exportálás {#user-guide-folder-monitoring}

### Mappafigyelés beállítása {#folder-monitoring-setup}

Figyelje a mappát az új médiafájlokért:

1. **Mappafigyelő engedélyezése** - Kapcsolja be a mappafigyelést a beállításokban
2. **Mappa kiválasztása** - Válassza ki a figyelni kívánt mappát
3. **Automatikus importálás** – Az új fájlok automatikusan hozzáadódnak az M³-hoz
4. **Szervezés** - A fájlok dátum szerint vannak rendezve, a mappaszerkezet alapján

### Médiaexport {#user-guide-media-export}

A média automatikus exportálása szervezett mappákba:

1. **Automatikus exportálás engedélyezése** - Kapcsolja be a médiaexportálást a beállításokban
2. **Export mappa kiválasztása** - Válassza ki, hová szeretné menteni az exportált fájlokat
3. **Automatikus rendezés** – A fájlok dátum és szakasz szerint vannak rendezve
4. **Formátumbeállítások** - Konvertálja a fájlokat MP4 formátumba a jobb kompatibilitás érdekében

## Weboldal Prezentációja {#website-presentation}

### A hivatalos weboldal bemutatása {#presenting-the-website}

Ossza meg a hivatalos weboldalt külső kijelzőkön:

1. **Open Website Mode** - Click the website presentation button
2. **External Display** - The website opens in a new window
3. **Navigation** - Use the browser controls to navigate

### Website Controls {#website-controls}

- **Navigation** - Standard browser navigation controls
- **Refresh** - Reload the current page
- **Close** - Exit website presentation mode

## Advanced Features {#user-guide-advanced-features}

### Multiple Congregations {#user-guide-multiple-congregations}

Manage multiple congregations or groups:

1. **Create Profiles** - Set up separate profiles for different congregations
2. **Switch Profiles** - Use the congregation selector to switch between profiles
3. **Separate Settings** - Each profile has its own settings and media
4. **Shared Resources** - Media files are shared between profiles whenever possible

### Keyboard Shortcuts {#keyboard-shortcuts-guide}

Configure custom keyboard shortcuts for efficient operation:

1. **Enable Shortcuts** - Turn on keyboard shortcuts in settings
2. **Configure Shortcuts** - Set up shortcuts for common actions
3. **Practice** - Learn your shortcuts for faster operation
4. **Customize** - Adjust shortcuts to match your preferences

## Troubleshooting {#troubleshooting-guide}

### Common Issues {#common-issues}

#### Media Not Downloading {#user-guide-media-not-downloading}

- Check your meeting schedule settings
- Verify internet connection
- Check if media is available in your selected language

#### OBS Integration Not Working {#user-guide-obs-not-working}

- Verify OBS WebSocket plugin is installed
- Check port and password settings
- Ensure OBS is running

#### Audio Issues in Zoom/OBS {#audio-issues}

- **No audio in Zoom**: Enable Original Audio in Zoom settings and before each meeting
- **Poor audio quality**: Check the three Original Audio checkboxes (first two enabled, third disabled)
- **Audio not working after restart**: Original Audio must be re-enabled for each new Zoom session
- **Alternative solution**: Use "Share Computer Sound" option in Zoom screen sharing

#### Performance Issues {#user-guide-performance-issues}

- Enable extra cache
- Reduce maximum resolution
- Clear old cached files
- Check available disk space

#### Language Issues {#user-guide-language-issues}

- Check media language setting
- Ensure language is available on JW.org
- Try a fallback language
- Verify interface language setting

### Getting Help {#getting-help}

If you encounter issues:

1. **Check Documentation** - Review this guide and other available documentation
2. **Search Issues** - Look for similar issues on GitHub
3. **Report Problems** - Create a new issue with detailed information

## Best Practices {#best-practices}

### Before Meetings {#before-meetings}

1. **Check Downloads** - Ensure all media is downloaded
2. **Test Equipment** - Verify displays and audio work
3. **Prepare Media** - Review and organize media for the meeting; make sure no media files are missing
4. **Configure Audio** - For hybrid meetings, enable Original Audio in Zoom or set up "Share Computer Sound"

### During Meetings {#during-meetings}

1. **Stay Focused** - Use the clean and distraction-free interface
2. **Use Shortcuts** - Master keyboard shortcuts for smooth operation
3. **Monitor Audio** - Keep an eye on volume levels, if that's part of your responsibilities
4. **Be Prepared** - Have the next media item ready
5. **Verify Audio** - For hybrid meetings, ensure Zoom participants can hear the media

### After Meetings {#after-meetings}

1. **Start Background Music** - Start the playback of background music
2. **Plan Ahead** - Prepare for the next meeting by making sure everything is in place
3. **Clean Up** - Close media player when you're ready to leave

### Regular Maintenance {#regular-maintenance}

1. **Update M³** - Keep the application updated
2. **Clear Cache** - Periodically clear old cached files
3. **Check Settings** - Review and update settings as needed
