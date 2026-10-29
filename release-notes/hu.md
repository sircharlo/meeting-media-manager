<!-- markdownlint-disable no-duplicate-heading -->

# Újdonságok

A verziók közötti változások teljes listáját megtalálja a GitHubon található CHANGELOG.md fájlban.

## v26.10.2

### ✨ Új funkciók

- ✨ **Funkciójavaslatok**: Az M³ időnként egy rövid „Tudta?” ablakban javasol egy olyan funkciót, amelyet a profil még nem használ, és elmagyarázza, mire való. Egy profil minden megnyitásakor legfeljebb egy javaslatot mutat, az összejövetel előtti 15 perctől az összejövetel végéig pedig egyet sem, és minden választ megjegyez: az „Emlékeztess később” a sor végére teszi a javaslatot, a „Köszönöm, nem” végleg elrejti, a „Ne javasoljon több funkciót” pedig az adott profilnál mindet kikapcsolja. A beállítási varázslóban adott „Nem” válasz is számít, a válaszok pedig a Beállítások Haladó részében visszaállíthatók.
- ✨ **Zoom-értekezletkezelő (béta, Windows)**: Az M³ most már elrendezheti a saját ablakát és a Zoom értekezletablakát a képernyőin. A Zoom beállítási segédjének két új lépése megkérdezi, hová kerüljön a Zoom-értekezlet. A képernyők térképén kiválasztja a Zoom képernyőjét (soha nem azt, amelyet a médiaablak tölt ki), és azt, hogy a Zoom egymagában van-e rajta, vagy osztozik rajta az M³-mal. Ezután a képernyő valódi alakú rajzán egy elválasztó húzásával felosztja azt a két ablak között; az elválasztó a szokásos arányokhoz igazodik. Amint az értekezlet megnyílik, az M³ megnyitja a Zoom résztvevőlistáját, ha ezt kérte, majd mindkét ablakot a helyére teszi, és attól kezdve ott tartja a Zoomot: amikor a Zoom magától elmozdítja vagy átméretezi az ablakát (képernyőmegosztás után, vagy amikor a résztvevőlistája megnyílik vagy bezárul), az M³ visszahelyezi, míg egy ablak, amelyet Ön mozgat el, a következő összejövetelig ott marad, ahová tette. Valahányszor az M³ magától mozgatja el a Zoomot, egy értesítés jelzi ezt, és lehetővé teszi, hogy azonnal leállítsa, az M³ újraindításáig vagy végleg. Amíg a Zoom megosztja a médiaablakot, ami elrejti a Zoom értekezletablakát, az M³ a helyén megnyitja a Zoom résztvevőlistáját, így továbbra is látja, ki emeli fel a kezét, hogy hozzászóljon. Ha a Zoomban a „Meeting window view” beállítás értéke „Dual window” (a Zoom régebbi verzióiban „Use dual monitors”), a Zoom második ablaka teljes képernyőn jelenik meg a médiaablak mögött, így a médiaablak elrejtésekor láthatóvá válik. Az M³ a Windows saját illesztésével egymás mellé is illesztheti a két ablakot, így a köztük lévő határ húzása mindkettőt átméretezi. A Zoom felugró ablakában lévő „Ablakok elrendezése” gomb bármikor mindent visszahelyez, az elrendezés pedig később a Beállításokban, a Zoom-értekezletkezelő alatt módosítható. Számítógépenként tárolódik, mivel a számítógép képernyőitől függ.

## v26.10.1

### ✨ Új funkciók

- ✨ **Zoom-értekezletkezelő (béta, Windows)**: Új integráció, amely minden összejövetelnél Ön helyett kezeli a Zoomot. El tudja indítani a gyülekezet Zoom-értekezletét, amikor az összejövetel előtt elindul a háttérzene. Amikor a zene közvetlenül az összejövetel kezdete előtt leáll, csatlakozik a számítógép hangjához, feloldja a mikrofon némítását, bekapcsolja a házigazda videóját, és mindenkit némít úgy, hogy ne oldhassák fel a némítást. Amikor az összejövetel előtt vagy után szól a zene, az ellenkezőjét teszi: kilép a számítógép hangjából, kikapcsolja a házigazda videóját, és ismét engedi, hogy mindenki feloldja a némítását (erre fel is kéri őket). Média megjelenítése közben automatikusan meg is tudja osztani a médiaablakot a Zoomban, és gondoskodik arról, hogy mindig a médiaablak legyen megosztva, soha semmi más a képernyőről. A műveleti panel új Zoom-gombja jelzi, hogy található-e Zoom-értekezletablak, és lehetővé teszi, hogy ezeket a lépéseket kézzel is elvégezze. A beállítási segéd, amelyet a beállítás bekapcsolásakor felajánl (a kezdeti beállítási varázsló Windowson mostantól ezt kínálja a billentyűparancsos képernyőmegosztás helyett), és amely bármikor elérhető a Zoom-gombról vagy a Beállításokból, ellenőrzi a Zoomot, megtanulja a mikrofon- és kameragombok nevét az Ön nyelvén, és minden lépést kipróbál Önnel együtt. Az M³ indításkor azt is ellenőrzi, hogy minden működik-e, amit a Zoomban automatizál; összejöveteli napokon a kezdés előtti egy és negyed órában szükség esetén meg is nyitja az értekezletet (ha mások már bent vannak, csak körülnéz, semmit sem nyom meg); ha valami nem működik, jelzi Önnek, és szünetelteti a Zoom-automatizálásokat, amíg újra nem indítják, vagy egy újabb ellenőrzés sikeres nem lesz, így az összejövetel alatt semmi sem romlik el. Ez az ellenőrzés alapértelmezés szerint be van kapcsolva, és a Beállításokban kikapcsolható. Ahogy az egyes lépések sikerrel járnak, az összejöveteli gyorsműveletek összejövetel előtti és utáni ellenőrzőlistáiban a megfelelő emlékeztetők automatikusan kipipálódnak, a Zoomban automatikusan elvégzettként megjelölve. Mivel nem használható együtt a billentyűparancsos képernyőmegosztással, a Beállítások a kettő közül annál, amelyik nem érhető el, jelzi ezt, és megnevezi, melyiket kell kikapcsolni. Bármilyen nyelvű Zoommal működik, és a Zoomon kívül semmit sem kell hozzá telepíteni.

- ✨ **Összejöveteli időzítő**: Mostantól összejöveteli napokon is hozzáadhatók egyéni programrészek, például a vezetőtestület beszámolóihoz, különleges programokhoz vagy bármihez, ami nem szerepel a szokásos programban. Mindegyik időmérése ugyanúgy történik, mint bármely más programrészé, a neve és a hossza pedig az időzítő felugró ablakában vagy a programrészek listájában módosítható.

- ✨ **Összejöveteli időzítő**: Gyorsabb hozzáférés az időzítőhöz. Ha a műveleti panel időzítőgombja fölé viszi az egeret, mostantól megjelenik az éppen mért programrész az Indítás, Szünet, Leállítás és Következő programrész gombokkal, a felugró ablak megnyitása nélkül (beállítás, alapértelmezés szerint bekapcsolva). Egy új beállítással a programrészek teljes listája és az időzítő vezérlői a főablak jobb oldalán rögzített panelen is megjeleníthetők, mindig szem előtt.

- ✨ **Összejöveteli időzítő**: Az új „Analóg óra időívvel” visszaszámláló-megjelenítés a programrészből hátralévő időt körcikkként mutatja egy analóg óra számlapján, a percmutatótól a tervezett befejezésig, így egyetlen pillantással látható a pontos idő és a hátralévő idő is. Az időtúllépés piros körcikként jelenik meg. Az összejövetel előtti visszaszámlálásnál és felfelé számláló módban is működik.

- ✨ **Összejöveteli időzítő**: Az összejövetel előtti visszaszámlálás felirata mostantól „Az összejövetel kezdetéig:”, az időzítő kijelzője pedig mutatja az éppen mért programrész nevét, így a „4:59” már nem téveszthető össze a pontos idővel.

- ✨ **Összejöveteli időzítő**: Egy nap rögzített időmérései megerősítés után egy lépésben törölhetők az időzítő felugró ablakából vagy a rögzített panelről.

- ✨ **Zoom-értekezletkezelő (béta, Windows)**: Új kézfelemelés-segéd. Az összejövetel alatt az M³ figyeli a Zoom résztvevőlistáján a felemelt kezeket. Amikor valaki felemeli a kezét, az M³ értesítésében a kezelő egy kattintással feloldhatja a résztvevő némítását, majd amikor befejezte a hozzászólást, egy újabb kattintással ismét némíthatja, és leengedheti a kezét; a műveleti panel Zoom-gombja ugyanezekkel a gombokkal sorolja fel a felemelt kezeket. Minden művelet az adott résztvevő saját sorára vonatkozik a Zoomban, a pontos neve alapján, és ha két résztvevőnek ugyanaz a neve, az M³ senkihez sem nyúl. Ha az összejöveteli időzítő engedélyezve van, az elnök számára az időzítő kijelzőjén is megjelenik egy nagy kéz a résztvevő nevével, amely az időzítő vagy a Zoom felugró ablakából kézzel is bekapcsolható. Egyetlen gombnyomással az M³ megtanulja, hogyan jelöli a Zoom az Ön nyelvén a felemelt kezeket (felemeli és leengedi az Ön kezét); ezt a beállítási segéd is felkínálja.

