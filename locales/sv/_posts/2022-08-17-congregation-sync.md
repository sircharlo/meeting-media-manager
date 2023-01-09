---
tag: Configuration
title: Församlingssynkronisering
ref: congregation-sync
---

Brodern som utsetts till *videokonferensarrangör* (VO) av de äldste kan använda M³ för att hantera vilka media som görs tillgängliga för det tekniska A/V-supportteamet i hans församling.

VO, eller någon utsedd av honom, kan:

- ladda upp **ytterligare** media som ska delas under ett möte, till exempel för kretstillsyningsmannens besök eller för offentliga föreläsningar
- **dölj** media från JW.org som inte är relevant för ett visst möte, till exempel när en del har ersatts av den lokala avdelningskontoret
- lägg till eller ta bort **återkommande** media, till exempel en årstextvideo eller en meddelandebild

Alla som är synkroniserade till samma församling kommer sedan att få exakt samma media när de klickar på knappen *Uppdatera mediamappar_.

Observera att funktionen för församlingssynkronisering är helt valfri.

### Hur det fungerar

M³'s underlying sync mechanism uses WebDAV. This means that the VO (or someone under his supervision) needs to either:

- konfigurera en säker WebDAV-server som är tillgänglig på webben, **eller**
- använd en tredjeparts molnlagringstjänst som stöder WebDAV-protokollet (se Värdnamn-inställningen i avsnittet *Inställningar för församlingssynkronisering* nedan).

All users that wish to be synchronized together will need to connect to the same WebDAV server using the connection information and credentials provided to them by their VO.

### Inställningar för församlingssynkronisering

| Inställning                             | Förklaring                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Värdnamn`                              | Web address of the WebDAV server. Secure HTTP (HTTPS) is required. <br><br> ***Note:** The label for this field is actually a button that, once clicked, will show a list of WebDAV providers that have been known to be compatible with M³, and will automatically prefill certain settings for those providers. <br><br> This list is provided as a courtesy, and in no way represents an endorsement of any particular service or provider. The best server is always the one you own...* |
| `Användarnamn`                          | Användarnamn för WebDAV-tjänsten.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `Lösenord`                              | Password for the WebDAV service. <br><br> ***Note:** As detailed in their respective support pages, an app-specific password might need to be created for [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) and [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) in order to enable WebDAV connections to their services.*                                                                                               |
| `Församlingens synkroniseringsmapp`     | This is the folder that will be used to synchronize media for all congregation sync users. You can either type/paste in a path, or use your mouse to navigate to the target folder. <br><br> ***Note:** Make sure that all congregation sync users input the same folder path; otherwise the sync won't work as expected.*                                                                                                                                                                               |
| `Övergripande församlingsinställningar` | Once the VO has configured the *Media setup* and *Meeting setup* sections of the [Settings]({{page.lang}}/#configuration) on his own computer, he can then use this button to enforce certain settings for all congregation sync users (for example, meeting days, media language, conversion settings, and so on). This means that the selected settings will be forcefully applied for all synced users every time they open M³.                                                                                   |

### Använder församlingssynkronisering för att hantera media

När konfigureringen av församlingssynkroniseringen är klar är du redo att starta [Hantera media]({{page.lang}}/#manage-media) för din församlings tekniska AV-supportteam.

### Skärmdumpar av församlingssynkronisering i aktion

{% include screenshots/congregation-sync.html lang=site.data.sv %}
