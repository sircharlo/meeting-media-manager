# Útmutató a beállításokhoz {#settings-guide}

Ez az átfogó útmutató kategóriák szerint csoportosítva ismerteti az M³-ban elérhető összes beállítást. Ezen beállítások megértése segít abban, hogy az M³-at úgy konfigurálja, hogy az tökéletesen megfeleljen a gyülekezet szükségleteinek.

## Általános {#application-configuration}

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

**Opciók**: vasárnaptól szombatig

**Alapértelmezett**: vasárnap

### Dátumformátum {#date-format}

<!-- **Setting**: `localDateFormat` -->

Az alkalmazásban a dátumok megjelenítéséhez használt formátum.

**Példa**: D MMMM YYYY

**Alapértelmezett**: D MMMM YYYY

### Automatikus indítás bejelentkezéskor {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Automatikusan indítsa el az M³ programot a számítógép indításakor.

**Alapértelmezett**: `false`

## Gyülekezeti összejövetelek {#congregation-meetings}

### Gyülekezet neve {#congregation-name}

<!-- **Setting**: `congregationName` -->

A gyülekezet neve. Ez szervezési és megjelenítési célt szolgál.

**Alapértelmezett**: Üres (a beállítás során kell megadni)

### Összejövetel nyelve {#meeting-language}

<!-- **Setting**: `lang` -->

A média letöltéséhez használt elsődleges nyelv. Ennek meg kell felelnie a gyülekezet összejövetelein használt nyelvnek.

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

**Opciók**: vasárnaptól szombatig

**Alapértelmezett**: Nincs (a beállítás során kell megadni)

### Hét közbeni összejövetel időpontja {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

A hét közbeni összejövetel kezdési időpontja.

**Formátum**: HH:MM (24 órás formátum)

**Alapértelmezett**: Nincs (a beállítás során kell megadni)

### Hétvégi összejövetel napja {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

A hét azon napja, amikor a hétvégi összejövetel megtartásra kerül.

**Opciók**: vasárnaptól szombatig

**Alapértelmezett**: Nincs (a beállítás során kell megadni)

### Hétvégi összejövetel időpontja {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

A hétvégi összejövetel kezdési időpontja.

**Formátum**: HH:MM (24 órás formátum)

**Alapértelmezett**: Nincs (a beállítás során kell megadni)

### A körzetfelvigyázó látogatásának hete {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

A körzetfelvigyázó következő látogatásának hete.

**Formátum**: HH/NN/ÉÉÉÉ

**Alapértelmezett**: Nincs

### Emlékünnep dátuma {#memorial-date}

<!-- **Setting**: `memorialDate` -->

A következő emlékünnep dátuma.

**Formátum**: HH/NN/ÉÉÉÉ

**Alapértelmezett**: Automatikus, időszakos lekérés

### Az összejövetelek időpontjának módosítása {#meeting-schedule-changes}

Ezekkel a beállításokkal ideiglenes módosításokat végezhet az összejövetelek ütemezésében:

- **Az időpontváltozás dátuma**: Mikortól érvényes a változás
- **Az időpontváltozás csak egy hétre vonatkozik**: Ideiglenes vagy állandó-e a változás
- **Hét közbeni összejövetel új napja**: Az új nap, amelyen a hét közbeni összejövetelt tartják
- **Hét közbeni összejövetel új időpontja**: A hét közbeni összejövetel új kezdési időpontja
- **Hétvégi összejövetel új napja**: Az új nap, amelyen a hétvégi összejövetelt tartják
- **Hétvégi összejövetel új időpontja**: A hétvégi összejövetel új kezdési időpontja

### Az összejövetelek időpontjainak automatikus frissítése {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

Ha ez a funkció engedélyezve van, az M³ rendszeresen ellenőrzi Jehova Tanúi hivatalos honlapját, hogy van-e változás a gyülekezeti összejövetelek napjában és időpontjában, és automatikusan frissíti az aktuális profilt.

Ez csak azoknál a profiloknál működik, amelyeket a gyülekezet-kereső segítségével adtak hozzá, és amelyek gyülekezetének nevét nem módosították kézzel. Ha a szinkronizálás a gyülekezet nevének megváltoztatása miatt lett letiltva, akkor az **Ütemezés szinkronizálásának engedélyezése** opcióval kapcsolhatja össze újra a profilt.

#### Ütemezés szinkronizálásának engedélyezése {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Újra összekapcsolja az aktuális profilt a gyülekezetkeresővel, hogy az összejövetelek napjának és időpontjának automatikus frissítése folytatódhasson. Csak akkor jelenik meg, ha a gyülekezet nevét kézzel módosították, mivel éppen ez szakítja meg a kapcsolatot.

#### Összejövetel ütemezésének frissítése {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Kézzel szinkronizálja az aktuális és a jövőbeli összejövetelek ütemezését a hivatalos honlapon szereplő információkkal.

## Média és lejátszás {#media-retrieval-and-playback}

### Korlátozott adatkapcsolat {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Ha korlátozott adatkapcsolattal rendelkezik, engedélyezze ezt a funkciót a sávszélesség-használat csökkentése érdekében.

**Alapértelmezett**: `false`

### Médiamegjelenítés {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

A médiamegjelenítés funkció engedélyezése. Ez szükséges a média második kijelzőn való megjelenítéséhez.

**Alapértelmezett**: `false`

#### Média-előnézet engedélyezése {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Kép vagy videó kivetítése közben mutassa a médiaablak élő előnézetét.

**Alapértelmezett**: `true`

#### Lejátszás megkezdése szüneteltetve {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

A lejátszás megkezdésekor a videókat szüneteltetett állapotba állítja.

**Alapértelmezett**: `false`

### Háttérzene {#settings-guide-background-music}

#### Zene engedélyezése {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Engedélyezi a háttérzenét.

**Alapértelmezett**: `true`

#### Zene automatikus indítása {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

A háttérzene automatikus elindítása az M³ indításakor, ha szükséges.

**Alapértelmezett**: `true`

#### A háttérzene leállítása az összejövetel előtt {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Hány másodperccel az összejövetel kezdete előtt kell leállítani a háttérzenét.

**Tartomány**: 0–300 másodperc

**Alapértelmezett**: 60 másodperc

#### Zene hangereje {#music-volume}

<!-- **Setting**: `musicVolume` -->

A háttérzene hangereje (1-100%).

**Alapértelmezett**: 100%

### Lejátszási és letöltési beállítások {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### Halványítási átmenetek engedélyezése a médiaablaknál {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Engedélyezze az elsötétülést/kivilágosodást a médiaablak megjelenítésekor vagy elrejtésekor.

**Alapértelmezett**: `true`

#### A lejátszási sebesség szabályozásának engedélyezése {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Lehetővé teszi a hang- és videofájlok lejátszási sebességének módosítását a médiaelem helyi menüjéből.

**Alapértelmezett**: `false`

#### Logó elrejtése a médiaablakban {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Rejtse el a logót a médiaablakban.

**Alapértelmezett**: `false`

#### Maximális felbontás {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

A letöltött médiafájlok maximális felbontása.

**Opciók**: 240p, 360p, 480p, 720p, 1080p

**Alapértelmezett**: 720p

#### A nyomtatott média szerepeltetése {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

A nyomtatott kiadványokban szereplő média is bekerül a letöltött média közé.

**Alapértelmezett**: `true`

#### Lábjegyzetek kizárása {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Ha lehetséges, a lábjegyzetekben szereplő képek kimaradnak a letöltött médiából.

**Alapértelmezett**: `false`

#### További Őrtorony-tanulmányozási videók kizárása {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Kizárja azokat a további videókat, amelyekre az Őrtorony-tanulmányozás bekezdései hivatkoznak.

**Alapértelmezett**: `false`

#### A gyülekezeti bibliatanulmányozás videóinak kizárása {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Válassza ki azokat a kiadványokat, amelyekből hivatkozott videók ne jelenjenek meg a gyülekezeti bibliatanulmányozás alatt. Kereshet a kiadvány címe vagy rövidítése alapján.

**Alapértelmezett**: Walk Courageously With God (`wcg`)

#### Média kizárása a Tanítás füzetből {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Kihagyja a letöltésekből a Tanítás (th) füzetben szereplő médiát.

**Alapértelmezett**: `true`

### Feliratok {#subtitles}

#### Feliratok bekapcsolása {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Engedélyezi a feliratok megjelenítését a média lejátszásakor.

**Alapértelmezett**: `false`

#### Feliratok nyelve {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Feliratok nyelve (eltérhet a média nyelvétől).

**Opciók**: Az összes elérhető nyelv Jehova Tanúi hivatalos weboldaláról

**Alapértelmezett**: Nincs

### Gyorsítótár-kezelés {#cache-management}

#### Énekeskönyv videófájlok gyorsítótárba helyezése {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Az összes énekeskönyv-videó előzetes gyorsítótárba helyezése a jobb teljesítmény érdekében. Vegye figyelembe, hogy ez megnöveli a média gyorsítótárának méretét.

**Alapértelmezett**: `false`

#### Gyorsítótár helye {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Egyedi hely a gyorsítótárban tárolt médiafájlok tárolásához.

**Alapértelmezett**: A rendszer alapértelmezett helye

#### Automatikus gyorsítótár-törlés engedélyezése {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

A régi gyorsítótárfájlok automatikus törlése a lemezterület megtakarítása érdekében.

**Alapértelmezett**: `true`

### Pinyin énekek {#pinyin-song-titles}

#### Pinyin énekek előnyben részesítése {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

Ha egy összejöveteli ének pinyin változata megtalálható a pinyin-énekek mappájában, az M³ a szokásos ének helyett azt használja.

**Alapértelmezett**: `false`

#### Pinyin-énekek mappája {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

A pinyin videós énekeket tartalmazó mappa (pl. `sjjm_s-Pi_CHS_066_r720P.mp4`). Ha az M³ talál az összejöveteli ének számának megfelelő pinyin-fájlt, a szokásos ének helyett azt játssza le.

**Alapértelmezett**: Üres

### Média exportálása {#settings-guide-media-export}

#### Automatikus exportálás engedélyezése {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

A médiafájlok automatikus exportálása egy megadott mappába.

**Alapértelmezett**: `false`

#### Auto-exportálási mappa {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

A mappa útvonala, ahová a médiafájlok automatikusan exportálásra kerülnek.

**Alapértelmezett**: Üres

#### Exportált fájlok átalakítása MP4-re {#convert-files-to-mp4}

**Beállítás**: `convertFilesToMp4`

Konvertálja az exportált médiafájlokat MP4 formátumba a jobb kompatibilitás érdekében.

**Alapértelmezett**: `false`

### Megosztott mappa (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

Ezek a beállítások az **Integrációk** kategóriában találhatók.

Az M³ egy felhőtárhely-alkalmazás, például a Dropbox, a OneDrive, az iCloud Drive vagy a Google Drive által szinkronizált mappából is hozzá tud adni médiát az összejövetelekhez. Ez akkor hasznos, ha mások készítik elő a programrészeikhez tartozó médiát, és megosztják Önnel, vagy ha az M³-at több számítógépen is használják. Egy ezen a számítógépen vagy a hálózaton lévő mappa is megfelel.

Az M³ a megosztott mappán belül minden közelgő összejövetelhez létrehoz egy mappát, amelynek neve az összejövetel dátuma év-hónap-nap formában (például `2026-03-25`). Tegyen fényképeket, videókat, hangfájlokat vagy JW Library lejátszási listákat egy összejövetel mappájába, és ezek automatikusan bekerülnek az adott összejövetel médialistájába. Ha egy másik napra szeretne fájlokat hozzáadni, hozzon létre neki egy ugyanígy elnevezett mappát. A megosztott mappában lévő minden más tartalmat az M³ figyelmen kívül hagy.

:::tip Tipp

Hozzon létre egy új mappát, amelyet csak erre használ, például „Összejöveteli média” néven, és a felhőtárhely-alkalmazásban állítsa be, hogy mindig ezen a számítógépen maradjon (ezt gyakran „offline is elérhető” beállításnak hívják), így a fájlok már az összejövetel kezdete előtt készen állnak.

:::

#### Média hozzáadása megosztott mappából {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

A megosztott mappába tett fájlok automatikus hozzáadása a megfelelő összejövetelhez.

**Alapértelmezett**: `false`

#### Megosztott mappa {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Az a mappa, amelyből az M³ a médiát hozzáadja. A beállítási varázsló felajánlja, hogy beállítja Ön helyett.

**Alapértelmezett**: Üres

#### Korábbi összejövetelek mappáinak törlése {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

Ha egy hét véget ért, az adott hét dátummal ellátott mappái a bennük lévő fájlokkal együtt törlődnek, hogy a megosztott mappa rendezett maradjon. Mivel a mappa meg van osztva, ezek mindenki más számára is törlődnek, aki használja. Ha meg szeretné tartani őket, kapcsolja ki ezt a beállítást.

**Alapértelmezett**: `true`

## Összejöveteli időzítő {#meeting-timer}

### Összejöveteli időzítő engedélyezése {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Külön időzítőablakot engedélyez az összejövetel programrészeinek időméréséhez. Ez egy kísérleti funkció, amelyet csak akkor szabad engedélyezni, ha azt helyi szinten jóváhagyták.

**Alapértelmezett**: `false`

### Az időzítőablak viselkedése {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Beállíthatja, hogy az időzítőablak automatikusan megnyíljon-e, hogy a programot tartók időzítője alapértelmezés szerint felfelé számoljon vagy visszaszámoljon, hogy az óra 12 vagy 24 órás formátumot használjon, valamint hogy az időzítő aktuális értéke megjelenjen-e a műveleti panel időzítőgombján.

### Gyors hozzáférés az időzítőhöz {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Válassza ki, hogyan érhető el az időzítő a főablakból:

- **Gyorsvezérlők az időzítőgomb fölé víve az egeret**: ha a műveleti panel időzítőgombja fölé viszi az egeret, megjelenik az éppen mért programrész az Indítás, Szünet, Leállítás és Következő programrész gombokkal, a teljes időzítő felugró ablak megnyitása nélkül. Alapértelmezés szerint be van kapcsolva.
- **Időzítőpanel megjelenítése a főablakban**: az összejövetel programrészeinek teljes listája és az időzítő vezérlői a főablak jobb oldalán rögzített panelen maradnak, mindig szem előtt. Az ablak- és megjelenítési beállításokhoz a teljes felugró ablak továbbra is elérhető a műveleti panelről.

### Távoli időzítő {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemotePort` -->

Ha be van kapcsolva, az M³ a helyi hálózaton weboldalként teszi elérhetővé az időzítő kijelzőjének csak olvasható másolatát a pulpitusnál lévő táblagép vagy telefon számára: így az előadó látja a hátralévő időt anélkül, hogy az megjelenne a gyülekezet kijelzőjén vagy a Zoom-megosztásban. Az oldal valós időben követi az időzítőt, beleértve az összejövetel előtti visszaszámlálást, az órát, az időtúllépés színeit és a kézfelemelés-jelzést, a vezérlők pedig mind az M³-ban maradnak.

Az eszközön megnyitandó címek az időzítő felugró ablakában vannak felsorolva, egy másolás gombbal együtt. A portot csak akkor módosítsa, ha egy másik program már használja. Vegye figyelembe, hogy amíg ez be van kapcsolva, ugyanazon a hálózaton bárki megnyithatja az oldalt; az oldal azonban csak az időzítőt mutatja.

**Alapértelmezett**: `false`, port: `8787`

### Az időzítő megjelenítési formátumai {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Válasszon analóg vagy digitális megjelenítési formátumot a pontos időhöz és a visszaszámláló időzítőkhöz. A visszaszámlálás figyelmeztető jelzése az utolsó percben fokozatosan figyelmeztető színűre változtathatja az analóg visszaszámláló gyűrűt.

Az **Analóg óra időívvel** visszaszámlálási formátum a programrészből hátralévő időt körcikkként mutatja egy analóg óra számlapján, a percmutatótól a tervezett befejezésig, így egyetlen pillantással látható a pontos idő és a hátralévő idő is. Az időtúllépés egy második körcikként jelenik meg az időtúllépés színében. Ez az összejövetel előtti visszaszámlálásra is vonatkozik, és felfelé számláló módban is működik.

### Összejöveteli visszaszámlálás és ütemezési állapot {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Visszaszámlálás megjelenítése a tervezett összejövetelek előtt, és igény szerint annak jelzése, hogy az összejövetel előrébb jár-e vagy le van-e maradva az ütemtervhez képest. Az összejöveteli visszaszámlálás csak az időzítő kijelzőjén jelenik meg, a médiaablakban nem.

### Az időzítő megjelenése és az időtúllépés {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Testreszabhatja az időzítő szövegméretét és színeit, valamint beállíthatja az időtúllépés jelzéseit, például az eltérő színeket, a villogást, illetve azt, hogy felfelé számláló módban csak a túllépés mértéke jelenjen meg.

## Integrációk {#integrations}

Ebben a kategóriában találhatók a [megosztott mappa](#settings-guide-folder-monitoring) beállításai is, amelyekkel a Dropboxból, a OneDrive-ból, az iCloud Drive-ból vagy a Google Drive-ból adhat hozzá médiát.

### Zoom-integráció {#settings-guide-zoom-integration}

#### Zoom engedélyezése {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

A Zoom-értekezletekkel való integráció funkcióinak engedélyezése.

**Alapértelmezett**: `false`

#### Billentyűparancs a Zoom képernyőmegosztáshoz {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

A Zoom képernyőmegosztás elindításához használt billentyűparancs.

**Alapértelmezett**: Nincs

#### A médiaablak automatikus fókuszba helyezése {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

A Zoom képernyőmegosztás elindítása után a médiaablak automatikusan fókuszba kerül. Erre általában nincs szükség, de egyes rendszereken segíthet, ha a médiaablak a képernyőmegosztás elindítása után rendszeresen elveszíti a fókuszt.

**Alapértelmezett**: `false`

### Zoom-értekezletkezelő {#zoom-meeting-manager}

A Zoom-értekezletkezelő (béta, csak Windowson) minden összejövetelnél Ön helyett kezeli a Zoom asztali alkalmazást. A beállítási segéd, amelyet a funkció bekapcsolásakor felajánl, végigvezeti Önt az egyes automatizálásokon.

#### Amikor az M³ vezérli a Zoomot {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

A Zoom nem kínál megfelelő automatizálási felületet, ezért az M³ az akadálymentesítési felületén keresztül vezérli a Zoom alkalmazást, ami az egér mozgatása nélkül működik, még akkor is, ha a Zoom elrejti az eszköztárát. A Zoom ugyanakkor egy pillanatra előtérbe hozza az ablakát, amikor az M³ megnyomja a gombjait, az egér pedig csak végső esetben mozdul meg, ha a Zoom semmilyen más módra nem reagál. Amikor az M³ vezérli a Zoomot, a saját ablakát egy „Az M³ vezérli a Zoomot” értesítéssel takarja le, amely megnevezi, mi történik, és **Az automatizálás megszakítása** gombot is tartalmazza. Ugyanez az értesítés jelenik meg a beállítási segéd ellenőrzései és az öntesztelés közben is. Egy globális billentyűparancs (alapértelmezés szerint `Ctrl+Alt+Escape`), amely csak egy automatizálás futása közben aktív, bárhonnan megszakítja azt, akkor is, ha a Zoom van fókuszban. A megszakítás azonnal leállítja az M³ műveletét; a Zoom ilyenkor félkész állapotban maradhat, ezért ellenőrizze.

**Alapértelmezett**: `Ctrl+Alt+Escape`

#### Kézfelemelés-segéd {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert` -->

Az összejövetel alatt az M³ figyeli a Zoom résztvevőlistáján a felemelt kezeket. Amikor valaki felemeli a kezét, az M³ értesítésében egy kattintással **feloldhatja a résztvevő némítását**, majd amikor befejezte a hozzászólást, egy újabb kattintással **ismét némíthatja, és leengedheti a kezét**. A műveleti panel Zoom-gombja ugyanezekkel a gombokkal sorolja fel a felemelt kezeket. Minden művelet az adott résztvevő saját sorára vonatkozik a Zoomban, a pontos neve alapján; ha két résztvevőnek ugyanaz a neve, az M³ egyikükhöz sem nyúl.

Ha az [összejöveteli időzítő](#meeting-timer) engedélyezve van, az elnök számára az időzítő kijelzőjén is megjelenik egy nagy kéz a résztvevő nevével, az időzítő és a Zoom felugró ablakában pedig a **Kézfelemelés-jelzés** gombbal kézzel is megjeleníthető. Ehhez a részhez szükség van az időzítő kijelzőjére; az értesítések és a gombok nélküle is működnek.

A Zoom a saját nyelvén jelöli a felemelt kezeket, ezért az M³-nak először meg kell tanulnia, hogyan: miközben az értekezlet meg van nyitva a Zoomban, kattintson az **Annak betanítása, hogyan jelöli a Zoom a felemelt kezeket** gombra. Az M³ felemeli az Ön kezét, kiolvassa, hogyan jelöli ezt a Zoom a résztvevőlistában, és melyik menüpont engedi le, majd újra leengedi. A beállítási segéd is felkínálja ezt a lépést.

**Alapértelmezett**: `false`

#### Window Layout {#zoom-meeting-manager-window-layout}

<!-- **Setting**: `zoomMeetingManagerWindowLayout` -->

M³ can put Zoom's meeting window, and its own main window, where you want them on your screens. The setup assistant asks where in two steps, which the **Choose the layout** button here opens again at any time:

1. On a map of your screens as they are arranged, pick the screen for Zoom's meeting. The screen the media window fills is never offered. If Zoom's screen isn't the one M³ is on, choose whether Zoom has it to itself or shares it with M³ (M³ then moves there too).
2. On a drawing of that screen at its real shape, drag the divider to share it between M³ and Zoom. It clicks onto the usual proportions (a half, a third, a quarter and so on); hold `Alt` to drag it freely. The divider never leaves a window smaller than it can be: Zoom needs more room while its participants list is open. On a portrait screen, the two windows go one above the other.

As soon as the meeting opens, M³ opens Zoom's participants list if you asked it to, then puts both windows in place. From then on, it keeps Zoom where it belongs: when Zoom moves or resizes its window by itself, after screen sharing or as its participants list opens or closes, M³ puts it back. If you move or resize Zoom yourself, M³ leaves it where you put it until the next meeting. Each time M³ moves Zoom by itself, a notification says so, with two buttons should that get in the way: **Leave Zoom alone** stops it until M³ restarts, and **Turn off** turns the window layout off until you turn it back on here. When screens are connected or removed, M³ arranges the windows again; if Zoom's screen is no longer there, Zoom shares M³'s screen and M³ tells you so.

While Zoom shares the media window, it hides its own meeting window, participants list included. With **Show the participants list while sharing** on, M³ then opens Zoom's participants list in a window of its own, in Zoom's place, so you still see who raises a hand to comment. If you close it, it stays closed until the next share; Zoom closes it by itself when sharing stops, and its meeting window comes back in place.

With Zoom's **Use dual monitors** setting on, Zoom opens a second window (showing the shared screen or the speaker). M³ puts it full screen on the media window's screen, behind the media window: hide the media window to show it, for example to see the participants.

When **Snap them with Windows** is on, M³ snaps the two windows side by side with Windows' own snapping, as if you had dragged them to the edges of the screen, so dragging the border between them resizes both. To do so, M³ brings each window forward for a moment.

The **Arrange windows** button in the Zoom popup puts everything back in place at any time. The window layout is kept per computer, since it depends on its screens.

**Default**: off

### OBS Studio-integráció {#settings-guide-obs-integration}

#### OBS engedélyezése {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Az OBS Studio-integráció engedélyezése az automatikus jelenetváltáshoz.

**Alapértelmezett**: `false`

:::warning Fontos megjegyzés

**Hangbeállítás szükséges**: Az OBS Studio-integráció csak a képernyőmegosztást kezeli. Az OBS Studio használatakor az M³ által lejátszott média hangja **nem jut el automatikusan** a Zoom-résztvevőkhöz. Be kell állítania a Zoom Original Audio beállításait, vagy használnia kell a „Share Computer Sound” (Számítógép hangjának megosztása) funkciót, hogy az összejövetel résztvevői hallhassák a médiát. A hang beállításának részletes leírását a [Felhasználói útmutatóban](/user-guide#audio-configuration) találja.

**Megjegyzés**: A Zoom-integráció a Zoom saját képernyőmegosztását használja, amely az OBS Studio-integrációnál gördülékenyebben kezeli a hangot.

:::

#### OBS-port {#obs-port}

<!-- **Setting**: `obsPort` -->

Az OBS Studio WebSockethez való csatlakozás portszáma.

**Alapértelmezett**: Nincs

#### OBS-jelszó {#obs-password}

<!-- **Setting**: `obsPassword` -->

Az OBS Studio WebSocket-kapcsolat jelszava.

**Alapértelmezett**: Nincs

#### OBS-jelenetek {#obs-scenes}

Állítsa be, hogy mely OBS-jeleneteket szeretné különböző célokra használni:

- **Kamerajelenet**: A kamera, illetve a pulpitus képét mutató jelenet
- **Médiajelenet**: A média megjelenítésére szolgáló jelenet
- **Képjelenet**: Képek megjelenítésére szolgáló jelenet (például egy PIP (kép a képben) jelenet, amely egyszerre mutatja a médiát és az előadót)

#### Haladó OBS-beállítások {#obs-advanced-options}

- **Ne osszon meg automatikusan képeket**: A képek csak kézi indításra kerülnek megosztásra az OBS-ben
- **Gyors kapcsoló**: Az OBS-integráció gyors be- és kikapcsolásának engedélyezése
- **Jelenetváltás a média után**: A média lejátszása után automatikusan visszatér az előző jelenethez
- **Előző jelenet megjegyzése**: Megjegyzi az előző jelenetet és visszaállítja azt
- **Ikonok elrejtése**: Az OBS-hez kapcsolódó ikonok elrejtése a felületen
- **Felvételvezérlők**: Olyan vezérlők megjelenítése, amelyekkel az M³-ból elindítható és leállítható az OBS-felvétel

:::warning Fontos megjegyzés

**Hangbeállítás szükséges**: Az OBS Studio-integráció csak a videót, illetve a jelenetváltást kezeli. Az M³ média hangja **nem kerül automatikusan továbbításra** a Zoom vagy az OBS alkalmazásba. A videofolyam úgy működik, mint egy hang nélküli virtuális kamera, akárcsak egy webkamera. Be kell állítania a Zoom Original Audio beállításait, vagy használnia kell a „Share Computer Sound” (Számítógép hangjának megosztása) funkciót, hogy az összejövetel résztvevői hallhassák a médiát. A hang beállításának részletes leírását a [Felhasználói útmutatóban](/user-guide#audio-configuration) találja.

**Alternatíva**: Fontolja meg inkább a Zoom-integráció használatát, mivel az a Zoom saját képernyőmegosztását használja, amely gördülékenyebben kezeli a hangot.

:::

### Egyéni események {#custom-events}

#### Egyéni események engedélyezése {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Egyéni billentyűparancsok engedélyezése, amelyek egy adott esemény észlelésekor aktiválódnak (pl. a média lejátszásakor, szüneteltetésekor vagy leállításakor).

**Alapértelmezett**: `false`

#### Egyéni események billentyűparancsai {#custom-event-shortcuts}

##### Médialejátszás esemény billentyűparancsa {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

A média lejátszásakor aktiválódó billentyűparancs.

**Alapértelmezett**: Nincs

##### Média szüneteltetve esemény billentyűparancsa {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

A média szüneteltetésekor aktiválódó billentyűparancs.

**Alapértelmezett**: Nincs

##### Média leállítva esemény billentyűparancsa {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

A média leállításakor aktiválódó billentyűparancs.

**Alapértelmezett**: Nincs

##### Utolsó összejöveteli ének esemény billentyűparancsa {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Billentyűparancs, amely akkor aktiválódik, amikor az összejövetel utolsó éneke lejátszásra kerül.

**Alapértelmezett**: Nincs

### Összejövetel-felvételek {#meeting-recordings}

#### Külső felvételi alkalmazás integrációjának engedélyezése {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Megengedi, hogy az M³ billentyűparancsokkal vezéreljen egy külső felvételi alkalmazást. Ez nem az M³-on belül készít felvételt; a beállított billentyűparancsokat küldi el, amikor az Összejövetel-felvételek felugró ablakban a **Felvétel indítása** vagy a **Felvétel leállítása** gombra kattint.

Ez az opció el van rejtve, ha az OBS felvételi vezérlői engedélyezve vannak. Ha az OBS Studio programot használja, akkor inkább az OBS-integrációban található OBS-felvételi vezérlőket érdemes használni.

**Alapértelmezett**: `false`

#### Felvételi billentyűparancsok és mappa {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Állítsa be a felvétel elindításához szükséges billentyűparancsot, a felvétel leállításához szükséges opcionális billentyűparancsot, valamint azt a mappát, ahová a külső alkalmazás a felvételeket menti. Ha nem ad meg leállítási billentyűparancsot, az M³ az indítási billentyűparancsot használja újra. Ha egy mappa be van állítva, az M³ megjeleníti a mappa megnyitásához szükséges gombot.

## Felület és billentyűparancsok {#interface-shortcuts}

### Billentyűparancsok {#settings-guide-keyboard-shortcuts}

#### Billentyűparancsok engedélyezése {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Engedélyezze a testreszabható billentyűparancsokat a média vezérléséhez.

**Alapértelmezett**: `false`

#### Médiavezérlési billentyűparancsok {#media-control-shortcuts}

Billentyűparancsok beállítása a médialejátszáshoz:

- **Médiaablak**: Médiaablak megnyitása/bezárása
- **Előző média**: Ugrás az előző médiaelemre
- **Következő média**: Ugrás a következő médiaelemre
- **Szünet/Folytatás**: A média lejátszásának szüneteltetése vagy folytatása
- **Média leállítása**: A média lejátszásának leállítása
- **Zene be-/kikapcsolása**: Háttérzene be-/kikapcsolása

### További média hozzáadása gomb {#add-more-media-button}

#### „További média hozzáadása” gombbal rendelkező szakaszok {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Válassza ki, mely összejöveteli szakaszokban jelenjen meg saját gomb a saját média hozzáadásához, a felső eszköztár „Média hozzáadása” gombja mellett, amely mindig minden szakasznál működik.

**Alapértelmezett**: Nyilvános előadás, Keresztényi életünk, a körzetfelvigyázó látogatása és az egyéni szakaszok

#### Kompakt mód a média hozzáadása gombhoz {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

A szakaszfejlécekben csak ikon jelenjen meg a „További média hozzáadása”/„Ének hozzáadása” gombhoz. Ha ki van kapcsolva, a gomb elég hely esetén szöveget is mutat az ikon mellett.

**Alapértelmezett**: `true`

### Húzási fogantyú a médiaelemeken {#media-drag-handle}

#### Húzási fogantyú megjelenítése {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Kis fogantyú megjelenítése minden médiaelemen az átrendezéshez. A médiaelemek bárhol megfogva mindig átrendezhetők húzással; ez a beállítás csak azt befolyásolja, hogy maga a fogantyúikon megjelenik-e.

**Alapértelmezett**: `true`

### Összejövetel előtti/utáni gyorsműveletek {#before-after-meeting-quick-actions}

#### Összejöveteli gyorsműveletek megjelenítése {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Összejövetel előtti és utáni panel megjelenítése hasznos vezérlőkkel (háttérzene, felvétel), mindkettőhöz testreszabható ellenőrzőlistával.

**Alapértelmezett**: `true`

Az összejövetel előtti és utáni panel ellenőrzőlistáinak kategóriái és feladatai ugyanebben a beállításszakaszban kezelhetők: a gyülekezet igényei szerint hozzáadhat, átnevezhet, átrendezhet vagy törölhet kategóriákat és feladatokat.

## Haladó {#advanced-settings}

### Profilbeállítások átvitele {#profile-settings-transfer}

Exportálja az aktuális profil beállításait JSON-fájlba, vagy importáljon egy korábban exportált profilbeállítás-fájlt. Az importálás felülírja az aktuális profil beállításait.

### Veszélyes zóna {#danger-zone}

:::warning Figyelmeztetés

Ezeket a beállításokat csak akkor módosítsa, ha tisztában van azok következményeivel.

:::

#### Alap-URL {#base-url}

<!-- **Setting**: `baseUrl` -->

A kiadványok és média letöltésére használt fő domain.

**Alapértelmezett**: `jw.org`

#### Hardveres gyorsítás kikapcsolása {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Az M³ újraindítása után kikapcsolja a hardveres gyorsítást. Ez egyes rendszereken segíthet a grafikai hibák vagy összeomlások esetén, de egyébként nem ajánlott.

**Alapértelmezett**: `false`

#### Hardveres gyorsítás emlékeztető elrejtése {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Elrejti a hardveres gyorsítás újbóli bekapcsolására figyelmeztető emlékeztetőt, miután azt kézzel kikapcsolták.

**Alapértelmezett**: `false`

#### Média lekérésének letiltása {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Teljesen letiltja a média automatikus letöltését. Ezt csak olyan profilokhoz használja, amelyeket különleges eseményekhez vagy egyéb egyedi célokra használ.

**Alapértelmezett**: `false`

## Tippek az optimális konfigurációhoz {#configuration-tips}

### Új felhasználók számára {#new-users}

1. Az alapbeállítások megadásához kezdje a beállítási varázslóval
2. Kapcsolja be a „Médialejátszás engedélyezése” beállítást a bemutatási funkciók eléréséhez
3. Állítsa be pontosan az összejövetelek ütemezését
4. Állítsa be az OBS-integrációt, ha hibrid összejöveteleket tart

### Haladó felhasználók számára {#advanced-users}

1. Használjon megosztott mappát, ha felhőtárhelyről, például a Dropboxból vagy a OneDrive-ból szeretne médiát hozzáadni
2. Engedélyezze a média automatikus exportálását biztonsági mentés céljából
3. A hatékony működéshez konfigurálja a billentyűparancsokat
4. Konfigurálja a Zoom-integrációt az automatikus képernyőmegosztáshoz

### Teljesítményoptimalizálás {#performance-optimization}

1. A jobb teljesítmény érdekében helyezze gyorsítótárba az énekeskönyv videófájljait
2. Használja az igényeinek megfelelő maximális felbontást
3. Konfigurálja a gyorsítótár automatikus törlését, hogy tárhelyet takarítson meg
4. Korlátozott adatforgalom esetén fontolja meg a korlátozott adatkapcsolat beállítását

### Hibaelhárítás {#settings-guide-troubleshooting}

- Ha a média nem töltődik le, ellenőrizze az összejövetel ütemezésének beállításait
- Ha az OBS-integráció nem működik, ellenőrizze a port és a jelszó beállításait
- Ha gyenge a teljesítmény, próbálja meg engedélyezni az extra gyorsítótárat vagy csökkenteni a felbontást
- Ha nyelvi problémák merülnek fel, ellenőrizze mind a kezelőfelület, mind a média nyelvi beállításait
- Ha a Zoom-résztvevők nem hallják a média hangját, állítsa be a Zoom Original Audio beállításait, vagy használja a „Share Computer Sound” (Számítógép hangjának megosztása) funkciót
- **Tipp**: Az egyszerűbb hangkezelés érdekében fontolja meg a Zoom-integráció használatát az OBS Studio helyett
