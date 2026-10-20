# Einstellungs-Handbuch {#settings-guide}

Dieses umfassende Handbuch erklärt alle in M³ verfügbaren Einstellungen, organisiert nach Kategorien. Das Verständnis dieser Einstellungen hilft Ihnen, M³ so zu konfigurieren, dass es perfekt für die Bedürfnisse Ihrer Versammlung funktioniert.

## Allgemein {#application-configuration}

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

Das Datum des nächsten Gedächtnismahls.

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

### Automatische Aktualisierung des Zusammenkunftsprogramms {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

Wenn aktiviert, prüft M³ regelmäßig auf der offiziellen Website der Zeugen Jehovas, ob sich Tag oder Uhrzeit der Zusammenkünfte geändert haben, und aktualisiert das aktuelle Profil automatisch.

Das funktioniert nur bei Profilen, die über die Versammlungssuche hinzugefügt wurden und deren Versammlungsname nicht manuell geändert wurde. Wenn die Synchronisierung deaktiviert wurde, weil sich der Versammlungsname geändert hat, verwenden Sie **Programmsynchronisierung aktivieren**, um das Profil erneut zu verknüpfen.

#### Programmsynchronisierung aktivieren {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Verknüpft das aktuelle Profil wieder mit der Versammlungssuche, damit Tag und Uhrzeit der Zusammenkünfte wieder automatisch aktualisiert werden können. Wird nur angezeigt, wenn der Versammlungsname manuell geändert wurde, da genau dadurch die Verknüpfung überhaupt erst aufgehoben wird.

#### Zusammenkunftsprogramm aktualisieren {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Synchronisieren Sie das aktuelle und zukünftige Zusammenkunftsprogramm manuell mit den Informationen der offiziellen Website.

## Medien & Wiedergabe {#media-retrieval-and-playback}

### Getaktete Verbindung {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Aktivieren Sie dies, wenn Sie eine begrenzte Datenverbindung haben, um die Bandbreitennutzung zu reduzieren.

**Standard**: `false`

### Medienanzeige {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Aktivieren Sie die Medienanzeigefunktionalität. Dies ist erforderlich, um Medien auf einem zweiten Monitor zu präsentieren.

**Standard**: `false`

#### Medienvorschau aktivieren {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Zeigt eine Live-Vorschau des Medienfensters an, während ein Bild oder Video angezeigt wird.

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

### Wiedergabe- und Download-Optionen {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### Überblendungen für Medienfenster aktivieren {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Aktivieren Sie Ein-/Ausblendübergänge beim Anzeigen oder Ausblenden des Medienfensters.

**Standard**: `true`

#### Wiedergabegeschwindigkeitssteuerung aktivieren {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Ermöglicht es, die Wiedergabegeschwindigkeit von Audio- und Videodateien über das Kontextmenü des Medienelements anzupassen.

**Standard**: `false`

#### Medienlogo ausblenden {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Blenden Sie das Logo im Medienfenster aus.

**Standard**: `false`

#### Maximale Auflösung {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximale Auflösung für heruntergeladene Mediendateien.

**Optionen**: 240p, 360p, 480p, 720p, 1080p

**Standard**: 720p

#### Gedruckte Medien einbeziehen {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Schließen Sie Medien aus den gedruckten Publikationen in Medien-Downloads ein.

**Standard**: `true`

#### Fußnoten ausschließen {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Schließen Sie Fußnotenbilder nach Möglichkeit aus Medien-Downloads aus.

**Standard**: `false`

#### Zusätzliche Wachtturm-Studienvideos ausschließen {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Schließen Sie zusätzliche Videos aus, auf die in den Absätzen des Wachtturm-Studiums verwiesen wird.

**Standard**: `false`

#### Videos beim Versammlungsbibelstudium ausschließen {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Wählen Sie Publikationen aus, deren verlinkte Videos beim Versammlungsbibelstudium nicht gezeigt werden sollen. Suchen Sie nach Titel oder Symbol der Publikation.

**Standard**: Geh mutig deinen Weg mit Gott (`wcg`)

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

### Cache-Verwaltung {#cache-management}

#### Videos des Liederbuches zwischenspeichern {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Speichern Sie alle Videos des Liederbuches vorab zwischen, um die Leistung zu verbessern. Beachten Sie, dass dadurch der Medien-Zwischenspeicher größer wird.

**Standard**: `false`

#### Cache-Ordner {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Benutzerdefinierter Speicherort zum Speichern zwischengespeicherter Mediendateien.

**Standard**: Systemstandard

#### Automatisches Löschen des Caches aktivieren {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Löschen Sie alte zwischengespeicherte Dateien automatisch, um Speicherplatz zu sparen.

**Standard**: `true`

### Pinyin-Liedtitel {#pinyin-song-titles}

#### Pinyin-Lieder bevorzugen {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

Wird im Pinyin-Liederordner eine Pinyin-Version eines Lieds der Zusammenkunft gefunden, wird sie anstelle des regulären Lieds verwendet.

**Standard**: `false`

#### Pinyin-Liederordner {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

Ordner mit Pinyin-Liedvideos (z. B. `sjjm_s-Pi_CHS_066_r720P.mp4`). Wird eine Pinyin-Datei gefunden, die zur Nummer des Lieds der Zusammenkunft passt, wird sie anstelle des regulären Lieds abgespielt.

**Standard**: Leer

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

### Geteilter Ordner (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

Diese Einstellungen befinden sich in der Kategorie **Integrationen**.

M³ kann Ihren Zusammenkünften Medien aus einem Ordner hinzufügen, der von einer Cloud-Speicher-App wie Dropbox, OneDrive, iCloud Drive oder Google Drive synchronisiert wird. Das ist nützlich, wenn andere Medien für ihre Programmpunkte vorbereiten und mit Ihnen teilen oder wenn M³ auf mehreren Computern verwendet wird. Ein Ordner auf diesem Computer oder in Ihrem Netzwerk funktioniert ebenfalls.

M³ legt im geteilten Ordner für jede anstehende Zusammenkunft einen Ordner an, der nach ihrem Datum im Format Jahr-Monat-Tag benannt ist (zum Beispiel `2026-03-25`). Legen Sie Fotos, Videos, Audiodateien oder JW Library-Wiedergabelisten in den Ordner einer Zusammenkunft, und sie werden automatisch zur Medienliste dieser Zusammenkunft hinzugefügt. Um Dateien für einen anderen Tag hinzuzufügen, erstellen Sie dafür einen Ordner, der auf die gleiche Weise benannt ist. Alles andere im geteilten Ordner wird ignoriert.

:::tip Tipp

Erstellen Sie einen neuen Ordner, der nur dafür verwendet wird, zum Beispiel "Medien für Zusammenkünfte", und legen Sie in Ihrer Cloud-Speicher-App fest, dass er immer auf diesem Computer bleibt (oft "offline verfügbar" genannt), damit die Dateien vor Beginn der Zusammenkunft bereitstehen.

:::

#### Medien aus einem geteilten Ordner hinzufügen {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Fügen Sie die im geteilten Ordner abgelegten Dateien automatisch der richtigen Zusammenkunft hinzu.

**Standard**: `false`

#### Geteilter Ordner {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Der Ordner, aus dem Medien hinzugefügt werden. Der Einrichtungsassistent bietet an, ihn für Sie einzurichten.

**Standard**: Leer

#### Ordner von vergangenen Zusammenkünften löschen {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

Nach Ablauf einer Woche werden die datierten Ordner dieser Woche samt den darin enthaltenen Dateien gelöscht, damit der geteilte Ordner übersichtlich bleibt. Da der Ordner geteilt ist, werden sie auch für alle anderen gelöscht, die ihn verwenden. Deaktivieren Sie diese Option, um sie zu behalten.

**Standard**: `true`

## Zusammenkunfts-Timer {#meeting-timer}

### Zusammenkunftstimer aktivieren {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Aktivieren Sie ein separates Timer-Fenster zur Zeitmessung der Programmpunkte. Dies ist eine Beta-Funktion und sollte nur aktiviert werden, wenn dies vor Ort genehmigt wurde.

**Standard**: `false`

### Verhalten des Timer-Fensters {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Legen Sie fest, ob sich das Timer-Fenster automatisch öffnet, ob die Timer der Mitwirkenden standardmäßig hoch- oder herunterzählen, ob die Uhr im 12- oder 24-Stunden-Format angezeigt wird und ob der aktuelle Timerwert auf der Timer-Schaltfläche der Aktionsinsel angezeigt wird.

### Schnellzugriff auf den Timer {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Legen Sie fest, wie der Timer vom Hauptfenster aus erreichbar ist:

- **Schnellsteuerung beim Zeigen auf die Timer-Schaltfläche**: Wenn Sie mit der Maus auf die Timer-Schaltfläche der Aktionsinsel zeigen, werden der aktuell gemessene Programmpunkt und die Schaltflächen Start, Pause, Stopp und Nächster Teil angezeigt, ohne dass das vollständige Timer-Popup geöffnet wird. Standardmäßig aktiviert.
- **Timer-Bereich im Hauptfenster anzeigen**: Zeigt die gesamte Liste der Programmpunkte und die Timer-Steuerung in einem am rechten Rand des Hauptfensters angedockten Bedienfeld an, sodass sie immer sichtbar sind. Das vollständige Popup bleibt für die Fenster- und Anzeigeeinstellungen über die Aktionsinsel erreichbar.

### Timer-Fernanzeige {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemotePort` -->

Wenn aktiviert, stellt M³ die Timer-Anzeige als reine Ansicht auf einer Webseite in Ihrem lokalen Netzwerk bereit, für ein Tablet oder Smartphone am Rednerpult: Der Redner sieht die verbleibende Zeit, ohne dass sie auf dem Bildschirm der Versammlung oder in einer Zoom-Freigabe erscheint. Die Seite folgt dem Timer in Echtzeit, einschließlich Countdown vor der Zusammenkunft, Uhr, Überziehungsfarben und Handsignal, und alle Bedienelemente bleiben in M³.

Die auf dem Gerät zu öffnenden Adressen sind im Timer-Popup aufgeführt, mit einer Schaltfläche zum Kopieren. Ändern Sie den Port nur, wenn ihn bereits ein anderes Programm verwendet. Beachten Sie, dass jeder im selben Netzwerk die Seite öffnen kann, solange diese Funktion aktiviert ist; sie zeigt jedoch nichts außer dem Timer an.

**Standard**: `false`, Port `8787`

### Timer-Anzeigeformate {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Wählen Sie analoge oder digitale Anzeigeformate für Tageszeit und Countdown-Timer. Die Countdown-Warnung kann den analogen Countdown-Ring in der letzten Minute allmählich in eine Warnfarbe übergehen lassen.

Das Countdown-Format **Analoge Uhr mit Zeitbogen** zeigt die verbleibende Zeit eines Programmpunkts als Segment auf einem analogen Zifferblatt an, vom Minutenzeiger bis zum geplanten Ende, sodass ein einziger Blick sowohl die Uhrzeit als auch die Restzeit zeigt. Überzogene Zeit erscheint als zweites Segment in der Farbe für Überziehungen. Das Format gilt auch für den Countdown vor der Zusammenkunft und funktioniert im Hochzählmodus.

### Countdown bis zur Zusammenkunft und Zeitplanstatus {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Zeigen Sie vor geplanten Zusammenkünften einen Countdown an und lassen Sie optional anzeigen, ob die Zusammenkunft dem Zeitplan voraus ist oder hinterherhinkt. Der Countdown bis zur Zusammenkunft erscheint nur auf der Timer-Anzeige, nicht auf der Medienanzeige.

### Timer-Darstellung und Überziehung {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Passen Sie Textgröße und Farben des Timers an und konfigurieren Sie Hinweise auf Überziehungen, etwa andere Farben, Blinken oder die Anzeige nur der überzogenen Zeit im Hochzählmodus.

## Integrationen {#integrations}

Diese Kategorie enthält auch die Einstellungen für den [geteilten Ordner](#settings-guide-folder-monitoring), um Medien aus Dropbox, OneDrive, iCloud Drive oder Google Drive hinzuzufügen.

### Zoom-Integration {#settings-guide-zoom-integration}

#### Zoom aktivieren {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Aktivieren Sie die Integrationsfunktionen für Zoom-Meetings.

**Standard**: `false`

#### Tastenkürzel für Bildschirmfreigabe {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Tastenkürzel zum Auslösen der Zoom-Bildschirmfreigabe.

**Standard**: Keine

#### Medienfenster automatisch fokussieren {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Das Medienfenster wird nach dem Start der Zoom-Bildschirmfreigabe automatisch fokussiert. Dies ist normalerweise nicht nötig, kann aber auf manchen Systemen helfen, wenn das Medienfenster nach dem Start der Bildschirmfreigabe regelmäßig den Fokus verliert.

**Standard**: `false`

### Zoom Meeting Manager {#zoom-meeting-manager}

Der Zoom Meeting Manager (Beta, nur Windows) bedient die Zoom-Desktop-App rund um jede Zusammenkunft für Sie. Seine Einrichtungshilfe, die beim Aktivieren angeboten wird, führt Sie Schritt für Schritt durch jede Automatisierung.

#### Während M³ Zoom bedient {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Zoom bietet keine richtige Automatisierungsschnittstelle, daher steuert M³ die Zoom-App über ihre Barrierefreiheitsschnittstelle, die fast alles ohne Maus erledigen kann (die Teilnehmerliste, ihre Menüs, das Freigabefenster). Einige wenige Aktionen müssen trotzdem kurz die Maus bewegen oder den Fensterfokus wechseln, zum Beispiel um die automatisch ausgeblendete Symbolleiste von Zoom wieder einzublenden. In diesen Fällen überdeckt M³ sein eigenes Fenster mit dem Hinweis "M³ bedient Zoom", der angibt, was gerade geschieht, und eine Schaltfläche **Diese Automatisierung abbrechen** enthält. Derselbe Hinweis erscheint auch während der Prüfungen der Einrichtungshilfe und beim Selbsttest. Ein globales Tastenkürzel (Standard: `Ctrl+Alt+Escape`), das nur während einer laufenden Automatisierung aktiv ist, bricht diese von überall aus ab, selbst wenn Zoom den Fokus hat. Ein Abbruch stoppt M³ sofort; Zoom kann dabei auf halbem Weg stehen bleiben, überprüfen Sie es daher.

**Standard**: `Ctrl+Alt+Escape`

#### Helfer für erhobene Hände {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert`, `zoomHandRaisedPhrase` -->

Während einer Zusammenkunft achtet M³ in der Teilnehmerliste von Zoom auf erhobene Hände. Wenn jemand die Hand hebt, können Sie über eine Benachrichtigung in M³ mit einem Klick für diesen Teilnehmer **die Stummschaltung aufheben** und ihn, sobald er fertig gesprochen hat, mit einem weiteren Klick **wieder stummschalten und seine Hand senken**. Die Zoom-Schaltfläche auf der Aktionsinsel listet die erhobenen Hände mit denselben Schaltflächen auf. Jede Aktion wirkt anhand des genauen Namens auf die Zeile genau dieses Teilnehmers in Zoom; haben zwei Teilnehmer denselben Namen, lässt M³ beide unberührt.

Ist der [Zusammenkunfts-Timer](#meeting-timer) aktiviert, erscheint für den Vorsitzenden außerdem eine große Hand mit dem Namen des Teilnehmers auf der Timer-Anzeige, und die Schaltfläche **Handsignal** im Timer- und im Zoom-Popup blendet sie manuell ein. Dieser Teil erfordert die Timer-Anzeige; die Benachrichtigungen und Schaltflächen funktionieren auch ohne sie.

Zoom kennzeichnet erhobene Hände in der jeweils eingestellten Sprache, deshalb muss M³ zuerst lernen, wie das aussieht: Öffnen Sie Ihre Zusammenkunft in Zoom und klicken Sie auf **Lernen, wie Zoom erhobene Hände kennzeichnet**. M³ hebt Ihre eigene Hand, liest aus, wie Zoom sie in der Teilnehmerliste kennzeichnet und mit welchem Menüeintrag sie gesenkt wird, und senkt sie dann wieder. Auch der Einrichtungsassistent bietet diesen Schritt an.

**Standard**: `false`

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

- **Bilder nicht automatisch teilen**: Geben Sie Bilder erst dann an OBS weiter, wenn Sie dies manuell auslösen
- **Schnellumschalter**: Aktivieren Sie den schnellen Ein-/Ausschalter für die OBS-Integration
- **Szene nach Medien wechseln**: Kehren Sie nach Medien automatisch zur vorherigen Szene zurück
- **Vorherige Szene merken**: Merken Sie sich die vorherige Szene und stellen Sie sie wieder her
- **Symbole ausblenden**: Blenden Sie OBS-bezogene Symbole in der Benutzeroberfläche aus
- **Aufnahmesteuerung**: Zeigen Sie Steuerelemente an, mit denen die OBS-Aufnahme aus M³ heraus gestartet und gestoppt werden kann

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

### Aufzeichnungen der Zusammenkunft {#meeting-recordings}

#### Integration einer externen Aufnahmeanwendung aktivieren {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Lassen Sie M³ eine separate Aufnahmeanwendung über Tastenkürzel steuern. Dabei nimmt M³ nicht selbst auf, sondern sendet die konfigurierten Tastenkürzel, wenn Sie im Popup "Aufzeichnungen der Zusammenkunft" auf **Aufnahme starten** oder **Aufnahme stoppen** klicken.

Diese Option wird ausgeblendet, wenn die OBS-Aufnahmesteuerung aktiviert ist. Wenn Sie OBS Studio verwenden, nutzen Sie stattdessen die OBS-Aufnahmesteuerung in der OBS-Integration.

**Standard**: `false`

#### Tastenkürzel und Ordner für Aufnahmen {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Legen Sie das Tastenkürzel zum Starten der Aufnahme, das optionale Tastenkürzel zum Stoppen der Aufnahme sowie den Ordner fest, in dem die externe App die Aufnahmen speichert. Wenn kein Tastenkürzel zum Stoppen angegeben ist, verwendet M³ das Tastenkürzel zum Starten. Wenn ein Ordner festgelegt ist, zeigt M³ eine Schaltfläche an, um ihn zu öffnen.

## Schnittstelle & Verknüpfungen {#interface-shortcuts}

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

### Schaltfläche "Mehr Medien hinzufügen" {#add-more-media-button}

#### Bereiche mit "Mehr Medien hinzufügen"-Schaltfläche {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Wählen Sie, welche Bereiche der Zusammenkunft eine eigene Schaltfläche zum Hinzufügen eigener Medien anzeigen, zusätzlich zur Schaltfläche "Medien hinzufügen" in der oberen Symbolleiste, die immer für alle Bereiche funktioniert.

**Standard**: Öffentlicher Vortrag, Unser Leben als Christ, Besuch des Kreisaufsehers und benutzerdefinierte Bereiche

#### Kompaktmodus für die Schaltfläche „Medien hinzufügen“ {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

Für die Schaltfläche "Mehr Medien hinzufügen"/"Lied hinzufügen" in den Bereichsüberschriften nur ein Symbol anzeigen. Wenn deaktiviert, zeigt die Schaltfläche bei genügend Platz neben dem Symbol auch Text an.

**Standard**: `true`

### Ziehgriff für Medien {#media-drag-handle}

#### Ziehgriff anzeigen {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Zeigt an jedem Medienelement einen kleinen Griff an, mit dem es sich durch Ziehen neu anordnen lässt. Medienelemente lassen sich immer durch Ziehen an einer beliebigen Stelle neu anordnen; diese Einstellung legt nur fest, ob das Griffsymbol selbst angezeigt wird.

**Standard**: `true`

### Schnelle Aktionen vor/nach Zusammenkünften {#before-after-meeting-quick-actions}

#### Schnelle Aktionen für Zusammenkünfte anzeigen {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Zeigt je ein Bedienfeld vor und nach der Zusammenkunft mit nützlichen Steuerelementen (Hintergrundmusik, Aufnahme) und jeweils einer anpassbaren Checkliste an.

**Standard**: `true`

Die Kategorien und Aufgaben der Checklisten für beide Bedienfelder, vor und nach der Zusammenkunft, werden in demselben Einstellungsbereich verwaltet: Fügen Sie Kategorien und Aufgaben hinzu, benennen Sie sie um, ordnen Sie sie neu an oder löschen Sie sie, ganz wie es Ihre Versammlung benötigt.

## Erweitert {#advanced-settings}

### Übertragung der Profileinstellungen {#profile-settings-transfer}

Exportieren Sie die Einstellungen des aktuellen Profils in eine JSON-Datei oder importieren Sie eine zuvor exportierte Datei mit Profileinstellungen. Das Importieren ersetzt die Einstellungen des aktuellen Profils.

### Gefahrenzone {#danger-zone}

:::warning Warnung

Diese Einstellungen sollten nur geändert werden, wenn Sie ihre Auswirkungen verstehen.

:::

#### Basis-URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Basisdomäne, die zum Herunterladen von Publikationen und Medien verwendet wird.

**Standard**: `jw.org`

#### Hardwarebeschleunigung deaktivieren {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Deaktiviert die Hardwarebeschleunigung nach einem Neustart von M³. Dies kann auf einigen Systemen bei Grafikfehlern oder Abstürzen helfen, wird aber ansonsten nicht empfohlen.

**Standard**: `false`

#### Erinnerung an Hardwarebeschleunigung unterdrücken {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Blendet die Erinnerung aus, die Hardwarebeschleunigung wieder zu aktivieren, nachdem sie manuell deaktiviert wurde.

**Standard**: `false`

#### Medienabruf deaktivieren {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Deaktivieren Sie automatische Medien-Downloads vollständig. Verwenden Sie dies nur für Profile, die für Sonderveranstaltungen oder andere benutzerdefinierte Setups verwendet werden.

**Standard**: `false`

## Tipps für eine optimale Konfiguration {#configuration-tips}

### Für neue Benutzer {#new-users}

1. Beginnen Sie mit dem Einrichtungsassistenten, um grundlegende Einstellungen zu konfigurieren
2. Schalten Sie "Medienwiedergabe aktivieren" ein, um die Präsentationsfunktionen nutzen zu können
3. Konfigurieren Sie Ihren Zusammenkunftsplan genau
4. Richten Sie die OBS-Integration ein, wenn Sie hybride Zusammenkünfte nutzen

### Für fortgeschrittene Benutzer {#advanced-users}

1. Verwenden Sie einen geteilten Ordner, um Medien aus einem Cloud-Speicher wie Dropbox oder OneDrive hinzuzufügen
2. Aktivieren Sie den automatischen Medienexport für Sicherungszwecke
3. Konfigurieren Sie Tastenkürzel für einen effizienten Betrieb
4. Konfigurieren Sie die Zoom-Integration für automatische Bildschirmfreigabe

### Leistungsoptimierung {#performance-optimization}

1. Speichern Sie die Videos des Liederbuches zwischen, um die Leistung zu verbessern
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
