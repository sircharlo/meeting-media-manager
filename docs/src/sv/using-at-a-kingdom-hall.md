# Att använda M³ i Rikets sal {#using-m3-at-a-kingdom-hall}

Denna guide kommer att gå igenom processen för nedladdning och installation av **Meeting Media Manager (M³)** i Rikets sal. Följ stegen för att säkerställa en smidig installation för att hantera media.

## 1. Ladda ner och installera {#download-and-install}

1. Besök [M³ nedladdningssida](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Ladda ner lämplig version för ditt operativsystem:
   - **Windows:**
     - För de flesta Windows-system, ladda ner `meeting-media-manager-[VERSION]-x64.exe`.
     - För äldre 32-bitars Windows-system, ladda ner `meeting-media-manager-[VERSION]-ia32.exe`.
   - **macOS:**
     - **M-serien (Apple Silicon)**: Ladda ner `meeting-media-manager-[VERSION]-arm64.dmg`.
     - **Intel-baserad Mac**: Ladda ner `meeting-media-manager-[VERSION]-x64.dmg`.
   - **Linux:**
     - Ladda ner `meeting-media-manager-[VERSION]-x86_64.AppImage`.
3. Öppna installationsprogrammet och följ instruktionerna på skärmen för att installera M³.
4. Starta M³.
5. Gå igenom konfigurationsguiden.

### macOS only: Additional installation steps {#additional-steps-for-macos-users}

:::warning Varning

This section only applies to macOS users.

:::

Due to Apple's security measures, a few additional steps are required to run the installed M³ app on modern macOS systems.

Run the following two commands in Terminal, modifying the path to M³ as needed:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Varning

As a macOS user, you will need to follow these steps every time you install or update M³.

:::

:::info Förklaring

The first command _signs the application's code_. This is required to prevent M³ from being detected as a malicious application from an unknown developer.

The second command _removes the quarantine flag_ from the application. The quarantine flag is used to warn users about potentially malicious applications that have been downloaded from the internet.

:::

#### Alternative method {#alternative-method-for-macos-users}

If you are still unable to launch M³ after entering the two commands from the previous section, please try the following:

1. Öppna macOS systemet **Sekretess och säkerhet** inställningar.
2. Hitta posten för M³ och klicka på knappen till **Öppna ändå**.
3. Du kommer då att bli varnad igen, och ges rådet att inte "öppna detta om du inte är säker på att det är från en pålitlig källa". Klicka **Öppna ändå**.
4. En annan varning visas, där du måste autentisera för att starta appen.
5. M³ bör nu kunna startas.

Om du fortfarande har problem efter att ha följt alla dessa steg, vänligen [öppna en Issue på GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). Vi kommer att göra vårt bästa för att hjälpa till.

### macOS only: Re-enabling website presentation after updates {#screen-sharing-issues}

:::warning Varning

This section only applies to macOS users.

:::

Some macOS users have reported that website presentation no longer works after installing updates to M³.

If the media window is black when presenting the website after updating M³, try the following steps:

1. Öppna macOS systemet **Sekretess och säkerhet** inställningar.
2. Go to **Screen Recording**.
3. Select M³ in the list.
4. Click the `-` (minus) button to remove it.
5. Click the `+` (plus) button and select M³ from the Applications folder.
6. You may be prompted to relaunch M³ to apply the change.

After these steps, screen sharing should function as expected once again.

:::tip Tips

These steps are optional and can be skipped if you do not plan to use the website presentation feature. On the other hand, if you do plan to use the website presentation feature, it is recommended to follow these steps after every update to ensure the feature works as expected.

:::

## 2. Konfigurationsguide {#configuration-wizard}

### Appens visningsspråk {#app-display-language}

När du startar M³ för första gången blir du ombedd att välja ditt **visningsspråk**. Välj vilket språk du vill att M³ ska använda för sitt gränssnitt.

:::tip Tips

Detta behöver inte vara samma språk som det M³ kommer att ladda ner media på. Språket för mediahämtningar ställs in i ett senare steg.

:::

### Profiltyp {#profile-type}

Nästa steg är att välja en **profiltyp**. För en vanlig installation i Rikets sal, välj **vanlig**. Detta kommer att konfigurera många funktioner som ofta används för församlingsmöten.

:::warning Varning

Du bör bara välja **Annat** om du skapar en profil där ingen media automatiskt ska laddas ner. Media måste importeras manuellt för användning i denna profil. Denna typ av profil används främst för att använda M³ under teokratiska skolor, sammankomster och andra specialevenemang.

Profiltypen **Annat** används sällan. **För normal användning, vänligen välj _Vanlig_.**

:::

### Automatisk församlingssökning {#automatic-congregation-lookup}

M³ kan försöka att automatiskt hitta församlingens mötesschema, språk och namn.

För att göra det, använd **Församlingssök** knappen bredvid församlingens namnfält och ange åtminstone en del av församlingens namn och ort.

När korrekt församling hittas och väljs kommer M³ att förfylla all tillgänglig information, såsom din församlings **namn**, **mötesspråk**, och **mötesdagar och tider**.

:::info Info

Denna sökning använder allmänt tillgängliga data från Jehovas vittnens officiella webbplats.

:::

### Manuell inmatning av församlingsinformation {#manual-entry-of-congregation-information}

Om den automatiska sökningen inte hittade din församling kan du naturligtvis manuellt ange informationen. Guiden ger dig möjlighet att granska och/eller ange församlingens **namn**, **mötesspråk**, och **mötesdagar och tider**.

### Cacha videor från sångboken{#caching-videos-from-the-songbook}

Du kommer också att få möjlighet att **cacha alla videor från sångboken**. Det här alternativet hämtar ner alla sångboksvideor, vilket minskar den tid det tar att hämta media för möten i framtiden.

- **Fördel:** Mötesmedia kommer att vara tillgängligt mycket snabbare.
- **Nackdel:** Storleken på mediacachen kommer att öka betydligt, med cirka 5 Gb.

:::tip Tips

Om din Rikets sal har tillräckligt med lagringsutrymme rekommenderas att **aktivera** detta alternativ för bättre effektivitet och upplevd prestanda.

:::

### OBS Studio Integration konfiguration (valfritt) {#obs-studio-integration-configuration}

Om din Rikets sal använder **OBS Studio** för att sända hybridmöten över Zoom kan M³ automatiskt integreras med det programmet. Under installationen kan du konfigurera OBS Studio genom att ange följande:

- **Port:** Portnumret som används för att ansluta till pluginen OBS Studio Websocket.
- **Lösenord:** Lösenordet som används för att ansluta till pluginen OBS Studio Websocket.
- **Scener:** OBS-scenerna som kommer att användas under mediepresentationer. Du behöver en scen som fångar mediafönstret eller skärmen, och en som visar scenen.

:::tip Tips

Om din församling regelbundet använder hybridmöten rekommenderas **varmt** att aktivera integrationen med OBS Studio.

:::

## 3. Njut av M³ {#enjoy-using-m3}

När installationsguiden är klar är M³ redo att hjälpa till att hantera och presentera media för församlingens möten. Lycka till med appen! :tada:
