# Uporaba M³ v kraljestveni dvorani

Ta vodnik ti bo pomagal prenesti, namestiti in nastaviti **Meeting Media Manager (M³)** v kraljestveni dvorani. Za nemoteno nastavitev aplikacije za upravljanje multimedijske vsebine med občinskimi shodi sledi spodnjim korakom.

## 1. Prenesi in namesti

1. Obišči [spletno stran za prenos M³](https://github.com/sircharlo/meeting-media-manager/releases/latest).
2. Download the appropriate version for your operating system:
   - **Windows:**
     - For most Windows systems, download `meeting-media-manager-[VERSION]-x64.exe`.
     - For older 32-bit Windows systems, download `meeting-media-manager-[VERSION]-ia32.exe`.
   - **macOS:**
     - **M-series (Apple Silicon)**: Download `meeting-media-manager-[VERSION]-arm64.dmg`.
     - **Intel-based Macs**: Download `meeting-media-manager-[VERSION]-x64.dmg`.
   - **Linux:**
     - Download `meeting-media-manager-[VERSION]-x86_64.AppImage`.
3. Odpri namestitveni program in sledi navodilom na zaslonu za namestitev programa M³.
4. Zaženi M³.
5. Sledi navodilom čarovnika za nastavitev.

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

## 2. Čarovnik za nastavitev {#configuration-wizard}

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

Za to klikni na gumb **Iskanje občine** poleg polja z imenom občine in vnesi vsaj del imena občine in mesto.

Ko boš našel in izbral pravo občino, bo M³ predizpolnil vse razpoložljive informacije, kot so **ime** vaše občine, **jezik shodov** ter **dnevi in ure shodov**.

:::info Opomba

Iskalnik uporablja javno dostopne podatke z uradnega spletnega mesta Jehovovih prič.

:::

### Ročni vnos podatkov o občini

Če s samodejnim iskanjem ni bilo mogoče najti vaše občine, lahko zahtevane podatke seveda vneseš ročno. Čarovnik za nastavitev ti bo omogočil, da pregledaš in/ali vneseš **ime** vaše občine, **jezik shodov** ter **dneve in ure shodov**.

### Predpomnjenje videoposnetkov iz pesmarice

Na voljo bo tudi možnost **predpomnjenja vseh videoposnetkov iz pesmarice**. Ta možnost vnaprej prenese vse videoposnetke iz pesmarice in tako v prihodnje skrajša čas, potreben za prenašanje multimedijskih datotek za shode.

- **Prednosti:** Multimedijska vsebina za shode bo na voljo veliko hitreje.
- **Slabosti:** Velikost multimedijskega predpomnilnika se bo znatno povečala, in sicer za približno 5 GB.

:::tip Namig

Če ima vaša kraljestvena dvorana dovolj prostora za shranjevanje, je priporočljivo, da to možnost **vključite** zaradi učinkovitosti in boljšega delovanja.

:::

### Nastavitev povezave s programom OBS Studio (neobvezno)

Če v vaši kraljestveni dvorani uporabljate **OBS Studio** za prenašanje hibridnih shodov prek Zooma, se lahko M³ samodejno poveže s tem programom. Med namestitvijo lahko nastaviš povezavo s programom OBS Studio tako, da vneseš naslednje podatke:

- **Port (vrata):** Številka vrat, ki se uporablja za povezavo z vtičnikom OBS Studio Websocket.
- **Password (geslo):** Geslo, ki se uporablja za povezavo z vtičnikom OBS Studio Websocket.
- **Scenes (prizori):** OBS-prizori, ki se bodo uporabljali med predstavitvijo multimedijske vsebine. Potrebujete en prizor, ki zajema multimedijsko okno ali zaslon, in en prizor, ki prikazuje oder.

:::tip Namig

Če v vaši občini redno potekajo hibridni shodi, je **zelo** priporočljivo, da omogočite povezavo s programom OBS Studio.

:::

## 3. Uživaj v uporabi M³

Ko boš končal z nastavitvami, je M³ pripravljen za upravljanje in predstavljanje multimedijske vsebine na občinskih shodih. Uživaj v uporabi programa! :tada:
