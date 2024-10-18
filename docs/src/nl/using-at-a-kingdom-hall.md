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
Dit is niet dezelfde taal als de taal waarin M³ media zal downloaden. The language for media downloads is configured in a later step.
:::

### Profieltype

The next step is to choose a **profile type**. For a regular setup in a Kingdom Hall, choose **Regular**. This will configure many features that are commonly used for congregation meetings.

::: warning
You should only choose **Other** if you are creating a profile for which no media should be automatically downloaded. Media will have to be manually imported for use in this profile. This type of profile is used mostly to use M³ during theocratic schools, assemblies, conventions and other special events.

The **Other** profile type is rarely used. **For normal use during congregation meetings, please choose _Regular_.**
:::

### Automatic congregation lookup

M³ can attempt to automatically find your congregation's meeting schedule, language, and formatted name.

To do so, use the **Congregation Lookup** button next to the congregation name field and enter at least part of the congregation's name and city.

Once the correct congregation is found and selected, M³ will prefill all available information, such as your congregation's **name**, **meeting language**, and **meeting days and times**.

:::info Opmerking
This lookup uses publicly available data from the official website of Jehovah's Witnesses.
:::

### Manual entry of congregation information

If the automated lookup did not find your congregation, you can of course manually enter the required information. The wizard will allow you to review and/or enter your congregation's **name**, **meeting language**, and **meeting days and times**.

### Caching videos from the songbook

You will also be given the option of **caching all videos from the songbook**. This option pre-downloads all the songbook videos, reducing the time it takes to fetch media for meetings in the future.

- **Pros:** Meeting media will be available much faster.
- **Cons:** The size of the media cache will increase significantly, by approximately 5GB.

:::tip Tip
If your Kingdom Hall has sufficient storage space, it’s recommended to **enable** this option for efficiency and perceived performance.
:::

### OBS Studio Integration Configuration (Optional)

If your Kingdom Hall uses **OBS Studio** for broadcasting hybrid meetings over Zoom, M³ can automatically integrate with that program. During setup, you can configure the integration with OBS Studio by entering the following:

- **Port:** The port number used to connect to the OBS Studio Websocket plugin.
- **Password:** The password used to connect to the OBS Studio Websocket plugin.
- **Scenes:** The OBS scenes that will be used during media presentations. You'll need one scene that captures the media window or screen, and one that shows the stage.
  ::: tip Tip
  If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.
  :::

## 3. Enjoy using M³

Once the setup wizard is complete, M³ is ready to help manage and present media for congregation meetings. Enjoy using the app! :tada:
