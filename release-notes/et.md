<!-- markdownlint-disable no-duplicate-heading -->

# Mis on uut

Täielik nimekiri versioonide vahelistest muudatustest on esitatud failis CHANGELOG.md GitHubis.

## TULEVANE VERSIOON

### ✨ Uued funktsioonid

- ✨ **Taimeri kaugkuva**: Kõnepuldi tahvelarvuti taimerilehel on valikuline fookusvaade, mille saad sisse lülitada seadetes. See näitab aega suures edenemisrõngas, mis muutub viimasel minutil kollaseks ja seejärel üleaja korral punaseks koos üleaja näiduga (+02:18), ning loetleb selle kõrval Zoomi osalejad, kes on käe tõstnud, selles järjekorras, nagu nad seda tegid: esimesed neli nimepidi, ülejäänud arvuna. Iga uus käsi vilgub kolm sekundit tekstiga „Käsi tõstetud” ja loend uueneb, kui käed tõusevad ja langevad. Praegune vaade jääb vaikeväärtuseks.

## v26.10.2

### ✨ Uued funktsioonid

- ✨ **Funktsioonisoovitused**: Aeg-ajalt soovitab M³ lühikeses aknas „Kas teadsid?” mõnda funktsiooni, mida profiil veel ei kasuta, ja selgitab, mida see teeb. See näitab iga kord, kui profiil avatakse, kõige rohkem ühte soovitust, mitte kunagi ajavahemikus 15 minutit enne koosolekut kuni selle lõpuni, ning jätab iga vastuse meelde: „Tuleta mulle hiljem meelde” viib soovituse järjekorra lõppu, „Ei, aitäh” peidab selle jäädavalt ja „Lõpeta funktsioonide soovitamine” lülitab profiili jaoks kõik soovitused välja. Arvesse läheb ka seadistusviisardis antud vastus „Ei” ning vastused saab lähtestada seadetes jaotises „Lisavalikud”.
- ✨ **Zoomi koosolekuhaldur (beeta, Windows)**: M³ saab nüüd sinu ekraanidel paigutada oma akna ja Zoomi koosolekuakna. Zoomi seadistusabilise kaks uut sammu küsivad, kuhu Zoomi koosolek peaks minema. Oma ekraanide kaardil valid Zoomi ekraani (mitte kunagi seda, mida täidab meediaaken) ja selle, kas Zoom on sellel üksi või jagab seda M³-ga. Seejärel lohistad selle ekraani tegelikku kuju näitaval joonisel eraldajat, et jagada ekraan kahe akna vahel; eraldaja kinnitub tavapärastele suhetele. Kohe kui koosolek avaneb, avab M³ Zoomi osalejate loendi, kui seda palusid, paneb seejärel mõlemad aknad paika ja hoiab sellest hetkest Zoomi seal: kui Zoom ise oma akent liigutab või selle suurust muudab (pärast ekraani jagamist või kui osalejate loend avaneb või sulgub), paneb M³ selle tagasi, samas kui aken, mida liigutad ise, jääb kuni järgmise koosolekuni sinna, kuhu selle panid. Iga kord, kui M³ Zoomi omal algatusel liigutab, annab teavitus sellest teada ja laseb sul selle kohe peatada, kuni M³ taaskäivitumiseni või jäädavalt. Kui Zoom jagab meediaakent, mis peidab Zoomi koosolekuakna, avab M³ selle asemel Zoomi osalejate loendi, et näeksid ikka, kes tõstab kommenteerimiseks käe. Kui Zoomi seade „Meeting window view” on väärtusel „Dual window” (Zoomi vanemates versioonides „Use dual monitors”), läheb Zoomi teine aken täisekraanil meediaakna taha, seega näed seda, kui meediaakna peidad. M³ saab ka kaks akent Windowsi enda kinnitamisfunktsiooniga kõrvuti paigutada, nii et nendevahelise piiri lohistamine muudab mõlema suurust. Zoomi hüpikakna nupp „Paiguta aknad” paneb igal ajal kõik tagasi paika ja paigutust saab hiljem muuta seadetes jaotises Zoomi koosolekuhaldur. See salvestatakse iga arvuti jaoks eraldi, kuna see sõltub selle ekraanidest.

## v26.10.1

### ✨ Uued funktsioonid

- ✨ **Zoomi koosolekuhaldur (beeta, Windows)**: Uus integratsioon, mis juhib iga koosoleku eel ja järel Zoomi sinu eest. See saab käivitada sinu koguduse Zoomi koosoleku, kui enne koosolekut algab taustamuusika. Kui muusika vahetult enne koosoleku algust peatub, ühendab see arvuti heli, lülitab sisse mikrofoni ja korraldaja video ning vaigistab kõik, lubamata neil oma heli sisse lülitada. Kui muusika mängib enne või pärast koosolekut, teeb see vastupidist: katkestab arvuti heli ühenduse, lülitab korraldaja video välja ja lubab kõigil oma heli uuesti sisse lülitada (paludes neil seda teha). Samuti saab see meedia näitamise ajal meediaakent Zoomis automaatselt jagada, tagades, et jagatakse just meediaakent ja mitte kunagi midagi muud sinu ekraanilt. Tegevussaare uus Zoomi nupp näitab, kas Zoomi koosoleku aken leiti, ja võimaldab neid samme käsitsi käivitada. Seadistusabiline, mida pakutakse valiku sisselülitamisel (esialgne seadistusviisard pakub seda nüüd Windowsis kiirklahviga ekraani jagamise asemel) ja mis on igal ajal saadaval Zoomi nupu või seadete kaudu, kontrollib sinu Zoomi, õpib selgeks selle mikrofoni- ja kaameranuppude nimed sinu keeles ning proovib kõik sammud koos sinuga läbi. Kui M³ käivitub, kontrollib see ka, kas kõik, mida see Zoomis automatiseerib, töötab, avades koosolekupäevadel vajaduse korral koosoleku tunni ja veerandi jooksul enne selle algust (kui teised on juba koosolekul, ainult vaadates ja midagi vajutamata); kui miski ei tööta, annab see sulle teada ja peatab oma Zoomi automatiseeringud, kuni M³ taaskäivitatakse või uus kontroll õnnestub, et koosoleku ajal midagi valesti ei läheks. See kontroll on vaikimisi sisse lülitatud ja selle saab seadetes välja lülitada. Iga sellise sammu õnnestumisel märgitakse koosoleku kiirtoimingute koosolekueelses ja -järgses kontrollnimekirjas vastavad meeldetuletused sinu eest tehtuks märkega „Zoomis automaatselt tehtud”. Kuna seda ei saa kasutada koos kiirklahviga ekraani jagamisega, kuvatakse seadetes selle valiku all, mis pole saadaval, märkus, milline valik tuleb välja lülitada. See töötab olenemata Zoomi keelest ega vaja peale Zoomi enda midagi muud installida.

- ✨ **Koosoleku taimer**: Kohandatud osi saab nüüd lisada ka koosolekupäevadel – juhtiva kogu teadaannete, eriprogrammide ja kõige muu jaoks, mida tavapärases ajakavas pole. Igaüht neist ajastatakse nagu iga teist osa ning selle nime ja pikkust saab muuta taimeri hüpikaknas või osade loendis.

- ✨ **Koosoleku taimer**: Kiirem juurdepääs taimerile. Kui viid hiirekursori tegevussaare taimerinupu kohale, näed nüüd ajastatavat osa ning nuppe Käivita, Paus, Peata ja Järgmine osa, ilma hüpikakent avamata (seade, mis on vaikimisi sisse lülitatud). Uus seade hoiab ka kogu osade loendi ja taimeri juhtnupud alati nähtaval põhiakna paremas servas olevas paneelis.

- ✨ **Koosoleku taimer**: Uus tagasilugemise kuva „Analoogkell ajakaarega” näitab osale jäänud aega analoogkella sihverplaadil sektorina, alates minutiosutist kuni planeeritud lõpuni, nii et ühe pilguga näeb nii kellaaega kui ka seda, kui palju aega on jäänud. Ületatud aega näidatakse punase sektorina. See töötab ka koosolekueelse tagasilugemise ajal ja üleslugemise režiimis.

- ✨ **Koosoleku taimer**: Koosolekueelse tagasilugemise silt on nüüd „Koosoleku alguseni” ja taimeri ekraanil näidatakse ajastatava osa nime, nii et „4:59” ei saa enam kellaajaga segi ajada.

- ✨ **Koosoleku taimer**: Iga päeva salvestatud ajad saab pärast kinnitust korraga kustutada taimeri hüpikaknas või põhiakna taimeripaneelis.

- ✨ **Zoomi koosolekuhaldur (beeta, Windows)**: Uus tõstetud käte abiline. Koosoleku ajal jälgib M³ Zoomi osalejate loendis tõstetud käsi. Kui keegi tõstab käe, saab operaator M³-s kuvatava teate abil selle osaleja heli ühe klõpsuga sisse lülitada ning, kui ta on rääkimise lõpetanud, teise klõpsuga tema heli uuesti vaigistada ja käe langetada; tegevussaare Zoomi nupp loetleb tõstetud käed samade nuppudega. Iga toiming suunatakse Zoomis just selle osaleja reale tema täpse nime järgi ja kui kahel osalejal on sama nimi, ei puuduta M³ kumbagi. Kui koosoleku taimer on lubatud, ilmub juhataja jaoks taimeri ekraanile ka suur käsi koos osaleja nimega ning seda saab ka käsitsi sisse lülitada taimeri või Zoomi hüpikaknast. M³ õpib ühe nupuga selgeks, kuidas Zoom sinu keeles tõstetud käsi märgib (see tõstab ja langetab sinu enda käe); seda pakutakse ka seadistusabilises.

- ✨ **Koosoleku taimer**: Uus valikuline taimeri kaugkuva. Kui see on sisse lülitatud, pakub M³ kohalikus võrgus veebilehena taimeri ekraani koopiat, mida saab ainult vaadata, nii et kõnepuldi juures olev tahvelarvuti või telefon saab näidata kõnelejale järelejäänud aega, ilma et see oleks koguduse ekraanil või Zoomi jagamises. Leht järgib taimerit reaalajas (osad, koosolekueelne tagasilugemine, kell, ületatud aja värvid, käetõstmise märguanne) ning kõik juhtnupud jäävad M³-sse. Avatavad aadressid on näidatud taimeri hüpikaknas koos kopeerimisnupuga.

- ✨ **Seadistusviisard**: Seadistusviisard küsib nüüd, kas hoiad koosolekute faile mõnes pilvesalvestuse rakenduses, näiteks Dropboxis, OneDrive'is, iCloud Drive'is või Google Drive'is. Kui jah, aitab see seal jagatud kausta valida ja näitab, kuidas see töötab: M³ loob iga eelseisva koosoleku jaoks kausta, mille nimeks on koosoleku kuupäev, ja sinna pandud failid lisatakse sellele koosolekule automaatselt igas arvutis, mis seda kausta kasutab.

## v26.9.0

### ✨ Uued funktsioonid

- ✨ **Koosolekueelsed ja -järgsed kiirtoimingud**: Uus suurte nuppudega paneel aitab koosoleku eel ja vahetult pärast seda – reaalajas tagasilugemine, taustamuusika käivitamine ja peatamine ühe klõpsuga, salvestamise alustamine ja lõpetamine ning iga koguduse oma kontrollnimekiri, mis on jaotatud kategooriatesse ja mida saab muuta seadetes. Koosolekueelne paneel suletakse automaatselt, kui koosolek algab ja kontrollnimekiri on täidetud (või pärast lühikest ooteaega), ning selle saab alati ka käsitsi sulgeda.

## v26.8.0

### ✨ Uued funktsioonid

- ✨ **Kogu rakenduse ümberkujundus**: Ulatuslik visuaalne ja kasutuskogemuse värskendus dialoogiakendes, meedialistis/-pealkirjas, seadetes ja seadistusviisardis. Seadistusviisard on nüüd üles ehitatud nii, et igal ekraanil kuvatakse üks küsimus ning ekraani allosas on edenemisriba. Kõik sisestusaknad asendati ühtse, rakenduse kujundusega dialoogiaknaga ning PDF-i lehekülgede vahemiku valimiseks (väljaannetest ja lohistamise teel importimisel) kasutatakse nüüd vaba teksti sisestamise asemel pisipiltide ruudustikuga valijat. Lisati uus kiirjuhendi ringkäik, mis algab pärast seadistusviisardi lõpetamist. Samuti on värskendatud kaartide ja päiste kujundust koos tumedat režiimi arvestavate varjudega ning parandatud mitut tumeda režiimi kontrastiprobleemi (aktiivsete väljade sildid, allalaadimise edenemise protsendid).
- ✨ **Seadete leht**: Leht on ümber kujundatud kahepaneeliliseks ning sellel on uus jaotis „Globaalsed eelistused”, kuhu tõsteti automaatse uuendamise ja beetauuenduste lülitid dialoogiaknast „Sellest rakendusest” (mis on nüüd puhtalt informatiivne).
- ✨ **Nupp „Lisa juurde meediafaile”**: Lisati seade, millega saab täpselt valida, millistes koosoleku jaotistes kuvatakse otseteenupp „Lisa juurde meediafaile”, ning seade nupu kompaktse (ainult ikooniga) režiimi jaoks.
- ✨ **Meedialoend**: Lisatavad elemendid näitavad nüüd tühja ala asemel laadimise kohatäiteid, meediarühmade märgil näidatakse peidetud elementide arvu (nt „9 kirjet (2 peidetud)”), rühma sees olevaid elemente saab lohistades ümber järjestada ning väga kitsa akna korral muutuvad elemendid kompaktseteks kohtspikriga kiipideks, et rida ei oleks liiga täis.

## v26.7.7

### ✨ Uued funktsioonid

- ✨ **Meediaeelvaate kvaliteet**: Meediaeelvaade kuvab videokaadreid, kasutades kõrgekvaliteedilist vähendamist, mis kõrvaldab ebaühtlased ja udused eelvaated (eriti tekstirohke sisu puhul, nagu laulud). Eelvaade lülitub ka automaatselt välja, kui see peab ühe video puhul korduvalt korrigeerima taasesituse nihkeid, kuid seda saab ühe klõpsuga uuesti sisse lülitada.

## v26.7.6

### ✨ Uued funktsioonid

- ✨ **Koguduse piibliuurimise videote välistamine**: Lisati seade, mis võimaldab välistada koguduse piibliuurimise videod teatud väljaannetest (vaikimisi on valitud raamat **Julgelt koos Jumalaga**), koos otsingufunktsiooniga väljaannete valikuga.
- ✨ **Dokumendi leheküljenumbrid**: Väljaannete jaotises ja JWPUB-i imporditud nimekirjades kuvatakse nüüd iga dokumendi pealkirja järel selle leheküljenumber (või numbrid, kui dokumendil on mitu lehekülge). See aitab sul kiiresti leida konkreetset meediat, kui tead leheküljenumbrit, millel see asub.

## v26.7.4

### ✨ Uued funktsioonid

- ✨ **Puuduva meedia taastamine**: Meediaelementidel, mille kohalik fail on puudu (nt kustutatud vahemälu automaatse tühjendamise käigus või käsitsi eemaldatud), kuvatakse nüüd keelatud esitusnupp, märge „kadunud”, milles on nimetatud otsitav fail, ning uus tegevus „Leia fail”, mille abil saab elemendi uuesti seostada kettal oleva failiga.
- ✨ **Ühilduvushoiatus**: Lisati sulgev bänner, mis hoiatab kasutajaid peagi toetamata jäävatest operatsioonisüsteemi ja arhitektuuri kombinatsioonidest (macOS 12 Monterey ja Windows 32-bit), et nad saaksid uuendada enne, kui tulevased rakenduse värskendused nõuavad uuemat süsteemi toetust.

## v26.7.0

### ✨ Uued funktsioonid

- ✨ **Seotud heliesitus**: Lisati tugi ühe faili heli ja teise faili video üheaegseks esitamiseks. See võib olla kasulik muusikaga saadetud slaidide esitamisel.
- ✨ **Vaadatud meedia paigutused**: Lisati vaadatud meediaelementide ja jaotiste järjekorra salvestamine vaadatud kaustade vahel. See tagab, et meedianimekiri kuvatakse ühtmoodi ka siis, kui jälgitav kaust sünkroonitakse eri seadmete vahel.

## v26.6.1

### ✨ Uued funktsioonid

- ✨ **Meediaeelvaade**: Lisati reaalajas töötav meediaeelvaate kiht, mida saab sisse ja välja lülitada seadete menüüs või ekraanil kuvatavas hüpikaknas.
- ✨ **Meedia otsimine**: Meedia nimekirja on lisatud kiirotsingukast, mis võimaldab meediat pealkirja järgi kiiresti üles leida. Selle kasutamiseks piisab, kui kasutada otsingu jaoks tavapärast klahvikombinatsiooni (Ctrl+F või Cmd+F).
- ✨ **Seadete filtreerimine**: Seadete lehele on lisatud filtri lahter, mis võimaldab seadeid otsida märksõna või kategooria järgi. Selle kasutamiseks klõpsake lihtsalt seadete lehe paremas ülemises nurgas asuvat otsingunuppu või kasutage otsinguks tavapärast klahvikombinatsiooni (Ctrl+F või Cmd+F). See võimaldab teil leida seadeid märksõna või kategooria järgi.
- ✨ **Hoiatus taustamuusika kattumise kohta**: Lisati hoiatus, kui meedia käivitatakse ajal, mil taustamuusika juba mängib. Kasutajad saavad teate kaudu taustamuusika peatada.

## v26.6.0

### ✨ Uued funktsioonid

- ✨ **Taimer**: Lisati analoogkuva režiimid ja ajastamise aruande staatus.
- ✨ **Profiilid**: Lisati profiili seadete import ja eksport täpsemates seadetes ja seadistusviisardis.
- ✨ **Meediaaken**: Lisati tugi meediaakna automaatseks peitmiseks pärast taasesitust, kui see oli algselt peidetud. See on kasulik näiteks siis, kui kaugjuhtimispulti kasutav esineja soovib pilte näidata.

## v26.5.0

### ✨ Uued funktsioonid

- ✨ **PDF-failide import**: Dialoogiaknasse „Väljaande meedia” on lisatud uus PDF-failide importimise protsess, mis võimaldab soovi korral importida väljaande PDF-versiooni automaatselt eraldi piltidena.

## v26.4.8

### ✨ Uued funktsioonid

- ✨ JW Stream: Lisasime JW Streami peegeldatavate veebisaitide nimekirja.

## v26.4.0

### ✨ Uued funktsioonid

- ✨ **Koosoleku ajamõõtja**: Lisatud on uus koosoleku taimeri funktsioon. See on vabatahtlik ja soovi korral saab selle lülitada sisse täpsemates seadetes. Taimerit saab kasutada selleks, et meediaoperaator saaks jälgida koosoleku osade kestust, või selleks, et kuvada praeguse koosoleku osa kestus spetsiaalsel ekraanil, mida näeb ainult kõnepidaja.

## v26.3.0

### ✨ Uued funktsioonid

- ✨ **Mälestusõhtu Media**: Mälestusõhtu meedia automaatne allalaadimine on nüüd beetaversioonist väljas! Rakendus laadib automaatselt alla mälestusõhtu tervitusvideo ja pildi, mida näidatakse mälestusõhtu ajal, kui need on saadaval valitud keeles.
- ✨ **Taasesituskiirus**: Lisati taasesituskiiruse reguleerimine koos visuaalse indikaatoriga ja käsitsi taastamise funktsiooniga. See funktsioon on nähtav ainult juhul, kui see on täpsemates seadetes sisse lülitatud.
- ✨ **Pinyin-laulud**: Lisati lüliti, millega saab hiina keeles peetavatel koosolekutel laule pinyin-lauludega asendada.

## v26.2.0

### ✨ Uued funktsioonid

- ✨ **Kettaruumi kontroll** – Lisatud funktsioon, mis jälgib kettaruumi ja annab märku, kui vaba ruumi on vähe.

## v26.1.5

### ✨ Uued funktsioonid

- ✨ **Mälestusõhtu meedia**: Vali mälestusõhtu päev ja rakendus laadib alla automaatselt taustapildi ja sissejuhatava video toetatud keeltes.

## v26.1.0

### ✨ Uued funktsioonid

- ✨ **Koosolekute ajakava automaatne sünkroniseerimine**: Lisatud on võimalus sünkroniseerida koosolekute kuupäevad ja kellaajad automaatselt ametliku veebisaidiga. See funktsioon on vaikimisi sisse lülitatud ja seda saab käsitsi käivitada või välja lülitada täpsemates seadetes.
- ✨ **Tulevased muudatused ajakavas**: Rakendus sisaldab nüüd tulevasi muudatusi ajakavas, kui loote koguduse veebisaidi otsingut kasutades, kui see on saadaval.
- ✨ **Masinaüleste installatsioonide jagatud vahemälu**: Masinaüleste installatsioonide puhul kasutatakse nüüd vaikimisi ühist andmekaustu, mis optimeerib salvestusruumi ja ribalaiuse kasutamist sama arvuti mitme kasutaja vahel.

## v25.12.2

### ✨ Uued funktsioonid

- ✨ **Suumimis-/panorameerimisnupud**: Lisatud võimalus suumimis- ja panorameerimisnuppe pidevaks reguleerimiseks alla vajutada ja hoida.

## v25.12.0

### ✨ Uued funktsioonid

- ✨ **Mitme valiku kontekstimenüü**: Lisatud tugi parema hiireklõpsuga menüü toimingutele, kui on valitud mitu meediaelementi.
- ✨ **Klaviatuuri kiirklahvid**: Lisatud `Ctrl/Cmd+A` kõigi meediumite valimiseks, `H` valitud meediumite peitmiseks ja `Shift+Üles/Alla` klaviatuuri valikute navigeerimiseks.
- ✨ **Vahitorni õppevideo seaded**: Lisatud säte, mis võimaldab välistada vahitorni lisadest õppevideod.
- ✨ **Kokkuvõtlikud osad**: Lisatud võimalus kokku võtta osad, mis ei ole seotud koosolekute päevadega, et saada selgem ülevaade.
- ✨ **JW Events veebisait**: Lisati võimalus esitada JW Events veebisait lisaks peamisele ametlikule veebisaidile.
- ✨ **Esitusloendi importimise kohandamine**: võimaldab kohandada eesliidet, mis lisatakse meediaelementidele JW esitusloendite importimisel.
- ✨ **Veebisaidi peegeldamise navigeerimine**: Lisatud lüliti, mis navigeerib automaatselt meedialoendisse pärast veebisaidi peegeldamise peatamist.
- ✨ **OBS salvestamise juhtimisfunktsioonid**: Lisatud võimalus juhtida OBS salvestusi.
- ✨ **Aasta teksti eelvaade**: Lisati võimalus vaadata eelvaadet järgmise aasta tekstile alates iga aasta detsembrist.
- ✨ **Uuendusteated**: Lisatud hoiatusteated, kui kasutatakse beetaversiooni või kui uuendused on keelatud, ning parandatud uuenduste allalaadimise edenemise kuvamine.
- ✨ **Riistvarakiirenduse seaded**: Lisatud on võimalus riistvarakiirenduse vajadusel püsivalt välja lülitada.

## v25.11.0

### ✨ Uued funktsioonid

- ✨ **JWPUB meedia valik**: Lisatud võimalus valida JWPUB failidest üksikuid meediafaile.
- ✨ **Meediaakna automaatne teravustamine**: Lisatud valikuline seade, mis teravustab meediaakna automaatselt pärast ekraani jagamist Zoomis.
- ✨ **Kursori ülekanne teleriekraanile**: täiustatud veebisaidi akna kursori ülekanne, mis tagab hiirekursori parema nähtavuse teleriekraanil.
- ✨ **Koosoleku salvestamine**: Lisatud uus koosoleku salvestamise funktsioon, millega saab juhtida välist salvestusrakendust.
- ✨ **Saidi otsing**: Lisatud võimalus otsida saidil meediat või väljaandeid nutika otsingu abil.
- ✨ **Lihtne väljaannete käsitsi importimine**: Lisati võimalus importida hõlpsalt väljaandeid ametlikult veebisaidilt, näiteks ajakirju, raamatuid, kavasid ja kutseid.
- ✨ **Viipekeele parandused**: Lisatud kinnitus enne viipekeele failide terviklikku esitamist ja tugi mitme klippi valimiseks, näiteks kui mitu lõiku tuleb järjest lugeda.
- ✨ **Klipi navigeerimine**: Lisati klippide loendi elementidele kestuse kuvamine ja parandati klippide navigeerimist.
- 🛠️ **Meedia kuvamine**: tagab, et meedia kuvatakse taasesituse alguses, isegi kui see oli varem peidetud.

## v25.10.1

### ✨ Uued funktsioonid

- ✨ **Seadistusviisard – suumimise samm**: Seadistusviisardisse lisati suumimise integreerimise samm, et hõlbustada esialgset konfigureerimist.
- ✨ **Ekraanivalija täiustused**: Näita ekraani hüpikaknas täpne visuaalne esitus kõigist ekraanidest, samuti peaakna praegune suurus ja asukoht. See lihtsustab õige ekraani valimist, millel meediaaken peaks kuvatama.
- ✨ **Meediaakna eelistus**: Rakendus mäletab nüüd eelistatud ekraani, millel meediaaken peaks kuvatama, kui kasutaja on selle määranud.

## v25.10.0

### ✨ Uued funktsioonid

- ✨ **Esitus alustatakse pausiga**: Lisati uus seade, mis võimaldab esitust alustada pausiga, mis võib olla kasulik AV-operaatoritele, et nad saaksid enne meedia esituse alustamist meediaaknas oma seadistused valmis seada (nt alustada Zoom-i jagamist).
- ✨ **Uuenduste teated**: kasutajad saavad nüüd uuendustest teateid rakenduse siseselt kuvatava bänneri kaudu, mis võimaldab kasutajal uuendused kohe installida, selle asemel et oodata rakenduse järgmist taaskäivitamist.
- ✨ **Kohandatud sündmused**: Lisatud valikulised sündmuste jaoks ühendused, mis võivad käivitada klaviatuurilühendeid, kui tuvastatakse teatud sündmused. See võib olla kasulik AV-operaatoritele, et teha automaatselt toiminguid väljaspool rakendust. Näiteks võiks projektoreid kasutavates auditooriumides lülitada nutikad tuled sisse ja välja enne ja pärast meedia esitamist või käivitada pärast koosoleku viimase laulu esitamist skript, et automatiseerida erinevad toimingud Zoom-koosolekul.

