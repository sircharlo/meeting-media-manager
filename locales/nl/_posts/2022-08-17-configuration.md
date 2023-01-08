---
tag: Configuratie
title: Instellingen
ref: configuration
---

Het instellingen scherm is verdeeld in 4 secties. De meeste opties spreken voor zich, maar hier zijn wat extra details.

### Applicatie setup

| Instelling | Uitleg |
| ------- | ----------- |
| `Applicatie taal` | De taal waarin M³ wordt weergegeven. <br><br> Alle vrijwilliger, enorm bedankt voor het vertalen van deze app in zo veel talen! Als je wilt meehelpen aan het verbeteren van een bestaande vertaling of een nieuwe taal wilt toevoegen, open dan alsjeblieft een nieuwe ["discussion"]({{site.github}}/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M%C2%B3+into+a+language+I+speak,+LANGUAGE). |
| `Folder waar de media wordt opgeslagen` | Media voor de vergaderingen wordt in deze folder opgeslagen voor later gebruik. |
| `Start de app bij systeem opstarten` | Als deze optie aan staat, zal M³ automatisch opstarten zodra de huidige gebruiker inlogt op de computer. <br><br> _**Let op:** Niet beschikbaar voor Linux._ |
| `Automatisch media syncen` | Als deze optie aan staat, zal M³ automatisch media gaan ophalen 5 seconden nadat de applicatie is opgestart. <br><br> _Om te voorkomen dat media wordt opgehaald kan je op de ⏸ (pauze) knop drukken voordat de 5-seconden timer om is._ |
| `Open folder na media sync` | Als deze optie aan staat, zal de folder waar media voor die week wordt opgeslagen automatisch geopend worden nadat de media sync klaar is. |
| `Sluit app na media sync` | Als deze optie aan staat, zal M³ 5 seconden na de media sync, zichzelf automatisch afsluiten. <br><br> _Om te voorkomen dat M³ zichzelf afsluit kan je de 🏃 (persoon aan het rennen) knop indrukken voordate de 5-seconden timer om is._ |
| `Zet OBS Studio integratie modus aan` | Als deze optie aan staat, zal M³ verbinding maken met OBS Studio om automatisch de scenes aan te passen voor en na het delen van media. <br><br> _Als je deze optie wilt gebruiken, moet je zorgen dat OBS Studio gebruikt maakt van de`obs-websocket`plugin, die M³ in staat stelt om met OBS Studio te verbinden. <br><br> Bovendien moet je alle nodige scenes for media delen en podium tonen instellen in OBS. Op z'n minst heb je een scene nodig met `Window Capture` (aanbevolen) of `Display Capture` ingesteld om het media presentatie scherm van M³ te tonen, of het externe scherm waar de media gepresenteerd wordt. <br><br> Je moet ook alle gewilde scenes voor het podium beeld instellen, bijvoorbeeld: Een weergave van de spreker, Een wijd beeld van het hele podium, etc._ |
| `Poort` | De poort waar de `obs-websocket` plugin op luistert. |
| `Wachtwoord` | Het wachtwoord dat is ingesteld in de instellingen van de `obs-websocket` plugin. |
| `Standaard scene voor het podium in OBS Studio` | Selecteer de scene die je als standaard wilt wanneer de media presentatie modus aan wordt gezet. Vaak is dit het podium wijd beeld of het beeld voor de spreker. |
| `Media scherm scene in OBS Studio` | Selecteer welke scene in OBS is ingesteld om het media scherm van M³ te tonen. |
| `Zet hardware acceleratie uit` | Zet deze optie alleen aan als je problemen ondervindt met de media presentie modus. Na het veranderen moet je M³ opnieuw opstarten. |

### Gemeente sync setup

