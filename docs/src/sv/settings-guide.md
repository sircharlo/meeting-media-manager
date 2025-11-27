# Inställningsguide {#settings-guide}

Denna omfattande guide förklarar alla inställningar som finns i M³, organiserade efter kategori. Att förstå dessa inställningar hjälper dig att ställa in M³ för att fungera perfekt för församlingens behov.

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

### Datumformat {#date-format}

<!-- **Setting**: `localDateFormat` -->

Format som används för att visa datum i appen.

**Exempel**: D MMMM ÅÅÅÅ

**Exempel**: D MMMM ÅÅÅÅ

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

#### Börja uppspelning pausad {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Starta videor i ett pausat tillstånd när uppspelningen börjar.

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

#### Buffert för mötestopp av musik {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Ställ in hur många sekunder innan mötet börjar som bakgrundsmusiken ska stoppas.

**Område**: 0-300 sekunder

**Standard**: 60 sekunder

#### Musikvolym {#music-volume}

<!-- **Setting**: `musicVolume` -->

Volymnivå för bakgrundsmusik (1-100%).

**Standard**: 100%

### Cachehantering {#cache-management}

#### Aktivera extra cache {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Aktivera extra cache för bättre prestanda.

**Standard**: `nej`

#### Cachemapp {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Anpassad plats för att lagra cachade mediefiler.

**Standard**: Systemets standardplats

#### Aktivera automatisk rensning av cache {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Rensa automatiskt gamla cachade filer för att spara diskutrymme.

**Standard**: `Ja`

### Mappbevakning {#settings-guide-folder-monitoring}

#### Aktivera mappbevakning {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Övervaka en mapp för nya mediefiler och lägg automatiskt till dem i M³.

**Standard**: `nej`

#### Mapp att bevaka {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Mappsökvägen att övervaka för nya mediefiler.

**Standard**: Tomt

## Integrationer {#integrations}

### Zoomintegration {#settings-guide-zoom-integration}

#### Aktivera Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Aktivera funktioner för Zoom mötesintegrering.

**Standard**: `nej`

#### Genväg för skärmdelning {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Genväg till tangentbordet för att starta Zoom:s skärmdelning.

**Standard**: Inget

### OBS Studiointegration {#settings-guide-obs-integration}

#### Aktivera OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Aktivera OBS Studio-integration för automatisk scenbyte.

**Standard**: `nej`

:::warning Viktig information

**Ljudkonfiguration krävs**: OBS Studio-integrationen hanterar endast skärmdelning. Ljud från M³ överförs inte automatiskt\*\* till deltagarna på Zoom vid användning av OBS Studio. Du måste ställa in Zooms ursprungliga ljudinställningar eller använda "Dela datorljud" för att säkerställa att mötesdeltagarna kan höra medierna. Se [Användarhandbok](/user-guide#audio-configuration) för detaljerade instruktioner för ljudinställningar.

**Obs**: Zoomintegrationen använder Zooms inbyggda skärmdelning som hanterar ljud mer sömlöst än OBS Studio-integration.

:::

#### OBS Port {#obs-port}

<!-- **Setting**: `obsPort` -->

Portnumret för anslutning till OBS Studio WebSocket.

**Standard**: Inget

#### OBS Lösenord {#obs-password}

<!-- **Setting**: `obsPassword` -->

Lösenordet för OBS Studio WebSocket-anslutning.

**Standard**: Inget

#### OBS Scener {#obs-scenes}

Ställ in vilka OBS-scener som ska användas för olika ändamål:

- **Kamerascen**: Scen som visar kameran/podiet
- **Mediescen**: Scen för visning av media
- **Bildscen**: Scen för att visa bilder (till exempel en BIB-scen som visar både media och talaren)

#### OBS Avancerade alternativ {#obs-advanced-options}

- **Skjut upp bildvisning**: Fördröj delning av bilder till OBS
- **Snabbväxla**: Aktivera snabbväxling på/av för OBS-integration
- **Byt scen efter media**: Återvänd automatiskt till föregående scen efter mediet
- **Kom ihåg föregående scen**: Kom ihåg och återställ föregående scen
- **Dölj ikoner**: Dölj OBS-relaterade ikoner i gränssnittet

:::warning Viktig information

**Ljudkonfiguration krävs**: OBS Studio integration hanterar endast video/scenbyte. Ljud från M³ överförs inte automatiskt\*\* till Zoom eller OBS Studio. Videoströmmen fungerar som en virtuell kamera utan ljud, precis som en webbkamera. Du måste ställa in Zooms ursprungliga ljudinställningar eller använda "Dela datorljud" för att säkerställa att mötesdeltagarna kan höra medierna. Se [Användarhandbok](/user-guide#audio-configuration) för detaljerade instruktioner för ljudinställningar.

**Alternativ lösning**: Överväg att använda Zoomintegrationen istället, eftersom den använder Zooms inbyggda skärm och ljuddelning, som hanterar ljudet mer sömlöst.

:::

### Anpassade händelser {#custom-events}

#### Aktivera anpassade händelser {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Aktivera anpassade genvägar som kommer att utlösas när en specifik händelse upptäcks (t.ex. spelas media upp, pausas eller stoppas).

**Standard**: `nej`

#### Anpassade händelsegenvägar {#custom-event-shortcuts}

##### Genväg för spela media {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Genvägen aktiveras när media spelas.

**Standard**: Inget

##### Genväg för att pausa media {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Genvägen aktiveras när media pausas.

**Standard**: Inget

##### Genväg för stoppa media {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Genvägen aktiveras när media stoppas.

**Standard**: Inget

##### Genväg för sista sången {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Genvägen aktiveras när sista sången spelas under ett möte.

**Standard**: Inget

## Avancerade inställningar {#advanced-settings}

### Kortkommandon {#settings-guide-keyboard-shortcuts}

#### Aktivera kortkommandon {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Aktivera anpassningsbara kortkommandon för mediekontroll.

**Standard**: `nej`

#### Genvägar för mediakontroll {#media-control-shortcuts}

Ställ in genvägar för uppspelning av media:

- **Mediefönster** - Öppna/stäng mediefönstret
- **Föregående medieobjekt**: Gå till föregående medieobjekt
- **Nästa medieobjekt**: Gå till nästa medieobjekt
- **Pausa/Återuppspela** - Kontrollera uppspelning av media
- **Stoppa mediet** - Stoppa uppspelningen
- **Musikväxling** - Styr bakgrundsmusiken

### Mediavisning {#media-display}

#### Aktivera tonade övergångar för mediafönster {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Aktivera mjuk övergång när du döljer eller visar mediafönstret.

**Standard**: `Ja`

#### Dölj medialogotyp {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Dölj logotypen i mediefönstret.

**Standard**: `nej`

#### Maximal upplösning {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximal upplösning för nedladdade mediefiler.

**Alternativ**: 240p, 360p, 480p, 720p

**Standard**: 720p

#### Inkludera tryckt media {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Inkludera media från tryckta publikationer i medienedladdningar.

**Standard**: `Ja`

#### Uteslut fotnoter {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Uteslut fotnotsbilder från medianedladdningar när det är möjligt.

**Standard**: `nej`

#### Uteslut media från broschyren Bli bättre på att... {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Uteslut media från broschyren Bli bättre på att högläsa och undervisa (th) från medianedladdningar.

**Standard**: `Ja`

### Undertexter {#subtitles}

#### Aktivera undertexter {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Aktivera undertextstöd för medieuppspelning.

**Standard**: `nej`

#### Undertextspråk {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Språk för undertexter (behöver inte vara samma som mediespråk).

**Alternativ**: Alla tillgängliga språk som finns på Jehovas vittnens officiella websida

**Standard**: Inget

### Mediaexport {#settings-guide-media-export}

#### Aktivera automatisk mediaexport {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Exporterar mediefiler till en angiven mapp.

**Standard**: `nej`

#### Mapp för mediaexport {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Mappsökväg dit mediefiler kommer att exporteras automatiskt.

**Standard**: Tomt

#### Konvertera filer till MP4 {#convert-files-to-mp4}

**Inställningar**: `konverteraFilerTillMp4`

Konvertera exporterade mediefiler till MP4-format för bättre kompatibilitet.

**Standard**: `nej`

### Farozon {#danger-zone}

:::warning Varning

Dessa inställningar bör endast ändras om du förstår deras innebörd.

:::

#### Bas URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Basdomän som används för att ladda ner publikationer och medier.

**Default**: `jw.org`

#### Inaktivera mediahämtning {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Inaktivera helt automatiska medianedladdningar. Använd detta endast för profiler som kommer att användas för speciella händelser eller andra anpassade inställningar.

**Standard**: `nej`

## Tips för optimala inställningar {#configuration-tips}

### För nya användare {#new-users}

1. Börja med installationsguiden för att ställa in grundläggande inställningar
2. Aktivera "Mediavisningsknappen" för att komma åt visningsfunktioner
3. Ställ in mötesschemat noggrant
4. Ställ in OBS-integration om du använder hybridmöten

### För avancerade användare {#advanced-users}

1. Använd mappövervakning för att synkronisera media från molnlagring
2. Aktivera automatisk export av media för säkerhetskopieringsändamål
3. Ställ in anpassade kortkommandon för snabbare åtkomst
4. Ställ in Zoom-integration för automatisk skärmdelning

### Prestandaoptimering {#performance-optimization}

1. Aktivera extra cache för bättre prestanda
2. Använd lämplig maximal upplösning för dina behov
3. Ställ in automatisk rensning för att hantera diskutrymme
4. Använd funktionen för datapriser vid begränsad bandbredd

### Felsökning {#settings-guide-troubleshooting}

- Om media inte laddas ner, kontrollera dina inställningar för mötesschemat
- Om OBS-integration inte fungerar, kontrollera port- och lösenordsinställningar
- Om prestandan är långsam, försök aktivera extra cache eller minska upplösningen
- Om du har språkproblem, kontrollera både gränssnittet och språkinställningarna
- Om deltagarna på Zoom inte kan höra ljud, ställ in Zooms ursprungliga ljudinställningar eller använd "Dela datorljud"
- **Tip**: Överväg att använda Zoom-integration istället för OBS Studio för enklare ljudhantering
