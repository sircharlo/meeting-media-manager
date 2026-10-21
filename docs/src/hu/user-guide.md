# Felhasználói útmutató {#user-guide}

Ez az átfogó felhasználói útmutató segít elsajátítani az M³ összes funkcióját, az alapvető beállításoktól a fejlett médiaprezentációs módszerekig.

## Első lépések {#getting-started}

### Letöltés és telepítés {#download-and-install}

A legújabb verziót a [Letöltési oldalról](download) szerezheti be. Az oldal az Ön eszközéhez legmegfelelőbb kiadást ajánlja, és megmutatja a legújabb verziót.

### Első indítás {#first-launch}

Amikor először indítja el az M³ programot, egy beállítási varázsló végigvezeti Önt a gyülekezetéhez szükséges alapvető beállítások konfigurálásán:

1. **A felület nyelvének kiválasztása** - Ez határozza meg, hogy az M³ menüi és gombjai milyen nyelven jelenjenek meg
2. **Profil típus kiválasztása** - Normál gyülekezeti használatra válassza a „Normál” lehetőséget, különleges eseményekre pedig az „Egyéb” lehetőséget
3. **Gyülekezeti adatok beállítása** - Adja meg a gyülekezeti adatokat, vagy használja az automatikus keresési funkciót
4. **Az összejövetelek időpontjainak beállítása** - Állítsa be a hét közbeni és a hétvégi összejövetel időpontját
5. **Választható funkciók** - Az OBS-integráció, a háttérzene és más haladó funkciók beállítása

:::tip Tipp

A beállítás során ne spóroljon az idővel – később ezeket a beállításokat bármikor megváltoztathatja a Beállítások menüben.

:::

### Fő felület áttekintése {#main-interface}

Az M³ fő felülete több fontos részből áll:

- **Navigációs menü** - Hozzáférés a különböző menüpontokhoz és beállításokhoz
- **Naptárnézet** - Média böngészése dátum szerint
- **Médialista** – A kiválasztott dátumokhoz tartozó média megtekintése és kezelése
- **Eszköztár** - Gyors hozzáférés a gyakori funkciókhoz
- **Állapotjelző sáv** - Megjeleníti a letöltések állását, valamint a háttérzene és az OBS Studio-kapcsolat állapotát

## Médiakezelés {#user-guide-media-management}

### A Naptárnézet megértése {#calendar-view}

A naptárnézetben látható az összejövetelek ütemezése és a rendelkezésre álló média:

- **Összejövetelek napjai** – A kiemelt napok jelzik, hogy mikorra vannak beütemezve az összejövetelek
- **Médiajelzők** – Az ikonok jelzik, hogy milyen típusú média áll rendelkezésre
- **Navigálás a dátumok között** - A nyílbillentyűkkel lapozhat a hónapok között

### A média rendszerezése {#organizing-media}

Az M³ automatikusan rendezi a médiát az összejövetel típusa és részei szerint:

- **Összejöveteli szakaszok** - A média az összejövetel programrészei szerint van csoportosítva (Nyilvános előadás, Gyöngyszemek Isten Szavából stb.)
- **Egyéni szakaszok** – Ha az adott napon nincs tervezett összejövetel, egyéni szakaszokat hozhat létre további médiaelemek számára
- **Kézi sorrend** - Húzza a médiaelemeket a kívánt sorrendbe, vagy szükség esetén állítsa vissza az eredeti sorrendet
- **Ismételt lejátszás** - Ismételtessen egyetlen médiaelemet vagy egy szakasz összes elemét, amíg kézzel le nem állítja a lejátszást

### Rejtett és hiányzó média {#hidden-and-missing-media}

A média elrejthető az összejövetel médialistájáról anélkül, hogy az automatikusan letöltött fájlok törlődnének. Ha véletlenül rejtett el valamit, használja a kiválasztott napnál a **Rejtett média megjelenítése** lehetőséget.

Ha az M³ hiányzó médiát jelez, először ellenőrizze, hogy az elem várhatóan elérhetővé válik-e az összejövetel időpontjának közeledtével. A hiányzó elemet kézzel is hozzáadhatja a **Média hozzáadása** menüvel, vagy úgy, hogy behúzza a médialistába.

