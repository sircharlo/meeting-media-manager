---
tag: Konfiguration
title: Versammlungs-Synchronisation
ref: congregation-sync
---

Der von der Ältestenschaft ernannte *Videokonferenz-Organisator* (VO) kann mithilfe von M³ den Brüdern für die Audio-/Videounterstützung in seiner Versammlung Medien zur Verfügung stellen.

Der VO oder ein Gehilfe kann:

- **zusätzlich benötigte** Medien hochladen, bspw. für die Besuchswoche des Kreisaufsehers oder öffentliche Vorträge
- nicht benötigte Medien von JW.ORG **ausblenden**, z.B. weil ein Programmpunkt durch das Zweigbüro ersetzt wurde
- **wiederkehrende** Medien hinzufügen oder entfernen, wie z.B. ein Jahrestext-Video oder eine Ankündigungsfolie

Jeder, der mit der gleichen Versammlung synchronisiert, erhält beim Klicken auf *Medienordner aktualisieren* die exakt gleichen Medien.

Die Versammlungs-Synchronisation ist komplett optional und nicht erforderlich.

### So funktioniert es

Der zugrunde liegende Sync-Mechanismus von M³ verwendet WebDAV. Das bedeutet, dass das VO (oder ein Gehilfe) entweder:

- einen gesicherten WebDAV-Server erstellen muss, der per Internet zugänglich ist, **oder**
- einen externen Cloud-Speicherdienst verwenden muss, der das WebDAV-Protokoll unterstützt (siehe die Einstellung *Web-Adresse* unter *Einstellungen: Versammlungs-Synchronisation*).

Alle Benutzer, die synchronisiert werden wollen, müssen sich mit dem gleichen WebDAV-Server verbinden, indem sie die Verbindungsinformationen und Zugangsdaten verwenden, die ihnen durch ihre VO zur Verfügung gestellt werden.

### Einstellungen: Versammlungs-Synchronisation

| Einstellung                       | Erklärung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Web-Adresse`                     | Webadresse des WebDAV-Servers. Sichere HTTP (HTTPS) ist erforderlich. <br><br> ***Hinweis:** Druck klicken des Web-Adresse-Knopfes wird eine Liste von WebDAV-Providern angezeigt, von denen bekannt ist, dass sie mit M³ kompatibel sind und automatisch bestimmte Einstellungen für diese Anbieter vorausgefüllt. <br><br> Diese Liste wird als Höflichkeit zur Verfügung gestellt und stellt in keiner Weise eine Unterstützung für bestimmte Dienste oder Anbieter dar. Der beste Server ist immer derjenige, den Sie besitzen...* |
| `Benutzername`                    | Benutzername für den WebDAV-Dienst.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `Passwort`                        | Passwort für den WebDAV-Service. <br><br> ***Hinweis:** So detailliert in ihren jeweiligen Supportseiten, ein app-spezifisches Passwort muss für [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) und [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) erstellt werden, um WebDAV-Verbindungen zu ihren Diensten zu ermöglichen.*                                                                                                                                 |
| `Synchronisations-Ordner`         | Dies ist der Ordner, der zur Synchronisierung von Medien für alle Benutzer der Congregation verwendet wird. Sie können entweder in einen Pfad tippen/einfügen oder mit der Maus zum Zielordner navigieren. <br><br> ***Hinweis:** Stellen Sie sicher, dass alle Kongregation Benutzer den gleichen Ordnerpfad eingeben; andernfalls funktioniert die Synchronisation nicht wie erwartet.*                                                                                                                                                          |
| `Versammlungsweite Einstellungen` | Sobald das VO das *Media Setup* und *Meeting Setup* Abschnitte der [Einstellungen]({{page.lang}}/#configuration) auf seinem eigenen Computer konfiguriert hat er kann dann mit diesem Knopf bestimmte Einstellungen für alle Benutzer der Kongregation erzwingen (zum Beispiel Meeting-Tage, Mediensprache, Konvertierungseinstellungen usw. Das bedeutet, dass die ausgewählten Einstellungen bei jedem Öffnen von M3 für alle synchronisierten Benutzer zwingend angewendet werden.                                                                          |

### Benutze Kongregation Sync um Medien zu verwalten

Sobald das Sync-Setup abgeschlossen ist, können Sie [Medien]({{page.lang}}/#manage-media) für das technische AV-Support-Team Ihrer Gemeinde verwalten.

### Screenshots von Kongregation Synchronisation in Aktion

{% include screenshots/congregation-sync.html lang=site.data.de %}
