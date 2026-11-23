# Adatvédelmi szabályzat {#privacy-policy}

Hatálybalépés napja: 2026. november 22.

A Meeting Media Manager (M³) egy ingyenes, nyílt forráskódú alkalmazás, amelyet önkéntesek készítettek. Ez a szabályzat elmagyarázza, milyen adatokat kezel az M³, és hová kerülnek ezek. It applies to every version of M³: the installers and portable version from this website, and the versions in the Microsoft Store and the Snap Store.

**Röviden:** Az M³-ban nincsenek fiókok, nincsenek hirdetések, és nincsenek reklám- vagy marketingcélú nyomkövetők. A beállításai és a médiafájljai a számítógépén maradnak. A problémák felderítése és javítása érdekében az M³ diagnosztikai adatokat küld a fejlesztőinek: hibajelentéseket, valamint információkat az egyes munkamenetekről és arról, hogy milyen gyorsan fut az M³. Az M³ kihagyja belőlük azt, ami alapján Önt vagy a gyülekezetét azonosítani lehetne, és az IP-címét nem tárolják.

## Ami a számítógépén marad {#on-your-computer}

Az M³ a következőket tárolja a számítógépén lévő adatmappájában:

- minden gyülekezet vagy csoport beállításai, például a neve, az összejöveteli időpontjai, a nyelve és az integrációi;
- az általa letöltött média és kiadványok, valamint az Ön által hozzáadott média;
- az OBS Studio jelszava, ha használja. Az M³ az operációs rendszerének jelszótárolójával titkosítja, ha az elérhető; ha nem, az M³ egyszerű szövegként tárolja, és ezt jelzi is Önnek;
- a Zoom-integráció beállításai, ha használja.

A hibajelentések tartalmazzák e beállítások némelyikét (lásd alább), de soha nem azokat, amelyek alapján Önt vagy a gyülekezetét azonosítani lehetne.

Ha egy kamera képét jeleníti meg a médiaablakban (ez egy lehetőség a jelnyelvi gyülekezetek számára), az csak megjelenik: az M³ nem rögzíti, nem menti és nem küldi el. Az M³ a számítógépén készíti el a médiaablak Önnek megjelenített előnézetét, és ezt sem menti el, és nem is küldi el.

Mindezt bármikor törölheti az M³ adatmappájának törlésével. Windows rendszeren az M³ eltávolítása is törli. The Snap Store version keeps it when you uninstall it, unless you ask it not to (`snap remove --purge`).

## Diagnosztikai adatok {#error-reports}

Az M³ diagnosztikai adatokat küld a [Sentry](https://sentry.io) szolgáltatásnak, amelyet a fejlesztői a hibák felderítésére és javítására használnak.

**Hibajelentések**, amikor valami rosszul sül el az M³-ban. Egy jelentés a következőket tartalmazhatja:

- a hiba, és az, hogy az M³ kódjának melyik pontján történt;
- az M³ verziója, az operációs rendszere és annak verziója, a nyelve és az időzónája, valamint alapvető információk a hardveréről, például a videokártyájáról;
- a hibához vezető lépések, például az M³-ban megnyitott oldalak és azok a fájlok, amelyeket éppen letöltött;
- az M³ akkori állapota: a beállításai, és az, hogy éppen mit csinált, például melyik médiát játszotta le, vagy melyik összejövetelt készítette elő;
- ha az M³ egy része összeomlik, az adott rész összeomlási jelentése, amely a memóriája egy részét is tartalmazhatja az összeomlás pillanatából.

**Munkamenet-adatok**, valahányszor az M³ fut: mikor indult el, és hogy normálisan ért-e véget vagy összeomlott, az M³ verziójával és az operációs rendszerével együtt.

**Teljesítményadatok**, minden munkamenetben: mennyi idő alatt nyílnak meg az M³ oldalai, és mennyi ideig tartanak a lent felsorolt szerverekhez intézett kérései, a címükkel együtt.

### Amit az M³ kihagy {#left-out}

A diagnosztikai adatai elküldése előtt az M³ eltávolítja belőlük mindazt, ami alapján Önt vagy a gyülekezetét azonosítani lehetne:

- a gyülekezet neve, a Zoom-értekezletazonosítója és a Zoom-résztvevők nevei;
- a beállítások PIN-kódja és az OBS Studio jelszava;
- a számítógépén lévő mappák és fájlok neve: egy mappából csak a meghajtó vagy a legfelső szintű mappa, egy fájlból pedig csak a típusa marad meg;
- a „Weboldal címe” beállításban megadott cím, ha az nem az alapértelmezett;
- a felhasználóneve a jelentésekben szereplő mappaútvonalakban.

Az adatok nem tartalmaznak nevet, e-mail-címet vagy fiókot, mivel az M³-ban ezek egyike sincs. Az M³ arra kéri a Sentryt, hogy ne rögzítse az IP-címét, és a Sentry úgy van beállítva, hogy ne tárolja.

Az M³ karbantartói ezeket az adatokat csak a problémák felderítésére és javítására használják. A Sentry az Egyesült Államokban tárolja őket, és korlátozott idő elteltével törli. A [Sentry adatvédelmi szabályzata](https://sentry.io/privacy/) elmagyarázza, hogyan kezeli őket.

## Szerverek, amelyekhez az M³ csatlakozik {#connections}

Feladatai ellátásához az M³ az alábbi szerverekhez csatlakozik. Ahogy bármely weboldal, amelyet meglátogat, ezek a szerverek is láthatják a számítógépe IP-címét.

- **Jehova Tanúi hivatalos weboldala** és letöltési szerverei, az összejöveteli média és a kiadványok, valamint a hozzájuk tartozó információk letöltéséhez. Arra, amit ez a weboldal megkap, a weboldal saját adatvédelmi szabályzata vonatkozik.
- **GitHub**, ahol az M³-at közzéteszik, az M³ frissítéseinek kereséséhez és letöltéséhez, valamint az újdonságainak megjelenítéséhez. The Microsoft Store and Snap Store versions get their updates from their store instead.
- **jsDelivr**, a bizonyos nyelvekhez szükséges betűtípusok, valamint az M³ által a PDF-fájlok olvasásához használt összetevő letöltéséhez.
- **Apple, Cloudflare, icanhazip.com és ipify.org**, annak ellenőrzéséhez, hogy a számítógépe csatlakozik-e az internethez.
- **Sentry**, a fent leírt diagnosztikai adatok elküldéséhez.

Ha használja őket, az M³ ezekkel is együttműködik a számítógépén vagy a helyi hálózatán:

- **Zoom:** Az M³ vezérli a számítógépén lévő Zoom-alkalmazást. Saját maga semmit sem küld a Zoom szervereire.
- **OBS Studio:** Az M³ a számítógépén vagy a helyi hálózaton futó OBS Studio alkalmazáshoz csatlakozik.
- **A távoli időzítő:** Az M³ egy kis webszervert futtat a helyi hálózatán, hogy egy másik eszköz megjeleníthesse az összejöveteli időzítőt.

Ha Jehova Tanúi hivatalos weboldalát az M³ weboldal-ablakában jeleníti meg, az ugyanúgy működik, mint egy webböngészőben.

## Áruházak {#stores}

If you install M³ from the Microsoft Store or the Snap Store, that store handles its installation and updates, under its own privacy policy. Maga az M³ minden verzióban ugyanúgy működik.

## A szabályzat módosításai {#changes}

Ha az M³ másként kezdi kezelni az adatokat, ez az oldal frissül, és a tetején új dátum jelenik meg. Az oldal változástörténete a [GitHubon](https://github.com/sircharlo/meeting-media-manager/commits/master/docs/src/en/privacy.md) található.

## Kérdések {#questions}

Ha kérdése van ezzel a szabályzattal vagy az adataival kapcsolatban, [nyisson egy bejelentést a GitHubon](https://github.com/sircharlo/meeting-media-manager/issues).
