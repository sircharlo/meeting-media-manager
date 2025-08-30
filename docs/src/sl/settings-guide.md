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

Enable the media display functionality. This is required to present media on a second monitor.

**Privzeto**: `false`

### Background Music {#settings-guide-background-music}

#### Enable Music {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Enable background music functionality.

**Default**: `true`

#### Auto-Start Music {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Automatically start background music when M³ launches if appropriate.

**Default**: `true`

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

**Privzeto**: `false`

#### Cache Folder {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Custom location for storing cached media files.

**Default**: System default location

#### Enable Cache Auto-Clear {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Automatically clear old cached files to save disk space.

**Default**: `true`

### Folder Monitoring {#settings-guide-folder-monitoring}

#### Enable Folder Watcher {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Monitor a folder for new media files and automatically add them to M³.

**Privzeto**: `false`

#### Folder to Watch {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

The folder path to monitor for new media files.

**Default**: Empty

## Integrations {#integrations}

### Zoom Integration {#settings-guide-zoom-integration}

#### Enable Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Enable Zoom meeting integration features.

**Privzeto**: `false`

#### Screen Share Shortcut {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Keyboard shortcut to trigger Zoom screen sharing.

**Privzeto**: Prazno

### OBS Studio Integration {#settings-guide-obs-integration}

#### Enable OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Enable OBS Studio integration for automatic scene switching.

**Privzeto**: `false`

:::warning Important Note

**Audio Configuration Required**: The OBS Studio integration only handles screen sharing. Audio from M³ media is **not automatically transmitted** to Zoom participants when using OBS Studio. You must configure Zoom's Original Audio settings or use "Share Computer Sound" to ensure meeting participants can hear the media. See the [User Guide](/user-guide#audio-configuration) for detailed audio setup instructions.

**Note**: The Zoom integration uses Zoom's native screen sharing which handles audio more seamlessly than OBS Studio integration.

:::

#### OBS Port {#obs-port}

<!-- **Setting**: `obsPort` -->

The port number for connecting to OBS Studio WebSocket.

**Privzeto**: Prazno

#### OBS Password {#obs-password}

<!-- **Setting**: `obsPassword` -->

The password for OBS Studio WebSocket connection.

**Privzeto**: Prazno

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

**Privzeto**: `false`

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

**Privzeto**: `false`

#### Maximum Resolution {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximum resolution for downloaded media files.

**Options**: 240p, 360p, 480p, 720p

**Default**: 720p

#### Include Printed Media {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Include media from the printed publications in media downloads.

**Default**: `true`

#### Exclude Footnotes {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Exclude footnote images from media downloads when possible.

**Privzeto**: `false`

#### Exclude media from the Teaching brochure {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclude media from the Teaching (th) brochure from media downloads.

**Default**: `true`

### Subtitles {#subtitles}

#### Enable Subtitles {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Enable subtitle support for media playback.

**Privzeto**: `false`

#### Subtitle Language {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Language for subtitles (can be different from media language).

**Možnosti**: Vsi jeziki, ki so na voljo na uradnem spletnem mestu Jehovovih prič.

**Privzeto**: Prazno

### Media Export {#settings-guide-media-export}

#### Enable Media Auto-Export {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Automatically export media files to a specified folder.

**Privzeto**: `false`

#### Media Export Folder {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Folder path where media files will be automatically exported.

**Default**: Empty

#### Convert Files to MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

Convert exported media files to MP4 format for better compatibility.

**Privzeto**: `false`

### Danger Zone {#danger-zone}

:::warning Opozorilo

These settings should only be changed if you understand their implications.

:::

#### Disable Media Fetching {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Completely disable automatic media downloads. Use this only for profiles that will be used for special events or other custom setups.

**Privzeto**: `false`

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