Zie de [Gemeente sync]({{page.lang}}/#congregation-sync) sectie voor details over wat deze optie is en hoe je het instelt.

### Media setup

| Instelling | Uitleg |
| ------- | ----------- |
| `Media taal` | Selecteer de taal van jouw gemeente of groep. Alle media zal van JW.org gedownload worden in deze taal. |
| `Maximale resolutie voor filmpjes` | Filmpjes van JW.org worden in deze resolutie gedownload of de eerst volgende, lagere, beschikbare resolutie. Handig voor situaties met weinig bandbreedte. |
| `Converteer media naar MP4 formaat` | Deze optie zorgt dat alle plaatjes en audio bestanden worden geconverteerd naar MP4 formaat, om te gebruiken met de["native MP4 sharing feature"](assets/img/other/zoom-mp4-share.png)van Zoom tijdens **volledig digitale** gemeente Zoom vergaderingen. Dit omvat alle plaatje en media bestanden die gedownload worden van JW.org en alle extra media bestanden die worden toegevoegd door de gebruiker of de VO. <br><br> _**Let op:** Deze optie is bedoeld voor **volledig digitale** gemeente Zoom vergaderingen. Als je**ybrid** of **gewone** gemeente vergaderingen houdt, probeer dan de [Media presentatie modus]({{page.lang}}/#present-media) door het activeren van de `Zet knop aan om media op een externe monitor of apart scherm af te spelen` optie, en zet deze optie uit._ |
| `Behoud originele media bestanden na omzetten` | Als deze optie aan staat zullen de originele plaatjes en auto bestanden die worden omgezet naar MP4 formaat behouden worden in plaats van verwijderd en vervangen door de filmpjes. Dit zorgt dat de media folder wat chaotischer eruit komt te zien en hoeft over het algemeen niet aangezet worden om media via Zoom MP4 delen te tonen. (Zie `Converteer media naar MP4 formaat` hierboven.) <br><br> _**Let op:** Alleen zichtbaar als `Converteer media naar MP4 formaat` aan staat._ |
| `Zet knop aan om media op een externe monitor of apart scherm af te spelen` | Deze instelling stelt je in staat om de gedownloade media te presenteren tijdens **hybride** of**ewone** gemeente vergaderingen. kan dan geopend worden door op de ▶️ (play) knop op het beginscherm van M³ te klikken. <br><br> Het media presentatie scherm zal automatisch geopend worden op een extern scherm als die beschikbaar is; zo niet, zal de media getoond worden in een los, sleepbaar scherm. <br><br> _**Let op:** Deze optie werkt het beste voor **hybride** of **gewone** gemeente vergaderingen. <br><br> Als je **volledig digitale** gemeente Zoom vergadering houdt, bekijk dan de Converteer media naar MP4 formaat optie en het delen van media via Zoom's eigen MP4 deel functie._ |
| `Achtergrondplaatje voor media presentatie modus` | Standaard zal M³ proberen om de jaartekst van dit jaar in de gekozen media taal proberen op te halen om die als achtergrond te tonen in de [Media presentatie modus]({{page.lang}}/#present-media) wanneer er geen media wordt afgespeeld. Als het ophalen van jaartekst mislukt of je om een andere reden een andere achtergrond wilt gebruiken kan je de 'Blader' knop gebruiken om een andere plaatje te selecteren of de 'refresh' knop gebruiken om de jaartekst nog een keer op te halen. <br><br> _**Let op:** Als [Gemeente sync]({{page.lang}}/#congregation-sync) aan is gezet, zal de achtergrond automatisch gesynchroniseerd worden met alle andere gebruikers van jullie gemeente._ |
| `Maak playlists voor het gebruik met VLC` | Zet deze optie aan om automatisch playlists te genereren van elke vergaderingen, om die in VLC te laden als je VLC gebruikt in plaats van de [Media presentatie modus]({{page.lang}}/#present-media). |
| `Sluit alle media van de th brochure uit` | Als deze optie aan staat, zal de media van de _Leg je toe op_ brochure niet worden gedownload voor de doordeweekse vergadering. |
| `Sluit afbeeldingen van het lff boek uit buien gemeentebijelstudie` | Als deze optie aan staat, zullen de plaatjes van het _Voor eeuwig gelukkig_ boek (_lff_), van bijvoorbeeld de bijbelstudie, niet gedownload worden. |

### Vergadering setup

| Instelling | Uitleg |
| ------- | ----------- |
| `Doordeweekse vergadering` | Stel in welke dag en tijd de doordeweekse vergadering normaal gehouden wordt. Dit wordt gebruikt voor de naamgeving van de media folders en het automatisch stoppen van achtergrond muziek (zie hieronder). |
| `Weekend vergadering` | Stel in welke dag en tijd de weekend vergadering normaal gehouden wordt. |
| `Zet knop aan om koninkrijksliederen op shuffle af te spelen` | Deze knop knop om het beginscherm te staan en speelt koninkrijksliederen van _sjjm_ serie, in willekeurige volgorde, af. Dit is handig om bijvoorbeeld voor en na de vergadering achtergrond muziek af te spelen in de Koninkrijkszaal. |
| `Muziek afspeelvolume` | Stelt het volume in voor de achtergrondmuziek. |
| `Automatisch stoppen met achtergrondmuziek afspelen` | Als `Zet knop aan om koninkrijksliederen op shuffle af te spelen` aan staat, zorgt deze instelling ervoor dat de achtergrond muziek automatisch stopt met spelen na een ingestelde tijd. Dit kan zijn: na een vast aantal minuten, of een aantal seconden voor de vergadering begint (als de muziek wordt afgespeeld op een vergadering dag voordat de vergadering is begonnen). |

### Schermafbeeldingen van het instellingen scherm

{% include screenshots/configuration.html lang=site.data.nl %}
