---
tag: Usage
title: Médiabemutató mód
ref: present-media
---

### Médiaprezentációs mód használata

A médiaprezentációs és vezérlési módok úgy lettek kialakítva, hogy a használatuk egyszerű legyen, illetve ne lehessen hibákat véteni az összejövetelek során.

Ha a `Média megjelenítése külső megjelenítőn vagy külön ablakban` opció engedélyezve van, a médiabemutató képernyő automatikusan megjelenik a külső monitoron, ha van ilyen, vagy egy különálló, mozgatható és átméretezhető ablakban, ha nem érzékelt külső monitort.

Készenléti állapotban a médiabemutató képernyőn a beállításokban konfigurált háttérkép jelenik meg. Ha nincs beállítva háttérkép, akkor az M³ megpróbálja automatikusan lekérni és megjeleníteni az éviszöveget.

Ha a beállításokban nincs háttérkép konfigurálva, és az éviszöveget nem lehetett automatikusan betölteni, akkor készenléti állapotban egy fekete háttér jelenik meg.

A médiavezérlő mód az M³ főképernyőjén a ▶️ (lejátszás) gombra kattintva, vagy az <kbd>Alt D</kbd> billentyűparanccsal (külső megjelenítő esetén) érhető el.

Miután belépett a vezérlő üzemmódba, a mappaválasztó képernyőn kiválaszthatja azt a napot, amelyre vonatkozóan a médiát szeretné megjeleníteni. Ha az aktuális nap mappája létezik, akkor automatikusan kiválasztásra kerül. Ha egyszer már kiválasztott egy dátumot, azt bármikor meg tudja változtatni, ha a felső részben a dátum kiválasztása gombra kattint.

### Média bemutatása

A média lejátszásához nyomja meg a ▶️ (lejátszás) gombot a használni kívánt fájlhoz. A média elrejtéséhez nyomja meg a ⏹️ (stop) gombot. Szükség esetén a videó szüneteltetés közben vissza- vagy előretekerhető. Kérjük, vegye figyelembe, hogy a videók esetében a leállítás gombot **kétszer** kell megnyomni, hogy elkerülje a videó véletlen és elhamarkodott leállítását a gyülekezet számára történő lejátszás közben. A videók automatikusan leállnak, ha lejátszásuk befejeződött.

### Hibrid összejövetelek lebonyolítása az M³, az OBS Studio és a Zoom kombinációjával

A hibrid összejövetelek során a média megosztásának messze legegyszerűbb módja az OBS Studio, az M³ és a Zoom együttes konfigurálása.

#### Első beállítás: Királyság-terem számítógép

Állítsa a külső monitor képernyőfelbontását 1280x720-ra vagy egy ehhez közeli értékre.

Állítsa be, hogy a számítógép hangkártyájának kimenete a keverőpult egyik bemenetére, a keverőpult kombinált kimenete pedig a számítógép hangkártyájának bemenetére csatlakozzon!

#### Első beállítás: OBS Studio

Telepítse az OBS Studio-t, vagy töltse le a hordozható verzióját.

Ha az OBS Studio hordozható verzióját használja, telepítse a [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) bővítményt, és ha a hordozható verziót használja, adja hozzá a virtuális kamerát a Windows-hoz a mellékelt telepítő szkriptre való dupla kattintással.

If you have OBS Studio v27 or older, you need to install the [obs-websocket](https://github.com/obsproject/obs-websocket) plugin. Otherwise obs-websocket is included. Configure a port number and password for obs-websocket.

Az OBS-beállításokban az `Általános` > `Értesítési terület` menüpontban kapcsolja be az összes jelölőnégyzetet. A `Kimenet` > `Közvetítés` menüpontban engedélyezze a Hardveres kódolót, ha rendelkezésre áll. A `Videó` > `Alap (vászon) felbontás` és a `Kimeneti (skálázott) felbontás` menüpontban válassza az `1280x720-as` felbontást, a `Leskálázási szűrőt` pedig állítsa `Bilineáris` értékre.

Állítson be legalább 2 jelenetet: egyet a média megjelenítéséhez (`Ablak felvétele` vagy `Kijelző felvétele` az egérkurzor kikapcsolásával és a megfelelő ablakcím/monitor kiválasztásával), és egyet a színpadi nézethez (`Videorögzítő eszköz` a Királyság-terem kamerájának kiválasztásával). Annyi jelenetet adhat hozzá, amennyit csak akar, a kamera beállításával, nagyításával és vágásával, amennyire szükséges (nézet a pódiumról, nézet az előadóról és a felolvasóról, nézet az asztalról stb.).

Adjon hozzá egy parancsikont az OBS Studio-hoz a `--startvirtualcam` paraméterrel a Windows felhasználói profil Indítópult mappájához, hogy az OBS Studio automatikusan elinduljon, amikor a felhasználó bejelentkezik.

#### Első beállítás: Királyság-terem Zoom

A Zoom-ot úgy kell beállítani, hogy két monitort használjon. A Zoom globális billentyűparancsok engedélyezése a Királyság-terem hangjának elnémításához/lekapcsolásához a Zoomban (<kbd>Alt A</kbd>), valamint a Királyság-terem videójelének elindításához/leállításához a Zoomban (<kbd>Alt V</kbd>).

Állítsa be, hogy az alapértelmezett "mikrofon" a keverőpult kombinált kimenete legyen (így minden, ami a Királyság-terem hangrendszerén keresztül hallható, a Zoom-on keresztül is továbbításra kerül, beleértve a mikrofonokat és a médiát is), a "kamera" pedig az OBS Studio által biztosított virtuális kamera legyen.

#### Első beállítás: M³

Engedélyezze a Média megjelenítése külső megjelenítőn vagy külön ablakban opciót.

Engedélyezze és konfigurálja az OBS Studio kompatibilitási módját az OBS Studio konfigurációja során megadott port- és jelszóadatokkal.

#### Az összejövetel megkezdése

Indítsa el a Zoom-megbeszélést, és helyezze át a második ablakot a külső monitorra. Ha kívánja, tegye azt teljes képernyőre. Itt jelennek meg a gyülekezet számára a távollévők, akik részt vesznek az összejövetelen.

Miután a Zoom meeting megjelenik a külső monitoron, nyissa meg az M³ programot. A médiabemutató ablak automatikusan megnyílik a külső monitoron a Zoom felett. Szinkronizálja a médiát, ha szükséges, és lépjen médiavezérlő üzemmódba az M³ főképernyőjén a ▶️ (lejátszás) gombra kattintva, vagy az <kbd>Alt D</kbd> kombinációval

Kapcsolja be a Királyságterem videoközvetítését (<kbd>Alt V</kbd>), és szükség esetén állítsa előtérbe a Királyságterem videoközvetítését, hogy a Zoom résztvevői lássák a Királyságterem színpadját. Adja vissza a Királyság-terem hangját a Zoomban (<kbd>Alt A</kbd>). Nem kell kikapcsolni a video- ill. audiojelet a Zoomban az összejövetel idejére.

Indítsa el a háttérzene lejátszását a bal alsó sarokban lévő gombbal vagy az <kbd>Alt K</kbd> kombinációval.

#### A személyes részek közvetítése a Királyság-terem színpadjáról a Zoom-on keresztül

Nem igényel beavatkozást.

A különböző kameraszögeket/zoomot a megbeszélés során az M³ médialejátszás vezérlőablakának alján található menü segítségével lehet kiválasztani; ez a menü tartalmazza az OBS-ben konfigurált összes kameranézet-jelenet listáját.

#### Média megosztása a Királyság-teremben és a Zoom-ban

Keresse meg a megosztani kívánt fájlt az M³ médialejátszó ablakában, és nyomja meg a "lejátszás" gombot.

Ha befejezte a média megosztását, nyomja meg a "stop" gombot az M³-ban. Vegye figyelembe, hogy a videók automatikusan leállnak a befejezéskor.

#### Zoom résztvevők megjelenítése a Királyság-terem monitorján

Nyomja meg az M³ médiavezérlő képernyőjének jobb alsó sarkában található "médiabemutató ablak elrejtése/megjelenítése" gombot, vagy az <kbd>Alt Z</kbd> kombinációt ahhoz, hogy elrejtse a médiabemutató ablakot. A Zoom meeting mostantól látható lesz a Királyságterem kijelzőin.

> Ha a résztvevőnek médiát kell bemutatnia, kövesse a **Média megosztása a Királyság-teremben és a Zoom-ban** alcím alatti lépéseket.

Miután a testvér befejezte a programját, nyomja meg az M³ médialejátszás vezérlőablakának jobb alsó sarkában található "médiabemutató ablak elrejtése/megjelenítése" gombot, vagy az <kbd>Alt Z</kbd> kombinációt a médiabemutató ablak megjelenítéséhez. A Királyság-terem monitorján mostantól az éviszöveg jelenik meg.

### Hibrid összejövetelek lebonyolítása kizárólag az M³ és Zoom használatával

Ha bármilyen okból nem kívánja használni az OBS Studio-t, a következő javaslatok segíthetnek a minél egyszerűbb beállításban.

#### Első beállítás: Királyság-terem számítógép

Ugyanaz, mint a fent említett megfelelő szakaszban. A Zoom globális billentyűkombinációval kiegészítve a képernyőmegosztás elindításához/leállításához (<kbd>Alt S</kbd>). A "kamera" a Királyság-terem kamerájának képét fogja használni.

#### Első beállítás: M³

Engedélyezze a `Média megjelenítése külső megjelenítőn vagy külön ablakban` opciót.

#### Az összejövetel megkezdése

Ugyanaz, mint a fent említett megfelelő szakaszban.
A személyes részek közvetítése a Királyság-terem színpadjáról a Zoom-on keresztül

Ugyanaz, mint a fent említett megfelelő szakaszban.

#### Média megosztása a Királyság-teremben és a Zoom-ban

Indítsa el a megosztást a Zoomban az <kbd>Alt S</kbd> billentyűvel. A felugró Zoom megosztás ablakban válassza ki a külső monitort, és engedélyezze mindkét jelölőnégyzetet a bal alsó sarokban (a hang és a videó optimalizálásához). Az éviszöveg mostantól a Zoomon keresztül lesz megosztva.

Keresse meg a megosztani kívánt fájlt az M³ médialejátszó ablakában, és nyomja meg a "lejátszás" gombot.

Ha végzett a média megosztásával, nyomja le az <kbd>Alt S</kbd> billentyűt a Zoom képernyőmegosztás befejezéséhez.

#### Zoom résztvevők megjelenítése a Királyság-terem monitorján

Ugyanaz, mint a fent említett megfelelő szakaszban.

### Képernyőképek a Prezentációs módról

{% include screenshots/present-media.html lang=site.data.hu %}
