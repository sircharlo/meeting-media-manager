<!-- markdownlint-disable no-inline-html -->

# Paggamit ng M³ sa Kingdom Hall {#using-m3-at-a-kingdom-hall}

Ang guide na ito ay magtuturo sa iyo ng proseso ng pag-download, pag-install, at pag-setup ng **Meeting Media Manager (M³)** sa isang Kingdom Hall. Sundin ang mga hakbang upang matiyak ang maayos na setup sa pag-manage ng media sa mga pulong ng kongregasyon.

## 1. Pag-download at install {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. I-download ang angkop na bersyon sa iyong operating system:
  - **Windows:**
    - Para sa mga karaniwang Windows systems, i-download ang <a :href="data.win64">meeting-media-manager-[VERSION]-x64.exe</a>.
    - Para sa mas lumang 32-bit Windows systems, i-download ang <a :href="data.win32">meeting-media-manager-[VERSION]-ia32.exe</a>.
    - Para sa portable version, i-download ang <a :href="data.winPortable">meeting-media-manager-[VERSION]-portable.exe</a>.
  - **macOS:**
    - **M-series (Apple Silicon)**: I-download ang <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a>.
    - **Intel-based Macs**: I-download ang <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a>.
  - **Linux:**
    - I-download ang <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a>.
