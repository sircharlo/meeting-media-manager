# Instellingen Gids {#settings-guide}

Deze uitgebreide gids legt alle instellingen uit die beschikbaar zijn in M³, georganiseerd per categorie. Het begrijpen van deze instellingen zal je helpen om M³ perfect te configureren voor de behoeften van je gemeente.

## Applicatie Configuratie {#application-configuration}

### Weergave Taal {#display-language}

<!-- **Setting**: `localAppLang` -->

Kies de taal voor de interface van M³. Dit is onafhankelijk van de taal die wordt gebruikt voor media downloads.

**Opties**: Alle beschikbare interfacetalen (Engels, Spaans, Frans, enz.)

**Standaard**: Engels

### Donkere modus {#dark-mode}

<!-- **Setting**: `darkMode` -->

Bepaal het weergavethema van M³.

**Opties**:

- Automatisch wisselen op basis van systeemvoorkeur
- Altijd donkere modus gebruiken
- Altijd lichte modus gebruiken

**Standaard**: Auto

### Eerste dag van de week {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Stel in welke dag in de kalenderweergave als eerste dag van de week geldt.

**Opties**: Sunday through Saturday

**Standaard**: Zondag

### Datumnotatie {#date-format}

<!-- **Setting**: `localDateFormat` -->

Notatie die wordt gebruikt om datums in de app weer te geven.

**Example**: D MMMM YYYY

**Standaard**: D MMMM YYYY

### Automatisch starten bij aanmelden {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Start M³ automatisch wanneer de computer opstart.

**Standaard**: `false`

## Congregation Meetings {#congregation-meetings}

### Gemeentenaam {#congregation-name}

<!-- **Setting**: `congregationName` -->

De naam van je gemeente. Dit wordt gebruikt voor organisatie en weergave.

**Standaard**: Leeg (moet tijdens de installatie worden ingesteld)

### Vergadertaal {#meeting-language}

<!-- **Setting**: `lang` -->

De primaire taal voor mediadownloads. Dit moet overeenkomen met de taal die in je gemeentevergaderingen wordt gebruikt.

**Opties**: All available languages from the official website of Jehovah's Witnesses

**Standaard**: Engels (E)

### Reservetaal {#fallback-language}

<!-- **Setting**: `langFallback` -->

Een secundaire taal die wordt gebruikt wanneer media niet beschikbaar is in de primaire taal.

**Opties**: All available languages from the official website of Jehovah's Witnesses

**Standaard**: Geen

### Midweek Meeting Day {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

De dag van de week waarop je doordeweekse vergadering wordt gehouden.

**Opties**: Sunday through Saturday

**Standaard**: Geen (must be set during setup)

### Midweek Meeting Time {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

De begintijd van je doordeweekse vergadering.

**Format**: HH:MM (24-hour format)

**Standaard**: Geen (must be set during setup)

### Weekend Meeting Day {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

De dag van de week waarop je weekendvergadering wordt gehouden.

**Opties**: Sunday through Saturday

**Standaard**: Geen (must be set during setup)

### Weekend Meeting Time {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

De begintijd van je weekendvergadering.

**Format**: HH:MM (24-hour format)

**Standaard**: Geen (must be set during setup)

### Circuit Overseer Week {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

De week van het volgende bezoek van de kringopziener.

**Format**: MM/DD/YYYY

**Standaard**: Geen

### Memorial Date {#memorial-date}

<!-- **Setting**: `memorialDate` -->

De datum van de volgende Avondmaalsviering (bètafunctie).

**Format**: MM/DD/YYYY

**Standaard**: Automatically retrieved periodically

### Meeting Schedule Changes {#meeting-schedule-changes}

Met deze instellingen kun je tijdelijke wijzigingen in je vergaderschema configureren:

- **Wijzigingsdatum**: Wanneer de wijziging ingaat
- **Eenmalige wijziging**: Of dit een permanente of tijdelijke wijziging is
- **New Midweek Day**: New day for midweek meeting
- **New Midweek Time**: New time for midweek meeting
- **New Weekend Day**: New day for weekend meeting
- **New Weekend Time**: New time for weekend meeting

## Media ophalen en afspelen {#media-retrieval-and-playback}

### Metered Connection {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Schakel dit in als je een beperkte dataverbinding gebruikt om bandbreedte te besparen.

**Standaard**: `false`

### Media Display {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Schakel de functie voor mediaweergave in. Dit is nodig om media op een tweede scherm te presenteren.

**Standaard**: `false`

#### Begin Playback Paused {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Start video's gepauzeerd wanneer het afspelen begint.

**Standaard**: `false`

### Background Music {#settings-guide-background-music}

#### Muziek inschakelen {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Schakel de achtergrondmuziekfunctie in.

**Standaard**: `true`

#### Muziek automatisch starten {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Start achtergrondmuziek automatisch wanneer M³ wordt gestart, indien van toepassing.

**Standaard**: `true`

#### Vergadering-stopbuffer {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Hoeveel seconden vóór de begintijd van de vergadering de achtergrondmuziek moet stoppen.

**Bereik**: 0-300 seconden

**Standaard**: 60 seconden

#### Music Volume {#music-volume}

<!-- **Setting**: `musicVolume` -->

Volumeniveau voor achtergrondmuziek (1-100%).

**Standaard**: 100%

### Cachebeheer {#cache-management}

#### Extra cache inschakelen {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Schakel extra caching in voor betere prestaties.

**Standaard**: `false`

#### Cache Folder {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Aangepaste locatie voor het opslaan van gecachte mediabestanden.

**Standaard**: Systeemstandaardlocatie

#### Cache automatisch legen inschakelen {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Verwijder oude cachebestanden automatisch om schijfruimte te besparen.

**Standaard**: `true`

### Mapbewaking {#settings-guide-folder-monitoring}

#### Mapbewaking inschakelen {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Controleer een map op nieuwe mediabestanden en voeg ze automatisch toe aan M³.

**Standaard**: `false`

#### Te bewaken map {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Het mappad dat wordt bewaakt op nieuwe mediabestanden.

**Standaard**: Empty

## Integraties {#integrations}

### Zoom Integration {#settings-guide-zoom-integration}

#### Zoom inschakelen {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Schakel Zoom-vergaderintegratiefuncties in.

**Standaard**: `false`

#### Sneltoets voor schermdelen {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Sneltoets om Zoom-schermdeling te starten.

**Standaard**: Geen

### OBS Studio Integration {#settings-guide-obs-integration}

#### OBS inschakelen {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Schakel OBS Studio-integratie in voor automatisch scènewisselen.

**Standaard**: `false`

:::warning Belangrijke opmerking

**Audioconfiguratie vereist**: De OBS Studio-integratie regelt alleen schermdeling. Audio van M³-media wordt **niet automatisch doorgestuurd** naar Zoom-deelnemers wanneer je OBS Studio gebruikt. Je moet daarom Zooms instellingen voor Originele audio configureren of "Computergeluid delen" gebruiken, zodat deelnemers de media kunnen horen. Zie de [Gebruikershandleiding](/user-guide#audio-configuration) voor gedetailleerde audio-instructies.

**Opmerking**: De Zoom-integratie gebruikt de ingebouwde schermdeling van Zoom, die audio doorgaans soepeler verwerkt dan de OBS Studio-integratie.

:::

#### OBS-poort {#obs-port}

<!-- **Setting**: `obsPort` -->

Het poortnummer voor verbinding met OBS Studio WebSocket.

**Standaard**: Geen

#### OBS-wachtwoord {#obs-password}

<!-- **Setting**: `obsPassword` -->

Het wachtwoord voor de OBS Studio WebSocket-verbinding.

**Standaard**: Geen

#### OBS-scènes {#obs-scenes}

Configure which OBS scenes to use for different purposes:

- **Camera Scene**: Scene showing the camera/lectern
- **Media Scene**: Scene for displaying media
- **Image Scene**: Scene for displaying images (for example, a PIP scene showing both media and the speaker)

#### Geavanceerde OBS-opties {#obs-advanced-options}

- **Postpone Images**: Delay sharing images to OBS until manually triggered
- **Snelschakelaar**: Schakel snel in/uit voor OBS-integratie
- **Scène wisselen na media**: Keer na media automatisch terug naar de vorige scène
- **Remember Previous Scene**: Remember and restore the previous scene
- **Hide Icons**: Hide OBS-related icons in the interface

:::warning Belangrijke opmerking

**Audioconfiguratie vereist**: OBS Studio-integratie regelt alleen video-/scènewisselingen. Audio van M³-media wordt **niet automatisch doorgestuurd** naar Zoom of OBS. De videostream werkt als een virtuele camera zonder geluid, net als een webcam. Je moet Zooms instellingen voor Originele audio configureren of "Computergeluid delen" gebruiken, zodat deelnemers de media kunnen horen. Zie de [Gebruikershandleiding](/user-guide#audio-configuration) voor gedetailleerde audio-instructies.

**Alternative**: Consider using the Zoom integration instead, as it uses Zoom's native screen sharing which handles audio more seamlessly.

:::

### Aangepaste gebeurtenissen {#custom-events}

#### Aangepaste gebeurtenissen inschakelen {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Schakel aangepaste sneltoetsen in die worden geactiveerd wanneer een specifieke gebeurtenis wordt gedetecteerd (bijv. media wordt afgespeeld, gepauzeerd of gestopt).

**Standaard**: `false`

#### Custom Event Shortcuts {#custom-event-shortcuts}

##### Play Media Shortcut {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Shortcut that is triggered when media is played.

**Standaard**: Geen

##### Pause Media Shortcut {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Shortcut that is triggered when media is paused.

**Standaard**: Geen

##### Stop Media Shortcut {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Shortcut that is triggered when media is stopped.

**Standaard**: Geen

##### Last Song Shortcut {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Shortcut that is triggered when the last song is played during a meeting.

**Standaard**: Geen

## Geavanceerde instellingen {#advanced-settings}

### Keyboard Shortcuts {#settings-guide-keyboard-shortcuts}

#### Sneltoetsen inschakelen {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Schakel aanpasbare sneltoetsen in voor mediabediening.

**Standaard**: `false`

#### Media Control Shortcuts {#media-control-shortcuts}

Configure shortcuts for media playback:

- **Media Window**: Open/close media window
- **Previous Media**: Go to previous media item
- **Next Media**: Go to next media item
- **Pause/Resume**: Pause or resume media playback
- **Stop Media**: Stop media playback
- **Music Toggle**: Toggle background music

### Media Display {#media-display}

#### Fade-overgangen voor mediavenster inschakelen {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Schakel fade-in/out-overgangen in bij het tonen of verbergen van het mediavenster.

**Standaard**: `true`

#### Hide Media Logo {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Hide the logo in the media window.

**Standaard**: `false`

#### Maximum Resolution {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximum resolution for downloaded media files.

**Opties**: 240p, 360p, 480p, 720p

**Standaard**: 720p

#### Include Printed Media {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Include media from the printed publications in media downloads.

**Standaard**: `true`

#### Exclude Footnotes {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Exclude footnote images from media downloads when possible.

**Standaard**: `false`

#### Exclude media from the Teaching brochure {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclude media from the Teaching (th) brochure from media downloads.

**Standaard**: `true`

### Subtitles {#subtitles}

#### Ondertiteling inschakelen {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Schakel ondersteuning voor ondertiteling in bij het afspelen van media.

**Standaard**: `false`

#### Subtitle Language {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Language for subtitles (can be different from media language).

**Opties**: All available languages from the official website of Jehovah's Witnesses

**Standaard**: Geen

### Media Export {#settings-guide-media-export}

#### Automatische media-export inschakelen {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Exporteer mediabestanden automatisch naar een opgegeven map.

**Standaard**: `false`

#### Media Export Folder {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Folder path where media files will be automatically exported.

**Standaard**: Empty

#### Convert Files to MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

Convert exported media files to MP4 format for better compatibility.

**Standaard**: `false`

### Danger Zone {#danger-zone}

:::warning Waarschuwing

Wijzig deze instellingen alleen als je de gevolgen ervan begrijpt.

:::

#### Base URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Base domain used to download publications and media.

**Standaard**: `jw.org`

#### Disable Media Fetching {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Completely disable automatic media downloads. Use this only for profiles that will be used for special events or other custom setups.

**Standaard**: `false`

## Tips for Optimal Configuration {#configuration-tips}

### Voor nieuwe gebruikers {#new-users}

1. Start with the setup wizard to configure basic settings
2. Schakel "Mediaweergaveknop" in om presentatieopties te gebruiken
3. Configure your meeting schedule accurately
4. Set up OBS integration if you use hybrid meetings

### Voor gevorderde gebruikers {#advanced-users}

1. Use folder monitoring to sync media from cloud storage
2. Schakel automatische media-export in voor back-updoeleinden
3. Configure keyboard shortcuts for efficient operation
4. Configure Zoom integration for automatic screen sharing

### Prestatie-optimalisatie {#performance-optimization}

1. Schakel extra cache in voor betere prestaties
2. Use appropriate maximum resolution for your needs
3. Configure cache auto-clear to manage disk space
4. Consider metered connection setting if on limited bandwidth

### Problemen oplossen {#settings-guide-troubleshooting}

- If media isn't downloading, check your meeting schedule settings
- If OBS integration isn't working, verify port and password settings
- If performance is slow, try enabling extra cache or reducing resolution
- If you're having language issues, check both interface and media language settings
- If Zoom participants can't hear media audio, configure Zoom's Original Audio settings or use "Share Computer Sound"
- **Tip**: Consider using Zoom integration instead of OBS Studio for simpler audio handling
