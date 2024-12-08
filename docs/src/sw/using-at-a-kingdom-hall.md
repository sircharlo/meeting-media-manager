<!-- markdownlint-disable no-inline-html -->

# Kutumia M³ kwenye Jumba la ufalme {#using-m3-at-a-kingdom-hall}

Mwongozo huu utakuelekeza kwenye hatua za kupakua, kusakinisha na kuanzisha Meeting Media Manager (M³) kwenye Jumba La Ufalme. Fuata hatua ili kuhakikisha usanidi mzuri wa kusimamia midia wakati wa mikutano ya kutaniko.

## 1. Pakua na usakinishe {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. Pakua aina ambayo inafaa mfumo wa kopyuta yako:
   - **Windows:**
     - Kwa mifumo mingi ya Windows, pakua <a :href="data.win64">meeting-media-manager-[VERSION]-x64.exe</a>.
     - Kwa mifumo ya kitambo ya 32-bit Windows, pakua <a :href="data.win32">meeting-media-manager-[VERSION]-ia32.exe</a>.
     - Kwa programu inayoweza kuhamishwa, pakua <a :href="data.winPortable">meeting-media-manager-[VERSION]-portable.exe</a>.
   - **macOS:**
     - **M-series (Apple Silicon)**: Pakua <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a>.
     - **Intel-based Macs**: Pakua <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a>.
   - **Linux:**
     - Pakua <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a>.
2. Ikiwa viunganishi vya kupakua havifanyi kazi, tembelea [Ukurasa wa kupakua wa M³] (https://github.com/sircharlo/meeting-media-manager/releases/latest) na upakue toleo ambayo inafaa.
3. Fungua mfumo wa kupakua na ufuate maagizo ya kupakua M³ kwenye scrini.
4. Fungua M³.
5. Pitia programu ya usanidi.

### macOS only: Hatua za ziada za kusakinisha {#additional-steps-for-macos-users}

:::warning Onyo

Sehemu hii inatumika tu kwa watumiaji wa macOS.

:::

Kutokana na hatua za usalama za mfumo wa Apple, hatua za ziada zitahitajika ili kutumia programu M³ iliyopakuliwa kwenye mifumo za hivi karibuni za macOS.

Wasilisha amri hizi mbili kwenye Terminal, rekebisha njia ya M³ inavyohitajika:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Onyo

Kama mtumiaji wa macOS, utahitaji kufuata hatua hizi kila saa utapakua au kusasisha M³.

:::

:::info Maelezo

Command ya kwanza _inasaini code ya programu_. Hii inahitajika ili kuzuia M³ kuonekana kama programu hatari iliyotoka kwa mtu asiyejulikana.

Command ya pili _hutoa bendera ya quarantine_ kutoka kwa programu. Bendera hiyo hutumiwa kuonya watu kuhusu mifumo au programu ambazo huenda ni hatari ambazo zimepakuliwa kutoka kwa intaneti.

:::

#### Njia mbadala {#alternative-method-for-macos-users}

Ikiwa bado huwezi kuwasha M³ baada ya kuweka amri hizo mbili zilizo kwenye sehemu iliyopita, tafadhali jaribu:

1. Kufungua mipangilio ya **Privacy & Security** kwenye mfumo wako wa macOS.
2. Tafuta ingizo(entry) la M³ na ubofye kitufe **Open Anyway**.
3. Kisha utaonywa tena, na kupewa ushauri wa "kutofungua hii isipokuwa una hakika kuwa imetoka kwa chanzo cha kuaminika." Bonyeza **Open Anyway**.
4. Onyo lingine litaonekana, ambapo utahitaji kuthibitisha ili kuzindua programu.
5. M³ sasa inapaswa kuzindua kwa mafanikio.

Ikiwa bado ukona tatizo hata baada ya kufuata hatua hizo, tafadhali [fungua tatizo(issue) kwenye Github](https://github.com/sircharlo/meeting-media-manager/issues/new). Tutafanya yote tuwezayo kukusaidia.

### macOS pekee: Kuwasha tena uwasilishaji wa tovuti baada ya kusakinisha {#screen-sharing-issues}

:::warning Onyo

Sehemu hii inatumika tu kwa watumiaji wa macOS.

:::

Watumiaji kadhaa wa macOS wameripoti kwamba uwasilishaji wa midia haufanyi kazi tena baada ya kupakua visasisho kwenye M³.

Ikiwa kidirisha cha midia ni nyeusi unapowasilisha tovuti baada ya kusasisha M³, jaribu hatua zifuatazo:

1. Kufungua mipangilio ya **Privacy & Security** kwenye mfumo wako wa macOS.
2. Nenda kwenye **Screen Recording**.
3. Chagua M³ kwenye orodha.
4. Bonyeza kitufe cha `-` (minus) ili kuiondoa.
5. Bonyeza kitufe cha `+` (plus) na uchague M³ kutoka kwa folder ya Programu.
6. Unaweza ombwa kufungua M³ kwa upya ili mabadiliko yafanye kazi.

Baada ya hatua hizi, screen sharing inafaa kufanya kazi kama inavyotakikana.

:::tip Kidokezo

Unaweza kupuuza hatua hizi ikiwa haupangi kutumia kipengele cha kuwasilisha tovuti. Kwa upande mwingine, ikiwa unapanga kutumia kipengele cha uwasilishaji wa tovuti, inashauriwa kufuata hatua hizi baada ya kila sasisho ili kuhakikisha kuwa kipengele kinafanya kazi inavyotarajiwa.

:::

## 2. Programu ya Usanidi {#configuration-wizard}

### Lugha ya programu {#app-display-language}

Unapofungua M³ kwa mara ya kwanza, utaulizwa kuhusu lugha ya mfumo unaotaka. Chagua lugha ya mfumo unaotaka kutumia kwenye mfumo wa M³.

:::tip Kidokezo

Hii sio lazima iwe lugha sawa na ile ambayo M³ itapakua media. Lugha ya upakuaji wa media itasanidiwa katika hatua ya baadaye.

:::

### Aina ya profaili {#profile-type}

Hatua inayo fuata ni ya kuchagua **aina ya profaili**. Kwa ajili ya matumizi katika Jumba la Ufalme, chagua **Kawaida**. Hili litapanga mipangilio mingi ya kawaida ya matumizi katika mikutano.

:::warning Onyo

Unafaa kuchagua **Nyingine** ikiwa unatengeneza profile ambayo midia haifai kupakuliwa moja kwa moja. Midia itafaa kupakuliwa kwa mkono kwa profile hii. Profile ya aina hii hutumiwa zaidi katika M³ wakati wa shule za kitheokrasi, makusanyiko mzunguko, makusanyiko ya eneo na matukio mengine maalum.

Profile ya **Nyingine** haitumiwi kwa mikutano ya kawaida. **Kwa ajili ya matumizi ya mikutano ya kutaniko, tafadhali chagua _Kawaida_.**

:::

### Utafutaji wa kiotomatiki wa kutaniko {#automatic-congregation-lookup}

M³ itajaribu kutafuta ratiba, lugha na jina rasmi la kutaniko lako.

Ili kufanya hivyo, tumia kitufe cha **Tafuta Kutaniko** kando ya nafasi ya jina la kutaniko na ingiza angalau sehemu ya jina na mji wa kutaniko lako.

Kutaniko sahihi litakapo patikana na kuchaguliwa, M³ itajaribu kujaza habari nyingi iwezekanavyo, kama **jina** la kutaniko, **lugha ya mikutano**, na **siku na wakati wa mikutano**.

:::info Kidokezo

Mbinu hii hutumia habari kutoka kwa tovuti rasmi la Mashahidi wa Yehova.

:::

### Kuingiza habari ya kutaniko kwa mkono {#manual-entry-of-congregation-information}

Ikiwa mbinu ya kutafuta kutaniko haikupata kutaniko lako, unaweza kuingiza habari hizo zinazohitajika moja kwa moja. Programu itakuruhusu kukagua /au kuandika **jina** la kutaniko lako, **lugha ya mkutano**, na **siku na nyakati za mikutano**.

### Kupakua na kuhifadhi video kutoka kitabu cha nyimbo {#caching-videos-from-the-songbook}

Pia utapewa uwezo wa **kupakua video zote kutoka kwa kitabu cha wimbo**. Chaguo hili hupakua mapema video zote za kitabu cha nyimbo, na hivyo kupunguza muda unaochukua ili kupakua midia kwa ajili ya mikutano katika siku zijazo.

- **Faida:** Midia ya mkutano itapatikana kwa haraka zaidi.
- **Hasara:** Kiwango cha nafasi inayotumiwa itaongezeka kwa kiwango kikubwa, huenda hata kwa 5GB.

:::tip Kidokezo

Ikiwa mfumo wenu kwenu Jumba La Ufalme una nafasi, tunashauri kwamba **muwashe** chaguo hili ili kufanya utumiaji uwe rahisi.

:::

### Kuunganisha kwa OBS Studio (Si Lazima) {#obs-studio-integration-configuration}

Ikiwa Jumba lenu La Ufalme linatumia **OBS Studio** kwa ajili ya upeperushaji wa mikutano kwenye Zoom, M³ inaweza kuunganshwa na programu hiyo. Kwenye uratibu, unaweza kusanidi OBS Studio kwa kuingiza yafuatayo:

- **Port:** Nambari ya Port hutumiwa kuunganisha mfumo na OBS Studio kupitia Websocket plugin.
- **Password:** Neno siri hutumiwa ili kuunganisha mfumo na OBS Studio kupitia Websocket plugin.
- **Scenes:** Scene za OBS itatumiwa wakati wa kuonyesha midia. Utahitaji scene moja inayoonyesha scrini ya midia, na moja inayoonyesha jukwaa.

:::tip Kidokezo

Ikiwa kutaniko lako hufanya mikutano pamoja na zoom, **inashauriwa** muunganishe OBS Studio.

:::

## 3. Furahia kutumia M³ {#enjoy-using-m3}

Uratibu wa programu unapokamilika, M³ iko tayari kukusaidia kupanga na kuonyesha midia kwenye mikutano ya kutaniko. Furahia kutumia programu hii! :tada:
