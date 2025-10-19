<!-- markdownlint-disable no-duplicate-heading -->

# Wat is er nieuw

Voor de volledige lijst van wijzigingen tussen versies, zie ons CHANGELOG.md bestand op GitHub.

## v25.10.1

### ✨ Nieuwe functies

- ✨ **Setup Wizard – Zoom Step**: Added a Zoom integration step to the setup wizard for easier initial configuration.
- ✨ **Screen Picker Enhancements**: Show an accurate visual representation of all screens, as well as the main window’s current size and location, in the display popup. This makes it easier to choose the correct screen on which the media window should be displayed.
- ✨ **Media Window Preference**: The app will now remember the preferred screen on which the media window should be displayed, if specified by the user.

## v25.10.0

### ✨ Nieuwe functies

- ✨ **Afspelen begint gepauzeerd**: Er is een nieuwe instelling toegevoegd om afspelen te laten beginnen in gepauzeerde toestand, wat nuttig kan zijn voor AV-operators om hun setup voor te bereiden (zoals het starten van Zoom delen) voordat de media begint te spelen in het mediavenster.
- ✨ **Update Meldingen**: Gebruikers worden nu op de hoogte gebracht van updates via een banner in de app, die ook de gebruiker toelaat om updates onmiddellijk te installeren, in plaats van te wachten op de volgende app herstart.
- ✨ **Aangepaste Gebeurtenissen**: Er zijn optionele gebeurtenishaken toegevoegd die sneltoetsen kunnen activeren wanneer bepaalde gebeurtenissen worden gedetecteerd. Dit kan nuttig zijn voor AV-operators om acties automatisch buiten de app uit te voeren. Bijvoorbeeld, slimme lichten kunnen worden aangezet en uitgezet voor en na het afspelen van media in auditoria waar projectors worden gebruikt; of een script kan worden aangeroepen nadat het laatste lied van een vergadering is afgespeeld om verschillende acties in een Zoom-vergadering te automatiseren.

## v25.9.1

### ✨ Nieuwe functies

- ✨ **Mediavenster Altijd Boven & Volledig Scherm Gedrag**: Het altijd-boven-gedrag voor het mediavenster is opgelost en verbeterd, met dynamische aanpassingen gebaseerd op de volledig-scherm-status.
- ✨ **Datumweergave Indelingsinstelling**: Er is een gebruikersinstelling toegevoegd om een datumweergave-indeling te configureren.
- ✨ **Media Overvloeien**: Er zijn overvloei-overgangen geïmplementeerd voor mediaweergave, in plaats van de meer abrupte vervagen-naar-zwart overgang die eerder aanwezig was.
- ✨ **Muziek Auto-Stop**: Het gedrag van de achtergrondmuziek auto-stop is geoptimaliseerd om zich hetzelfde te gedragen of de muziek automatisch werd gestart of niet.
- ✨ **macOS Klikken Door op Inactieve Vensters**: Muisklikken doorgang ingeschakeld op het hoofdvenster voor macOS, wat het eenvoudiger moet maken om de app te bedienen zelfs wanneer het niet gefocust is.

## v25.9.0

### ✨ Nieuwe functies

- ✨ **Download Popup Verbeteringen**: Er is een vernieuwingsknop toegevoegd en downloads gegroepeerd op datum in de download popup.
- ✨ **Bekeken Media Volgorde Geheugen**: Sectie volgorde geheugen toegevoegd voor bekeken media items.

## v25.8.3

### ✨ Nieuwe functies

- ✨ **Mediavenster Vervagingsovergangen**: Er is een nieuwe geavanceerde instelling toegevoegd om het mediavenster in en uit te laten vervagen, waardoor vloeiendere visuele overgangen worden geboden.
- ✨ **Afbeelding Duur Controle en Voortgang Bijhouden**: Afbeelding duur controle en voortgang bijhouden mogelijkheden toegevoegd voor herhaalde secties.

## v25.8.1

### ✨ Nieuwe functies

- ✨ **Aangepaste Media Secties**: Compleet systeem voor het maken, bewerken en beheren van aangepaste media secties met kleur aanpassing en slepen en neerzetten herschikking.
- ✨ **Media Scheidingen**: Voeg getitelde scheidingen toe binnen medialijsten voor betere organisatie met boven/onder positioneringsopties.
- ✨ **Sectie Herhaal Modus**: Schakel continue afspelen in binnen specifieke secties voor naadloze media loops.
- ✨ **Zoom Integratie**: Automatische scherm delen start/stop coördinatie met media afspelen.

### 🛠️ Verbeteringen en tweaks

- 🛠️ **Verbeterde Sectie Koppen**: Nieuw drie-punten menu systeem met kleur kiezer, omhoog/omlaag verplaatsingscontroles, herhaal opties, en verwijder functionaliteit.
- ✨ **Inline Titel Bewerken**: Bewerk media item titels direct in de interface zonder aparte dialogen te openen.
- 🛠️ **Verbeterde Navigatie**: Betere sneltoetsen met scroll-naar-geselecteerd functionaliteit en verbeterde media navigatie.
- 🛠️ **Visuele Verbeteringen**: Animatie ondersteuning tijdens sorteeroperaties en verbeterde slepen-en-neerzetten visuele feedback.

## 25.6.0

### ✨ Nieuwe functies

- ✨ **Betaalde verbindingsinstelling**: Een nieuwe instelling toegevoegd om het gebruik van de downloadbandbreedte voor datalimiet te verminderen.
- ✨ **Verbeterde streaming van media**: Betere ondersteuning voor het streamen van media, minder problemen in verband met vertraging.

### 🛠️ Verbeteringen en tweaks

- 🛠️ **Betere mime type verwerking**: Verbeterde ondersteuning voor MIME-types voor betere compatibiliteit van de media.
- 🛠️ **Verbeterde navigatie drawer**: Verbeterde mini state behandeling en toegevoegde tooltip voor betere user navigatie.
- 🛠️ **Linux compatibiliteit**: Forced GTK 3 gebruik op Linux om UI en opstart problemen te voorkomen.

## 25.5.0

### ✨ Nieuwe functies

- 🖼️ **OBS Vertraging optie voor Afbeeldingen**: Voeg een OBS Studio instelling toe om scène wijzigingen te vertragen bij het weergeven van afbeeldingen, waardoor overgangen worden verbeterd.
- 🔊 **Ondersteuning voor `.m4a` Audio Formaat**: Voeg compatibiliteit toe voor `.m4a` audio bestanden om ondersteunde media types uit te breiden.

### 🛠️ Verbeteringen en tweaks

- 🔍 **Herstel Zoom via `Ctrl` + `Scroll`**: Herstel onmiddellijke zooming met ctrl + scroll voor makkelijkere navigatie.
- 👤 **Verberg ongebruikte KO Media**: Verberg in plaats van ongebruikte media over te slaan voor kringopziener bezoeken om een schonere presentatie te onderhouden.
- 🎵 **Verbeter dubbele liederen indicator**: Verbeter de visuele hint voor dubbele liederen om ze gemakkelijker te identificeren.

## 25.4.3

### 🛠️ Verbeteringen en tweaks

- ➕ **Maak media schoon van v25.4.x**: haal automatisch losgekoppelde of misplaatste media weg van v25. .1 tot en met v25.4.2 om ervoor te zorgen dat er geen media ontbreekt of op de verkeerde plaats in de medialijst staat.

## 25.4.2

### 🛠️ Verbeteringen en tweaks

- ➕ **Voorkom dat sommige media dupliceren**: voorkom dat sommige media-items meerdere keren toegevoegd worden aan de medialijst.

## 25.4.1

### 🛠️ Verbeteringen en tweaks

- 🎬 **Fix aangepaste begin- en eindtijden**: Voorkom dat aangepaste begin- en eindtijden verkeerd worden toegepast op de verkeerde video.
- 📝 **Niet overeenkomende ondertitels toestaan**: Gebruik van ondertitels inschakelen, zelfs als ze niet perfect overeenkomen met het mediabestand.
- 🪟 **Schakel Ronde hoeken uit in Windows**: Verwijder afgeronde hoeken voor het media-venster in Windows.
- 🖼️ **Voeg niet-gerefereerde afbeeldingen toe aan de medialijst**: Zorg ervoor dat alle afbeeldingen zonder verwijzing toegevoegd worden aan de medialijst voor volledigheid.
- ➕ **Voorkom dubbele media secties**: Vermijd meerdere media secties voor hetzelfde media-item te maken.
- 📥 **Behoud Afspeellijst Volgorde bij Importeren**: Behoud de originele volgorde van JWL afspeellijsten tijdens het importproces.

## 25.4.0

### ✨ Nieuwe functies

- 🇵🇭 **Nieuwe taal: Tagalog**: Ondersteuning toegevoegd voor Tagalog, waardoor de meertalige mogelijkheden van de app worden uitgebreid.
- 🎞️ **Ondersteuning voor `.m4v` Video Formaat**: Ondersteuning voor het afspelen van `.m4v` bestanden om de compatibiliteit met de media te verbeteren.

### 🛠️ Verbeteringen en tweaks

- 🎬 **Meerdere start/stop tijden voor een video**: Laat een enkele video meerdere keren in de medialijst verschijnen met verschillende aangepaste start- en eindtijden.
- 📤 **Voeg gegroepeerde media in Auto-export toe**: Automatisch gegroepeerde media exporteren samen met anderen.
- 📡 **Haal `.m4v` bestanden op van de JW API**: Zorg ervoor dat `.m4v` bestanden correct worden opgehaald van de JW API.

## 25.3.1

### ✨ Nieuwe functies

- 🌏 **Nieuwe Taal: Koreaans**: Ondersteun de Koreaanse taal, waardoor de toegankelijkheid voor meer gebruikers toeneemt.

### 🛠️ Verbeteringen en tweaks

- ⚡ **Prestaties & CPU-gebruik verbeteren**: Optimaliseer prestaties om CPU-gebruik te verminderen en efficiëntie te verbeteren.
- 🔄 **Problemen met synchroniseren en crashen oplossen**: los verschillende sync-gerelateerde en stabiliteitsproblemen op om de betrouwbaarheid te verbeteren.
- 📜 **Toon release-notities voor bestaande gemeenten**: Zorg ervoor dat release notities alleen worden weergegeven voor gemeenten die al zijn ingeladen.

## 25.3.0

### ✨ Nieuwe functies

- 🎵 **Speel achtergrondmuziek af met video's**: Toestaan dat achtergrondmuziek blijft afspelen terwijl video's worden bekeken.
- 🎥 **Camera stream voor gebarentaal**: Voeg de mogelijkheid toe om een camera stream in het mediavenster weer te geven, specifiek voor gebarentaal gebruikers.
- 📅 **Automatische Avondmaal datum & achtergrond**: Automatisch detecteren en instellen van de datum en klaarzetten van de achtergrondafbeelding voor het Avondmaal.
- 📜 **Laat release-notities in de app zien**: Laat release-notities direct in de app zien, zodat gebruikers wijzigingen gemakkelijk kunnen inzien na een update.

### 🛠️ Verbeteringen en tweaks

- ⚡ **Optimaliseer slim cache verwijderen**: Verbeter het slim cache verwijderen voor betere prestaties en efficiëntie.
- 📂 **Correcte kringopziener media positie**: Zorg ervoor dat kringopziener media in de juiste sectie wordt geplaatst.
- 📅 **Sluit gewone vergadering media uit voor Avondmaal**: Voorkom het ophalen van standaard media voor vergaderingen, om fouten te voorkomen.
- 📅 **Verberg de gewone vergader secties op het Avondmaal**: Verwijder onnodige vergader secties tijdens het Avondmaal voor een schonere lay-out.
- 📖 **Herstel gebarentaal Bijbel video downloads**: Download gebarentaal Bijbel hoofdstukvideo's van JWL-afspeellijsten correct.
