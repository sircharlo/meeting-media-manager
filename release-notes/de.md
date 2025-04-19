<!-- markdownlint-disable no-duplicate-heading -->

# Was ist neu

Die vollständige Liste der Änderungen zwischen den Versionen finden Sie in unserer CHANGELOG.md Datei auf GitHub.

## 25.4.1

### 🛠️ Verbesserungen und Optimierungen

- 🎬 **Fix Custom Start/End Time Assignment**: Prevent custom start and end times from being incorrectly applied to the wrong video.
- 📝 **Allow Mismatched Subtitles**: Enable use of subtitles even when they do not perfectly match the media file.
- 🪟 **Disable Rounded Corners on Windows**: Remove rounded corners for the media window on Windows.
- 🖼 **Include Non-Referenced Images in Media List**: Ensure all non-referenced images are added to the media list for completeness.
- ➕ **Prevent Duplicate Media Sections**: Avoid creating multiple media sections for the same media item.
- 📥 **Preserve Playlist Order on Import**: Maintain the original order of JWL playlists during the import process.

## 25.4.0

### ✨ Neue Funktionen

- 🇵🇭 **Neue Sprache: Tagalog**: Unterstützung für Taglog hinzugefügt, um die Mehrsprachigkeit der App zu erweitern.
- 🎞️ **Unterstützung des `.m4v` Video Format**: Unterstützt nun die Wiedergabe von `.m4v` Dateien, um die Medienkompatibilität zu verbessern.

### 🛠️ Verbesserungen und Optimierungen

- 🎬 **Mehrere Start/End-Zeiten für Einzelvideo**: Lasse ein einzelnes Video mehrfach in der Medienliste mit verschiedenen benutzerdefinierten Start-/Endzeiten erscheinen.
- 📤 **Gruppierte Medien in den Auto-Export einbeziehen**: Gruppierte Medienelemente automatisch zusammen mit anderen exportieren.
- 📡 **Korrektur beim Abruf von `.m4v` mittels JW API**: Sichergestellt, dass `.m4v` Dateien korrekt aus der JW API geholt werden.

## 25.3.1

### ✨ Neue Funktionen

- 🌏 **New Language: Korean**: Add support for the Korean language, expanding accessibility for more users.

### 🛠️ Verbesserungen und Optimierungen

- ⚡ **Leistungssteigerung und CPU-Auslastung**: Optimierte Performance um die CPU-Auslastung zu reduzieren und die Effizienz zu steigern.
- 🔄 **Synchronisation- & Absturzprobleme behoben**: Es wurden verschiedene Synchronisation- und Stabilitätsprobleme behoben, um die Zuverlässigkeit zu verbessern.
- 📜 **Versionshinweise für bestehende Versammlungen anzeigen**: Es wurde sichergestellt, dass Versionshinweise auch für bereits bestehende Versammlungen angezeigt werden.

## 25.3.0

### ✨ Neue Funktionen

- 🎵 **Hintergrundmusik mit Videos**: Ermöglicht Hintergrundmusik weiter abzuspielen, während Videos angezeigt werden.
- 🎥 **Camera Feed for Sign Language Media**: Add the ability to display a camera feed on the media window specifically for sign language users.
- 📅 **Automatic Memorial Date & Background**: Automatically detect and set the Memorial date and prepare the Memorial background image.
- 📜 **Show Release Notes In-App**: Display release notes directly in the application so users can easily review changes after an update.

### 🛠️ Verbesserungen und Optimierungen

- ⚡ **Optimize Smart Cache Clearing**: Improve the smart cache-clearing mechanism for better performance and efficiency.
- 📂 **Correct Circuit Overseer Media Placement**: Ensure Circuit Overseer media is placed in the correct section.
- 📅 **Exclude Regular Meeting Media for Memorial**: Prevent fetching standard meeting media for the Memorial to prevent errors.
- 📅 **Hide Regular Meeting Sections on Memorial**: Remove unnecessary meeting sections during the Memorial event for a cleaner layout.
- 📖 **Fix Sign Language Bible Video Downloads**: Correctly download Sign Language Bible chapter videos from JWL playlists.
