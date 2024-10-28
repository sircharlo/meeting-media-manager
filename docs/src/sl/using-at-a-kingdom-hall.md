# Uporaba M³ v kraljestveni dvorani

Ta vodnik ti bo pomagal prenesti, namestiti in nastaviti **Meeting Media Manager (M³)** v kraljestveni dvorani. Za nemoteno nastavitev aplikacije za upravljanje multimedijske vsebine med občinskimi shodi sledi spodnjim korakom.

## 1. Prenesi in namesti

1. Obišči [spletno stran za prenos M³](https://github.com/sircharlo/meeting-media-manager/releases/latest).
2. Prenesi ustrezno različico za vaš operacijski sistem (Windows, macOS ali Linux).
3. Odpri namestitveni program in sledi navodilom na zaslonu za namestitev programa M³.
4. Zaženi M³.
5. Sledi navodilom pomočnika za nastavitev.

## 2) Pomočnik za nastavitev

### Jezik uporabniškega vmesnika

Ob prvem zagonu programa M³ boš moral izbrati želeni **jezik uporabniškega vmesnika**. Izberi jezik, ki naj ga M³ uporablja za svoj vmesnik.

:::tip Namig

Ni nujno, da je to isti jezik kot jezik, v katerem bo M³ prenesel multimedijsko vsebino. Jezik za prenos multimedijske vsebine boš nastavil v enem od naslednjih korakov.

:::

### Vrsta profila

V naslednjem koraku je treba izbrati **vrsto profila**. Za običajno namestitev v kraljestveni dvorani izberi možnost **Običajno**. Tako boš nastavil številne funkcije, ki se običajno uporabljajo za občinske shode.

:::warning Opozorilo

Možnost **Drugo** izberi le, če ustvarjaš profil, pri katerem se multimedijska vsebina ne sme samodejno prenašati. Pri tem profilu bo treba multimedijsko vsebino uvoziti ročno. Ta vrsta profila se večinoma uporablja za uporabo M³ med teokratičnimi šolami, zbori, zborovanji in drugimi posebnimi dogodki.

Profil **Drugo** se redko uporablja. **Za običajno uporabo med občinskimi shodi izberi možnost _Običajno_.**

:::

### Samodejno iskanje občine

M³ lahko poskuša samodejno poiskati urnik, jezik in ime vaših občinskih shodov.

To do so, use the **Congregation Lookup** button next to the congregation name field and enter at least part of the congregation's name and city.

Once the correct congregation is found and selected, M³ will prefill all available information, such as your congregation's **name**, **meeting language**, and **meeting days and times**.

:::info Note

This lookup uses publicly available data from the official website of Jehovah's Witnesses.

:::

### Manual entry of congregation information

If the automated lookup did not find your congregation, you can of course manually enter the required information. The wizard will allow you to review and/or enter your congregation's **name**, **meeting language**, and **meeting days and times**.

### Caching videos from the songbook

You will also be given the option of **caching all videos from the songbook**. This option pre-downloads all the songbook videos, reducing the time it takes to fetch media for meetings in the future.

- **Pros:** Meeting media will be available much faster.
- **Cons:** The size of the media cache will increase significantly, by approximately 5GB.

:::tip Namig

If your Kingdom Hall has sufficient storage space, it’s recommended to **enable** this option for efficiency and perceived performance.

:::

### OBS Studio Integration Configuration (Optional)

If your Kingdom Hall uses **OBS Studio** for broadcasting hybrid meetings over Zoom, M³ can automatically integrate with that program. During setup, you can configure the integration with OBS Studio by entering the following:

- **Port:** The port number used to connect to the OBS Studio Websocket plugin.
- **Password:** The password used to connect to the OBS Studio Websocket plugin.
- **Scenes:** The OBS scenes that will be used during media presentations. You'll need one scene that captures the media window or screen, and one that shows the stage.

:::tip Namig

If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.

:::

## 3. Enjoy using M³

Once the setup wizard is complete, M³ is ready to help manage and present media for congregation meetings. Enjoy using the app! :tada:
