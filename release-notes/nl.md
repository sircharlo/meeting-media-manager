<!-- markdownlint-disable no-duplicate-heading -->

# Wat is er nieuw

Voor de volledige lijst van wijzigingen tussen versies, zie ons CHANGELOG.md bestand op GitHub.

## v25.9.1

### ✨ Nieuwe functies

- ✨ **Media Window Always on Top & Fullscreen Behavior**: Fixed and improved always-on-top behavior for the media window, adjusting dynamically based on fullscreen state.
- ✨ **Date Display Format Setting**: Added a user setting to configure a date display format.
- ✨ **Media Crossfade**: Implemented crossfade transitions for media display, instead of the more abrupt fade-to-black transition that was present before.
- ✨ **macOS Click-Through on Inactive Windows**: Enabled mouse click passthrough on the main window for macOS, which should make it easier to control the app even when it's not focused.

## v25.9.0

### ✨ Nieuwe functies

- ✨ **Download Popup Enhancements**: Added refresh button and download grouping by date in the download popup.
- ✨ **Watched Media Order Memory**: Added section order memory for watched media items.

## v25.8.3

### ✨ Nieuwe functies

- ✨ **Media Window Fade Transitions**: Added a new advanced setting to make the media window fade in and out, providing smoother visual transitions.
- ✨ **Image Duration Control and Progress Tracking**: Added image duration control and progress tracking capabilities for repeated sections.

## v25.8.1

### ✨ Nieuwe functies

- ✨ **Custom Media Sections**: Complete system for creating, editing, and managing custom media sections with color customization and drag-and-drop reordering.
- ✨ **Media Dividers**: Add titled dividers within media lists for better organization with top/bottom positioning options.
- ✨ **Section Repeat Mode**: Enable continuous playback within specific sections for seamless media loops.
- ✨ **Zoom Integration**: Automatic screen sharing start/stop coordination with media playback.

### 🛠️ Verbeteringen en tweaks

- 🛠️ **Enhanced Section Headers**: New three-dots menu system with color picker, move up/down controls, repeat options, and delete functionality.
- ✨ **Inline Title Editing**: Edit media item titles directly in the interface without opening separate dialogs.
- 🛠️ **Improved Navigation**: Better keyboard shortcuts with scroll-to-selected functionality and enhanced media navigation.
- 🛠️ **Visual Enhancements**: Animation support during sorting operations and improved drag-and-drop visual feedback.

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
