# Gebruik M³ in een Koninkrijkszaal {#using-m3-at-a-kingdom-hall}

Deze handleiding zal je begeleiden bij het downloaden, installeren en opzetten van **Meeting Media Manager (M³)** in een koninkrijkszaal. Volg de stappen om te zorgen voor een soepele installatie voor het beheren van media tijdens gemeente vergaderingen.

## 1. Download en installeer {#download-and-install}

1. Bezoek de [M³ downloadpagina](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Download de juiste versie voor jouw besturingssysteem:
   - **Windows:**
     - Voor de meeste Windows-systemen, download `meeting-media-manager-[VERSIE]-x64.exe`.
     - Voor oudere 32-bit Windows-systemen, download `meeting-media-manager-[VERSIE]-ia32.exe`.
   - **macOS:**
     - **M-serie (Apple Silicon)**: Download `meeting-media-manager-[VERSIE]-arm64.dmg`.
     - **Intel Macs**: Download `meeting-media-manager-[VERSIE]-x64.dmg`.
   - **Linux:**
     - Download `meeting-media-manager-[VERSIE]-x86_64.AppImage`.
3. Open het installatieprogramma en volg de instructies op het scherm om M³ te installeren.
4. Open M³.
5. Doorloop de configuratiewizard.

### Extra stappen voor macOS gebruikers {#additional-steps-for-macos-users}

Vanwege de beveiligingsmaatregelen van Apple zijn er enkele aanvullende stappen nodig om M³ te draaien op moderne macOS systemen.

Voer eerst de volgende twee commando's in de Terminal uit (wijzig het pad naar M³ indien nodig):

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::tip Uitleg

Deze commando's doen twee dingen die voorkomen dat M³ wordt gedetecteerd als een kwaadaardige applicatie op uw systeem: de eerste tekent de code van de applicatie lokaal en de tweede verwijdert de quarantainevlaggen uit de toepassing. De quarantaine-vlag wordt gebruikt om gebruikers te waarschuwen voor toepassingen die van het internet zijn gedownload.

:::

Als je M³ nog steeds niet kunt starten na het uitvoeren van de twee commando's, probeer dan het volgende:

1. Open de macOS **Privacy & Beveiliging** instellingen.
2. Vind het item voor M³ en klik op de knop **Toch openen**.
3. Vervolgens wordt je opnieuw gewaarschuwd met het advies om "niet te openen, tenzij je er zeker van bent dat het vanuit een betrouwbare bron komt." Klik **Toch openen**.
4. Er zal een andere waarschuwing verschijnen, waar je moet verifiëren om de app te starten.
5. M³ zou nu met succes moeten starten.

Als je nog steeds problemen hebt na het volgen van al deze stappen, [open dan een issue op GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). We zullen ons best doen om te helpen.

## 2. Configuratiewizard {#configuration-wizard}

### Weergavetaal van de app {#app-display-language}

Bij het starten van M³ wordt je gevraagd om de **weergavetaal** van je voorkeur te kiezen. Kies de taal die je wilt gebruiken voor de interface.

:::tip Tip

Dit is niet dezelfde taal als de taal waarin M³ media zal downloaden. De taal voor media downloads wordt in een latere stap ingesteld.

:::

### Profieltype {#profile-type}

De volgende stap is om een **profieltype** te kiezen. Voor een normale configuratie in een Koninkrijkszaal, kies **Regulier**. Dit zal veel functies configureren die vaak worden gebruikt voor gemeente vergaderingen.

:::warning Waarschuwing

Je moet alleen **Anders** kiezen als je een profiel aanmaakt waarvoor geen media automatisch moeten worden gedownload. Media zal handmatig moeten worden geïmporteerd voor gebruik in dit profiel. Dit type profiel wordt meestal gebruikt voor M³ tijdens theocratische scholen, kringen, congressen en andere speciale evenementen.

De **Andere** profielsoort wordt zelden gebruikt. **For normal use during congregation meetings, please choose _Regular_.**

:::

### Automatisch gemeente opzoeken {#automatic-congregation-lookup}

M³ kan proberen om automatisch het vergaderschema, de taal en de opmaak van jouw gemeente te vinden.

Om dit te doen, gebruik de **Zoek gemeente op** knop naast het gemeente naam veld en voer minimaal een deel van de gemeente naam en stad in.

Zodra de juiste gemeente is gevonden en geselecteerd, zal M³ alle beschikbare informatie vooraf invullen, zoals **naam**, **gemeente taal**, en **vergaderdagen en tijden**.

:::info Opmerking

Deze zoektocht maakt gebruik van openbare gegevens op de officiële website van Jehovah's Getuigen.

:::

### Handmatige invoer van gemeente-informatie {#manual-entry-of-congregation-information}

Als de geautomatiseerde zoekopdracht jouw gemeente niet heeft gevonden, kan je natuurlijk alsnog handmatig de vereiste informatie invoeren. De wizard geeft je de mogelijkheid om de **naam**, **gemeente taal** en **vergaderdagen en tijden van je gemeente te bekijken en/of in te voeren**.

### Video's van de liederenbundel cachen {#caching-videos-from-the-songbook}

Je krijgt ook de optie om **alle video's van het liederenboek te cachen**. Deze optie downloadt vooraf alle video's van de liederen en vermindert de tijd die het kost om media op te halen voor vergaderingen in de toekomst.

- **Voordelen:** De media van de vergadering zal veel sneller beschikbaar zijn.
- **Nadelen:** De grootte van de media cache zal aanzienlijk toenemen, ongeveer 5GB.

:::tip Tip

Als jouw computer voldoende opslagruimte heeft, wordt aanbevolen om deze optie **in te schakelen** voor efficiëntie en prestaties.

:::

### Configuratie OBS Studio integratie (optioneel) {#obs-studio-integration-configuration}

Als jouw gemeente **OBS Studio** gebruikt voor het uitzenden van hybride vergaderingen over Zoom, kan M³ automatisch met dat programma integreren. Tijdens het instellen kan je de integratie met OBS Studio configureren door het volgende in te voeren:

- **Poort:** Het poortnummer dat gebruikt wordt om verbinding te maken met de OBS Studio Websocket plugin.
- **Wachtwoord:** Het wachtwoord dat gebruikt wordt om verbinding te maken met de OBS Studio Websocket plugin.
- **Scènes:** De OBS scènes die gebruikt zullen worden tijdens het presenteren van media. Je hebt één scène nodig die het mediavenster of scherm toont, en één die het podium toont.

:::tip Tip

If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.

:::

## 3. Geniet van het gebruik van M³ {#enjoy-using-m3}

Zodra de installatie wizard is voltooid, is M³ klaar om te helpen met het beheer en het presenteren van media voor gemeente vergaderingen. Veel plezier met de app! :tada:
