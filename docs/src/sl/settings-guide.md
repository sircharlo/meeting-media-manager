# Vodnik po nastavitvah {#settings-guide}

Ta izčrpen vodnik pojasnjuje vse nastavitve, ki so na voljo v M³, razvrščene po kategorijah. Razumevanje teh nastavitev vam bo pomagalo nastaviti M³ tako, da bo popolnoma ustrezal potrebam vaše občine.

## Splošno {#application-configuration}

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

#### Omogoči sinhronizacijo urnika {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Trenutni profil znova poveže z iskanjem občine, da se lahko nadaljuje samodejno posodabljanje dneva in časa shodov. Prikazano je samo, ko je ime občine ročno spremenjeno, saj se s tem prekine povezava.

#### Osveži urnik shodov {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Ročno sinhroniziraj trenutni in prihodnji urnik shodov s podatki z uradnega spletnega mesta.

## Predogled in predvajanje {#media-retrieval-and-playback}

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

### Možnosti predvajanja in prenosa {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### Omogoči prehode z zatemnitvijo {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Omogoči postopne prehode (fade-in/fade-out) pri prikazu ali skrivanju okna za multimedijsko vsebino.

**Privzeto**: `true`

#### Omogoči nadzor hitrosti predvajanja {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Dovoli prilagajanje hitrosti predvajanja zvoka in videa iz kontekstnega menija multimedijskega elementa.

**Privzeto**: `false`

#### Skrij logotip multimedijske vsebine {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Skrij logotip v oknu z multimedijsko vsebino.

**Privzeto**: `false`

#### Največja ločljivost {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Največja ločljivost za preneseno multimedijsko vsebino.

**Možnosti**: 240p, 360p, 480p, 720p, 1080p

**Privzeto**: 720p

#### Vključi tiskane medije {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Vključi multimedijsko vsebino iz tiskanih publikacij v prenose.

**Privzeto**: `true`

#### Izključi podčrtne opombe {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Iz prenosov izključi slike v podčrtnih opombah, kadar je to mogoče.

**Privzeto**: `false`

#### Izključi dodatne videe za Preučevanje Stražnega stolpa {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Izključi dodatne videe, ki so omenjeni v odstavkih za Preučevanje Stražnega stolpa.

**Privzeto**: `false`

#### Izključi videoposnetke za Občinsko preučevanje Biblije {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Izberi publikacije, katerih navedeni videoposnetki naj se med Občinskim preučevanjem Biblije ne prikazujejo. Išči po naslovu publikacije ali simbolu.

**Privzeto**: Pogumno hodi z Bogom (`wcg`)

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

### Upravljanje predpomnilnika {#cache-management}

#### Cache Songbook Video Files {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Cache all songbook videos ahead of time for better performance. Note that this increases the size of the media cache.

**Privzeto**: `false`

#### Mapa za predpomnilnik {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Izbrana lokacija za shranjevanje multimedijske vsebine v predpomnilniku.

**Privzeto**: Sistemska privzeta lokacija

#### Omogoči samodejno čiščenje predpomnilnika {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Samodejno odstranjevanje stare multimedijske vsebine iz predpomnilnika za prihranek prostora na disku.

**Privzeto**: `true`

### Naslovi pesmi v pinjinu {#pinyin-song-titles}

#### Prednost imajo pesmi v pinjinu {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

Ko je v mapi s pesmimi v pinjinu najdena pinjin različica pesmi za shod, se ta uporabi namesto standardne pesmi.

**Privzeto**: `false`

#### Mapa s pesmimi v pinjinu {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

Mapa, ki vsebuje videoposnetke pesmi v pinjinu (npr. sjjm_s-Pi_CHS_066_r720P.mp4). Ko je najden videoposnetek v  pinjinu, ki ustreza številki pesmi za shod, se predvaja ta namesto standardne pesmi.

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

### Shared Folder (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

These settings are in the **Integrations** category.

M³ can add media to your meetings from a folder kept in sync by a cloud storage app, such as Dropbox, OneDrive, iCloud Drive or Google Drive. This is useful when others prepare media for their parts and share it with you, or when M³ is used on more than one computer. A folder on this computer or on your network works too.

M³ creates a folder inside the shared folder for each upcoming meeting, named with the meeting's date written as year-month-day (for example, `2026-03-25`). Put photos, videos, audio files or JW Library playlists in a meeting's folder, and they're added to that meeting's media list automatically. To add files for another day, create a folder for it, named the same way. Anything else in the shared folder is ignored.

:::tip Namig

Create a new folder used only for this, such as "Meeting media", and set it to always stay on this computer in your cloud storage app (often called "available offline"), so the files are ready before the meeting starts.

:::

#### Add Media From a Shared Folder {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Add the files put in the shared folder to the right meeting automatically.

**Privzeto**: `false`

#### Shared Folder {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

The folder to add media from. The setup wizard offers to set it up for you.

**Privzeto**: Prazno

#### Delete Past Meeting Folders {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

When a week is over, delete that week's dated folders, along with the files in them, to keep the shared folder tidy. Since the folder is shared, they're also deleted for everyone else who uses it. Turn this off to keep them.

**Privzeto**: `true`

## Časovnik shodov {#meeting-timer}

### Omogoči časovnik shodov {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Omogoči ločeno okno časovnika za merjenje posameznih delov shoda. To je funkcija v beta fazi in jo je treba omogočiti samo, če je lokalno odobrena.

**Privzeto**: `false`

### Obnašanje okna časovnika {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Nastavi, ali se okno časovnika odpre samodejno, ali časovniki za udeležence privzeto štejejo navzgor ali navzdol, ali ura uporablja 12‑urni ali 24‑urni format ter ali je trenutna vrednost časovnika prikazana na gumbu časovnika v orodni vrstici.

### Hiter dostop do časovnika {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Izberi, kako dostopaš do časovnika iz glavnega okna:

- **Hitre kontrole, ko se z miško ustaviš na gumbu časovnika**: ko se z miško ustaviš na gumbu časovnika v orodni vrstici, se prikaže točka, ki se trenutno meri, skupaj z gumbi Začni, Premor, Ustavi in Naslednja točka — brez odpiranja celotnega pojavnega okna časovnika. Ta možnost je privzeto vklopljena.
- **Prikaži časovni panel v glavnem oknu**: ohrani celoten seznam točk shoda in kontrole časovnika v panelu, pripetem na desni strani glavnega okna, vedno viden. Celotno pojavno okno ostane na voljo v orodni vrstici za nastavitve okna in prikaza.

### Oddaljeni časovnik {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemotePort` -->

Ko je časovnik vklopljen, M³ ponuja kopijo prikaza časovnika kot spletno stran v vašem lokalnem omrežju za tablico ali telefon na govorniškem pultu: govornik vidi preostali čas, ne da bi bil prikazan na občinskem zaslonu ali deljen prek Zooma. Stran sledi časovniku v realnem času, vključno z odštevanjem pred shodom, uro, barvami za prekoračitev in opozorilom z roko, vse kontrole pa ostanejo v M³.

Naslovi, ki jih odpreš na napravi, so navedeni v pojavnem oknu časovnika skupaj z gumbom za kopiranje. Omrežna vrata spremeni le, če jih že uporablja kak drug program. Upoštevaj, da lahko stran odpre vsakdo v istem omrežju, dokler je ta možnost vklopljena; prikazuje samo časovnik.

**Privzeto**: `false`, port `8787`

### Prikazi časovnika {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Izberi analogni ali digitalni prikaz za prikaz trenutnega časa in odštevalne časovnike. Opozorilni indikator odštevanja lahko med zadnjo minuto postopoma obarva analogni odštevalni krog v opozorilno barvo.

Prikaz odštevanja »Analogna ura z lokom trajanja« pokaže preostali čas točke kot segment na analogni uri — od minutnega kazalca do načrtovanega konca — tako da en sam pogled pokaže tako uro kot preostanek časa. Prekoračitev se prikaže kot drugi segment v barvi za prekoračitev. Prikaz velja tudi za odštevanje pred shodom in deluje v načinu štetja navzgor.

### Odštevalnik do shoda in stanje urnika {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Prikaži odštevalnik pred načrtovanimi shodi in po želji prikazuj, ali program shoda prehiteva ali zaostaja. Odštevalnik shoda je prikazan samo na prikazu časovnika, ne pa na glavnem multimedijskem zaslonu.

### Videz časovnika in prekoračitev časa {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Prilagodi velikost besedila časovnika in barve ter nastavi indikatorje prekoračitve časa, kot so alternativne barve, utripanje ali prikaz samo prekoračenega časa v načinu štetja navzgor.

## Povezovanje {#integrations}

This category also holds the [shared folder](#settings-guide-folder-monitoring) settings, for adding media from Dropbox, OneDrive, iCloud Drive or Google Drive.

### Združevanje z Zoomom {#settings-guide-zoom-integration}

#### Omogoči Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Omogoči združevanje funkcij za shode po Zoomu.

**Privzeto**: `false`

#### Bližnjica za deljenje zaslona {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Bližnjica na tipkovnici za sprožitev deljenja zaslona prek Zooma.

**Privzeto**: Prazno

#### Samodejno postavi v ospredje okno z multimedijsko vsebino {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Ko se začne deljenje zaslona v Zoomu, se okno z multimedijsko vsebino samodejno postavi v ospredje. To običajno ni potrebno, lahko pa pomaga na nekaterih sistemih, če se pogosto zgodi, da okno z multimedijsko vsebino po začetku deljenja zaslona ni v ospredju.

**Privzeto**: `false`

### Zoom Meeting Manager {#zoom-meeting-manager}

The Zoom Meeting Manager (beta, Windows only) operates the Zoom desktop app for you around each meeting. Its setup assistant, offered when you turn it on, walks you through each automation.

#### While M³ Operates Zoom {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Zoom offers no proper automation interface, so M³ drives the Zoom app through its accessibility interface, which works without the mouse for nearly everything (the participants list, its menus, the Share window). A few actions can still have to move the mouse or the focused window for a moment, for example to bring Zoom's auto-hidden toolbar back. Whenever that happens, M³ covers its own window with a "M³ is operating Zoom" notice naming what is going on, with a **Cancel this automation** button. The same notice shows during the setup assistant's checks and the self-test. A global keyboard shortcut (default `Ctrl+Alt+Escape`), active only while an automation runs, cancels it from anywhere, even while Zoom has the focus. Cancelling stops M³ at once; Zoom may then be left part-way, so check it.

**Default**: `Ctrl+Alt+Escape`

#### Raised-Hand Helper {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert`, `zoomHandRaisedPhrase` -->

During a meeting, M³ watches Zoom's participants list for raised hands. When someone raises their hand, a notification in M³ lets you **unmute** that participant with one click, and, once they are done speaking, **mute them again and lower their hand** with another. The Zoom button on the action island lists the raised hands with the same buttons. Every action goes to that participant's own row in Zoom, by their exact name; if two participants share a name, M³ touches neither.

If the [meeting timer](#meeting-timer) is enabled, a large hand with the participant's name also appears on the timer display for the chairman, and a **Hand alert** button in the timer and Zoom popups shows it by hand. This part needs the timer display; the notifications and buttons work without it.

Zoom marks raised hands in its own language, so M³ first needs to learn how: with your meeting open in Zoom, click **Learn how Zoom marks raised hands**. M³ raises your own hand, reads how Zoom marks it in the participants list and which menu entry lowers it, then lowers it again. The setup assistant offers this step too.

**Privzeto**: `false`

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

- **Do Not Automatically Share Images**: Delay sharing images to OBS until manually triggered
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

## Vmesnik in bližnjice {#interface-shortcuts}

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

### Gumb Dodaj več multimedijske vsebine {#add-more-media-button}

#### Razdelki z gumbom »Dodaj več multimedijske vsebine« {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Izberi, kateri razdelki naj imajo svoj gumb za dodajanje lastne multimedijske vsebine, poleg gumba »Dodaj multimedijo« v zgornji orodni vrstici, ki vedno deluje za vse razdelke.

**Privzeto**: Javni govor, Krščansko življenje, Okrajni nadzornik in Razdelki po meri

#### Kompaktni gumb »Dodaj več multimedijske vsebine« {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

V glavi razdelka prikaži samo ikono gumba »Dodaj več multimedijske vsebine«/»Dodaj pesem«. Ko je to onemogočeno, se poleg ikone prikaže tudi besedilo, kadar je na voljo dovolj prostora.

**Privzeto**: `true`

### Ročica za premikanje multimedijske vsebine {#media-drag-handle}

#### Prikaži ročico za premikanje {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Pri vsaki multimedijski datoteki prikaži majhno ročico za preurejanje. Multimedijske datoteke je vedno mogoče preurediti tako, da klikneš kjer koli na datoteko in jo prestaviš; ta nastavitev vpliva le na to, ali je ikona ročice prikazana ali ne.

**Privzeto**: `true`

### Hitri koraki pred in po shodu {#before-after-meeting-quick-actions}

#### Prikaži hitre korake za shod {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Prikaži ploščo pred shodom in ploščo po shodu z uporabnimi kontrolami (glasba v ozadju, snemanje) ter prilagodljivim kontrolnim seznamom za vsak shod.

**Privzeto**: `true`

Kategorije in naloge kontrolnega seznama za ploščo pred shodom in ploščo po shodu se upravljajo v tem istem razdelku v nastavitvah: dodaj, preimenuj, prerazporedi ali izbriši kategorije in naloge glede na potrebe tvoje občine.

## Napredno {#advanced-settings}

### Prenos nastavitev profila {#profile-settings-transfer}

Izvozi nastavitve trenutnega profila v datoteko JSON ali uvozi predhodno izvoženo datoteko z nastavitvami profila. Uvoz zamenja trenutne nastavitve profila.

### Nevarno območje {#danger-zone}

:::warning Opozorilo

Te nastavitve spreminjajte le, če razumete njihove posledice.

:::

#### Osnovni URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Osnovna domena, ki se uporablja za prenos publikacij in multimedijske vsebine.

**Privzeto**: `jw.org`

#### Onemogoči strojno pospeševanje {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Onemogoči strojno pospeševanje po ponovnem zagonu M³. To lahko pomaga pri grafičnih napakah ali sesutjih na nekaterih sistemih, sicer pa ni priporočeno.

**Privzeto**: `false`

#### Skrij opomnik za strojno pospeševanje {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Skrij opomnik za ponovno omogočanje strojnega pospeševanja, potem ko je bilo ročno onemogočeno.

**Privzeto**: `false`

#### Onemogoči pridobivanje vsebine {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Popolnoma onemogoči samodejni prenos multimedijske vsebine. To možnost uporabi le za profile, namenjene posebnim dogodkom ali drugim prilagojenim nastavitvam.

**Privzeto**: `false`

## Nasveti za optimalno nastavitev {#configuration-tips}

### Za nove uporabnike {#new-users}

1. Da bi nastavili osnovne nastavitve, začnite z nastavitvenim čarovnikom
2. Turn on "Enable media playback" to access presentation features
3. Natančno nastavite urnik shodov
4. Nastavite združevanje s programom OBS, če uporabljate hibridne shode

### Za napredne uporabnike {#advanced-users}

1. Use a shared folder to add media from cloud storage, such as Dropbox or OneDrive
2. Omogočite samodejni izvoz multimedijske vsebine zaradi varnostnega kopiranja
3. Nastavite bližnjice na tipkovnici za učinkovito upravljanje
4. Nastavite združevanje z Zoomom za samodejno deljenje zaslona

### Optimizacija zmogljivosti {#performance-optimization}

1. Cache songbook video files for better performance
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