## v25.9.1

### ✨ Uued funktsioonid

- ✨ **Meediaaken alati esikohal ja täisekraani režiim**: parandatud ja täiustatud meediaakna alati esikohal olemise funktsioon, mis kohandub dünaamiliselt vastavalt täisekraani režiimile.
- ✨ **Kuupäeva kuvamise formaadi seadistus**: Lisatud seadistus kuupäeva kuvamise formaadi määramiseks.
- ✨ **Meedia üleminekud**: Rakendatud on meedia kuvamise üleminekud, mis asendavad varem kasutatud järsemaid üleminekuid mustaks.
- ✨ **Muusika automaatne peatamine**: Optimeeritud taustamuusika automaatse peatamise toimimine, et see toimiks ühtmoodi olenemata sellest, kas muusika käivitati automaatselt või mitte
- ✨ **macOS klõpsamine mitteaktiivsetel akendel**: lubatud hiireklõpsamine macOS-i peaaknas, mis peaks lihtsustama rakenduse juhtimist isegi siis, kui see ei ole fookuses.

## v25.9.0

### ✨ Uued funktsioonid

- ✨ **Allalaadimise hüpikakna täiustused**: Lisati värskendamise nupp ja allalaadimise hüpikaknas allalaadimiste rühmitamine kuupäeva järgi.
- ✨ **Vaadatud meedia järjekorra mälu**: Lisati vaadatud meediaelementide järjekorra mälu.

## v25.8.3

### ✨ Uued funktsioonid

- ✨ **Meediaakna üleminekud**: Lisatud on uus täiustatud säte, mis võimaldab meediaaknal sujuvalt sisse ja välja tuhmuda, pakkudes sõbralikumat visuaalseid üleminekuid.
- ✨ **Pildi kestuse kontroll ja esituse jälgimine**: Lisatud pildi kestuse kontroll ja esituse jälgimise võimalus korduvate osade jaoks.

## v25.8.1

### ✨ Uued funktsioonid

- ✨ **Kohandatud meediajaotised**: Täielik süsteem kohandatud meediajaotiste loomiseks, redigeerimiseks ja haldamiseks, värvide kohandamise ja drag-and-drop-funktsiooniga ümberjärjestamise võimalusega.
- ✨ **Meedia jaotised**: Lisage meedia nimekirjadesse pealkirjadega jaotised, et neid paremini organiseerida, kasutades ülemise/alumise paigutuse valikuid.
- ✨ **Jaotise kordusrežiim**: võimaldab pidevat taasesitust kindlate jaotiste piires, et saavutada sujuv meedia esitus.
- ✨ **Zoom-koostöö**: ekraani jagamise automaatne käivitamine/peatamine kooskõlas meedia taasesitusega.

## v25.7.0

### ✨ Uued funktsioonid

- Uusi funktsioone ei ole selles uuenduses!

## 25.6.0

### ✨ Uued funktsioonid

- ✨ **Mobiilse ühenduse seaded**: Lisatud uus säte, mis vähendab allalaadimisribalaiuse kasutust mobiilsetel internetiühendustel.
- ✨ **Parandatud voogesituse meediahaldus**: Parem tugi voogesituse meediale, vähendades viivitustega seotud probleeme.

## 25.5.0

### ✨ Uued funktsioonid

- 🖼️ **OBS viivitusvalik piltide jaoks**: Lisa OBS Studio seadistus, et viivitada stseeni muutusi piltide kuvamisel, parandades üleminekuid.
- 🔊 **.m4a audioformaadi toetus**: Lisatud ühilduvus `.m4a` audiofailidele, et laiendada toetatud meediatüüpe.

## 25.4.0

### ✨ Uued funktsioonid

- 🇵🇭 **Uus keel: Tagalog**: Lisati tugi tagalogi keelele, mis laiendab rakenduse mitmekeelsuse võimekust.
- 🎞 **.m4v-videoformaadi toetus**: Programm toetab meedia ühilduvuse parandamiseks `.m4v` failide taasesitamist.

## 25.3.1

### ✨ Uued funktsioonid

- 🌏 **Uus keel: Korea**: Lisatud toetus korea keelele, laiendades ligipääsetavust rohkematele kasutajatele.

## 25.3.0

### ✨ Uued funktsioonid

- 🎵 **Taustamuusika mängimine koos videotega**: Luba taustamuusika mängimist videote vaatamise ajal jätkata.
- 🎥 **Kaamerapilt viipekeelse meedia jaoks**: Lisage võimalus kuvada meediaaknas kaameravoogu spetsiaalselt viipekeelsetele kasutajatele.
- 📅 **Automaatne mälestusõhtu kuupäev ja taust**: Automaatselt tuvastab ja seab mälestusõhtupäeva ning valmistab ette mälestusõhtu koosoleku taustapildi.
- 📜 **Ekraaniväljaande märkuste kuvamine rakenduses**: Näidake väljaande märkusi otse rakenduses, et kasutajad saaksid pärast uuendust hõlpsasti muudatusi üle vaadata.

## 25.2.1

### ✨ Uued funktsioonid

- 🔄 **OBS-i taasühendamise katsed**: Lisati võimalus sundida OBS vajaduse korral käsitsi uuesti ühenduma.
- 🗑 **Vanade kuupäevapõhiste ekspordikaustade automaatne kustutamine**: Aegunud kuupäevapõhised ekspordikaustad eemaldatakse automaatselt, et salvestusruum püsiks korras.

## 25.2.0

### ✨ Uued funktsioonid

- 🌍 **Süsteemi keeleseadete kasutamine vaikimisi**: Rakendus tuvastab ja kasutab automaatselt süsteemi keeleseadeid, et kasutuskogemus oleks isikupärasem.
- 🏷 **Siltide tugi eksporditud meedia jaoks**: Eksporditud meediafailidele lisatakse metaandmete sildid, et neid oleks lihtsam korrastada.
- 🔄 **Automaatne üleminek beetaversioonilt stabiilsele**: Vajaduse korral saab beetaversioonilt automaatselt stabiilsele versioonile tagasi minna.
- 🌐 **Uusimate MEPS-i keeleindeksite hankimine**: Uusimad MEPS-i keeleindeksid hangitakse otse ametlikult veebisaidilt, et keeletugi oleks alati ajakohane.

## 25.1.0

### ✨ Uued funktsioonid

- 📅 **Varasemate kuupäevade avamine**: Võimaldab avada jooksva nädala varasemaid kuupäevi, mis on kasulik, kui koosolekupäev on nädala sees hilisemaks nihutatud.
- 🛑 **Veabänner OBS Studio jaoks**: Kui OBS Studio pole koosolekupäeval ühendatud, kuvatakse veabänner, et kasutajad saaksid sellest kohe teada.
- 📚 **Meedia rühmitamine väljaannete kaupa**: Samale viidatud väljaandele kuuluv meedia rühmitatakse kokku, et meedia ülevaade oleks selgem ja paremini korrastatud.
- 🎵 **Hoiatus korduvate laulude kohta**: Kui nädalavahetuse koosoleku meedialoendis on mõni laul rohkem kui üks kord, kuvatakse hoiatus.
- 🔄 **Tulevaste ajakavamuudatuste planeerimine**: Võimaldab planeerida koosolekute ajakava tulevasi muudatusi, mis on kasulik iga-aastaste ajakavamuudatuste puhul või siis, kui ringkonnaülevaataja külastab naaberkogudust.

## 24.11.0

### ✨ Uued funktsioonid

- 🖥️ **Veebisaidi esitlemine macOS-is**: Veebisaidi esitlemine on nüüd macOS-is toetatud 🚀
- ⌨️ **Taasesituse kiirklahvid**: Lisati kiirklahvid meedia taasesituse lõpetamiseks, pausile panemiseks ja jätkamiseks 🚀
- 🌐 **Kohandatud meedia allalaadimise aadress**: Lisati võimalus määrata veebiaadress, kust meediat alla laaditakse 🚀
- 🎬 **OBS-i kiire stseenivalija**: Lisati OBS Studio kiire stseenivalija ja uuendati põhjalikult seadetes oleva stseenivalija funktsionaalsust
- 📖 **Rohkem dokumentatsiooni keeli**: Dokumentatsiooni veebisait toetab nüüd rohkem keeli

## 24.10.10

### ✨ Uued funktsioonid

- ⌨️ **Meedias liikumise kiirklahvid**: Lisati kiirklahvid järgmisele/eelmisele meediaelemendile liikumiseks
- 🖱️ **Meediaelemendi paremklõpsumenüü**: Lisati meediaelementidele paremklõpsumenüü, mille kaudu saab elemente peita ja ümber nimetada
- ✂️ **Kärbitud JWL-i esitusloendite import**: Imporditud JWL-i esitusloendites arvestatakse nüüd videote kärbitud aegu

## 24.10.9

### ✨ Uued funktsioonid

- 🗑️ **Päeva lisameedia kustutamine**: Lisati võimalus kustutada kõik valitud päevale käsitsi lisatud meediafailid
