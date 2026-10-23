# Sättete juhend {#settings-guide}

See põhjalik juhend selgitab kõiki M³-s saadaval olevaid sätteid, mis on järjestatud kategooriate kaupa. Nende sättete mõistmine aitab sul M³ seadistada nii, et see vastaks täielikult teie koguduse vajadustele.

## Üldine {#application-configuration}

### Rakenduse keel {#display-language}

<!-- **Setting**: `localAppLang` -->

Vali M³ kasutatav keel. See ei sõltu meedia allalaadimiseks kasutatavast keelest.

**Valikud**: Kõik saadaval olevad rakenduse keeled (inglise, hispaania, prantsuse jne)

**Vaikimisi**: inglise keel

### Tume režiim {#dark-mode}

<!-- **Setting**: `darkMode` -->

Kontrolli M³ välimuse teemat.

**Valikud**:

- Vaheta automaatselt vastavalt süsteemi eelistustele
- Kasuta alati tumedat režiimi
- Kasuta alati heledat režiimi

**Vaikimisi**: Auto

### Nädala esimene päev {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Määra, millist päeva tuleks kalendri vaates pidada nädala esimeseks päevaks.

**Valikud**: pühapäevast laupäevani

**Vaikimisi**: Pühapäev

### Kuupäeva vorming {#date-format}

<!-- **Setting**: `localDateFormat` -->

Rakenduses kuupäevade kuvamiseks kasutatav formaat.

**Näiteks**: D MMMM YYYY

**Vaikimisi**: D MMMM YYYY

### Automaatne käivitamine sisselogimisel {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Käivita M³ automaatselt kui arvuti käivitub.

**Vaikimisi**: `väljas`

## Koguduse koosolekud {#congregation-meetings}

### Koguduse nimi {#congregation-name}

<!-- **Setting**: `congregationName` -->

Koguduse nimi. Seda kasutatakse organiseerimiseks ja kuvamiseks.

**Vaikimisi**: tühi (tuleb määrata seadistamise ajal)

### Koosoleku keel {#meeting-language}

<!-- **Setting**: `lang` -->

Meediafailide allalaadimise peamine keel. See peaks vastama koguduse koosolekutel kasutatavale keelele.

**Valikud**: Kõik Jehoova tunnistajate ametlikul veebisaidil kättesaadavad keeled

**Vaikimisi**: inglise keel (Eng)

### Varukeel {#fallback-language}

<!-- **Setting**: `langFallback` -->

Teine keel, mida kasutatakse, kui meedia ei ole kättesaadav esimeses keeles.

**Valikud**: Kõik Jehoova tunnistajate ametlikul veebisaidil kättesaadavad keeled

**Vaikimisi**: Tühi

### Nädalasisene koosoleku päev {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

Nädala päev, mil toimub nädalasisene koosolek.

**Valikud**: pühapäevast laupäevani

**Vaikimisi**: tühi (tuleb määrata seadistamise ajal)

### Nädalasisene koosoleku aeg {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

Nädalasisese koosoleku algusaeg.

**Formaat**: HH:MM (24-tundi)

**Vaikimisi**: tühi (tuleb määrata seadistamise ajal)

### Nädalavahetuse koosoleku päev {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

Nädala päev, mil toimub nädalavahetuse koosolek.

**Valikud**: pühapäevast laupäevani

**Vaikimisi**: tühi (tuleb määrata seadistamise ajal)

### Nädalavahetuse koosoleku aeg {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

Nädalavahetuse koosoleku algusaeg.

**Formaat**: HH:MM (24-tundi)

**Vaikimisi**: tühi (tuleb määrata seadistamise ajal)

### Ringkonnaülevaataja külastusnädal {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

Nädal, millal toimub järgmine ringkonnaülevaataja külastus.

**Formaat**: MM/DD/YYYY

**Vaikimisi**: Tühi

### Mälestusõhtu kuupäev {#memorial-date}

<!-- **Setting**: `memorialDate` -->

Järgmise mälestusõhtu kuupäev.

**Formaat**: MM/DD/YYYY

**Vaikimisi**: laaditakse alla regulaarselt

### Koosoleku aegade muudatused {#meeting-schedule-changes}

Need seaded võimaldavad seadistada ajutisi muudatusi koosolekute ajakavas:

- **Muutmise kuupäev**: Millal muutus jõustub
- **Ühekordne muudatus**: kas tegemist on püsiva või ajutise muudatusega
- **Uus nädalasisese koosoleku päev**: uus päev nädalasiseseks koosolekuks
- **Uus nädalasisese koosoleku aeg**: uus aeg nädalasiseseks koosolekuks
- **Uus nädalavahetuse koosoleku päev**: uus päev nädalavahetuse koosolekuks
- **Uus nädalavahetuse koosoleku aeg**: uus aeg nädalavahetuse koosolekuks

### Koosolekute ajakava automaatsed uuendused {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

Kui see funktsioon on sisse lülitatud, kontrollib M³ regulaarselt Jehoova tunnistajate ametlikku veebisaiti koosolekute kuupäevade ja kellaaegade muudatuste suhtes ning uuendab profiili automaatselt.

See toimib ainult nende profiilide puhul, mis on lisatud koguduse otsingu abil ja mille koguduse nime ei ole käsitsi muudetud. Kui sünkroniseerimine lülitati välja koguduse nime muutumise tõttu, kasuta valikut **Luba ajakava sünkroniseerimine**, et profiil uuesti ühendada.

#### Luba ajakava sünkroniseerimine {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Seob praeguse profiili uuesti koguduse otsinguga, et koosolekupäevade ja -aegade automaatsed uuendused saaksid jätkuda. Kuvatakse ainult siis, kui koguduse nime on käsitsi muudetud, sest just see katkestab seose.

#### Värskenda koosolekute ajakava {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Sünkroniseeri praegune ja tulevane koosolekute ajakava käsitsi ametliku veebisaidi andmetega.

## Meedia & taasesitamine {#media-retrieval-and-playback}

### Mõõdetav ühendus {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Luba see, kui kasutad piiratud andmesidet, et vähendada andmekasutust.

**Vaikimisi**: `väljas`

### Meedia esitamine {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Luba meedia esitamise funktsioon. See on vajalik, kui soovid esitada meediafaile teisel monitoril.

**Vaikimisi**: `väljas`

#### Luba meedia eelvaade {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Näita meediaakna reaalajas eelvaadet pildi või video kuvamise ajal.

**Vaikimisi**: `lubatud`

#### Alusta taasesitust - peatatud {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Alusta videote taasesitamist pausi seisundis, kui taasesitus algab.

**Vaikimisi**: `väljas`

### Taustamuusika {#settings-guide-background-music}

#### Luba taustamuusika {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Luba taustamuusika esitamise funktsioon.

**Vaikimisi**: `lubatud`

#### Automaatne taustamuusika {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Käivita taustamuusika automaatselt, kui M³ käivitub, kui see on asjakohane.

**Vaikimisi**: `lubatud`

#### Taustamuusika lõpp {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Mitu sekundit enne koosoleku algust taustamuusika lõppeb.

**Vahemik**: 0–300 sekundit

**Vaikimisi**: 60 sekundit

#### Taustamuusika helitugevus {#music-volume}

<!-- **Setting**: `musicVolume` -->

Taustamuusika helitugevus (1–100%).

**Vaikimisi**: 100%

### Taasesituse ja allalaadimise valikud {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### Luba meediaakna üleminekud {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Luba üleminekuga varjamine või näitamine meediaaknas.

**Vaikimisi**: `lubatud`

#### Luba taasesituse kiiruse reguleerimine {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Võimaldab heli- ja videomaterjali taasesituskiiruse reguleerimist meediaelemendi kontekstimenüüst.

**Vaikimisi**: `väljas`

#### Peida meedia logo {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Peida logo meediaaknas.

**Vaikimisi**: `väljas`

#### Maksimaalne resolutsioon {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Allalaaditud meediafailide maksimaalne resolutsioon.

**Valikud**: 240p, 360p, 480p, 720p, 1080p

**Vaikimisi**: 720p

#### Kaasa trükitud meediafialid {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Kaasa trükitud väljaannete meedia allalaadimiste hulka.

**Vaikimisi**: `lubatud`

#### Ära kaasa allmärkusi {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Võimaluse korral jäta allmärkuste pildid meedia allalaadimistest välja.

**Vaikimisi**: `väljas`

#### Jäta välja täiendavad Vahitorni õppevideod {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Ära lisa videoid, millele viidatakse Vahitorni uurimise lõikudes.

**Vaikimisi**: `väljas`

#### Välista koguduse piibliuurimise videod {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Vali väljaanded, mille viidatud videoid koguduse piibliuurimise ajal ei näidata. Otsi väljaande pealkirja või tähise järgi.

**Vaikimisi**: Walk Courageously With God (`wcg`)

#### Ära kaasa meediat "Õpeta armastusega" brošüürist {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Ära kaasa meediafaile "Õpeta armastusega" (th) brošüürist allalaadimiste hulka.

**Vaikimisi**: `lubatud`

### Subtiitrid {#subtitles}

#### Luba subtiitrid {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Luba subtiitrid meedia taasesitamisel.

**Vaikimisi**: `väljas`

#### Subtiitrite keel {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Subtiitrite keel (võib erineda meedia keelest).

**Valikud**: Kõik Jehoova tunnistajate ametlikul veebisaidil kättesaadavad keeled

**Vaikimisi**: Tühi

### Vahemälu haldamine {#cache-management}

#### Laulude videofailide vahemälu {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Salvesta kõik laulikuvideod parema jõudluse huvides eelnevalt vahemällu. Pea meeles, et see suurendab meedia vahemälu mahtu.

**Vaikimisi**: `väljas`

#### Vahemälu kaust {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Kohandatud asukoht vahemällu salvestatud meediafailide hoidmiseks.

**Vaikimisi**: Süsteemi vaikimisi valitud asukoht

#### Luba vahemälu automaatne kustutamine {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Kustuta automaatselt vanad vahemällu salvestatud failid, et säästa kettaruumi.

**Vaikimisi**: `lubatud`

### Pinyini laulupealkirjad {#pinyin-song-titles}

#### Eelista pinyin laule {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

Kui pinyini laulude kaustast leitakse koosolekulaulu pinyini versioon, kasutatakse seda tavalise laulu asemel.

**Vaikimisi**: `väljas`

#### Pinyini laulude kaust {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

Kaust, mis sisaldab pinyini videolaule (nt `sjjm_s-Pi_CHS_066_r720P.mp4`). Kui leitakse koosolekulaulu numbrile vastav pinyini fail, esitatakse see tavalise laulu asemel.

**Vaikimisi**: Tühi

### Media Export {#settings-guide-media-export}

#### Luba meedia automaatne eksportimine {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Ekspordi meediafailid automaatselt määratud kausta.

**Vaikimisi**: `väljas`

#### Meedia ekspordi kaust {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Kaust, kuhu meediumifailid automaatselt eksporditakse.

**Vaikimisi**: Tühi

#### Salvesta failid MP4-vormingus {#convert-files-to-mp4}

**Sätted**: `convertFilesToMp4`

Salvesta eksporditud meediafailid MP4-vormingusse, et saavutada parem ühilduvus.

**Vaikimisi**: `väljas`

### Jagatud kaust (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

Need seaded on kategoorias **Koostöö**.

M³ saab lisada sinu koosolekutele meediat kaustast, mida hoiab sünkroonis pilvesalvestusrakendus, näiteks Dropbox, OneDrive, iCloud Drive või Google Drive. See on kasulik, kui teised valmistavad oma osade jaoks meediat ette ja jagavad seda sinuga või kui M³ on kasutusel rohkem kui ühes arvutis. Sobib ka kaust selles arvutis või sinu võrgus.

M³ loob jagatud kausta sisse iga eesseisva koosoleku jaoks kausta, mille nimi on koosoleku kuupäev kujul aasta-kuu-päev (näiteks `2026-03-25`). Pane fotod, videod, helifailid või JW Library esitusloendid koosoleku kausta ja need lisatakse automaatselt selle koosoleku meedialoendisse. Mõne muu päeva jaoks failide lisamiseks loo selle jaoks samamoodi nimetatud kaust. Kõike muud jagatud kaustas eiratakse.

:::tip Nõuanne

Loo uus kaust, mida kasutad ainult selleks, näiteks „Koosoleku meedia“, ja määra pilvesalvestusrakenduses, et see oleks alati selles arvutis olemas (sageli nimetatakse seda „võrguühenduseta saadaval“), et failid oleksid enne koosoleku algust valmis.

:::

#### Lisa meediat jagatud kaustast {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Lisa jagatud kausta pandud failid automaatselt õigele koosolekule.

**Vaikimisi**: `väljas`

#### Jagatud kaust {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Kaust, kust meediat lisatakse. Seadistusviisard pakub selle sinu eest seadistamist.

**Vaikimisi**: Tühi

#### Kustuta möödunud koosolekute kaustad {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

Kui nädal on läbi, kustuta selle nädala kuupäevadega kaustad koos neis olevate failidega, et jagatud kaust püsiks korras. Kuna kaust on jagatud, kustutatakse need ka kõigi teiste jaoks, kes seda kasutavad. Lülita see välja, kui soovid need alles jätta.

**Vaikimisi**: `lubatud`

## Koosoleku taimer {#meeting-timer}

### Luba koosoleku taimer {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Luba eraldi taimeri akna kasutamine koosoleku osade ajastamiseks. Taimer on beetafunktsioon ja seda tuleks lubada ainult heakskiidu korral.

**Vaikimisi**: `väljas`

### Taimeriakna käitumine {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Määrake, kas ajastuse aken avatakse automaatselt, kas osalejate taimerid loevad vaikimisi üles või alla, kas kell kasutab 12- või 24-tunnist ajavormingut ning kas ajastuse hetkeväärtus kuvatakse tegevusala ajastuse nupul.

### Kiirjuurdepääs taimerile {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Vali, kuidas põhiaknast taimerini jõuda:

- **Kiirjuhtnupud taimeri nupu kohal hõljumisel**: kui viid hiirekursori tegevussaare taimerinupu kohale, näed ajastatavat osa ning nuppe Käivita, Paus, Peata ja Järgmine osa, ilma et peaksid avama kogu taimeri hüpikakna. Vaikimisi sisse lülitatud.
- **Näita põhiaknas taimeripaneeli**: hoiab kogu koosoleku osade loendi ja taimeri juhtnupud põhiakna paremasse serva kinnitatud paneelil alati nähtaval. Akna- ja kuvaseadete jaoks jääb täielik hüpikaken tegevussaarelt endiselt kättesaadavaks.

### Taimeri kaugkuva {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemotePort` -->

Kui see on sisse lülitatud, pakub M³ kohalikus võrgus veebilehena taimeri kuva koopiat, mida saab ainult vaadata, kõnepuldi juures olevale tahvelarvutile või telefonile: kõneleja näeb järelejäänud aega, ilma et see oleks koguduse ekraanil või Zoomi jagamises. Leht järgib taimerit reaalajas, sealhulgas koosoleku-eelset loendust, kella, ajaületuse värve ja käetõstmise märguannet, ning kõik juhtnupud jäävad M³-sse.

Seadmes avatavad aadressid on loetletud taimeri hüpikaknas koos kopeerimisnupuga. Muuda porti ainult siis, kui mõni teine programm seda juba kasutab. Pea meeles, et kui see on sisse lülitatud, saab lehte avada igaüks samas võrgus; sellel ei ole midagi peale taimeri.

**Vaikimisi**: `false`, port `8787`

### Taimeri kuvamisvormingud {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Vali kellaaja ja tagasilugemistimeri jaoks analoog- või digitaalne kuvamisviis. Tagasilugemise hoiatusnäidik võib viimasel minutil muuta analoogse tagasilugemise ringi hoiatusvärviks.

Loendurivorming **Analoogkell ajakaarega** näitab osa järelejäänud aega analoogkella sihverplaadil sektorina minutiosutist kuni kavandatud lõpuni, nii et ühe pilguga näed nii kellaaega kui ka järelejäänud aega. Ületatud aeg kuvatakse teise sektorina ajaületuse värviga. See kehtib ka koosoleku-eelse loenduse kohta ja töötab ka ülespoole loendamise režiimis.

### Koosoleku taimer ja ajakava staatus {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Näita enne planeeritud koosolekuid tagasiarvestust ja vajaduse korral ka seda, kas koosolek on graafikust ees või maha jäänud. Koosoleku alguseni jäänud aeg kuvatakse ainult taimeriekraanil, mitte peamisel meediaekraanil.

### Taimeri välimus ja üle aja minek {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Saate kohandada taimeri teksti suurust ja värve ning seadistada üle aja näitajaid, nagu näiteks vahelduvad värvid, vilkumine ja ainult möödunud üle aja kuvamine loendamisrežiimis.

## Koostöö {#integrations}

Selles kategoorias on ka [jagatud kausta](#settings-guide-folder-monitoring) seaded, et lisada meediat Dropboxist, OneDrive'ist, iCloud Drive'ist või Google Drive'ist.

### Koostöö Zoomiga {#settings-guide-zoom-integration}

#### Luba Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Luba Zoom-koosolekute koostöö funktsioonid.

**Vaikimisi**: `väljas`

#### Ekraani jagamise kiirklahvid {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Klaviatuuri kiirklahv Zoom ekraani jagamise käivitamiseks.

**Vaikimisi**: Tühi

#### Keskendu automaatselt meediaaknale {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Too meediaaken automaatselt fookusesse, kui ekraani jagamine Zoomis algab. Tavaliselt pole see vajalik, kuid mõnes süsteemis võib see aidata, kui meediaaken kaotab pärast ekraani jagamise algust sageli fookuse.

**Vaikimisi**: `väljas`

### Zoomi koosolekuhaldur {#zoom-meeting-manager}

Zoomi koosolekuhaldur (beeta, ainult Windows) juhib sinu eest iga koosoleku eel ja järel Zoomi töölauarakendust. Selle seadistusabiline, mida pakutakse funktsiooni sisselülitamisel, juhendab sind läbi iga automatiseeritud toimingu.

#### Kui M³ juhib Zoomi {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Zoom ei paku korralikku automatiseerimisliidest, seega juhib M³ Zoomi rakendust selle hõlbustusliidese kaudu, mis töötab hiirt liigutamata, isegi siis, kui Zoom on oma tööriistariba peitnud. Zoom toob siiski oma akna hetkeks esiplaanile, kui M³ selle nuppe vajutab, ja hiir liigub ainult viimase abinõuna, kui Zoom ei reageeri ühelegi muule viisile. Alati, kui M³ Zoomi juhib, katab see oma akna teatega „M³ juhib Zoomi“, mis nimetab käimasoleva toimingu, ja nupuga **Tühista see automatiseeritud toiming**. Sama teadet näidatakse ka seadistusabilise kontrollide ja enesetesti ajal. Üldine kiirklahv (vaikimisi `Ctrl+Alt+Escape`), mis on aktiivne ainult automatiseeritud toimingu ajal, tühistab selle ükskõik kust, isegi kui fookus on Zoomil. Tühistamine peatab M³ kohe; Zoom võib seejärel jääda pooleli, seega kontrolli seda.

**Vaikimisi**: `Ctrl+Alt+Escape`

#### Tõstetud käte abiline {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert` -->

Koosoleku ajal jälgib M³ Zoomi osalejate loendis tõstetud käsi. Kui keegi tõstab käe, saad M³ teate kaudu ühe klõpsuga selle osaleja **mikrofoni sisse lülitada** ja pärast tema rääkimist teise klõpsuga **ta uuesti vaigistada ja käe langetada**. Tegevussaare Zoomi nupp loetleb tõstetud käed samade nuppudega. Iga toiming läheb Zoomis selle osaleja enda reale tema täpse nime järgi; kui kahel osalejal on sama nimi, ei puutu M³ kumbagi.

Kui [koosoleku taimer](#meeting-timer) on sisse lülitatud, ilmub juhataja jaoks taimeri ekraanile ka suur käsi koos osaleja nimega ning taimeri ja Zoomi hüpikakende nupp **Käetõstmise märguanne** näitab seda käsitsi. See osa vajab taimeri ekraani; teated ja nupud töötavad ka ilma selleta.

Zoom märgib tõstetud käsi oma keeles, seega peab M³ esmalt selgeks õppima, kuidas: kui sinu koosolek on Zoomis avatud, klõpsa **Õpi selgeks, kuidas Zoom tõstetud käsi märgib**. M³ tõstab sinu enda käe, loeb, kuidas Zoom seda osalejate loendis märgib ja milline menüükäsk selle langetab, ning langetab selle siis uuesti. Seda sammu pakub ka seadistusabiline.

**Vaikimisi**: `väljas`

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

### Koostöö OBS Studioga {#settings-guide-obs-integration}

#### Luba OBS Studio {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Luba OBS Studio koostöö automaatseks stseenide vahetamiseks.

**Vaikimisi**: `väljas`

:::warning Oluline märkus

**Audio seadistamine vajalik**: OBS Studio koostöö toetab ainult ekraani jagamist. M³ meediafailide heli **ei edastata automaatselt** Zoom osalejatele, kui kasutatakse OBS Studio. Sul on vaja seadistada Zoom'i originaalheli seaded või kasuta funktsiooni „Jaga arvuti heli”, tagamaks, et koosoleku osalejad kuuleksid meedia heli. Täpsed heliseadete juhised leiate [kasutusjuhendist](/user-guide#audio-configuration).

**Märkus**: Zoom-koostöö kasutab Zoom-i enda ekraani jagamise funktsiooni, mis töötleb heli sujuvamalt kui OBS Studio koostöö.

:::

#### OBS Studio port {#obs-port}

<!-- **Setting**: `obsPort` -->

OBS Studio WebSocketiga ühenduse loomiseks kasutatav pordi number.

**Vaikimisi**: Tühi

#### OBS Studio salasõna {#obs-password}

<!-- **Setting**: `obsPassword` -->

OBS Studio WebSocket-ühenduse salasõna.

**Vaikimisi**: Tühi

#### OBS Studio stseenid {#obs-scenes}

Määra, milliseid OBS-stseene kasutada erinevateks eesmärkideks:

- **Kaamera stseen**: Stseen, milles on näha kaamera/kõnepult
- **Meedia stseen**: Meedia kuvamiseks mõeldud stseen
- **Pildistseen**: piltide kuvamiseks mõeldud stseen (näiteks Pilt-Pildis-stseen, mis näitab nii meediat kui ka kõnelejat)

#### OBS Studio lisasätted {#obs-advanced-options}

- **Ära jaga automaatselt pilte**: lükka piltide jagamine OBS-i edasi, kuni see käivitatakse käsitsi
- **Kiirlüliti**: Lülita sisse OBS-i koostöö kiirelt sisse-/välja nupu abil
- **Vaheta stseeni pärast meediat**: naase automaatselt eelmisele stseenile pärast meediat
- **Eelmise stseeni meeldejätmine**: Eelmise stseeni meeldejätmine ja taastamine
- **Peida ikoonid**: Peida OBS-iga seotud ikoonid kasutajaliidesest
- **Salvestuse juhtnupud**: Näita juhtnuppe, millega saab M³-st OBS-i salvestust alustada ja lõpetada

:::warning Oluline märkus

**Audio seadistamine vajalik**: OBS Studio koostöö toetab ainult meedia ja stseenide vahetamist. M³ meediafailide heli **ei edastata automaatselt** Zoomi või OBS Studiosse. Videovoog töötab nagu virtuaalne kaamera ilma helita, täpselt nagu veebikaamera. Sul on vaja seadistada Zoom'i originaalheli seaded või kasuta funktsiooni „Jaga arvuti heli”, tagamaks, et koosoleku osalejad kuuleksid meedia heli. Täpsed heliseadete juhised leiate [kasutusjuhendist](/user-guide#audio-configuration).

**Alternatiiv**: Kaaluge Zoom-koostöö kasutamist, kuna see kasutab Zoom-i enda ekraani jagamise funktsiooni, mis töötab heliga sujuvamalt.

:::

### Kohandatud sündmused {#custom-events}

#### Luba Kohandatud sündmused {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Luba kohandatud otseteed, mis käivituvad, kui tuvastatakse teatud sündmus (nt meedia esitamine, pausile panemine või peatamine).

**Vaikimisi**: `väljas`

#### Kohandatud sündmuste otseteed {#custom-event-shortcuts}

##### Esita meedia - otsetee {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Meedia mängimisel käivituv otsetee.

**Vaikimisi**: Tühi

##### Pausil meedia - otsetee {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Meedia pausil käivituv otsetee.

**Vaikimisi**: Tühi

##### Peata meedia - otsetee {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Meedia peatamisel käivituv otsetee.

**Vaikimisi**: Tühi

##### Viimane laul - otsetee {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Klahvide otsetee, mis käivitub, kui koosoleku ajal mängitakse viimane laul.

**Vaikimisi**: Tühi

### Koosolekute salvestused {#meeting-recordings}

#### Luba välise salvestusrakenduse integreerimine {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Luba M³ juhtida klahvikombinatsioonide abil eraldi salvestusrakendust. See ei salvestata M³-s; see saadab seadistatud kiirklahvid, kui vajutad koosoleku salvestuste hüpikaknas nuppu **Salvestamise alustamine** või **Salvestamise lõpetamine**.

See valik on peidetud, kui OBS-i salvestusfunktsioonid on sisse lülitatud. Kui kasutad OBS Studiot, kasuta selle asemel OBS-i integratsiooni salvestusfunktsioone.

**Vaikimisi**: `väljas`

#### Salvestamise kiirklahvid ja kaust {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Määra salvestamise alustamiseks vajalik klahvikombinatsioon, salvestamise lõpetamiseks vajalik valikuline klahvikombinatsioon ning kaust, kuhu välisrakendus salvestused salvestab. Kui peatamise kiirklahvi pole määratud, kasutab M³ uuesti käivitamise kiirklahvi. Kui kaust on seadistatud, kuvab M³ selle avamiseks nuppu.

## Kasutajaliides & otseteed {#interface-shortcuts}

### Kiirklahvid {#settings-guide-keyboard-shortcuts}

#### Luba kiirklahvid {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Luba meedia juhtimiseks kohandatavad kiirklahvid.

**Vaikimisi**: `väljas`

#### Meedia esitamise kiirklahvid {#media-control-shortcuts}

Meedia esitamise kiirklahvide seadistamine:

- **Meedia aken**: ava/sulge meedia aken
- **Eelmine meedia**: Mine eelmise meediaelemendi juurde
- **Järgmine meedia**: Mine järgmise meediaelemendi juurde
- **Paus/Jätka**: Meedia esitamise paus või jätkamine
- **Stop Media**: Peata meedia taasesitus
- **Taustamuusika lüliti**: Lülita taustamuusika sisse või välja

### Nupp meedia lisamiseks {#add-more-media-button}

#### Koosoleku osad nupuga „Lisa juurde meediafaile“ {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Vali, millistel koosoleku osadel on oma nupp enda meedia lisamiseks, lisaks ülemise tööriistariba nupule „Lisa meediafail“, mis töötab alati kõigi osade puhul.

**Vaikimisi**: avalik kõne, „Kristlik eluviis“, ringkonnaülevaataja külastus ja kohandatud jaotised

#### Nupu „Lisa juurde meediafaile“ kompaktne režiim {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

Näita jaotiste päistes nupu „Lisa juurde meediafaile“/„Lisa laul“ asemel ainult ikooni. Kui see on välja lülitatud, kuvatakse nupul ikooni kõrval ka tekst, kui ruumi on piisavalt.

**Vaikimisi**: `lubatud`

### Meedia lohistamiskäepide {#media-drag-handle}

#### Näita meediaelementidel lohistamiskäepidemeid {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Näita igal meediaelemendil väikest käepidet, mille abil saab elemendi lohistades ümber järjestada. Meediaelemente saab alati ümber järjestada, lohistades neid ükskõik kust; see mõjutab ainult seda, kas käepideme ikooni ennast näidatakse.

**Vaikimisi**: `lubatud`

### Kiirtoimingud enne ja pärast koosolekut {#before-after-meeting-quick-actions}

#### Näita koosoleku kiirtoiminguid {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Näita enne koosolekut ja pärast koosolekut paneeli kasulike juhtnuppudega (taustamuusika, salvestamine) ning kummagi jaoks kohandatavat kontrollnimekirja.

**Vaikimisi**: `lubatud`

Mõlema paneeli kontrollnimekirja kategooriaid ja ülesandeid hallatakse samas seadete jaotises: lisa, nimeta ümber, järjesta ümber või kustuta kategooriaid ja ülesandeid vastavalt oma koguduse vajadustele.

## Lisavalikud {#advanced-settings}

### Profiili seaded – ülekandmine {#profile-settings-transfer}

Ekspordi praeguse profiili seaded JSON-failina või impordi varem eksporditud profiili seadefail. Importimine asendab praeguse profiili seaded.

### Ohutsoon {#danger-zone}

:::warning Hoiatus

Neid seadeid tuleks muuta ainult juhul, kui mõistad nende mõju.

:::

#### Baas-URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Põhidomeen, mida kasutatakse väljaannete ja meedia allalaadimiseks.

**Vaikimisi**: `jw.org`

#### Lülita riistvarakiirendus välja {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Lülita riistvarakiirendus pärast M³ taaskäivitamist välja. See võib aidata graafiliste tõrgete või süsteemi kokkujooksmise puhul mõnel süsteemil, kuid muul juhul ei ole seda soovitatav teha.

**Vaikimisi**: `väljas`

#### Riistvarakiirenduse meeldetuletuse väljalülitamine {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Peida meeldetuletus riistvarakiirenduse taaskäivitamise kohta pärast selle käsitsi väljalülitamist.

**Vaikimisi**: `väljas`

#### Meedia allalaadimise keelamine {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Lülita automaatne meedia allalaadimine täielikult välja. Kasuta seda ainult profiilide puhul, mida kasutatakse erisündmusteks või muudeks eriseadistusteks.

**Vaikimisi**: `väljas`

## Nõuanded optimaalseks seadistamiseks {#configuration-tips}

### Uutele kasutajatele {#new-users}

1. Alusta määramiste abil, et seadistada põhilised sätted
2. Esitlusfunktsioonide kasutamiseks lülita sisse „Luba meedia esitamine“
3. Seadista koosolekute ajakava
4. Kui sa kasutad hübriidkoosolekuid, siis seadista OBS Studio koostöö

### Edasijõudnud kasutajatele {#advanced-users}

1. Kasuta jagatud kausta, et lisada meediat pilvesalvestusest, näiteks Dropboxist või OneDrive'ist
2. Luba meedia automaatne eksportimine varundamise eesmärgil
3. Seadista kiirklahvid tõhusaks tööks
4. Zoom-koostöö seadistamine automaatseks ekraani jagamiseks

### Jõudluse parandamise nipid {#performance-optimization}

1. Salvesta laulikuvideod parema jõudluse huvides vahemällu
2. Kasuta oma vajadustele vastavat maksimaalset resolutsiooni
3. Seadista vahemälu automaatne tühjendamine, et hallata kettaruumi
4. Kui andmemaht on piiratud, kaalu mõõdetud ühenduse seadistamist

### Probleemide lahendamine {#settings-guide-troubleshooting}

- Kui meedia ei lae alla, kontrolli koosoleku ajakava seadeid
- Kui OBS Studio koostöö ei tööta, kontrolli porti ja parooli seadeid
- Kui programmi jõudlus on aeglane, proovi lisada täiendavat vahemälu või vähendada resolutsiooni
- Kui on keelega probleeme, kontrolli nii kasutajaliidese kui ka meedia keelesätteid
- Kui Zoom osalejad ei kuule meediaheli, vaata üle Zoom'i originaalheli seaded või kasutage funktsiooni „Jaga arvuti heli”
- **Nipp**: Kaalu OBS Studio asemel Zoom-i koostöö kasutamist, et heliga oleks lihtsam töötada
