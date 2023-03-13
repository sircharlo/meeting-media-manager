---
tag: Használat
title: Médiabemutató mód
ref: present-media
---

### Médiaprezentációs mód használata

A médiaprezentációs és vezérlési módok úgy lettek kialakítva, hogy a használatuk egyszerű legyen, illetve ne lehessen hibákat véteni az összejövetelek során.

Ha a `Média megjelenítése külső megjelenítőn vagy külön ablakban` opció engedélyezve van, a médiabemutató képernyő automatikusan megjelenik a külső monitoron, ha van ilyen, vagy egy különálló, mozgatható és átméretezhető ablakban, ha nem érzékelt külső monitort.

Amikor készenléti állapotban van, a médiabemutató képernyőn a beállításokban konfigurált háttérkép jelenik meg. Ha nincs beállítva háttérkép, akkor az M³ megpróbálja automatikusan lekérni és megjeleníteni az éviszöveget.

Ha a beállításokban nincs háttérkép konfigurálva, és az éviszöveget nem lehetett automatikusan betölteni, akkor készenléti állapotban egy fekete háttér jelenik meg.

A médiavezérlő mód az M³ főképernyőjén a ▶️ (lejátszás) gombra kattintva, vagy az <kbd>Alt D</kbd> billentyűparanccsal (külső megjelenítő esetén) érhető el.

Miután belépett a vezérlő módba, a mappaválasztó képernyőn kiválaszthatja azt a dátumot, amelyre vonatkozóan a médiát szeretné megjeleníteni. Ha az aktuális nap mappája létezik, akkor automatikusan kiválasztásra kerül. Ha egyszer már kiválasztott egy dátumot, bármikor módosíthatja azt a felső részben található dátumválasztó gombbal.

### Média bemutatása

A média lejátszásához nyomja meg a ▶️ (lejátszás) gombot a kívánt fájlhoz. A média elrejtéséhez nyomja meg a ⏹️ (stop) gombot. Szükség esetén a videó szüneteltetés közben vissza- vagy előre is tekerhető. Kérjük, vegye figyelembe, hogy a videók esetében a leállítás gombot **kétszer** kell megnyomni, hogy elkerülje a videó véletlen és idő előtti leállítását, miközben az a gyülekezet számára lejátszásra kerül. A videók automatikusan leállnak, ha teljes egészében lejátszották őket.

### Extra funkciók

Az M³ rendelkezik néhány extra funkcióval, amelyek segítségével javíthatja a médiabemutatás hatékonyságát.

#### JW.org megjelenítése

A JW.org megjelenítéséhez nyomja meg a képernyő tetején található ⋮ (ellipszis) gombot, és válassza a `JW.org megnyitása` lehetőséget. Ez egy új vezérlőablakot nyit meg a JW.org betöltésével. A médiaablakban szintén megjelenik a JW.org. Most már használhatja a vezérlőablakot a JW.org navigálására, a médiaablak pedig megjeleníti a tevékenységeit. Ha befejezte a JW.org megjelenítését, bezárhatja a vezérlőablakot, és folytathatja a normál médiabemutatási módot.

#### Képek nagyítása és léptetése

Amikor egy kép jelenik meg, az egérgörgő segítségével a kép előnézete felett görgetve nagyíthat és kicsinyíthet. Másik lehetőségként a kép előnézetére duplán kattintva is nagyíthatja a képet. A dupla kattintás felváltva változtat az 1,5x, 2x, 3x, 4x, majd vissza az 1x-es zoomra. A képet lenyomva tartva és húzva is mozgathatja a képet, amellyel körbepásztázhatja a képet.

#### A média listájának rendezése

A média listája a képernyő jobb felső sarkában található rendezés gombra kattintva rendezhető. A médiatartalmak mellett megjelenik egy gomb, amellyel felfelé vagy lefelé húzhatja a médiaelemeket a listában. Ha elégedett a sorrenddel, a sorrend rögzítéséhez kattintson ismét a rendezés gombra.

#### Adj hozzá egy last minute dalt

Ha az utolsó pillanatban szeretne egy dalt hozzáadni a médialistához, akkor nyomja meg a képernyő tetején található `♫ +` (dal hozzáadása) gombot. Megjelenik egy legördülő lista a Királyság énekekkel. Ha kiválaszt egyet, az azonnal a lista tetejére kerül, és egyből lejátszható. Az alkalmazás streameli a dalt a JW.org-ról, vagy a helyi gyorsítótárból játssza le, ha korábban már letöltötte azt.

### Hibrid összejövetelek lebonyolítása az M³, az OBS Studio és a Zoom kombinációjával

A hibrid összejövetelek során a média megosztásának messze legegyszerűbb módja az OBS Studio, az M³ és a Zoom együttes konfigurálása.

#### Első beállítás: Királyság-terem számítógép

Állítsa a külső monitor képernyőfelbontását 1280x720-ra vagy egy ehhez közeli értékre.

Állítsa be, hogy a számítógép hangkártyájának kimenete a keverőpult egyik bemenetére, a keverőpult kombinált kimenete pedig a számítógép hangkártyájának bemenetére csatlakozzon.

#### Első beállítás: OBS Studio

Telepítse az OBS Studio-t, vagy töltse le a hordozható verzióját.

Ha az OBS Studio hordozható verzióját használja, telepítse a [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) bővítményt, és ha a hordozható verziót használja, adja hozzá a virtuális kamerát a Windows-hoz a mellékelt telepítő szkriptre való dupla kattintással.

Ha OBS Studio v27 vagy régebbi verzióval rendelkezik, telepítenie kell az [obs-websocket](https://github.com/obsproject/obs-websocket) plugint. Újabb verzió esetén az obs-websocket része a programnak. Állítson be egy portszámot és jelszót az obs-websocket számára.

Az OBS beállításaiban az `Általános` > `Értesítési terület` alatt pipálja ki az összes jelölőnégyzetet. A `Kimenet` > `Közvetítés` mezőben engedélyezze a hardveres kódolót, ha elérhető. A `Videó` > `Alap (vászon) felbontás` és a `Kimeneti (skálázott) felbontás` menüpontban válassza az `1280x720`-as felbontást, a `Leskálázási szűrő menüpontban` pedig a `Bilineáris` opciót.

Állítson be legalább 2 jelenetet: egyet a média megjelenítéséhez (`Ablak felvétele` vagy `Kijelző felvétele` az egérkurzor kikapcsolásával és a megfelelő ablakcím/monitor kiválasztásával), és egyet a színpadi nézethez (`Videófelvevő eszköz` a KT kamera kiválasztásával). You can also add another scene specifically for pictures, where the media window is visible along with the podium in a picture-in-picture style display. Annyi jelenetet adhat hozzá, amennyit csak akar, a kamera beállításával, nagyításával és vágásával, amennyire szükséges (nézet a pulpitusról, nézet az előadótól és az olvasótól, nézet az asztalról stb.).

Enable the `Scaling/Aspect Ratio` filter on all `Window Capture` or `Display Capture` inputs, with a `Resolution` of `Base (Canvas) Resolution`. This will ensure that the media window is always scaled to the virtual camera's output resolution.

Adjon hozzá egy parancsikont az OBS Studio-hoz a `--startvirtualcam` paraméterrel a Windows felhasználói profil Indítópult mappájához, hogy az OBS Studio automatikusan elinduljon, amikor a felhasználó bejelentkezik.

#### Első beállítás: Királyság-terem Zoom

A Zoomot úgy kell beállítani, hogy két monitort használjon. Engedélyezze a Zoom globális billentyűparancsok használatát a Királyságterem hangjának elnémításához/lekapcsolásához a Zoomban (<kbd>Alt A</kbd>), valamint a Királyságterem videó közvetítésének elindításához/leállításához a Zoomban (<kbd>Alt V</kbd>).

Állítsa be, hogy az alapértelmezett "mikrofon" a keverőpult kombinált kimenete legyen (így minden, ami a Királyság-terem hangrendszerén keresztül hallható, a Zoom-on keresztül is továbbításra kerül, beleértve a mikrofonokat és a médiát is), a "kamera" pedig az OBS Studio által biztosított virtuális kamera legyen.

#### Első beállítás: M³

Engedélyezze a `Média megjelenítése külső megjelenítőn vagy külön ablakban` opciót.

Engedélyezze és konfigurálja az OBS Studio kompatibilitási módját az OBS Studio konfigurációja során megadott port- és jelszóadatokkal.

#### Az összejövetel megkezdése

Indítsa el a Zoom-meetinget, és helyezze át a Zoom-meeting másodlagos ablakát a külső monitorra. Ha szükséges, tegye teljes képernyőre. Itt jelenik meg a gyülekezet számára az összes online résztvevő.

Miután a Zoom meeting megjelenik a külső monitoron, nyissa meg az M³ programot. A médiabemutató ablak automatikusan megnyílik a külső monitoron a Zoom fölött. Szinkronizálja a médiát, ha szükséges, és lépjen médiavezérlő üzemmódba az M³ főképernyőjén a ▶️ (lejátszás) gombra kattintva, vagy az <kbd>Alt D</kbd> lenyomásával.

Kapcsolja be a Királyságterem videoközvetítését (<kbd>Alt V</kbd>), és szükség esetén állítsa reflektorfénybe a Királyságterem videóképét, hogy a Zoom résztvevői láthassák a Királyságterem színpadját. Adja ki a Királyság terem hangját a Zoomban (<kbd>Alt A</kbd>). Az összejövetel idejére nem szükséges letiltani a videó- vagy hangtovábbítást a Zoomban. Győződjön meg róla, hogy a Zoomban engedélyezve van az "Eredeti hang zenészek számára", hogy a távoli résztvevők számára a legjobb hangminőséget biztosítsa.

Indítsa el a háttérzene lejátszását a bal alsó sarokban lévő gombbal vagy az <kbd>Alt K</kbd> kombinációval.

#### A személyes részek közvetítése a Királyság-terem színpadjáról a Zoom-on keresztül

Nem igényel beavatkozást.

A különböző kameraszögeket/zoomot a megbeszélés során az M³ médialejátszás vezérlőablakának alján található menü segítségével lehet kiválasztani; ez a menü tartalmazza az OBS-ben konfigurált összes kameranézet-jelenet listáját.

#### Média megosztása a Királyság-teremben és a Zoom-ban

Keresse meg a megosztani kívánt fájlt az M³ médialejátszó ablakában, és nyomja meg a "lejátszás" gombot.

Ha befejezte a média megosztását, nyomja meg a "stop" gombot az M³-ban. Vegye figyelembe, hogy a videók automatikusan leállnak a befejezést követően.

#### Zoom résztvevők megjelenítése a Királyság-terem monitorján

Nyomja meg az M³ médiavezérlő képernyőjének jobb alsó sarkában található "médiabemutató ablak elrejtése/megjelenítése" gombot, vagy a <kbd>Alt Z</kbd> billentyűt a médiabemutató ablak **elrejtéséhez.** A Zoom meeting mostantól látható lesz a Királyság terem monitorján.

> Ha a résztvevőnek médiát kell bemutatnia, kövesse a **Média megosztása a Királyság-teremben és a Zoom-ban** alcím alatti lépéseket.

Miután a távoli résztvevő befejezte a feladatát, nyomja meg az M³ médialejátszás vezérlőablakának jobb alsó sarkában lévő "médiabemutató ablak elrejtése/megjelenítése" gombot, vagy a <kbd>Alt Z</kbd> gombot a médiabemutató ablak **megjelenítéséhez**. A királysági terem monitorján mostantól az éviszöveg jelenik meg.

### Hibrid összejövetelek lebonyolítása kizárólag az M³ és Zoom használatával

Ha bármilyen okból nem kívánja használni az OBS Studio-t, a következő javaslatok segíthetnek a minél egyszerűbb beállításban.

#### Első beállítás: Királyság-terem számítógép

Ugyanaz, mint a fenti megfelelő részben. A Zoom globális billentyűkombinációval kiegészítve a képernyőmegosztás elindításához/leállításához (<kbd>Alt S</kbd>). A "kamera" a királysági terem kamerájának képét mutatja majd.

#### Első beállítás: M³

Engedélyezze a `Média megjelenítése külső megjelenítőn vagy külön ablakban` opciót.

#### Az összejövetel megkezdése

Ugyanaz, mint a fent említett megfelelő szakaszban.

#### A személyes részek közvetítése a Királyság-terem színpadjáról a Zoom-on keresztül

Ugyanaz, mint a fent említett megfelelő szakaszban.

#### Média megosztása a Királyság-teremben és a Zoom-ban

Kezdje el a megosztást a Zoomban az <kbd>Alt S</kbd> billentyűvel. A megjelenő Zoom megosztás ablakban válassza ki a külső monitort, és engedélyezze mindkét jelölőnégyzetet a bal alsó sarokban (a hang és a videó optimalizálásához). Az éviszöveg mostantól a Zoomon keresztül kerül megosztásra.

Keresse meg a megosztani kívánt fájlt az M³ médialejátszó ablakában, és nyomja meg a "lejátszás" gombot.

Ha végzett a média megosztásával, nyomja le az <kbd>Alt S</kbd> billentyűt a Zoom képernyőmegosztás befejezéséhez.

#### Zoom résztvevők megjelenítése a Királyság-terem monitorján

Ugyanaz, mint a fent említett megfelelő szakaszban.

### Képernyőképek a Prezentációs módról

{% include screenshots/present-media.html lang=site.data.hu %}
