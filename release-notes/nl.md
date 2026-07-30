<!-- markdownlint-disable no-duplicate-heading -->

# Wat is er nieuw

Voor de volledige lijst van wijzigingen tussen versies, zie ons CHANGELOG.md bestand op GitHub.

## v26.7.7

### ✨ Nieuwe functies

- ✨ **Media Preview Quality**: Media preview now renders video frames via canvas with high-quality downscaling, fixing jagged/blurry previews (especially on text-heavy content like songs). The preview also auto-disables itself if it has to repeatedly correct playback drift on a single video, with a one-click way to turn it back on.

## v26.7.6

### ✨ Nieuwe functies

- ✨ **CBS Video Exclusion**: Added a setting to exclude Congregation Bible Study videos from specific publications (defaults to the **Walk Courageously With God** book), with a searchable publication picker.
- ✨ **Document Page Numbers**: Publication Media and JWPUB import listings now show each document's page number (or numbers when there are multiple pages) after its title. This can help you to quickly find specific media when you know the page number on which it is found.

## v26.7.4

### ✨ Nieuwe functies

- ✨ **Missing Media Recovery**: Media items whose local file went missing (e.g. deleted by the cache auto-clear, or removed manually) now show a disabled play button, a "missing" caption naming the file to look for, and a new "Locate file" action to relink the item to a file on disk.
- ✨ **Compatibility Warning**: Added a dismissible banner warning users on soon-to-be-unsupported OS/architecture combos (macOS 12 Monterey and Windows 32-bit) to upgrade before future app updates require newer system support.

## v26.7.0

### ✨ Nieuwe functies

- ✨ **Linked Audio Playback**: Added support for playing audio from one file together with video from another file. This can be useful for playing video slideshows with accompanying music.
- ✨ **Watched Media Layouts**: Added persistence for watched media items and section order across watched folders. This ensures that the media list is displayed the same way even when the watched folder is synced across devices.

## v26.6.1

### ✨ Nieuwe functies

- ✨ **Media Preview**: Added a live media preview overlay that can be toggled on or off from the settings or from the display popup.
- ✨ **Search media**: Added a quick search box in the media list that allows you to quickly find media by title. To use it, simply use the standard keyboard shortcut for search (Ctrl+F or Cmd+F).
- ✨ **Filter settings**: Added a filter box to the settings page that allows you to find settings by keyword or category. To use it, simply click on the Search button in the top right corner of the settings page, or use the standard keyboard shortcut for search (Ctrl+F or Cmd+F).
- ✨ **Background Music Overlap Warning**: Added a warning notification when media is started while background music is playing. Users can choose to stop the background music from the notification.

## v26.6.0

### ✨ Nieuwe functies

- ✨ **Timer**: Added analog display modes and timing report status.
- ✨ **Profiles**: Added profile settings import and export in Advanced settings and the Setup Wizard.
- ✨ **Media Window**: Added support for automatically hiding the media window after playback when it was initially hidden. This is practical when a remote speaker wants to display images, for example.

## v26.5.0

### ✨ Nieuwe functies

- ✨ **PDF Import**: Added a new PDF import flow to the Publication Media dialog, allowing the PDF version of a publication to be automatically imported as individual images when desired.

## v26.4.8

### ✨ Nieuwe functies

- ✨ **JW Stream**: Added JW Stream to the list of websites that can be mirrored.

## v26.4.0

### ✨ Nieuwe functies

- ✨ **Meeting Timer**: A new meeting timer feature has been added. It is optional and can be enabled in the advanced settings, if desired. The timer can be used to allow the media operator to keep track of the time spent on meeting parts, or to display the time spent on the current meeting part on a dedicated screen visible only to the speaker.

## v26.3.0

### ✨ Nieuwe functies

- ✨ **Memorial Media**: Automatic Memorial media retrieval is now out of beta! The app will automatically download the Memorial Welcome Video and image to display during the Memorial, when available in the configured language.
- ✨ **Playback Speed**: Added playback speed control with visual indicator, and manual reset. This feature is only visible if enabled in the advanced settings.
- ✨ **Pinyin Songs**: Added a toggle for pinyin song substitution for meetings held in Chinese.

## v26.2.0

### ✨ Nieuwe functies

- ✨ **Controle op schijfruimte**: Functionaliteit toegevoegd om te controleren op weinig schijfruimte en een melding te geven.

## v26.1.5

### ✨ Nieuwe functies

- ✨ **Avondmaalsmedia**: Haalt automatisch de Avondmaalsbanner en introductievideo op in ondersteunde talen wanneer de Avondmaalsdatum is geselecteerd.

## v26.1.0

### ✨ Nieuwe functies

- ✨ **Automatische synchronisatie van vergaderschema**: Mogelijkheid toegevoegd om vergaderdata en -tijden automatisch te synchroniseren met de officiële website. Deze functie staat standaard aan en kan handmatig worden uitgevoerd of uitgeschakeld in de geavanceerde instellingen.
- ✨ **Toekomstige schemawijzigingen**: De app neemt nu ook toekomstige schemawijzigingen mee bij het aanmaken van een gemeente via de website-zoekfunctie, indien beschikbaar.
- ✨ **Gedeelde cache voor systeembrede installaties**: Systeembrede installaties delen nu standaard één gemeenschappelijke gegevensmap, wat opslag- en bandbreedtegebruik optimaliseert voor meerdere gebruikers op dezelfde computer.

## v25.12.2

### ✨ Nieuwe functies

- ✨ **Zoom-/pan-knoppen**: Mogelijkheid toegevoegd om zoom- en pan-knoppen ingedrukt te houden voor continue aanpassing.

## v25.12.0

### ✨ Nieuwe functies

- ✨ **Contextmenu met meervoudige selectie**: Ondersteuning toegevoegd voor rechtermuisknopacties wanneer meerdere media-items zijn geselecteerd.
- ✨ **Sneltoetsen**: `Ctrl/Cmd+A` toegevoegd om alle media te selecteren, `H` om geselecteerde media te verbergen en `Shift+Omhoog/Omlaag` voor toetsenbordnavigatie in selecties.
- ✨ **Instelling voor video's van Wachttoren-studie**: Instelling toegevoegd om extra video's van de Wachttoren-studie uit te sluiten.
- ✨ **Inklapbare secties**: Mogelijkheid toegevoegd om secties in te klappen op dagen zonder vergadering voor een overzichtelijkere weergave.
- ✨ **JW Events-website**: Mogelijkheid toegevoegd om naast de hoofdwebsite ook de JW Events-website te presenteren.
- ✨ **Aanpasbare afspeellijstimport**: Mogelijkheid toegevoegd om het voorvoegsel aan te passen dat wordt toegevoegd aan media-items bij het importeren van JW-afspeellijsten.
- ✨ **Navigatie na websiteweergave**: Schakelaar toegevoegd om automatisch naar de medialijst te gaan nadat websiteweergave is gestopt.
- ✨ **OBS-opnamebediening**: Mogelijkheid toegevoegd om OBS-opnames te bedienen.
- ✨ **Jaartekstvoorvertoning**: Mogelijkheid toegevoegd om vanaf december alvast de jaartekst van het volgende jaar te bekijken.
- ✨ **Updatemeldingen**: Waarschuwingsmeldingen toegevoegd voor bètaversies of uitgeschakelde updates, en de voortgangsweergave van updates is verbeterd.
- ✨ **Instellingen voor hardwareversnelling**: Optie toegevoegd om hardwareversnelling permanent uit te schakelen indien nodig.

## v25.11.0

### ✨ Nieuwe functies

- ✨ **JWPUB-mediaselectie**: Mogelijkheid toegevoegd om individuele media uit JWPUB-bestanden te selecteren.
- ✨ **Automatische focus op mediavenster**: Optionele instelling toegevoegd om het mediavenster automatisch te focussen na Zoom-schermdeling.
- ✨ **Cursor Overlay for TV Display**: Enhanced website window cursor overlay for better visibility of the mouse cursor on TV displays.
- ✨ **Vergaderopname**: Nieuwe functie toegevoegd om een externe opname-app te bedienen.
- ✨ **Zoeken op website**: Mogelijkheid toegevoegd om met slim zoeken media of publicaties op de website te vinden.
- ✨ **Eenvoudige handmatige publicatie-import**: Functionaliteit toegevoegd om publicaties van JW.org eenvoudig te importeren, zoals tijdschriften, boeken, programma's en uitnodigingen.
- ✨ **Verbeteringen voor gebarentaal**: Bevestiging toegevoegd vóór het afspelen van volledige bestanden in gebarentaal en ondersteuning voor het selecteren van meerdere clips, bijvoorbeeld wanneer meerdere alinea's achter elkaar gelezen moeten worden.
- ✨ **Clipnavigatie**: Weergave van duur toegevoegd aan clips in de lijst en de clipnavigatie verbeterd.
- 🛠️ **Media Display**: Ensured media display becomes visible when playback starts, even if it was hidden before.

## v25.10.1

### ✨ Nieuwe functies

- ✨ **Installatiewizard – Zoom-stap**: Een Zoom-integratiestap toegevoegd aan de installatiewizard voor eenvoudiger eerste configuratie.
- ✨ **Verbeterde schermkiezer**: Toont in de weergavepopup een nauwkeurige visuele weergave van alle schermen, inclusief de huidige grootte en locatie van het hoofdvenster. Hierdoor kun je gemakkelijker het juiste scherm kiezen voor het mediavenster.
- ✨ **Voorkeurscherm voor mediavenster**: De app onthoudt nu het voorkeurscherm waarop het mediavenster moet worden weergegeven, als de gebruiker dit heeft ingesteld.

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
- ✨ **Music Auto-Stop**: Optimized the behavior of the background music auto-stop to behave the same whether music was auto-started or not
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

## v25.7.0

### ✨ Nieuwe functies

- No new features for this release!

## 25.6.0

### ✨ Nieuwe functies

- ✨ **Betaalde verbindingsinstelling**: Een nieuwe instelling toegevoegd om het gebruik van de downloadbandbreedte voor datalimiet te verminderen.
- ✨ **Verbeterde streaming van media**: Betere ondersteuning voor het streamen van media, minder problemen in verband met vertraging.

## 25.5.0

### ✨ Nieuwe functies

- 🖼️ **OBS Vertraging optie voor Afbeeldingen**: Voeg een OBS Studio instelling toe om scène wijzigingen te vertragen bij het weergeven van afbeeldingen, waardoor overgangen worden verbeterd.
- 🔊 **Ondersteuning voor `.m4a` Audio Formaat**: Voeg compatibiliteit toe voor `.m4a` audio bestanden om ondersteunde media types uit te breiden.

## 25.4.0

### ✨ Nieuwe functies

- 🇵🇭 **Nieuwe taal: Tagalog**: Ondersteuning toegevoegd voor Tagalog, waardoor de meertalige mogelijkheden van de app worden uitgebreid.
- 🎞️ **Ondersteuning voor `.m4v` Video Formaat**: Ondersteuning voor het afspelen van `.m4v` bestanden om de compatibiliteit met de media te verbeteren.

## 25.3.1

### ✨ Nieuwe functies

- 🌏 **Nieuwe Taal: Koreaans**: Ondersteun de Koreaanse taal, waardoor de toegankelijkheid voor meer gebruikers toeneemt.

## 25.3.0

### ✨ Nieuwe functies

- 🎵 **Speel achtergrondmuziek af met video's**: Toestaan dat achtergrondmuziek blijft afspelen terwijl video's worden bekeken.
- 🎥 **Camera stream voor gebarentaal**: Voeg de mogelijkheid toe om een camera stream in het mediavenster weer te geven, specifiek voor gebarentaal gebruikers.
- 📅 **Automatische Avondmaal datum & achtergrond**: Automatisch detecteren en instellen van de datum en klaarzetten van de achtergrondafbeelding voor het Avondmaal.
- 📜 **Laat release-notities in de app zien**: Laat release-notities direct in de app zien, zodat gebruikers wijzigingen gemakkelijk kunnen inzien na een update.

## 25.2.1

### ✨ Nieuwe functies

- 🔄 **Allow OBS Reconnection Attempts**: Introduce the possibility to manually force OBS to reconnect when needed.
- 🗑 **Auto Cleanup Old Export Date Folders**: Automatically remove outdated export date folders to keep storage organized.

## 25.2.0

### ✨ Nieuwe functies

- 🌍 **Use System Locale by Default**: Automatically detect and use the system's locale for a more personalized experience.
- 🏷 **Tag Support for Exported Media**: Add metadata tags to exported media files for better organization.
- 🔄 **Automatic Beta to Stable Downgrade**: Allow automatic downgrades from beta versions to stable releases when necessary.
- 🌐 **Extract Latest MEPS Language Indexes**: Fetch the most recent MEPS language indexes directly from the official website, ensuring up-to-date language support.

## 25.1.0

### ✨ Nieuwe functies

- 📅 **Open Previous Dates**: Allow opening previous dates of the current week, which is useful when the meeting day is moved later in the week.
- 🛑 **Error Banner for OBS Studio**: Add an error banner when OBS Studio is not connected on a meeting day, ensuring users are alerted.
- 📚 **Group Media by Publication**: Group media from the same referred publication for a cleaner and more organized media overview.
- 🎵 **Duplicate Song Warning**: Show a warning if songs are listed more than once in the media list for weekend meetings.
- 🔄 **Future Schedule Planning**: Enable the planning of future meeting schedule changes, which is useful for yearly schedule changes or for the circuit overseer's visit to a neighboring congregation.

## 24.11.0

### ✨ Nieuwe functies

- **feat**: Presenting the website is now supported on macOS 🚀
- **feat**: Introduced keyboard shortcuts for stopping, pausing, and resuming media playback 🚀
- **feat**: Added support for setting the web address from which media should be downloaded 🚀
- **feat**: Added OBS Studio instant scene picker and overhauled scene picker functionality in settings
- **feat**: Expanded documentation website to support more languages

## 24.10.10

### ✨ Nieuwe functies

- **new**: Added keyboard shortcuts to navigate to the next/previous media item
- **new**: Added a right-click menu to media items to hide media items and rename them
- **new**: Trimmed video times are now respected in imported JWL playlists

## 24.10.9

### ✨ Nieuwe functies

- **feat**: Added an option to delete all extra media files for the currently selected day