## Médiaprezentáció {#media-presentation}

### A médialejátszó megnyitása {#opening-media-player}

A média bemutatása egy összejövetelen:

1. Válassza ki a dátumot és a bemutatni kívánt médiaelemet
2. Kattintson a lejátszás gombra, vagy használja a billentyűparancsot
3. A média lejátszása elindul a médiaablakban
4. A vezérlőkkel lejátszhat, szüneteltethet vagy navigálhat a médiatartalmak között

### A médialejátszó vezérlői {#media-player-controls}

A médialejátszó többféle vezérlést biztosít:

- **Lejátszás/Szünet** - A média lejátszásának elindítása vagy szüneteltetése
- **Leállítás** - A lejátszás leállítása

<!-- - **Previous/Next** - Navigate between media items
- **Volume** - Adjust playback volume -->

<!-- - **Fullscreen** - Toggle fullscreen mode -->

- **Nagyítás/mozgatás** - Nagyításhoz tartsa lenyomva a Ctrl vagy a Shift billentyűt, és görgessen az egérrel, vagy használjon csippentő mozdulatot az érintőpadon, majd húzással mozgassa a képet (képeknél)
- **Élő előnézet** - Ha engedélyezve van, a főablakban megjelenik a hallgatóság felé mutatott médiaablak előnézete
- **Lejátszási sebesség** - Ha a beállításokban engedélyezve van, a médiaelem helyi menüjéből módosíthatja a hang- és videofájlok lejátszási sebességét

### Haladó bemutatási funkciók {#advanced-presentation}

#### Egyéni időzítés {#custom-timing}

Állítson be egyéni kezdési és befejezési időpontot a médiaelemekhez:

<!-- 1. Right-click on a media item
2. Select "Edit Timing" -->

1. Kattintson a videó időtartamára a miniatűr bal felső sarkában
2. Állítsa be a kezdési és befejezési időpontokat
3. Mentse el a változtatásokat

#### Nagyítás és mozgatás {#zoom-pan}

Képek és videók esetén:

- **Nagyítás/kicsinyítés** - Tartsa lenyomva a Ctrl vagy a Shift billentyűt, és görgessen az egérrel, használjon csippentő mozdulatot az érintőpadon, vagy használja a miniatűrön lévő nagyítási vezérlőket
- **Mozgatás** - Nagyítás után kattintson a miniatűrre, és húzással mozgassa a képet (az elem átrendezéséhez a sor többi részét húzza)
- **Nagyítás visszaállítása** - Kattintással visszatérhet az eredeti nagyításhoz

#### Billentyűparancsok {#user-guide-keyboard-shortcuts}

Konfiguráljon egyéni billentyűparancsokat a gyors hozzáféréshez. Ne feledje, hogy alapértelmezés szerint nincsenek beállítva billentyűparancsok.

**Beépített médiavezérlők** (amikor a főablak aktív, és a médialista látható):

- **Tab/Shift+Tab** - Navigálás a médiaelemek között
- **Fel/le nyíl** - Navigálás a médiaelemek között
- **Szóköz** - Média lejátszása/szüneteltetése
- **Escape** - Média leállítása

**Testreszabható billentyűparancsok** (ha engedélyezve vannak a beállításokban):

- **Médiaablak** - Médiaablak megnyitása/bezárása
- **Előző/Következő média** - Navigálás a médiaelemek között
- **Szünet/Folytatás** - A média lejátszásának vezérlése
- **Média leállítása** - A média lejátszásának leállítása
- **Zene be-/kikapcsolása** - A háttérzene vezérlése

**Megjegyzés (\*):** Globális billentyűparancs - akkor is elérhető, ha az alkalmazás nincs fókuszban

## Megjelenítési eszközök {#display-tools}

### Médiaablak {#media-display-window}

A médiaablak az az ablak, amelyet a hallgatóság lát. A rendelkezésre álló eszközöktől függően külső kijelzőn is megjeleníthető, vagy ablakos elrendezésben is használható.

A megjelenítési felugró ablakban a következőket teheti:

- Megjelenítheti vagy elrejtheti a médiaablakot
- Kiválaszthatja a kijelzőt vagy az ablak típusát
- Ideiglenes egyéni hátteret választhat az éviszöveg helyett
- Egy elérhető kamerát használhat háttérként. Ezt főleg a jelnyelvi gyülekezetek használják.

Vegye figyelembe, hogy az egyéni háttér ideiglenes, és az M³ bezárása után nem marad meg.

### Összejöveteli időzítő {#user-guide-meeting-timer}

Ha az összejöveteli időzítő engedélyezve van, az M³ külön időzítőablakot tud megjeleníteni a programot tartók programrészeinek időméréséhez. Az időzítő tud felfelé számlálni és visszaszámlálni, megjeleníti a pontos időt, a tervezett összejövetelek előtt visszaszámlálást mutat, és igény szerint jelzi az időtúllépést, illetve azt, hogy az összejövetel előrébb jár-e vagy le van-e maradva az ütemtervhez képest.

Az időzítő béta funkció, és csak helyi jóváhagyással szabad használni.

#### Az összejövetel programrészei {#user-guide-timer-parts}

A műveleti panel időzítő felugró ablaka felsorolja a kiválasztott napi összejövetel programrészeit. A hét közbeni összejövetelnél adja meg, hány programrész van a Fejlődjünk a szolgálatban és a Keresztényi életünk szakaszban; a szakasz percei egyenlően oszlanak el, majd az egyes programrészek szabadon módosíthatók a **+** és **−** gombokkal, vagy a programrészre kattintva. Bármelyik programrész tetszőleges számú percre állítható, akár 0-ra is, ha ki szeretné hagyni. Egy figyelmeztető ikon jelzi azokat a szakaszokat, amelyek programrészeinek összideje nem egyezik a szakaszra szánt idővel, de magától soha nem módosít semmit.

**Egyéni programrészek** bármelyik napon hozzáadhatók, például a vezetőtestület beszámolóihoz, különleges programokhoz vagy bármihez, ami nem szerepel a szokásos programban. Azokon a napokon, amikor nincs összejövetel, az időzítő minden egyéni médiaszakaszhoz egy egyéni programrésszel indul.

A programrészek száma, a módosított időtartamok, az egyéni programrészek és a rögzített időmérések naponként tárolódnak, így az M³ újraindítása után is megmaradnak, és az egyik összejövetel időmérései sosem keverednek egy másikéval. Egy nap rögzített időmérései egy lépésben törölhetők **A nap összes időmérésének visszaállítása** gombbal, és bármikor exportálható egy PDF formátumú időmérési jelentés.

#### Kézfelemelés-jelzés {#user-guide-timer-hand-alert}

