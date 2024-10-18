# Gebruik M³ in de Koninkrijkszaal

Deze handleiding zal je begeleiden bij het downloaden, installeren en opzetten van **Meeting Media Manager (M³)** in een koninkrijkszaal. Volg de stappen om te zorgen voor een soepele installatie voor het beheren van media tijdens gemeente vergaderingen.

## 1. Downloaden en installeren

1. Bezoek de [M³ downloadpagina](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Download de juiste versie voor jouw besturingssysteem (Windows, macOS of Linux).
3. Open het installatieprogramma en volg de instructies op het scherm om M³ te installeren.
4. Open M³.
5. Doorloop de configuratiewizard.

## 2) Configuratiewizard

### Applicatie taal

Bij het starten van M³ wordt je gevraagd om de **weergavetaal** van je voorkeur te kiezen. Kies de taal die je wilt gebruiken voor de interface.

:::tip Tip

Dit is niet dezelfde taal als de taal waarin M³ media zal downloaden. De taal voor media downloads wordt in een latere stap ingesteld.

:::

### Profieltype

De volgende stap is om een **profieltype** te kiezen. Voor een normale configuratie in een Koninkrijkszaal, kies **Regulier**. Dit zal veel functies configureren die vaak worden gebruikt voor gemeente vergaderingen.

:::warning 2) Configuratiewizard

You should only choose **Other** if you are creating a profile for which no media should be automatically downloaded. Media will have to be manually imported for use in this profile. This type of profile is used mostly to use M³ during theocratic schools, assemblies, conventions and other special events.

De **Andere** profielsoort wordt zelden gebruikt. **For normal use during congregation meetings, please choose _Regular_.**
:::

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

::: tip Tip
If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.

:::

## 3. Geniet van M³

Zodra de installatie wizard is voltooid, is M³ klaar om te helpen met het beheer en het presenteren van media voor gemeente vergaderingen. Veel plezier met de app! :tada:
