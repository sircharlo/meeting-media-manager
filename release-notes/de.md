<!-- markdownlint-disable no-duplicate-heading -->

# Was ist neu

Die vollständige Liste der Änderungen zwischen den Versionen finden Sie in unserer CHANGELOG.md Datei auf GitHub.

## v26.10.2

### ✨ Neue Funktionen

- ✨ **Funktionsvorschläge**: Ab und zu schlägt M³ eine Funktion vor, die ein Profil noch nicht nutzt, und zwar in einem kurzen Fenster "Wussten Sie schon?", das erklärt, was sie bewirkt. M³ zeigt bei jedem Öffnen eines Profils höchstens einen Vorschlag an, niemals ab 15 Minuten vor einer Zusammenkunft bis zu deren Ende, und merkt sich jede Antwort: "Später erinnern" reiht einen Vorschlag wieder hinten ein, "Nein, danke" blendet ihn dauerhaft aus und "Keine Funktionen mehr vorschlagen" schaltet alle Vorschläge für das Profil ab. Ein "Nein" im Einrichtungsassistenten zählt ebenfalls, und die Antworten lassen sich in den Einstellungen unter "Erweitert" zurücksetzen.
- ✨ **Zoom Meeting Manager (Beta, Windows)**: M³ kann jetzt sein eigenes Fenster und das Zoom-Meetingfenster auf Ihren Bildschirmen anordnen. Zwei neue Schritte im Zoom-Einrichtungsassistenten fragen, wohin das Zoom-Meeting soll. Auf einer Karte Ihrer Bildschirme wählen Sie den Bildschirm für Zoom aus (nie den, den das Medienfenster ausfüllt) und ob Zoom ihn für sich allein hat oder sich mit M³ teilt. Anschließend ziehen Sie auf einer Zeichnung dieses Bildschirms in seiner tatsächlichen Form einen Trenner, um ihn zwischen den beiden Fenstern aufzuteilen; er rastet bei den üblichen Anteilen ein. Sobald das Zoom-Meeting geöffnet ist, öffnet M³ auf Wunsch die Teilnehmerliste von Zoom, setzt dann beide Fenster an ihren Platz und hält Zoom von da an dort: Wenn Zoom sein Fenster von selbst verschiebt oder seine Größe ändert (nach einer Bildschirmfreigabe oder wenn die Teilnehmerliste geöffnet oder geschlossen wird), setzt M³ es zurück, während ein Fenster, das Sie selbst verschieben, bis zur nächsten Zusammenkunft dort bleibt, wo Sie es hingesetzt haben. Jedes Mal, wenn M³ Zoom von sich aus verschiebt, weist eine Benachrichtigung darauf hin und lässt Sie das sofort beenden, bis M³ neu gestartet wird oder dauerhaft. Während Zoom das Medienfenster freigibt und dabei sein Meetingfenster ausblendet, öffnet M³ an dessen Stelle die Teilnehmerliste von Zoom, damit Sie weiterhin sehen, wer sich zu einem Kommentar meldet. Ist in Zoom "Meeting window view" auf "Dual window" gestellt ("Use dual monitors" in älteren Zoom-Versionen), wird das zweite Zoom-Fenster hinter dem Medienfenster im Vollbild angezeigt, sodass es sichtbar wird, wenn Sie das Medienfenster ausblenden. M³ kann die beiden Fenster auch mit der Andock-Funktion von Windows nebeneinander andocken, sodass beim Ziehen des Randes zwischen ihnen beide ihre Größe ändern. Eine Schaltfläche "Fenster anordnen" im Zoom-Popup setzt jederzeit alles wieder an seinen Platz, und die Anordnung lässt sich später in den Einstellungen unter Zoom Meeting Manager ändern. Sie wird pro Computer gespeichert, da sie von dessen Bildschirmen abhängt.

## v26.10.1

### ✨ Neue Funktionen

- ✨ **Zoom Meeting Manager (Beta, Windows)**: Eine neue Integration, die Zoom rund um jede Zusammenkunft für Sie bedient. Die Integration kann das Zoom-Meeting Ihrer Versammlung starten, wenn vor der Zusammenkunft die Hintergrundmusik beginnt. Wenn die Musik kurz vor Beginn der Zusammenkunft stoppt, tritt M³ dem Computeraudio bei, hebt die Stummschaltung des Mikrofons auf, schaltet das Video des Hosts ein und schaltet alle stumm, ohne dass sie ihre Stummschaltung selbst aufheben können. Läuft vor oder nach einer Zusammenkunft Musik, geschieht das Umgekehrte: M³ verlässt das Computeraudio, schaltet das Video des Hosts aus und erlaubt allen, ihre Stummschaltung wieder aufzuheben (mit der Bitte, dies zu tun). Außerdem kann sie das Medienfenster automatisch in Zoom freigeben, während Medien angezeigt werden, und stellt dabei sicher, dass genau das Medienfenster freigegeben wird und nie etwas anderes auf Ihrem Bildschirm. Eine neue Zoom-Schaltfläche in der Aktionsinsel zeigt an, ob ein Zoom-Meetingfenster gefunden wurde, und ermöglicht es Ihnen, diese Schritte manuell auszuführen. Ein Einrichtungsassistent, der beim Aktivieren der Option angeboten wird (bei der Erstkonfiguration wird er unter Windows jetzt anstelle der Bildschirmfreigabe per Tastenkürzel angeboten) und jederzeit über die Zoom-Schaltfläche oder die Einstellungen verfügbar ist, prüft Ihr Zoom, lernt die Namen der Mikrofon- und Kamera-Schaltflächen in Ihrer Sprache und probiert jeden Schritt gemeinsam mit Ihnen aus. Beim Start prüft M³ außerdem, ob alles funktioniert, was es in Zoom automatisiert, und öffnet dazu an Zusammenkunftstagen bei Bedarf in den eineinviertel Stunden vor Beginn das Meeting (sind bereits andere im Meeting, schaut M³ nur nach, ohne etwas anzuklicken); funktioniert etwas nicht, informiert M³ Sie darüber und pausiert seine Zoom-Automatisierungen, bis es neu gestartet wird oder eine erneute Prüfung erfolgreich ist, damit während der Zusammenkunft nichts schiefgeht. Diese Prüfung ist standardmäßig aktiviert und kann in den Einstellungen deaktiviert werden. Sobald einer dieser Schritte erfolgreich ist, werden die passenden Erinnerungen in den Checklisten vor und nach der Zusammenkunft in den schnellen Aktionen für Zusammenkünfte für Sie abgehakt und als "Automatisch in Zoom erledigt" markiert. Da die Integration nicht zusammen mit der Bildschirmfreigabe per Tastenkürzel verwendet werden kann, weisen die Einstellungen bei der jeweils nicht verfügbaren Option darauf hin und nennen die Option, die deaktiviert werden muss. Die Integration funktioniert unabhängig von der Sprache, in der Zoom eingestellt ist, und erfordert außer Zoom selbst keine weitere Installation.

- ✨ **Zusammenkunfts-Timer**: Benutzerdefinierte Programmpunkte können jetzt auch an Zusammenkunftstagen hinzugefügt werden – für Berichte der Leitenden Körperschaft, Sonderprogramme und alles andere, was nicht im regulären Programm steht. Die Zeit jedes dieser Programmpunkte wird wie bei jedem anderen Programmpunkt gemessen, und Name und Dauer lassen sich im Timer-Popup oder in der Liste der Programmpunkte ändern.

- ✨ **Zusammenkunfts-Timer**: Schnellerer Zugriff auf den Timer. Wenn Sie mit der Maus über die Timer-Schaltfläche in der Aktionsinsel fahren, werden jetzt der laufende Programmpunkt sowie die Schaltflächen Start, Pause, Stopp und Nächster Teil angezeigt, ohne dass das Popup geöffnet wird (eine Einstellung, standardmäßig aktiviert). Mit einer neuen Einstellung bleiben außerdem die gesamte Liste der Programmpunkte und die Timer-Steuerung in einem am rechten Rand des Hauptfensters angedockten Bereich stets im Blick.

- ✨ **Zusammenkunfts-Timer**: Eine neue Countdown-Anzeige "Analoge Uhr mit Zeitbogen" zeigt die verbleibende Zeit eines Programmpunkts als Sektor auf einem analogen Zifferblatt an, vom Minutenzeiger bis zum geplanten Ende, sodass ein Blick genügt, um sowohl die Uhrzeit als auch die Restzeit zu sehen. Überzogene Zeit wird als roter Sektor angezeigt. Die Anzeige funktioniert auch für den Countdown vor der Zusammenkunft und im Hochzählmodus.

- ✨ **Zusammenkunfts-Timer**: Der Countdown vor der Zusammenkunft ist jetzt mit "Zusammenkunft startet in" beschriftet, und die Timer-Anzeige zeigt den Namen des laufenden Programmpunkts, sodass "4:59" nicht mehr mit der Uhrzeit verwechselt werden kann.

- ✨ **Zusammenkunfts-Timer**: Die aufgezeichneten Zeiten eines Tages lassen sich nach einer Bestätigung im Timer-Popup oder im angedockten Bereich auf einmal löschen.

- ✨ **Zoom Meeting Manager (Beta, Windows)**: Ein neuer Helfer für erhobene Hände. Während einer Zusammenkunft achtet M³ in der Teilnehmerliste von Zoom auf erhobene Hände. Wenn jemand die Hand hebt, kann der Bediener über eine Benachrichtigung in M³ mit einem Klick die Stummschaltung dieses Teilnehmers aufheben und ihn, sobald er fertig gesprochen hat, mit einem weiteren Klick wieder stummschalten und seine Hand senken; die Zoom-Schaltfläche auf der Aktionsinsel listet die erhobenen Hände mit denselben Schaltflächen auf. Jede Aktion wirkt anhand des genauen Namens auf die Zeile genau dieses Teilnehmers in Zoom, und haben zwei Teilnehmer denselben Namen, lässt M³ beide unberührt. Ist der Zusammenkunfts-Timer aktiviert, erscheint für den Vorsitzenden außerdem eine große Hand mit dem Namen des Teilnehmers auf der Timer-Anzeige, die sich auch manuell über das Timer- oder Zoom-Popup einblenden lässt. Wie Zoom erhobene Hände in Ihrer Sprache kennzeichnet, lernt M³ mit einer einzigen Schaltfläche (sie hebt und senkt Ihre eigene Hand), die auch in der Einrichtungshilfe angeboten wird.

- ✨ **Zusammenkunfts-Timer**: Eine neue, optionale Timer-Fernanzeige. Ist sie aktiviert, stellt M³ die Timer-Anzeige als reine Ansicht auf einer Webseite im lokalen Netzwerk bereit, sodass ein Tablet oder Smartphone am Rednerpult dem Redner die verbleibende Zeit anzeigen kann, ohne dass sie auf dem Bildschirm für die Versammlung oder in einer Zoom-Freigabe erscheint. Die Seite folgt dem Timer in Echtzeit (Programmpunkte, Countdown vor der Zusammenkunft, Uhr, Überziehungsfarben, Handzeichen-Hinweis), und die gesamte Steuerung bleibt in M³. Die aufzurufenden Adressen werden im Timer-Popup angezeigt, zusammen mit einer Schaltfläche zum Kopieren.

- ✨ **Einrichtungsassistent**: Der Einrichtungsassistent fragt jetzt, ob Sie Dateien für die Zusammenkünfte in einer Cloud-Speicher-App wie Dropbox, OneDrive, iCloud Drive oder Google Drive aufbewahren. Falls ja, hilft er Ihnen, dort einen geteilten Ordner auszuwählen, und zeigt, wie das funktioniert: M³ legt für jede bevorstehende Zusammenkunft einen Ordner an, der nach ihrem Datum benannt ist, und die darin abgelegten Dateien werden dieser Zusammenkunft automatisch hinzugefügt, auf jedem Computer, der den Ordner verwendet.

## v26.9.0

### ✨ Neue Funktionen

- ✨ **Schnelle Aktionen vor/nach Zusammenkünften**: Ein neues Bedienfeld mit großen Schaltflächen unterstützt Sie in der Zeit vor und direkt nach jeder Zusammenkunft – mit einem Live-Countdown, Starten/Stoppen der Hintergrundmusik mit einem Klick, Starten/Stoppen der Aufnahme und einer Checkliste pro Versammlung, die in Kategorien gegliedert ist und in den Einstellungen bearbeitet werden kann. Das Bedienfeld vor der Zusammenkunft schließt sich automatisch, sobald die Zusammenkunft beginnt und die Checkliste abgehakt ist (oder nach einer kurzen Wartezeit), und kann jederzeit manuell geschlossen werden.

## v26.8.0

### ✨ Neue Funktionen

- ✨ **Neugestaltung der gesamten App**: Eine umfassende Überarbeitung von Optik und Bedienung in den Dialogen, der Medienliste und ihrer Kopfzeile, den Einstellungen und dem Einrichtungsassistenten. Der Einrichtungsassistent stellt jetzt eine Frage pro Bildschirm und zeigt einen Fortschrittsbalken an. Alle Eingabeaufforderungen wurden durch einen einheitlichen Dialog im Design der App ersetzt, und die Auswahl von PDF-Seitenbereichen (beim Import von Publikationen und per Drag-and-Drop) erfolgt jetzt über ein Raster mit Miniaturansichten statt über ein Freitextfeld. Neue Schnellstart-Tour hinzugefügt, die nach Abschluss des Einrichtungsassistenten angezeigt wird. Außerdem enthalten: ein aufgefrischtes Design für Karten und Kopfzeilen mit an den dunklen Modus angepassten Schatten sowie mehrere Kontrastkorrekturen im dunklen Modus (Beschriftungen fokussierter Felder, Prozentanzeige des Download-Fortschritts).
- ✨ **Einstellungsseite**: Neu aufgebaut mit einem zweispaltigen Layout und einem neuen Abschnitt "Globale Einstellungen", in den die Schalter für automatische Updates und Beta-Updates aus dem Dialog "Über diese App" verschoben wurden (der jetzt nur noch Informationen anzeigt).
- ✨ **Schaltfläche "Mehr Medien hinzufügen"**: Einstellung hinzugefügt, mit der Sie genau festlegen können, in welchen Abschnitten der Zusammenkunft die Schnellzugriffsschaltfläche "Mehr Medien hinzufügen" angezeigt wird, sowie eine Einstellung für einen Kompaktmodus (nur Symbol).
- ✨ **Medienliste**: Elemente zeigen beim Hinzufügen jetzt Ladeplatzhalter an, statt leer zu erscheinen, Mediengruppen zeigen in ihrem Badge die Anzahl ausgeblendeter Elemente an (z. B. "9 Elemente (2 versteckt)"), Elemente innerhalb einer Gruppe lassen sich per Drag-and-Drop neu anordnen, und bei sehr schmalen Fenstern werden Elemente zu kompakten Chips mit Tooltip zusammengefasst, statt die Zeile zu überladen.

## v26.7.7

### ✨ Neue Funktionen

- ✨ **Qualität der Medienvorschau**: Die Medienvorschau rendert Videobilder jetzt über ein Canvas mit hochwertiger Verkleinerung, wodurch gezackte bzw. unscharfe Vorschauen behoben werden (besonders bei textlastigen Inhalten wie Liedern). Außerdem schaltet sich die Vorschau automatisch ab, wenn sie bei einem Video wiederholt Abweichungen in der Wiedergabe korrigieren muss; mit einem Klick lässt sie sich wieder einschalten.

## v26.7.6

### ✨ Neue Funktionen

- ✨ **Ausschluss von Videos im Versammlungsbibelstudium**: Einstellung hinzugefügt, um Videos aus bestimmten Publikationen beim Versammlungsbibelstudium auszuschließen (standardmäßig das Buch **Geh mutig deinen Weg mit Gott**), mit einer durchsuchbaren Publikationsauswahl.
- ✨ **Seitenzahlen der Dokumente**: Die Listen unter "Medien aus Publikationen" und beim JWPUB-Import zeigen jetzt nach dem Titel die Seitenzahl jedes Dokuments an (bzw. die Seitenzahlen, wenn es mehrere Seiten umfasst). Das kann Ihnen helfen, bestimmte Medien schnell zu finden, wenn Sie die Seitenzahl kennen, auf der sie vorkommen.

## v26.7.4

### ✨ Neue Funktionen

- ✨ **Wiederherstellung fehlender Medien**: Medienelemente, deren lokale Datei fehlt (z. B. weil sie durch das automatische Leeren des Caches gelöscht oder manuell entfernt wurde), zeigen jetzt eine deaktivierte Wiedergabeschaltfläche, den Hinweis "fehlt" mit dem Namen der zu suchenden Datei sowie die neue Aktion "Datei finden", um das Element wieder mit einer Datei auf dem Datenträger zu verknüpfen.
- ✨ **Kompatibilitätswarnung**: Schließbares Banner hinzugefügt, das Benutzer von bald nicht mehr unterstützten Kombinationen aus Betriebssystem und Architektur (macOS 12 Monterey und Windows 32-Bit) auffordert, ihr System zu aktualisieren, bevor künftige App-Updates eine neuere Systemversion voraussetzen.

## v26.7.0

### ✨ Neue Funktionen

- ✨ **Verknüpfte Audiowiedergabe**: Unterstützung für die Wiedergabe von Audio aus einer Datei zusammen mit dem Video aus einer anderen Datei hinzugefügt. Das kann nützlich sein, um Video-Diashows mit Begleitmusik abzuspielen.
- ✨ **Anordnung überwachter Medien**: Dauerhafte Speicherung der Medienelemente und der Abschnittsreihenfolge für überwachte Ordner hinzugefügt. Dadurch wird die Medienliste auch dann gleich angezeigt, wenn der überwachte Ordner zwischen mehreren Geräten synchronisiert wird.

## v26.6.1

### ✨ Neue Funktionen

- ✨ **Medienvorschau**: Live-Medienvorschau als Overlay hinzugefügt, die in den Einstellungen oder im Anzeige-Popup ein- und ausgeschaltet werden kann.
- ✨ **Medien suchen**: Schnellsuchfeld in der Medienliste hinzugefügt, mit dem Sie Medien schnell nach Titel finden können. Verwenden Sie dazu einfach das übliche Tastenkürzel für die Suche (Strg+F oder Cmd+F).
- ✨ **Einstellungen filtern**: Filterfeld auf der Einstellungsseite hinzugefügt, mit dem Sie Einstellungen nach Stichwort oder Kategorie finden können. Klicken Sie dazu einfach oben rechts auf der Einstellungsseite auf die Schaltfläche "Suche" oder verwenden Sie das übliche Tastenkürzel für die Suche (Strg+F oder Cmd+F).
- ✨ **Warnung bei laufender Hintergrundmusik**: Warnmeldung hinzugefügt, wenn Medien gestartet werden, während Hintergrundmusik läuft. Benutzer können die Hintergrundmusik direkt über die Benachrichtigung stoppen.

## v26.6.0

### ✨ Neue Funktionen

- ✨ **Timer**: Analoge Anzeigemodi und Status für den Zeitbericht hinzugefügt.
- ✨ **Profile**: Import und Export der Profileinstellungen in den erweiterten Einstellungen und im Einrichtungsassistenten hinzugefügt.
- ✨ **Medienfenster**: Unterstützung für das automatische Ausblenden des Medienfensters nach der Wiedergabe hinzugefügt, wenn es zu Beginn ausgeblendet war. Das ist zum Beispiel praktisch, wenn ein per Video zugeschalteter Redner Bilder zeigen möchte.

## v26.5.0

### ✨ Neue Funktionen

- ✨ **PDF-Import**: Neuer PDF-Import im Dialog "Medien aus Publikationen" hinzugefügt, mit dem die PDF-Version einer Publikation bei Bedarf automatisch als einzelne Bilder importiert werden kann.

## v26.4.8

### ✨ Neue Funktionen

- ✨ **JW Stream**: JW Stream zur Liste der Websites hinzugefügt, die gespiegelt werden können.

## v26.4.0

### ✨ Neue Funktionen

- ✨ **Zusammenkunfts-Timer**: Neuer Zusammenkunfts-Timer hinzugefügt. Er ist optional und kann bei Bedarf in den erweiterten Einstellungen aktiviert werden. Der Timer kann dem Medienverantwortlichen helfen, die für die Programmpunkte benötigte Zeit im Blick zu behalten, oder die Zeit des aktuellen Programmpunkts auf einem eigenen Bildschirm anzeigen, den nur der Redner sieht.

## v26.3.0

### ✨ Neue Funktionen

- ✨ **Gedächtnismahl-Medien**: Das automatische Abrufen der Gedächtnismahl-Medien ist jetzt keine Beta-Funktion mehr! Die App lädt das Willkommensvideo zum Gedächtnismahl und das während des Gedächtnismahls anzuzeigende Bild automatisch herunter, sofern sie in der eingestellten Sprache verfügbar sind.
- ✨ **Wiedergabegeschwindigkeit**: Steuerung der Wiedergabegeschwindigkeit mit visueller Anzeige und der Möglichkeit zum manuellen Zurücksetzen hinzugefügt. Diese Funktion ist nur sichtbar, wenn sie in den erweiterten Einstellungen aktiviert ist.
- ✨ **Pinyin-Lieder**: Schalter hinzugefügt, um bei Zusammenkünften in chinesischer Sprache Lieder durch Pinyin-Versionen zu ersetzen.

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
- ✨ **Einfacher manueller Import von Publikationen**: Funktion hinzugefügt, um Publikationen wie Zeitschriften, Bücher, Programme und Einladungen einfach von der offiziellen Website zu importieren.
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
- ✨ **Automatischer Musikstopp**: Der automatische Stopp der Hintergrundmusik verhält sich jetzt gleich, egal ob die Musik automatisch gestartet wurde oder nicht
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

- Keine neuen Funktionen in dieser Version!

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

- 🔄 **Erneute Verbindungsversuche mit OBS**: Möglichkeit eingeführt, bei Bedarf manuell eine erneute Verbindung zu OBS zu erzwingen.
- 🗑 **Automatische Bereinigung alter Export-Datumsordner**: Veraltete Datumsordner des Exports werden automatisch entfernt, damit der Speicher übersichtlich bleibt.

## 25.2.0

### ✨ Neue Funktionen

- 🌍 **Standardmäßig die Systemsprache verwenden**: Automatische Erkennung und Verwendung der Systemsprache für ein persönlicheres Nutzungserlebnis.
- 🏷 **Tags für exportierte Medien**: Exportierte Mediendateien erhalten Metadaten-Tags für eine bessere Organisation.
- 🔄 **Automatisches Downgrade von Beta- auf stabile Versionen**: Ermöglicht bei Bedarf automatische Downgrades von Beta-Versionen auf stabile Versionen.
- 🌐 **Neueste MEPS-Sprachindizes abrufen**: Die aktuellsten MEPS-Sprachindizes werden direkt von der offiziellen Website abgerufen, damit die Sprachunterstützung immer auf dem neuesten Stand ist.

## 25.1.0

### ✨ Neue Funktionen

- 📅 **Vergangene Tage öffnen**: Ermöglicht das Öffnen vergangener Tage der aktuellen Woche, was nützlich ist, wenn die Zusammenkunft auf einen späteren Tag in der Woche verlegt wird.
- 🛑 **Fehlerbanner für OBS Studio**: Fehlerbanner hinzugefügt, das an Tagen mit Zusammenkunft erscheint, wenn OBS Studio nicht verbunden ist, damit Benutzer gewarnt werden.
- 📚 **Medien nach Publikation gruppieren**: Medien, die aus derselben Publikation stammen, werden zusammengefasst, für eine aufgeräumtere und übersichtlichere Medienansicht.
- 🎵 **Warnung bei doppelten Liedern**: Zeigt eine Warnung an, wenn Lieder in der Medienliste für die Zusammenkunft am Wochenende mehrfach aufgeführt sind.
- 🔄 **Vorausplanung von Programmänderungen**: Ermöglicht die Planung zukünftiger Änderungen am Zusammenkunftsprogramm, was bei jährlichen Programmänderungen oder beim Besuch des Kreisaufsehers in einer Nachbarversammlung nützlich ist.

## 24.11.0

### ✨ Neue Funktionen

- 🖥️ **Website-Präsentation unter macOS**: Die Präsentation der Website wird jetzt unter macOS unterstützt 🚀
- ⌨️ **Tastenkürzel für die Wiedergabe**: Tastenkürzel zum Stoppen, Pausieren und Fortsetzen der Medienwiedergabe eingeführt 🚀
- 🌐 **Benutzerdefinierte Download-Adresse für Medien**: Möglichkeit hinzugefügt, die Webadresse festzulegen, von der Medien heruntergeladen werden sollen 🚀
- 🎬 **Sofortige OBS-Szenenauswahl**: Sofortige Szenenauswahl für OBS Studio hinzugefügt und die Szenenauswahl in den Einstellungen überarbeitet
- 📖 **Weitere Sprachen für die Dokumentation**: Dokumentations-Website um weitere Sprachen erweitert

## 24.10.10

### ✨ Neue Funktionen

- ⌨️ **Tastenkürzel für die Mediennavigation**: Tastenkürzel hinzugefügt, um zum nächsten/vorherigen Medienelement zu wechseln
- 🖱️ **Rechtsklick-Menü für Medienelemente**: Rechtsklick-Menü für Medienelemente hinzugefügt, um sie auszublenden und umzubenennen
- ✂️ **Import gekürzter JWL-Playlists**: Gekürzte Videozeiten werden in importierten JWL-Playlists jetzt berücksichtigt

## 24.10.9

### ✨ Neue Funktionen

- 🗑️ **Zusätzliche Medien eines Tages löschen**: Option hinzugefügt, um alle zusätzlichen Mediendateien für den aktuell ausgewählten Tag zu löschen
