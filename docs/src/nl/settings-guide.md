# Instellingen Gids {#settings-guide}

Deze uitgebreide gids legt alle instellingen uit die beschikbaar zijn in M³, georganiseerd per categorie. Het begrijpen van deze instellingen zal je helpen om M³ perfect te configureren voor de behoeften van je gemeente.

## Algemeen {#application-configuration}

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

**Voorbeeld**: D MMMM YYYY

**Standaard**: D MMMM YYYY

### Automatisch starten bij aanmelden {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Start M³ automatisch wanneer de computer opstart.

**Standaard**: `false`

## Gemeentevergaderingen {#congregation-meetings}

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

### Doordeweekse vergaderdag {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

De dag van de week waarop je doordeweekse vergadering wordt gehouden.

**Opties**: Sunday through Saturday

**Standaard**: Geen (must be set during setup)

### Doordeweekse vergadertijd {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

De begintijd van je doordeweekse vergadering.

**Formaat**: UU:MM (24-uursnotatie)

**Standaard**: Geen (must be set during setup)

### Weekendvergaderdag {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

De dag van de week waarop je weekendvergadering wordt gehouden.

**Opties**: Sunday through Saturday

**Standaard**: Geen (must be set during setup)

### Weekendvergadertijd {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

De begintijd van je weekendvergadering.

**Formaat**: UU:MM (24-uursnotatie)

**Standaard**: Geen (must be set during setup)

### Week van het bezoek van de kringopziener {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

De week van het volgende bezoek van de kringopziener.

**Formaat**: MM/DD/JJJJ

**Standaard**: Geen

### Datum van de Herdenking {#memorial-date}

<!-- **Setting**: `memorialDate` -->

De datum van de volgende Herdenking.

**Formaat**: MM/DD/JJJJ

**Standaard**: Automatically retrieved periodically

### Wijzigingen in het vergaderschema {#meeting-schedule-changes}

Met deze instellingen kun je tijdelijke wijzigingen in je vergaderschema configureren:

- **Wijzigingsdatum**: Wanneer de wijziging ingaat
- **Eenmalige wijziging**: Of dit een permanente of tijdelijke wijziging is
- **Nieuwe doordeweekse vergaderdag**: Nieuwe dag voor de doordeweekse vergadering
- **Nieuwe doordeweekse vergadertijd**: Nieuwe tijd voor de doordeweekse vergadering
- **Nieuwe openbare vergaderdag**: Nieuwe dag voor de weekendvergadering
- **Nieuwe openbare vergadertijd**: Nieuwe tijd voor de weekendvergadering

### Automatische updates van het vergaderschema {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

Als dit is ingeschakeld, controleert M³ regelmatig op de officiële website van Jehovah's Getuigen of de vergaderdagen en -tijden zijn gewijzigd, en werkt het huidige profiel automatisch bij.

Dit werkt alleen voor profielen die zijn toegevoegd met de zoekfunctie voor gemeenten en waarvan de gemeentenaam niet handmatig is gewijzigd. Als de synchronisatie is uitgeschakeld omdat de gemeentenaam is gewijzigd, gebruik dan **Schemasynchronisatie inschakelen** om het profiel opnieuw te koppelen.

#### Schemasynchronisatie inschakelen {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Koppelt het huidige profiel opnieuw aan de zoekfunctie voor gemeenten, zodat de vergaderdagen en -tijden weer automatisch kunnen worden bijgewerkt. Wordt alleen getoond als de gemeentenaam handmatig is gewijzigd, omdat juist dat de koppeling verbreekt.

#### Vergaderschema vernieuwen {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Synchroniseer handmatig het huidige en toekomstige vergaderschema met de informatie van de officiële website.

## Media en afspelen {#media-retrieval-and-playback}

### Beperkte gegevensverbinding {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Schakel dit in als je een beperkte dataverbinding gebruikt om bandbreedte te besparen.

**Standaard**: `false`

### Mediaweergave {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Schakel de functie voor mediaweergave in. Dit is nodig om media op een tweede scherm te presenteren.

**Standaard**: `false`

#### Mediavoorbeeld inschakelen {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Toon een live voorbeeld van het mediavenster terwijl er een afbeelding of video wordt weergegeven.

**Standaard**: `true`

#### Weergave beginnen gepauzeerd {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Start video's gepauzeerd wanneer het afspelen begint.

**Standaard**: `false`

### Achtergrondmuziek {#settings-guide-background-music}

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

#### Muziekvolume {#music-volume}

<!-- **Setting**: `musicVolume` -->

Volumeniveau voor achtergrondmuziek (1-100%).

**Standaard**: 100%

### Opties voor afspelen en downloaden {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### Fade-overgangen voor mediavenster inschakelen {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Schakel fade-in/out-overgangen in bij het tonen of verbergen van het mediavenster.

**Standaard**: `true`

#### Regeling van de afspeelsnelheid inschakelen {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Sta toe dat de afspeelsnelheid van audio en video wordt aangepast via het contextmenu van het media-item.

**Standaard**: `false`

#### Medialogo verbergen {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Verberg het logo in het mediavenster.

**Standaard**: `false`

#### Maximale resolutie {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximale resolutie voor gedownloade mediabestanden.

**Opties**: 240p, 360p, 480p, 720p, 1080p

**Standaard**: 720p

#### Gedrukte media opnemen {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Media uit gedrukte publicaties opnemen in mediadownloads.

**Standaard**: `true`

#### Voetnoten uitsluiten {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Indien mogelijk afbeeldingen van voetnoten uitsluiten van mediadownloads.

**Standaard**: `false`

#### Extra video's uit de Wachttoren-studie uitsluiten {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Sluit extra video's uit waarnaar in de paragrafen van de Wachttoren-studie wordt verwezen.

**Standaard**: `false`

#### Video's voor de Gemeentebijbelstudie uitsluiten {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Kies publicaties waarvan de video's waarnaar verwezen wordt niet getoond moeten worden tijdens de Gemeentebijbelstudie. Zoek op titel of symbool van de publicatie.

**Standaard**: Wees moedig en vertrouw op Jehovah (`wcg`)

#### Media uit de th-brochure uitsluiten {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Media uit de brochure "Leg je toe op voorlezen en onderwijzen" (th) uitsluiten van mediadownloads.

**Standaard**: `true`

### Ondertitels {#subtitles}

#### Ondertiteling inschakelen {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Schakel ondersteuning voor ondertiteling in bij het afspelen van media.

**Standaard**: `false`

#### Ondertitelingstaal {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Taal voor ondertiteling (kan verschillen van de mediataal).

**Opties**: All available languages from the official website of Jehovah's Witnesses

**Standaard**: Geen

### Cachebeheer {#cache-management}

#### Download alle koninkrijksliederen {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Sla alle liedvideo's vooraf op in de cache voor betere prestaties. Houd er rekening mee dat de mediacache hierdoor groter wordt.

**Standaard**: `false`

#### Cachelocatie {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Aangepaste locatie voor het opslaan van gecachte mediabestanden.

**Standaard**: Systeemstandaardlocatie

#### Cache automatisch legen inschakelen {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Verwijder oude cachebestanden automatisch om schijfruimte te besparen.

**Standaard**: `true`

### Pinyin-liedtitels {#pinyin-song-titles}

#### Pinyin-liederen bij voorkeur gebruiken {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

Als er in de map met pinyin-liederen een pinyinversie van een vergaderlied staat, wordt die gebruikt in plaats van het standaardlied.

**Standaard**: `false`

#### Map met pinyin-liederen {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

Map met pinyin-liedvideo's (bijv. `sjjm_s-Pi_CHS_066_r720P.mp4`). Als er een pinyinbestand wordt gevonden dat bij het liednummer van de vergadering past, wordt dat afgespeeld in plaats van het standaardlied.

**Standaard**: Empty

### Media-export {#settings-guide-media-export}

#### Automatische media-export inschakelen {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Exporteer mediabestanden automatisch naar een opgegeven map.

**Standaard**: `false`

#### Exportmap voor media {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Mappad waarnaar mediabestanden automatisch worden geëxporteerd.

**Standaard**: Empty

#### Bestanden converteren naar MP4 {#convert-files-to-mp4}

**Instelling**: `convertFilesToMp4`

Zet geëxporteerde mediabestanden om naar MP4-formaat voor betere compatibiliteit.

**Standaard**: `false`

### Gedeelde map (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

Deze instellingen staan in de categorie **Integraties**.

M³ kan media aan je vergaderingen toevoegen vanuit een map die gesynchroniseerd wordt door een cloudopslag-app, zoals Dropbox, OneDrive, iCloud Drive of Google Drive. Dit is handig als anderen media voor hun onderdelen voorbereiden en met je delen, of als M³ op meer dan één computer wordt gebruikt. Een map op deze computer of op je netwerk werkt ook.

M³ maakt in de gedeelde map een map aan voor elke komende vergadering, met de datum van de vergadering als naam in de vorm jaar-maand-dag (bijvoorbeeld `2026-03-25`). Zet foto's, video's, audiobestanden of JW Library-afspeellijsten in de map van een vergadering, en ze worden automatisch toegevoegd aan de medialijst van die vergadering. Wil je bestanden voor een andere dag toevoegen, maak dan een map voor die dag aan met een naam in dezelfde vorm. Al het andere in de gedeelde map wordt genegeerd.

:::tip Tip

Maak een nieuwe map aan die je alleen hiervoor gebruikt, zoals "Vergadermedia", en stel in je cloudopslag-app in dat die altijd op deze computer blijft (vaak "offline beschikbaar" genoemd), zodat de bestanden klaarstaan voordat de vergadering begint.

:::

#### Media toevoegen uit een gedeelde map {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Voeg de bestanden die in de gedeelde map worden gezet automatisch toe aan de juiste vergadering.

**Standaard**: `false`

#### Gedeelde map {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

De map waaruit media wordt toegevoegd. De installatiewizard biedt aan om die voor je in te stellen.

**Standaard**: Empty

#### Mappen van eerdere vergaderingen verwijderen {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

Verwijder als een week voorbij is de gedateerde mappen van die week, samen met de bestanden erin, zodat de gedeelde map overzichtelijk blijft. Omdat de map gedeeld is, worden ze ook verwijderd voor iedereen die hem gebruikt. Schakel dit uit om ze te bewaren.

**Standaard**: `true`

## Vergadertimer {#meeting-timer}

### Vergadertimer inschakelen {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Schakel een apart timervenster in om de tijd van vergaderonderdelen bij te houden. Dit is een bètafunctie en mag alleen worden ingeschakeld als dat plaatselijk is goedgekeurd.

**Standaard**: `false`

### Gedrag van het timervenster {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Stel in of het timervenster automatisch opent, of timers voor sprekers standaard optellen of aftellen, of de klok de 12- of 24-uursnotatie gebruikt, en of de huidige timerwaarde op de timerknop van de actiebalk wordt getoond.

### Snelle toegang tot de timer {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Kies hoe je de timer vanuit het hoofdvenster bereikt:

- **Snelle bediening bij aanwijzen van de timerknop**: als je de muisaanwijzer op de timerknop op de actiebalk houdt, zie je het onderdeel dat getimed wordt, met de knoppen Starten, Pauzeren, Stop en Volgend onderdeel, zonder het volledige pop-upvenster van de timer te openen. Standaard ingeschakeld.
- **Een timerpaneel tonen in het hoofdvenster**: houdt de hele lijst met vergaderonderdelen en de timerbediening altijd in beeld, in een paneel dat rechts in het hoofdvenster is vastgezet. Het volledige pop-upvenster blijft via de actiebalk beschikbaar voor de instellingen van het venster en de weergave.

### Timer op afstand {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemotePort` -->

Als dit is ingeschakeld, biedt M³ een alleen-lezen kopie van de timerweergave aan als webpagina op je lokale netwerk, voor een tablet of telefoon bij het spreekgestoelte: de spreker ziet de resterende tijd zonder dat die op het scherm van de gemeente of in een gedeeld Zoom-scherm te zien is. De pagina volgt de timer in realtime, inclusief het aftellen vóór de vergadering, de klok, de kleuren voor overschrijding en het handsignaal, en alle bediening blijft in M³.

De adressen die je op het apparaat moet openen, staan in het pop-upvenster van de timer, met een kopieerknop. Wijzig de poort alleen als een ander programma die al gebruikt. Let op: zolang dit is ingeschakeld, kan iedereen op hetzelfde netwerk de pagina openen; die toont echter alleen de timer.

**Standaard**: `false`, poort `8787`

### Weergaveformaten van de timer {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Kies analoge of digitale weergaveformaten voor de huidige tijd en voor het aftellen. De waarschuwingsindicator voor het aftellen kan de analoge aftelring tijdens de laatste minuut naar een waarschuwingskleur laten verschuiven.

Het aftelformaat **Analoge klok met tijdboog** toont de resterende tijd van een onderdeel als een taartpunt op een analoge wijzerplaat, van de minutenwijzer tot het geplande einde, zodat je in één oogopslag zowel de huidige tijd als de resterende tijd ziet. Overschrijding wordt getoond als een tweede taartpunt in de kleur voor overschrijding. Het geldt ook voor het aftellen vóór de vergadering en werkt in optelmodus.

### Aftellen tot de vergadering en schemastatus {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Toon een aftelling vóór geplande vergaderingen en laat optioneel zien of de vergadering voor of achter loopt op het schema. Het aftellen tot de vergadering verschijnt alleen op de timerweergave, niet op de mediaweergave.

### Uiterlijk van de timer en overschrijding {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Pas de tekstgrootte en kleuren van de timer aan en stel indicatoren voor overschrijding in, zoals afwijkende kleuren, knipperen en in optelmodus alleen de verstreken overschrijding tonen.

## Integraties {#integrations}

Deze categorie bevat ook de instellingen voor de [gedeelde map](#settings-guide-folder-monitoring), om media toe te voegen uit Dropbox, OneDrive, iCloud Drive of Google Drive.

### Zoom-integratie {#settings-guide-zoom-integration}

#### Zoom inschakelen {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Schakel Zoom-vergaderintegratiefuncties in.

**Standaard**: `false`

#### Sneltoets voor schermdelen {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Sneltoets om Zoom-schermdeling te starten.

**Standaard**: Geen

#### Mediavenster automatisch focussen {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Focus het mediavenster automatisch nadat het scherm delen in Zoom is gestart. Dit is meestal niet nodig, maar kan op sommige systemen helpen als het mediavenster regelmatig de focus verliest nadat het scherm delen is gestart.

**Standaard**: `false`

### Zoom-vergaderbeheerder {#zoom-meeting-manager}

De Zoom-vergaderbeheerder (bèta, alleen Windows) bedient de Zoom-desktopapp voor je rond elke vergadering. De configuratieassistent, die wordt aangeboden als je de functie inschakelt, leidt je door elke automatisering.

#### Terwijl M³ Zoom bedient {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Zoom biedt geen echte interface voor automatisering, dus M³ bestuurt de Zoom-app via de toegankelijkheidsinterface, die werkt zonder de muis te bewegen, ook terwijl Zoom zijn werkbalk verbergt. Zoom haalt zijn venster wel even naar voren wanneer M³ op de knoppen ervan drukt, en de muis beweegt alleen als laatste redmiddel, als Zoom op geen enkele andere manier reageert. Telkens wanneer M³ Zoom bedient, bedekt het zijn eigen venster met de melding "M³ bedient Zoom", waarin staat wat er gebeurt, met een knop **Deze automatisering annuleren**. Dezelfde melding verschijnt tijdens de controles van de configuratieassistent en tijdens de zelftest. Een globale sneltoets (standaard `Ctrl+Alt+Escape`), die alleen actief is terwijl een automatisering loopt, annuleert die vanaf elke plek, zelfs als Zoom de focus heeft. Annuleren stopt M³ meteen; Zoom kan dan half afgehandeld achterblijven, dus controleer Zoom even.

**Standaard**: `Ctrl+Alt+Escape`

#### Hulp bij opgestoken handen {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert` -->

Tijdens een vergadering houdt M³ de deelnemerslijst van Zoom in de gaten voor opgestoken handen. Als iemand de hand opsteekt, kun je via een melding in M³ met één klik **het dempen van die deelnemer opheffen**, en als die klaar is met spreken, met nog een klik **de deelnemer weer dempen en de hand laten zakken**. De Zoom-knop op de actiebalk toont de opgestoken handen met dezelfde knoppen. Elke actie gaat naar de eigen rij van die deelnemer in Zoom, op basis van de exacte naam; als twee deelnemers dezelfde naam hebben, doet M³ bij geen van beiden iets.

Als de [vergadertimer](#meeting-timer) is ingeschakeld, verschijnt er voor de voorzitter ook een grote hand met de naam van de deelnemer op de timerweergave, en met een knop **Handsignaal** in de pop-upvensters van de timer en Zoom kun je die zelf tonen. Dit deel heeft de timerweergave nodig; de meldingen en knoppen werken ook zonder.

Zoom geeft opgestoken handen aan in zijn eigen taal, dus M³ moet eerst leren hoe: klik, terwijl je vergadering in Zoom geopend is, op **Leren hoe Zoom opgestoken handen aangeeft**. M³ steekt je eigen hand op, leest hoe Zoom die in de deelnemerslijst aangeeft en met welk menu-item de hand weer omlaag gaat, en laat de hand daarna weer zakken. De configuratieassistent biedt deze stap ook aan.

**Standaard**: `false`

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

### OBS Studio-integratie {#settings-guide-obs-integration}

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

- **Camerascène**: Scène die de camera of het spreekgestoelte toont
- **Mediascène**: Scène voor het weergeven van media
- **Afbeeldingsscène**: Scène voor het weergeven van afbeeldingen (bijvoorbeeld een beeld-in-beeld-scène die zowel de media als de spreker toont)

#### Geavanceerde OBS-opties {#obs-advanced-options}

- **Deel afbeeldingen niet automatisch**: Stel het delen van afbeeldingen met OBS uit totdat je dat zelf doet
- **Snelschakelaar**: Schakel snel in/uit voor OBS-integratie
- **Scène wisselen na media**: Keer na media automatisch terug naar de vorige scène
- **Vorige scène onthouden**: De vorige scène onthouden en herstellen
- **Pictogrammen verbergen**: Verberg OBS-gerelateerde pictogrammen in de interface
- **Opnamebediening**: Toon knoppen waarmee je de OBS-opname vanuit M³ start en stopt

:::warning Belangrijke opmerking

**Audioconfiguratie vereist**: OBS Studio-integratie regelt alleen video-/scènewisselingen. Audio van M³-media wordt **niet automatisch doorgestuurd** naar Zoom of OBS. De videostream werkt als een virtuele camera zonder geluid, net als een webcam. Je moet daarom Zooms instellingen voor Originele audio configureren of "Computergeluid delen" gebruiken, zodat deelnemers de media kunnen horen. Zie de [Gebruikershandleiding](/user-guide#audio-configuration) voor gedetailleerde audio-instructies.

**Alternatief**: Overweeg in plaats daarvan de Zoom-integratie te gebruiken, omdat die de ingebouwde schermdeling van Zoom gebruikt, die audio soepeler verwerkt.

:::

### Aangepaste gebeurtenissen {#custom-events}

#### Aangepaste gebeurtenissen inschakelen {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Schakel aangepaste sneltoetsen in die worden geactiveerd wanneer een specifieke gebeurtenis wordt gedetecteerd (bijv. media wordt afgespeeld, gepauzeerd of gestopt).

**Standaard**: `false`

#### Sneltoetsen voor aangepaste gebeurtenissen {#custom-event-shortcuts}

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

### Vergaderopnames {#meeting-recordings}

#### Integratie met een extern opnameprogramma inschakelen {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Laat M³ een apart opnameprogramma bedienen met sneltoetsen. Dit neemt niet op in M³ zelf; het verstuurt de ingestelde sneltoetsen wanneer je in het pop-upvenster voor vergaderopnames op **Opname starten** of **Opname stoppen** drukt.

Deze optie is verborgen als de OBS-opnamebediening is ingeschakeld. Als je OBS Studio gebruikt, gebruik dan in plaats daarvan de OBS-opnamebediening van de OBS-integratie.

**Standaard**: `false`

#### Sneltoetsen en map voor opnames {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Stel de sneltoets in die de opname start, de optionele sneltoets die de opname stopt, en de map waarin het externe programma opnamen opslaat. Als er geen stopsneltoets is opgegeven, gebruikt M³ de startsneltoets opnieuw. Als er een map is ingesteld, toont M³ een knop om die te openen.

## Interface en sneltoetsen {#interface-shortcuts}

### Sneltoetsen {#settings-guide-keyboard-shortcuts}

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

### Knop "Meer media toevoegen" {#add-more-media-button}

#### Secties met een knop "Meer media toevoegen" {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Kies welke vergadersecties een eigen knop krijgen om je eigen media toe te voegen, naast de knop "Media toevoegen" in de bovenste werkbalk, die altijd voor elke sectie werkt.

**Standaard**: Openbare lezing, Leven als Christenen, Bezoek van de kringopziener en aangepaste secties

#### Compacte knop Media toevoegen {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

Toon alleen een pictogram voor de knop "Meer media toevoegen"/"Een lied toevoegen" in de koppen van secties. Als dit is uitgeschakeld, toont de knop naast het pictogram ook tekst wanneer er genoeg ruimte is.

**Standaard**: `true`

### Sleepgreep voor media {#media-drag-handle}

#### Sleepgreep tonen {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Toon een kleine greep op elk media-item waarmee je het kunt slepen om de volgorde te wijzigen. Media-items kunnen altijd in een andere volgorde worden gezet door ze op een willekeurige plek vast te pakken en te slepen; dit bepaalt alleen of het pictogram van de greep zelf wordt getoond.

**Standaard**: `true`

### Snelle acties vóór en na de vergadering {#before-after-meeting-quick-actions}

#### Snelle acties voor vergaderingen tonen {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Toon een paneel vóór de vergadering en een paneel na de vergadering, met handige bediening (achtergrondmuziek, opname) en voor elk een aanpasbare checklist.

**Standaard**: `true`

De categorieën en taken van de checklists voor zowel het paneel vóór als het paneel na de vergadering beheer je in ditzelfde gedeelte van de instellingen: voeg categorieën en taken toe, wijzig hun naam, verander de volgorde of verwijder ze, al naargelang wat je gemeente nodig heeft.

## Geavanceerd {#advanced-settings}

### Profielinstellingen overzetten {#profile-settings-transfer}

Exporteer de instellingen van het huidige profiel naar een JSON-bestand, of importeer een eerder geëxporteerd bestand met profielinstellingen. Importeren vervangt de instellingen van het huidige profiel.

### Gevarenzone {#danger-zone}

:::warning Waarschuwing

Wijzig deze instellingen alleen als je de gevolgen ervan begrijpt.

:::

#### Basis-URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Basisdomein dat wordt gebruikt om publicaties en media te downloaden.

**Standaard**: `jw.org`

#### Hardwareversnelling uitschakelen {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Schakel hardwareversnelling uit nadat M³ opnieuw is gestart. Dit kan helpen bij grafische fouten of crashes op sommige systemen, maar wordt verder niet aanbevolen.

**Standaard**: `false`

#### Herinnering voor hardwareversnelling onderdrukken {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Verberg de herinnering om hardwareversnelling weer in te schakelen nadat deze handmatig is uitgeschakeld.

**Standaard**: `false`

#### Media ophalen uitschakelen {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Schakel het automatisch downloaden van media volledig uit. Gebruik dit alleen voor profielen die worden gebruikt voor speciale evenementen of andere aangepaste configuraties.

**Standaard**: `false`

## Tips voor een optimale configuratie {#configuration-tips}

### Voor nieuwe gebruikers {#new-users}

1. Begin met de installatiewizard om de basisinstellingen te configureren
2. Zet "Afspelen van media inschakelen" aan om de presentatiefuncties te gebruiken
3. Configureer je vergaderschema nauwkeurig
4. Stel de OBS-integratie in als je hybride vergaderingen houdt

### Voor gevorderde gebruikers {#advanced-users}

1. Gebruik een gedeelde map om media toe te voegen uit cloudopslag, zoals Dropbox of OneDrive
2. Schakel automatische media-export in voor back-updoeleinden
3. Configureer sneltoetsen voor een efficiënte bediening
4. Configureer de Zoom-integratie voor automatisch schermdelen

### Prestatie-optimalisatie {#performance-optimization}

1. Download alle koninkrijksliederen voor betere prestaties
2. Gebruik een maximale resolutie die past bij je behoeften
3. Configureer het automatisch legen van de cache om schijfruimte te beheren
4. Overweeg de instelling voor een beperkte dataverbinding als je weinig bandbreedte hebt

### Problemen oplossen {#settings-guide-troubleshooting}

- Als media niet wordt gedownload, controleer dan de instellingen van je vergaderschema
- Als de OBS-integratie niet werkt, controleer dan de poort- en wachtwoordinstellingen
- Als de prestaties traag zijn, probeer dan de extra cache in te schakelen of de resolutie te verlagen
- Als je taalproblemen hebt, controleer dan zowel de instellingen voor de interfacetaal als de mediataal
- Als Zoom-deelnemers de media-audio niet kunnen horen, configureer dan de instellingen voor Origineel geluid in Zoom of gebruik "Computergeluid delen"
- **Tip**: Overweeg om de Zoom-integratie te gebruiken in plaats van OBS Studio voor een eenvoudigere audioverwerking
