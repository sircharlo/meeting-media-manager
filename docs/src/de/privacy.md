# Datenschutzerklärung {#privacy-policy}

Gültig ab: 22. November 2026

Meeting Media Manager (M³) ist eine kostenlose Open-Source-App, die von Freiwilligen entwickelt wird. Diese Datenschutzerklärung beschreibt, welche Daten M³ verarbeitet und wohin sie gelangen. Sie gilt für jede Version von M³: die Installationsprogramme und die portable Version von dieser Website sowie die Versionen im Microsoft Store, im Snap Store und auf Flathub.

**Kurz gesagt:** M³ hat keine Konten, keine Werbung und keine Werbe- oder Marketing-Tracker. Ihre Einstellungen und Medien bleiben auf Ihrem Computer. Um Probleme zu finden und zu beheben, sendet M³ seinen Entwicklern Diagnosedaten: Fehlerberichte sowie Informationen zu jeder Sitzung und dazu, wie schnell M³ läuft. Was Sie oder Ihre Versammlung identifizieren könnte, lässt M³ dabei weg, und Ihre IP-Adresse wird nicht gespeichert.

## Was auf Ihrem Computer bleibt {#on-your-computer}

M³ speichert Folgendes in seinem Datenordner auf Ihrem Computer:

- die Einstellungen jeder Versammlung oder Gruppe, etwa ihr Name, ihr Zusammenkunftsplan, ihre Sprache und ihre Integrationen;
- die Medien und Publikationen, die M³ herunterlädt, und die Medien, die Sie hinzufügen;
- das Passwort für OBS Studio, falls Sie OBS Studio verwenden. M³ verschlüsselt es mit dem Passwortspeicher Ihres Betriebssystems, wenn dieser verfügbar ist; wenn nicht, speichert M³ es als Klartext und teilt Ihnen das mit;
- Ihre Einstellungen für die Zoom-Integration, falls Sie sie verwenden.

Fehlerberichte enthalten einige dieser Einstellungen (siehe unten), aber nie diejenigen, die Sie oder Ihre Versammlung identifizieren könnten.

Wenn Sie das Bild einer Kamera im Medienfenster zeigen (eine Option für Gebärdensprachversammlungen), wird es nur angezeigt: M³ nimmt es nicht auf, speichert es nicht und sendet es nicht. Die Vorschau des Medienfensters, die M³ Ihnen anzeigt, wird auf Ihrem Computer erfasst und ebenfalls weder gespeichert noch gesendet.

Sie können all dies jederzeit löschen, indem Sie den Datenordner von M³ löschen. Unter Windows wird er auch beim Deinstallieren von M³ gelöscht. Die Versionen aus dem Snap Store und von Flathub behalten ihn, wenn Sie sie deinstallieren, es sei denn, Sie weisen sie an, ihn nicht zu behalten (`snap remove --purge` oder `flatpak uninstall --delete-data`).

## Diagnosedaten {#error-reports}

M³ sendet Diagnosedaten an [Sentry](https://sentry.io), den Dienst, den seine Entwickler nutzen, um Fehler zu finden und zu beheben.

**Fehlerberichte**, wenn in M³ etwas schiefgeht. Ein Bericht kann Folgendes enthalten:

- den Fehler und die Stelle im Code von M³, an der er aufgetreten ist;
- die Version von M³, Ihr Betriebssystem und dessen Version, Ihre Sprache und Zeitzone sowie grundlegende Informationen über Ihre Hardware, etwa Ihre Grafikkarte;
- die Schritte, die zu dem Fehler geführt haben, etwa die in M³ geöffneten Seiten und die Dateien, die M³ gerade herunterlud;
- den Zustand von M³ zu diesem Zeitpunkt: seine Einstellungen und was es gerade tat, etwa welche Medien wiedergegeben wurden oder welche Zusammenkunft es vorbereitete;
- wenn ein Teil von M³ abstürzt, einen Absturzbericht dieses Teils, der Teile seines Arbeitsspeichers zum Zeitpunkt des Absturzes enthalten kann.

**Sitzungsinformationen**, jedes Mal, wenn M³ ausgeführt wird: wann es gestartet wurde und ob es normal beendet wurde oder abgestürzt ist, mit der Version von M³ und Ihrem Betriebssystem.

**Leistungsinformationen**, in jeder Sitzung: wie lange es dauert, bis sich die Seiten von M³ öffnen, und wie lange seine Anfragen an die unten aufgeführten Server dauern, mit deren Adressen.

### Was M³ weglässt {#left-out}

Bevor M³ seine Diagnosedaten sendet, entfernt es daraus, was Sie oder Ihre Versammlung identifizieren könnte:

- den Namen der Versammlung, ihre Zoom-Meeting-ID und die Namen von Zoom-Teilnehmern;
- die Einstellungs-PIN und das Passwort für OBS Studio;
- die Namen der Ordner und Dateien auf Ihrem Computer: Erhalten bleiben nur das Laufwerk oder der oberste Ordner eines Ordners und der Typ einer Datei;
- die Adresse in der Einstellung "Adresse der Website", wenn sie nicht die Standardadresse ist;
- Ihren Benutzernamen in den Ordnerpfaden seiner Berichte.

Die Daten enthalten keinen Namen, keine E-Mail-Adresse und kein Konto, da es in M³ nichts davon gibt. M³ bittet Sentry, Ihre IP-Adresse nicht aufzuzeichnen, und Sentry ist so eingestellt, dass es sie nicht speichert.

Die Betreuer von M³ verwenden diese Daten nur, um Probleme zu finden und zu beheben. Sentry speichert sie in den Vereinigten Staaten und löscht sie nach einer begrenzten Zeit. [Die Datenschutzerklärung von Sentry](https://sentry.io/privacy/) erklärt, wie Sentry damit umgeht.

## Server, mit denen sich M³ verbindet {#connections}

Um seine Aufgabe zu erfüllen, verbindet sich M³ mit den unten aufgeführten Servern. Wie bei jeder Website, die Sie besuchen, können diese Server die IP-Adresse Ihres Computers sehen.

- **Die offizielle Website der Zeugen Jehovas** und ihre Download-Server, um Medien für die Zusammenkünfte und Publikationen sowie die zugehörigen Informationen herunterzuladen. Für das, was sie erhält, gilt die eigene Datenschutzerklärung dieser Website.
- **GitHub**, wo M³ veröffentlicht wird, um nach Updates für M³ zu suchen, sie herunterzuladen und anzuzeigen, was darin neu ist. Die Versionen aus dem Microsoft Store, dem Snap Store und von Flathub erhalten ihre Updates stattdessen aus ihrem Store.
- **jsDelivr**, um die Schriftarten, die einige Sprachen benötigen, und die Komponente herunterzuladen, mit der M³ PDF-Dateien liest.
- **Apple, Cloudflare, icanhazip.com und ipify.org**, um zu prüfen, ob Ihr Computer mit dem Internet verbunden ist.
- **Sentry**, um die oben beschriebenen Diagnosedaten zu senden.

M³ arbeitet außerdem mit den folgenden Programmen und Funktionen auf Ihrem Computer oder in Ihrem lokalen Netzwerk zusammen, wenn Sie diese verwenden:

- **Zoom:** M³ steuert die Zoom-App auf Ihrem Computer. M³ selbst sendet nichts an die Server von Zoom.
- **OBS Studio:** M³ verbindet sich mit OBS Studio auf Ihrem Computer oder in Ihrem lokalen Netzwerk.
- **Die Timer-Fernanzeige:** M³ betreibt einen kleinen Webserver in Ihrem lokalen Netzwerk, damit ein anderes Gerät den Zusammenkunfts-Timer anzeigen kann.

Wenn Sie die offizielle Website der Zeugen Jehovas im Webseitenfenster von M³ anzeigen, funktioniert sie so wie in einem Webbrowser.

## App-Stores {#stores}

Wenn Sie M³ aus dem Microsoft Store, dem Snap Store oder von Flathub installieren, übernimmt dieser Store die Installation und die Updates von M³ gemäß seiner eigenen Datenschutzerklärung. M³ selbst funktioniert in jeder Version gleich.

## Änderungen an dieser Datenschutzerklärung {#changes}

Wenn M³ beginnt, Daten anders zu verarbeiten, wird diese Seite aktualisiert und oben mit einem neuen Datum versehen. Den Verlauf dieser Seite finden Sie auf [GitHub](https://github.com/sircharlo/meeting-media-manager/commits/master/docs/src/en/privacy.md).

## Fragen {#questions}

Wenn Sie eine Frage zu dieser Datenschutzerklärung oder zu Ihren Daten haben, [erstellen Sie ein Issue auf GitHub](https://github.com/sircharlo/meeting-media-manager/issues).
