# Vodnik po nastavitvah {#settings-guide}

Ta izčrpen vodnik pojasnjuje vse nastavitve, ki so na voljo v M³, razvrščene po kategorijah. Razumevanje teh nastavitev vam bo pomagalo nastaviti M³ tako, da bo popolnoma ustrezal potrebam vaše občine.

## Nastavitev aplikacije {#application-configuration}

### Jezik uporabniškega vmesnika {#display-language}

<!-- **Setting**: `localAppLang` -->

Izberite jezik za uporabniški vmesnik M³. Ta je neodvisen od jezika, ki se uporablja za prenos multimedijske vsebine.

**Možnosti**: Vsi razpoložljivi jeziki uporabniškega vmesnika (angleščina, španščina, francoščina itd.)

**Privzeto**: angleščina

### Temni način {#dark-mode}

<!-- **Setting**: `darkMode` -->

Nadzorujte temo aplikacije M³.

**Možnosti**:

- Samodejno preklopite glede na nastavitve sistema
- Vedno uporabljajte temni način
- Vedno uporabljajte svetli način

**Privzeto**: Samodejno

### Prvi dan v tednu {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Nastavite, kateri dan naj se v koledarju šteje za prvi dan v tednu.

**Možnosti**: od nedelje do sobote

**Privzeto**: nedelja

### Samodejni zagon ob prijavi {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Samodejno zaženi M³ ob zagonu računalnika.

**Privzeto**: `false`

## Občinski shodi {#congregation-meetings}

### Ime občine {#congregation-name}

<!-- **Setting**: `congregationName` -->

Ime vaše občine. To se uporablja za organizacijske in predstavitvene namene.

**Privzeto**: Prazno (treba nastaviti med nastavitvijo)

### Jezik shoda {#meeting-language}

<!-- **Setting**: `lang` -->

Glavni jezik za prenos multimedijske vsebine. To bi moralo ustrezati jeziku, ki se uporablja na shodih vaše občine.

**Možnosti**: Vsi jeziki, ki so na voljo na uradnem spletnem mestu Jehovovih prič.

**Privzeto**: angleščina (E)

### Nadomestni jezik {#fallback-language}

<!-- **Setting**: `langFallback` -->

Dodatni jezik, ki se uporablja, kadar multimedijska vsebina ni na voljo v osnovnem jeziku.

**Možnosti**: Vsi jeziki, ki so na voljo na uradnem spletnem mestu Jehovovih prič.

**Privzeto**: Prazno

### Dan shoda med tednom {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

Dan v tednu, ko poteka vaš shod med tednom.

**Možnosti**: od nedelje do sobote

**Privzeto**: Prazno (treba nastaviti med nastavitvijo)

### Čas shoda med tednom {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

Ura začetka vašega shoda med tednom.

**Oblika**: HH:MM (24-urni format)

**Privzeto**: Prazno (treba nastaviti med nastavitvijo)

### Dan shoda ob koncu tedna {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

Dan v tednu, ko poteka vaš shod ob koncu tedna.

**Možnosti**: od nedelje do sobote

**Privzeto**: Prazno (treba nastaviti med nastavitvijo)

### Čas shoda ob koncu tedna {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

Ura začetka vašega shoda ob koncu tedna.

**Oblika**: HH:MM (24-urni format)

**Privzeto**: Prazno (treba nastaviti med nastavitvijo)

### Teden obiska okrajnega nadzornika {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

Teden naslednjega obiska okrajnega nadzornika.

**Oblika**: DD.MM.LLLL

**Privzeto**: Prazno

### Datum spominske slovesnosti {#memorial-date}

<!-- **Setting**: `memorialDate` -->

Datum naslednje spominske slovesnosti (možnost v razvoju).

**Oblika**: DD.MM.LLLL

**Privzeto**: Samodejno občasno pridobljeno

### Spremembe razporeda shodov {#meeting-schedule-changes}

Te nastavitve vam omogočajo nastavitev začasnih sprememb urnika shodov:

- **Datum spremembe**: Ko sprememba začne veljati
- **Enkratna sprememba**: Ali gre za trajno ali začasno spremembo
- **Nov dan sredi tedna**: Nov dan za shod sredi tedna
- **Novi čas sredi tedna**: Nov čas za shod sredi tedna
- **Nov dan ob koncu tedna**: Nov dan za shod ob koncu tedna
- **Nov čas ob koncu tedna**: Nov čas za shod ob koncu tedna

## Pridobivanje in predvajanje multimedijske vsebine {#media-retrieval-and-playback}

### Merjena povezava {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

To možnost vklopite, če imate omejeno podatkovno povezavo, da zmanjšate porabo pasovne širine.

**Privzeto**: `false`

### Prikaz multimedijske vsebine {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Omogoči funkcijo prikazovanja multimedijske vsebine. To je potrebno za prikazovanje multimedijske vsebine na drugem zaslonu.

**Privzeto**: `false`

### Glasba v ozadju {#settings-guide-background-music}

#### Omogoči glasbo {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Omogoči glasbo v ozadju.

**Privzeto**: `true`

