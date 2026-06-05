# Sättete juhend {#settings-guide}

See põhjalik juhend selgitab kõiki M³-s saadaval olevaid sätteid, mis on järjestatud kategooriate kaupa. Nende sättete mõistmine aitab sul M³ seadistada nii, et see vastaks täielikult teie koguduse vajadustele.

## Rakenduse seadistamine {#application-configuration}

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

### Automatic Meeting Schedule Updates {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

When enabled, M³ periodically checks the official website of Jehovah's Witnesses for meeting day and time changes and updates the current profile automatically.

This only works for profiles that were added with congregation lookup and whose congregation name has not been manually changed. If synchronization was disabled because the congregation name changed, use **Enable schedule sync** to link the profile again.

#### Refresh Meeting Schedule {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Manually synchronize the current and future meeting schedule with the information from the official website.

## Meediafailide allalaadimine ja esitamine {#media-retrieval-and-playback}

### Mõõdetav ühendus {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Luba see, kui kasutad piiratud andmesidet, et vähendada andmekasutust.

**Vaikimisi**: `väljas`

### Meedia esitamine {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Luba meedia esitamise funktsioon. See on vajalik, kui soovid esitada meediafaile teisel monitoril.

**Vaikimisi**: `väljas`

#### Enable Media Preview {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Show a live preview of the media window while an image or video is being displayed.

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

### Vahemälu haldamine {#cache-management}

#### Lisavahemälu lubamine {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Luba lisavahemälu rakenduse paremaks toimimiseks.

**Vaikimisi**: `väljas`

#### Vahemälu kaust {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Kohandatud asukoht vahemällu salvestatud meediafailide hoidmiseks.

**Vaikimisi**: Süsteemi vaikimisi valitud asukoht

#### Luba vahemälu automaatne kustutamine {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Kustuta automaatselt vanad vahemällu salvestatud failid, et säästa kettaruumi.

**Vaikimisi**: `lubatud`

### Kausta jälgimine {#settings-guide-folder-monitoring}

#### Luba kausta jälgimine {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Jälgi kausta uute meediafailide lisandumist ja lisa need automaatselt M³-e.

**Vaikimisi**: `väljas`

#### Jälgitav kaust {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Kausta tee, mida jälgida uute meediafailide jaoks.

**Vaikimisi**: Tühi

## Koostöö {#integrations}

### Koostöö Zoomiga {#settings-guide-zoom-integration}

#### Luba Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Luba Zoom-koosolekute koostöö funktsioonid.

**Vaikimisi**: `väljas`

#### Ekraani jagamise kiirklahvid {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Klaviatuuri kiirklahv Zoom ekraani jagamise käivitamiseks.

**Vaikimisi**: Tühi

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

- **Pildid edasi lükkamine**: lükka piltide jagamine OBS-iga edasi, kuni see käsitsi käivitatakse
- **Kiirlüliti**: Lülita sisse OBS-i koostöö kiirelt sisse-/välja nupu abil
- **Vaheta stseeni pärast meediat**: naase automaatselt eelmisele stseenile pärast meediat
- **Eelmise stseeni meeldejätmine**: Eelmise stseeni meeldejätmine ja taastamine
- **Peida ikoonid**: Peida OBS-iga seotud ikoonid kasutajaliidesest
- **Recording Controls**: Show controls that start and stop OBS recording from M³

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

### Meeting Recordings {#meeting-recordings}

#### Enable External Recording App Integration {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Let M³ control a separate recording application with keyboard shortcuts. This does not record inside M³; it sends the configured shortcuts when you press **Start Recording** or **Stop Recording** in the meeting recordings popup.

This option is hidden when OBS recording controls are enabled. If you use OBS Studio, use the OBS recording controls in the OBS integration instead.

**Vaikimisi**: `väljas`

#### Recording Shortcuts and Folder {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Configure the keyboard shortcut that starts recording, the optional shortcut that stops recording, and the folder where the external app saves recordings. If no stop shortcut is provided, M³ reuses the start shortcut. When a folder is configured, M³ shows a button to open it.

### Meeting Timer {#meeting-timer}

#### Enable Meeting Timer {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Enable a separate timer window for timing meeting parts. This is a beta feature and should only be enabled if approved locally.

**Vaikimisi**: `väljas`

#### Timer Window Behavior {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configure whether the timer window opens automatically, whether participant timers count up or down by default, whether the clock uses 12-hour or 24-hour time, and whether the current timer value is shown on the action island timer button.

#### Timer Display Formats {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Choose analog or digital display formats for the time of day and countdown timers. The countdown warning indicator can shift the analog countdown ring toward a warning color during the final minute.

#### Meeting Countdown and Schedule Status {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Show a countdown before scheduled meetings and optionally display whether the meeting is ahead of or behind schedule. The meeting countdown appears only on the timer display, not on the main media display.

#### Timer Appearance and Overtime {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Customize the timer text size and colors, and configure overtime indicators such as alternate colors, blinking, and showing only the elapsed overtime amount in count-up mode.

## Lisasätted {#advanced-settings}

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

### Meedia ekraan {#media-display}

#### Luba meediaakna üleminekud {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Luba üleminekuga varjamine või näitamine meediaaknas.

**Vaikimisi**: `lubatud`

#### Enable Playback Speed Control {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Allow audio and video playback speed to be adjusted from the media item's context menu.

**Vaikimisi**: `väljas`

#### Peida meedia logo {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Peida logo meediaaknas.

**Vaikimisi**: `väljas`

#### Maksimaalne resolutsioon {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Allalaaditud meediafailide maksimaalne resolutsioon.

**Options**: 240p, 360p, 480p, 720p, 1080p

**Vaikimisi**: 720p

#### Kaasa trükitud meediafialid {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Kaasa trükitud väljaannete meedia allalaadimiste hulka.

**Vaikimisi**: `lubatud`

#### Ära kaasa allmärkusi {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Võimaluse korral jäta allmärkuste pildid meedia allalaadimistest välja.

**Vaikimisi**: `väljas`

#### Exclude Additional Watchtower Study Videos {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Exclude additional videos that are referenced in Watchtower Study paragraphs.

**Vaikimisi**: `väljas`

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

### Profile Settings Transfer {#profile-settings-transfer}

Export the current profile's settings to a JSON file or import a previously exported profile settings file. Importing replaces the current profile's settings.

### Ohutsoon {#danger-zone}

:::warning Hoiatus

Neid seadeid tuleks muuta ainult juhul, kui mõistad nende mõju.

:::

#### Baas-URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Põhidomeen, mida kasutatakse väljaannete ja meedia allalaadimiseks.

**Vaikimisi**: `jw.org`

#### Disable Hardware Acceleration {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Disable hardware acceleration after restarting M³. This may help with graphical glitches or crashes on some systems, but is not otherwise recommended.

**Vaikimisi**: `väljas`

#### Suppress Hardware Acceleration Reminder {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Hide the reminder to re-enable hardware acceleration after it has been manually disabled.

**Vaikimisi**: `väljas`

#### Meedia allalaadimise keelamine {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Lülita automaatne meedia allalaadimine täielikult välja. Kasuta seda ainult profiilide puhul, mida kasutatakse erisündmusteks või muudeks eriseadistusteks.

**Vaikimisi**: `väljas`

## Nõuanded optimaalseks seadistamiseks {#configuration-tips}

### Uutele kasutajatele {#new-users}

1. Alusta määramiste abil, et seadistada põhilised sätted
2. Lülita sisse „Meedia kuvamise nupp“, et pääseda juurde nende esitluse funktsioonidele
3. Seadista koosolekute ajakava
4. Kui sa kasutad hübriidkoosolekuid, siis seadista OBS Studio koostöö

### Edasijõudnud kasutajatele {#advanced-users}

1. Kasuta kausta jälgimist, et sünkroonida meediat pilvesalvestusest
2. Luba meedia automaatne eksportimine varundamise eesmärgil
3. Seadista kiirklahvid tõhusaks tööks
4. Zoom-koostöö seadistamine automaatseks ekraani jagamiseks

### Jõudluse parandamise nipid {#performance-optimization}

1. Luba lisavahemälu rakenduse paremaks toimimiseks
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
