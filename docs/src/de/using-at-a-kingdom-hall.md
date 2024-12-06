<!-- markdownlint-disable no-inline-html -->

# Verwendung von M³ in einem Königreichssaal {#using-m3-at-a-kingdom-hall}

Diese Anleitung führt Sie durch den Prozess des Herunterladens, Installierens und Einrichtens von **Meeting Media Manager (M³)** in einem Königreichssaal. Befolgen Sie die Schritte, um eine reibungslose Einrichtung für die Verwaltung von Medien während der Versammlungen zu gewährleisten.

## 1. Herunterladen und Installieren {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. Laden Sie die entsprechende Version für Ihr Betriebssystem herunter:
   - **Windows:**
     - Für die meisten Windows-Systeme laden Sie <a :href="data.win64">meeting-media-manager-[VERSION]-x64.exe</a> herunter.
     - Für ältere 32-Bit-Windows-Systeme laden Sie <a :href="data.win32">meeting-media-manager-[VERSION]-ia32.exe</a> herunter.
   - **macOS:**
     - **M-Serie (Apple Silicon):** Laden Sie <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a> herunter.
     - **Intel-basierte Macs:** Laden Sie <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a> herunter.
   - **Linux:**
     - Laden Sie <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a> herunter.
2. Wenn die Download-Links nicht funktionieren, besuchen Sie die [M³-Download-Seite](https://github.com/sircharlo/meeting-media-manager/releases/latest) und laden Sie die richtige Version manuell herunter.
3. Öffnen Sie das Installationsprogramm und folgen Sie den Anweisungen auf dem Bildschirm, um M³ zu installieren.
4. Starten Sie M³.
5. Gehen Sie den Konfigurationsassistenten durch.

### Nur macOS: Zusätzliche Installationsschritte {#additional-steps-for-macos-users}

:::warning Warnung

Dieser Abschnitt gilt nur für macOS-Nutzer.

:::

Aufgrund der Sicherheitsmaßnahmen von Apple sind einige zusätzliche Schritte erforderlich, um die installierte M³-App auf modernen macOS-Systemen auszuführen.

Führen Sie die folgenden zwei Befehle im Terminal aus, wobei Sie den Pfad zu M³ nach Bedarf anpassen:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Warnung

Als macOS-Nutzer müssen Sie diese Schritte jedes Mal befolgen, wenn Sie M³ installieren oder aktualisieren.

:::

:::info Erklärung

Der erste Befehl _signiert den Code der Anwendung_. Dies ist erforderlich, um zu verhindern, dass M³ als schadhafte Anwendung eines unbekannten Entwicklers erkannt wird.

Der zweite Befehl _entfernt das Quarantäne-Flag_ von der Anwendung. Das Quarantäne-Flag wird verwendet, um Benutzer vor potenziell schadhafter Software zu warnen, die aus dem Internet heruntergeladen wurde.

:::

#### Alternative Methode {#alternative-method-for-macos-users}

Wenn Sie M³ nach Eingabe der beiden Befehle aus dem vorherigen Abschnitt immer noch nicht starten können, versuchen Sie Folgendes:

1. Öffnen Sie die macOS-Systemeinstellungen **Datenschutz & Sicherheit**.
2. Finden Sie den Eintrag für M³ und klicken Sie auf die Schaltfläche **Trotzdem öffnen**.
3. Es wird erneut eine Warnung angezeigt, die Sie darauf hinweist, dies nur zu tun, wenn Sie sicher sind, dass die Quelle vertrauenswürdig ist. Klicken Sie auf **Trotzdem öffnen**.
4. Eine weitere Warnung erscheint, bei der Sie sich authentifizieren müssen, um die App zu starten.
5. M³ sollte jetzt erfolgreich gestartet werden.

Wenn weiterhin Probleme auftreten, öffnen Sie bitte [ein Problem auf GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). Wir werden unser Bestes tun, um zu helfen.

### Nur macOS: Bildschirmpräsentation nach Updates erneut aktivieren {#screen-sharing-issues}

:::warning Warnung

Dieser Abschnitt gilt nur für macOS-Nutzer.

:::

Einige macOS-Nutzer haben gemeldet, dass die Bildschirmpräsentation nach der Installation von Updates für M³ nicht mehr funktioniert.

Wenn das Medienfenster schwarz wird, wenn Sie die Webseite nach dem Update von M³ präsentieren, versuchen Sie die folgenden Schritte:

1. Öffnen Sie die macOS-Systemeinstellungen **Datenschutz & Sicherheit**.
2. Gehen Sie zu **Bildschirmaufnahme**.
3. Wählen Sie M³ in der Liste aus.
4. Klicken Sie auf die `-` (Minus)-Schaltfläche, um es zu entfernen.
5. Klicken Sie auf die `+` (Plus)-Schaltfläche und wählen Sie M³ aus dem Ordner "Programme" aus.
6. Möglicherweise müssen Sie M³ neu starten, um die Änderung anzuwenden.

Nach diesen Schritten sollte die Bildschirmfreigabe wieder wie erwartet funktionieren.

:::tip Tipp

Diese Schritte sind optional und können übersprungen werden, wenn Sie die Funktion zur Präsentation von Webseiten nicht verwenden möchten. Wenn Sie jedoch die Webseite präsentieren möchten, wird empfohlen, diese Schritte nach jedem Update zu befolgen, um sicherzustellen, dass die Funktion wie erwartet funktioniert.

:::

## 2. Konfigurationsassistent {#configuration-wizard}

### Anzeigesprache der App {#app-display-language}

Beim ersten Start von M³ werden Sie aufgefordert, Ihre bevorzugte **Anzeigesprache** auszuwählen. Wählen Sie die Sprache, die M³ für seine Benutzeroberfläche verwenden soll.

:::tip Tipp

Dies muss nicht die gleiche Sprache sein wie die, in der M³ Medien herunterladen wird. Die Sprache für den Medien-Download wird in einem späteren Schritt konfiguriert.

:::

### Profiltyp {#profile-type}

Der nächste Schritt ist die Auswahl eines **Profiltyps**. Für eine normale Einrichtung in einem Königreichssaal wählen Sie **Regulär**. Dies wird viele Funktionen konfigurieren, die häufig für Versammlungen verwendet werden.

:::warning Warnung

Wählen Sie **Sonstiges** nur aus, wenn Sie ein Profil erstellen, für das keine Medien automatisch heruntergeladen werden sollen. Medien müssen für dieses Profil manuell importiert werden. Dieser Profiltyp wird hauptsächlich für den Einsatz in theokratischen Schulen, Versammlungen, Kongressen und anderen Sonderveranstaltungen verwendet.

Der Profiltyp **Sonstiges** wird selten verwendet. **Für die normale Nutzung während der Versammlungen wählen Sie bitte _Regulär_.**
:::

:::

### Automatische Suche der Versammlung {#automatic-congregation-lookup}

M³ kann versuchen, automatisch den Versammlungsplan, die Sprache und den formatierten Namen Ihrer Versammlung zu finden.

Verwenden Sie dazu die Schaltfläche **Versammlungssuche** neben dem Feld für den Versammlungsnamen und geben Sie mindestens einen Teil des Versammlungsnamens und der Stadt ein.

Sobald die richtige Versammlung gefunden und ausgewählt wurde, füllt M³ alle verfügbaren Informationen aus, wie den **Namen** der Versammlung, die **Sprache** der Versammlung und die **Tage und Zeiten der Versammlungen**.

:::info Hinweis

Diese Suche verwendet öffentlich zugängliche Daten von der offiziellen Website der Zeugen Jehovas.

:::

### Manuelle Eingabe der Versammlungsinformationen {#manual-entry-of-congregation-information}

Wenn die automatische Suche Ihre Versammlung nicht gefunden hat, können Sie die erforderlichen Informationen natürlich manuell eingeben. Der Assistent ermöglicht es Ihnen, den **Namen** der Versammlung, die **Sprache** der Versammlung und die **Tage und Zeiten der Versammlungen** zu überprüfen und/oder einzugeben.

### Caching von Videos aus dem Gesangbuch {#caching-videos-from-the-songbook}

Sie haben auch die Möglichkeit, **alle Videos aus dem Gesangbuch zwischenzuspeichern**. Diese Option lädt alle Videos aus dem Gesangbuch vorab herunter und verringert die Zeit, die benötigt wird, um Medien für Versammlungen in der Zukunft abzurufen.

- **Vorteile:** Medien für Versammlungen sind viel schneller verfügbar.
- **Nachteile:** Der Speicherplatzbedarf des Medien-Caches wird erheblich steigen, um ca. 5 GB.

:::tip Tipp

Wenn Ihr Königreichssaal über ausreichend Speicherplatz verfügt, wird empfohlen, diese Option für Effizienz und wahrgenommene Leistung zu **aktivieren**.

:::

### OBS Studio-Integrationskonfiguration (Optional) {#obs-studio-integration-configuration}

Wenn Ihr Königreichssaal **OBS Studio** für die Übertragung von Hybrid-Versammlungen über Zoom verwendet, kann M³ automatisch mit diesem Programm integriert werden. Während der Einrichtung können Sie die Integration mit OBS Studio konfigurieren, indem Sie Folgendes eingeben:

- **Port:** Die Portnummer, die für die Verbindung zum OBS Studio Websocket-Plugin verwendet wird.
- **Passwort:** Das Passwort, das für die Verbindung zum OBS Studio Websocket-Plugin verwendet wird.
- **Szenen:** Die OBS-Szenen, die während der Medienpräsentation verwendet werden. Sie benötigen eine Szene, die das Medienfenster oder den Bildschirm erfasst, und eine, die die Bühne zeigt.

:::tip Tipp

Wenn Ihre Versammlung regelmäßig Hybrid-Versammlungen abhält, wird dringend empfohlen, die Integration mit OBS Studio zu aktivieren.

:::

## 3. Genießen Sie die Nutzung von M³ {#enjoy-using-m3}

Sobald der Einrichtungsassistent abgeschlossen ist, ist M³ bereit, die Verwaltung und Präsentation von Medien für Versammlungen zu unterstützen. Viel Spaß beim Benutzen! :tada:
