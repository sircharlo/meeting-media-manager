<!-- markdownlint-disable no-duplicate-heading -->

# Was ist neu

Die vollständige Liste der Änderungen zwischen den Versionen finden Sie in unserer CHANGELOG.md Datei auf GitHub.

## v26.7.7

### ✨ Neue Funktionen

- ✨ **Media Preview Quality**: Media preview now renders video frames via canvas with high-quality downscaling, fixing jagged/blurry previews (especially on text-heavy content like songs). The preview also auto-disables itself if it has to repeatedly correct playback drift on a single video, with a one-click way to turn it back on.

## v26.7.6

### ✨ Neue Funktionen

- ✨ **CBS Video Exclusion**: Added a setting to exclude Congregation Bible Study videos from specific publications (defaults to the **Walk Courageously With God** book), with a searchable publication picker.
- ✨ **Document Page Numbers**: Publication Media and JWPUB import listings now show each document's page number (or numbers when there are multiple pages) after its title. This can help you to quickly find specific media when you know the page number on which it is found.

## v26.7.4

### ✨ Neue Funktionen

- ✨ **Missing Media Recovery**: Media items whose local file went missing (e.g. deleted by the cache auto-clear, or removed manually) now show a disabled play button, a "missing" caption naming the file to look for, and a new "Locate file" action to relink the item to a file on disk.
- ✨ **Compatibility Warning**: Added a dismissible banner warning users on soon-to-be-unsupported OS/architecture combos (macOS 12 Monterey and Windows 32-bit) to upgrade before future app updates require newer system support.

## v26.7.0

### ✨ Neue Funktionen

- ✨ **Linked Audio Playback**: Added support for playing audio from one file together with video from another file. This can be useful for playing video slideshows with accompanying music.
- ✨ **Watched Media Layouts**: Added persistence for watched media items and section order across watched folders. This ensures that the media list is displayed the same way even when the watched folder is synced across devices.

## v26.6.1

### ✨ Neue Funktionen

- ✨ **Media Preview**: Added a live media preview overlay that can be toggled on or off from the settings or from the display popup.
- ✨ **Search media**: Added a quick search box in the media list that allows you to quickly find media by title. To use it, simply use the standard keyboard shortcut for search (Ctrl+F or Cmd+F).
- ✨ **Filter settings**: Added a filter box to the settings page that allows you to find settings by keyword or category. To use it, simply click on the Search button in the top right corner of the settings page, or use the standard keyboard shortcut for search (Ctrl+F or Cmd+F).
- ✨ **Background Music Overlap Warning**: Added a warning notification when media is started while background music is playing. Users can choose to stop the background music from the notification.

## v26.6.0

### ✨ Neue Funktionen

- ✨ **Timer**: Added analog display modes and timing report status.
- ✨ **Profiles**: Added profile settings import and export in Advanced settings and the Setup Wizard.
- ✨ **Media Window**: Added support for automatically hiding the media window after playback when it was initially hidden. This is practical when a remote speaker wants to display images, for example.

## v26.5.0

### ✨ Neue Funktionen

- ✨ **PDF Import**: Added a new PDF import flow to the Publication Media dialog, allowing the PDF version of a publication to be automatically imported as individual images when desired.

## v26.4.8

### ✨ Neue Funktionen

- ✨ **JW Stream**: Added JW Stream to the list of websites that can be mirrored.

## v26.4.0

### ✨ Neue Funktionen

- ✨ **Meeting Timer**: A new meeting timer feature has been added. It is optional and can be enabled in the advanced settings, if desired. The timer can be used to allow the media operator to keep track of the time spent on meeting parts, or to display the time spent on the current meeting part on a dedicated screen visible only to the speaker.

## v26.3.0

### ✨ Neue Funktionen

- ✨ **Memorial Media**: Automatic Memorial media retrieval is now out of beta! The app will automatically download the Memorial Welcome Video and image to display during the Memorial, when available in the configured language.
- ✨ **Playback Speed**: Added playback speed control with visual indicator, and manual reset. This feature is only visible if enabled in the advanced settings.
- ✨ **Pinyin Songs**: Added a toggle for pinyin song substitution for meetings held in Chinese.

## v26.2.0

### ✨ Neue Funktionen

- ✨ **Speicherplatzprüfung**: Funktion hinzugefügt, um zu überwachen und zu benachrichtigen, wenn der Speicherplatz knapp wird.

## v26.1.5

### ✨ Neue Funktionen

- ✨ **Gedächtnismahl-Medien**: Ruft automatisch das Gedächtnismahl-Banner und das Intro-Video in unterstützten Sprachen ab, wenn das Gedächtnismahl-Datum ausgewählt ist.

## v26.1.0

### ✨ Neue Funktionen

- ✨ **Automatische Synchronisierung der Zusammenkunftspläne**: Funktion hinzugefügt, Zusammenkunftstage und -zeiten automatisch mit der offiziellen Website zu synchronisieren. Diese Funktion ist standardmäßig aktiviert und kann in den erweiterten Einstellungen manuell ausgelöst oder deaktiviert werden.
- ✨ **Zukünftige Planänderungen**: Die App berücksichtigt nun zukünftige Planänderungen beim Erstellen einer Versammlung über die Website-Suche, falls verfügbar.
- ✨ **Gemeinsamer Cache für maschinenweite Installationen**: Maschinenweite Installationen teilen sich nun standardmäßig einen gemeinsamen Datenordner, was Speicherplatz und Bandbreitennutzung über mehrere Benutzer auf demselben Computer hinweg optimiert.

## v25.12.2

### ✨ Neue Funktionen

- ✨ **Zoom-/Schwenk-Schaltflächen**: Möglichkeit hinzugefügt, Zoom- und Schwenk-Schaltflächen für eine kontinuierliche Anpassung gedrückt zu halten.

## v25.12.0

### ✨ Neue Funktionen

- ✨ **Kontextmenü für Mehrfachauswahl**: Unterstützung für Rechtsklick-Menüaktionen hinzugefügt, wenn mehrere Medienelemente ausgewählt sind.
- ✨ **Tastenkürzel**: `Strg/Cmd+A` zum Auswählen aller Medien, `H` zum Ausblenden ausgewählter Medien und `Umschalt+Oben/Unten` für die Tastaturnavigation hinzugefügt.
- ✨ **Einstellungen für Wachtturm-Studienvideos**: Einstellung hinzugefügt, um zusätzliche Wachtturm-Studienvideos auszuschließen.
- ✨ **Einklappbare Abschnitte**: Möglichkeit hinzugefügt, Abschnitte an Tagen ohne Zusammenkunft für eine übersichtlichere Ansicht einzuklappen.
- ✨ **JW Events Website**: Möglichkeit hinzugefügt, die JW Events Website zusätzlich zur offiziellen Hauptwebsite zu präsentieren.
- ✨ **Anpassung des Playlist-Imports**: Möglichkeit hinzugefügt, das Präfix anzupassen, das Medienelementen beim Importieren von JW-Playlists hinzugefügt wird.
- ✨ **Navigation bei Website-Spiegelung**: Schalter hinzugefügt, um nach dem Stoppen der Website-Spiegelung automatisch zur Medienliste zu navigieren.
- ✨ **OBS-Aufnahmesteuerung**: Möglichkeit hinzugefügt, OBS-Aufnahmen zu steuern.
- ✨ **Jahrestext-Vorschau**: Möglichkeit hinzugefügt, den Jahrestext des nächsten Jahres ab Dezember jeden Jahres in der Vorschau anzuzeigen.
- ✨ **Update-Benachrichtigungen**: Warnmeldungen hinzugefügt, wenn eine Beta-Version ausgeführt wird oder Updates deaktiviert sind, sowie verbesserte Anzeige des Update-Download-Fortschritts.
- ✨ **Hardwarebeschleunigungs-Einstellungen**: Option hinzugefügt, die Hardwarebeschleunigung bei Bedarf dauerhaft zu deaktivieren.

## v25.11.0

### ✨ Neue Funktionen

- ✨ **JWPUB-Medienauswahl**: Möglichkeit hinzugefügt, einzelne Medien aus JWPUB-Dateien auszuwählen.
- ✨ **Medienfenster automatisch fokussieren**: Optionale Einstellung hinzugefügt, um das Medienfenster nach der Zoom-Bildschirmfreigabe automatisch zu fokussieren.
- ✨ **Cursor-Overlay für TV-Anzeige**: Verbessertes Cursor-Overlay im Website-Fenster für bessere Sichtbarkeit des Mauszeigers auf TV-Bildschirmen.
- ✨ **Zusammenkunftsaufnahme**: Neue Funktion zur Aufnahme von Zusammenkünften hinzugefügt, um eine externe Aufnahme-App zu steuern.
- ✨ **Website-Suche**: Möglichkeit hinzugefügt, mithilfe der intelligenten Suche auf der Website nach Medien oder Publikationen zu suchen.
- ✨ **Einfacher manueller Publikationsimport**: Funktion hinzugefügt, um Publikationen wie Zeitschriften, Bücher, Programme und Einladungen einfach von JW.org zu importieren.
- ✨ **Verbesserungen für Gebärdensprache**: Bestätigung vor dem Abspielen ganzer Dateien für Gebärdensprachen und Unterstützung für die Auswahl mehrerer Clips hinzugefügt, z. B.
- ✨ **Clip-Navigation**: Daueranzeige zu Clip-Listenelementen hinzugefügt und Clip-Navigation verbessert.
- 🛠️ **Medienanzeige**: Sichergestellt, dass die Medienanzeige sichtbar wird, wenn die Wiedergabe beginnt, auch wenn sie zuvor ausgeblendet war.

## v25.10.1

### ✨ Neue Funktionen

- ✨ **Einrichtungsassistent – Zoom-Schritt**: Zoom-Integrationsschritt zum Einrichtungsassistenten für eine einfachere Erstkonfiguration hinzugefügt.
- ✨ **Verbesserungen bei der Bildschirmauswahl**: Zeigt eine genaue visuelle Darstellung aller Bildschirme sowie die aktuelle Größe und Position des Hauptfensters im Anzeige-Popup an. Dies erleichtert die Auswahl des richtigen Bildschirms, auf dem das Medienfenster angezeigt werden soll.
- ✨ **Präferenz für Medienfenster**: Die App merkt sich nun den bevorzugten Bildschirm, auf dem das Medienfenster angezeigt werden soll, falls vom Benutzer angegeben.

## v25.10.0

### ✨ Neue Funktionen

- ✨ **Wiedergabe pausiert beginnen**: Neue Einstellung hinzugefügt, die es ermöglicht, die Wiedergabe pausiert zu beginnen. Dies kann für AV-Operatoren nützlich sein, um ihr Setup vorzubereiten (z. B. Starten der Zoom-Freigabe), bevor die Medienwiedergabe im Medienfenster beginnt.
- ✨ **Update-Benachrichtigungen**: Benutzer werden nun durch ein In-App-Banner über Updates benachrichtigt, das es dem Benutzer auch ermöglicht, Updates sofort zu installieren, anstatt auf den nächsten Neustart der App zu warten.
- ✨ **Benutzerdefinierte Ereignisse**: Optionale Ereignis-Hooks hinzugefügt, die Tastenkürzel auslösen können, wenn bestimmte Ereignisse erkannt werden. Dies kann für AV-Operatoren nützlich sein, um Aktionen automatisch außerhalb der App auszuführen. Zum Beispiel könnten intelligente Lichter vor und nach dem Abspielen von Medien in Auditorien, in denen Projektoren verwendet werden, ein- und ausgeschaltet werden; oder ein Skript kann ausgeführt werden, nachdem das letzte Lied einer Zusammenkunft gespielt wurde, um verschiedene Aktionen in einem Zoom-Meeting zu automatisieren.

## v25.9.1

### ✨ Neue Funktionen

- ✨ **Medienfenster immer im Vordergrund & Vollbildverhalten**: Verhalten "Immer im Vordergrund" für das Medienfenster behoben und verbessert, passt sich dynamisch basierend auf dem Vollbildstatus an.
- ✨ **Einstellung für Datumsanzeigeformat**: Benutzereinstellung zur Konfiguration eines Datumsanzeigeformats hinzugefügt.
- ✨ **Medien-Überblendung**: Überblendungsübergänge für die Medienanzeige implementiert, anstelle der abrupten Schwarzblende, die zuvor vorhanden war.
- ✨ **Music Auto-Stop**: Optimized the behavior of the background music auto-stop to behave the same whether music was auto-started or not
- ✨ **macOS-Klick-Durchgriff auf inaktive Fenster**: Mausklick-Durchgriff auf das Hauptfenster für macOS aktiviert, was die Steuerung der App erleichtern sollte, auch wenn sie nicht fokussiert ist.

## v25.9.0

### ✨ Neue Funktionen

- ✨ **Verbesserungen am Download-Popup**: Aktualisieren-Schaltfläche und Download-Gruppierung nach Datum im Download-Popup hinzugefügt.
- ✨ **Erinnerung an die Reihenfolge angesehener Medien**: Erinnerung an die Abschnittsreihenfolge für angesehene Medienelemente hinzugefügt.

## v25.8.3

### ✨ Neue Funktionen

- ✨ **Überblendungen für Medienfenster**: Neue erweiterte Einstellung hinzugefügt, um das Medienfenster ein- und auszublenden, was weichere visuelle Übergänge bietet.
- ✨ **Bilddauersteuerung und Fortschrittsverfolgung**: Bilddauersteuerung und Fortschrittsverfolgungsfunktionen für wiederholte Abschnitte hinzugefügt.

## v25.8.1

### ✨ Neue Funktionen

- ✨ **Benutzerdefinierte Medienabschnitte**: Vollständiges System zum Erstellen, Bearbeiten und Verwalten von benutzerdefinierten Medienabschnitten mit Farbanpassung und Drag-and-Drop-Sortierung.
- ✨ **Medienteiler**: Titel-Teiler innerhalb von Medienlisten für eine bessere Organisation mit Optionen für die Positionierung oben/unten hinzufügen.
- ✨ **Abschnitts-Wiederholungsmodus**: Kontinuierliche Wiedergabe innerhalb bestimmter Abschnitte für nahtlose Medienschleifen aktivieren.
- ✨ **Zoom-Integration**: Automatische Koordinierung des Starts/Stopps der Bildschirmfreigabe mit der Medienwiedergabe.

## v25.7.0

### ✨ Neue Funktionen

- No new features for this release!

## 25.6.0

### ✨ Neue Funktionen

- ✨ **Einstellung für getaktete Verbindung**: Neue Einstellung hinzugefügt, um die Bandbreitennutzung bei getakteten Verbindungen zu reduzieren.
- ✨ **Verbesserte Handhabung von gestreamten Medien**: Bessere Unterstützung für gestreamte Medien, Reduzierung von latenzbedingten Problemen.

## 25.5.0

### ✨ Neue Funktionen

- 🖼️ **OBS-Verzögerungsoption für Bilder**: OBS Studio-Einstellung hinzufügen, um Szenenwechsel bei der Anzeige von Bildern zu verzögern und Übergänge zu verbessern.
- 🔊 **Unterstützung für `.m4a`-Audioformat**: Kompatibilität für `.m4a`-Audiodateien hinzugefügt, um unterstützte Medientypen zu erweitern.

## 25.4.0

### ✨ Neue Funktionen

- 🇵🇭 **Neue Sprache: Tagalog**: Unterstützung für Tagalog hinzugefügt, um die Mehrsprachigkeit der App zu erweitern.
- 🎞️ **Unterstützung des `.m4v` Videoformats**: Unterstützt nun die Wiedergabe von `.m4v` Dateien, um die Medienkompatibilität zu verbessern.

## 25.3.1

### ✨ Neue Funktionen

- 🌏 **Neue Sprache: Koreanisch**: Unterstützung für die koreanische Sprache hinzugefügt, um die Zugänglichkeit für mehr Benutzer zu erweitern.

## 25.3.0

### ✨ Neue Funktionen

- 🎵 **Hintergrundmusik mit Videos**: Ermöglicht Hintergrundmusik weiter abzuspielen, während Videos angezeigt werden.
- 🎥 **Kamera-Feed für Gebärdensprachmedien**: Möglichkeit hinzufügen, einen Kamera-Feed im Medienfenster speziell für Gebärdensprachnutzer anzuzeigen.
- 📅 **Automatisches Gedächtnismahl-Datum & Hintergrund**: Das Gedächtnismahl-Datum automatisch erkennen und festlegen sowie das Gedächtnismahl-Hintergrundbild vorbereiten.
- 📜 **Versionshinweise in der App anzeigen**: Versionshinweise direkt in der Anwendung anzeigen, damit Benutzer Änderungen nach einem Update leicht überprüfen können.

## 25.2.1

### ✨ Neue Funktionen

- 🔄 **Allow OBS Reconnection Attempts**: Introduce the possibility to manually force OBS to reconnect when needed.
- 🗑 **Auto Cleanup Old Export Date Folders**: Automatically remove outdated export date folders to keep storage organized.

## 25.2.0

### ✨ Neue Funktionen

- 🌍 **Use System Locale by Default**: Automatically detect and use the system's locale for a more personalized experience.
- 🏷 **Tag Support for Exported Media**: Add metadata tags to exported media files for better organization.
- 🔄 **Automatic Beta to Stable Downgrade**: Allow automatic downgrades from beta versions to stable releases when necessary.
- 🌐 **Extract Latest MEPS Language Indexes**: Fetch the most recent MEPS language indexes directly from the official website, ensuring up-to-date language support.

## 25.1.0

### ✨ Neue Funktionen

- 📅 **Open Previous Dates**: Allow opening previous dates of the current week, which is useful when the meeting day is moved later in the week.
- 🛑 **Error Banner for OBS Studio**: Add an error banner when OBS Studio is not connected on a meeting day, ensuring users are alerted.
- 📚 **Group Media by Publication**: Group media from the same referred publication for a cleaner and more organized media overview.
- 🎵 **Duplicate Song Warning**: Show a warning if songs are listed more than once in the media list for weekend meetings.
- 🔄 **Future Schedule Planning**: Enable the planning of future meeting schedule changes, which is useful for yearly schedule changes or for the circuit overseer's visit to a neighboring congregation.

## 24.11.0

### ✨ Neue Funktionen

- **feat**: Presenting the website is now supported on macOS 🚀
- **feat**: Introduced keyboard shortcuts for stopping, pausing, and resuming media playback 🚀
- **feat**: Added support for setting the web address from which media should be downloaded 🚀
- **feat**: Added OBS Studio instant scene picker and overhauled scene picker functionality in settings
- **feat**: Expanded documentation website to support more languages

## 24.10.10

### ✨ Neue Funktionen

- **new**: Added keyboard shortcuts to navigate to the next/previous media item
- **new**: Added a right-click menu to media items to hide media items and rename them
- **new**: Trimmed video times are now respected in imported JWL playlists

## 24.10.9

### ✨ Neue Funktionen

- **feat**: Added an option to delete all extra media files for the currently selected day
