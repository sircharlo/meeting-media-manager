# Privaatsuspoliitika {#privacy-policy}

Jõustumise kuupäev: 22. november 2026

Meeting Media Manager (M³) on tasuta avatud lähtekoodiga rakendus, mille on loonud vabatahtlikud. Selles poliitikas selgitatakse, milliseid andmeid M³ töötleb ja kuhu need lähevad. See kehtib M³ kõigi versioonide kohta: sellelt veebisaidilt saadavad installifailid ja kaasaskantav versioon ning versioonid Microsoft Store'is, Snap Store'is ja Flathubis.

**Lühidalt:** M³-l pole kontosid, reklaame ega reklaami- või turundusjälgijaid. Sinu seaded ja meedia jäävad sinu arvutisse. Probleemide leidmiseks ja parandamiseks saadab M³ oma arendajatele diagnostikaandmeid: veaaruandeid ning teavet iga seansi kohta ja selle kohta, kui kiiresti M³ töötab. Sealt jätab M³ välja selle, mis võiks tuvastada sind või sinu kogudust, ning sinu IP-aadressi ei säilitata.

## Mis jääb sinu arvutisse {#on-your-computer}

M³ hoiab sinu arvutis oma andmekaustas järgmist:

- iga koguduse või grupi seaded, näiteks selle nimi, koosolekute ajakava, keel ja integratsioonid;
- meedia ja väljaanded, mille M³ alla laadib, ning meedia, mille sina lisad;
- OBS Studio salasõna, kui kasutad OBS Studiot. M³ krüpteerib selle sinu operatsioonisüsteemi salasõnahoidla abil, kui see on saadaval; kui ei ole, salvestab M³ selle lihttekstina ja annab sulle sellest teada;
- sinu Zoomi integratsiooni seaded, kui sa seda kasutad.

Veaaruanded sisaldavad osa neist seadetest (vt allpool), kuid mitte kunagi neid, mis võiksid tuvastada sind või sinu kogudust.

Kui näitad meediaaknas kaamera pilti (valik viipekeele kogudustele), siis seda ainult kuvatakse: M³ ei lindista, salvesta ega saada seda. Meediaakna eelvaade, mida M³ sulle näitab, jäädvustatakse sinu arvutis ning ka seda ei salvestata ega saadeta.

Saad selle kõik igal ajal kustutada, kustutades M³ andmekausta. Windowsis kustutatakse see ka M³ desinstallimisel. Snap Store'i ja Flathubi versioonid jätavad selle desinstallimisel alles, välja arvatud juhul, kui palud neil seda mitte teha (`snap remove --purge` või `flatpak uninstall --delete-data`).

## Diagnostikaandmed {#error-reports}

M³ saadab diagnostikaandmeid teenusele [Sentry](https://sentry.io), mida M³ arendajad kasutavad vigade leidmiseks ja parandamiseks.

**Veaaruanded**, kui M³-s midagi valesti läheb. Aruanne võib sisaldada:

- viga ja kohta M³ koodis, kus see tekkis;
- M³ versiooni, sinu operatsioonisüsteemi ja selle versiooni, sinu keelt ja ajavööndit ning põhiteavet sinu riistvara kohta, näiteks sinu graafikakaardi kohta;
- samme, mis viisid veani, näiteks M³-s avatud lehti ja faile, mida M³ parajasti alla laadis;
- M³ olekut sel hetkel: selle seadeid ja seda, mida see parajasti tegi, näiteks esitatavat meediat või koosolekut, mida see ette valmistas;
- kui mõni M³ osa jookseb kokku, selle osa krahhiaruannet, mis võib sisaldada osa selle mälust krahhi hetkel.

**Seansiteave**, iga kord, kui M³ töötab: millal see käivitus ja kas see lõpetas töö normaalselt või jooksis kokku, koos M³ versiooni ja sinu operatsioonisüsteemiga.

**Jõudlusteave**, igas seansis: kui kaua võtab aega M³ lehtede avamine ja kui kaua võtavad aega selle päringud allpool loetletud serveritele, koos nende aadressidega.

### Mida M³ välja jätab {#left-out}

Enne diagnostikaandmete saatmist eemaldab M³ neist selle, mis võiks tuvastada sind või sinu kogudust:

- koguduse nime, selle Zoomi koosoleku ID ja Zoomi osalejate nimed;
- seadete PIN-koodi ja OBS Studio salasõna;
- sinu arvutis olevate kaustade ja failide nimed: alles jäävad ainult kausta ketas või ülemise taseme kaust ning faili tüüp;
- seades „Veebisaidi aadress“ oleva aadressi, kui see pole vaikeaadress;
- sinu kasutajanime selle aruannetes olevates kaustateedes.

Andmed ei sisalda nime, e-posti aadressi ega kontot, sest M³-l pole ühtegi neist. M³ palub Sentryl sinu IP-aadressi mitte salvestada ning Sentry on seadistatud seda mitte säilitama.

M³ hooldajad kasutavad neid andmeid ainult probleemide leidmiseks ja parandamiseks. Sentry hoiab neid Ameerika Ühendriikides ja kustutab need piiratud aja möödudes. [Sentry privaatsuspoliitika](https://sentry.io/privacy/) selgitab, kuidas Sentry neid töötleb.

## Serverid, millega M³ ühendub {#connections}

Oma töö tegemiseks ühendub M³ allpool loetletud serveritega. Nagu iga veebisait, mida külastad, näevad ka need serverid sinu arvuti IP-aadressi.

- **Jehoova tunnistajate ametlik veebisait** ja selle allalaadimisserverid, et laadida alla koosolekute meediat ja väljaandeid ning nende kohta käivat teavet. Selle veebisaidi enda privaatsuspoliitika kehtib selle kohta, mida see saab.
- **GitHub**, kus M³ avaldatakse, et kontrollida M³ uuendusi, neid alla laadida ja näidata, mis M³-s uut on. Microsoft Store'i, Snap Store'i ja Flathubi versioonid saavad oma uuendused hoopis oma poest.
- **jsDelivr**, et laadida alla fonte, mida mõned keeled vajavad, ja komponenti, mida M³ kasutab PDF-failide lugemiseks.
- **Apple, Cloudflare, icanhazip.com ja ipify.org**, et kontrollida, kas sinu arvuti on internetiga ühendatud.
- **Sentry**, et saata ülalkirjeldatud diagnostikaandmeid.

M³ töötab ka järgmiste programmide ja funktsioonidega sinu arvutis või kohalikus võrgus, kui neid kasutad:

- **Zoom:** M³ juhib sinu arvutis olevat Zoomi rakendust. M³ ise ei saada Zoomi serveritesse midagi.
- **OBS Studio:** M³ ühendub OBS Studioga sinu arvutis või kohalikus võrgus.
- **Taimeri kaugkuva:** M³ käitab sinu kohalikus võrgus väikest veebiserverit, et mõni teine seade saaks näidata koosoleku taimerit.

Kui kuvad Jehoova tunnistajate ametlikku veebisaiti M³ veebisaidi aknas, töötab see samamoodi nagu veebibrauseris.

## Rakenduste poed {#stores}

Kui installid M³ Microsoft Store'ist, Snap Store'ist või Flathubist, haldab see pood M³ installimist ja uuendusi oma privaatsuspoliitika alusel. M³ ise töötab igas versioonis ühtemoodi.

## Selle poliitika muudatused {#changes}

Kui M³ hakkab andmeid teisiti töötlema, uuendatakse seda lehte ja selle ülaossa lisatakse uus kuupäev. Selle ajalugu on [GitHubis](https://github.com/sircharlo/meeting-media-manager/commits/master/docs/src/en/privacy.md).

## Küsimused {#questions}

Kui sul on küsimus selle poliitika või oma andmete kohta, [ava GitHubis uus teema](https://github.com/sircharlo/meeting-media-manager/issues).
