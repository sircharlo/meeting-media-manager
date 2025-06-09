<!-- markdownlint-disable no-duplicate-heading -->

# Wat is er nieuw

Voor de volledige lijst van wijzigingen tussen versies, zie ons CHANGELOG.md bestand op GitHub.

## v25.6.0 Release Notes

### ✨ Nieuwe functies

- ✨ **Metered connection setting**: Added a new setting to reduce download bandwidth usage on metered connections.
- ✨ **Improved streamed media handling**: Better support for streamed media, reducing latency-related issues.

### 🛠️ Verbeteringen en tweaks

- 🛠️ **Better mime type handling**: Improved support for MIME types for better media compatibility.
- 🛠️ **Enhanced navigation drawer**: Improved mini state handling and added tooltip display for better user navigation.
- 🛠️ **Linux compatibility**: Forced GTK 3 usage on Linux to prevent UI and launch issues.

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
