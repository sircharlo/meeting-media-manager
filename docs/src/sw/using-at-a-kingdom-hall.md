# Kutumia M³ kwenye Jumba la ufalme {#using-m3-at-a-kingdom-hall}

Mwongozo huu utakuelekeza kwenye hatua za kupakua na kuanzisha Meeting Media Manager (M³) kwenye Jumba La Ufalme. Fuata hatua ili kuhakikisha usanidi mzuri wa kusimamia media wakati wa mikutano ya kutaniko.

## 1. Pakua na usakinishe {#download-and-install}

1. Tembelea [M³ ukurasa wa kupakua](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Pakua aina ambayo inafaa mfumo wa kopyuta yako:
   - **Windows:**
     - For most Windows systems, download `meeting-media-manager-[VERSION]-x64.exe`.
     - For older 32-bit Windows systems, download `meeting-media-manager-[VERSION]-ia32.exe`.
   - **macOS:**
     - **M-series (Apple Silicon)**: Download `meeting-media-manager-[VERSION]-arm64.dmg`.
     - **Intel-based Macs**: Download `meeting-media-manager-[VERSION]-x64.dmg`.
   - **Linux:**
     - Download `meeting-media-manager-[VERSION]-x86_64.AppImage`.
3. Fungua mfumo wa kupakua na ufuate maagizo ya kupakua M³ kwenye scrini.
4. Fungua M³.
5. Pitia programu ya usanidi.

### Additional steps for macOS Users {#additional-steps-for-macos-users}

Kutokana na hatua za usalama za mfumo wa Apple, hatua za ziada zitahitajika ili kutumia M³ kwenye mifumo za hivi karibuni za macOS.

Kwanza, wasilisha amri hizi mbili kwenye Terminal (rekebisha njia ya M³ inavyohitajika):

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::tip Maelezo

Amri hizi hufanya vitu viwili ambazo huzuia M³ kutoonekana kama mfumo hatari kwenye kompyuta yako: ya kwanza husaini code ya programu ndani ya mfumo wako, na ya pili hutoa bendera ya quarantine kutoka kwenye mfumo. Bendera hiyo ya quarantine hujulisha watu kuhusu mifumo au programu zinazopakuliwa kutoka kwa intaneti.

:::

Ikiwa bado huwezi kuwasha M³ baada ya kuweka amri hizo mbili, tafadhali jaribu:

1. Kufungua mipangilio ya **Privacy & Security** kwenye mfumo wako wa macOS.
2. Tafuta ingizo(entry) la M³ na ubofye kitufe **Open Anyway**.
3. Kisha utaonywa tena, na kupewa ushauri wa "kutofungua hii isipokuwa una hakika kuwa imetoka kwa chanzo cha kuaminika." Bonyeza **Open Anyway**.
4. Onyo lingine litaonekana, ambapo utahitaji kuthibitisha ili kuzindua programu.
5. M³ sasa inapaswa kuzindua kwa mafanikio.

Ikiwa bado ukona tatizo hata baada ya kufuata hatua hizo, tafadhali [fungua tatizo(issue) kwenye Github](https://github.com/sircharlo/meeting-media-manager/issues/new). Tutafanya yote tuwezayo kukusaidia.

## 2. Configuration wizard {#configuration-wizard}

### App display language {#app-display-language}

Unapofungua M³ kwa mara ya kwanza, utaulizwa kuhusu lugha ya mfumo unaotaka. Chagua lugha ya mfumo unaotaka kutumia kwenye mfumo wa M³.

:::tip Kidokezo

Hii sio lazima iwe lugha sawa na ile ambayo M³ itapakua media. Lugha ya upakuaji wa media itasanidiwa katika hatua ya baadaye.

:::

### Profile type {#profile-type}

Hatua inayo fuata ni ya kuchagua **aina ya profaili**. Kwa ajili ya matumizi katika Jumba la Ufalme, chagua **Kawaida**. Hili litapanga mipangilio mingi ya kawaida ya matumizi katika mikutano.

:::warning Onyo

Unafaa kuchagua **Nyingine** ikiwa unatengeneza profile ambayo midia haifai kupakuliwa moja kwa moja. Midia itafaa kupakuliwa kwa mkono kwa profile hii. Profile ya aina hii hutumiwa zaidi katika M³ wakati wa shule za kitheokrasi, makusanyiko mzunguko, makusanyiko ya eneo na matukio mengine maalum.

Profile ya **Nyingine** haitumiwi kwa mikutano ya kawaida. **Kwa ajili ya matumizi ya mikutano ya kutaniko, tafadhali chagua _Kawaida_.**

:::

### Automatic congregation lookup {#automatic-congregation-lookup}

M³ itajaribu kutafuta ratiba, lugha na jina rasmi la kutaniko lako.

Ili kufanya hivyo, tumia kitufe cha **Tafuta Kutaniko** kando ya nafasi ya jina la kutaniko na ingiza angalau sehemu ya jina na mji wa kutaniko lako.

Kutaniko sahihi litakapo patikana na kuchaguliwa, M³ itajaribu kujaza habari nyingi iwezekanavyo, kama **jina** la kutaniko, **lugha ya mikutano**, na **siku na wakati wa mikutano**.

:::info Kidokezo

Mbinu hii hutumia habari kutoka kwa tovuti rasmi la Mashahidi wa Yehova.

:::

### Manual entry of congregation information {#manual-entry-of-congregation-information}

Ikiwa mbinu ya kutafuta kutaniko haikupata kutaniko lako, unaweza kuingiza habari hizo zinazohitajika moja kwa moja. Programu itakuruhusu kukagua /au kuandika **jina** la kutaniko lako, **lugha ya mkutano**, na **siku na nyakati za mikutano**.

### Caching videos from the songbook {#caching-videos-from-the-songbook}

Pia utapewa uwezo wa **kupakua video zote kutoka kwa kitabu cha wimbo**. Chaguo hili hupakua mapema video zote za kitabu cha nyimbo, na hivyo kupunguza muda unaochukua ili kupakua midia kwa ajili ya mikutano katika siku zijazo.

- **Faida:** Midia ya mkutano itapatikana kwa haraka zaidi.
- **Hasara:** Kiwango cha nafasi inayotumiwa itaongezeka kwa kiwango kikubwa, huenda hata kwa 5GB.

:::tip Kidokezo

Ikiwa mfumo wenu kwenu Jumba La Ufalme una nafasi, tunashauri kwamba **muwashe** chaguo hili ili kufanya utumiaji uwe rahisi.

:::

### OBS Studio Integration Configuration (Optional) {#obs-studio-integration-configuration}

Ikiwa Jumba lenu La Ufalme linatumia **OBS Studio** kwa ajili ya upeperushaji wa mikutano kwenye Zoom, M³ inaweza kuunganshwa na programu hiyo. Kwenye uratibu, unaweza kusanidi OBS Studio kwa kuingiza yafuatayo:

- **Port:** Nambari ya Port hutumiwa kuunganisha mfumo na OBS Studio kupitia Websocket plugin.
- **Password:** Neno siri hutumiwa ili kuunganisha mfumo na OBS Studio kupitia Websocket plugin.
- **Scenes:** Scene za OBS itatumiwa wakati wa kuonyesha midia. Utahitaji scene moja inayoonyesha scrini ya midia, na moja inayoonyesha jukwaa.

:::tip Kidokezo

Ikiwa kutaniko lako hufanya mikutano pamoja na zoom, **inashauriwa** muunganishe OBS Studio.

:::

## 3. Enjoy using M³ {#enjoy-using-m3}

Uratibu wa programu unapokamilika, M³ iko tayari kukusaidia kupanga na kuonyesha midia kwenye mikutano ya kutaniko. Furahia kutumia programu hii! :tada:
