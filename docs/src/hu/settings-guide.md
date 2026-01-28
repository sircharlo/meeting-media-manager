# Útmutató a beállításokhoz {#settings-guide}

Ez az átfogó útmutató kategóriák szerint csoportosítva ismerteti az M³-ban elérhető összes beállítást. Ezen beállítások megértése segít abban, hogy az M³-at úgy konfigurálja, hogy az tökéletesen megfeleljen a gyülekezet szükségleteinek.

## Alkalmazáskonfiguráció {#application-configuration}

### Alkalmazás megjelenítési nyelve {#display-language}

<!-- **Setting**: `localAppLang` -->

Válassza ki az M³ felületének nyelvét. Ez független a média letöltéséhez használt nyelvtől.

**Opciók**: Minden elérhető felületnyelv (angol, spanyol, francia stb.)

**Alapértelmezett**: angol

### Sötét mód {#dark-mode}

<!-- **Setting**: `darkMode` -->

Az M³ külső megjelenésének vezérlése.

**Opciók**:

- Automatikus váltás a rendszerbeállítások alapján
- Mindig használjon sötét módot
- Mindig használjon világos módot

**Alapértelmezett**: Automatikus

### A hét első napja {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Állítsa be, hogy melyik napot kell a naptárban a hét első napjának tekinteni.

**Lehetőségek**: vasárnaptól szombatig

**Alapértelmezett**: vasárnap

### Dátumformátum {#date-format}

<!-- **Setting**: `localDateFormat` -->

Az alkalmazásban a dátumok megjelenítéséhez használt formátum.

**Példa**: N HHHH ÉÉÉÉ

**Alapértelmezett**: N HHHH ÉÉÉÉ

### Automatikus indítás bejelentkezéskor {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Automatikusan indítsa el az M³ programot a számítógép indításakor.

**Alapértelmezett**: `hamis`

## Gyülekezeti összejövetelek {#congregation-meetings}

### Gyülekezet neve {#congregation-name}

<!-- **Setting**: `congregationName` -->

A gyülekezet neve. Ez szervezési és megjelenítési célt szolgál.

**Alapértelmezett**: Üres (a konfiguráció során kell beállítani)

### Összejövetel nyelve {#meeting-language}

<!-- **Setting**: `lang` -->

A tartalom letöltéséhez használt elsődleges nyelv. Ennek meg kell felelnie a gyülekezet összejövetelein használt nyelvnek.

**Opciók**: Az összes elérhető nyelv Jehova Tanúi hivatalos weboldaláról

**Alapértelmezett**: angol (E)

### Tartalék nyelv {#fallback-language}

<!-- **Setting**: `langFallback` -->

Egy másodlagos nyelv, amelyet akkor kell használni, ha az elsődleges nyelven nem áll rendelkezésre média.

**Opciók**: Az összes elérhető nyelv Jehova Tanúi hivatalos weboldaláról

**Alapértelmezett**: Nincs

### Hét közbeni összejövetel napja {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

A nap, amikor a hét közbeni összejövetel megtartására kerül sor.

**Lehetőségek**: vasárnaptól szombatig

**Alapértelmezett**: Nincs (a beállítás során kell megadni)

### Hét közbeni összejövetel időpontja {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

A hét közbeni összejövetel kezdési időpontja.

**Formátum**: HH:MM (24 órás formátum)

**Alapértelmezett**: Nincs (a beállítás során kell megadni)

### Hétvégi összejövetel napja {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

A hét azon napja, amikor a hétvégi összejövetel megtartásra kerül.

**Lehetőségek**: vasárnaptól szombatig

**Alapértelmezett**: Nincs (a beállítás során kell megadni)

### Hétvégi összejövetel időpontja {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

A hétvégi összejövetel kezdési időpontja.

**Formátum**: HH:MM (24 órás formátum)

**Alapértelmezett**: Nincs (a beállítás során kell megadni)

### A körzetfelvigyázó látogatásának hete {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

A hét, amikor a körzetfelvigyázó meglátogatja a gyülekezetet.

**Formátum**: HH/NN/ÉÉÉÉ

**Alapértelmezett**: Nincs

### Emlékünnep dátuma {#memorial-date}

<!-- **Setting**: `memorialDate` -->

A következő Emlékünnep időpontja (béta funkció).

**Formátum**: HH/NN/ÉÉÉÉ

**Alapértelmezett**: Automatikus, időszakos lekérés

### Összejövetel ütemezésének változásai {#meeting-schedule-changes}

Ezekkel a beállításokkal ideiglenes módosításokat végezhet az összejövetelek ütemezésében:

- **Változás dátuma**: Amikor a változás hatályba lép
- **Egyszeri változás**: Ez állandó vagy ideiglenes módosítás
- **Új hét közbeni nap**: Új nap a hét közbeni összejövetelekhez
- **Új hét közbeni időpont**: Új időpont a hét közbeni összejövetelhez
- **Új hétvégi nap**: Új nap a hétvégi összejövetelhez
- **Új hétvégi időpont**: Új időpont a hétvégi összejövetelhez

## Média lekérdezés és lejátszás {#media-retrieval-and-playback}

### Adatkorlátos kapcsolat {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Ha korlátozott adatkapcsolattal rendelkezik, engedélyezze ezt a funkciót a sávszélesség-használat csökkentése érdekében.

**Alapértelmezett**: `hamis`

### Média megjelenítése {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Aktiválja a média megjelenítési funkciót. Ez szükséges a média második kijelzőn való megjelenítéséhez.

**Alapértelmezett**: `hamis`

#### Lejátszás megkezdése szüneteltetve {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

A lejátszás megkezdésekor a videókat szüneteltetett állapotba állítja.

**Alapértelmezett**: `hamis`

### Háttérzene {#settings-guide-background-music}

#### Zene engedélyezése {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Engedélyezi a háttérzenét.

**Alapértelmezett**: `igaz`

#### Zene automatikus indítása {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

A háttérzene automatikus elindítása az M³ indításakor, ha szükséges.

**Alapértelmezett**: `igaz`

#### Összejövetel-megállítási puffer {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Hány másodperccel az összejövetel kezdete előtt kell leállítani a háttérzenét.

**Tartomány**: 0–300 másodperc

**Alapértelmezett**: 60 másodperc

#### Zene hangerő {#music-volume}

<!-- **Setting**: `musicVolume` -->

A háttérzene hangereje (1-100%).

**Alapértelmezett**: 100%

### Gyorsítótár-kezelés {#cache-management}

#### Extra gyorsítótár engedélyezése {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Engedélyezze a további gyorsítótárazást a jobb teljesítmény érdekében.

**Alapértelmezett**: `hamis`

#### Gyorsítótár mappa {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Egyedi hely a gyorsítótárban tárolt médiafájlok tárolásához.

**Alapértelmezett**: A rendszer alapértelmezett helye

#### Gyorsítótár automatikus törlésének engedélyezése {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

A régi gyorsítótárfájlok automatikus törlése a lemezterület megtakarítása érdekében.

**Alapértelmezett**: `igaz`

### Mappafigyelés {#settings-guide-folder-monitoring}

#### Mappafigyelő engedélyezése {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Figyeljen egy mappát új médiafájlokra, és automatikusan adja hozzá őket az M³-hoz.

**Alapértelmezett**: `hamis`

#### Figyelendő mappa {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Az új médiafájlok figyelésére szolgáló mappa elérési útja.

**Alapértelmezett**: Üres

## Integrációk {#integrations}

### Zoom integráció {#settings-guide-zoom-integration}

#### Zoom engedélyezése {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Engedélyezze a Zoom meeting integrációs funkciókat.

**Alapértelmezett**: `hamis`

#### Képernyő Megosztás gyorsbillentyű {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

A Zoom képernyőmegosztás elindításához használt billentyűparancs.

**Alapértelmezett**: Nincs

### OBS Studio integráció {#settings-guide-obs-integration}

#### OBS engedélyezése {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Engedélyezze az OBS Studio integrációt az automatikus jelenetváltáshoz.

**Alapértelmezett**: `hamis`

:::warning Fontos Megjegyzés

**Audio konfiguráció szükséges**: Az OBS Studio integráció csak a képernyő megosztását kezeli. Az OBS Studio használata esetén az audió **nem kerül automatikusan továbbításra** a Zoom résztvevői számára. Be kell állítania a Zoom Original Audio beállításait, vagy használnia kell a „Share Computer Sound” (Számítógép hangjának megosztása) funkciót, hogy az összejövetel résztvevői hallhassák a médiát. Az audio beállítások részletes leírását a [Felhasználói kézikönyvben](/user-guide#audio-configuration) találja.

**Megjegyzés**: A Zoom integráció a Zoom natív képernyőmegosztását használja, amely az OBS Studio integrációnál zökkenőmentesebben kezeli az audiót.

:::

#### OBS Port {#obs-port}

<!-- **Setting**: `obsPort` -->

Az OBS Studio WebSockethez való csatlakozás portszáma.

**Alapértelmezett**: Nincs

#### OBS jelszó {#obs-password}

<!-- **Setting**: `obsPassword` -->

Az OBS Studio WebSocket-kapcsolat jelszava.

**Alapértelmezett**: Nincs

#### OBS Jelenetek {#obs-scenes}

Állítsa be, hogy mely OBS jeleneteket szeretné különböző célokra használni:

- **Kamera jelenet**: Jelenet, amelyben a kamera/pódium látható
- **Média jelenet**: Média megjelenítésére szolgáló jelenet
- **Képjelenet**: Képek megjelenítésére szolgáló jelenet (például egy PIP (kép a képben) jelenet, amely egyszerre mutatja a médiát és az előadót)

#### OBS haladó beállítások {#obs-advanced-options}

- **Képek késleltetése**: Késleltesse a képek OBS-be való megosztását, amíg manuálisan el nem indítja
- **Gyors kapcsoló**: Az OBS integráció gyors be-/kikapcsolásának engedélyezése
- **Jelenetváltás a média után**: A média lejátszása után automatikusan visszatér az előző jelenethez
- **Előző jelenet megjegyzése**: Megjegyzi az előző jelenetet és visszaállítja azt
- **Ikonok elrejtése**: Az OBS-hez kapcsolódó ikonok elrejtése a felületen

:::warning Fontos Megjegyzés

**Audio konfiguráció szükséges**: Az OBS Studio integráció csak a videó/jelenet váltást kezeli. Az M³ média hangja **nem kerül automatikusan továbbításra** a Zoom vagy az OBS alkalmazásba. A videó stream úgy működik, mint egy hang nélküli virtuális kamera, akárcsak egy webkamera. Be kell állítania a Zoom Original Audio beállításait, vagy használnia kell a „Share Computer Sound” (Számítógép hangjának megosztása) funkciót, hogy az összejövetel résztvevői hallhassák a médiát. Az audio beállítások részletes leírását a [Felhasználói kézikönyvben](/user-guide#audio-configuration) találja.

**Alternatíva**: Fontolja meg a Zoom integráció használatát, mivel ez a Zoom natív képernyőmegosztását használja, amely zökkenőmentesebben kezeli az audiót.

:::

### Egyéni események {#custom-events}

#### Egyéni események engedélyezése {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Engedélyezze az egyéni parancsokat, amelyek egy adott esemény észlelésekor aktiválódnak (pl. média lejátszása, szüneteltetése vagy leállítása).

**Alapértelmezett**: `hamis`

#### Egyéni esemény gyorsgombok {#custom-event-shortcuts}

##### Média lejátszása gyorsgomb {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

A média lejátszásakor aktiválódó billentyűparancs.

**Alapértelmezett**: Nincs

##### Média szüneteltetése gyorsbillentyű {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

A média szüneteltetésekor aktiválódó gyorsbillentyű.

**Alapértelmezett**: Nincs

##### Média leállítása gyorsbillentyű {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

A média leállításakor aktiválódó gyorsbillentyű.

**Alapértelmezett**: Nincs

##### Utolsó dal gyorsbillentyű {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Gyorsbillentyű, amely akkor aktiválódik, amikor az utolsó ének lejátszásra kerül egy összejövetel alatt.

**Alapértelmezett**: Nincs

## Haladó beállítások {#advanced-settings}

### Billentyűparancsok {#settings-guide-keyboard-shortcuts}

#### Billentyűparancsok engedélyezése {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Engedélyezze a testreszabható billentyűparancsokat a média vezérléséhez.

**Alapértelmezett**: `hamis`

#### Médiavezérlő gyorsbillentyűk {#media-control-shortcuts}

A média lejátszásához szükséges gyorsbillentyűk beállítása:

- **Médiaablak**: Médiaablak megnyitása/bezárása
- **Előző média**: Ugrás az előző médiaelemre
- **Következő média**: Ugrás a következő médiaelemre
- **Szünet/Folytatás**: A média lejátszásának szüneteltetése vagy folytatása
- **Média leállítása**: A média lejátszásának leállítása
- **Zene be-/kikapcsolása**: Háttérzene be-/kikapcsolása

### Média megjelenítés {#media-display}

#### Médiaablak átmenetek engedélyezése {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Engedélyezze az elsötétülést/kivilágosodást a médiaablak megjelenítésekor vagy elrejtésekor.

**Alapértelmezett**: `igaz`

#### Média logó elrejtése {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Rejtse el a logót a médiaablakban.

**Alapértelmezett**: `hamis`

#### Maximális felbontás {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

A letöltött médiafájlok maximális felbontása.

**Opciók**: 240p, 360p, 480p, 720p

**Alapértelmezett**: 720p

#### Include Printed Media {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Include media from the printed publications in media downloads.

**Alapértelmezett**: `igaz`

#### Exclude Footnotes {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Exclude footnote images from media downloads when possible.

**Alapértelmezett**: `hamis`

#### Exclude media from the Teaching brochure {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclude media from the Teaching (th) brochure from media downloads.

**Alapértelmezett**: `igaz`

### Subtitles {#subtitles}

#### Enable Subtitles {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Enable subtitle support for media playback.

**Alapértelmezett**: `hamis`

#### Subtitle Language {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Language for subtitles (can be different from media language).

**Opciók**: Az összes elérhető nyelv Jehova Tanúi hivatalos weboldaláról

**Alapértelmezett**: Nincs

### Media Export {#settings-guide-media-export}

#### Enable Media Auto-Export {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Automatically export media files to a specified folder.

**Alapértelmezett**: `hamis`

#### Media Export Folder {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Folder path where media files will be automatically exported.

**Alapértelmezett**: Üres

#### Convert Files to MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

Convert exported media files to MP4 format for better compatibility.

**Alapértelmezett**: `hamis`

### Danger Zone {#danger-zone}

:::warning Figyelmeztetés

These settings should only be changed if you understand their implications.

:::

#### Base URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Base domain used to download publications and media.

**Default**: `jw.org`

#### Disable Media Fetching {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Completely disable automatic media downloads. Use this only for profiles that will be used for special events or other custom setups.

**Alapértelmezett**: `hamis`

## Tips for Optimal Configuration {#configuration-tips}

### For New Users {#new-users}

1. Start with the setup wizard to configure basic settings
2. Enable "Media Display Button" to access presentation features
3. Configure your meeting schedule accurately
4. Set up OBS integration if you use hybrid meetings

### For Advanced Users {#advanced-users}

1. Use folder monitoring to sync media from cloud storage
2. Enable media auto-export for backup purposes
3. Configure keyboard shortcuts for efficient operation
4. Configure Zoom integration for automatic screen sharing

### Performance Optimization {#performance-optimization}

1. Enable extra cache for better performance
2. Use appropriate maximum resolution for your needs
3. Configure cache auto-clear to manage disk space
4. Consider metered connection setting if on limited bandwidth

### Troubleshooting {#settings-guide-troubleshooting}

- If media isn't downloading, check your meeting schedule settings
- If OBS integration isn't working, verify port and password settings
- If performance is slow, try enabling extra cache or reducing resolution
- If you're having language issues, check both interface and media language settings
- If Zoom participants can't hear media audio, configure Zoom's Original Audio settings or use "Share Computer Sound"
- **Tip**: Consider using Zoom integration instead of OBS Studio for simpler audio handling
