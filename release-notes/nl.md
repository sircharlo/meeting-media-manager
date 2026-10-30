<!-- markdownlint-disable no-duplicate-heading -->

# Wat is er nieuw

Voor de volledige lijst van wijzigingen tussen versies, zie ons CHANGELOG.md bestand op GitHub.

## AANKOMENDE VERSIE

### ✨ Nieuwe functies

- ✨ **Timer op afstand**: De timerpagina voor de tablet op de lessenaar heeft een optionele focusindeling, die je aanzet in Instellingen. Die toont de tijd in een grote voortgangsring die in de laatste minuut geel wordt en daarna rood met de hoeveelheid over tijd (+02:18), en toont ernaast de Zoom-deelnemers die hun hand hebben opgestoken, in de volgorde waarin ze dat deden: de eerste vier bij naam, met een telling van de rest. Elke nieuwe hand knippert drie seconden met "Hand opgestoken", en de lijst wordt bijgewerkt wanneer handen omhoog- en omlaaggaan. De huidige weergave blijft de standaard.

## v26.10.2

### ✨ Nieuwe functies

- ✨ **Functiesuggesties**: Af en toe stelt M³ een functie voor die een profiel nog niet gebruikt, in een kort venster "Wist je dat?" dat uitlegt wat de functie doet. Er wordt hoogstens één suggestie getoond telkens als een profiel wordt geopend, nooit vanaf 15 minuten voor een vergadering tot het einde ervan, en elk antwoord wordt onthouden: "Herinner mij later" zet een suggestie achteraan in de rij, "Nee, bedankt" verbergt die voorgoed, en "Geen functies meer voorstellen" zet ze voor het profiel allemaal uit. Een "Nee" in de installatiewizard telt ook mee, en de antwoorden kunnen worden gereset in Instellingen, onder Geavanceerd.
- ✨ **Zoom-vergaderbeheerder (bèta, Windows)**: M³ kan nu zijn eigen venster en het vergadervenster van Zoom op je schermen schikken. Twee nieuwe stappen in de configuratieassistent van Zoom vragen waar de Zoom-vergadering moet komen. Op een kaart van je schermen kies je het scherm voor Zoom (nooit het scherm dat het mediavenster vult) en of Zoom het voor zichzelf heeft of het deelt met M³. Daarna versleep je op een tekening van dat scherm in zijn echte vorm een scheidingslijn om het te verdelen tussen de twee vensters; die springt naar de gebruikelijke verhoudingen. Zodra de vergadering opent, opent M³ de deelnemerslijst van Zoom als je daarom hebt gevraagd, zet daarna beide vensters op hun plek en houdt Zoom vanaf dan daar: als Zoom zijn venster uit zichzelf verplaatst of van grootte verandert (na schermdeling, of als de deelnemerslijst opent of sluit), zet M³ het terug, terwijl een venster dat je zelf verplaatst blijft waar je het neerzet tot de volgende vergadering. Elke keer dat M³ Zoom uit zichzelf verplaatst, laat een melding dat weten, en kun je het meteen stoppen, tot M³ opnieuw start of voorgoed. Terwijl Zoom het mediavenster deelt, waardoor het vergadervenster van Zoom verborgen is, opent M³ de deelnemerslijst van Zoom op die plek, zodat je blijft zien wie de hand opsteekt om commentaar te geven. Als "Meeting window view" in Zoom op "Dual window" staat ("Use dual monitors" in oudere versies van Zoom), gaat het tweede venster van Zoom schermvullend achter het mediavenster, dus als je het mediavenster verbergt, zie je het. M³ kan de twee vensters ook naast elkaar uitlijnen met de uitlijnfunctie van Windows zelf, zodat ze allebei van grootte veranderen als je de rand tussen ze versleept. Een knop "Vensters schikken" in het Zoom-pop-upvenster zet op elk moment alles terug op zijn plek, en de indeling kan later worden gewijzigd in Instellingen, onder Zoom-vergaderbeheerder. Die wordt per computer bewaard, omdat die van de schermen afhangt.

## v26.10.1

### ✨ Nieuwe functies

- ✨ **Zoom-vergaderbeheerder (bèta, Windows)**: Een nieuwe integratie die Zoom rond elke vergadering voor je bedient. Die kan de Zoom-vergadering van je gemeente starten wanneer de achtergrondmuziek vóór de vergadering begint. Wanneer de muziek vlak voor het begin van de vergadering stopt, verbindt de integratie met de computeraudio, heft het dempen van de microfoon op, zet de video van de host aan en dempt iedereen, zonder dat ze het dempen zelf kunnen opheffen. Wanneer er vóór of na een vergadering muziek speelt, doet de integratie het omgekeerde: de computeraudio wordt verbroken, de video van de host wordt uitgeschakeld en iedereen mag het dempen weer opheffen (met het verzoek dat ook te doen). Ook kan de integratie het mediavenster automatisch in Zoom delen terwijl er media wordt getoond, waarbij altijd het mediavenster wordt gedeeld en nooit iets anders op je scherm. Een nieuwe Zoom-knop op de actiebalk laat zien of er een venster van een Zoom-vergadering is gevonden, en laat je deze stappen handmatig uitvoeren. Een configuratieassistent, die wordt aangeboden als je de optie inschakelt (de installatiewizard biedt die op Windows nu aan in plaats van scherm delen via een sneltoets) en altijd beschikbaar is via de Zoom-knop of Instellingen, controleert je Zoom, leert de namen van de microfoon- en cameraknoppen in jouw taal en probeert elke stap samen met je uit. Bij het starten van M³ wordt ook gecontroleerd of alles wat in Zoom wordt geautomatiseerd werkt, waarbij de vergadering op vergaderdagen zo nodig wordt geopend in de vijf kwartier voordat die begint (er wordt alleen gekeken, zonder iets aan te klikken, als anderen al in de vergadering zijn); als iets niet werkt, laat M³ dat weten en pauzeert het de Zoom-automatiseringen tot M³ opnieuw is gestart of een nieuwe controle slaagt, zodat er tijdens de vergadering niets misgaat. Deze controle staat standaard aan en kan in Instellingen worden uitgeschakeld. Telkens als een van deze stappen slaagt, worden de bijbehorende herinneringen in de checklists vóór en na de vergadering van de snelle acties voor vergaderingen voor je afgevinkt, met de markering dat ze automatisch in Zoom zijn uitgevoerd. Omdat de integratie niet samen met scherm delen via een sneltoets kan worden gebruikt, staat dat in Instellingen vermeld bij de optie die niet beschikbaar is, met de naam van de optie die je moet uitschakelen. De integratie werkt in elke taal van Zoom en vereist niets anders dan Zoom zelf.

- ✨ **Vergadertimer**: Aangepaste onderdelen kunnen nu ook op vergaderdagen worden toegevoegd, voor updates van het Besturende Lichaam, speciale programma's en alles wat niet op het gewone schema staat. Elk ervan wordt getimed zoals elk ander onderdeel, en de naam en lengte kunnen worden gewijzigd vanuit het pop-upvenster van de timer of de lijst met onderdelen.

- ✨ **Vergadertimer**: Snellere toegang tot de timer. Als je de muisaanwijzer op de timerknop op de actiebalk houdt, zie je nu het onderdeel dat getimed wordt, met de knoppen Starten, Pauzeren, Stop en Volgend onderdeel, zonder het pop-upvenster te openen (een instelling die standaard aan staat). Met een nieuwe instelling blijven de hele lijst met onderdelen en de timerbediening bovendien altijd in beeld, in een paneel dat rechts in het hoofdvenster is vastgezet.

- ✨ **Vergadertimer**: Een nieuwe aftelweergave "Analoge klok met tijdboog" toont de resterende tijd van een onderdeel als een taartpunt op een analoge wijzerplaat, van de minutenwijzer tot het geplande einde, zodat je in één oogopslag zowel de huidige tijd als de resterende tijd ziet. Overschrijding wordt als een rode taartpunt getoond. Dit werkt ook voor het aftellen vóór de vergadering en in optelmodus.

- ✨ **Vergadertimer**: Het aftellen vóór de vergadering heeft nu het label "De vergadering begint over", en de timerweergave toont de naam van het onderdeel dat getimed wordt, zodat "4:59" niet meer voor de huidige tijd kan worden aangezien.

- ✨ **Vergadertimer**: De geregistreerde tijden van een dag kunnen na bevestiging in één keer worden gewist vanuit het pop-upvenster van de timer of het vastgezette paneel.

- ✨ **Zoom-vergaderbeheerder (bèta, Windows)**: Een nieuwe hulp bij opgestoken handen. Tijdens een vergadering houdt M³ de deelnemerslijst van Zoom in de gaten voor opgestoken handen. Als iemand de hand opsteekt, kan de bediener via een melding in M³ met één klik het dempen van die deelnemer opheffen, en als die klaar is met spreken, met nog een klik de deelnemer weer dempen en de hand laten zakken; de Zoom-knop op de actiebalk toont de opgestoken handen met dezelfde knoppen. Elke actie gaat naar de eigen rij van die deelnemer in Zoom, op basis van de exacte naam, en M³ doet niets als twee deelnemers dezelfde naam hebben. Als de vergadertimer is ingeschakeld, verschijnt er voor de voorzitter ook een grote hand met de naam van de deelnemer op de timerweergave, die ook zelf kan worden ingeschakeld vanuit de pop-upvensters van de timer of Zoom. M³ leert met één knop hoe Zoom opgestoken handen in jouw taal aangeeft (je eigen hand wordt daarbij opgestoken en weer neergelaten), en die stap wordt ook in de configuratieassistent aangeboden.

- ✨ **Vergadertimer**: Een nieuwe, optionele timer op afstand. Als die is ingeschakeld, biedt M³ een alleen-lezen kopie van de timerweergave aan als webpagina op het lokale netwerk, zodat een tablet of telefoon bij het spreekgestoelte de spreker de resterende tijd kan laten zien zonder dat die op het scherm van de gemeente of in een gedeeld Zoom-scherm te zien is. De pagina volgt de timer in realtime (onderdelen, aftellen vóór de vergadering, klok, kleuren voor overschrijding, handsignaal) en alle bediening blijft in M³. De adressen die je moet openen, worden getoond in het pop-upvenster van de timer, met een kopieerknop.

- ✨ **Installatiewizard**: De installatiewizard vraagt nu of je bestanden voor vergaderingen bewaart in een cloudopslag-app zoals Dropbox, OneDrive, iCloud Drive of Google Drive. Is dat zo, dan helpt de wizard je daar een gedeelde map te kiezen en laat hij zien hoe het werkt: M³ maakt een map aan voor elke komende vergadering, met de datum van de vergadering als naam, en de bestanden die je erin zet, worden automatisch aan die vergadering toegevoegd, op elke computer die de map gebruikt.

## v26.9.0

### ✨ Nieuwe functies

- ✨ **Snelle acties vóór en na de vergadering**: Een nieuw paneel met grote knoppen helpt bij de aanloop naar elke vergadering en direct daarna — met een live aftelling, achtergrondmuziek starten/stoppen met één tik, opname starten/stoppen, en een checklist per gemeente, ingedeeld in categorieën en te bewerken via Instellingen. Het paneel vóór de vergadering verdwijnt automatisch zodra de vergadering begint en de checklist is afgerond (of na een korte wachttijd), en kan altijd handmatig worden gesloten.

## v26.8.0

### ✨ Nieuwe functies

- ✨ **Vernieuwd ontwerp van de hele app**: Een brede visuele en interactieve vernieuwing van de dialoogvensters, de medialijst en de koptekst, de instellingen en de installatiewizard. De installatiewizard stelt nu één vraag per scherm, met een voortgangsbalk. Alle prompts zijn vervangen door een consistent dialoogvenster in de huisstijl, en voor het kiezen van paginabereiken in PDF's (bij het importeren van publicaties en bij slepen en neerzetten) wordt nu een kiezer met miniaturen gebruikt in plaats van een invoerveld voor vrije tekst. Nieuwe rondleiding als snelstartgids toegevoegd, die start nadat de installatiewizard is voltooid. Bevat ook een vernieuwde stijl voor kaarten en kopteksten met schaduwen die zich aanpassen aan de donkere modus, en diverse contrastverbeteringen in de donkere modus (labels van actieve velden, percentages van de downloadvoortgang).
- ✨ **Instellingenpagina**: Omgebouwd tot een indeling met twee panelen, met een nieuwe sectie Algemene voorkeuren voor de schakelaars voor automatische updates en bèta-updates, die zijn verplaatst uit het venster Over deze app (dat nu alleen nog informatie geeft).
- ✨ **Knop "Meer media toevoegen"**: Instelling toegevoegd om precies te kiezen welke vergadersecties de snelknop "Meer media toevoegen" tonen, plus een instelling voor een compacte modus (alleen een pictogram).
- ✨ **Medialijst**: Items tonen nu een laadweergave terwijl ze worden toegevoegd, in plaats van leeg te lijken; mediagroepen tonen het aantal verborgen items in hun badge (bijv. "9 items (2 verborgen)"); items binnen een groep kunnen met slepen en neerzetten van volgorde worden veranderd; en bij heel smalle vensters worden items samengevouwen tot compacte chips met tooltip, in plaats van de rij te overvullen.

## v26.7.7

### ✨ Nieuwe functies

- ✨ **Kwaliteit van het mediavoorbeeld**: Het mediavoorbeeld geeft videobeelden nu weer via canvas met hoogwaardige verkleining, waardoor gekartelde of wazige voorbeelden verholpen zijn (vooral bij inhoud met veel tekst, zoals liederen). Het voorbeeld schakelt zichzelf ook automatisch uit als het bij één video herhaaldelijk een afwijking in het afspelen moet corrigeren; met één klik zet je het weer aan.

## v26.7.6

### ✨ Nieuwe functies

- ✨ **Video's uitsluiten bij de Gemeentebijbelstudie**: Instelling toegevoegd om video's uit specifieke publicaties uit te sluiten bij de Gemeentebijbelstudie (standaard het boek **Wees moedig en vertrouw op Jehovah**), met een doorzoekbare publicatiekiezer.
- ✨ **Paginanummers van documenten**: In de lijsten van Publicatiemedia en JWPUB-import staat nu na de titel het paginanummer van elk document (of de paginanummers als er meerdere pagina's zijn). Zo kun je specifieke media snel vinden als je weet op welke pagina ze staan.

## v26.7.4

### ✨ Nieuwe functies

- ✨ **Herstel van ontbrekende media**: Media-items waarvan het lokale bestand ontbreekt (bijv. verwijderd door het automatisch wissen van de cache of handmatig verwijderd), tonen nu een uitgeschakelde afspeelknop, een bijschrift "ontbreekt" met de naam van het bestand dat je moet zoeken, en een nieuwe actie "Bestand zoeken" om het item opnieuw aan een bestand op de schijf te koppelen.
- ✨ **Compatibiliteitswaarschuwing**: Sluitbare banner toegevoegd die gebruikers van binnenkort niet meer ondersteunde combinaties van besturingssysteem en architectuur (macOS 12 Monterey en 32-bits Windows) waarschuwt om te upgraden voordat toekomstige app-updates een nieuwer systeem vereisen.

## v26.7.0

### ✨ Nieuwe functies

- ✨ **Gekoppeld audio afspelen**: Ondersteuning toegevoegd om audio uit het ene bestand samen met video uit een ander bestand af te spelen. Dit kan handig zijn om diavoorstellingen op video met begeleidende muziek af te spelen.
- ✨ **Indeling van media uit de gedeelde map**: De volgorde van media-items en secties uit gedeelde mappen blijft nu bewaard. Zo wordt de medialijst op dezelfde manier weergegeven, zelfs als de gedeelde map tussen apparaten wordt gesynchroniseerd.

## v26.6.1

### ✨ Nieuwe functies

- ✨ **Mediavoorbeeld**: Live mediavoorbeeld toegevoegd dat je kunt in- of uitschakelen via de instellingen of het pop-upvenster voor de mediaweergave.
- ✨ **Media zoeken**: Zoekvak toegevoegd in de medialijst waarmee je media snel op titel kunt vinden. Gebruik daarvoor gewoon de standaardsneltoets voor zoeken (Ctrl+F of Cmd+F).
- ✨ **Instellingen filteren**: Filtervak toegevoegd op de instellingenpagina waarmee je instellingen op trefwoord of categorie kunt vinden. Klik daarvoor op de knop Zoeken in de rechterbovenhoek van de instellingenpagina, of gebruik de standaardsneltoets voor zoeken (Ctrl+F of Cmd+F).
- ✨ **Waarschuwing bij overlap met achtergrondmuziek**: Er verschijnt een waarschuwing als media wordt gestart terwijl er achtergrondmuziek speelt. Gebruikers kunnen de achtergrondmuziek vanuit de melding stoppen.

## v26.6.0

### ✨ Nieuwe functies

- ✨ **Timer**: Analoge weergavemodi en status in het tijdrapport toegevoegd.
- ✨ **Profielen**: Importeren en exporteren van profielinstellingen toegevoegd in de geavanceerde instellingen en de installatiewizard.
- ✨ **Mediavenster**: Ondersteuning toegevoegd om het mediavenster na het afspelen automatisch te verbergen als het eerst verborgen was. Dat is praktisch wanneer een externe spreker bijvoorbeeld afbeeldingen wil laten zien.

## v26.5.0

### ✨ Nieuwe functies

- ✨ **PDF importeren**: Nieuwe manier toegevoegd om PDF's te importeren in het dialoogvenster Publicatiemedia, zodat de PDF-versie van een publicatie desgewenst automatisch als afzonderlijke afbeeldingen kan worden geïmporteerd.

## v26.4.8

### ✨ Nieuwe functies

- ✨ **JW Stream**: JW Stream toegevoegd aan de lijst met websites die gepresenteerd kunnen worden.

## v26.4.0

### ✨ Nieuwe functies

- ✨ **Vergadertimer**: Er is een nieuwe vergadertimer toegevoegd. Deze functie is optioneel en kan desgewenst worden ingeschakeld in de geavanceerde instellingen. Met de timer kan de mediabediener de tijd van vergaderonderdelen bijhouden, of kan de tijd van het huidige onderdeel worden getoond op een apart scherm dat alleen de spreker ziet.

## v26.3.0

### ✨ Nieuwe functies

- ✨ **Media voor de Herdenking**: Het automatisch ophalen van media voor de Herdenking is nu uit de bètafase! De app downloadt automatisch de welkomstvideo voor de Herdenking en de afbeelding die tijdens de Herdenking wordt getoond, als die beschikbaar zijn in de ingestelde taal.
- ✨ **Afspeelsnelheid**: Snelheidsregeling voor afspelen met visuele indicator en handmatige reset toegevoegd. Deze functie is alleen zichtbaar als deze is ingeschakeld in de geavanceerde instellingen.
- ✨ **Pinyin-liederen**: Schakelaar toegevoegd om liederen te vervangen door pinyinversies bij vergaderingen in het Chinees.

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
- ✨ **Cursoroverlay voor tv-schermen**: Cursoroverlay in het websitevenster verbeterd, zodat de muisaanwijzer beter zichtbaar is op tv-schermen.
- ✨ **Vergaderopname**: Nieuwe functie toegevoegd om een externe opname-app te bedienen.
- ✨ **Zoeken op website**: Mogelijkheid toegevoegd om met slim zoeken media of publicaties op de website te vinden.
- ✨ **Eenvoudig publicaties handmatig importeren**: Functionaliteit toegevoegd om eenvoudig publicaties van de officiële website te importeren, zoals tijdschriften, boeken, programma's en uitnodigingen.
- ✨ **Verbeteringen voor gebarentaal**: Bevestiging toegevoegd vóór het afspelen van volledige bestanden in gebarentaal en ondersteuning voor het selecteren van meerdere clips, bijvoorbeeld wanneer meerdere alinea's achter elkaar gelezen moeten worden.
- ✨ **Clipnavigatie**: Weergave van duur toegevoegd aan clips in de lijst en de clipnavigatie verbeterd.
- 🛠️ **Mediaweergave**: Zorgt ervoor dat het mediavenster zichtbaar wordt zodra het afspelen begint, zelfs als het eerder verborgen was.

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
- ✨ **Muziek automatisch stoppen**: Het automatisch stoppen van de achtergrondmuziek werkt nu hetzelfde, of de muziek nu automatisch is gestart of niet
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

- Geen nieuwe functies voor deze release!

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

- 🔄 **Opnieuw verbinden met OBS**: Mogelijkheid toegevoegd om OBS handmatig opnieuw verbinding te laten maken wanneer dat nodig is.
- 🗑 **Oude exportmappen automatisch opruimen**: Verouderde exportmappen per datum worden automatisch verwijderd om de opslag overzichtelijk te houden.

## 25.2.0

### ✨ Nieuwe functies

- 🌍 **Standaard de systeemtaal gebruiken**: De landinstelling van het systeem wordt automatisch gedetecteerd en gebruikt voor een persoonlijkere ervaring.
- 🏷 **Tags voor geëxporteerde media**: Metadatatags toegevoegd aan geëxporteerde mediabestanden voor een betere organisatie.
- 🔄 **Automatisch terug van bèta naar stabiel**: Automatisch terugschakelen van bètaversies naar stabiele versies toegestaan wanneer dat nodig is.
- 🌐 **Nieuwste MEPS-taalindexen ophalen**: De meest recente MEPS-taalindexen worden rechtstreeks van de officiële website opgehaald, zodat de taalondersteuning altijd actueel is.

## 25.1.0

### ✨ Nieuwe functies

- 📅 **Eerdere datums openen**: Eerdere datums van de huidige week kunnen nu worden geopend, wat handig is als de vergaderdag later in de week wordt verplaatst.
- 🛑 **Foutmelding voor OBS Studio**: Er verschijnt een foutbanner als OBS Studio op een vergaderdag niet verbonden is, zodat gebruikers gewaarschuwd worden.
- 📚 **Media groeperen per publicatie**: Media uit dezelfde publicatie waarnaar verwezen wordt, worden gegroepeerd voor een overzichtelijker mediaoverzicht.
- 🎵 **Waarschuwing voor dubbele liederen**: Er wordt een waarschuwing getoond als liederen meer dan één keer in de medialijst van de weekendvergadering staan.
- 🔄 **Toekomstige schemawijzigingen plannen**: Toekomstige wijzigingen in het vergaderschema kunnen nu worden gepland, wat handig is voor jaarlijkse schemawijzigingen of voor het bezoek van de kringopziener aan een naburige gemeente.

## 24.11.0

### ✨ Nieuwe functies

- 🖥️ **Website presenteren op macOS**: Het presenteren van de website wordt nu ondersteund op macOS 🚀
- ⌨️ **Sneltoetsen voor afspelen**: Sneltoetsen toegevoegd om het afspelen van media te stoppen, te pauzeren en te hervatten 🚀
- 🌐 **Aangepast downloadadres voor media**: Ondersteuning toegevoegd om het webadres in te stellen waarvandaan media wordt gedownload 🚀
- 🎬 **Directe scènewisselaar voor OBS**: Directe scènewisselaar voor OBS Studio toegevoegd en de scènekiezer in de instellingen vernieuwd
- 📖 **Meer talen voor de documentatie**: De documentatiewebsite ondersteunt nu meer talen

## 24.10.10

### ✨ Nieuwe functies

- ⌨️ **Sneltoetsen voor medianavigatie**: Sneltoetsen toegevoegd om naar het volgende/vorige media-item te gaan
- 🖱️ **Contextmenu voor media-items**: Contextmenu (rechtermuisknop) toegevoegd aan media-items om ze te verbergen en een andere naam te geven
- ✂️ **Ingekorte JWL-afspeellijsten importeren**: Ingekorte videotijden worden nu gerespecteerd in geïmporteerde JWL-afspeellijsten

## 24.10.9

### ✨ Nieuwe functies

- 🗑️ **Extra media van een dag verwijderen**: Optie toegevoegd om alle extra mediabestanden van de geselecteerde dag te verwijderen
