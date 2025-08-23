# Inställningsguide {#settings-guide}

Denna omfattande guide förklarar alla inställningar som finns i M³, organiserade efter kategori. Att förstå dessa inställningar hjälper dig att konfigurera M³ för att fungera perfekt för din församlings behov.

## Programinställningar {#application-configuration}

### Appens visningsspråk {#display-language}

<!-- **Setting**: `localAppLang` -->

Välj språk för M³:s gränssnitt. Detta är oberoende av språket som används för medianedladdningar.

**Alternativ**: Alla tillgängliga gränssnittsspråk (engelska, spanska, franska osv.)

**Standard**: Engelska

### Mörkt läge {#dark-mode}

<!-- **Setting**: `darkMode` -->

Ställ in utseendet för M³.

**Alternativ**:

- Välj automatiskt efter datorns systeminställningar
- Använd alltid mörkt läge
- Använd alltid ljust läge

**Standard**: Auto

### Veckans första dag {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Ange vilken veckodag som ska vara första dagen i veckan i kalendervyn.

**Alternativ**: Söndag till lördag

**Standard**: Söndag

### Auto-start vid inloggning {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Starta automatiskt M³ när datorn startas.

**Standard**: `nej`

## Församlingsmöten {#congregation-meetings}

### Församlingsnamn {#congregation-name}

<!-- **Setting**: `congregationName` -->

Namnet på din församling. Detta används för organiserings- och visningsändamål.

**Standard**: Tom (måste ställas in under installationen)

### Mötesspråk {#meeting-language}

<!-- **Setting**: `lang` -->

Det primära språket för nedladdning av media. Detta bör matcha språket som används vid församlingens möten.

**Alternativ**: Alla tillgängliga språk som finns på Jehovas vittnens officiella websida

**Standard**: Engelska (E)

### Reservspråk {#fallback-language}

<!-- **Setting**: `langFallback` -->

Ett reservspråk att använda när mediat inte finns tillgängligt på det primära språket.

**Alternativ**: Alla tillgängliga språk som finns på Jehovas vittnens officiella websida

**Standard**: Inget

### Dag för veckomötet {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

Veckodagen då veckomötet äger rum.

**Alternativ**: Söndag till lördag

**Standard**: Inget (måste ställas in under installationen)

### Klockslag för veckomötet

<!-- **Setting**: `mwStartTime` -->

Klockslaget när veckomötet börjar.

**Format**: HH:MM (24-timmarsformat)

**Standard**: Inget (måste ställas in under installationen)

### Dag för helgmötet {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

Veckodagen då helgmötet äger rum.

**Alternativ**: Söndag till lördag

**Standard**: Inget (måste ställas in under installationen)

### Klockslag för helgmötet

<!-- **Setting**: `weStartTime` -->

Klockslaget när helgmötet börjar.

**Format**: HH:MM (24-timmarsformat)

**Standard**: Inget (måste ställas in under installationen)

### Kretsveckan {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

Veckan för nästa kretsvecka.

**Format**: MM/DD/ÅÅÅÅ

**Standard**: Inget

### Minneshögtiden {#memorial-date}

<!-- **Setting**: `memorialDate` -->

Datum för nästa minneshögtid (beta-funktion).

**Format**: MM/DD/ÅÅÅÅ

**Standard**: Hämtas automatiskt

### Ändringar av mötesschemat {#meeting-schedule-changes}

Med dessa inställningar kan du ställa in tillfälliga ändringar av mötesschemat:

- **Ändra datum**: När ändringen börjar gälla
- **Engångsändring**: Oavsett om detta är en permanent eller tillfällig ändring
- **Ny veckomötesdag**: Ny veckodag för veckomötet
- **Ny klockslag för veckomötet**: Ny tid för veckomötet
- **Ny helgmötesdag**: Ny veckodag för helgmötet
- **Ny klockslag för helgmötet**: Ny tid för helgmötet

## Mediahämtning och uppspelning {#media-retrieval-and-playback}

### Anslutning med datapriser {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Aktivera detta om du är på en begränsad dataanslutning för att minska bandbreddsanvändningen.

**Standard**: `nej`

### Mediavisning {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Aktivera medievisningsfunktion. Detta krävs för att presentera media på en andra bildskärm.

**Standard**: `nej`

### Bakgrundsmusik {#settings-guide-background-music}

#### Aktivera musik {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Aktivera bakgrundsmusik.

**Standard**: `Ja`

#### Autostart av musik {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Starta bakgrundsmusik automatiskt när M³ startar.

**Standard**: `Ja`

#### Meeting Stop Buffer {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

How many seconds before meeting start time to stop background music.

**Range**: 0-300 seconds

**Default**: 60 seconds

#### Music Volume {#music-volume}

<!-- **Setting**: `musicVolume` -->

Volume level for background music (1-100%).

**Default**: 100%

### Cache Management {#cache-management}

#### Enable Extra Cache {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Enable additional caching for better performance.

**Standard**: `nej`

#### Cache Folder {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Custom location for storing cached media files.

**Default**: System default location

#### Enable Cache Auto-Clear {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Automatically clear old cached files to save disk space.

**Standard**: `Ja`

### Folder Monitoring {#settings-guide-folder-monitoring}

#### Enable Folder Watcher {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Monitor a folder for new media files and automatically add them to M³.

**Standard**: `nej`

#### Folder to Watch {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

The folder path to monitor for new media files.

**Default**: Empty

## Integrations {#integrations}

### Zoom Integration {#settings-guide-zoom-integration}

#### Enable Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Enable Zoom meeting integration features.

**Standard**: `nej`

#### Screen Share Shortcut {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Keyboard shortcut to trigger Zoom screen sharing.

**Standard**: Inget

### OBS Studio Integration {#settings-guide-obs-integration}

#### Enable OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Enable OBS Studio integration for automatic scene switching.

**Standard**: `nej`

:::warning Important Note

**Audio Configuration Required**: The OBS Studio integration only handles screen sharing. Audio from M³ media is **not automatically transmitted** to Zoom participants when using OBS Studio. You must configure Zoom's Original Audio settings or use "Share Computer Sound" to ensure meeting participants can hear the media. See the [User Guide](/user-guide#audio-configuration) for detailed audio setup instructions.

**Note**: The Zoom integration uses Zoom's native screen sharing which handles audio more seamlessly than OBS Studio integration.

:::

#### OBS Port {#obs-port}

<!-- **Setting**: `obsPort` -->

The port number for connecting to OBS Studio WebSocket.

**Standard**: Inget

#### OBS Password {#obs-password}

<!-- **Setting**: `obsPassword` -->

The password for OBS Studio WebSocket connection.

**Standard**: Inget

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

:::warning Important Note

**Audio Configuration Required**: OBS Studio integration only handles video/scene switching. Audio from M³ media is **not automatically transmitted** to Zoom or OBS. The video stream works like a virtual camera without sound, just like a webcam. You must configure Zoom's Original Audio settings or use "Share Computer Sound" to ensure meeting participants can hear the media. See the [User Guide](/user-guide#audio-configuration) for detailed audio setup instructions.

**Alternative**: Consider using the Zoom integration instead, as it uses Zoom's native screen sharing which handles audio more seamlessly.

:::

## Advanced Settings {#advanced-settings}

### Keyboard Shortcuts {#settings-guide-keyboard-shortcuts}

#### Enable Keyboard Shortcuts {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Enable customizable keyboard shortcuts for media control.

**Standard**: `nej`

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

**Standard**: `nej`

#### Maximum Resolution {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximum resolution for downloaded media files.

**Options**: 240p, 360p, 480p, 720p

**Default**: 720p

#### Include Printed Media {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Include media from the printed publications in media downloads.

**Standard**: `Ja`

#### Exclude Footnotes {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Exclude footnote images from media downloads when possible.

**Standard**: `nej`

#### Exclude media from the Teaching brochure {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclude media from the Teaching (th) brochure from media downloads.

**Standard**: `Ja`

### Subtitles {#subtitles}

#### Enable Subtitles {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Enable subtitle support for media playback.

**Standard**: `nej`

#### Subtitle Language {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Language for subtitles (can be different from media language).

**Alternativ**: Alla tillgängliga språk som finns på Jehovas vittnens officiella websida

**Standard**: Inget

### Media Export {#settings-guide-media-export}

#### Enable Media Auto-Export {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Automatically export media files to a specified folder.

**Standard**: `nej`

#### Media Export Folder {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Folder path where media files will be automatically exported.

**Default**: Empty

#### Convert Files to MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

Convert exported media files to MP4 format for better compatibility.

**Standard**: `nej`

### Danger Zone {#danger-zone}

:::warning Varning

These settings should only be changed if you understand their implications.

:::

#### Disable Media Fetching {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Completely disable automatic media downloads. Use this only for profiles that will be used for special events or other custom setups.

**Standard**: `nej`

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
