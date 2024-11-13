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

### macOS only: Additional installation steps {#additional-steps-for-macos-users}

:::warning Waarschuwing

This section only applies to macOS users.

:::

Due to Apple's security measures, a few additional steps are required to run the installed M³ app on modern macOS systems.

Run the following two commands in Terminal, modifying the path to M³ as needed:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Waarschuwing

As a macOS user, you will need to follow these steps every time you install or update M³.

:::

:::info Uitleg

The first command _signs the application's code_. This is required to prevent M³ from being detected as a malicious application from an unknown developer.

The second command _removes the quarantine flag_ from the application. The quarantine flag is used to warn users about potentially malicious applications that have been downloaded from the internet.

:::

#### Alternative method {#alternative-method-for-macos-users}

If you are still unable to launch M³ after entering the two commands from the previous section, please try the following:

1. Open de macOS **Privacy & Beveiliging** instellingen.
2. Vind het item voor M³ en klik op de knop **Toch openen**.
3. Vervolgens wordt je opnieuw gewaarschuwd met het advies om "niet te openen, tenzij je er zeker van bent dat het vanuit een betrouwbare bron komt." Klik **Toch openen**.
4. Er zal een andere waarschuwing verschijnen, waar je moet verifiëren om de app te starten.
5. M³ zou nu met succes moeten starten.

Als je nog steeds problemen hebt na het volgen van al deze stappen, [open dan een issue op GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). We zullen ons best doen om te helpen.

### macOS only: Re-enabling website presentation after updates {#screen-sharing-issues}

:::warning Waarschuwing

This section only applies to macOS users.

:::

Some macOS users have reported that website presentation no longer works after installing updates to M³.

If the media window is black when presenting the website after updating M³, try the following steps:

1. Open de macOS **Privacy & Beveiliging** instellingen.
2. Go to **Screen Recording**.
3. Select M³ in the list.
4. Click the `-` (minus) button to remove it.
5. Click the `+` (plus) button and select M³ from the Applications folder.
6. You may be prompted to relaunch M³ to apply the change.

After these steps, screen sharing should function as expected once again.

:::tip Tip

These steps are optional and can be skipped if you do not plan to use the website presentation feature. On the other hand, if you do plan to use the website presentation feature, it is recommended to follow these steps after every update to ensure the feature works as expected.

:::

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
