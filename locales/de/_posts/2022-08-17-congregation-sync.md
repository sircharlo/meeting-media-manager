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

Jeder, der mit der gleichen Versammlung synchronisiert, erhält dann beim Klicken auf *Medienordner aktualisieren* die exakt gleichen Medien.

Die Versammlungs-Synchronisation ist komplett optional und nicht erforderlich.

### So funktioniert es

Der zugrunde liegende Sync-Mechanismus von M³ verwendet WebDAV. Das bedeutet, dass das VO (oder ein Gehilfe) entweder:

- einen gesicherten WebDAV-Server erstellen muss, der per Internet zugänglich ist, **oder**
- einen externen Cloud-Speicherdienst verwenden muss, der das WebDAV-Protokoll unterstützt (siehe die Einstellung *Web-Adresse* unter *Einstellungen: Versammlungs-Synchronisation*).

All users that wish to be synchronized together will need to connect to the same WebDAV server using the connection information and credentials provided to them by their VO.

### Einstellungen: Versammlungs-Synchronisation

| Einstellung                       | Erklärung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Web-Adresse`                     | Web address of the WebDAV server. Secure HTTP (HTTPS) is required. <br><br> ***Note:** The label for this field is actually a button that, once clicked, will show a list of WebDAV providers that have been known to be compatible with M³, and will automatically prefill certain settings for those providers. <br><br> This list is provided as a courtesy, and in no way represents an endorsement of any particular service or provider. The best server is always the one you own...* |
| `Benutzername`                    | Username for the WebDAV service.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `Passwort`                        | Password for the WebDAV service. <br><br> ***Note:** As detailed in their respective support pages, an app-specific password might need to be created for [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) and [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) in order to enable WebDAV connections to their services.*                                                                                               |
| `Synchronisations-Ordner`         | This is the folder that will be used to synchronize media for all congregation sync users. You can either type/paste in a path, or use your mouse to navigate to the target folder. <br><br> ***Note:** Make sure that all congregation sync users input the same folder path; otherwise the sync won't work as expected.*                                                                                                                                                                               |
| `Versammlungsweite Einstellungen` | Once the VO has configured the *Media setup* and *Meeting setup* sections of the [Settings]({{page.lang}}/#configuration) on his own computer, he can then use this button to enforce certain settings for all congregation sync users (for example, meeting days, media language, conversion settings, and so on). This means that the selected settings will be forcefully applied for all synced users every time they open M³.                                                                                   |

### Using congregation sync to manage media

Once the congregation sync setup is complete, you're ready to start [Managing media]({{page.lang}}/#manage-media) for your congregation's technical AV support team.

### Screenshots of congregation sync in action

{% include screenshots/congregation-sync.html lang=site.data.de %}
