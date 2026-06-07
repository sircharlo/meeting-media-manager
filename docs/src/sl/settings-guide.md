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

### Oblika datuma {#date-format}

<!-- **Setting**: `localDateFormat` -->

Oblika, ki jo aplikacija uporablja za prikaz datumov.

**Primer**: D MMMM YYYY

**Privzeto**: D MMMM YYYY

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

Datum naslednje spominske slovesnosti.

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

### Samodejne posodobitve urnika shodov {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

Ko je ta funkcija omogočena, M³ občasno preveri uradno spletno mesto Jehovovih prič, če je prišlo do kake spremembe dneva in ure shodov, ter samodejno posodobi trenutni profil.

To deluje samo za profile, ki so bili dodani z iskanjem občine in katerih imena občin niso bila ročno spremenjena. Če je bila sinhronizacija onemogočena, ker je bilo ime občine spremenjeno, uporabi možnost **Omogoči sinhronizacijo urnika**, da profil znova povežeš.

#### Osveži urnik shodov {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Ročno sinhroniziraj trenutni in prihodnji urnik shodov s podatki z uradnega spletnega mesta.

## Pridobivanje in predvajanje multimedijske vsebine {#media-retrieval-and-playback}

### Merjena povezava {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

To možnost vklopite, če imate omejeno podatkovno povezavo, da zmanjšate porabo pasovne širine.

**Privzeto**: `false`

### Multimedijski zaslon {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Omogoči funkcijo prikazovanja multimedijske vsebine. To je potrebno za prikazovanje multimedijske vsebine na drugem zaslonu.

**Privzeto**: `false`

#### Omogoči predogled multimedijske vsebine {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Prikaži predogled multimedijskega okna v živo, ko je prikazana slika ali video.

**Privzeto**: `true`

#### Začni predvajanje v pavzi {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Videoposnetki se ob začetku predvajanja samodejno zaženejo v pavziranem stanju.

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

Koliko sekund pred začetkom shoda naj se ustavi glasba v ozadju.

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
- **Nadzor snemanja**: Prikaži kontrolnike za začetek in ustavitev OBS snemanja iz M³

:::warning Pomembno obvestilo

**Potrebna je prilagoditev zvoka**: Združevanje z OBS Studio podpira le preklapljanje prizorov. Zvok multimedijske vsebine v M³ se ne prenaša samodejno v Zoom ali OBS. Video prenos deluje kot virtualna kamera brez zvoka, podobno kot spletna kamera. Da bi lahko udeleženci shoda slišali zvok, morate nastaviti avdionastavitve v Zoomu ali uporabiti možnost »Share Computer Sound«. Podrobna navodila najdete v [uporabniškem priročniku](/user-guide#audio-configuration).

**Alternativa**: Razmislite raje o združevanju z Zoomom, saj ta uporablja Zoomovo lastno deljenje zaslona, ki zvok obdeluje bolj brezhibno.

:::

### Dogodki po meri {#custom-events}

#### Omogoči dogodke po meri {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Omogoči bližnjice po meri, ki se sprožijo, ko je zaznan določen dogodek (npr. ko se multimedijska vsebina začne predvajati, pavzira ali ustavi).

**Privzeto**: `false`

#### Bližnjice za dogodke po meri {#custom-event-shortcuts}

##### Bližnjica ob predvajanju multimedijske vsebine {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Bližnjica, ki se sproži, ko se multimedijska vsebina začne predvajati.

**Privzeto**: Prazno

##### Bližnjica ob pavziranju multimedijske vsebovine {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Bližnjica, ki se sproži, ko se multimedijska vsebina pavzira.

**Privzeto**: Prazno

##### Bližnjica ob ustavitvi multimedijske vsebovine {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Bližnjica, ki se sproži, ko se multimedijska vsebina ustavi.

**Privzeto**: Prazno

##### Bližnjica ob zadnji pesmi {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Bližnjica, ki se sproži, ko je med shodom predvajana zadnja pesem.

**Privzeto**: Prazno

### Posnetki shodov {#meeting-recordings}

#### Omogoči združevanje z zunanjo aplikacijo za snemanje {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Dovoli, da M³ upravlja ločeno aplikacijo za snemanje s pomočjo tipkovnih bližnjic. To ne snema znotraj M³. Ko v pojavnem oknu za snemanje shoda pritisneš na **Začni snemanje** ali **Ustavi snemanje**, M³ pošlje nastavljene bližnjice.

Ta možnost je skrita, kadar je omogočen OBS nadzor snemanja. Če uporabljaš OBS Studio, uporabi OBS nadzor snemanja v OBS združevanju.

**Privzeto**: `false`

#### Bližnjice za snemanje in mapa {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Nastavi tipkovno bližnjico za začetek snemanja, izbirno bližnjico za ustavitev snemanja ter mapo, v katero zunanja aplikacija shranjuje posnetke. Če bližnjica za ustavitev ni določena, M³ ponovno uporabi bližnjico za začetek snemanja. Ko je mapa nastavljena, M³ prikaže gumb za njen odprtje.

### Časovnik shodov {#meeting-timer}

#### Omogoči časovnik shodov {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Omogoči ločeno okno časovnika za merjenje posameznih delov shoda. To je funkcija v beta fazi in jo je treba omogočiti samo, če je lokalno odobrena.

**Privzeto**: `false`

#### Obnašanje okna časovnika {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Nastavi, ali se okno časovnika odpre samodejno, ali časovniki za udeležence privzeto štejejo navzgor ali navzdol, ali ura uporablja 12‑urni ali 24‑urni format ter ali je trenutna vrednost časovnika prikazana na gumbu časovnika v orodni vrstici.

#### Prikazi časovnika {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Izberi analogni ali digitalni prikaz za prikaz trenutnega časa in odštevalne časovnike. Opozorilni indikator odštevanja lahko med zadnjo minuto postopoma obarva analogni odštevalni krog v opozorilno barvo.

#### Odštevalnik do shoda in stanje urnika {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Prikaži odštevalnik pred načrtovanimi shodi in po želji prikazuj, ali program shoda prehiteva ali zaostaja. The meeting countdown appears only on the timer display, not on the main media display.

#### Timer Appearance and Overtime {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Customize the timer text size and colors, and configure overtime indicators such as alternate colors, blinking, and showing only the elapsed overtime amount in count-up mode.

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

### Multimedijski zaslon {#media-display}

#### Omogoči prehode z zatemnitvijo {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Omogoči postopne prehode (fade-in/fade-out) pri prikazu ali skrivanju okna za multimedijsko vsebino.

**Privzeto**: `true`

#### Enable Playback Speed Control {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Allow audio and video playback speed to be adjusted from the media item's context menu.

**Privzeto**: `false`

#### Skrij logotip multimedijske vsebine {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Skrij logotip v oknu z multimedijsko vsebino.

**Privzeto**: `false`

#### Največja ločljivost {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Največja ločljivost za preneseno multimedijsko vsebino.

**Options**: 240p, 360p, 480p, 720p, 1080p

**Privzeto**: 720p

#### Vključi tiskane medije {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Vključi multimedijsko vsebino iz tiskanih publikacij v prenose.

**Privzeto**: `true`

#### Izključi podčrtne opombe {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Iz prenosov izključi slike v podčrtnih opombah, kadar je to mogoče.

**Privzeto**: `false`

#### Exclude Additional Watchtower Study Videos {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Exclude additional videos that are referenced in Watchtower Study paragraphs.

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

### Profile Settings Transfer {#profile-settings-transfer}

Export the current profile's settings to a JSON file or import a previously exported profile settings file. Uvoz zamenja trenutne nastavitve profila.

### Nevarno območje {#danger-zone}

:::warning Opozorilo

Te nastavitve spreminjajte le, če razumete njihove posledice.

:::

#### Osnovni URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Osnovna domena, ki se uporablja za prenos publikacij in multimedijske vsebine.

**Privzeto**: `jw.org`

#### Disable Hardware Acceleration {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Disable hardware acceleration after restarting M³. This may help with graphical glitches or crashes on some systems, but is not otherwise recommended.

**Privzeto**: `false`

#### Suppress Hardware Acceleration Reminder {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Hide the reminder to re-enable hardware acceleration after it has been manually disabled.

**Privzeto**: `false`

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