Az időzítő felugró ablakában található **Kézfelemelés-jelzés** gomb egy nagy kezet jelenít meg az időzítő kijelzőjén, hogy felhívja az elnök figyelmét, például ha valaki felemelte a kezét a Zoomon. A [Zoom-értekezletkezelő kézfelemelés-segédjével](/settings-guide#zoom-meeting-manager-hand-alert) az M³ automatikusan megjeleníti ezt a jelzést a résztvevő nevével, valahányszor valaki felemeli a kezét a Zoomban, és egy-egy kattintással feloldhatja a némítását, majd újra némíthatja és leengedheti a kezét.

#### Időzítő táblagépen {#user-guide-timer-remote}

A választható [távoli időzítő](/settings-guide#timer-remote) a helyi hálózaton weboldalként teszi elérhetővé az időzítő kijelzőjének csak olvasható másolatát. Nyissa meg az időzítő felugró ablakában látható címet a pulpitusnál lévő táblagép vagy telefon böngészőjében, így az előadó csak saját maga látja a hátralévő időt, a vezérlők pedig mind az M³-ban maradnak.

#### Gyors hozzáférés {#user-guide-timer-quick-access}

Ha a műveleti panel időzítőgombja fölé viszi az egeret, megjelenik az éppen mért programrész az Indítás, Szünet, Leállítás és Következő programrész gombokkal. Egy beállítással a főablak jobb oldalán egy időzítőpanel is rögzíthető a programrészek teljes listájával és az időzítő vezérlőivel, amely mindig szem előtt van. Lásd az [Útmutató a beállításokhoz](/settings-guide#timer-quick-access) című oldalt.

## Háttérzene {#user-guide-background-music}

### Háttérzene beállítása {#background-music-setup}

A háttérzene automatikusan elindul az összejövetel előtt és a megfelelő időben leáll:

1. **Zene engedélyezése** - A háttérzene engedélyezése a beállításokban
2. **Automatikus indítás** - Ha indokolt, a zene automatikusan elindul az M³ indításakor
3. **Leállás az összejövetel előtt** - A zene automatikusan leáll az összejövetel kezdete előtt
4. **Kézi vezérlés** – Az állapotjelző sávon található zene gombbal indíthatja el/állíthatja le kézzel a lejátszást
5. **Újraindítás** – Egy kattintással folytathatja a zene lejátszását az összejövetel után

## Zoom integráció {#user-guide-zoom-integration}

Az M³ integrálható a Zoommal az automatikus képernyőmegosztáshoz:

1. **Integráció engedélyezése** – Engedélyezze a Zoom-integrációt a beállításokban
2. **Gyorsbillentyű beállítása** – Állítsa be a Zoom-ban beállított képernyőmegosztási gyorsbillentyűt. Győződjön meg arról, hogy a Zoom alkalmazásban be van jelölve a "global" jelölőnégyzet.
3. **Automatikus vezérlés** – Az M³ szükség szerint automatikusan be- és kikapcsolja a képernyőmegosztást a Zoom alkalmazásban
4. **Kézi vezérlés** – Szükség esetén továbbra is kézzel vezérelheti a képernyőmegosztást a Zoom segítségével

## OBS Studio integráció {#user-guide-obs-integration}

### Az OBS-integráció beállítása {#user-guide-obs-setup}

Az M³ használata az OBS Studio programmal hibrid összejövetelekhez:

1. **OBS Studio telepítése** - Töltse le és telepítse az OBS Studio programot
2. **WebSocket engedélyezése** - Telepítse a WebSocket bővítményt az OBS programban
3. **M³ konfigurálása** - Adja meg az OBS portot és jelszót az M³ beállításaiban
4. **Jelenetek beállítása** – Jelenetek létrehozása kamerához, médiához és egyéb tartalmakhoz
5. **Teszt** - Ellenőrizze, hogy a lejátszás megfelelően működik-e

### OBS jelenetkezelés {#obs-scene-management}

Az M³ a bemutatás során automatikusan vált az OBS-jelenetek között:

- **Kamerajelenet** - A pulpitus/kamera képét mutatja
- **Médiajelenet** - A médiatartalom megjelenítése
- **Képjelenet** - Képek megjelenítése (késleltethető, ha engedélyezve van)
- **Automatikus váltás** – A jelenetek a médiatípus és a beállítások alapján cserélődnek
- **Felvételvezérlők** - Ha engedélyezve vannak, az M³ az OBS felugró ablakából el tudja indítani és le tudja állítani az OBS-felvételt

### Haladó OBS funkciók {#advanced-obs}

#### Ne osszon meg automatikusan képeket {#user-guide-postpone-images}

Engedélyezze ezt az opciót, ha késleltetni szeretné a képek OBS-hez való továbbítását, amíg azt manuálisan el nem indítja:

1. Kapcsolja be az OBS-beállítások között a „Ne osszon meg automatikusan képeket” lehetőséget
2. A képek csak akkor lesznek megosztva, ha a megjelenített képen a **Kép megjelenítése a Zoom-on résztvevők számára** gombra kattint. Ez akkor hasznos, ha a képeket először a személyesen jelen lévőknek szeretné megmutatni.

#### Jelenetváltási viselkedés {#user-guide-scene-switching}

Állítsa be, hogy az M³ hogyan kezelje a jelenetváltásokat:

- **Váltás a média után** - Automatikus visszatérés az előző jelenetre
- **Előző jelenet megjegyzése** - A média előtt aktív jelenet visszaállítása

### Hangbeállítások hibrid összejövetelekhez {#audio-configuration}

Ha az M³-at az OBS Studióval együtt használja hibrid összejövetelekhez (személyes jelenlét + Zoom), be kell állítania a hangot, hogy az összejövetel résztvevői hallják a médiát:

#### A Zoom hangbeállításai {#zoom-audio-settings}

**Minden összejövetel előtt engedélyeznie kell az Original Audio funkciót a Zoomban:**

1. **Nyissa meg a Zoomot**, és lépjen a Beállítások (Settings) menübe
2. **Navigáljon az Audio** → **Advanced** menüpontra
3. **Kapcsolja be a „Show in-meeting option to 'Enable Original Sound'” beállítást**
4. **Jelölje be a „Disable echo cancellation” (Visszhang-csökkentés letiltása) opciót** (első jelölőnégyzet)
5. **Jelölje be a „Disable noise suppression” (Zajcsökkentés letiltása) opciót** (második jelölőnégyzet)
6. **Törölje a jelölést a „Disable high-fidelity music mode” (magas minőségű zenei mód letiltása) mezőből** (harmadik jelölőnégyzet)
7. **Minden összejövetel megkezdése előtt** kattintson a Zoom vezérlősávján az „Original Audio” gombra

**Másik lehetőség: Share Computer Sound (a számítógép hangjának megosztása)**
Ha az Original Audio nem működik jól az Ön rendszerében:

1. **A média lejátszása előtt** nyissa meg a Zoom képernyőmegosztási beállításainak **Advanced** lapját
2. **Jelölje be a „Share computer sound” (Számítógép hangjának megosztása) jelölőnégyzetet**
3. **Megjegyzés**: Ezt az opciót minden új Zoom-munkamenet indításakor engedélyezni kell

**A legjobb megoldás**: Fontolja meg, hogy az OBS Studio helyett az M³ Zoom-integrációját használja, mert az a Zoom saját képernyőmegosztását használja, amely gördülékenyebben kezeli a hangot, és nem igényel bonyolult hangbeállításokat.

#### Miért szükséges az audio konfiguráció {#why-audio-config}

Az M³ a számítógépen hanggal együtt játssza le a médiát, de ez a hang **nem kerül automatikusan továbbításra** a videofolyamon keresztül az OBS Studióba. Hasonló viselkedést tapasztalhat bármely más médialejátszóval is.

**A hangprobléma nem az M³ hibája** - ez abból adódik, ahogyan az OBS Studio videoközvetítése a Zoommal működik. A videofolyam úgy működik, mint egy hang nélküli virtuális kamera, akárcsak egy webkamera, ezért a Zoomot külön be kell állítani, hogy átvegye a számítógép hangját. Ehhez a számítógépben két hangkártyára van szükség; ha ez nincs meg, valószínűleg nem fogja tudni sikeresen használni az OBS Studio-integrációt.

**Alternatív megoldás**: Fontolja meg inkább a Zoom-integráció használatát, mivel az a Zoom saját képernyő- és hangmegosztását használja, amely gördülékenyebben kezeli a hangot.

#### Hangproblémák elhárítása {#audio-troubleshooting}

**Gyakori problémák:**

- **Nincs hang a Zoomban**: Ellenőrizze, hogy az Original Audio (Eredeti hang) funkció engedélyezve van, és megfelelően be van állítva
- **Rossz hangminőség**: Ellenőrizze, hogy a három Original Audio (Eredeti hang) jelölőnégyzet megfelelően van-e beállítva
- **A hang nem működik a Zoom újraindítása után**: Az Original Audio (Eredeti hang) funkciót minden új Zoom-munkamenetnél újra engedélyezni kell

**Bevált gyakorlatok:**

- Az összejövetelek előtt tesztelje a hangbeállításokat és a megosztást
- Készítsen ellenőrzőlistát a hang beállításához
- Tartalék megoldásként fontolja meg a „Share Computer Sound” (Számítógép hangjának megosztása) használatát
- **Fontolja meg a Zoom-integráció használatát az OBS Studio helyett** az egyszerűbb hangkezelés érdekében
- Győződjön meg arról, hogy minden technikus ismeri ezeket a beállításokat

## Média importálása és kezelése {#media-import}

### Egyéni média importálása {#importing-custom-media}

Adja hozzá saját médiafájljait az M³-hoz:

1. **Fájl importálása** - Az importálás gombbal videókat, képeket vagy hangfájlokat adhat hozzá
2. **Húzás és elhelyezés** - Húzza a fájlokat közvetlenül az M³-ba
3. **Megosztott mappa** - Média automatikus hozzáadása egy olyan mappából, amelyet a Dropbox, a OneDrive, az iCloud Drive vagy a Google Drive szinkronizál
4. **JWPUB-fájlok és lejátszási listák** - Kiadványok és lejátszási listák importálása
5. **Nyilvános előadások médiája (S-34 / S-34mp)** - A nyilvános előadások médiájának importálása S‑34 vagy S‑34mp JWPUB-fájlokból
6. **Videók a hivatalos weboldalról** - Keressen videókat, és adja hozzá őket a kiválasztott dátumhoz
7. **A Magyarázatos Biblia és a jelnyelvű Biblia médiája** - Képek, videók, térképek, történelmi utalások vagy jelnyelvű bibliai videók hozzáadása a kiválasztott bibliaszakaszokhoz

### Importált média kezelése {#managing-imported-media}

- **Rendezés dátum szerint** - Az importált médiafájlok hozzárendelése meghatározott dátumokhoz
- **Egyéni szakaszok** - Egyéni szakaszok létrehozása a szervezéshez
- **Tulajdonságok szerkesztése** – Címek, leírások és időzítés módosítása
- **Média eltávolítása** - A nem kívánt médiaelemek törlése

### Hangos Biblia importálása {#audio-bible-import}

Bibliaversek hangfelvételeinek importálása:

1. Kattintson a „Hangfelvétel a Bibliából” gombra
2. Válassza ki a bibliai könyvet és a fejezetet
3. Kiválasszon konkrét verseket vagy szakaszokat
4. Töltse le a hangfájlokat
5. Használja őket

### Profilbeállítások importálása és exportálása {#profile-settings-import-export}

Az egyes profilok beállításai a Beállítások menüből JSON-fájlba exportálhatók. Egy profilbeállítás-fájl importálása lecseréli az aktuális profil beállításait, ami hasznos, ha egy beállítást másik számítógépre visz át, vagy egy korábbi, jól működő konfigurációt szeretne visszaállítani.

## Megosztott mappa és exportálás {#user-guide-folder-monitoring}

### Megosztott mappa beállítása {#folder-monitoring-setup}

Adjon hozzá médiát egy olyan mappából, amelyet egy felhőtárhely-alkalmazás, például a Dropbox, a OneDrive, az iCloud Drive vagy a Google Drive szinkronizál:

1. **Bekapcsolás** - Válaszoljon „Igen”-nel, amikor a beállítási varázsló a felhőtárhely-alkalmazásokról kérdez, vagy lépjen a **Beállítások** > **Integrációk** > **Megosztott mappa** menüpontra, és kapcsolja be a **Média hozzáadása megosztott mappából** beállítást
2. **A mappa kiválasztása** - Válasszon egy mappát a felhőtárhely-alkalmazásában, lehetőleg egy új mappát, amelyet csak erre használ
3. **Dátummal ellátott mappák** - Az M³ minden közelgő összejövetelhez létrehoz benne egy mappát, amelynek neve az összejövetel dátuma év-hónap-nap formában (például `2026-03-25`)
4. **Fájlok hozzáadása** - Tegyen fényképeket, videókat, hangfájlokat vagy JW Library lejátszási listákat egy összejövetel mappájába, és ezek automatikusan bekerülnek az adott összejövetel médialistájába. Másik naphoz hozzon létre egy ugyanígy elnevezett mappát
5. **Korábbi mappák** - Ha egy hét véget ért, az M³ törli az adott hét mappáit és a bennük lévő fájlokat mindenki számára, aki a megosztott mappát használja. Ha meg szeretné tartani őket, kapcsolja ki a **Korábbi összejövetelek mappáinak törlése** beállítást

### Médiaexport {#user-guide-media-export}

A média automatikus exportálása rendezett mappákba:

1. **Automatikus exportálás engedélyezése** - Kapcsolja be a médiaexportálást a beállításokban
2. **Exportálási mappa kiválasztása** - Válassza ki, hová kerüljenek az exportált fájlok
3. **Automatikus rendezés** – A fájlok dátum és szakasz szerint vannak rendezve
4. **Formátumbeállítások** - Konvertálja a fájlokat MP4 formátumba a jobb kompatibilitás érdekében

## Weboldal Prezentációja {#website-presentation}

### A hivatalos weboldal bemutatása {#presenting-the-website}

Ossza meg a hivatalos weboldalt külső kijelzőkön:

1. **Weboldal mód** - Kattintson a weboldal megjelenítése gombra
2. **Külső kijelző** - A weboldal új ablakban nyílik meg
3. **Navigáció** - A böngésző vezérlőivel navigálhat

### A weboldal vezérlői {#website-controls}

- **Weboldal megnyitása** - Külön weboldalablak megnyitása
- **Tükrözés indítása** - A weboldal ablakának megjelenítése a médiaablakban a hallgatóság számára
- **Tükrözés leállítása** - A weboldal megjelenítésének leállítása és visszatérés az éviszöveghez vagy a médiaablak hátteréhez
- **Navigáció** - Szabványos böngésző navigációs vezérlők
- **Frissítés** - Az aktuális oldal újratöltése
- **Bezárás** - Kilépés a weboldal prezentációs módjából
- **Automatikus visszatérés** - Igény szerint automatikus visszatérés a médialistához a weboldal tükrözésének leállítása után

## Összejövetel-felvételek {#meeting-recordings}

Az M³ segíthet az összejövetelek felvételének vezérlésében, de nincs beépített felvevője.

- **OBS-felvétel** - Ha az OBS felvételvezérlői engedélyezve vannak, az OBS felugró ablakával indíthatja el és állíthatja le az OBS-felvételt
- **Külső felvevőalkalmazás** - Állítson be billentyűparancsokat egy külön felvevőalkalmazáshoz, majd az Összejövetel-felvételek felugró ablakkal küldje el ezeket a billentyűparancsokat
- **Felvételek mappája** - Ha beállítja a felvételek mappáját, megjelenik egy gomb, amellyel gyorsan megnyithatja azt a mappát, ahová a felvételek mentődnek

## Haladó funkciók {#user-guide-advanced-features}

### Több gyülekezet {#user-guide-multiple-congregations}

Kezeljen több gyülekezetet vagy csoportot:

1. **Profilok létrehozása** - Külön profilok beállítása a különböző gyülekezetek számára
2. **Profilok váltása** - A gyülekezetválasztóval válthat a profilok között
3. **Külön beállítások** – Minden profilnak saját beállításai és médiatartalmai vannak
4. **Megosztott erőforrások** – A médiafájlok lehetőség szerint megosztásra kerülnek a profilok között

### Billentyűparancsok {#keyboard-shortcuts-guide}

Konfiguráljon egyéni billentyűparancsokat a hatékony működés érdekében:

1. **Billentyűparancsok engedélyezése** - Kapcsolja be a billentyűparancsokat a beállításokban
2. **Billentyűparancsok beállítása** - Billentyűparancsok beállítása a gyakori műveletekhez
3. **Gyakorlás** - Tanulja meg a billentyűparancsokat a gyorsabb munkához
4. **Testreszabás** - A billentyűparancsokat az Ön igényeihez igazíthatja

## Hibaelhárítás {#troubleshooting-guide}

### Gyakori problémák {#common-issues}

#### A média nem töltődik le {#user-guide-media-not-downloading}

- Ellenőrizze az összejövetelek ütemezésének beállításait
- Ellenőrizze az internetkapcsolatot
- Ellenőrizze, hogy a média elérhető-e a kiválasztott nyelven

#### Az OBS integráció nem működik {#user-guide-obs-not-working}

- Ellenőrizze, hogy az OBS WebSocket bővítmény telepítve van-e
- Ellenőrizze a port és a jelszó beállításait
- Győződjön meg arról, hogy az OBS fut

#### Hangproblémák a Zoom/OBS alkalmazásban {#audio-issues}

- **Nincs hang a Zoomban**: Kapcsolja be az Original Audio funkciót a Zoom beállításaiban, és minden összejövetel előtt is
- **Rossz hangminőség**: Jelölje be a három Original Audio jelölőnégyzetet (az első kettő engedélyezve, a harmadik letiltva)
- **A hang nem működik újraindítás után**: Az Original Audio funkciót minden új Zoom-munkamenetnél újra be kell kapcsolni
- **Alternatív megoldás**: Használja a Zoom képernyőmegosztásában a „Share Computer Sound” (Számítógép hangjának megosztása) opciót

#### Teljesítményproblémák {#user-guide-performance-issues}

- Helyezze gyorsítótárba az énekeskönyv videófájljait
- Csökkentse a maximális felbontást
- Törölje a régi gyorsítótár-fájlokat
- Ellenőrizze a rendelkezésre álló lemezterületet
- Ha az alkalmazásban grafikai hibák jelentkeznek, vagy összeomlik, próbálja meg kikapcsolni a hardveres gyorsítást, és indítsa újra az M³-at

#### Nyelvi problémák {#user-guide-language-issues}

- Ellenőrizze a média nyelvének beállítását
- Győződjön meg arról, hogy a nyelv elérhető a JW.org oldalon
- Próbáljon ki egy tartalék nyelvet
- Ellenőrizze a kezelőfelület nyelvi beállítását

### Segítségkérés {#getting-help}

Ha problémákba ütközik:

1. **Ellenőrizze a dokumentációt** - Olvassa el ezt az útmutatót és az egyéb rendelkezésre álló dokumentációt
2. **Keressen problémákat** - Keressen hasonló problémákat a GitHubon
3. **Problémák jelentése** - Hozzon létre egy új problémát (New Issue) részletes leírással

## Bevált Gyakorlatok {#best-practices}

### Összejövetelek Előtt {#before-meetings}

1. **Letöltések ellenőrzése** - Győződjön meg arról, hogy minden média letöltésre került
2. **Berendezések tesztelése** - Ellenőrizze a kijelzők és a hang működését
3. **Média előkészítése** - Ellenőrizze és rendszerezze az összejövetelhez szükséges médiát; győződjön meg arról, hogy egyetlen médiafájl sem hiányzik
4. **A hang beállítása** - Hibrid összejövetelek esetén kapcsolja be az Original Audio funkciót a Zoomban, vagy állítsa be a „Share Computer Sound” (Számítógép hangjának megosztása) funkciót

### Összejövetelek alatt {#during-meetings}

1. **Koncentráljon a feladatra** - Használja a letisztult, zavaró tényezőktől mentes felületet
2. **Használjon billentyűparancsokat** - Sajátítsa el a billentyűparancsokat a gördülékeny munkához
3. **A hang figyelése** - Figyeljen a hangerőre, ha ez az Ön feladatkörébe tartozik
4. **Álljon készen** - Készítse elő a következő médiaelemet
5. **A hang ellenőrzése** - Hibrid összejövetelek esetén győződjön meg arról, hogy a Zoom-résztvevők hallják a médiát

### Összejövetelek után {#after-meetings}

1. **Háttérzene indítása** - Indítsa el a háttérzene lejátszását
2. **Tervezzen előre** - Készüljön fel a következő összejövetelre úgy, hogy minden készen álljon
3. **Takarítás** - Zárja be a médialejátszót, amikor végzett

### Rendszeres karbantartás {#regular-maintenance}

1. **M³ frissítése** - Tartsa naprakészen az alkalmazást
2. **Gyorsítótár törlése** - Rendszeresen törölje a régi gyorsítótár-fájlokat
3. **Beállítások ellenőrzése** - A beállítások áttekintése és szükség szerinti frissítése
