# Kutumia M³ kwenye Mikutano

Mwongozo huu utakuelekeza kwenye hatua za kupakua na kuanzisha Meeting Media Manager (M³) kwenye Jumba La Ufalme. Fuata hatua ili kuhakikisha usanidi mzuri wa kusimamia media wakati wa mikutano ya kutaniko.

## 1. Pakua na sanikisha

1. Tembelea [M³ ukurasa wa kupakua](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Pakua toleo linalofaa kwa mfumo wako wa kompyuta (Windows, macOS, au Linux).
3. Fungua mfumo wa kupakua na ufuate maagizo ya kupakua M³ kwenye scrini.
4. Fungua M³.
5. Pitia programu ya usanidi.

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

## 2. Programu ya usanidi

### Lugha ya mfumo

Unapofungua M³ kwa mara ya kwanza, utaulizwa kuhusu lugha ya mfumo unaotaka. Chagua lugha ya mfumo unaotaka kutumia kwenye mfumo wa M³.

:::tip Kidokezo

Hii sio lazima iwe lugha sawa na ile ambayo M³ itapakua media. Lugha ya upakuaji wa media itasanidiwa katika hatua ya baadaye.

:::

### Aina ya profile

Hatua inayo fuata ni ya kuchagua **aina ya profaili**. Kwa ajili ya matumizi katika Jumba la Ufalme, chagua **Kawaida**. Hili litapanga mipangilio mingi ya kawaida ya matumizi katika mikutano.

:::warning Onyo

Unafaa kuchagua **Nyingine** ikiwa unatengeneza profile ambayo midia haifai kupakuliwa moja kwa moja. Midia itafaa kupakuliwa kwa mkono kwa profile hii. Profile ya aina hii hutumiwa zaidi katika M³ wakati wa shule za kitheokrasi, makusanyiko mzunguko, makusanyiko ya eneo na matukio mengine maalum.

Profile ya **Nyingine** haitumiwi kwa mikutano ya kawaida. **Kwa ajili ya matumizi ya mikutano ya kutaniko, tafadhali chagua _Kawaida_.**

:::

### Tafuta kutaniko lako

M³ itajaribu kutafuta ratiba, lugha na jina rasmi la kutaniko lako.

Ili kufanya hivyo, tumia kitufe cha **Tafuta Kutaniko** kando ya nafasi ya jina la kutaniko na ingiza angalau sehemu ya jina na mji wa kutaniko lako.

Kutaniko sahihi litakapo patikana na kuchaguliwa, M³ itajaribu kujaza habari nyingi iwezekanavyo, kama **jina** la kutaniko, **lugha ya mikutano**, na **siku na wakati wa mikutano**.

:::info Kidokezo

Mbinu hii hutumia habari kutoka kwa tovuti rasmi la Mashahidi wa Yehova.

:::

### Kuingiza habari ya kutaniko kwa mkono

Ikiwa mbinu ya kutafuta kutaniko haikupata kutaniko lako, unaweza kuingiza habari hizo zinazohitajika moja kwa moja. Programu itakuruhusu kukagua /au kuandika **jina** la kutaniko lako, **lugha ya mkutano**, na **siku na nyakati za mikutano**.

### Kupakua video kutoka kwa kitabu cha wimbo

Pia utapewa uwezo wa **kupakua video zote kutoka kwa kitabu cha wimbo**. Chaguo hili hupakua mapema video zote za kitabu cha nyimbo, na hivyo kupunguza muda unaochukua ili kupakua midia kwa ajili ya mikutano katika siku zijazo.

- **Faida:** Midia ya mkutano itapatikana kwa haraka zaidi.
- **Hasara:** Kiwango cha nafasi inayotumiwa itaongezeka kwa kiwango kikubwa, huenda hata kwa 5GB.

:::tip Kidokezo

Ikiwa mfumo wenu kwenu Jumba La Ufalme una nafasi, tunashauri kwamba **muwashe** chaguo hili ili kufanya utumiaji uwe rahisi.

:::

### Usanidi wa Studio ya OBS (Si lazima)

Ikiwa Jumba lenu La Ufalme linatumia **OBS Studio** kwa ajili ya upeperushaji wa mikutano kwenye Zoom, M³ inaweza kuunganshwa na programu hiyo. Kwenye uratibu, unaweza kusanidi OBS Studio kwa kuingiza yafuatayo:

- **Port:** Nambari ya Port hutumiwa kuunganisha mfumo na OBS Studio kupitia Websocket plugin.
- **Password:** Neno siri hutumiwa ili kuunganisha mfumo na OBS Studio kupitia Websocket plugin.
- **Scenes:** Scene za OBS itatumiwa wakati wa kuonyesha midia. Utahitaji scene moja inayoonyesha scrini ya midia, na moja inayoonyesha jukwaa.

:::tip Kidokezo

Ikiwa kutaniko lako hufanya mikutano pamoja na zoom, **inashauriwa** muunganishe OBS Studio.

:::

## 3. Furahia kutumia M³

Uratibu wa programu unapokamilika, M³ iko tayari kukusaidia kupanga na kuonyesha midia kwenye mikutano ya kutaniko. Furahia kutumia programu hii! :tada:
