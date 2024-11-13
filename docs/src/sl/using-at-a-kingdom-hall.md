# Uporaba M³ v kraljestveni dvorani {#using-m3-at-a-kingdom-hall}

Ta vodnik ti bo pomagal prenesti, namestiti in nastaviti **Meeting Media Manager (M³)** v kraljestveni dvorani. Za nemoteno nastavitev aplikacije za upravljanje multimedijske vsebine med občinskimi shodi sledi spodnjim korakom.

## 1. Prenesi in namesti {#download-and-install}

1. Obišči [spletno stran za prenos M³](https://github.com/sircharlo/meeting-media-manager/releases/latest).
2. Prenesi ustrezno različico za vaš operacijski sistem:
   - **Windows:**
     - Za večino sistemov Windows prenesi `meeting-media-manager-[VERSION]-x64.exe`.
     - Za starejše 32-bitne sisteme Windows prenesi `meeting-media-manager-[VERSION]-ia32.exe`.
   - **macOS:**
     - **Serija M (Apple Silicon)**: Prenesi `meeting-media-manager-[VERSION]-arm64.dmg`.
     - **Maci z Intelom**: prenesi `meeting-media-manager-[VERSION]-x64.dmg`.
   - **Linux:**
     - Prenesi `meeting-media-manager-[VERSION]-x86_64.AppImage`.
3. Odpri namestitveni program in sledi navodilom na zaslonu za namestitev programa M³.
4. Zaženi M³.
5. Sledi navodilom čarovnika za nastavitev.

### macOS only: Additional installation steps {#additional-steps-for-macos-users}

:::warning Opozorilo

This section only applies to macOS users.

:::

Due to Apple's security measures, a few additional steps are required to run the installed M³ app on modern macOS systems.

Run the following two commands in Terminal, modifying the path to M³ as needed:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Opozorilo

As a macOS user, you will need to follow these steps every time you install or update M³.

:::

:::info Pojasnilo

The first command _signs the application's code_. This is required to prevent M³ from being detected as a malicious application from an unknown developer.

The second command _removes the quarantine flag_ from the application. The quarantine flag is used to warn users about potentially malicious applications that have been downloaded from the internet.

:::

#### Alternative method {#alternative-method-for-macos-users}

If you are still unable to launch M³ after entering the two commands from the previous section, please try the following:

1. Odpri sistemske nastavitve macOS **Privacy & Security**.
2. Poišči vnos za M³ in klikni na gumb **Open Anyway**.
3. Nato te bo sistem znova opozoril in ti svetoval, da „tega ne odpiraj, če nisi prepričan, da gre za zaupanja vreden vir“. Klikni na **Open Anyway**.
4. Prikazalo se bo še eno opozorilo, v katerem boš moral za zagon aplikacije dokazati avtentičnost.
5. M³ bi se moral zdaj uspešno zagnati.

Če imaš po vseh teh korakih še vedno težave, prosimo [prijavi težavo na GitHubu](https://github.com/sircharlo/meeting-media-manager/issues/new). Pomagali ti bomo po svojih najboljših močeh.

### macOS only: Re-enabling website presentation after updates {#screen-sharing-issues}

:::warning Opozorilo

This section only applies to macOS users.

:::

Some macOS users have reported that website presentation no longer works after installing updates to M³.

If the media window is black when presenting the website after updating M³, try the following steps:

1. Odpri sistemske nastavitve macOS **Privacy & Security**.
2. Go to **Screen Recording**.
3. Select M³ in the list.
4. Click the `-` (minus) button to remove it.
5. Click the `+` (plus) button and select M³ from the Applications folder.
6. You may be prompted to relaunch M³ to apply the change.

After these steps, screen sharing should function as expected once again.

:::tip Namig

These steps are optional and can be skipped if you do not plan to use the website presentation feature. On the other hand, if you do plan to use the website presentation feature, it is recommended to follow these steps after every update to ensure the feature works as expected.

:::

## 2. Čarovnik za nastavitev {#configuration-wizard}

### Jezik uporabniškega vmesnika {#app-display-language}

Ob prvem zagonu programa M³ boš moral izbrati želeni **jezik uporabniškega vmesnika**. Izberi jezik, ki naj ga M³ uporablja za svoj vmesnik.

:::tip Namig

Ni nujno, da je to isti jezik kot jezik, v katerem bo M³ prenesel multimedijsko vsebino. Jezik za prenos multimedijske vsebine boš nastavil v enem od naslednjih korakov.

:::

### Vrsta profila {#profile-type}

V naslednjem koraku je treba izbrati **vrsto profila**. Za običajno namestitev v kraljestveni dvorani izberi možnost **Običajno**. Tako boš nastavil številne funkcije, ki se običajno uporabljajo za občinske shode.

:::warning Opozorilo

Možnost **Drugo** izberi le, če ustvarjaš profil, pri katerem se multimedijska vsebina ne sme samodejno prenašati. Pri tem profilu bo treba multimedijsko vsebino uvoziti ročno. Ta vrsta profila se večinoma uporablja za uporabo M³ med teokratičnimi šolami, zbori, zborovanji in drugimi posebnimi dogodki.

Profil **Drugo** se redko uporablja. **Za običajno uporabo med občinskimi shodi izberi možnost _Običajno_.**

:::

### Samodejno iskanje občine {#automatic-congregation-lookup}

M³ lahko poskuša samodejno poiskati urnik, jezik in ime vaših občinskih shodov.

Za to klikni na gumb **Iskanje občine** poleg polja z imenom občine in vnesi vsaj del imena občine in mesto.

Ko boš našel in izbral pravo občino, bo M³ predizpolnil vse razpoložljive informacije, kot so **ime** vaše občine, **jezik shodov** ter **dnevi in ure shodov**.

:::info Opomba

Iskalnik uporablja javno dostopne podatke z uradnega spletnega mesta Jehovovih prič.

:::

### Ročni vnos podatkov o občini {#manual-entry-of-congregation-information}

Če s samodejnim iskanjem ni bilo mogoče najti vaše občine, lahko zahtevane podatke seveda vneseš ročno. Čarovnik za nastavitev ti bo omogočil, da pregledaš in/ali vneseš **ime** vaše občine, **jezik shodov** ter **dneve in ure shodov**.

### Predpomnjenje videoposnetkov iz pesmarice {#caching-videos-from-the-songbook}

Na voljo bo tudi možnost **predpomnjenja vseh videoposnetkov iz pesmarice**. Ta možnost vnaprej prenese vse videoposnetke iz pesmarice in tako v prihodnje skrajša čas, potreben za prenašanje multimedijskih datotek za shode.

- **Prednosti:** Multimedijska vsebina za shode bo na voljo veliko hitreje.
- **Slabosti:** Velikost multimedijskega predpomnilnika se bo znatno povečala, in sicer za približno 5 GB.

:::tip Namig

Če ima vaša kraljestvena dvorana dovolj prostora za shranjevanje, je priporočljivo, da to možnost **vključite** zaradi učinkovitosti in boljšega delovanja.

:::

### Nastavitev povezave s programom OBS Studio (neobvezno) {#obs-studio-integration-configuration}

Če v vaši kraljestveni dvorani uporabljate **OBS Studio** za prenašanje hibridnih shodov prek Zooma, se lahko M³ samodejno poveže s tem programom. Med namestitvijo lahko nastaviš povezavo s programom OBS Studio tako, da vneseš naslednje podatke:

- **Port (vrata):** Številka vrat, ki se uporablja za povezavo z vtičnikom OBS Studio Websocket.
- **Password (geslo):** Geslo, ki se uporablja za povezavo z vtičnikom OBS Studio Websocket.
- **Scenes (prizori):** OBS-prizori, ki se bodo uporabljali med predstavitvijo multimedijske vsebine. Potrebujete en prizor, ki zajema multimedijsko okno ali zaslon, in en prizor, ki prikazuje oder.

:::tip Namig

Če v vaši občini redno potekajo hibridni shodi, je **zelo** priporočljivo, da omogočite povezavo s programom OBS Studio.

:::

## 3. Uživaj v uporabi M³ {#enjoy-using-m3}

Ko boš končal z nastavitvami, je M³ pripravljen za upravljanje in predstavljanje multimedijske vsebine na občinskih shodih. Uživaj v uporabi programa! :tada:
