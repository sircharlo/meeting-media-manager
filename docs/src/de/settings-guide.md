# Einstellungs-Handbuch {#settings-guide}

Dieses umfassende Handbuch erklärt alle in M³ verfügbaren Einstellungen, organisiert nach Kategorien. Das Verständnis dieser Einstellungen hilft Ihnen, M³ so zu konfigurieren, dass es perfekt für die Bedürfnisse Ihrer Versammlung funktioniert.

## General {#application-configuration}

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

#### Enable Schedule Sync {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Re-links the current profile to congregation lookup so automatic meeting day and time updates can resume. Only shown once the congregation name has been changed manually, since that's what breaks the link in the first place.

#### Refresh Meeting Schedule {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Manually synchronize the current and future meeting schedule with the information from the official website.

## Media & Playback {#media-retrieval-and-playback}

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

### Playback and Download Options {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

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

#### Exclude Congregation Bible Study Videos {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Choose publications whose referenced videos should not be shown during the Congregation Bible Study. Search by publication title or symbol.

**Default**: Walk Courageously With God (`wcg`)

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

#### Cache Songbook Video Files {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Cache all songbook videos ahead of time for better performance. Note that this increases the size of the media cache.

**Standard**: `false`

#### Cache-Ordner {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Benutzerdefinierter Speicherort zum Speichern zwischengespeicherter Mediendateien.

**Standard**: Systemstandard

#### Automatisches Löschen des Caches aktivieren {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Löschen Sie alte zwischengespeicherte Dateien automatisch, um Speicherplatz zu sparen.

**Standard**: `true`

### Pinyin Song Titles {#pinyin-song-titles}

#### Prefer Pinyin Songs {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

When a pinyin version of a meeting song is found in the pinyin song folder, use it instead of the standard song.

**Standard**: `false`

#### Pinyin Song Folder {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

Folder containing pinyin video songs (e.g. `sjjm_s-Pi_CHS_066_r720P.mp4`). When a pinyin file matching the meeting song number is found, it will be played instead of the standard song.

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

### Shared Folder (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

These settings are in the **Integrations** category.

M³ can add media to your meetings from a folder kept in sync by a cloud storage app, such as Dropbox, OneDrive, iCloud Drive or Google Drive. This is useful when others prepare media for their parts and share it with you, or when M³ is used on more than one computer. A folder on this computer or on your network works too.

M³ creates a folder inside the shared folder for each upcoming meeting, named with the meeting's date written as year-month-day (for example, `2026-03-25`). Put photos, videos, audio files or JW Library playlists in a meeting's folder, and they're added to that meeting's media list automatically. To add files for another day, create a folder for it, named the same way. Anything else in the shared folder is ignored.

:::tip Tipp

Create a new folder used only for this, such as "Meeting media", and set it to always stay on this computer in your cloud storage app (often called "available offline"), so the files are ready before the meeting starts.

:::

#### Add Media From a Shared Folder {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Add the files put in the shared folder to the right meeting automatically.

**Standard**: `false`

#### Shared Folder {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

The folder to add media from. The setup wizard offers to set it up for you.

**Standard**: Leer

#### Delete Past Meeting Folders {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

When a week is over, delete that week's dated folders, along with the files in them, to keep the shared folder tidy. Since the folder is shared, they're also deleted for everyone else who uses it. Turn this off to keep them.

**Standard**: `true`

## Meeting Timer {#meeting-timer}

### Enable Meeting Timer {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Enable a separate timer window for timing meeting parts. This is a beta feature and should only be enabled if approved locally.

**Standard**: `false`

### Timer Window Behavior {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configure whether the timer window opens automatically, whether participant timers count up or down by default, whether the clock uses 12-hour or 24-hour time, and whether the current timer value is shown on the action island timer button.

### Quick Access to the Timer {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Choose how the timer is reached from the main window:

- **Quick controls when hovering the timer button**: hovering the timer button on the action island shows the part being timed, with Start, Pause, Stop and Next part buttons, without opening the full timer popup. On by default.
- **Show a timer panel in the main window**: keeps the whole list of meeting parts and the timer controls in a panel docked on the right side of the main window, always in view. The full popup remains available from the action island for the window and display settings.

### Timer Remote {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemotePort` -->

When turned on, M³ serves a read-only copy of the timer display as a web page on your local network, for a tablet or phone at the lectern: the speaker sees the remaining time without it being on the congregation's screen or in a Zoom share. The page follows the timer in real time, including the pre-meeting countdown, the clock, overtime colors and the hand alert, and all the controls stay in M³.

The addresses to open on the device are listed in the timer popup, with a copy button. Change the port only if another program already uses it. Note that anyone on the same network can open the page while this is on; it shows nothing but the timer.

**Default**: `false`, port `8787`

### Timer Display Formats {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Choose analog or digital display formats for the time of day and countdown timers. The countdown warning indicator can shift the analog countdown ring toward a warning color during the final minute.

The **Analog clock with time arc** countdown format shows the time left for a part as a wedge on an analog clock face, from the minute hand to the planned end, so one glance shows both the time of day and what's left. Overtime shows as a second wedge in the overtime color. It also applies to the pre-meeting countdown and works in count-up mode.

### Meeting Countdown and Schedule Status {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Show a countdown before scheduled meetings and optionally display whether the meeting is ahead of or behind schedule. The meeting countdown appears only on the timer display, not on the main media display.

### Timer Appearance and Overtime {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Customize the timer text size and colors, and configure overtime indicators such as alternate colors, blinking, and showing only the elapsed overtime amount in count-up mode.

## Integrationen {#integrations}

This category also holds the [shared folder](#settings-guide-folder-monitoring) settings, for adding media from Dropbox, OneDrive, iCloud Drive or Google Drive.

### Zoom-Integration {#settings-guide-zoom-integration}

#### Zoom aktivieren {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Aktivieren Sie die Integrationsfunktionen für Zoom-Meetings.

**Standard**: `false`

#### Tastenkürzel für Bildschirmfreigabe {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Tastenkürzel zum Auslösen der Zoom-Bildschirmfreigabe.

**Standard**: Keine

#### Auto-Focus Media Window {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Automatically focus the media window after Zoom screen sharing starts. This is usually not required, but can help on some systems if the media window regularly loses focus after screen sharing starts.

**Standard**: `false`

### Zoom Meeting Manager {#zoom-meeting-manager}

The Zoom Meeting Manager (beta, Windows only) operates the Zoom desktop app for you around each meeting. Its setup assistant, offered when you turn it on, walks you through each automation.

#### While M³ Operates Zoom {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Zoom offers no proper automation interface, so M³ drives the Zoom app through its accessibility interface, which works without the mouse for nearly everything (the participants list, its menus, the Share window). A few actions can still have to move the mouse or the focused window for a moment, for example to bring Zoom's auto-hidden toolbar back. Whenever that happens, M³ covers its own window with a "M³ is operating Zoom" notice naming what is going on, with a **Cancel this automation** button. The same notice shows during the setup assistant's checks and the self-test. A global keyboard shortcut (default `Ctrl+Alt+Escape`), active only while an automation runs, cancels it from anywhere, even while Zoom has the focus. Cancelling stops M³ at once; Zoom may then be left part-way, so check it.

**Default**: `Ctrl+Alt+Escape`

#### Raised-Hand Helper {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert`, `zoomHandRaisedPhrase` -->

During a meeting, M³ watches Zoom's participants list for raised hands. When someone raises their hand, a notification in M³ lets you **unmute** that participant with one click, and, once they are done speaking, **mute them again and lower their hand** with another. The Zoom button on the action island lists the raised hands with the same buttons. Every action goes to that participant's own row in Zoom, by their exact name; if two participants share a name, M³ touches neither.

If the [meeting timer](#meeting-timer) is enabled, a large hand with the participant's name also appears on the timer display for the chairman, and a **Hand alert** button in the timer and Zoom popups shows it by hand. This part needs the timer display; the notifications and buttons work without it.

Zoom marks raised hands in its own language, so M³ first needs to learn how: with your meeting open in Zoom, click **Learn how Zoom marks raised hands**. M³ raises your own hand, reads how Zoom marks it in the participants list and which menu entry lowers it, then lowers it again. The setup assistant offers this step too.

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

- **Do Not Automatically Share Images**: Delay sharing images to OBS until manually triggered
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

## Interface & Shortcuts {#interface-shortcuts}

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

### Add More Media Button {#add-more-media-button}

#### Sections with an Add Media Button {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Choose which meeting sections show their own button for adding your own media, in addition to the "Add media" button in the top toolbar, which always works for every section.

**Default**: Public Talk, Living as Christians, Circuit Overseer's Visit, and Custom sections

#### Compact Add Media Button {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

Only show an icon for the "Add more media"/"Add a song" button in section headers. When disabled, the button also shows text alongside the icon when there's enough room.

**Standard**: `true`

### Media Drag Handle {#media-drag-handle}

#### Show Drag Handle {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Show a small handle on each media item for dragging it to reorder. Media items can always be reordered by dragging anywhere on them; this only affects whether the handle icon itself is shown.

**Standard**: `true`

### Before/After Meeting Quick Actions {#before-after-meeting-quick-actions}

#### Show Meeting Quick Actions {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Show a before-meeting panel and an after-meeting panel with useful controls (background music, recording) and a customizable checklist for each.

**Standard**: `true`

The checklist categories and tasks for both the before-meeting and after-meeting panels are managed from this same settings section: add, rename, reorder, or delete categories and tasks as needed for your congregation.

## Advanced {#advanced-settings}

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
2. Turn on "Enable media playback" to access presentation features
3. Konfigurieren Sie Ihren Zusammenkunftsplan genau
4. Richten Sie die OBS-Integration ein, wenn Sie hybride Zusammenkünfte nutzen

### Für fortgeschrittene Benutzer {#advanced-users}

1. Use a shared folder to add media from cloud storage, such as Dropbox or OneDrive
2. Aktivieren Sie den automatischen Medienexport für Sicherungszwecke
3. Konfigurieren Sie Tastenkürzel für einen effizienten Betrieb
4. Konfigurieren Sie die Zoom-Integration für automatische Bildschirmfreigabe

### Leistungsoptimierung {#performance-optimization}

1. Cache songbook video files for better performance
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
