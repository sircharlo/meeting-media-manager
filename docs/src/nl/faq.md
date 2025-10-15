# Veelgestelde vragen {#frequently-asked-questions}

## Algemene vragen {#general-questions}

### :earth_americas: Maakt deze applicatie gebruik van externe websites, bronnen of diensten om de publicaties en vergadering media te downloaden? {#external-dependencies}

**Nee**. De applicatie werkt hetzelfde als JW Library. De publicaties en media worden direct van de officiële website van Jehovah's Getuigen en zijn CDN gedownload. De app bepaalt automatisch wat er moet worden gedownload en wanneer eerder gedownloade inhoud niet meer up-to-date is en opnieuw moet worden gedownload.

:::info Opmerking

De broncode voor deze app is voor iedereen beschikbaar om te onderzoeken en controleren wat er onder de motorkap gebeurt.

:::

### :thinking: Schendt deze app de Gebruiksvoorwaarden van de officiële website van Jehovah's Getuigen? {#terms-of-use}

**Nee** De [gebruiksvoorwaarden](https://www.jw.org/finder?docid=1011511&prefer=content) van de officiële website van Jehovah's Getuigen staat expliciet het soort gebruik toe dat we maken. Hier is het relevante stukje van de gebruiksvoorwaarden (nadruk toegevoegd):

> Het is niet toegestaan:
>
> voor distributiedoeleinden software-applicaties, tools of technieken te ontwikkelen die specifiek worden gemaakt om gegevens, HTML, afbeeldingen of tekst van deze site te verzamelen, te kopiëren, te downloaden of te extraheren. (het is **wel** toegestaan om gratis, niet-commerciële sofware-applicaties te distribueren die ontwikkeld zijn om elektronische bestanden zoals EPUB, PDF, MP3 en MP4 te downloaden van openbare delen van deze site.)

### :question: Welke besturingssystemen ondersteunt M³? {#operating-systems}

M³ ondersteunt Windows, macOS en Linux:

- **Windows**: Windows 10 en later (64-bits- en 32-bitsversies beschikbaar)
- **macOS**: macOS 10.15 (Catalina) en later (ondersteuning voor Intel en Apple Silicon)
- **Linux**: De meeste moderne Linux-distributies (AppImage-formaat)

### :globe_with_meridians: Werkt M³ in mijn taal? {#language-support}

**Ja!** M³ biedt uitgebreide meertalige ondersteuning:

- **Media Talen**: Download media in een van de honderden talen die beschikbaar zijn op de officiële website van Jehovah’s Getuigen
- **Interface Talen**: Gebruik de interface van M³ in veel verschillende talen
- **Onafhankelijke Instellingen**: Je kunt de interface in de ene taal gebruiken terwijl je media in een andere taal downloadt

## Installatie en Setup {#installation-setup}

### :inbox_tray: Download M³ {#download}

Download de juiste versie voor jouw besturingssysteem vanaf de [releases-pagina](https://github.com/sircharlo/meeting-media-manager/releases/latest).

### :computer: Hoe installeer ik M³? {#installation}

Download de juiste versie voor jouw besturingssysteem vanaf de [releases-pagina](https://github.com/sircharlo/meeting-media-manager/releases/latest) en volg de installatie-instructies in de [installatiegids](/using-at-a-kingdom-hall#download-and-install).

### :gear: Hoe stel ik M³ voor de eerste keer in? {#first-time-setup}

M³ bevat een configuratiewizard die je door de essentiële instellingen leidt:

1. Kies je interfacetaal
2. Selecteer het profieltype (Standaard of Anders)
3. Congregatiegegevens configureren
4. Vergaderschema instellen
5. Optionele functies configureren, zoals OBS-integratie

## Mediabeheer {#faq-media-management}

### :download: Hoe downloadt M³ media? {#media-download}

M³ downloadt automatisch media voor komende vergaderingen door:

1. Je vergaderschema controleren
2. Bepalen welke media nodig is
3. Downloaden van de officiële website van Jehovah’s Getuigen in de door jou geselecteerde taal
4. Media organiseren op datum en vergadertype
5. Bestanden cachen voor offline gebruik

### :calendar: Kan ik media downloaden voor specifieke data? {#specific-dates}

Ja! Met M³ kun je:

- Media voor komende vergaderingen automatisch downloaden
- Aangepaste media importeren voor elke datum

### :folder: Hoe importeer ik mijn eigen mediabestanden? {#import-media}

Je kunt op verschillende manieren aangepaste media importeren:

- **Bestanden importeren**: Gebruik de importknop om video's, afbeeldingen of audiobestanden toe te voegen
- **Slepen en neerzetten**: Sleep bestanden direct naar M³
- **Mapbewaking**: Stel een bewaakte map in voor automatische import
- **JWPUB-bestanden en afspeellijsten**: Publicaties en afspeellijsten importeren

### :speaker: Kan ik audiobijbelopnamen importeren? {#audio-bible}

Ja! M³ bevat een Audio Bijbel-functie waarmee je:

1. Selecteer bijbelboeken en hoofdstukken
2. Kies specifieke verzen of versbereiken
3. Audio-opnamen downloaden
4. Gebruik ze tijdens de vergaderingen

## Presentatiefuncties {#faq-presentation-features}

### :tv: Hoe presenteer ik media tijdens vergaderingen? {#present-media}

Om media te presenteren:

1. Selecteer de datum
2. Klik op de afspeelknop van het media-item dat je wilt presenteren of gebruik sneltoetsen
3. Gebruik de mediabediening om het afspelen te pauzeren, te navigeren of te stoppen
4. Gebruik zoom- en panfuncties voor afbeeldingen
5. Stel aangepaste timing in indien nodig

### :keyboard: Welke sneltoetsen zijn beschikbaar? {#faq-keyboard-shortcuts}

M³ ondersteunt aanpasbare sneltoetsen voor:

- Media venster openen/sluiten
- Vorige/volgende media navigatie
- Afspelen/pauzeren/stoppen bedieningselementen
- Achtergrondmuziek aan/uit zetten

<!-- - Fullscreen mode -->

### :music: Hoe werkt achtergrondmuziek? {#faq-background-music}

Achtergrondmuziekfuncties omvatten:

- Automatisch afspelen wanneer M³ start, voordat de vergadering begint
- Automatisch stoppen voordat vergaderingen beginnen
- Herstarten met één klik na vergaderingen
- Onafhankelijke volumeregeling
- Configureerbare stoptijdbuffer

### :video_camera: Hoe stel ik de Zoom-integratie in? {#zoom-setup}

Om te integreren met Zoom

1. Zoom-integratie inschakelen in M³-instellingen
2. Configureer de sneltoets voor scherm delen die is ingesteld in Zoom. Zorg ervoor dat de sneltoets "globaal" is in de instellingen van Zoom.
3. M³ zal automatisch het Zoom-scherm delen starten en stoppen tijdens mediapresentaties

## OBS Studio-integratie {#faq-obs-integration}

### :video_camera: Hoe stel ik de OBS Studio-integratie in? {#faq-obs-setup}

Om te integreren met OBS Studio:

1. Installeer OBS Studio en de WebSocket-plugin
2. Schakel OBS-integratie in bij de M³-instellingen
3. Voer de OBS-poort en het wachtwoord in
4. Configureer scènes voor camera, media en afbeeldingen
5. Test afspelen

### :arrows_counterclockwise: Hoe werkt automatisch wisselen van scènes? {#faq-scene-switching}

M³ schakelt automatisch OBS-scènes om op basis van:

- Mediatype (video, afbeelding, enz.)
- Je scèneconfiguratie
- Instellingen zoals "Afbeeldingen uitstellen"
- Of terugkeren naar de vorige scène na media

### :pause_button: Wat is de functie "Afbeeldingen uitstellen"? {#faq-postpone-images}

Deze functie stelt het delen van afbeeldingen met OBS uit totdat je ze handmatig activeert. Dit is handig voor:

- Afbeeldingen eerst aan het aanwezige publiek tonen
- Meer controle hebben over de timing
- Voorkomen van voortijdige scènewisselingen

## Geavanceerde functies {#faq-advanced-features}

### :cloud: Hoe werkt mapbewaking? {#faq-folder-monitoring}

Mapbewaking stelt je in staat om:

1. Selecteer een map om te controleren op nieuwe bestanden
2. Importeer automatisch nieuwe mediabestanden die worden gesynchroniseerd met cloudopslag zoals Dropbox of OneDrive

### :file_folder:Wat is automatische media-export? {#faq-media-export}

Media auto-export doet automatisch het volgende:

1. Exporteert mediabestanden naar een opgegeven map
2. Organiseert bestanden op datum en sectie
3. Converteert bestanden naar MP4-formaat (optioneel)
4. Beheert een georganiseerde back-up van :meeting media files:

### :family: Kan ik meerdere gemeenten beheren? {#faq-multiple-congregations}

Ja! M³ ondersteunt meerdere profielen voor:

- Verschillende gemeenten
- Speciale evenementen
- Verschillende groepen
- Gescheiden instellingen en media voor elk

## Probleemoplossing {#faq-troubleshooting}

### :warning: Media wordt niet gedownload. Wat moet ik controleren? {#faq-media-not-downloading}

Controleer deze veelvoorkomende problemen:

1. **Vergaderschema**: Controleer of je vergaderdagen en -tijden correct zijn
2. **Taalinstellingen**: Zorg ervoor dat je mediat taal correct is ingesteld
3. **Internetverbinding**: Controleer je internetverbinding
4. **Taalbeschikbaarheid**: Controleer of media beschikbaar is in je geselecteerde taal

<!-- 5. **Manual Refresh**: Try manually refreshing to check for new media -->

### :video_camera: De OBS-integratie werkt niet. Wat moet ik verifiëren? {#faq-obs-not-working}

Controleer deze OBS-gerelateerde problemen:

1. **OBS-installatie**: Zorg ervoor dat OBS Studio is geïnstalleerd en actief is
2. **WebSocket-plugin**: Controleer of de WebSocket-plugin is geïnstalleerd
3. **Poort en wachtwoord**: Controleer je OBS-poort- en wachtwoordinstellingen
4. **Firewall**: Zorg ervoor dat de :firewall: de verbinding niet blokkeert

### :speaker: Stuurt Meeting Media Manager het media-audio automatisch naar :Zoom: wanneer je :OBS Studio: gebruikt? {#audio-to-zoom}

**Nee.** M³ stuurt media-audio niet automatisch naar :Zoom: of :OBS Studio:. De videostream werkt als een virtuele camera zonder geluid, net zoals een :webcam:. Om het muziek-/video-geluid automatisch beschikbaar te maken in :Zoom:, moet je ervoor zorgen dat :Zoom: het audiokanaal van de computer 'hoort', en vervolgens moet je de instelling **Originele audio** inschakelen in :Zoom:.

**Belangrijke opmerkingen:**

- Je moet Origineel geluid **elke keer** inschakelen voordat je een Zoom-vergadering start
- Deze instelling heeft niets te maken met M³ – je zou hetzelfde audio probleem ervaren bij elk andere media player als je geen gebruik maakt van Zoom's scherm- en audio-deelfuncties.
- De instelling Origineel geluid heeft drie subopties – doorgaans moeten de eerste twee ingeschakeld zijn en de derde uitgeschakeld voor optimale geluidskwaliteit
- Als je nog steeds audio problemen ervaart, moet je mogelijk de optie "Computer geluid delen" van Zoom gebruiken
- Gebruik anders de Zoom-integratie, want die maakt gebruik van de native schermdeling van Zoom.

**Waarom is dit noodzakelijk?**
M³ speelt media met geluid af op je computer, maar dit geluid wordt niet automatisch via de videostream naar Zoom verzonden wanneer je OBS Studio gebruikt. De instelling Original Audio zorgt ervoor dat :Zoom: het geluid dat op je computer wordt afgespeeld kan opvangen tijdens het scherm delen, mits je computer juist is ingesteld (bijvoorbeeld: de computer heeft een tweede geluidskaart die wordt gebruikt voor mediaplayback en waar Zoom naar luistert als een microfoon).

### :snail: M³ werkt traag. Hoe kan ik de prestaties verbeteren? {#performance-issues}

Probeer deze prestatie-optimalisaties:

1. **Extra Cache inschakelen**: Zet extra caching aan in de instellingen
2. **Sluit andere apps**: Sluit onnodige applicaties
3. **Controleer schijfruimte**: Zorg ervoor dat je voldoende vrije schijfruimte hebt
4. **Resolutie verlagen**: Verlaag de maximale resolutie-instelling

### :speech_balloon: Ik heb taalproblemen. Wat moet ik controleren? {#faq-language-issues}

Verifieer deze taalinstellingen:

1. **Interface Language**: Controleer uw weergavetaalinstelling
2. **Mediataal**: Controleer de taalinstelling voor mediadownloads
3. **Beschikbaarheid van taal**: Zorg ervoor dat de mediataal beschikbaar is op de officiële website van de Getuigen van Jehovah.
4. **Terugvaltaal**: Probeer een terugvaltaal in te stellen

## Ondersteuning en Gemeenschap {#support-community}

### :radioactive: Hoe kan ik een probleem melden? {#how-do-i-report-an-issue}

Maak alsjeblieft een [issue](https://github.com/sircharlo/meeting-media-manager/issues) aan op de officiële GitHub repository. Inclusief:

- Gedetailleerde beschrijving van het probleem
- Stappen om het probleem te reproduceren
- Stappen om het probleem te reproduceren
- Eventuele foutmeldingen, logs en screenshots

### :new: Hoe kan ik een nieuwe functie of verbetering aanvragen? {#how-can-i-request-a-new-feature-or-enhancement}

Maak alsjeblieft een [discussie](https://github.com/sircharlo/meeting-media-manager/discussions) aan op de officiële GitHub repository. Beschrijf:

- De functie die je graag wilt zien
- Hoe het gebruikers zou helpen
- Eventuele specifieke vereisten of voorkeuren

### :handshake: Hoe kan ik wat code bijdragen? {#how-can-i-contribute-some-code}

Bekijk alsjeblieft de [handleiding om bij te dragen](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) op de officiële GitHub repository. We verwelkomen codebijdragen en Pull Requests!

### :globe_with_meridians: Hoe kan ik helpen met vertalingen? {#translations}

M³ gebruikt Crowdin voor vertalingsbeheer. Je kunt bijdragen aan vertalingen door:

1. Het [Crowdin project](https://crowdin.com/project/meeting-media-manager) bezoeken
2. Je taal selecteren
3. Vertalen van strings die werk nodig hebben
4. Bestaande vertalingen beoordelen

### :x: Kan ik doneren aan het project? {#can-i-make-a-donation-to-the-project}

Bedankt voor je interesse in het ondersteunen van het project! Echter, in de geest van Mattheüs 10:8, worden donaties **niet** geaccepteerd en dat zal ook nooit veranderen. Deze applicatie is gemaakt met liefde en beetje vrije tijd. Geniet ervan! :tada:

:::tip :book: Mattheüs 10:8

"Voor niets heb je gekregen, voor niets moet je geven."

:::

## Technische Vragen {#technical-questions}

### :floppy_disk: Hoeveel schijfruimte gebruikt M³? {#disk-space}

Schijfruimtegebruik hangt af van:

- **Mediaresolutie**: Hogere resoluties gebruiken meer ruimte
- **Gecachte inhoud**: Mediabestanden worden lokaal gecached
- **Extra Cache**: Extra caching kan het gebruik vergroten
- **Geëxporteerde media**: Auto-export functies gebruiken extra ruimte

Typisch gebruik varieert van 2-10GB afhankelijk van instellingen en gebruik.

### :shield: Is M³ veilig en privé? {#security-privacy}

Ja! M³ is ontworpen met beveiliging en privacy in gedachten:

- **Lokale opslag**: Alle vergadergegevens worden lokaal op je computer opgeslagen
- **Directe downloads**: Media wordt rechtstreeks gedownload van de officiële website van Jehovah's Getuigen
- **Open Source**: De code is open voor review en verificatie
- **Bugreports**: Beperkte gegevens kunnen worden verzameld voor bugreportagedoeleinden

### :arrows_clockwise: Hoe vaak controleert M³ op updates? {#update-frequency}

M³ controleert op updates:

- **Toepassingsupdates**: Controleert automatisch op nieuwe versies elke keer dat de app wordt geopend
- **Media-updates**: Controleert automatisch op nieuwe vergadermedia elke keer dat de app wordt geopend
- **Taalupdates**: Dynamische detectie van nieuwe talen indien nodig