#### Samodejni zagon glasbe {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Če je primerno, samodejno zaženi glasbo v ozadju ob zagonu programa M³.

**Privzeto**: `true`

#### Ustavitev glasbe pred shodom {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

How many seconds before meeting start time to stop background music.

**Obseg**: 0-300 sekund

**Privzeto**: 60 sekund

#### Glasnost glasbe {#music-volume}

<!-- **Setting**: `musicVolume` -->

Nastavitev glasnosti za glasbo v ozadju (1–100 %).

**Privzeto**: 100 %

### Upravljanje predpomnilnika {#cache-management}

#### Omogoči dodatni predpomnilnik {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Omogoči dodatno shranjevanje v predpomnilniku za boljšo zmogljivost.

**Privzeto**: `false`

#### Mapa za predpomnilnik {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Izbrana lokacija za shranjevanje multimedijske vsebine v predpomnilniku.

**Privzeto**: Sistemska privzeta lokacija

#### Omogoči samodejno čiščenje predpomnilnika {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Samodejno odstranjevanje stare multimedijske vsebine iz predpomnilnika za prihranek prostora na disku.

**Privzeto**: `true`

### Spremljanje map {#settings-guide-folder-monitoring}

#### Omogoči spremljanje mape {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Spremlja mapo glede nove multimedijske vsebine in jo samodejno doda v M³.

**Privzeto**: `false`

#### Mapa za spremljanje {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Pot do mape, ki jo je treba spremljati za novo multimedijsko vsebino.

**Privzeto**: Prazno

## Povezovanje {#integrations}

### Združevanje z Zoomom {#settings-guide-zoom-integration}

#### Omogoči Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Omogoči združevanje funkcij za shode po Zoomu.

**Privzeto**: `false`

#### Bližnjica za deljenje zaslona {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Bližnjica na tipkovnici za sprožitev deljenja zaslona prek Zooma.

**Privzeto**: Prazno

### Združevanje s programom OBS Studio {#settings-guide-obs-integration}

#### Omogoči OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Omogoči združevanje s programom OBS Studio za samodejno preklapljanje prizorov.

**Privzeto**: `false`

:::warning Pomembno obvestilo

**Potrebna je prilagoditev zvoka**: Združevanje s programom OBS Studio podpira samo deljenje zaslona. Zvok multimedijske vsebine v M³ se ne prenaša samodejno udeležencem na Zoomu. Da bi lahko udeleženci shoda slišali zvok, morate nastaviti avdionastavitve v Zoomu ali uporabiti možnost »Share Computer Sound«. Podrobna navodila najdete v [uporabniškem priročniku](/user-guide#audio-configuration).

**Opomba**: Združevanje z Zoomom uporablja Zoomovo lastno deljenje zaslona, ki zvok obdeluje bolje kot združevanje s programom OBS Studio.

:::

#### Vrata OBS {#obs-port}

<!-- **Setting**: `obsPort` -->

Številka vrat za povezavo z OBS Studio WebSocket.

**Privzeto**: Prazno

#### OBS geslo {#obs-password}

<!-- **Setting**: `obsPassword` -->

Geslo za povezavo z OBS Studio WebSocket.

**Privzeto**: Prazno

#### Prizori OBS {#obs-scenes}

Nastavite, kateri prizori OBS se uporabljajo za različne namene:

- **Prizor kamere**: Prikazuje kamero/govorniški pult
- **Prizor multimedijske vsebine**: Prikazuje multimedijsko vsebino
- **Prizor slike**: Prikazuje slike (npr. PIP prizor z multimedijsko vsebino in govornikom)

#### Napredne možnosti OBS {#obs-advanced-options}

- **Odloži slike**: Slike se delijo z OBS šele ob ročnem sproženju
- **Hitro preklapljanje**: Omogoči hiter vklop/izklop za združevanje z OBS
- **Preklopi prizor po predvajanju multimedijske vsebine**: Samodejno se vrne na prejšnji prizor po predvajanju multimedijske vsebine
- **Zapomni si prejšnji prizor**: Shrani in obnovi prejšnji prizor
- **Skrij ikone**: V uporabniškem vmesniku skrije ikone, povezane z OBS

:::warning Pomembno obvestilo

**Potrebna je prilagoditev zvoka**: Združevanje z OBS Studio podpira le preklapljanje prizorov. Zvok multimedijske vsebine v M³ se ne prenaša samodejno v Zoom ali OBS. Video prenos deluje kot virtualna kamera brez zvoka, podobno kot spletna kamera. Da bi lahko udeleženci shoda slišali zvok, morate nastaviti avdionastavitve v Zoomu ali uporabiti možnost »Share Computer Sound«. Podrobna navodila najdete v [uporabniškem priročniku](/user-guide#audio-configuration).

**Alternativa**: Razmislite raje o združevanju z Zoomom, saj ta uporablja Zoomovo lastno deljenje zaslona, ki zvok obdeluje bolj brezhibno.

:::

## Napredne nastavitve {#advanced-settings}

### Bližnjice na tipkovnici {#settings-guide-keyboard-shortcuts}

#### Omogoči bližnjice na tipkovnici {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Omogoči prilagodljive bližnjice na tipkovnici za nadzor multimedijske vsebine.

**Privzeto**: `false`

#### Bližnjice za upravljanje multimedijske vsebine {#media-control-shortcuts}

Nastavite bližnjice za predvajanje multimedijske vsebine:

- **Multimedijsko okno** - Odpri/zapri multimedijsko okno
- **Prejšnja multimedijska datoteka**: Pojdi na prejšnjo multimedijsko datoteko
- **Naslednja multimedijska datoteka**: Pojdi na naslednjo multimedijsko datoteko
- **Premor/Nadaljuj**: Začasno ustavi ali nadaljuj predvajanje
- **Ustavi predvajanje**: Ustavi predvajanje multimedijske vsebine
- **Vklop/izklop glasbe**: Vklopi/izklopi glasbo v ozadju

### Prikaz multimedijske vsebine {#media-display}

#### Skrij logotip multimedijske vsebine {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Skrij logotip v oknu z multimedijsko vsebino.

**Privzeto**: `false`

#### Največja ločljivost {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Največja ločljivost za preneseno multimedijsko vsebino.

**Možnosti**: 240p, 360p, 480p, 720p

**Privzeto**: 720p

#### Vključi tiskane medije {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Vključi multimedijsko vsebino iz tiskanih publikacij v prenose.

**Privzeto**: `true`

#### Izključi podčrtne opombe {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Iz prenosov izključi slike v podčrtnih opombah, kadar je to mogoče.

**Privzeto**: `false`

#### Izključi multimedijsko vsebino iz brošure Branje in poučevanje {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Iz prenosov izključi multimedijsko vsebino iz brošure Branje in poučevanje (th).

**Privzeto**: `true`

### Podnapisi {#subtitles}

#### Omogoči podnapise {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Omogoči podporo za podnapise med predvajanjem multimedijske vsebine.

**Privzeto**: `false`

#### Jezik podnapisov {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Jezik podnapisov (lahko se razlikuje od jezika multimedijske vsebine).

**Možnosti**: Vsi jeziki, ki so na voljo na uradnem spletnem mestu Jehovovih prič.

**Privzeto**: Prazno

### Izvoz multimedijske vsebine {#settings-guide-media-export}

#### Omogoči samodejni izvoz multimedijske vsebine {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Samodejno izvozi multimedijsko vsebino v izbrano mapo.

**Privzeto**: `false`

#### Mapa za izvoz multimedijske vsebine {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Pot do mape, kamor se multimedijska vsebina samodejno izvozi.

**Privzeto**: Prazno

#### Pretvori datoteke v MP4 {#convert-files-to-mp4}

**Nastavitve**: `convertFilesToMp4`

Pretvori izvoženo multimedijsko vsebino v format MP4 za boljšo združljivost.

**Privzeto**: `false`

### Nevarno območje {#danger-zone}

:::warning Opozorilo

Te nastavitve spreminjajte le, če razumete njihove posledice.

:::

#### Onemogoči pridobivanje vsebine {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Popolnoma onemogoči samodejni prenos multimedijske vsebine. To možnost uporabi le za profile, namenjene posebnim dogodkom ali drugim prilagojenim nastavitvam.

**Privzeto**: `false`

## Nasveti za optimalno nastavitev {#configuration-tips}

### Za nove uporabnike {#new-users}

1. Da bi nastavili osnovne nastavitve, začnite z nastavitvenim čarovnikom
2. Omogočite gumb za »Multimedijski zaslon«
3. Natančno nastavite urnik shodov
4. Nastavite združevanje s programom OBS, če uporabljate hibridne shode

### Za napredne uporabnike {#advanced-users}

1. Uporabite spremljanje map za sinhronizacijo multimedijske vsebine iz oblačne shrambe
2. Omogočite samodejni izvoz multimedijske vsebine zaradi varnostnega kopiranja
3. Nastavite bližnjice na tipkovnici za učinkovito upravljanje
4. Nastavite združevanje z Zoomom za samodejno deljenje zaslona

### Optimizacija zmogljivosti {#performance-optimization}

1. Omogočite dodatni predpomnilnik za boljše delovanje
2. Uporabite ustrezno največjo ločljivost glede na vaše potrebe
3. Nastavite samodejno čiščenje predpomnilnika, da varčujete s prostorom na disku
4. Razmislite o omejeni povezavi, če imate omejeno pasovno širino

### Odpravljanje težav {#settings-guide-troubleshooting}

- Če se multimedijska vsebina ne prenaša, preverite nastavitve urnika shodov
- Če združevanje z OBS ne deluje, preverite nastavitve vrat in gesla
- Če je delovanje počasno, poskusite omogočiti dodatni predpomnilnik ali zmanjšati ločljivost
- Če imate težave z jezikom, preverite tako jezik uporabniškega vmesnika kot jezik multimedijske vsebine
- Če udeleženci na Zoomu ne slišijo zvoka multimedijske vsebine, nastavite avdio nastavitve Zooma ali uporabite možnost »Share Computer Sound«
- **Nasvet**: Razmislite o združevanju z Zoomom namesto s programom OBS Studio, saj je upravljanje zvoka pri Zoomu enostavnejše
