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

### Hibrid összejövetelek lebonyolítása az M³, az OBS Studio és a Zoom kombinációjával

A hibrid összejövetelek során a média megosztásának messze legegyszerűbb módja az OBS Studio, az M³ és a Zoom együttes konfigurálása.

#### Első beállítás: Királyság-terem számítógép

Állítsa a külső monitor képernyőfelbontását 1280x720-ra vagy egy ehhez közeli értékre.

Állítsa be, hogy a számítógép hangkártyájának kimenete a keverőpult egyik bemenetére, a keverőpult kombinált kimenete pedig a számítógép hangkártyájának bemenetére csatlakozzon.

#### Első beállítás: OBS Studio

Telepítse az OBS Studio-t, vagy töltse le a hordozható verzióját.

Ha az OBS Studio hordozható verzióját használja, telepítse a [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) bővítményt, és ha a hordozható verziót használja, adja hozzá a virtuális kamerát a Windows-hoz a mellékelt telepítő szkriptre való dupla kattintással.

Ha OBS Studio v27 vagy régebbi verzióval rendelkezik, telepítenie kell az [obs-websocket](https://github.com/obsproject/obs-websocket) plugint. Otherwise obs-websocket is included. Configure a port number and password for obs-websocket.

In the OBS settings, under `General` > `System Tray`, enable all checkboxes. Under `Output` > `Streaming`, enable a hardware encoder if available. Under `Video` > `Base (Canvas) Resolution` and `Output (Scaled) Resolution`, choose `1280x720`, and under `Downscale Filter`, choose `Bilinear`.

Set up at least 2 scenes: one for the media display (`Window Capture` or `Display Capture` with the mouse cursor disabled and the appropriate window title/monitor selected), and one for the stage view (`Video Capture Device` with the KH camera selected). You may add as many scenes as required, with the camera adjusted, zoomed-in and cropped as needed (lectern view, conductor and reader view, table view, etc.).

Adjon hozzá egy parancsikont az OBS Studio-hoz a `--startvirtualcam` paraméterrel a Windows felhasználói profil Indítópult mappájához, hogy az OBS Studio automatikusan elinduljon, amikor a felhasználó bejelentkezik.

#### Első beállítás: Királyság-terem Zoom

Zoom should be configured to use dual monitors. Enable global keyboard shortcuts for Zoom to mute/unmute the Kingdom Hall audio in Zoom (<kbd>Alt A</kbd>), and start/stop the Kingdom Hall video feed in Zoom (<kbd>Alt V</kbd>).

Állítsa be, hogy az alapértelmezett "mikrofon" a keverőpult kombinált kimenete legyen (így minden, ami a Királyság-terem hangrendszerén keresztül hallható, a Zoom-on keresztül is továbbításra kerül, beleértve a mikrofonokat és a médiát is), a "kamera" pedig az OBS Studio által biztosított virtuális kamera legyen.

#### Első beállítás: M³

Engedélyezze a `Média megjelenítése külső megjelenítőn vagy külön ablakban` opciót.

Engedélyezze és konfigurálja az OBS Studio kompatibilitási módját az OBS Studio konfigurációja során megadott port- és jelszóadatokkal.

#### Az összejövetel megkezdése

Start the Zoom meeting, and move the secondary Zoom meeting window to the external monitor. Make it fullscreen if desired. This is where any remote meeting participants will be displayed for the congregation to see.

Once the Zoom meeting is being displayed on the external monitor, open M³. The media presentation window will automatically open on top of Zoom on the external monitor. Sync media if necessary, and enter media controller mode by clicking the ▶️ (play) button on the main screen of M³, or <kbd>Alt D</kbd>.

Enable the Kingdom Hall video feed (<kbd>Alt V</kbd>), and spotlight the Kingdom Hall video feed if necessary so that Zoom participants see the Kingdom Hall stage. Unmute the Kingdom Hall audio feed in Zoom (<kbd>Alt A</kbd>). It should not be necessary to disable the video or audio feed in Zoom for the duration of the meeting.

Indítsa el a háttérzene lejátszását a bal alsó sarokban lévő gombbal vagy az <kbd>Alt K</kbd> kombinációval.

#### A személyes részek közvetítése a Királyság-terem színpadjáról a Zoom-on keresztül

Nem igényel beavatkozást.

A különböző kameraszögeket/zoomot a megbeszélés során az M³ médialejátszás vezérlőablakának alján található menü segítségével lehet kiválasztani; ez a menü tartalmazza az OBS-ben konfigurált összes kameranézet-jelenet listáját.

#### Média megosztása a Királyság-teremben és a Zoom-ban

Keresse meg a megosztani kívánt fájlt az M³ médialejátszó ablakában, és nyomja meg a "lejátszás" gombot.

When you're done sharing media, press the "stop" button in M³. Note that videos automatically stop upon completion.

#### Zoom résztvevők megjelenítése a Királyság-terem monitorján

Press the "hide/show media presentation window" button in the lower right corner of the M³ media controller screen, or <kbd>Alt Z</kbd>, to **hide** the media presentation window. The Zoom meeting will now be visible on the Kingdom Hall monitor.

> Ha a résztvevőnek médiát kell bemutatnia, kövesse a **Média megosztása a Királyság-teremben és a Zoom-ban** alcím alatti lépéseket.

Once the participant has finished their part, press the "hide/show media presentation window" button in the lower right corner of the M³ media playback control window, or <kbd>Alt Z</kbd>, to **show** the media presentation window. The Kingdom Hall monitor will now show the yeartext.

### Hibrid összejövetelek lebonyolítása kizárólag az M³ és Zoom használatával

Ha bármilyen okból nem kívánja használni az OBS Studio-t, a következő javaslatok segíthetnek a minél egyszerűbb beállításban.

#### Első beállítás: Királyság-terem számítógép

Same as corresponding section above. With the addition of the global keyboard shortcut for Zoom for starting/stopping screen sharing (<kbd>Alt S</kbd>). The "camera" will be the camera feed from the Kingdom Hall camera.

#### Első beállítás: M³

Engedélyezze a `Média megjelenítése külső megjelenítőn vagy külön ablakban` opciót.

#### Az összejövetel megkezdése

Ugyanaz, mint a fent említett megfelelő szakaszban.

#### A személyes részek közvetítése a Királyság-terem színpadjáról a Zoom-on keresztül

Ugyanaz, mint a fent említett megfelelő szakaszban.

#### Média megosztása a Királyság-teremben és a Zoom-ban

Start sharing in Zoom by hitting <kbd>Alt S</kbd>. In the Zoom sharing window that pops up, choose the external monitor and enable both checkboxes on the bottom left (for sound and video optimization). The yeartext will now be shared over Zoom.

Keresse meg a megosztani kívánt fájlt az M³ médialejátszó ablakában, és nyomja meg a "lejátszás" gombot.

Ha végzett a média megosztásával, nyomja le az <kbd>Alt S</kbd> billentyűt a Zoom képernyőmegosztás befejezéséhez.

#### Zoom résztvevők megjelenítése a Királyság-terem monitorján

Ugyanaz, mint a fent említett megfelelő szakaszban.

### Képernyőképek a Prezentációs módról

{% include screenshots/present-media.html lang=site.data.hu %}