2. Kung hindi gumagana ang mga link ng pag-download, bisitahin ang [M³ download page](https://github.com/sircharlo/meeting-media-manager/releases/latest) at i-download ang tamang bersyon nang manu-mano.
3. Buksan ang installer at sundan ang on-screen instructions para i-install ang M³.
4. I-launch ang M³.
5. Pumunta sa configuration wizard.

### macOS lamang: Karagdagang hakbang sa pag-install {#additional-steps-for-macos-users}

:::warning Babala

Ang seksyong ito ay para lamang sa macOS users.

:::

Dahil sa mga security measures ng Apple, ilang karagdagang hakbang ang kailangan upang magamit ang na-install na M³ app sa mga modern systems ng macOS.

I-run ang dalawang command sa Terminal, baguhin ang path sa M³ kung kinakailangan:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Babala

Bilang macOS user, kailangang sundin ang mga ito sa tuwing nagi-install o mag-update ng M³.

:::

:::info Paliwanag

Ang unang command ay _pag-sign sa code ng application_. Kailangan ito upang hindi ma-detect ang M³ bilang malicious application mula sa hindi kilalang developer.

Ang pangalawang command ay _inaalis ang quarantine flag mula sa application. Ginagamit ang quarantine flag bilang paalala sa mga user tungkol sa panganib sa paggamit ng hindi kilalang application mula sa internet.

:::

#### Alternatibong paraan {#alternative-method-for-macos-users}

Kung hindi pa rin magamit ang M³ matapos ilagay ang dalawang command, subukan ang mga sumusunod:

1. Buksan ang macOS system **Privacy & Security** settings.
2. Hanapin ang entry sa M³ at i-click ang button ng **Open Anyway**.
3. Papaalalahanan ka ulit, at papayuhang huwag "buksan malibang mapagkakatiwalaan ang pinagmulan". I-click ang **Open Anyway**.
4. Lalabas ulit ang paalala, kung saan kailangang i-authenticate upang buksan ang app.
5. Maayos nang magbubukas ang M³.

Kung may isyu pa rin matapos sundin ang mga ito, pakisuyong [magbukas ng isyu sa GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). Tutulong kami sa abot nang makakaya.

### macOS lamang: Pag-enable muli ng website presentation pagtapos ng mga update {#screen-sharing-issues}

:::warning Babala

Ang seksyong ito ay para lamang sa macOS users.

:::

May mga ulat na hindi gumagana ang website presentation pagtapos mag-install ng mga update sa M³.

Kung black ang makikita sa media window nang ipakita ang website pagtapos ng update, subukan ito:

1. Buksan ang macOS system **Privacy & Security** settings.
2. Pumunta sa **Screen Recording**.
3. Piliin ang M³ sa list.
4. I-click ang `-` (minus) button upang alisin.
5. I-click ang `+` (plus) button at piliin ang M³ mula sa folder ng Applications.
6. Hihilingan ka na buksan muli ang M³ upang makita ang pagbabago.

Pagtapos nito, gagana na ang screen sharing gaya ng inaasahan.

:::tip Tip

Opsyonal ang mga hakbang na ito at puwedeng laktawan kung hindi mo gagamitin ang website future sa hinaharap. Sa kabilang banda, kung gagamitin mo ang feature na ito, iminumungkahi na sundan ang mga hakbang tuwingay update upang masigurado na gagana ito.

:::

## 2. Configuration wizard {#configuration-wizard}

### App display language {#app-display-language}

Kapag gagamitin ang M³ sa unang pagkakataon, hihilingan kang pumili ng gusto mong **display language**. Pumili ng wika na gusto mo sa interface ng M³.

:::tip Tip

Hindi ito katulad ng wika na gagamitin ng M³ sa pag-download ng media. Ang wika para sa mga media download ay isasaayos mamaya.

:::

### Profile type {#profile-type}

Ang susunod ay pumili ng **profile type**. Para sa regular na setup sa Kingdom Hall piliin ang **Regular**. Iko-configure nito ang maraming feature na karaniwang ginagamit sa mga pulong ng kongregasyon.

:::warning Babala

Piliin lamang ang **Other** kung gagawa ng profile na walang media na awtomatikong magda-download. Mano-mano ang pag-import ng media sa profile na ito. Ang profile na ito ay karaniwang ginagamit sa mga theocratic school, asemblea, kombensyon at iba pang espesyal na okasyon.

Madalang gamitin ang profile na **Other**. **Kung gagamitin para sa mga pulong ng kongregasyon, pakisuyong piliin ang _Regular_.**

:::

### Automatic congregation lookup {#automatic-congregation-lookup}

Susubukan ng M³ na hanapin ang iskedyul ng pulong, wika, at pangalan ng inyong kongregasyon.

Para gawin ito, gamitin ang **Congregation Lookup** button sa tabi ng field ng pangalan ng kongregasyon at ilagay kahit bahagi lamang ng pangalan ng kongregasyon at lungsod.

Kapag nakita at napili na ang kongregasyon, pupunan ng M³ lahat ng available na impormasyon sa kongregasyon kagaya ng **pangalan**, **wika**, at **iskedyul ng pulong**.

:::info Note

Ginagamit ng lookup ang available na data mula sa opisyal na website ng mga Saksi ni Jehova.

:::

### Manu-manong paglalagay ng impormasyon ng kongregasyon {#manual-entry-of-congregation-information}

If the automated lookup did not find your congregation, you can of course manually enter the required information. The wizard will allow you to review and/or enter your congregation's **name**, **meeting language**, and **meeting days and times**.

### Caching videos from the songbook {#caching-videos-from-the-songbook}

You will also be given the option of **caching all videos from the songbook**. This option pre-downloads all the songbook videos, reducing the time it takes to fetch media for meetings in the future.

- **Pros:** Meeting media will be available much faster.
- **Cons:** The size of the media cache will increase significantly, by approximately 5GB.

:::tip Tip

If your Kingdom Hall has sufficient storage space, it’s recommended to **enable** this option for efficiency and perceived performance.

:::

### OBS Studio Integration Configuration (Optional) {#obs-studio-integration-configuration}

If your Kingdom Hall uses **OBS Studio** for broadcasting hybrid meetings over Zoom, M³ can automatically integrate with that program. During setup, you can configure the integration with OBS Studio by entering the following:

- **Port:** The port number used to connect to the OBS Studio Websocket plugin.
- **Password:** The password used to connect to the OBS Studio Websocket plugin.
- **Scenes:** The OBS scenes that will be used during media presentations. You'll need one scene that captures the media window or screen, and one that shows the stage.

:::tip Tip

If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.

:::

## 3. Enjoy using M³ {#enjoy-using-m3}

Once the setup wizard is complete, M³ is ready to help manage and present media for congregation meetings. Enjoy using the app! :tada:
