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

A következő Emlékünnep időpontja.

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

### Automatic Meeting Schedule Updates {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

When enabled, M³ periodically checks the official website of Jehovah's Witnesses for meeting day and time changes and updates the current profile automatically.

This only works for profiles that were added with congregation lookup and whose congregation name has not been manually changed. If synchronization was disabled because the congregation name changed, use **Enable schedule sync** to link the profile again.

#### Refresh Meeting Schedule {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Manually synchronize the current and future meeting schedule with the information from the official website.

## Média lekérdezés és lejátszás {#media-retrieval-and-playback}

### Adatkorlátos kapcsolat {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Ha korlátozott adatkapcsolattal rendelkezik, engedélyezze ezt a funkciót a sávszélesség-használat csökkentése érdekében.

**Alapértelmezett**: `hamis`

### Média megjelenítése {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Aktiválja a média megjelenítési funkciót. Ez szükséges a média második kijelzőn való megjelenítéséhez.

**Alapértelmezett**: `hamis`

#### Enable Media Preview {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Show a live preview of the media window while an image or video is being displayed.

**Alapértelmezett**: `igaz`

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
- **Recording Controls**: Show controls that start and stop OBS recording from M³

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

### Meeting Recordings {#meeting-recordings}

#### Enable External Recording App Integration {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Let M³ control a separate recording application with keyboard shortcuts. This does not record inside M³; it sends the configured shortcuts when you press **Start Recording** or **Stop Recording** in the meeting recordings popup.

This option is hidden when OBS recording controls are enabled. If you use OBS Studio, use the OBS recording controls in the OBS integration instead.

**Alapértelmezett**: `hamis`

#### Recording Shortcuts and Folder {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Configure the keyboard shortcut that starts recording, the optional shortcut that stops recording, and the folder where the external app saves recordings. If no stop shortcut is provided, M³ reuses the start shortcut. When a folder is configured, M³ shows a button to open it.

### Meeting Timer {#meeting-timer}

#### Enable Meeting Timer {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Enable a separate timer window for timing meeting parts. This is a beta feature and should only be enabled if approved locally.

**Alapértelmezett**: `hamis`

#### Timer Window Behavior {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configure whether the timer window opens automatically, whether participant timers count up or down by default, whether the clock uses 12-hour or 24-hour time, and whether the current timer value is shown on the action island timer button.

#### Timer Display Formats {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Choose analog or digital display formats for the time of day and countdown timers. The countdown warning indicator can shift the analog countdown ring toward a warning color during the final minute.

#### Meeting Countdown and Schedule Status {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Show a countdown before scheduled meetings and optionally display whether the meeting is ahead of or behind schedule. The meeting countdown appears only on the timer display, not on the main media display.

#### Timer Appearance and Overtime {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Customize the timer text size and colors, and configure overtime indicators such as alternate colors, blinking, and showing only the elapsed overtime amount in count-up mode.

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

#### Enable Playback Speed Control {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Allow audio and video playback speed to be adjusted from the media item's context menu.

**Alapértelmezett**: `hamis`

#### Média logó elrejtése {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Rejtse el a logót a médiaablakban.

**Alapértelmezett**: `hamis`

#### Maximális felbontás {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

A letöltött médiafájlok maximális felbontása.

**Options**: 240p, 360p, 480p, 720p, 1080p

**Alapértelmezett**: 720p

#### A nyomtatott média szerepeltetése {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

A nyomtatott kiadványokból származó médiát is vegye fel a média letöltések közé.

**Alapértelmezett**: `igaz`

#### Lábjegyzetek kizárása {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Zárja ki a lábjegyzetben szereplő képeket a média letöltésekből, ha lehetséges.

**Alapértelmezett**: `hamis`

#### Exclude Additional Watchtower Study Videos {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Exclude additional videos that are referenced in Watchtower Study paragraphs.

**Alapértelmezett**: `hamis`

#### Zárja ki a médiát a Tanítás füzetből {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Kihagyja azokat a médiatartalmakat amelyek a Tanítás (th) füzetben szerepelnek.

**Alapértelmezett**: `igaz`

### Feliratok {#subtitles}

#### Feliratok engedélyezése {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Engedélyezi a feliratok megjelenítését a média lejátszásakor.

**Alapértelmezett**: `hamis`

#### Felirat nyelve {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Feliratok nyelve (eltérhet a média nyelvétől).

**Opciók**: Az összes elérhető nyelv Jehova Tanúi hivatalos weboldaláról

**Alapértelmezett**: Nincs

### Média Export {#settings-guide-media-export}

#### Média automatikus exportálásának engedélyezése {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

A médiafájlok automatikus exportálása egy megadott mappába.

**Alapértelmezett**: `hamis`

#### Média export mappa {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

A mappa útvonala, ahová a médiafájlok automatikusan exportálásra kerülnek.

**Alapértelmezett**: Üres

#### Fájlok konvertálása MP4 formátumba {#convert-files-to-mp4}

**Beállítás**: `convertFilesToMp4`

Konvertálja az exportált médiafájlokat MP4 formátumba a jobb kompatibilitás érdekében.

**Alapértelmezett**: `hamis`

### Profile Settings Transfer {#profile-settings-transfer}

Export the current profile's settings to a JSON file or import a previously exported profile settings file. Importing replaces the current profile's settings.

### Veszélyes zóna {#danger-zone}

:::warning Figyelmeztetés

Ezeket a beállításokat csak akkor módosítsa, ha tisztában van azok következményeivel.

:::

#### Alap URL {#base-url}

<!-- **Setting**: `baseUrl` -->

A kiadványok és média letöltésére használt fő domain.

**Alapértelmezett**: `jw.org`

#### Disable Hardware Acceleration {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Disable hardware acceleration after restarting M³. This may help with graphical glitches or crashes on some systems, but is not otherwise recommended.

**Alapértelmezett**: `hamis`

#### Suppress Hardware Acceleration Reminder {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Hide the reminder to re-enable hardware acceleration after it has been manually disabled.

**Alapértelmezett**: `hamis`

#### Média lekérésének letiltása {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Teljesen letiltja az automatikus média letöltéseket. Ezt csak olyan profilokhoz használja, amelyeket különleges eseményekhez vagy egyéb egyedi célokra használ.

**Alapértelmezett**: `hamis`

## Tippek az optimális konfigurációhoz {#configuration-tips}

### Új felhasználók számára {#new-users}

1. Kezdje a telepítő varázslóval az alapbeállítások konfigurálását
2. Engedélyezze a „Média megjelenítése gomb” funkciót a prezentációs funkciók eléréséhez
3. Állítsa be pontosan az összejövetelek ütemezését
4. Állítsa be az OBS integrációt, ha hibrid összejöveteleket tart

### Haladó felhasználók számára {#advanced-users}

1. Használja a mappafigyelést a felhőalapú tárolóból származó média szinkronizálásához
2. Engedélyezze a média automatikus exportálását biztonsági mentés céljából
3. A hatékony működéshez konfigurálja a billentyűparancsokat
4. Konfigurálja a Zoom integrációt az automatikus képernyőmegosztáshoz

### Teljesítményoptimalizálás {#performance-optimization}

1. Engedélyezze az extra gyorsítótárat a jobb teljesítmény érdekében
2. Használja az igényeinek megfelelő maximális felbontást
3. Konfigurálja a gyorsítótár automatikus törlését, hogy tárhelyet takarítson meg
4. Korlátozott adatforgalom esetén fontolja meg a korlátozott adatkapcsolat beállítását

### Hibaelhárítás {#settings-guide-troubleshooting}

- Ha a média nem töltődik le, ellenőrizze az összejövetel ütemezésének beállításait
- Ha az OBS integráció nem működik, ellenőrizze a port és a jelszó beállításait
- Ha gyenge a teljesítmény, próbálja meg engedélyezni az extra gyorsítótárat vagy csökkenteni a felbontást
- Ha nyelvi problémák merülnek fel, ellenőrizze mind a kezelőfelület, mind a média nyelvi beállításait
- Ha a Zoom résztvevői nem hallják a média hangját, konfigurálja a Zoom eredeti hangbeállításait, vagy használja a „Számítógép hangjának megosztása” ("Share Computer Sound") funkciót
- **Tipp**: Az egyszerűbb hangkezelés érdekében fontolja meg a Zoom integráció használatát az OBS Studio helyett
