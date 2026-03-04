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
- **macOS**: macOS 10.15 (Catalina) en later (Universele build)
- **Linux**: De meeste moderne Linux-distributies (AppImage-formaat)

### :globe_with_meridians: Werkt M³ in mijn taal? {#language-support}

**Ja!** M³ biedt uitgebreide meertalige ondersteuning:

- **Media**: Download media in een van de honderden talen die beschikbaar zijn op de officiële website van Jehovah's Getuigen
- **App-interface**: Gebruik de interface van M³ in veel verschillende talen
- **Onafhankelijke instellingen**: Je kunt de interface in de ene taal gebruiken terwijl je media in een andere taal downloadt
- **Reservetalen**: Configureer reservetalen voor gevallen waarin media niet beschikbaar is in de hoofdtaal
- **Ondertiteling**: Download en toon ondertiteling in verschillende talen

## Installatie en Setup {#installation-setup}

### :computer: Hoe kan ik M³ downloaden en installeren? {#installation}

Download de juiste versie van de [downloadpagina](download) en volg de stappen in de [gebruikershandleiding](user-guide).

### :gear: Hoe stel ik M³ de eerste keer in? {#first-time-setup}

M³ bevat een installatiewizard die je door de essentiële configuratie loodst:

1. Kies de taal van de interface
2. Selecteer het profieltype (Regulier of Overig)
3. Configureer de gemeentegegevens
4. Stel het vergaderschema in
5. Configureer optionele functies zoals OBS-integratie

## Mediabeheer {#faq-media-management}

### :desktop_computer: Hoe downloadt M³ media? {#media-download}

M³ downloadt automatisch media voor aankomende vergaderingen door:

1. Je vergaderschema te controleren
2. Te bepalen welke media nodig is
3. Te downloaden van de officiële website van Jehovah's Getuigen in de door jou geselecteerde taal
4. Media te organiseren op datum en vergadertype
5. Bestanden te cachen voor offline gebruik

### :calendar: Kan ik media downloaden voor specifieke datums? {#specific-dates}

Ja! Met M³ kun je:

- Automatisch media downloaden voor aankomende vergaderingen
- Eigen media importeren voor elke gewenste datum

### :file_folder: Wat is de automatische media-export? :file_folder: Wat is de automatische media-export?

Je kunt op verschillende manieren eigen media importeren:

- **Bestandsimport**: Gebruik de importknop om video's, afbeeldingen of audiobestanden toe te voegen
- **Slepen en neerzetten**: Sleep bestanden rechtstreeks in M³
- **Mapbewaking**: Stel een bewaakte map in voor automatische import
- **JWPUB-bestanden en afspeellijsten**: Importeer publicaties en afspeellijsten vanuit JW Library

### :speaker: Kan ik audio-opnames van de Bijbel importeren? {#audio-bible}

Ja! M³ bevat een Audiobijbel-functie waarmee je:

1. Bijbelboeken en hoofdstukken kunt selecteren
2. Specifieke verzen of versreeksen kunt kiezen
3. Audio-opnames kunt downloaden
4. Deze kunt gebruiken tijdens de vergaderingen

## Presentatiefuncties {#faq-presentation-features}

### :tv: Hoe presenteer ik media tijdens vergaderingen? {#present-media}

Om media te presenteren:

1. Selecteer de datum
2. Klik op de afspeelknop op het media-item dat je wilt presenteren of gebruik sneltoetsen
3. Gebruik de knoppen van de mediaspeler om te pauzeren, te navigeren of de weergave te stoppen
4. Gebruik de zoom- en pan-functies voor afbeeldingen
5. Stel indien nodig een aangepaste timing in

### :keyboard: Welke sneltoetsen zijn er beschikbaar? {#faq-keyboard-shortcuts}

M³ ondersteunt aanpasbare sneltoetsen voor:

- Het openen/sluiten van het mediavenster
- Navigatie naar de vorige/volgende media
- Knoppen voor afspelen/pauzeren/stoppen
- In- of uitschakelen van achtergrondmuziek

<!-- - Fullscreen mode -->

### :notes: Hoe werkt achtergrondmuziek? {#faq-background-music}

Functies voor achtergrondmuziek zijn onder andere:

- Automatisch afspelen wanneer M³ start, voordat de vergadering begint
- Automatisch stoppen voordat de vergadering begint
- Herstarten met één klik na de vergadering
- Onafhankelijke volumeregeling
- Configureerbare buffer-tijd voor het stoppen

### :video_camera: Hoe stel ik de Zoom-integratie in? {#zoom-setup}

Om te integreren met Zoom:

1. Schakel Zoom-integratie in bij de instellingen van M³
2. Configureer de sneltoets voor het delen van het scherm zoals deze in Zoom is ingesteld. Zorg ervoor dat deze sneltoets "globaal" is in de instellingen van Zoom.
3. M³ zal automatisch de schermdeling van Zoom starten en stoppen tijdens mediapresentaties

## OBS Studio Integration {#faq-obs-integration}

### :video_camera: Hoe stel ik de OBS Studio-integratie in? {#faq-obs-setup}

Om te integreren met OBS Studio:

1. Installeer OBS Studio en de WebSocket-plug-in
2. Schakel OBS-integratie in bij de instellingen van M³
3. Voer de poort en het wachtwoord van OBS in
4. Configureer de scènes voor de camera, media en afbeeldingen
5. Test de weergave

### :arrows_counterclockwise: Hoe werkt het automatisch schakelen tussen scènes? {#faq-scene-switching}

M³ schakelt automatisch tussen OBS-scènes op basis van:

- Mediatype (video, afbeelding, enz.)
- Je scène-configuratie
- Instellingen zoals "Afbeeldingen uitstellen"
- Of er na de media moet worden teruggekeerd naar de vorige scène

### :pause_button: Wat is de functie "Afbeeldingen uitstellen"? {#faq-postpone-images}

Deze functie stelt het delen van afbeeldingen naar OBS uit totdat je ze handmatig activeert. Dit is handig voor:

- Het eerst tonen van afbeeldingen aan het fysieke publiek
- Meer controle hebben over de timing
- Het vermijden van voortijdige scène-wisselingen

## Advanced Features {#faq-advanced-features}

### :cloud: Hoe werkt mapbewaking? {#faq-folder-monitoring}

Mapbewaking stelt je in staat om:

1. Een map te selecteren om te controleren op nieuwe bestanden
2. Automatisch nieuwe mediabestanden te importeren die worden gesynchroniseerd met cloudopslag zoals Dropbox of OneDrive

### :open_file_folder: Hoe importeer ik mijn eigen mediabestanden? {#import-media}

De automatische media-export doet het volgende:

1. Exporteert mediabestanden naar een opgegeven map
2. Organiseert bestanden op datum en sectie
3. Converteert bestanden naar het MP4-formaat (optioneel)
4. Houdt een georganiseerde back-up bij van mediabestanden voor vergaderingen

### :family: Kan ik meerdere gemeenten beheren? {#faq-multiple-congregations}

Ja! M³ ondersteunt meerdere profielen voor:

- Verschillende gemeenten
- Speciale evenementen
- Verschillende groepen
- Aparte instellingen en media voor elk profiel

## Troubleshooting {#faq-troubleshooting}

### :warning: De media wordt niet gedownload. Wat moet ik controleren? {#faq-media-not-downloading}

Controleer de volgende veelvoorkomende problemen:

1. **Vergaderschema**: Controleer of de vergaderdagen en -tijden correct zijn ingesteld
2. **Taalinstellingen**: Zorg ervoor dat de taal voor media correct is ingesteld
3. **Internetverbinding**: Controleer je internetverbinding
4. **Taalbeschikbaarheid**: Controleer of de media beschikbaar is in de door jou geselecteerde taal op jw.org

<!-- 5. **Manual Refresh**: Try manually refreshing to check for new media -->

### :video_camera: De OBS-integratie werkt niet. Wat moet ik verifiëren? {#faq-obs-not-working}

Controleer de volgende OBS-gerelateerde zaken:

1. **OBS-installatie**: Zorg ervoor dat OBS Studio is geïnstalleerd en actief is
2. **WebSocket-plug-in**: Controleer of de WebSocket-plug-in is geïnstalleerd
3. **Poort en wachtwoord**: Controleer de instellingen voor de OBS-poort en het wachtwoord
4. **Firewall**: Zorg ervoor dat de firewall de verbinding niet blokkeert

### :speaker: Stuurt Meeting Media Manager automatisch de media-audio naar Zoom wanneer OBS Studio wordt gebruikt? {#audio-to-zoom}

**Nee.** M³ stuurt niet automatisch media-audio naar Zoom of OBS Studio. De videostroom werkt als een virtuele camera zonder geluid, net als een webcam. Om het geluid van de muziek of video automatisch beschikbaar te hebben in Zoom, moet je ervoor zorgen dat Zoom de audiofeed van de computer 'hoort', en vervolgens moet je de instelling **Origineel geluid** inschakelen in Zoom.

**Belangrijke opmerkingen:**

- Je moet Origineel geluid **elke keer** inschakelen voordat je een Zoom-vergadering start
- Deze instelling heeft niets te maken met M³ — je zou hetzelfde audioprobleem hebben met elke andere mediaspeler als je de functies van Zoom voor het delen van scherm en audio niet gebruikt
- De instelling Origineel geluid heeft drie subopties — meestal moeten de eerste twee ingeschakeld zijn en de derde uitgeschakeld voor de beste audiokwaliteit
- Als je nog steeds audioproblemen ervaart, moet je mogelijk in plaats daarvan de optie "Computergeluid delen" van Zoom gebruiken
- Je kunt ook overwegen de Zoom-integratie te gebruiken, aangezien deze gebruikmaakt van de systeemeigen schermdeling van Zoom.

**Waarom is dit nodig?**
M³ speelt media af met geluid op je computer, maar deze audio wordt niet automatisch via de videostroom naar Zoom verzonden wanneer je OBS Studio gebruikt. De instelling Origineel geluid stelt Zoom in staat om de audio die op je computer wordt afgespeeld vast te leggen tijdens het delen van het scherm, mits je computer goed is geconfigureerd (bijvoorbeeld: de computer heeft een tweede geluidskaart die wordt gebruikt voor het afspelen van media waar Zoom naar luistert als een microfoon).

### :snail: M³ draait traag. Hoe kan ik de prestaties verbeteren? {#performance-issues}

Probeer deze prestatie-optimalisaties:

1. **Extra cache inschakelen**: Schakel extra caching in bij de instellingen
2. **Andere apps sluiten**: Sluit onnodige applicaties
3. **Schijfruimte controleren**: Zorg ervoor dat je voldoende vrije schijfruimte hebt
4. **Resolutie verlagen**: Verlaag de instelling voor de maximale resolutie

### :speech_balloon: Ik heb taalproblemen. Wat moet ik controleren? {#faq-language-issues}

Controleer deze taalinstellingen:

1. **Interfacetaal**: Controleer de taalinstelling voor de weergave
2. **Mediataal**: Controleer de taal voor het downloaden van media
3. **Taalbeschikbaarheid**: Zorg ervoor dat de mediataal beschikbaar is op de officiële website van Jehovah's Getuigen
4. **Fallback Language**: Try setting a fallback language

## Support and Community {#support-community}

### :radioactive: Hoe meld ik een probleem? {#how-do-i-report-an-issue}

Maak alsjeblieft [een issue aan](https://github.com/sircharlo/meeting-media-manager/issues) op de officiële GitHub-repository. Vermeld daarbij:

- Een gedetailleerde beschrijving van het probleem
- Stappen om het probleem te reproduceren
- Je besturingssysteem en de versie van M³
- Eventuele foutmeldingen, logs en schermafbeeldingen

### :new: Hoe kan ik een nieuwe functie of verbetering aanvragen? {#how-can-i-request-a-new-feature-or-enhancement}

Start alsjeblieft [een discussie](https://github.com/sircharlo/meeting-media-manager/discussions) op de officiële GitHub-repository. Beschrijf:

- De functie die je graag zou zien
- Welk voordeel dit biedt voor gebruikers
- Eventuele specifieke vereisten of voorkeuren

### :handshake: Hoe kan ik bijdragen aan de code? {#how-can-i-contribute-some-code}

Raadpleeg alsjeblieft de [bijdragershandleiding](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) op de officiële GitHub-repository. Bijdragen aan de code en Pull Requests zijn van harte welkom!

### :globe_with_meridians: Hoe kan ik helpen met vertalingen? {#translations}

M³ gebruikt Crowdin voor vertaalbeheer. Je kunt bijdragen aan vertalingen door:

1. Het [Crowdin-project](https://crowdin.com/project/meeting-media-manager) te bezoeken
2. Je taal te selecteren
3. Teksten te vertalen die nog werk nodig hebben
4. Bestaande vertalingen te controleren

### :x: Kan ik een donatie doen aan het project? {#can-i-make-a-donation-to-the-project}

Bedankt voor je interesse om het project te ondersteunen! Echter, in de geest van Mattheüs 10:8 worden donaties **niet** geaccepteerd en dat zal ook nooit gebeuren. Deze app is gemaakt met liefde en een beetje vrije tijd. Veel plezier ermee! :tada:

:::tip :book: Matthew 10:8

"You received free, give free."

:::

## Technische vragen {#technical-questions}

### :computer: Wat zijn de hardware- en softwarevereisten voor M³? {#hardware-and-software-requirements}

M³ is ontworpen om te werken op een breed scala aan besturingssystemen:

- **Windows**: Windows 10 en later (64-bits- en 32-bitsversies beschikbaar)
- **macOS**: macOS 10.15 (Catalina) en later (Universele build)
- **Linux**: De meeste moderne Linux-distributies (AppImage-formaat)

M³ heeft de volgende hardwarevereisten:

- **Minimum**: 4 GB RAM, 6 GB vrije schijfruimte
- **Aanbevolen**: 8 GB RAM, 15 GB vrije schijfruimte voor media-caching
- **Netwerk**: Internetverbinding voor het downloaden van media

Afhankelijk van de functies die je gebruikt, vereist M³ ook de volgende aanvullende software:

- **Zoom**: Alleen vereist bij gebruik van Zoom-integratiefuncties
- **OBS Studio**: Alleen vereist bij gebruik van OBS-integratiefuncties

### :floppy_disk: Hoeveel schijfruimte gebruikt M³? {#disk-space}

Schijfruimtegebruik hangt af van:

- **Mediaresolutie**: Hogere resoluties gebruiken meer ruimte
- **Gecachte inhoud**: Mediabestanden worden lokaal gecached
- **Extra Cache**: Extra caching kan het gebruik vergroten
- **Geëxporteerde media**: Auto-export functies gebruiken extra ruimte

Typisch gebruik varieert van 2-10GB afhankelijk van instellingen en gebruik.

### :shield: Is M³ veilig en privé? {#security-privacy}

Ja! M³ is ontworpen met veiligheid en privacy in gedachte:

- **Lokale opslag**: Alle vergadergegevens worden lokaal op je computer opgeslagen
- **Directe downloads**: Media wordt rechtstreeks gedownload van de officiële website van Jehovah's Getuigen
- **Open Source**: De code is open voor inspectie en verificatie
- **Bugreports**: Er kunnen beperkte gegevens worden verzameld voor het rapporteren van bugs

### :arrows_clockwise: Hoe vaak controleert M³ op updates? {#update-frequency}

M³ controleert op updates:

- **Toepassingsupdates**: Controleert automatisch op nieuwe versies elke keer dat de app wordt geopend
- **Media-updates**: Controleert automatisch op nieuwe vergadermedia elke keer dat de app wordt geopend
- **Taalupdates**: Dynamische detectie van nieuwe talen indien nodig
