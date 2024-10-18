# Använda M³ i Rikets sal

Denna guide kommer att gå igenom processen för nedladdning och installation av **Meeting Media Manager (M³)** i Rikets sal. Följ stegen för att säkerställa en smidig installation för att hantera media.

## 1. Ladda ner och installera

1. Besök [M³ nedladdningssida](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Ladda ner lämplig version för ditt operativsystem (Windows, macOS eller Linux).
3. Öppna installationsprogrammet och följ instruktionerna på skärmen för att installera M³.
4. Starta M³.
5. Gå igenom konfigurationsguiden.

## 2) Konfigurationsguide

### Programspråk

När du startar M³ för första gången blir du ombedd att välja ditt **visningsspråk**. Välj vilket språk du vill att M³ ska använda för sitt gränssnitt.

:::tip Tips

Detta behöver inte vara samma språk som det M³ kommer att ladda ner media på. Språket för mediahämtningar ställs in i ett senare steg.

:::

### Profiltyp

Nästa steg är att välja en **profiltyp**. För en vanlig installation i Rikets sal, välj **vanlig**. Detta kommer att konfigurera många funktioner som ofta används för församlingsmöten.

:::warning Varning

Du bör bara välja **Annat** om du skapar en profil där ingen media automatiskt ska laddas ner. Media måste importeras manuellt för användning i denna profil. Denna typ av profil används främst för att använda M³ under teokratiska skolor, sammankomster och andra specialevenemang.

Profiltypen **Annat** används sällan. **För normal användning, vänligen välj _Vanlig_.**

:::

### Automatisk församlingssökning

M³ kan försöka att automatiskt hitta församlingens mötesschema, språk och namn.

För att göra det, använd **Församlingssök** knappen bredvid församlingens namnfält och ange åtminstone en del av församlingens namn och ort.

När korrekt församling hittas och väljs kommer M³ att förfylla all tillgänglig information, såsom din församlings **namn**, **mötesspråk**, och **mötesdagar och tider**.

:::info Info

Denna sökning använder allmänt tillgängliga data från Jehovas vittnens officiella webbplats.

:::

### Manuell inmatning av församlingsinformation

Om den automatiska sökningen inte hittade din församling kan du naturligtvis manuellt ange informationen. Guiden ger dig möjlighet att granska och/eller ange församlingens **namn**, **mötesspråk**, och **mötesdagar och tider**.

### Cachning av videor från sångboken

Du kommer också att få möjlighet att **cacha alla videor från sångboken**. Det här alternativet hämtar ner alla sångboksvideor, vilket minskar den tid det tar att hämta media för möten i framtiden.

- **Fördel:** Mötesmedia kommer att vara tillgängligt mycket snabbare.
- **Nackdel:** Storleken på mediacachen kommer att öka betydligt, med cirka 5 Gb.

:::tip Tips

Om din Rikets sal har tillräckligt med lagringsutrymme rekommenderas att **aktivera** detta alternativ för bättre effektivitet och upplevd prestanda.

:::

### OBS Studio Integration (valfritt)

Om din Rikets sal använder **OBS Studio** för att sända hybridmöten över Zoom kan M³ automatiskt integreras med det programmet. Under installationen kan du konfigurera OBS Studio genom att ange följande:

- **Port:** Portnumret som används för att ansluta till pluginen OBS Studio Websocket.
- **Lösenord:** Lösenordet som används för att ansluta till pluginen OBS Studio Websocket.
- **Scener:** OBS-scenerna som kommer att användas under mediepresentationer. Du behöver en scen som fångar mediafönstret eller skärmen, och en som visar scenen.

:::tip Tips

Om din församling regelbundet använder hybridmöten rekommenderas **varmt** att aktivera integrationen med OBS Studio.

:::

## 3. Njut av M³

När installationsguiden är klar är M³ redo att hjälpa till att hantera och presentera media för församlingens möten. Lycka till med appen! :tada:
