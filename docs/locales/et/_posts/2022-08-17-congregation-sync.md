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

Kõik, kes on sünkroonitud sama kogudusega, saavad täpselt sama meediumi, kui nad klõpsavad nupul *Värskenda meediakaustu_.

Pange tähele, et koguduse sünkroonimise funktsioon on täiesti valikuline.

### Kuidas see töötab

M³ aluseks olev sünkroonimismehhanism kasutab WebDAV-i. See tähendab, et VO (või keegi tema järelevalve all olev isik) peab kas:

- seadistage turvaline WebDAV-server, millele on juurdepääs veebis, **või**
- kasutada kolmanda osapoole pilvesalvestusteenust, mis toetab WebDAV-protokolli (vt sätet Hostinimi allolevas jaotises *Koguduse sünkroonimise sätted_).

Kõik kasutajad, kes soovivad koos sünkroonida, peavad looma ühenduse sama WebDAV-serveriga, kasutades ühenduse teavet ja mandaate, mille neile annab nende VO.

### Koguduse sünkroonimise sätted

| Seadistamine | Selgitus |
| ------- | ----------- |
| `Hostinimi` | WebDAV-serveri veebiaadress. Turvaline HTTP (HTTPS) on vajalik. <br><br> ***Märkus.** Selle välja silt on tegelikult nupp, millel pärast klõpsamist kuvatakse loend WebDAV-i pakkujatest, mis on teadaolevalt M³-ga ühilduvad, ja eeltäidetakse automaatselt nende pakkujate teatud seaded. <br><br> See nimekiri on esitatud viisakusena ega väljenda mingil juhul ühegi konkreetse teenuse või teenusepakkuja kinnitust. Parim server on alati see, mis sulle kuulub...* |
| `Kasutajanimi` | WebDAV-teenuse kasutajanimi. |
| `Parool` | WebDAV-teenuse parool. <br><br> ***Märkus.** Nagu on kirjeldatud nende vastavatel tugilehtedel, võib olla vajalik luua rakendusepõhine parool [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) ja [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) jaoks, et võimaldada WebDAV-i ühendusi nende teenustega.* |
| `Koguduse sünkroonimiskaust` | Seda kausta kasutatakse meedia sünkroonimiseks kõigi koguduse sünkroonimise kasutajate jaoks. Saate kas tippida/kleepida tee või kasutada sihtkausta navigeerimiseks hiirt. <br><br> ***Märkus.** Veenduge, et kõik koguduse sünkroonimise kasutajad sisestaksid sama kaustatee; vastasel juhul ei tööta sünkroonimine ootuspäraselt.* |
| `Koguduse seaded` | Kui AVÜ on oma arvutis [Seaded]({{page.lang}}/#configuration) jaotised *Meedia sätted* ja *Koosoleku sätted* konfigureerinud, saab ta seejärel kasutada seda nuppu teatud seadete jõustamiseks, kõikide koguduse kasutajatele (näiteks koosolekupäevad, meedia keel, teisendusseaded jne). See tähendab, et valitud seadeid rakendatakse jõuliselt kõikidele sünkroonitud kasutajatele iga kord, kui nad M³ avavad. |

### Koguduse sünkroonimise kasutamine meedia haldamiseks

Kui koguduse sünkroonimise seadistamine on lõpule viidud, olete valmis alustama oma koguduse tehnilise AV-toe meeskonnaga [Meedia haldamine]({{page.lang}}/#manage-media).

### Kuvatõmmised koguduse sünkroonimise tegevusest

{% include screenshots/congregation-sync.html lang=site.data.et %}
