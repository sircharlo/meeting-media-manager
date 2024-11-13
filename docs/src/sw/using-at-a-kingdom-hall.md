# Kutumia M³ kwenye Jumba la ufalme {#using-m3-at-a-kingdom-hall}

Mwongozo huu utakuelekeza kwenye hatua za kupakua na kuanzisha Meeting Media Manager (M³) kwenye Jumba La Ufalme. Fuata hatua ili kuhakikisha usanidi mzuri wa kusimamia media wakati wa mikutano ya kutaniko.

## 1. Pakua na usakinishe {#download-and-install}

1. Tembelea [M³ ukurasa wa kupakua](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Pakua aina ambayo inafaa mfumo wa kopyuta yako:
   - **Windows:**
     - Kwa mifumo mingi ya Windows, pakua `meeting-media-manager-[VERSION]-x64.exe`.
     - Kwa mifumo ya kitambo ya 32-bit Windows, pakua `meeting-media-manager-[VERSION]-ia32.exe`.
   - **macOS:**
     - **M-series (Apple Silicon)**: Pakua `meeting-media-manager-[VERSION]-arm64.dmg`.
     - **Intel-based Macs**: Pakua `meeting-media-manager-[VERSION]-x64.dmg`.
   - **Linux:**
     - Pakua `meeting-media-manager-[VERSION]-x86_64.AppImage`.
3. Fungua mfumo wa kupakua na ufuate maagizo ya kupakua M³ kwenye scrini.
4. Fungua M³.
5. Pitia programu ya usanidi.

### macOS only: Additional installation steps {#additional-steps-for-macos-users}

:::warning Onyo

This section only applies to macOS users.

:::

Due to Apple's security measures, a few additional steps are required to run the installed M³ app on modern macOS systems.

Run the following two commands in Terminal, modifying the path to M³ as needed:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Onyo

As a macOS user, you will need to follow these steps every time you install or update M³.

:::

:::info Maelezo

The first command _signs the application's code_. This is required to prevent M³ from being detected as a malicious application from an unknown developer.

The second command _removes the quarantine flag_ from the application. The quarantine flag is used to warn users about potentially malicious applications that have been downloaded from the internet.

:::

#### Alternative method {#alternative-method-for-macos-users}

If you are still unable to launch M³ after entering the two commands from the previous section, please try the following:

1. Kufungua mipangilio ya **Privacy & Security** kwenye mfumo wako wa macOS.
2. Tafuta ingizo(entry) la M³ na ubofye kitufe **Open Anyway**.
3. Kisha utaonywa tena, na kupewa ushauri wa "kutofungua hii isipokuwa una hakika kuwa imetoka kwa chanzo cha kuaminika." Bonyeza **Open Anyway**.
4. Onyo lingine litaonekana, ambapo utahitaji kuthibitisha ili kuzindua programu.
5. M³ sasa inapaswa kuzindua kwa mafanikio.

Ikiwa bado ukona tatizo hata baada ya kufuata hatua hizo, tafadhali [fungua tatizo(issue) kwenye Github](https://github.com/sircharlo/meeting-media-manager/issues/new). Tutafanya yote tuwezayo kukusaidia.

### macOS only: Re-enabling website presentation after updates {#screen-sharing-issues}

:::warning Onyo

This section only applies to macOS users.

:::

Some macOS users have reported that website presentation no longer works after installing updates to M³.

If the media window is black when presenting the website after updating M³, try the following steps:

1. Kufungua mipangilio ya **Privacy & Security** kwenye mfumo wako wa macOS.
2. Go to **Screen Recording**.
3. Select M³ in the list.
4. Click the `-` (minus) button to remove it.
5. Click the `+` (plus) button and select M³ from the Applications folder.
6. You may be prompted to relaunch M³ to apply the change.

After these steps, screen sharing should function as expected once again.

:::tip Kidokezo

These steps are optional and can be skipped if you do not plan to use the website presentation feature. On the other hand, if you do plan to use the website presentation feature, it is recommended to follow these steps after every update to ensure the feature works as expected.

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