- ✨ **Összejöveteli időzítő**: Új, választható távoli időzítő. Ha be van kapcsolva, az M³ a helyi hálózaton weboldalként teszi elérhetővé az időzítő kijelzőjének csak olvasható másolatát, így a pulpitusnál lévő táblagép vagy telefon megmutathatja az előadónak a hátralévő időt anélkül, hogy az megjelenne a gyülekezet kijelzőjén vagy a Zoom-megosztásban. Az oldal valós időben követi az időzítőt (programrészek, összejövetel előtti visszaszámlálás, óra, időtúllépési színek, kézfelemelés-jelzés), a vezérlők pedig mind az M³-ban maradnak. A megnyitandó címek az időzítő felugró ablakában láthatók, egy másolás gombbal együtt.

- ✨ **Beállítási varázsló**: A beállítási varázsló mostantól megkérdezi, hogy az összejövetelekhez szükséges fájlokat egy felhőtárhely-alkalmazásban, például a Dropboxban, a OneDrive-ban, az iCloud Drive-ban vagy a Google Drive-ban tárolja-e. Ha igen, segít kiválasztani ott egy megosztott mappát, és megmutatja, hogyan működik: az M³ minden közelgő összejövetelhez létrehoz egy, az összejövetel dátumával elnevezett mappát, és a beletett fájlok automatikusan hozzáadódnak az adott összejövetelhez minden olyan számítógépen, amely ezt a mappát használja.

## v26.9.0

### ✨ Új funkciók

- ✨ **Összejövetel előtti/utáni gyorsműveletek**: Egy új, nagy gombokat tartalmazó panel segít minden összejövetel előtt és közvetlenül utána — élő visszaszámlálás, a háttérzene egy érintéssel történő indítása/leállítása, a felvétel indítása/leállítása, valamint gyülekezetenkénti, kategóriákba csoportosított ellenőrzőlista, amely a Beállításokban szerkeszthető. Az összejövetel előtti panel automatikusan bezárul, amint az összejövetel elkezdődik és az ellenőrzőlista elkészült (vagy egy rövid türelmi idő után), és kézzel is bármikor bezárható.

## v26.8.0

### ✨ Új funkciók

- ✨ **Az egész alkalmazás újratervezése**: Átfogó vizuális és kezelési megújulás a párbeszédablakokban, a médialistában és a fejlécben, a Beállításokban és a beállítási varázslóban. A beállítási varázsló mostantól képernyőnként egy kérdést tesz fel, és folyamatjelző sávot mutat. Minden felszólító ablakot egységes, az alkalmazás arculatához illő párbeszédablak váltott fel, a PDF-oldaltartomány kiválasztása (kiadványok és húzással történő importálás esetén) pedig mostantól szabad szöveges mező helyett bélyegképrácsos választóval történik. A beállítási varázsló befejezése után mostantól egy új, gyors kezdést segítő bemutató indul. Emellett megújult a kártyák és a fejlécek stílusa, sötét módhoz igazodó árnyékokkal, és több sötét módú kontrasztprobléma is javításra került (a kijelölt mezők címkéi, a letöltési folyamat százalékos értékei).
- ✨ **Beállítások oldal**: Kétpaneles elrendezésűvé alakítottuk, egy új Globális beállítások szakasszal, ahová az automatikus frissítés és a béta frissítések kapcsolói átkerültek Az alkalmazás névjegye párbeszédablakból (amely mostantól csak tájékoztató jellegű).
- ✨ **„További média hozzáadása” gomb**: Új beállítással pontosan kiválasztható, mely összejöveteli szakaszokban jelenjen meg a „További média hozzáadása” gomb, egy kompakt (csak ikonos) mód beállításával együtt.
- ✨ **Médialista**: Hozzáadás közben az elemek helyén mostantól betöltési helyőrzők jelennek meg üres hely helyett, a médiacsoportok jelvénye mutatja a rejtett elemek számát (pl. „9 elem (2 rejtett)”), a csoporton belüli elemek húzással átrendezhetők, nagyon keskeny ablakszélességnél pedig az elemek tömör, elemleírással ellátott címkékké zsugorodnak ahelyett, hogy zsúfolttá tennék a sort.

## v26.7.7

### ✨ Új funkciók

- ✨ **A média-előnézet minősége**: A média-előnézet mostantól canvas segítségével, kiváló minőségű kicsinyítéssel jeleníti meg a videókockákat, így megszűnnek a recés vagy elmosódott előnézetek (különösen a sok szöveget tartalmazó tartalmaknál, például az énekeknél). Az előnézet automatikusan ki is kapcsol, ha egyetlen videónál ismételten korrigálnia kell a lejátszás elcsúszását, és egy kattintással vissza lehet kapcsolni.

## v26.7.6

### ✨ Új funkciók

- ✨ **A gyülekezeti bibliatanulmányozás videóinak kizárása**: Új beállítással kizárhatók bizonyos kiadványok videói a gyülekezeti bibliatanulmányozásból (alapértelmezés szerint a **Walk Courageously With God** című könyvé), kereshető kiadványválasztóval.
- ✨ **Dokumentumok oldalszáma**: A Kiadványok médiaanyagai és a JWPUB-importálás listái mostantól minden dokumentum címe után feltüntetik az oldalszámot (vagy több oldal esetén az oldalszámokat). Ez segít gyorsan megtalálni egy adott médiát, ha tudja, melyik oldalon szerepel.

## v26.7.4

### ✨ Új funkciók

- ✨ **Hiányzó média helyreállítása**: Azoknál a médiaelemeknél, amelyek helyi fájlja eltűnt (pl. a gyorsítótár automatikus törlése miatt, vagy mert kézzel törölték), mostantól letiltott lejátszás gomb, a keresendő fájlt megnevező „hiányzik” felirat és egy új „Fájl megkeresése” művelet jelenik meg, amellyel az elem újra összekapcsolható egy lemezen lévő fájllal.
- ✨ **Kompatibilitási figyelmeztetés**: Egy új, bezárható sáv figyelmezteti a hamarosan már nem támogatott operációs rendszert vagy architektúrát (macOS 12 Monterey, 32 bites Windows) használókat, hogy frissítsenek, mielőtt a jövőbeli alkalmazásfrissítések újabb rendszert igényelnének.

## v26.7.0

### ✨ Új funkciók

- ✨ **Összekapcsolt hanglejátszás**: Mostantól lejátszható az egyik fájl hangja egy másik fájl videójával együtt. Ez hasznos lehet zenei kísérettel ellátott videós diavetítések lejátszásakor.
- ✨ **A figyelt média elrendezése**: A figyelt mappákból származó médiaelemek és a szakaszok sorrendje mostantól megmarad. Így a médialista akkor is ugyanúgy jelenik meg, ha a figyelt mappát több eszköz között szinkronizálják.

## v26.6.1

### ✨ Új funkciók

- ✨ **Média-előnézet**: Új, élő média-előnézet, amely a beállításokban vagy a megjelenítési felugró ablakban be- és kikapcsolható.
- ✨ **Médiakeresés**: Új gyorskereső mező a médialistában, amellyel cím alapján gyorsan megtalálhatja a médiát. Használatához egyszerűen nyomja meg a keresés szokásos billentyűparancsát (Ctrl+F vagy Cmd+F).
- ✨ **Beállítások szűrése**: Új szűrőmező a beállítások oldalon, amellyel kulcsszó vagy kategória alapján kereshet a beállítások között. Használatához kattintson a beállítások oldal jobb felső sarkában lévő Keresés gombra, vagy nyomja meg a keresés szokásos billentyűparancsát (Ctrl+F vagy Cmd+F).
- ✨ **Figyelmeztetés szóló háttérzene esetén**: Figyelmeztető értesítés jelenik meg, ha háttérzene szólása közben indít el médiát. A háttérzene közvetlenül az értesítésből leállítható.

## v26.6.0

### ✨ Új funkciók

- ✨ **Időzítő**: Új analóg megjelenítési módok és az időmérési jelentés állapota.
- ✨ **Profilok**: A Haladó beállítások között és a beállítási varázslóban mostantól importálhatók és exportálhatók a profilbeállítások.
- ✨ **Médiaablak**: A médiaablak a lejátszás után automatikusan elrejthető, ha eredetileg rejtve volt. Ez például akkor praktikus, ha egy távolról bekapcsolódó előadó képeket szeretne megjeleníteni.

## v26.5.0

### ✨ Új funkciók

- ✨ **PDF-importálás**: Új PDF-importálási folyamat a Kiadványok médiaanyagai párbeszédablakban, amellyel egy kiadvány PDF-változata igény szerint automatikusan, különálló képekként importálható.

## v26.4.8

### ✨ Új funkciók

- ✨ **JW Stream**: A JW Stream felkerült a tükrözhető weboldalak listájára.

## v26.4.0

### ✨ Új funkciók

- ✨ **Összejöveteli időzítő**: Bekerült egy új funkció, az összejöveteli időzítő. Ez opcionális funkció, amelyet szükség esetén a haladó beállítások között lehet engedélyezni. Az időzítő segítségével a médiakezelő nyomon követheti az összejövetel programrészeire fordított időt, vagy az aktuális programrészre fordított időt egy olyan külön kijelzőn jelenítheti meg, amelyet csak az előadó lát.

## v26.3.0

### ✨ Új funkciók

- ✨ **Emlékünnepi média**: Az emlékünnepi média automatikus letöltése kikerült a béta szakaszból! Az alkalmazás automatikusan letölti az emlékünnepi üdvözlővideót és az emlékünnep alatt megjelenítendő képet, ha a beállított nyelven elérhetők.
- ✨ **Lejátszási sebesség**: Hozzáadtuk a lejátszási sebesség szabályozását vizuális jelzővel és kézi visszaállítási funkcióval. Ez a funkció csak akkor látható, ha a haladó beállításokban engedélyezve van.
- ✨ **Pinyin énekek**: Új kapcsolóval a kínai nyelvű összejöveteleken az énekek pinyin változatukra cserélhetők.

## v26.2.0

### ✨ Új funkciók

- ✨ **Lemezterület ellenőrzése**: Hozzáadtuk a funkciót, amely figyelemmel kíséri és értesít, ha a lemezterület szűkössé válik.

## v26.1.5

### ✨ Új funkciók

- ✨ **Emlékünnepi média**: Az emlékünnep dátumának kiválasztásakor automatikusan letölti az emlékünnepi borítóképet és üdvözlővideót a támogatott nyelveken.

## v26.1.0

### ✨ Új funkciók

- ✨ **Az összejövetelek időpontjainak automatikus szinkronizálása**: Az összejövetelek dátuma és időpontja mostantól automatikusan szinkronizálható a hivatalos weboldallal. Ez a funkció alapértelmezés szerint be van kapcsolva, és a haladó beállításokban kézzel is elindítható vagy kikapcsolható.
- ✨ **Jövőbeli időpontváltozások**: Ha a gyülekezetet a weboldalon alapuló kereséssel hozza létre, az alkalmazás mostantól a jövőbeli időpontváltozásokat is átveszi, ha vannak ilyenek.
- ✨ **Megosztott gyorsítótár az egész gépre kiterjedő telepítésekhez**: Az egész gépre kiterjedő telepítések mostantól alapértelmezés szerint egy közös mappát használnak, így optimalizálva a tárhely és a sávszélesség használatát ugyanazon a számítógépen több felhasználó számára.

## v25.12.2

### ✨ Új funkciók

- ✨ **Nagyítás/mozgatás gombok**: A nagyítás és a mozgatás gombjai mostantól lenyomva tarthatók a folyamatos állításhoz.

## v25.12.0

### ✨ Új funkciók

- ✨ **Helyi menü több kijelölt elemhez**: A jobb gombos menü műveletei mostantól több kijelölt médiaelem esetén is használhatók.
- ✨ **Billentyűparancsok**: Új billentyűparancsok: `Ctrl/Cmd+A` az összes média kijelöléséhez, `H` a kijelölt média elrejtéséhez és `Shift+Up/Down` a kijelölés billentyűzetes mozgatásához.
- ✨ **Őrtorony-tanulmányozási videók beállítása**: Új beállítással kizárhatók az Őrtorony-tanulmányozás további videói.
- ✨ **Összecsukható szakaszok**: Hozzáadtuk a lehetőséget, hogy összecsukhassuk a szakaszokat a nem összejöveteli napokon, így a nézet áttekinthetőbb lesz.
- ✨ **JW Events weboldal**: A fő hivatalos weboldal mellett mostantól a JW Events weboldal is megjeleníthető.
- ✨ **Lejátszási lista importálásának testreszabása**: Lehetővé vált a JW lejátszási listák importálásakor a médiaelemekhez hozzáadott előtag testreszabása.
- ✨ **Navigálás a weboldal tükrözése után**: Új kapcsolóval a weboldal tükrözésének leállítása után automatikusan a médialistára vált az alkalmazás.
- ✨ **OBS-felvételvezérlők**: Mostantól vezérelhetők az OBS-felvételek.
- ✨ **Éviszöveg-előnézet**: Minden év decemberétől előnézetben megtekinthető a következő év éviszövege.
- ✨ **Frissítési értesítések**: Hozzáadtunk figyelmeztető értesítéseket, ha béta verziót futtat, vagy ha a frissítések le vannak tiltva, és javítottuk a frissítések letöltési folyamatának megjelenítését.
- ✨ **A hardveres gyorsítás beállításai**: Új lehetőség, amellyel szükség esetén véglegesen kikapcsolhatja a hardveres gyorsítást.

## v25.11.0

### ✨ Új funkciók

- ✨ **Média kiválasztása JWPUB-fájlokból**: Mostantól egyenként is kiválaszthatók a médiaelemek a JWPUB-fájlokból.
- ✨ **Automatikus fókuszálás a médiaablakra**: Hozzáadtunk egy opcionális beállítást, amellyel a Zoom képernyőmegosztás után automatikusan a médiaablakra állítja a fókuszt.
- ✨ **Kurzorkiemelés TV-kijelzőkhöz**: Továbbfejlesztettük a weboldalablak kurzorkiemelését, hogy az egérmutató jobban látható legyen a TV-kijelzőkön.
- ✨ **Összejövetel-felvétel**: Új funkció az összejövetelek felvételéhez, amellyel egy külső felvevőalkalmazás vezérelhető.
- ✨ **Webhelykeresés**: Hozzáadtunk egy intelligens keresőfunkciót, amellyel a webhelyen található médiatartalmakat és kiadványokat lehet keresni.
- ✨ **Egyszerű kézi kiadványimportálás**: Mostantól egyszerűen importálhatók kiadványok a hivatalos weboldalról, például folyóiratok, könyvek, programok és meghívók.
- ✨ **Jelnyelvi fejlesztések**: Jelnyelvek esetén a teljes fájlok lejátszása előtt megerősítést kér az alkalmazás, és egyszerre több klip is kiválasztható, például ha több bekezdést kell egymás után felolvasni.
- ✨ **Navigálás a klipek között**: A kliplista elemeinél mostantól látható az időtartam, és javult a klipek közötti navigálás.
- 🛠️ **Médiamegjelenítés**: A lejátszás indításakor a médiaablak mostantól akkor is megjelenik, ha korábban el volt rejtve.

## v25.10.1

### ✨ Új funkciók

- ✨ **Beállítási varázsló – Zoom-lépés**: A beállítási varázslóba bekerült egy Zoom-integrációs lépés az egyszerűbb kezdeti beállítás érdekében.
- ✨ **A képernyőválasztó fejlesztései**: A megjelenítő felugró ablakban pontos vizuális ábrázolást jelenít meg az összes képernyőről, valamint a főablak aktuális méretéről és elhelyezkedéséről. Így könnyebb kiválasztani azt a képernyőt, amelyen a médiaablakot meg kell jeleníteni.
- ✨ **Előnyben részesített képernyő a médiaablakhoz**: Ha a felhasználó megadja, az alkalmazás mostantól megjegyzi, melyik képernyőn jelenjen meg a médiaablak.

## v25.10.0

### ✨ Új funkciók

- ✨ **Lejátszás szüneteltetett állapotban történő indítása**: Új beállítást vezettünk be, amely lehetővé teszi a lejátszás szüneteltetett állapotban történő indítását. Ez hasznos lehet az AV-operátoroknak, hogy elvégezhessék a szükséges beállításokat (például elindítsák a Zoom-megosztást) még mielőtt a média elindulna a médiaablakban.
- ✨ **Frissítési értesítések**: A felhasználók ezentúl az alkalmazáson belüli sávon keresztül kapnak értesítést a frissítésekről, amelyen keresztül a felhasználó azonnal telepítheti a frissítéseket, anélkül, hogy meg kellene várnia az alkalmazás következő újraindítását.
- ✨ **Egyéni események**: Választható eseménykezelők, amelyek bizonyos események észlelésekor billentyűparancsokat indíthatnak el. Ez hasznos lehet az AV-operátorok számára, hogy az alkalmazáson kívül is automatikusan végrehajthassanak műveleteket. Például a projektorral felszerelt termekben az intelligens világítás be- és kikapcsolható a média lejátszása előtt és után, vagy az összejövetel utolsó éneke után elindítható egy szkript, amely különféle műveleteket automatizál egy Zoom-értekezleten.

## v25.9.1

### ✨ Új funkciók

- ✨ **A médiaablak „Mindig előtérben” és teljes képernyős viselkedése**: Javítottuk és továbbfejlesztettük a médiaablak „Mindig előtérben” viselkedését, amely most már a teljes képernyős állapotnak megfelelően dinamikusan alkalmazkodik.
- ✨ **A dátum megjelenítési formátumának beállítása**: Hozzáadtunk egy felhasználói beállítást a dátum megjelenítési formátumának konfigurálásához.
- ✨ **Áttűnés a média között**: A médiamegjelenítés mostantól áttűnéssel vált, a korábbi, hirtelenebb, feketébe halványuló átmenet helyett.
- ✨ **Zene automatikus leállítása**: Optimalizáltuk a háttérzene automatikus leállításának működését, így az mostantól függetlenül attól, hogy a zene automatikusan elindult-e vagy sem, ugyanúgy viselkedik
- ✨ **Egérkattintás-átvitel inaktív ablakokban macOS esetén**: Engedélyeztük az egérkattintás-átvitelt a főablakban macOS rendszeren, ami megkönnyíti az alkalmazás vezérlését akkor is, ha az éppen nincs fókuszban.

## v25.9.0

### ✨ Új funkciók

- ✨ **A letöltési felugró ablak fejlesztései**: Hozzáadtunk egy frissítés gombot, valamint a letöltési felugró ablakban bevezettük a letöltések dátum szerinti csoportosítását.
- ✨ **A figyelt média sorrendjének megjegyzése**: A figyelt mappából származó médiaelemeknél mostantól megmarad a szakaszok sorrendje.

## v25.8.3

### ✨ Új funkciók

- ✨ **Halványítási átmenetek a médiaablaknál**: Új haladó beállítással a médiaablak fokozatosan jelenhet meg és tűnhet el, így simábbak a vizuális átmenetek.
- ✨ **Képek megjelenítési ideje és haladásjelzés**: Ismételt szakaszoknál mostantól beállítható a képek megjelenítési ideje, és követhető a lejátszás előrehaladása.

## v25.8.1

### ✨ Új funkciók

- ✨ **Egyéni médiaszakaszok**: Teljes körű rendszer egyéni médiaszakaszok létrehozásához, szerkesztéséhez és kezeléséhez, színek testreszabásával és húzással történő átrendezéssel.
- ✨ **Médiaelválasztók**: Címmel ellátott elválasztók adhatók a médialistákhoz az áttekinthetőbb rendezés érdekében, felső vagy alsó elhelyezési lehetőséggel.
- ✨ **Szakaszismétlés**: Folyamatos lejátszás engedélyezése egyes szakaszokon belül a média megszakítás nélküli ismétléséhez.
- ✨ **Zoom-integráció**: A képernyőmegosztás automatikus indítása és leállítása a médialejátszással összehangolva.

## v25.7.0

### ✨ Új funkciók

- Ebben a kiadásban nincsenek új funkciók!

## 25.6.0

### ✨ Új funkciók

- ✨ **Korlátozott adatkapcsolat**: Új beállítás a letöltési sávszélesség-használat csökkentésére korlátozott adatkapcsolat esetén.
- ✨ **A streamelt média jobb kezelése**: Jobb támogatás a streamelt médiához, kevesebb késleltetésből adódó problémával.

## 25.5.0

### ✨ Új funkciók

- 🖼️ **OBS-késleltetés képekhez**: Új OBS Studio-beállítás a jelenetváltások késleltetésére képek megjelenítésekor, a simább átmenetek érdekében.
- 🔊 **A `.m4a` hangformátum támogatása**: A támogatott médiatípusok bővítéseként mostantól `.m4a` hangfájlok is használhatók.

## 25.4.0

### ✨ Új funkciók

- 🇵🇭 **Új nyelv: tagalog**: Bekerült a tagalog nyelv támogatása, ami tovább bővíti az alkalmazás többnyelvűségét.
- 🎞 **A `.m4v` videoformátum támogatása**: A jobb médiakompatibilitás érdekében mostantól `.m4v` fájlok is lejátszhatók.

## 25.3.1

### ✨ Új funkciók

- 🌏 **Új nyelv: koreai**: Bekerült a koreai nyelv támogatása, így még több felhasználó számára elérhető az alkalmazás.

## 25.3.0

### ✨ Új funkciók

- 🎵 **Háttérzene videók mellett**: A háttérzene videók megtekintése közben is tovább szólhat.
- 🎥 **Kamerakép jelnyelvi médiához**: Kifejezetten a jelnyelvet használók számára kamerakép jeleníthető meg a médiaablakban.
- 📅 **Az emlékünnep dátuma és háttérképe automatikusan**: Az alkalmazás automatikusan felismeri és beállítja az emlékünnep dátumát, és előkészíti az emlékünnepi háttérképet.
- 📜 **Kiadási megjegyzések az alkalmazásban**: A kiadási megjegyzések közvetlenül az alkalmazásban jelennek meg, így a felhasználók egy frissítés után könnyen áttekinthetik a változásokat.

## 25.2.1

### ✨ Új funkciók

- 🔄 **Újracsatlakozás az OBS-hez**: Szükség esetén kézzel is kikényszeríthető, hogy az alkalmazás újracsatlakozzon az OBS-hez.
- 🗑 **Régi exportálási dátummappák automatikus törlése**: Az elavult, dátummal elnevezett exportálási mappák automatikusan törlődnek, hogy a tárhely rendezett maradjon.

## 25.2.0

### ✨ Új funkciók

- 🌍 **A rendszer területi beállítása alapértelmezésként**: Az alkalmazás automatikusan felismeri és használja a rendszer területi beállítását a személyre szabottabb élmény érdekében.
- 🏷 **Címkék az exportált médiához**: Az exportált médiafájlok metaadat-címkéket kapnak a jobb rendszerezés érdekében.
- 🔄 **Automatikus visszaváltás bétáról stabil verzióra**: Szükség esetén az alkalmazás automatikusan visszaállhat a béta verzióról a stabil kiadásra.
- 🌐 **A legfrissebb MEPS-nyelvindexek lekérése**: A legújabb MEPS-nyelvindexek közvetlenül a hivatalos weboldalról töltődnek le, így a nyelvtámogatás mindig naprakész.

## 25.1.0

### ✨ Új funkciók

- 📅 **Korábbi dátumok megnyitása**: Az aktuális hét korábbi napjai is megnyithatók, ami hasznos, ha az összejövetel napja a hét egy későbbi napjára kerül.
- 🛑 **Hibasáv az OBS Studióhoz**: Hibasáv jelenik meg, ha összejöveteli napon az OBS Studio nincs csatlakoztatva, így a felhasználók biztosan értesülnek róla.
- 📚 **Média csoportosítása kiadványok szerint**: Az ugyanarra a kiadványra hivatkozó média csoportosítva jelenik meg az áttekinthetőbb, rendezettebb médianézet érdekében.
- 🎵 **Figyelmeztetés ismétlődő énekekre**: Figyelmeztetés jelenik meg, ha a hétvégi összejövetel médialistájában egy ének többször is szerepel.
- 🔄 **Jövőbeli időpontok tervezése**: Előre megtervezhetők az összejövetelek időpontjának jövőbeli változásai, ami hasznos az éves időpontváltozásoknál, vagy amikor a körzetfelvigyázó egy szomszédos gyülekezetet látogat meg.

## 24.11.0

### ✨ Új funkciók

- 🖥️ **Weboldal megjelenítése macOS-en**: A weboldal megjelenítése mostantól macOS-en is támogatott 🚀
- ⌨️ **Lejátszási billentyűparancsok**: Új billentyűparancsok a médialejátszás leállításához, szüneteltetéséhez és folytatásához 🚀
- 🌐 **Egyéni médialetöltési cím**: Beállítható a webcím, ahonnan a média letöltődik 🚀
- 🎬 **Azonnali OBS-jelenetváltó**: Új azonnali jelenetváltó az OBS Studióhoz, és megújult jelenetválasztás a beállításokban
- 📖 **Több nyelv a dokumentációban**: A dokumentációs weboldal mostantól több nyelvet támogat

## 24.10.10

### ✨ Új funkciók

- ⌨️ **Billentyűparancsok a médianavigációhoz**: Új billentyűparancsok a következő/előző médiaelemre ugráshoz
- 🖱️ **Jobb gombos menü a médiaelemeken**: A médiaelemek jobb gombos menüjéből elrejthetők és átnevezhetők az elemek
- ✂️ **Vágott JWL-lejátszási listák importálása**: Az importált JWL-lejátszási listákban mostantól érvényesülnek a videók vágott időpontjai

## 24.10.9

### ✨ Új funkciók

- 🗑️ **Egy nap extra médiájának törlése**: Új lehetőség a kiválasztott nap összes extra médiafájljának törlésére
