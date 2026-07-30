# Einstellungs-Handbuch {#settings-guide}

Dieses umfassende Handbuch erklärt alle in M³ verfügbaren Einstellungen, organisiert nach Kategorien. Das Verständnis dieser Einstellungen hilft Ihnen, M³ so zu konfigurieren, dass es perfekt für die Bedürfnisse Ihrer Versammlung funktioniert.

## Anwendungskonfiguration {#application-configuration}

### Anzeigesprache {#display-language}

<!-- **Setting**: `localAppLang` -->

Wählen Sie die Sprache für die M³-Oberfläche. Dies ist unabhängig von der für Medien-Downloads verwendeten Sprache.

**Optionen**: Alle verfügbaren Oberflächensprachen (Englisch, Spanisch, Französisch usw.)

**Standard**: Englisch

### Dunkelmodus {#dark-mode}

<!-- **Setting**: `darkMode` -->

Steuern Sie das Erscheinungsbild von M³.

**Optionen**:

- Automatisch basierend auf Systemeinstellungen wechseln
- Immer Dunkelmodus verwenden
- Immer Hellmodus verwenden

**Standard**: Auto

### Erster Tag der Woche {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Legen Sie fest, welcher Tag in der Kalenderansicht als erster Tag der Woche betrachtet werden soll.

**Optionen**: Sonntag bis Samstag

**Standard**: Sonntag

### Datumsformat {#date-format}

<!-- **Setting**: `localDateFormat` -->

Format, das zum Anzeigen von Daten in der App verwendet wird.

**Beispiel**: T MMMM JJJJ

**Standard**: T MMMM JJJJ

### Automatischer Start bei Anmeldung {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Starten Sie M³ automatisch, wenn der Computer hochfährt.

**Standard**: `false`

## Zusammenkünfte {#congregation-meetings}

### Versammlungsname {#congregation-name}

<!-- **Setting**: `congregationName` -->

Der Name Ihrer Versammlung. Dieser wird zu Organisations- und Anzeigezwecken verwendet.

**Standard**: Leer (muss während der Einrichtung festgelegt werden)

### Sprache der Zusammenkunft {#meeting-language}

<!-- **Setting**: `lang` -->

Die primäre Sprache für Medien-Downloads. Dies sollte der Sprache entsprechen, die in den Zusammenkünften Ihrer Versammlung verwendet wird.

**Optionen**: Alle verfügbaren Sprachen von der offiziellen Website der Zeugen Jehovas

**Standard**: Englisch

### Ausweichsprache {#fallback-language}

<!-- **Setting**: `langFallback` -->

Eine sekundäre Sprache, die verwendet wird, wenn Medien in der primären Sprache nicht verfügbar sind.

**Optionen**: Alle verfügbaren Sprachen von der offiziellen Website der Zeugen Jehovas

**Standard**: Keine

### Tag der Zusammenkunft unter der Woche {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

Der Wochentag, an dem Ihre Zusammenkunft unter der Woche stattfindet.

**Optionen**: Sonntag bis Samstag

**Standard**: Keine (muss während der Einrichtung festgelegt werden)

### Zeit der Zusammenkunft unter der Woche {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

Die Startzeit Ihrer Zusammenkunft unter der Woche.

**Format**: HH:MM (24-Stunden-Format)

**Standard**: Keine (muss während der Einrichtung festgelegt werden)

### Tag der Zusammenkunft am Wochenende {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

Der Wochentag, an dem Ihre Zusammenkunft am Wochenende stattfindet.

**Optionen**: Sonntag bis Samstag

**Standard**: Keine (muss während der Einrichtung festgelegt werden)

### Zeit der Zusammenkunft am Wochenende {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

Die Startzeit Ihrer Zusammenkunft am Wochenende.

**Format**: HH:MM (24-Stunden-Format)

**Standard**: Keine (muss während der Einrichtung festgelegt werden)

### Woche des Kreisaufsehers {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

Die Woche des nächsten Besuchs des Kreisaufsehers.

**Format**: MM/TT/JJJJ

**Standard**: Keine

### Gedächtnismahl-Datum {#memorial-date}

<!-- **Setting**: `memorialDate` -->

The date of the next Memorial celebration.

**Format**: MM/TT/JJJJ

**Standard**: Wird periodisch automatisch abgerufen

### Änderungen im Zusammenkunftsplan {#meeting-schedule-changes}

Diese Einstellungen ermöglichen es Ihnen, vorübergehende Änderungen an Ihrem Zusammenkunftsplan zu konfigurieren:

- **Änderungsdatum**: Wann die Änderung in Kraft tritt
- **Einmalige Änderung**: Ob dies eine dauerhafte oder vorübergehende Änderung ist
- **Neuer Tag (unter der Woche)**: Neuer Tag für die Zusammenkunft unter der Woche
- **Neue Zeit (unter der Woche)**: Neue Zeit für die Zusammenkunft unter der Woche
- **Neuer Tag (Wochenende)**: Neuer Tag für die Zusammenkunft am Wochenende
- **Neue Zeit (Wochenende)**: Neue Zeit für die Zusammenkunft am Wochenende

### Automatic Meeting Schedule Updates {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

When enabled, M³ periodically checks the official website of Jehovah's Witnesses for meeting day and time changes and updates the current profile automatically.

This only works for profiles that were added with congregation lookup and whose congregation name has not been manually changed. If synchronization was disabled because the congregation name changed, use **Enable schedule sync** to link the profile again.

#### Refresh Meeting Schedule {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Manually synchronize the current and future meeting schedule with the information from the official website.

## Medienabruf und -wiedergabe {#media-retrieval-and-playback}

### Getaktete Verbindung {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Aktivieren Sie dies, wenn Sie eine begrenzte Datenverbindung haben, um die Bandbreitennutzung zu reduzieren.

**Standard**: `false`

### Medienanzeige {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Aktivieren Sie die Medienanzeigefunktionalität. Dies ist erforderlich, um Medien auf einem zweiten Monitor zu präsentieren.

**Standard**: `false`

#### Enable Media Preview {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Show a live preview of the media window while an image or video is being displayed.

**Standard**: `true`

#### Wiedergabe pausiert beginnen {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Starten Sie Videos in einem pausierten Zustand, wenn die Wiedergabe beginnt.

**Standard**: `false`

### Hintergrundmusik {#settings-guide-background-music}

#### Musik aktivieren {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Aktivieren Sie die Hintergrundmusikfunktionalität.

**Standard**: `true`

#### Musik automatisch starten {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Starten Sie die Hintergrundmusik automatisch, wenn M³ gestartet wird, falls angemessen.

**Standard**: `true`

#### Stopp-Puffer für Zusammenkünfte {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Wie viele Sekunden vor Beginn der Zusammenkunft die Hintergrundmusik gestoppt werden soll.

**Bereich**: 0-300 Sekunden

**Standard**: 60 Sekunden

#### Musik-Lautstärke {#music-volume}

<!-- **Setting**: `musicVolume` -->

Lautstärkepegel für Hintergrundmusik (1-100%).

**Standard**: 100%

### Cache-Verwaltung {#cache-management}

#### Extra-Cache aktivieren {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Aktivieren Sie zusätzliches Caching für eine bessere Leistung.

**Standard**: `false`

#### Cache-Ordner {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Benutzerdefinierter Speicherort zum Speichern zwischengespeicherter Mediendateien.

**Standard**: Systemstandard

#### Automatisches Löschen des Caches aktivieren {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Löschen Sie alte zwischengespeicherte Dateien automatisch, um Speicherplatz zu sparen.

**Standard**: `true`

### Ordnerüberwachung {#settings-guide-folder-monitoring}

#### Ordnerüberwachung aktivieren {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Überwachen Sie einen Ordner auf neue Mediendateien und fügen Sie sie automatisch zu M³ hinzu.

**Standard**: `false`

#### Zu überwachender Ordner {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Der Ordnerpfad, der auf neue Mediendateien überwacht werden soll.

**Standard**: Leer

## Integrationen {#integrations}

### Zoom-Integration {#settings-guide-zoom-integration}

#### Zoom aktivieren {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Aktivieren Sie die Integrationsfunktionen für Zoom-Meetings.

**Standard**: `false`

#### Tastenkürzel für Bildschirmfreigabe {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Tastenkürzel zum Auslösen der Zoom-Bildschirmfreigabe.

**Standard**: Keine

### OBS Studio-Integration {#settings-guide-obs-integration}

#### OBS aktivieren {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Aktivieren Sie die OBS Studio-Integration für automatischen Szenenwechsel.

**Standard**: `false`

:::warning Wichtiger Hinweis

**Audiokonfiguration erforderlich**: Die OBS Studio-Integration verarbeitet nur die Bildschirmfreigabe. Audio von M³-Medien wird bei Verwendung von OBS Studio **nicht automatisch** an Zoom-Teilnehmer übertragen. Sie müssen die "Originalton"-Einstellungen von Zoom konfigurieren oder "Computerton teilen" verwenden, um sicherzustellen, dass die Teilnehmer der Zusammenkunft die Medien hören können. Siehe das [Benutzerhandbuch](/user-guide#audio-configuration) für detaillierte Anweisungen zur Audioeinrichtung.

**Hinweis**: Die Zoom-Integration verwendet die native Bildschirmfreigabe von Zoom, die Audio nahtloser verarbeitet als die OBS Studio-Integration.

:::

#### OBS-Port {#obs-port}

<!-- **Setting**: `obsPort` -->

Die Portnummer für die Verbindung zum OBS Studio WebSocket.

**Standard**: Keine

#### OBS-Passwort {#obs-password}

<!-- **Setting**: `obsPassword` -->

Das Passwort für die OBS Studio WebSocket-Verbindung.

**Standard**: Keine

#### OBS-Szenen {#obs-scenes}

Konfigurieren Sie, welche OBS-Szenen für verschiedene Zwecke verwendet werden sollen:

- **Kamera-Szene**: Szene, die die Kamera/das Rednerpult zeigt
- **Medien-Szene**: Szene zum Anzeigen von Medien
- **Bilder-Szene**: Szene zum Anzeigen von Bildern (zum Beispiel eine Bild-in-Bild-Szene, die sowohl Medien als auch den Redner zeigt)

#### Erweiterte OBS-Optionen {#obs-advanced-options}

- **Bilder aufschieben**: Verzögern Sie das Teilen von Bildern mit OBS, bis es manuell ausgelöst wird
- **Schnellumschalter**: Aktivieren Sie den schnellen Ein-/Ausschalter für die OBS-Integration
- **Szene nach Medien wechseln**: Kehren Sie nach Medien automatisch zur vorherigen Szene zurück
- **Vorherige Szene merken**: Merken Sie sich die vorherige Szene und stellen Sie sie wieder her
- **Symbole ausblenden**: Blenden Sie OBS-bezogene Symbole in der Benutzeroberfläche aus
- **Recording Controls**: Show controls that start and stop OBS recording from M³

:::warning Wichtiger Hinweis

**Audiokonfiguration erforderlich**: Die OBS Studio-Integration verarbeitet nur Video-/Szenenwechsel. Audio von M³-Medien wird **nicht automatisch** an Zoom oder OBS übertragen. Der Videostream funktioniert wie eine virtuelle Kamera ohne Ton, genau wie eine Webcam. Sie müssen die "Originalton"-Einstellungen von Zoom konfigurieren oder "Computerton teilen" verwenden, um sicherzustellen, dass die Teilnehmer der Zusammenkunft die Medien hören können. Siehe das [Benutzerhandbuch](/user-guide#audio-configuration) für detaillierte Anweisungen zur Audioeinrichtung.

**Alternative**: Ziehen Sie in Betracht, stattdessen die Zoom-Integration zu verwenden, da diese die native Bildschirmfreigabe von Zoom verwendet, die Audio nahtloser verarbeitet.

:::

### Benutzerdefinierte Ereignisse {#custom-events}

#### Benutzerdefinierte Ereignisse aktivieren {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Aktivieren Sie benutzerdefinierte Kürzel, die ausgelöst werden, wenn ein bestimmtes Ereignis erkannt wird (z. B. Medien werden abgespielt, pausiert oder gestoppt).

**Standard**: `false`

#### Tastenkürzel für benutzerdefinierte Ereignisse {#custom-event-shortcuts}

##### Medienwiedergabe-Kürzel {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Kürzel, das ausgelöst wird, wenn Medien abgespielt werden.

**Standard**: Keine

##### Medienpause-Kürzel {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Kürzel, das ausgelöst wird, wenn Medien pausiert werden.

**Standard**: Keine

##### Medienstopp-Kürzel {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Kürzel, das ausgelöst wird, wenn Medien gestoppt werden.

**Standard**: Keine

##### Letztes Lied-Kürzel {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Kürzel, das ausgelöst wird, wenn das letzte Lied während einer Zusammenkunft gespielt wird.

**Standard**: Keine

### Meeting Recordings {#meeting-recordings}

#### Enable External Recording App Integration {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Let M³ control a separate recording application with keyboard shortcuts. This does not record inside M³; it sends the configured shortcuts when you press **Start Recording** or **Stop Recording** in the meeting recordings popup.

This option is hidden when OBS recording controls are enabled. If you use OBS Studio, use the OBS recording controls in the OBS integration instead.

**Standard**: `false`

#### Recording Shortcuts and Folder {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Configure the keyboard shortcut that starts recording, the optional shortcut that stops recording, and the folder where the external app saves recordings. If no stop shortcut is provided, M³ reuses the start shortcut. When a folder is configured, M³ shows a button to open it.

### Meeting Timer {#meeting-timer}

#### Enable Meeting Timer {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Enable a separate timer window for timing meeting parts. This is a beta feature and should only be enabled if approved locally.

**Standard**: `false`

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

## Erweiterte Einstellungen {#advanced-settings}

### Tastenkürzel {#settings-guide-keyboard-shortcuts}

#### Tastenkürzel aktivieren {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Aktivieren Sie anpassbare Tastenkürzel für die Mediensteuerung.

**Standard**: `false`

#### Mediensteuerungs-Tastenkürzel {#media-control-shortcuts}

Konfigurieren Sie Kürzel für die Medienwiedergabe:

- **Medienfenster**: Medienfenster öffnen/schließen
- **Vorheriges Medium**: Zum vorherigen Medienelement gehen
- **Nächstes Medium**: Zum nächsten Medienelement gehen
- **Pause/Fortsetzen**: Medienwiedergabe pausieren oder fortsetzen
- **Medien stoppen**: Medienwiedergabe stoppen
- **Musik umschalten**: Hintergrundmusik umschalten

### Medienanzeige {#media-display}

#### Überblendungen für Medienfenster aktivieren {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Aktivieren Sie Ein-/Ausblendübergänge beim Anzeigen oder Ausblenden des Medienfensters.

**Standard**: `true`

#### Enable Playback Speed Control {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Allow audio and video playback speed to be adjusted from the media item's context menu.

**Standard**: `false`

#### Medienlogo ausblenden {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Blenden Sie das Logo im Medienfenster aus.

**Standard**: `false`

#### Maximale Auflösung {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximale Auflösung für heruntergeladene Mediendateien.

**Options**: 240p, 360p, 480p, 720p, 1080p

**Standard**: 720p

#### Gedruckte Medien einbeziehen {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Schließen Sie Medien aus den gedruckten Publikationen in Medien-Downloads ein.

**Standard**: `true`

#### Fußnoten ausschließen {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Schließen Sie Fußnotenbilder nach Möglichkeit aus Medien-Downloads aus.

**Standard**: `false`

#### Exclude Additional Watchtower Study Videos {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Exclude additional videos that are referenced in Watchtower Study paragraphs.

**Standard**: `false`

#### Medien aus der Lehren-Broschüre ausschließen {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Schließen Sie Medien aus der Lehren-Broschüre (th) aus Medien-Downloads aus.

**Standard**: `true`

### Untertitel {#subtitles}

#### Untertitel aktivieren {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Aktivieren Sie die Untertitelunterstützung für die Medienwiedergabe.

**Standard**: `false`

#### Untertitelsprache {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Sprache für Untertitel (kann von der Mediensprache abweichen).

**Optionen**: Alle verfügbaren Sprachen von der offiziellen Website der Zeugen Jehovas

**Standard**: Keine

### Medienexport {#settings-guide-media-export}

#### Automatischen Medienexport aktivieren {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Exportieren Sie Mediendateien automatisch in einen angegebenen Ordner.

**Standard**: `false`

#### Medienexport-Ordner {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Ordnerpfad, in dem Mediendateien automatisch exportiert werden.

**Standard**: Leer

#### Dateien in MP4 konvertieren {#convert-files-to-mp4}

**Einstellung**: `convertFilesToMp4`

Konvertieren Sie exportierte Mediendateien in das MP4-Format für eine bessere Kompatibilität.

**Standard**: `false`

### Profile Settings Transfer {#profile-settings-transfer}

Export the current profile's settings to a JSON file or import a previously exported profile settings file. Importing replaces the current profile's settings.

### Gefahrenzone {#danger-zone}

:::warning Warnung

Diese Einstellungen sollten nur geändert werden, wenn Sie ihre Auswirkungen verstehen.

:::

#### Basis-URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Basisdomäne, die zum Herunterladen von Publikationen und Medien verwendet wird.

**Standard**: `jw.org`

#### Disable Hardware Acceleration {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Disable hardware acceleration after restarting M³. This may help with graphical glitches or crashes on some systems, but is not otherwise recommended.

**Standard**: `false`

#### Suppress Hardware Acceleration Reminder {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Hide the reminder to re-enable hardware acceleration after it has been manually disabled.

**Standard**: `false`

#### Medienabruf deaktivieren {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Deaktivieren Sie automatische Medien-Downloads vollständig. Verwenden Sie dies nur für Profile, die für Sonderveranstaltungen oder andere benutzerdefinierte Setups verwendet werden.

**Standard**: `false`

## Tipps für eine optimale Konfiguration {#configuration-tips}

### Für neue Benutzer {#new-users}

1. Beginnen Sie mit dem Einrichtungsassistenten, um grundlegende Einstellungen zu konfigurieren
2. Aktivieren Sie die "Medienanzeige-Taste", um auf Präsentationsfunktionen zuzugreifen
3. Konfigurieren Sie Ihren Zusammenkunftsplan genau
4. Richten Sie die OBS-Integration ein, wenn Sie hybride Zusammenkünfte nutzen

### Für fortgeschrittene Benutzer {#advanced-users}

1. Verwenden Sie die Ordnerüberwachung, um Medien aus dem Cloud-Speicher zu synchronisieren
2. Aktivieren Sie den automatischen Medienexport für Sicherungszwecke
3. Konfigurieren Sie Tastenkürzel für einen effizienten Betrieb
4. Konfigurieren Sie die Zoom-Integration für automatische Bildschirmfreigabe

### Leistungsoptimierung {#performance-optimization}

1. Aktivieren Sie Extra-Cache für eine bessere Leistung
2. Verwenden Sie die für Ihre Bedürfnisse geeignete maximale Auflösung
3. Konfigurieren Sie das automatische Löschen des Caches, um Speicherplatz zu verwalten
4. Ziehen Sie die Einstellung für getaktete Verbindungen in Betracht, wenn die Bandbreite begrenzt ist

### Fehlerbehebung {#settings-guide-troubleshooting}

- Wenn Medien nicht heruntergeladen werden, überprüfen Sie Ihre Zusammenkunftsplan-Einstellungen
- Wenn die OBS-Integration nicht funktioniert, überprüfen Sie die Port- und Passworteinstellungen
- Wenn die Leistung langsam ist, versuchen Sie, Extra-Cache zu aktivieren oder die Auflösung zu reduzieren
- Wenn Sie Sprachprobleme haben, überprüfen Sie sowohl die Oberflächen- als auch die Medienspracheinstellungen
- Wenn Zoom-Teilnehmer das Medien-Audio nicht hören können, konfigurieren Sie die "Originalton"-Einstellungen von Zoom oder verwenden Sie "Computerton teilen"
- **Tipp**: Ziehen Sie in Betracht, die Zoom-Integration anstelle von OBS Studio für eine einfachere Audiohandhabung zu verwenden
