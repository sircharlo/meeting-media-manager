# Gebruik M³ in de Koninkrijkszaal

Deze handleiding zal je begeleiden bij het downloaden, installeren en opzetten van **Meeting Media Manager (M³)** in een koninkrijkszaal. Volg de stappen om te zorgen voor een soepele installatie voor het beheren van media tijdens gemeente vergaderingen.

## 1. Downloaden en installeren

1. Bezoek de [M³ downloadpagina](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Download de juiste versie voor jouw besturingssysteem (Windows, macOS of Linux).
3. Open het installatieprogramma en volg de instructies op het scherm om M³ te installeren.
4. Open M³.
5. Doorloop de configuratiewizard.

### Additional steps for macOS Users

Due to Apple's security measures, a few additional steps are required to run M³ on modern macOS systems.

First, run the following two commands in Terminal (modify the path to M³ as needed):

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::tip Explanation

These commands do two things that will prevent M³ from being detected as a malicious application on your system: the first one signs the application's code locally, and the second one removes the quarantine flag from the application. The quarantine flag is used to warn users about applications that have been downloaded from the internet.

:::

If you are still unable to launch M³ after entering the two commands, please try the following:

1. Open the macOS system **Privacy & Security** settings.
2. Find the entry for M³ and click the button to **Open Anyway**.
3. You will then be warned again, and given the advice to not "open this unless you are certain it is from a trustworthy source." Click **Open Anyway**.
4. Another warning will appear, where you’ll need to authenticate to launch the app.
5. M³ should now launch successfully.

If you still have issues after following all these steps, please [open an issue on GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). We will do our best to help.

## 2. Configuratiewizard

### Applicatie taal

Bij het starten van M³ wordt je gevraagd om de **weergavetaal** van je voorkeur te kiezen. Kies de taal die je wilt gebruiken voor de interface.

:::tip Tip

Dit is niet dezelfde taal als de taal waarin M³ media zal downloaden. De taal voor media downloads wordt in een latere stap ingesteld.

:::

### Profieltype

De volgende stap is om een **profieltype** te kiezen. Voor een normale configuratie in een Koninkrijkszaal, kies **Regulier**. Dit zal veel functies configureren die vaak worden gebruikt voor gemeente vergaderingen.

:::warning Waarschuwing

Je moet alleen **Anders** kiezen als je een profiel aanmaakt waarvoor geen media automatisch moeten worden gedownload. Media zal handmatig moeten worden geïmporteerd voor gebruik in dit profiel. Dit type profiel wordt meestal gebruikt voor M³ tijdens theocratische scholen, kringen, congressen en andere speciale evenementen.

De **Andere** profielsoort wordt zelden gebruikt. **For normal use during congregation meetings, please choose _Regular_.**

:::

### Automatisch jouw gemeente opzoeken

M³ kan proberen om automatisch het vergaderschema, de taal en de opmaak van jouw gemeente te vinden.

Om dit te doen, gebruik de **Zoek gemeente op** knop naast het gemeente naam veld en voer minimaal een deel van de gemeente naam en stad in.

Zodra de juiste gemeente is gevonden en geselecteerd, zal M³ alle beschikbare informatie vooraf invullen, zoals **naam**, **gemeente taal**, en **vergaderdagen en tijden**.

:::info Opmerking

Deze zoektocht maakt gebruik van openbare gegevens op de officiële website van Jehovah's Getuigen.

:::

### Handmatige invoer van gemeente informatie

Als de geautomatiseerde zoekopdracht jouw gemeente niet heeft gevonden, kan je natuurlijk alsnog handmatig de vereiste informatie invoeren. De wizard geeft je de mogelijkheid om de **naam**, **gemeente taal** en **vergaderdagen en tijden van je gemeente te bekijken en/of in te voeren**.

### Video's van het liederenboek cachen

Je krijgt ook de optie om **alle video's van het liederenboek te cachen**. Deze optie downloadt vooraf alle video's van de liederen en vermindert de tijd die het kost om media op te halen voor vergaderingen in de toekomst.

- **Voordelen:** De media van de vergadering zal veel sneller beschikbaar zijn.
- **Nadelen:** De grootte van de media cache zal aanzienlijk toenemen, ongeveer 5GB.

:::tip Tip

Als jouw computer voldoende opslagruimte heeft, wordt aanbevolen om deze optie **in te schakelen** voor efficiëntie en prestaties.

:::

### Configuratie OBS Studio integratie (optioneel)

Als jouw gemeente **OBS Studio** gebruikt voor het uitzenden van hybride vergaderingen over Zoom, kan M³ automatisch met dat programma integreren. Tijdens het instellen kan je de integratie met OBS Studio configureren door het volgende in te voeren:

- **Poort:** Het poortnummer dat gebruikt wordt om verbinding te maken met de OBS Studio Websocket plugin.
- **Wachtwoord:** Het wachtwoord dat gebruikt wordt om verbinding te maken met de OBS Studio Websocket plugin.
- **Scènes:** De OBS scènes die gebruikt zullen worden tijdens het presenteren van media. Je hebt één scène nodig die het mediavenster of scherm toont, en één die het podium toont.

:::tip Tip

If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.

:::

## 3. Geniet van M³

Zodra de installatie wizard is voltooid, is M³ klaar om te helpen met het beheer en het presenteren van media voor gemeente vergaderingen. Veel plezier met de app! :tada:
