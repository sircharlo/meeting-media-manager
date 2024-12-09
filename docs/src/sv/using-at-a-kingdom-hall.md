<!-- markdownlint-disable no-inline-html -->

# Att använda M³ i Rikets sal {#using-m3-at-a-kingdom-hall}

Denna guide kommer att gå igenom processen för nedladdning och installation av **Meeting Media Manager (M³)** i Rikets sal. Följ stegen för att säkerställa en smidig installation för att hantera media.

## 1. Ladda ned och installera {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. Ladda ned lämplig version för ditt operativsystem:
   - **Windows:**
     - För de flesta Windows-versionerna, ladda ned <a :href="data.win64">meeting-media-manager-[VERSION]-x64.exe</a>.
     - För äldre 32-bitars Windows, ladda ned <a :href="data.win32">meeting-media-manager-[VERSION]-ia32.exe</a>.
     - För en portabel version, ladda ner <a :href="data.winPortable">meeting-media-manager-[VERSION]-portable.exe</a>.
   - **macOS:**
     - **M-serien (Apple Silicon)**: Ladda ned <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a>.
     - **Intel-baserad Mac**: Ladda ned <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a>.
   - **Linux:**
     - Ladda ned <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a>.
2. Om nedladdningslänkarna inte fungerar, besök [M³ nedladdningssida](https://github.com/sircharlo/meeting-media-manager/releases/latest) och ladda ned rätt version manuellt.
3. Öppna installationsprogrammet och följ instruktionerna på skärmen för att installera M³.
4. Starta M³.
5. Gå igenom konfigurationsguiden.

### macOS endast: Ytterligare installationssteg {#additional-steps-for-macos-users}

:::warning Varning

Detta avsnitt gäller endast macOS-användare.

:::

På grund av Apples säkerhetsåtgärder krävs ytterligare några steg för att använda M³ på moderna macOS-system.

Kör först följande två kommandon i Terminal, ändra sökvägen till M³ efter behov:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Varning

Som macOS-användare måste du följa dessa steg varje gång du installerar eller uppdaterar M³.

:::

:::info Förklaring

Det första kommandot _signerar programmets kod_. Detta krävs för att förhindra att M³ tas som ett illasinnat program från en okänd utvecklare.

Det andra kommandot _tar bort karantänflaggan_ från programmet. Karantänsflaggan används för att varna användare om program som har laddats ned från internet.

:::

#### Alternativ metod {#alternative-method-for-macos-users}

Om du fortfarande inte kan starta M³ efter att du har angett de två kommandona kan du prova följande:

1. Öppna macOS systemet **Sekretess och säkerhet** inställningar.
2. Hitta posten för M³ och klicka på knappen till **Öppna ändå**.
3. Du kommer då att bli varnad igen, och ges rådet att inte "öppna detta om du inte är säker på att det är från en pålitlig källa". Klicka **Öppna ändå**.
4. En annan varning visas, där du måste autentisera för att starta appen.
5. M³ bör nu kunna startas.

Om du fortfarande har problem efter att ha följt alla dessa steg, vänligen [öppna en Issue på GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). Vi kommer att göra vårt bästa för att hjälpa till.

### macOS endast: Återaktivera webbpresentation efter uppdateringar {#screen-sharing-issues}

:::warning Varning

Detta avsnitt gäller endast macOS-användare.

:::

Vissa macOS användare har rapporterat att webbplatsens presentation inte längre fungerar efter att ha installerat uppdateringar till M³.

Om mediafönstret är svart när du presenterar webbplatsen efter att ha uppdaterat M³, prova följande steg:

1. Öppna macOS systemet **Sekretess och säkerhet** inställningar.
2. Gå till **Skärminspelning**.
3. Välj M³ i listan.
4. Klicka på `-` (minus) knappen för att ta bort den.
5. Klicka på `+` (plus) knappen och välj M³ från mappen Program.
6. Du kan bli ombedd att starta om M³ för att tillämpa ändringen.

Efter dessa steg bör skärmdelning fungera som vanligt igen.

:::tip Tips

Dessa steg är valfria och kan hoppas över om du inte planerar att använda webbplatsens presentationsfunktion. Å andra sidan, om du planerar att använda webbplatsen presentationsfunktionen, det rekommenderas att följa dessa steg efter varje uppdatering för att säkerställa att funktionen fungerar som förväntat.

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
