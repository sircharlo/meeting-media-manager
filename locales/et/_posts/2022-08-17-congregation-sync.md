---
tag: Configuration
title: Koguduse sünkroonimine
ref: congregation-sync
---

Vanemate kogu poolt *videokonverentsi korraldajaks* (VO) määratud vend saab kasutada M³-d, et hallata, milline meedia on tema koguduse tehnilisele A/V tugimeeskonnale kättesaadavaks tehtud.

VO või tema määratud isik saab:

- laadida üles **täiendavat** meediat, mida koosoleku ajal jagada, näiteks ringkonnaülevaataja külastuse või avalike esinejate kõnede jaoks
- **peida** JW.org-ist meedia, mis ei ole antud koosoleku jaoks asjakohane, näiteks kui osa on asendatud kohaliku filiaaliga
- lisage või eemaldage **korduv** meedia, nt aastateksti video või teadaande slaid

All who are synced to the same congregation will then receive the exact same media when they click the *Update media folders* button.

Pange tähele, et koguduse sünkroonimise funktsioon on täiesti valikuline.

### Kuidas see töötab

M³'s underlying sync mechanism uses WebDAV. This means that the VO (or someone under his supervision) needs to either:

- seadistage turvaline WebDAV-server, millele on juurdepääs veebis, **või**
- use a third-party cloud storage service that supports the WebDAV protocol (see the *Web address* setting in the *Congregation sync setup* section below).

Kõik kasutajad, kes soovivad koos sünkroonida, peavad looma ühenduse sama WebDAV-serveriga, kasutades ühenduse teavet ja mandaate, mille neile annab nende VO.

### Koguduse sünkroonimise sätted

| Seadistamine                 | Selgitus                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Hostinimi`                  | Web address of the WebDAV server. Secure HTTP (HTTPS) is required. <br><br> ***Note:** The Web address button, once clicked, will show a list of WebDAV providers that have been known to be compatible with M³, and will automatically prefill certain settings for those providers. <br><br> This list is provided as a courtesy, and in no way represents an endorsement of any particular service or provider. The best server is always the one you own...* |
| `Kasutajanimi`               | WebDAV-teenuse kasutajanimi.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `Parool`                     | Password for the WebDAV service. <br><br> ***Note:** As detailed in their respective support pages, an app-specific password might need to be created for [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) and [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) in order to enable WebDAV connections to their services.*                                                                   |
| `Koguduse sünkroonimiskaust` | This is the folder that will be used to synchronize media for all congregation sync users. You can either type/paste in a path, or use your mouse to navigate to the target folder. <br><br> ***Note:** Make sure that all congregation sync users input the same folder path; otherwise the sync won't work as expected.*                                                                                                                                                   |
| `Koguduse seaded`            | Once the VO has configured the *Media setup* and *Meeting setup* sections of the [Settings]({{page.lang}}/#configuration) on his own computer, he can then use this button to enforce certain settings for all congregation sync users (for example, meeting days, media language, conversion settings, and so on). This means that the selected settings will be forcefully applied for all synced users every time they open M³.                                                       |

### Koguduse sünkroonimise kasutamine meedia haldamiseks

Kui koguduse sünkroonimise seadistamine on lõpule viidud, olete valmis alustama oma koguduse tehnilise AV-toe meeskonnaga [Meedia haldamine]({{page.lang}}/#manage-media).

### Kuvatõmmised koguduse sünkroonimise tegevusest

{% include screenshots/congregation-sync.html lang=site.data.et %}
