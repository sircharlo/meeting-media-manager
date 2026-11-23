# Privacybeleid {#privacy-policy}

Ingangsdatum: 22 november 2026

Meeting Media Manager (M³) is een gratis opensource-app die door vrijwilligers is gemaakt. Dit beleid legt uit welke gegevens M³ verwerkt en waar ze naartoe gaan. Het geldt voor elke versie van M³: de installatieprogramma's en de portable versie van deze website, en de versies in de Microsoft Store en de Snap Store.

**Kortom:** M³ heeft geen accounts, geen advertenties en geen trackers voor advertenties of marketing. Je instellingen en media blijven op je computer. Om problemen te vinden en op te lossen, stuurt M³ diagnostische gegevens naar zijn ontwikkelaars: foutrapporten, en informatie over elke sessie en over hoe snel M³ werkt. M³ laat daarin weg wat jou of je gemeente zou kunnen identificeren, en je IP-adres wordt niet opgeslagen.

## Wat er op je computer blijft {#on-your-computer}

M³ bewaart het volgende in zijn gegevensmap op je computer:

- de instellingen van elke gemeente of groep, zoals de naam, het vergaderschema, de taal en de integraties;
- de media en publicaties die M³ downloadt, en de media die je toevoegt;
- het wachtwoord voor OBS Studio, als je OBS Studio gebruikt. M³ versleutelt het met de wachtwoordopslag van je besturingssysteem als die beschikbaar is; als dat niet zo is, slaat M³ het op als platte tekst en laat het je dat weten;
- je instellingen voor de Zoom-integratie, als je die gebruikt.

Foutrapporten bevatten sommige van deze instellingen (zie hieronder), maar nooit de instellingen die jou of je gemeente zouden kunnen identificeren.

Als je het beeld van een camera in het mediavenster toont (een optie voor gebarentaalgemeenten), wordt het alleen weergegeven: M³ neemt het niet op, slaat het niet op en verstuurt het niet. Het voorbeeld van het mediavenster dat M³ je toont, wordt op je computer vastgelegd en wordt evenmin opgeslagen of verstuurd.

Je kunt dit allemaal op elk moment verwijderen door de gegevensmap van M³ te verwijderen. Op Windows wordt die map ook verwijderd als je M³ verwijdert. De versie uit de Snap Store bewaart de map wanneer je die verwijdert, tenzij je aangeeft dat die dat niet moet doen (`snap remove --purge`).

## Diagnostische gegevens {#error-reports}

M³ stuurt diagnostische gegevens naar [Sentry](https://sentry.io), de dienst die zijn ontwikkelaars gebruiken om bugs te vinden en op te lossen.

**Foutrapporten**, als er in M³ iets misgaat. Een rapport kan het volgende bevatten:

- de fout, en waar in de code van M³ die optrad;
- de versie van M³, je besturingssysteem en de versie ervan, je taal en tijdzone, en basisinformatie over je hardware, zoals je videokaart;
- de stappen die tot de fout leidden, zoals de pagina's die in M³ geopend waren en de bestanden die M³ aan het downloaden was;
- de toestand van M³ op dat moment: zijn instellingen, en waar het mee bezig was, zoals de media die werd afgespeeld of de vergadering die het voorbereidde;
- als een onderdeel van M³ crasht, een crashrapport van dat onderdeel, dat een deel van het geheugen ervan op het moment van de crash kan bevatten.

**Sessie-informatie**, elke keer dat M³ draait: wanneer het startte en of het normaal werd afgesloten of crashte, met de versie van M³ en je besturingssysteem.

**Prestatie-informatie**, in elke sessie: hoe lang het duurt voordat de pagina's van M³ openen, en hoe lang zijn verzoeken aan de servers hieronder duren, met hun adressen.

### Wat M³ weglaat {#left-out}

Voordat M³ zijn diagnostische gegevens verstuurt, verwijdert het daaruit wat jou of je gemeente zou kunnen identificeren:

- de naam en de Zoom-vergadering-ID van de gemeente, en de namen van Zoom-deelnemers;
- de pincode van de instellingen en het wachtwoord voor OBS Studio;
- de namen van de mappen en bestanden op je computer: alleen het station of de bovenste map van een map, en het type van een bestand, blijven over;
- het adres in de instelling "Website domein", als het niet het standaardadres is;
- je gebruikersnaam, in de mappaden van zijn rapporten.

De gegevens bevatten geen naam, e-mailadres of account, omdat M³ daar niets van heeft. M³ vraagt Sentry om je IP-adres niet te registreren, en Sentry is zo ingesteld dat het dat niet opslaat.

De beheerders van M³ gebruiken deze gegevens alleen om problemen te vinden en op te lossen. Sentry slaat ze op in de Verenigde Staten en verwijdert ze na een beperkte tijd. [Het privacybeleid van Sentry](https://sentry.io/privacy/) legt uit hoe Sentry ermee omgaat.

## Servers waarmee M³ verbinding maakt {#connections}

Om zijn werk te doen, maakt M³ verbinding met de onderstaande servers. Zoals bij elke website die je bezoekt, kunnen deze servers het IP-adres van je computer zien.

- **De officiële website van Jehovah's Getuigen** en de downloadservers ervan, om vergadermedia en publicaties te downloaden, en de informatie erover. Voor wat die website ontvangt, geldt het eigen privacybeleid van die website.
- **GitHub**, waar M³ wordt gepubliceerd, om te controleren op updates van M³, ze te downloaden en te laten zien wat er nieuw in is. De versies uit de Microsoft Store en de Snap Store krijgen hun updates in plaats daarvan via hun store.
- **jsDelivr**, om de lettertypen te downloaden die sommige talen nodig hebben, en het onderdeel dat M³ gebruikt om PDF-bestanden te lezen.
- **Apple, Cloudflare, icanhazip.com en ipify.org**, om te controleren of je computer met internet verbonden is.
- **Sentry**, om de diagnostische gegevens hierboven te versturen.

M³ werkt ook samen met de volgende programma's en functies op je computer of in je lokale netwerk, als je ze gebruikt:

- **Zoom:** M³ bestuurt de Zoom-app op je computer. Het stuurt zelf niets naar de servers van Zoom.
- **OBS Studio:** M³ maakt verbinding met OBS Studio op je computer of in je lokale netwerk.
- **De timer op afstand:** M³ draait een kleine webserver in je lokale netwerk, zodat een ander apparaat de vergadertimer kan tonen.

Als je de officiële website van Jehovah's Getuigen in het websitevenster van M³ weergeeft, werkt die zoals in een webbrowser.

## Appstores {#stores}

Als je M³ installeert via de Microsoft Store of de Snap Store, regelt die store de installatie en de updates ervan, volgens zijn eigen privacybeleid. M³ zelf werkt in elke versie op dezelfde manier.

## Wijzigingen in dit beleid {#changes}

Als M³ gegevens anders gaat verwerken, wordt deze pagina bijgewerkt, met een nieuwe datum bovenaan. De geschiedenis ervan staat op [GitHub](https://github.com/sircharlo/meeting-media-manager/commits/master/docs/src/en/privacy.md).

## Vragen {#questions}

Als je een vraag hebt over dit beleid of over je gegevens, [maak dan een issue aan op GitHub](https://github.com/sircharlo/meeting-media-manager/issues).
