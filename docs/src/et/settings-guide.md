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

Järgmise mälestusõhtu kuupäev (beeta-funktsioon).

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

## Meediafailide allalaadimine ja esitamine {#media-retrieval-and-playback}

### Mõõdetav ühendus {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Luba see, kui kasutad piiratud andmesidet, et vähendada andmekasutust.

**Vaikimisi**: `väljas`

### Meedia esitamine {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Luba meedia esitamise funktsioon. See on vajalik, kui soovid esitada meediafaile teisel monitoril.

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

**Audio seadistamine vajalik**: OBS Studio koostöö toetab ainult ekraani jagamist. M³ meediafailide heli **ei edastata automaatselt** Zoom osalejatele, kui kasutatakse OBS Studio. You must configure Zoom's Original Audio settings or use "Share Computer Sound" to ensure meeting participants can hear the media. See the [User Guide](/user-guide#audio-configuration) for detailed audio setup instructions.

**Note**: The Zoom integration uses Zoom's native screen sharing which handles audio more seamlessly than OBS Studio integration.

:::

#### OBS Port {#obs-port}

<!-- **Setting**: `obsPort` -->

The port number for connecting to OBS Studio WebSocket.

**Vaikimisi**: Tühi

#### OBS Password {#obs-password}

<!-- **Setting**: `obsPassword` -->

The password for OBS Studio WebSocket connection.

**Vaikimisi**: Tühi

#### OBS Scenes {#obs-scenes}

Configure which OBS scenes to use for different purposes:

- **Camera Scene**: Scene showing the camera/lectern
- **Media Scene**: Scene for displaying media
- **Image Scene**: Scene for displaying images (for example, a PIP scene showing both media and the speaker)

#### OBS Advanced Options {#obs-advanced-options}

- **Postpone Images**: Delay sharing images to OBS until manually triggered
- **Quick Toggle**: Enable quick on/off toggle for OBS integration
- **Switch Scene After Media**: Automatically return to previous scene after media
- **Remember Previous Scene**: Remember and restore the previous scene
- **Hide Icons**: Hide OBS-related icons in the interface

:::warning Oluline märkus

**Audio Configuration Required**: OBS Studio integration only handles video/scene switching. Audio from M³ media is **not automatically transmitted** to Zoom or OBS. The video stream works like a virtual camera without sound, just like a webcam. You must configure Zoom's Original Audio settings or use "Share Computer Sound" to ensure meeting participants can hear the media. See the [User Guide](/user-guide#audio-configuration) for detailed audio setup instructions.

**Alternative**: Consider using the Zoom integration instead, as it uses Zoom's native screen sharing which handles audio more seamlessly.

:::

## Advanced Settings {#advanced-settings}

### Keyboard Shortcuts {#settings-guide-keyboard-shortcuts}

#### Enable Keyboard Shortcuts {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Enable customizable keyboard shortcuts for media control.

**Vaikimisi**: `väljas`

#### Media Control Shortcuts {#media-control-shortcuts}

Configure shortcuts for media playback:

- **Media Window**: Open/close media window
- **Previous Media**: Go to previous media item
- **Next Media**: Go to next media item
- **Pause/Resume**: Pause or resume media playback
- **Stop Media**: Stop media playback
- **Music Toggle**: Toggle background music

### Media Display {#media-display}

#### Hide Media Logo {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Hide the logo in the media window.

**Vaikimisi**: `väljas`

#### Maximum Resolution {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximum resolution for downloaded media files.

**Options**: 240p, 360p, 480p, 720p

**Default**: 720p

#### Include Printed Media {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Include media from the printed publications in media downloads.

**Vaikimisi**: `lubatud`

#### Exclude Footnotes {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Exclude footnote images from media downloads when possible.

**Vaikimisi**: `väljas`

#### Exclude media from the Teaching brochure {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclude media from the Teaching (th) brochure from media downloads.

**Vaikimisi**: `lubatud`

### Subtitles {#subtitles}

#### Enable Subtitles {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Enable subtitle support for media playback.

**Vaikimisi**: `väljas`

#### Subtitle Language {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Language for subtitles (can be different from media language).

**Valikud**: Kõik Jehoova tunnistajate ametlikul veebisaidil kättesaadavad keeled

**Vaikimisi**: Tühi

### Media Export {#settings-guide-media-export}

#### Enable Media Auto-Export {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Automatically export media files to a specified folder.

**Vaikimisi**: `väljas`

#### Media Export Folder {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Folder path where media files will be automatically exported.

**Vaikimisi**: Tühi

#### Convert Files to MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

Convert exported media files to MP4 format for better compatibility.

**Vaikimisi**: `väljas`

### Danger Zone {#danger-zone}

:::warning Hoiatus

These settings should only be changed if you understand their implications.

:::

#### Disable Media Fetching {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Completely disable automatic media downloads. Use this only for profiles that will be used for special events or other custom setups.

**Vaikimisi**: `väljas`

## Tips for Optimal Configuration {#configuration-tips}

### For New Users {#new-users}

1. Start with the setup wizard to configure basic settings
2. Enable "Media Display Button" to access presentation features
3. Configure your meeting schedule accurately
4. Set up OBS integration if you use hybrid meetings

### For Advanced Users {#advanced-users}

1. Use folder monitoring to sync media from cloud storage
2. Enable media auto-export for backup purposes
3. Configure keyboard shortcuts for efficient operation
4. Configure Zoom integration for automatic screen sharing

### Performance Optimization {#performance-optimization}

1. Enable extra cache for better performance
2. Use appropriate maximum resolution for your needs
3. Configure cache auto-clear to manage disk space
4. Consider metered connection setting if on limited bandwidth

### Troubleshooting {#settings-guide-troubleshooting}

- If media isn't downloading, check your meeting schedule settings
- If OBS integration isn't working, verify port and password settings
- If performance is slow, try enabling extra cache or reducing resolution
- If you're having language issues, check both interface and media language settings
- If Zoom participants can't hear media audio, configure Zoom's Original Audio settings or use "Share Computer Sound"
- **Tip**: Consider using Zoom integration instead of OBS Studio for simpler audio handling
