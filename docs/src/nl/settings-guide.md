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

**Opties**: Zondag tot en met zaterdag

**Standaard**: Zondag

### Datumnotatie {#date-format}

<!-- **Setting**: `localDateFormat` -->

Notatie die wordt gebruikt om datums in de app weer te geven.

**Voorbeeld**: D MMMM YYYY

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

**Opties**: Alle beschikbare talen van de officiële website van Jehovah's Getuigen

**Standaard**: Engels (E)

### Reservetaal {#fallback-language}

<!-- **Setting**: `langFallback` -->

Een secundaire taal die wordt gebruikt wanneer media niet beschikbaar is in de primaire taal.

**Opties**: Alle beschikbare talen van de officiële website van Jehovah's Getuigen

**Standaard**: Geen

### Dag van de doordeweekse vergadering {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

De dag van de week waarop je doordeweekse vergadering wordt gehouden.

**Opties**: Zondag tot en met zaterdag

**Standaard**: Geen (moet tijdens de installatie worden ingesteld)

### Tijd van de doordeweekse vergadering {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

De begintijd van je doordeweekse vergadering.

**Formaat**: UU:MM (24-uursnotatie)

**Standaard**: Geen (moet tijdens de installatie worden ingesteld)

### Dag van de weekendvergadering {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

De dag van de week waarop je weekendvergadering wordt gehouden.

**Opties**: Zondag tot en met zaterdag

**Standaard**: Geen (moet tijdens de installatie worden ingesteld)

### Tijd van de weekendvergadering {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

De begintijd van je weekendvergadering.

**Formaat**: UU:MM (24-uursnotatie)

**Standaard**: Geen (moet tijdens de installatie worden ingesteld)

### Circuit Overseer Week {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

De week van het volgende bezoek van de kringopziener.

**Formaat**: MM/DD/JJJJ

**Standaard**: Geen

### Datum van de Avondmaalsviering {#memorial-date}

<!-- **Setting**: `memorialDate` -->

De datum van de volgende Avondmaalsviering (bètafunctie).

**Formaat**: MM/DD/JJJJ

**Standaard**: Wordt periodiek automatisch opgehaeld

### Meeting Schedule Changes {#meeting-schedule-changes}

Met deze instellingen kun je tijdelijke wijzigingen in je vergaderschema configureren:

- **Wijzigingsdatum**: Wanneer de wijziging ingaat
- **Eenmalige wijziging**: Of dit een permanente of tijdelijke wijziging is
- **Nieuwe midweekdag**: Nieuwe dag voor de doordeweekse vergadering
- **Nieuwe midweek-tijd**: Nieuwe tijd voor de doordeweekse vergadering
- **Nieuwe weekenddag**: Nieuwe dag voor de weekendvergadering
- **Nieuwe weekend-tijd**: Nieuwe tijd voor de weekendvergadering

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

#### Stopbuffer voor vergadering {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Hoeveel seconden vóór de begintijd van de vergadering de achtergrondmuziek moet stoppen.

**Bereik**: 0-300 seconden

**Standaard**: 60 seconden

#### Muziekvolume {#music-volume}

<!-- **Setting**: `musicVolume` -->

Volumeniveau voor achtergrondmuziek (1-100%).

**Standaard**: 100%

### Cachebeheer {#cache-management}

#### Extra cache inschakelen {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Schakel extra caching in voor betere prestaties.

**Standaard**: `false`

#### Map voor cache {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Aangepaste locatie voor het opslaan van gecachte mediabestanden.

**Standaard**: Standaardlocatie van het systeem

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

**Standaard**: Leeg

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

Configureer welke OBS-scènes voor verschillende doeleinden worden gebruikt:

- **Camera-scène**: Scène die de camera of het spreekgestoelte toont
- **Mediascène**: Scène voor het weergeven van media
- **Afbeeldingsscène**: Scène voor het weergeven van afbeeldingen (bijvoorbeeld een beeld-in-beeld-scène die zowel de media als de spreker toont)

#### Geavanceerde OBS-opties {#obs-advanced-options}

- **Afbeeldingen uitstellen**: Stel het delen van afbeeldingen naar OBS uit tot dit handmatig wordt geactiveerd
- **Snelschakelaar**: Schakel de OBS-integratie snel in of uit
- **Scène wisselen na media**: Keer na de media automatisch terug naar de vorige scène
- **Vorige scène onthouden**: De vorige scène onthouden en herstellen
- **Pictogrammen verbergen**: Verberg OBS-gerelateerde pictogrammen in de interface

:::warning Belangrijke opmerking

**Audioconfiguratie vereist**: OBS Studio-integratie regelt alleen video-/scènewisselingen. Audio van M³-media wordt **niet automatisch doorgestuurd** naar Zoom of OBS. De videostream werkt als een virtuele camera zonder geluid, net als een webcam. Je moet daarom Zooms instellingen voor Originele audio configureren of "Computergeluid delen" gebruiken, zodat deelnemers de media kunnen horen. Zie de [Gebruikershandleiding](/user-guide#audio-configuration) voor gedetailleerde audio-instructies.

#### Alternatief: Overweeg om in plaats hiervan de Zoom-integratie te gebruiken, aangezien deze gebruikmaakt van de systeemeigen schermdeling van Zoom, die audio soepeler verwerkt

:::

### Aangepaste gebeurtenissen {#custom-events}

#### Aangepaste gebeurtenissen inschakelen {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Schakel aangepaste sneltoetsen in die worden geactiveerd wanneer een specifieke gebeurtenis wordt gedetecteerd (bijv. media wordt afgespeeld, gepauzeerd of gestopt).

**Standaard**: `false`

#### Custom Event Shortcuts {#custom-event-shortcuts}

##### Sneltoets voor afspelen van media {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Sneltoets die wordt geactiveerd wanneer media wordt afgespeeld.

**Standaard**: Geen

##### Sneltoets voor pauzeren van media {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Sneltoets die wordt geactiveerd wanneer media wordt gepauzeerd.

**Standaard**: Geen

##### Sneltoets voor stoppen van media {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Sneltoets die wordt geactiveerd wanneer media wordt gestopt.

**Standaard**: Geen

##### Sneltoets voor het laatste lied {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Sneltoets die wordt geactiveerd wanneer het laatste lied van de vergadering wordt afgespeeld.

**Standaard**: Geen

## Geavanceerde instellingen {#advanced-settings}

### Keyboard Shortcuts {#settings-guide-keyboard-shortcuts}

#### Sneltoetsen inschakelen {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Schakel aanpasbare sneltoetsen in voor mediabediening.

**Standaard**: `false`

#### Sneltoetsen voor mediabediening {#media-control-shortcuts}

Configureer sneltoetsen voor het afspelen van media:

- **Mediavenster**: Mediavenster openen of sluiten
- **Vorige media**: Ga naar het vorige media-item
- **Volgende media**: Ga naar het volgende media-item
- **Pauzeren/Hervatten**: Het afspelen van media pauzeren of hervatten
- **Media stoppen**: Het afspelen van media stoppen
- **Muziek in-/uitschakelen**: Achtergrondmuziek in- of uitschakelen

### Media Display {#media-display}

#### Fade-overgangen voor mediavenster inschakelen {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Schakel fade-in/out-overgangen in bij het tonen of verbergen van het mediavenster.

**Standaard**: `true`

#### Medialogo verbergen {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Verberg het logo in het mediavenster.

**Standaard**: `false`

#### Maximale resolutie {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximale resolutie voor gedownloade mediabestanden.

**Opties**: 240p, 360p, 480p, 720p

**Standaard**: 720p

#### Gedrukte media opnemen {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Media uit gedrukte publicaties opnemen in mediadownloads.

**Standaard**: `true`

#### Voetnoten uitsluiten {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Indien mogelijk afbeeldingen van voetnoten uitsluiten van mediadownloads.

**Standaard**: `false`

#### Media uit de Onderwijzen-brochure uitsluiten {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Media uit de *Onderwijzen*-brochure (*th*) uitsluiten van mediadownloads.

**Standaard**: `true`

### Subtitles {#subtitles}

#### Ondertiteling inschakelen {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Schakel ondersteuning voor ondertiteling in bij het afspelen van media.

**Standaard**: `false`

#### Ondertitelingstaal {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Taal voor ondertiteling (kan verschillen van de mediataal).

**Opties**: Alle beschikbare talen van de officiële website van Jehovah's Getuigen

**Standaard**: Geen

### Media Export {#settings-guide-media-export}

#### Automatische media-export inschakelen {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Exporteer mediabestanden automatisch naar een opgegeven map.

**Standaard**: `false`

#### Exportmap voor media {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Mappad waarnaar mediabestanden automatisch worden geëxporteerd.

**Standaard**: Leeg

#### Bestanden converteren naar MP4 {#convert-files-to-mp4}

**Instelling**: `convertFilesToMp4`

Exporteer mediabestanden naar het MP4-formaat voor betere compatibiliteit.

**Standaard**: `false`

### Danger Zone {#danger-zone}

:::warning Waarschuwing

Wijzig deze instellingen alleen als je de gevolgen ervan begrijpt.

:::

#### Basis-URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Basisdomein dat wordt gebruikt om publicaties en media te downloaden.

**Standaard**: `jw.org`

#### Media ophalen uitschakelen {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Schakel het automatisch downloaden van media volledig uit. Gebruik dit alleen voor profielen die worden gebruikt voor speciale evenementen of andere aangepaste configuraties.

**Standaard**: `false`

## Tips voor een optimale configuratie {#configuration-tips}

### Voor nieuwe gebruikers {#new-users}

1. Gebruik de installatiewizard om de basisinstellingen te configureren
2. Schakel de "Mediaweergaveknop" in om presentatiefuncties te gebruiken
3. Configureer je vergaderschema nauwkeurig
4. Stel de OBS-integratie in als je hybride vergaderingen houdt

### Voor gevorderde gebruikers {#advanced-users}

1. Gebruik mapbewaking om media te synchroniseren vanuit een cloudopslag
2. Schakel de automatische media-export in om back-ups te maken
3. Configureer sneltoetsen voor een efficiënte bediening
4. Configureer de Zoom-integratie voor automatisch schermdelen

### Prestatie-optimalisatie {#performance-optimization}

1. Schakel extra cache in voor betere prestaties
2. Gebruik een maximale resolutie die past bij je behoeften
3. Configureer het automatisch legen van de cache om schijfruimte te beheren
4. Overweeg de instelling voor een beperkte dataverbinding als je weinig bandbreedte hebt

### Problemen oplossen {#settings-guide-troubleshooting}

- Als media niet wordt gedownload, controleer dan de instellingen van je vergaderschema
- Als de OBS-integratie niet werkt, verifieer dan de poort- en wachtwoordinstellingen
- Als de prestaties traag zijn, probeer dan de extra cache in te schakelen of de resolutie te verlagen
- Als je taalproblemen hebt, controleer dan zowel de instellingen voor de interfacetaal als de mediataal
- Als Zoom-deelnemers de media-audio niet kunnen horen, configureer dan de instellingen voor Origineel geluid in Zoom of gebruik "Computergeluid delen"
- **Tip**: Overweeg om de Zoom-integratie te gebruiken in plaats van OBS Studio voor een eenvoudigere audioverwerking
