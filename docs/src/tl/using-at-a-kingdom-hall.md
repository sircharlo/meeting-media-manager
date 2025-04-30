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

Kapag nakita at napili na ang kongregasyon, pupunan ng M³ lahat ng available na impormasyon sa kongregasyon kagaya ng **pangalan**, **wika**, at **mga iskedyul ng pulong**.

:::info Note

Ginagamit ng lookup ang available na data mula sa opisyal na website ng mga Saksi ni Jehova.

:::

### Manu-manong paglalagay ng impormasyon ng kongregasyon {#manual-entry-of-congregation-information}

Kung hindi nahanap ng automated lookup ang inyong kongregasyon, pupuwedeng manu-manong ilagay ang mga detalye. Papayagan ka ng wizard na suriin at/o ilagay ang **pangalan** ng inyong kongregasyon, **wika ng pulong**, pati na rin mga **iskedyul ng pulong**.

### Pag-cache ng mga video mula sa songbook {#caching-videos-from-the-songbook}

Bibigyan ka rin ng opsyon na **i-cache ang lahat ng video mula sa songbook**.Sa opsyong ito patiunang dina-download ang lahat ng video mula sa songbook, para mabawasan ang oras ng pagkuha ng media para sa mga pulong sa hinaharap.

- **Mga Pakinabang:** Mas magiging mabilis ang pagkuha ng media para sa mga pulong.
- **Kahinaan:** Malaki ang madadagdag sa laki ng media cache—humigit-kumulang 5GB.

:::tip Tip

Kung sapat ang storage space ng inyong Kingdom Hall, iminumungkahing **i-enable** ang opsyong ito para magamit nang maayos.

:::

### OBS Studio Integration Configuration (Optional) {#obs-studio-integration-configuration}

Kung gumagamit ng **OBS Studio** ang inyong Kingdom Hall para sa hybrid na mga pulong sa Zoom, awtomatikong makakakonekta ang M³ sa program na iyon.Habang nagse-setup, maaaring i-configure ang integration sa OBS Studio sa pamamagitan ng paglalagay ng mga sumusunod na detalye:

- **Port:** Port number na gagamitin upang makakonekta sa OBS Studio Websocket plugin.
- **Password:** Password na gagamitin upang makakonekta sa OBS Studio Websocket plugin.
- **Scenes:** Mga scene sa OBS na gagamitin sa mga media presentation. Kailangan ng isang scene para sa media window o screen, at isa para sa stage.

:::tip Tip

Kung madalas na hybrid ang pulong ng inyong kongregasyon, **lubos** na iminumungkahi ang pag-integrate sa OBS Studio.

:::

## 3. Masiyahan sa paggamit ng M³ {#enjoy-using-m3}

Kung tapos na ang setup wizard, handa na ang M³ sa pag-manage at pag-display ng media sa mga pagpupulong. Mag-enjoy sa paggamit ng app! :tada:
