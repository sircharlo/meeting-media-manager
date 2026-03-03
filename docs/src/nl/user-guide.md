# User Guide {#user-guide}

Deze uitgebreide gebruikershandleiding helpt je om alle functies van M³ onder de knie te krijgen, van de basisinstallatie tot geavanceerde technieken voor mediapresentatie.

## Getting Started {#getting-started}

### Downloaden en installeren {#download-and-install}

Download de nieuwste versie van de [downloadpagina](download). Deze beveelt de beste build aan voor jouw apparaat en toont de laatste versie.

### De eerste keer opstarten {#first-launch}

Wanneer je M³ voor de eerste keer opstart, word je door een installatiewizard geleid die de essentiële instellingen voor je gemeente configureert:

1. **Kies de taal van de interface** — Dit bepaalt in welke taal de menu's en knoppen van M³ worden weergegeven
2. **Selecteer het profieltype** — Kies "Regulier" voor normaal gemeentegebruik of "Overig" voor speciale evenementen
3. **Configureer de gemeentegegevens** — Voer je gemeentegegevens in of gebruik de automatische zoekfunctie
4. **Stel het vergaderschema in** — Configureer de tijden van je doordeweekse en weekendvergaderingen
5. **Optionele functies** — Configureer de OBS-integratie, achtergrondmuziek en andere geavanceerde functies

:::tip Tip

Neem de tijd tijdens de installatie — je kunt deze instellingen later altijd wijzigen in het menu Instellingen.

:::

### Overzicht van de hoofdinterface {#main-interface}

De hoofdinterface van M³ bestaat uit een aantal belangrijke onderdelen:

- **Navigatiemenu** — Toegang tot verschillende secties en instellingen
- **Kalenderweergave** — Doorzoek media op datum
- **Medialijst** — Bekijk en beheer media voor geselecteerde datums
- **Werkbalk** — Sneltoegang tot veelgebruikte functies
- **Statusbalk** — Toont de voortgang van downloads, en de status van achtergrondmuziek en de verbinding met OBS Studio

## Media Management {#user-guide-media-management}

### De kalenderweergave begrijpen {#calendar-view}

De kalenderweergave toont je vergaderschema en de beschikbare media:

- **Vergaderdagen** — Gemarkeerde dagen laten zien wanneer er vergaderingen gepland zijn
- **Media-indicatoren** — Pictogrammen laten zien welke soorten media beschikbaar zijn
- **Datumnavigatie** — Gebruik de pijltjestoetsen om tussen maanden te navigeren

### Media organiseren {#organizing-media}

M³ organiseert media automatisch per vergadertype en sectie:

- **Vergadersecties** — Media is gegroepeerd per vergaderonderdeel (Openbare toespraak, Schatten uit Gods Woord, enz.)
- **Aangepaste secties** — Je kunt aangepaste secties maken voor extra media als er op die specifieke dag geen vergadering gepland is

## Media Presentation {#media-presentation}

### De mediaspeler openen {#opening-media-player}

Om media te presenteren tijdens een vergadering:

1. Selecteer de datum en het media-item dat je wilt presenteren
2. Klik op de afspeelknop of gebruik de sneltoets
3. De media wordt afgespeeld in het mediavenster
4. Gebruik de knoppen om media af te spelen, te pauzeren of te navigeren door de media

### Bedieningselementen van de mediaspeler {#media-player-controls}

De mediaspeler biedt uitgebreide bedieningselementen:

- **Afspelen/Pauzeren** - Start of pauzeer het afspelen van media
- **Stop** - Stop het afspelen

<!-- - **Previous/Next** - Navigate between media items
- **Volume** - Adjust playback volume -->

<!-- - **Fullscreen** - Toggle fullscreen mode -->

- **Zoomen/Verschuiven** - Gebruik het muiswiel om te zoomen, sleep om te verschuiven (voor afbeeldingen)

### Advanced Presentation Features {#advanced-presentation}

#### Aangepaste timing {#custom-timing}

Stel aangepaste start- en eindtijden in voor media:

<!-- 1. Right-click on a media item
2. Select "Edit Timing" -->

1. Klik op de tijdsduur van een video linksboven op de miniatuur
2. Stel start- en eindtijden in
3. Sla je wijzigingen op

#### Zoomen en verschuiven {#zoom-pan}

Voor afbeeldingen en video's:

- **In-/uitzoomen** — Gebruik het muiswiel of de zoomknoppen op de miniatuur
- **Verschuiven (Pan)** — Klik op de miniatuur en sleep om de afbeelding te verplaatsen
- **Zoom herstellen** — Klik om terug te keren naar de oorspronkelijke grootte

#### Sneltoetsen {#user-guide-keyboard-shortcuts}

Configureer aangepaste sneltoetsen voor snelle toegang. Merk op dat er standaard geen sneltoetsen zijn ingesteld.

**Ingebouwde mediabediening** (wanneer het hoofdvenster actief is en de medialijst getoond wordt):

- **Tab/Shift+Tab** — Navigeren tussen media-items
- **Pijl omhoog/omlaag** — Navigeren tussen media-items
- **Spatiebalk** — Media afspelen/pauzeren
- **Escape** — Media stoppen

**Aanpasbare sneltoetsen** (indien ingeschakeld in de instellingen):

- **Mediavenster** — Mediavenster openen/sluiten
- **Vorige/Volgende media** — Navigeren tussen media-items
- **Pauzeren/Hervatten** — Het afspelen van media regelen
- **Media stoppen** — Het afspelen van media stoppen
- **Muziek in-/uitschakelen** — Achtergrondmuziek regelen

**Opmerking (\*):** Globale sneltoets - beschikbaar zelfs als de app niet gefocust is

## Achtergrondmuziek {#user-guide-background-music}

### Achtergrondmuziek instellen {#background-music-setup}

Achtergrondmuziek wordt automatisch afgespeeld vóór vergaderingen en stopt op het juiste moment:

1. **Muziek inschakelen** — Zet achtergrondmuziek aan in de instellingen
2. **Automatisch starten** — Muziek start automatisch wanneer M³ wordt opgestart, indien van toepassing
3. **Stoppen voor vergadering** — Muziek stopt automatisch vóór de begintijd van de vergadering
4. **Handmatige bediening** — Gebruik de muziekknop in de statusbalk om handmatig te starten/stoppen
5. **Herstarten** — Hervat de muziek na de vergadering met één klik

## Zoom-integratie {#user-guide-zoom-integration}

M³ kan worden geïntegreerd met Zoom voor automatisch schermdelen:

1. **Integratie inschakelen** — Zet Zoom-integratie aan in de instellingen
2. **Sneltoets configureren** — Stel de sneltoets voor schermdelen in die in Zoom is geconfigureerd. Zorg ervoor dat het selectievakje "globaal" is aangevinkt in Zoom.
3. **Automatische bediening** — M³ zal Zoom-schermdelen automatisch aan- of uitzetten wanneer dat nodig is
4. **Handmatig overrulen** — Je kunt schermdelen nog steeds handmatig bedienen in Zoom indien nodig

## OBS Studio-integratie {#user-guide-obs-integration}

### OBS-integratie instellen {#user-guide-obs-setup}

Om M³ met OBS Studio te gebruiken voor hybride vergaderingen:

1. **Installeer OBS Studio** - Download en installeer OBS Studio
2. **WebSocket inschakelen** - Installeer de WebSocket-plugin in OBS
3. **Configureer M³** - Voer de OBS-poort en het wachtwoord in de instellingen van M³ in
4. **Scènes instellen** - Maak scènes voor camera, media en andere inhoud
5. **Testen** - Controleer of het afspelen goed werkt

### Beheer van OBS-scènes {#obs-scene-management}

M³ schakelt automatisch tussen OBS-scènes tijdens presentaties:

- **Camerascène** - Toont het spreekgestoelte/camera-aanzicht
- **Mediascène** - Toont media-inhoud
- **Afbeeldingsscène** - Toont afbeeldingen (kan worden uitgesteld indien ingeschakeld)
- **Automatisch schakelen** - Scènes veranderen op basis van mediatype en instellingen

### Advanced OBS Features {#advanced-obs}

#### Afbeeldingen uitstellen {#user-guide-postpone-images}

Schakel deze optie in om het delen van afbeeldingen naar OBS uit te stellen tot het handmatig wordt geactiveerd:

1. Schakel "Afbeeldingen uitstellen" in bij de OBS-instellingen
2. Afbeeldingen worden pas gedeeld wanneer je op de knop klikt om ze te tonen met OBS Studio. Dit is handig om afbeeldingen eerst aan het aanwezige publiek te tonen.

#### Gedrag bij scènewisselingen {#user-guide-scene-switching}

Configureer hoe M³ scènewisselingen afhandelt:

- **Omschakelen na media** - Keer automatisch terug naar de vorige scène
- **Vorige scène onthouden** - Herstel de scène die actief was voor de media

### Audio Configuration for Hybrid Meetings {#audio-configuration}

When using M³ with OBS Studio for hybrid meetings (in-person + Zoom), you need to configure audio settings to ensure meeting participants can hear the media:

#### Zoom Audio Settings {#zoom-audio-settings}

**Before every meeting, you must enable Original Audio in Zoom:**

1. **Open Zoom** and go to Settings
2. **Navigate to Audio** → **Advanced**
3. **Enable "Show in-meeting option to 'Enable Original Sound'"**
4. **Check "Disable echo cancellation"** (first checkbox)
5. **Check "Disable noise suppression"** (second checkbox)
6. **Uncheck "Disable high-fidelity music mode"** (third checkbox)
7. **Before starting each meeting**, click the "Original Audio" button in the meeting controls

**Alternative: Share Computer Sound**
If Original Audio doesn't work well in your setup:

1. **Before playing media**, go to **Advanced** tab in Zoom screen sharing options
2. **Check "Share computer sound"**
3. **Note**: This option must be enabled every time you start a new Zoom session

**Best Alternative**: Consider using M³'s Zoom integration instead of OBS Studio, as it uses Zoom's native screen sharing which handles audio more seamlessly and doesn't require complex audio configuration.

#### Why Audio Configuration is Necessary {#why-audio-config}

M³ plays media with sound on your computer, but this audio is **not automatically transmitted** through the video stream to OBS Studio. This is the same behavior you would experience with any other media player.

**The audio issue is not related to M³** - it's a limitation of how OBS Studio video streaming works with Zoom. The video stream acts like a virtual camera without sound, just like a webcam, so you must explicitly configure Zoom to capture the computer's audio. This implies that your computer has two sound cards, and if this isn't the case, you probably won't be able to use the OBS Studio integration successfully.

**Alternative Solution**: Consider using the Zoom integration instead, as it uses Zoom's native screen and audio sharing, which handles audio more seamlessly.

#### Troubleshooting Audio Issues {#audio-troubleshooting}

**Common Problems:**

- **No audio in Zoom**: Check if Original Audio is enabled and properly configured
- **Poor audio quality**: Verify the three Original Audio checkboxes are set correctly
- **Audio not working after Zoom restart**: Original Audio settings must be re-enabled for each new Zoom session

**Best Practices:**

- Test audio configuration and sharing before meetings
- Create a checklist for audio setup
- Consider using "Share Computer Sound" as a backup option
- **Consider using Zoom integration instead of OBS Studio** for simpler audio handling
- Ensure all AV operators are familiar with these settings

## Media Import and Management {#media-import}

### Importing Custom Media {#importing-custom-media}

Add your own media files to M³:

1. **File Import** - Use the import button to add videos, images, or audio files
2. **Drag and Drop** - Drag files directly into M³
3. **Folder Monitoring** - Set up a watched folder for automatic imports
4. **JWPUB Files and Playlists** - Import publications and playlists
5. **Public Talk Media (S-34 / S-34mp)** - Importeer publieke praatmedia met behulp van S→34 of S## 34mp JWPUB bestanden

### Managing Imported Media {#managing-imported-media}

- **Organize by Date** - Assign imported media to specific dates
- **Custom Sections** - Create custom sections for organization
- **Edit Properties** - Modify titles, descriptions, and timing
- **Remove Media** - Delete unwanted media items

### Audio Bible Import {#audio-bible-import}

Import audio recordings of Bible verses:

1. Click the "Audio Bible" button
2. Select the Bible book and chapter
3. Specifieke verzen of versreeksen kunt kiezen
4. Download the audio files
5. Use them

## Folder Monitoring and Export {#user-guide-folder-monitoring}

### Setting Up Folder Monitoring {#folder-monitoring-setup}

Monitor a folder for new media files:

1. **Enable Folder Watcher** - Turn on folder monitoring in settings
2. **Select Folder** - Choose the folder to monitor
3. **Automatic Import** - New files are automatically added to M³
4. **Organization** - Files are organized by date based on folder structure

### Media Export {#user-guide-media-export}

Automatically export media to organized folders:

1. **Enable Auto-Export** - Turn on media export in settings
2. **Select Export Folder** - Choose where to save exported files
3. **Automatic Organization** - Files are organized by date and section
4. **Format Options** - Convert files to MP4 for better compatibility

## Website Presentation {#website-presentation}

### Presenting the Official Website {#presenting-the-website}

Share the official website on external displays:

1. **Open Website Mode** - Click the website presentation button
2. **External Display** - The website opens in a new window
3. **Navigation** - Use the browser controls to navigate

### Website Controls {#website-controls}

- **Navigation** - Standard browser navigation controls
- **Refresh** - Reload the current page
- **Close** - Exit website presentation mode

## Geavanceerde functies {#user-guide-advanced-features}

### Multiple Congregations {#user-guide-multiple-congregations}

Manage multiple congregations or groups:

1. **Create Profiles** - Set up separate profiles for different congregations
2. **Switch Profiles** - Use the congregation selector to switch between profiles
3. **Separate Settings** - Each profile has its own settings and media
4. **Shared Resources** - Media files are shared between profiles whenever possible

### Keyboard Shortcuts {#keyboard-shortcuts-guide}

Configure custom keyboard shortcuts for efficient operation:

1. **Enable Shortcuts** - Turn on keyboard shortcuts in settings
2. **Configure Shortcuts** - Set up shortcuts for common actions
3. **Practice** - Learn your shortcuts for faster operation
4. **Customize** - Adjust shortcuts to match your preferences

## Troubleshooting {#troubleshooting-guide}

### Common Issues {#common-issues}

#### Media Not Downloading {#user-guide-media-not-downloading}

- Check your meeting schedule settings
- Verify internet connection
- Check if media is available in your selected language

#### OBS Integration Not Working {#user-guide-obs-not-working}

- Verify OBS WebSocket plugin is installed
- Check port and password settings
- Ensure OBS is running

#### Audio Issues in Zoom/OBS {#audio-issues}

- **No audio in Zoom**: Enable Original Audio in Zoom settings and before each meeting
- **Poor audio quality**: Check the three Original Audio checkboxes (first two enabled, third disabled)
- **Audio not working after restart**: Original Audio must be re-enabled for each new Zoom session
- **Alternative solution**: Use "Share Computer Sound" option in Zoom screen sharing

#### Performance Issues {#user-guide-performance-issues}

- Enable extra cache
- Reduce maximum resolution
- Clear old cached files
- Check available disk space

#### Language Issues {#user-guide-language-issues}

- Check media language setting
- Ensure language is available on JW.org
- Try a fallback language
- Verify interface language setting

### Getting Help {#getting-help}

If you encounter issues:

1. **Check Documentation** - Review this guide and other available documentation
2. **Search Issues** - Look for similar issues on GitHub
3. **Report Problems** - Create a new issue with detailed information

## Best Practices {#best-practices}

### Before Meetings {#before-meetings}

1. **Check Downloads** - Ensure all media is downloaded
2. **Test Equipment** - Verify displays and audio work
3. **Prepare Media** - Review and organize media for the meeting; make sure no media files are missing
4. **Configure Audio** - For hybrid meetings, enable Original Audio in Zoom or set up "Share Computer Sound"

### During Meetings {#during-meetings}

1. **Stay Focused** - Use the clean and distraction-free interface
2. **Use Shortcuts** - Master keyboard shortcuts for smooth operation
3. **Monitor Audio** - Keep an eye on volume levels, if that's part of your responsibilities
4. **Be Prepared** - Have the next media item ready
5. **Verify Audio** - For hybrid meetings, ensure Zoom participants can hear the media

### After Meetings {#after-meetings}

1. **Start Background Music** - Start the playback of background music
2. **Plan Ahead** - Prepare for the next meeting by making sure everything is in place
3. **Clean Up** - Close media player when you're ready to leave

### Regular Maintenance {#regular-maintenance}

1. **Update M³** - Keep the application updated
2. **Clear Cache** - Periodically clear old cached files
3. **Check Settings** - Review and update settings as needed
