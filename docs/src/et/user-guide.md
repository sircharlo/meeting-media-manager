# Kasutusjuhend {#user-guide}

See põhjalik kasutusjuhend aitab sul omandada kõik M³ funktsioonid, alates põhilistest seadistustest kuni keerukate meedia esitamise tehnikateni.

## Alustamine {#getting-started}

### Lae alla ja installi {#download-and-install}

Laadi alla viimane versioon [Allalaadimine] lehelt (download). See soovitab teie seadmele parima versiooni ja näitab viimast versiooni.

### Esimene käivitus {#first-launch}

Kui käivitad M³ esimest korda, juhendab sind seadistusviisard, mis konfigureerib sinu koguduse jaoks olulised seaded:

1. **Vali oma kasutajaliidese keel** – see määrab, millises keeles kuvatakse M³ menüüd ja nupud
2. **Vali profiili tüüp** – vali „Tavaline” tavapäraseks koguduse kasutamiseks või „Muu” erakorraliste sündmuste jaoks
3. **Koguduse andmete konfigureerimine** – Sisesta oma koguduse andmed või kasuta automaatset otsingufunktsiooni
4. **Koosolekute ajakava seadistamine** – seadista oma nädala keskel ja nädalavahetusel toimuvate koosolekute ajad
5. **Valikulised funktsioonid** – OBS-i koostöö, taustamuusika ja muude täiustatud funktsioonide konfigureerimine

:::tip Nõuanne

Võta seadistamiseks aega - kuid saad seadeid alati hiljem menüüs „Seaded” muuta.

:::

### Kasutajaliidese ülevaade {#main-interface}

M³ kasutajaliides koosneb mitmest põhivaldkonnast:

- **Navigatsioonimenüü** – juurdepääs erinevatele osadele ja seadistustele
- **Kalendri vaade** – sirvi meediat kuupäeva järgi
- **Meedialoend** – valitud kuupäevade meedia vaatamine ja haldamine
- **Tööriistariba** – kiire juurdepääs tavalistele funktsioonidele
- **Staatusriba** - Näitab allalaadimise edenemist, taustamuusika ja OBS Studio ühenduse staatust

## Põhimeedia haldus {#user-guide-media-management}

### Kalendri vaate mõistmine {#calendar-view}

Kalendri vaade näitab koosolekute ajakava ja kättesaadavaid meediakanaleid:

- **Koosolekute päevad** – esiletõstetud päevad näitavad, millal koosolekud on kavandatud
- **Meediaindikaatorid** – ikoonid näitavad, millised meediatüübid on saadaval
- **Kuupäeva navigeerimine** - Kasuta nooleklahve kuude vahel navigeerimiseks

### Meedia organiseerimine {#organizing-media}

M³ korraldab meedia automaatselt koosoleku tüübi ja sektsiooni järgi:

- **Koosoleku osad** – Meedia on rühmitatud koosoleku osade järgi (avalik kõne, Aarded Jumala sõnast jne)
- **Kohandatud osad** – võid luua kohandatud osad täiendavate meediafailide jaoks, kui sellel konkreetsel päeval ei ole ühtegi koosolekut plaanis

## Meedia esitlemine {#media-presentation}

### Meedia mängija avamine {#opening-media-player}

Meedia esitamine koosoleku ajal:

1. Vali kuupäev ja meedia, mida soovid esitada
2. Klõpsa nuppu „Esita” või kasuta klaviatuuril kiirklahvi
3. Meedia hakkab mängima meediaekraanil
4. Kasuta juhtnuppe meedia esitamiseks, peatamiseks või navigeerimiseks

### Meediamängija juhtimispaneel {#media-player-controls}

Meediamängija pakub põhjalikke juhtnuppe:

- **Esita/Peata** – Alusta või peata meedia taasesitust
- **Peata** – Peata taasesitus

<!-- - **Previous/Next** - Navigate between media items
- **Volume** - Adjust playback volume -->

<!-- - **Fullscreen** - Toggle fullscreen mode -->

- **Suurenda/Liiguta** – Kasuta hiirerulli suurendamiseks, lohista pildi liigutamiseks

### Täiustatud esitlusfunktsioonid {#advanced-presentation}

#### Kasutaja määratud ajastus {#custom-timing}

Määra meediale kohandatud algus- ja lõpuajad:

<!-- 1. Right-click on a media item
2. Select "Edit Timing" -->

1. Klõpsa video kestusel, mis asub pisipildi vasakus ülanurgas
2. Salvesta alguse ja lõpu ajad
3. Salvesta muudatused

#### Suurenda ja liiguta {#zoom-pan}

Piltide ja videote puhul:

- **Suum sisse/välja** – Kasuta hiirerulli või pisipildi suumikontrolle
- **Nihutamine** – Klõpsa ja lohista, et pilti ümber paigutada
- **Suurenduse lähtestamine** – Ühe klõpsuga algvaatele

#### Kiirklahvid {#user-guide-keyboard-shortcuts}

Määra endale sobivad klaviatuuri otseteed. Pane tähele, et vaikimisi otseteed puuduvad.

**Sisseehitatud meediakontrollid** (kui põhaken on fookuses ja näitab meedialoendit):

- **Tab/Shift+Tab** – Navigeerimine meediaelementide vahel
- **Nooled Üles/Alla** – Navigeeri meedialoendis
- **Tühik** – Esita/Peata meedia
- **Escape** – Peata meedia

**Kohandatavad otseteed** (kui seadetes lubatud):

- **Meedia aken**: ava/sulge meedia aken
- **Eelmine/Järgmine meedia** – Liigu meediaüksuste vahel
- **Paus/Jätka** – Juhi taasesitust
- **Peata meedia**: Peata meedia taasesitus
- **Muusika lüliti** – Juhi taustamuusikat

**Märge (\*)**: Globaalne kiirklahv – saadaval ka rakenduse fookuseta

## Koostöö Zoomiga {#user-guide-zoom-integration}

### Taustamuusika seadistamine {#background-music-setup}

Taustamuusika mängib automaatselt enne koosolekuid ja peatutab end õigel ajal:

1. **Luba muusika** – Lülita taustamuusika seadetes sisse
2. **Auto-start** – M³ käivitudes alustab muusika automaatselt, kui tingimused on täidetud
3. \*\*Koosoleku algus \*\*– Muusika peatub automaatselt enne koosoleku algust
4. **Käsijuhtimine** – Kasuta olekuribal nuppu muusika käsitsi käivitamiseks/peatamiseks
5. **Taasesituse jätkamine** – Pärast koosolekut taaskäivita muusika ühe vajutusega

## Koostöö Zoomiga {#user-guide-zoom-integration}

M³ saab Zoomiga ühilduda automaatseks ekraani jagamiseks:

1. **Luba koostöö** – Lülita seadetes Zoomi koostöö sisse
2. **Seadista otsetee** – Määra Zoomis ekraani jagamise klaviatuuri otsetee. Veendu, et „globaalne” märkeruut on Zoomis märgitud.
3. **Automaatne juhtimine** – M³ lülitab Zoomis ekraani jagamise vajadusel automaatselt sisse/välja
4. **Käsijuhtimise võimalus** – Vajadusel saad Zoomis ekraanijagamist endiselt käsitsi juhtida

## Koostöö OBS Studioga {#user-guide-obs-integration}

### OBS-i häälestus {#user-guide-obs-setup}

M³ kasutamine OBS Studioga hübriidkoosolekutel:

1. **Paigalda OBS Studio** – Laadi alla ja installi OBS Studio
2. **Luba WebSocket** – Paigalda OBS-i WebSocketi plugin, kui see pole veel olemas
3. **Seadista M³** – Sisesta M³ seadetes OBS-i port ja parool
4. **Seadista stseenid** – Loo stseenid kaamerale, meediale ja muule sisule
5. **Test** - Kontrolli, et taasesitus toimib korrektselt

### OBS stseenide haldamine {#obs-scene-management}

M³ vahetab ettekannete ajal OBS-i stseene automaatselt:

- **Kaamerastseen** – Näitab kõnepuldi/kaameravaadet
- **Meediastseen** – Kuvab meediasisu
- **Pildistseen** – Kuvab pilte (saab soovi korral edasi lükata)
- **Automaatne lülitumine** – Stseenid vahetuvad meediatüübi ja seadete järgi

### OBS täiendavad võimalused {#advanced-obs}

#### Piltide jagamise viivitus {#user-guide-postpone-images}

Selle lubamisel jagatakse pilte OBS-i alles käsitsi käivitamisel:

1. Aktiveeri „Postpone Images” OBS sätetes
2. Pilte jagatakse alles siis, kui vajutad OBS Studios nuppu nende näitamiseks. See on kasulik, kui soovid pilte esmalt näidata kohalolijatele.

#### Stseenivahetuse seaded {#user-guide-scene-switching}

Seadista, kuidas M³ stseenivahetust käsitleb:

- **Vaheta pärast meediat** – Pöördu automaatselt eelmise stseeni juurde
- **Pea meeles eelmine stseen** – Taasta stseen, mis oli meedia eel aktiivne

### Heli seadistamine hübriidkoosolekuteks {#audio-configuration}

Kui kasutad M³ OBS Studioga hübriidkoosolekutel (kohapeal + Zoom), tuleb seada heli nii, et osalejad kuuleksid meediat:

#### Zoomi heli seaded {#zoom-audio-settings}

**Enne igat koosolekut luba Zoomis Original Audio:**

1. **Ava Zoom** ja mine Sätted
2. **Audio** → **Advanced seadistus**
3. **Luba „Show in-meeting option to ‘Enable Original Sound’”**
4. \*\*Märgi „Disable echo cancellation” \*\*(esimene märkeruut)
5. **Märgi „Disable noise suppression”** (teine märkeruut)
6. **Eemalda märge „Disable high-fidelity music mode”** (kolmas märkeruut)
7. **Enne koosolekut klõpsa** „Original Audio” nuppu koosoleku juhtnuppudes

**Alternatiiv: Jaga arvuti heli** Kui Original Audio ei toimi sinu seadistuses hästi:

1. **Enne esitust ava Zoomis ekraanijagamine** → Advanced
2. **Märgi „Share computer sound”**
3. **Märkus:** Seda valikut tuleb iga uue Zoomi seansi korral uuesti lubada

\*\*Parim alternatiiv: \*\*Kaalu M³ Zoomi integratsiooni kasutamist OBS-i asemel; see kasutab Zoomi enda ekraanijagamist, mis käsitleb heli sujuvamalt ega vaja keerukat heliseadistust.

#### Miks heli tuleb eraldi seadistada {#why-audio-config}

M³ mängib meediaheli sinu arvutis, kuid seda **ei edastata automaatselt** OBS Studio videovoogu. Samal viisil käitub ka iga teine meediamängija.

**Probleem pole M³-s** – see tuleneb viisist, kuidas OBS Studio Zoomiga videot voogedastab. Videovoog toimib kui helita virtuaalkaamera, seega tuleb Zoomis arvuti heli selgesõnaliselt püüda. See eeldab kahte helikaarti; kui seda pole, ei pruugi OBS-i integratsioon sul hästi toimida.

\*\*Soovituslik: \*\*Mine üle Zoomi integratsioonile, mis lahendab heli voogedastuse loomulikult.

#### Heliprobleemide tõrkeotsing {#audio-troubleshooting}

**Levinud probleemid:**

- **Heli puudub Zoomis**: kontrolli, et Original Audio on lubatud ja õigesti seadistatud
- **Kehv helikvaliteet**: kontrolli kolme Original Audio märkeruutu (esimesed kaks sees, kolmas väljas)
- **Pärast Zoomi taaskäivitust heli ei tööta**: Original Audio tuleb igas uues sessioonis uuesti lubada

**Soovitused:**

- Testi heli seadistust ja jagamist enne koosolekut
- Koosta helisätte kontrollnimekiri
- Kasuta varuplaanina „Share Computer Sound”
- **Kaalu Zoomi koostöö kasutamist** OBS-i asemel lihtsama helihalduse nimel
- Veendu, et kõik AV-vennad tunneksid neid sätteid

## Media Import ja haldamine {#media-import}

### Oma meedia lisamine {#importing-custom-media}

Lisa oma meediafailid M³-sse:

1. **Faili import** - Kasuta importnuppu videote, piltide või helifailide lisamiseks
2. **Lohista ja kukuta** - Lohista failid M³ aknasse
3. **Kausta jälgimine** - Sea jälgitav kaust automaatseks impordiks
4. **JWPUB failid ja esitusloendid** - Impordi väljaanded ja esitusloendid
5. **Avaliku kõne meedia (S-34 / S-34mp)** – Impordi avaliku kõne meedia S‑34 või S‑34mp JWPUB-failidega

### Imporditud meedia haldamine {#managing-imported-media}

- **Korralda kuupäeva järgi** - Seo imporditud meedia kindlate kuupäevadega
- **Kohandatud jaotised** - Loo kohandatud jaotised korrastamiseks
- \*\*Muuda omadusi \*\* - Muuda nimetusi, kirjeldusi, ajastusi
- \*\*Kustutamine \*\* - Kustuta soovimatud üksused

### Audiopiibli lisamine {#audio-bible-import}

Impordi Piibli salmide helisalvestised:

1. Klõpsa „Audio Bible” nuppu
2. Vali Piibli raamat ja peatükk
3. Valida konkreetseid salme või salmide hulka
4. Laadi helifailid alla
5. Kasuta neid

## Kausta jälgimine ja eksport {#user-guide-folder-monitoring}

### Kaustajälgimise seadistamine {#folder-monitoring-setup}

Jälgi kausta uute meediafailide suhtes:

1. **Kaustaseire** - Lülita seadetes kaustajälgimine sisse
2. **Vali kaust** - Määra jälgitav kaust
3. **Automaatne import** - Uued failid lisatakse M³-e automaatselt
4. \*\*Organiseerimine \*\* - Kaustapuu kuupäevad määravad paigutuse

### Meedia eksport {#user-guide-media-export}

Ekspordi failid automaatselt jaotatud kaustadesse:

1. **Luba Auto-Export** - Lülita seadetes meedia eksport sisse
2. **Vali ekspordikaust** - Määra asukoht, kuhu salvestada
3. **Automaatne korraldus** - Failid jaotatakse kuupäeva ja jaotise järgi
4. **Vormingud** - Teisenda MP4-ks parema ühilduvuse huvides

## Veebilehe kuvamine {#website-presentation}

### Ametliku veebisaidi näitamine välistel ekraanidel: {#presenting-the-website}

Ametliku veebisaidi näitamine välistel ekraanidel:

1. **Käivita veebiesitlus** - Klõpsa veebiesitluse nuppu
2. **Teine ekraan** - Veebileht avaneb uues aknas
3. \*\*Navigeerimine \*\* - Kasuta brauseri juhtnuppe liikumiseks

### Brauseri juhtnupud {#website-controls}

- **Navigeerimine** - Tavalised brauseri liikumisnupud
- \*\*Värskenda \*\* - Laadi praegune leht uuesti
- \*\*Sulge \*\* - Välju veebiesitluse režiimist

## Lisasätted {#user-guide-advanced-features}

### Mitme koguduse tugi {#user-guide-multiple-congregations}

Halda mitut kogudust või gruppi:

1. **Loo profiilid** - Sea eri kogudustele eraldi profiilid
2. **Vaheta profiile** - asuta koguduse valikut profiilide vahetamiseks
3. **Profiilipõhised seaded** - Igal profiilil on oma seaded ja meedia
4. **Jagatud ressursid** - Võimalusel jagatakse meediafaile profiilide vahel

### Klaviatuuri otseteed {#keyboard-shortcuts-guide}

Loo endale sobivad kiirklahvid sujuvaks kasutuseks:

1. **Luba otseteed** - Lülita klaviatuuri otseteed seadetes sisse
2. **Seadista otseteed** - Pane paika levinud toimingute kiirklahvid
3. \*\*Harjuta \*\* - Õpi oma otseteed selgeks
4. \*\*Kohanda \*\* - Sea otseteed oma eelistustele vastavaks

## Probleemide lahendamine {#troubleshooting-guide}

### Levinud probleemid {#common-issues}

#### Meedia ei laadi alla {#user-guide-media-not-downloading}

- Vaata üle koosoleku ajakava seaded
- Veendu internetiühenduses
- Kontrolli, kas meedia on sinu valitud keeles saadaval

#### OBS ei ühildu {#user-guide-obs-not-working}

- Kontrolli, kas OBS WebSocket plugin on paigaldatud
- Kontrolli pordi ja parooli sätteid
- Veendu, et OBS töötab

#### Heliprobleemid Zoomis/OBS-is {#audio-issues}

- **Zoomis pole heli:** luba Original Audio Zoomi sätetes ja enne iga koosolekut
- \*\*Kehv kvaliteet: \*\*kontrolli kolme Original Audio ruutu (2 sees, 3 väljas)
- \*\*Pärast taaskäivitust ei tööta: \*\*Original Audio tuleb igal Zoomi sessioonil uuesti lubada
- **Alternatiiv**: kasuta Zoomis „Share Computer Sound” ekraanijagamisel

#### Jõudlusprobleemid {#user-guide-performance-issues}

- Kasuta suuremat vahemälu
- Vähenda maksimaalset eraldusvõimet
- Puhasta vanad vahemälufailid
- Veendu kettaruumi olemasolus

#### Keeleprobleemid {#user-guide-language-issues}

- Kontrolli meedia keelesätet
- Veendu, et keel on JW.org-is saadaval
- Proovi varukeelt
- Kontrolli kasutajaliidese keelt

### Abi ja tugi {#getting-help}

Kui tekib probleeme:

1. **Vaata dokumentatsiooni** – Uuri seda juhendit ja muud abi
2. **Otsi** - Otsi GitHubist sarnaseid teemasid
3. **Teata veast** - Loo uus teema ja kirjelda üksikasjad

## Soovitused {#best-practices}

### Enne koosolekuid {#before-meetings}

1. **Kontrolli allalaadimisi** - Veendu, et kogu meedia on alla laetud
2. **Testi seadmeid** - Veendu ekraanide/heli toimimises
3. **Valmista meedia** - Korrasta sisu – et ükski fail ei puuduks
4. **Seadista heli** - Hübriidkoosolekute puhul luba Zoomis Original Audio või „Share Computer Sound”

### Koosolekute ajal {#during-meetings}

1. **Püsi keskendunud** - Kasuta programmi ainult vajaliku meediaga
2. **Kasuta otseteid** - Kiirenda töövoogu lühiteedega
3. **Jälgi heli** - Hoia helitasemetel silm peal
4. **Ole valmis** - Pane järgmine üksus valmis
5. **Kontrolli heli** -Veendu Zoomi osalejate kuulmises

### Pärast koosolekuid {#after-meetings}

1. **Käivita taustamuusika** - Käivita taustamuusika uuesti
2. **Planeeri** - Valmistu järgmiseks korraks
3. **Sulge rakendus** - Lõpeta ja sulge meediamängija

### Regulaarne hooldus {#regular-maintenance}

1. **Uuenda M³** - Hoia rakendus värske
2. **Tühjenda vahemälu** - Vahemälu puhastamine regulaarselt
3. **Kontrolli sätteid** - Vaata aeg-ajalt üle ja uuenda
