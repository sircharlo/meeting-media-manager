---
tag: Usage
title: Mediapresentationsläge
ref: present-media
---

### Använda mediapresentationsläge

Mediepresentationen och kontrolllägena är designade för enkelhet och för att förhindra misstag under möten.

När alternativet `Visa media på en extern skärm eller i ett separat fönster` är aktiverat, kommer mediapresentationsskärmen automatiskt att visas på den externa monitorn om den finns, eller i ett separat, dragbart och storleksändringsbart fönster om ingen extern monitor upptäcktes.

I standby-läge kommer mediepresentationsskärmen att visa bakgrundsbilden som är konfigurerad i inställningarna. Om ingen bakgrundsbild har konfigurerats kommer M³ att försöka hämta och visa årstexten automatiskt.

Om ingen bakgrundsbild är konfigurerad i inställningarna och årstexten inte kunde laddas automatiskt, kommer en svart bakgrund att visas i standbyläge.

Mediekontrollläget kan nås genom att klicka på knappen ▶️ (spela upp) på huvudskärmen i M³, eller genom att använda kortkommandot <kbd>Alt D</kbd> (för extern skärm).

När du väl har gått in i kontrollläget låter skärmen för val av mapp dig välja vilket datum du vill visa media. Om den aktuella dagens mapp finns kommer den automatiskt att väljas. När ett datum väl har valts kan du fortfarande ändra det valda datumet när som helst genom att klicka på datumvalsknappen i den övre delen.

### Presentera media

För att spela media trycker du på knappen ▶️ (spela upp) för filen du vill ha. Om du vill dölja media trycker du på knappen ⏹️ (stopp). En video kan spolas bakåt eller framåt medan den är pausad, om så önskas. Observera att för videor måste stoppknappen tryckas ned **två gånger** för att förhindra att en video av misstag och för tidigt stoppas medan den spelas upp för församlingen. Videor stoppas automatiskt när de har spelats upp i sin helhet.

### Genomför hybridmöten med en kombination av M³, OBS Studio och Zoom

Det överlägset enklaste sättet att dela media under hybridmöten är att konfigurera OBS Studio, M³ och Zoom för att fungera tillsammans.

#### Första konfiguration: Rikets sal-dator

Ställ in den externa bildskärmens skärmupplösning till 1280x720, eller något i närheten av det.

Konfigurera datorns ljudkorts utgång så att den går till en av mixerns ingångar och mixerns kombinerade utgång för att gå till datorns ljudkortsingång.

#### Initial konfiguration: OBS Studio

Installera OBS Studio, eller ladda ner den portabla versionen.

Om du använder den portabla versionen av OBS Studio, installera plugin-programmet [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) och om du använder den portabla versionen av OBS Studio, lägg till den virtuella kameran till Windows genom att dubbelklicka på det medföljande installationsskriptet.

Om du har OBS Studio v27 eller äldre måste du installera plugin-programmet [obs-websocket](https://github.com/obsproject/obs-websocket). Annars ingår obs-websocket i nyare versioner. Konfigurera ett portnummer och lösenord för obs-websocket.

I OBS-inställningarna, under `General` > `System tray`, aktivera alla kryssrutor. Under `Output` > `Streaming`, aktivera en hårdvarukodare om tillgänglig. Under `Video` > `Base (Canvas) Resolution` och `Output (Scaled) Resolution` väljer du `1280x720` och under `Downscale Filter`, välj `Bilinear`.

Ställ in minst 2 scener: en för mediadisplayen (`Window Capture` eller `Display Capture` med muspekaren inaktiverad och lämplig fönstertitel/bildskärm vald), och en för scenvyn (`Video Capture Device` med kameran vald). Du kan lägga till så många scener som behövs, med kameran justerad, inzoomad och beskuren efter behov (talstolsvy, dirigent- och läsarvy, tabellvy, etc.).

Lägg till en genväg till OBS Studio, med parametern `--startvirtualcam`, till Startup-mappen i Windows användarprofil, för att säkerställa att OBS Studio startar automatiskt när användaren loggar in.

#### Initial konfiguration: Kingdom Hall Zoom

Zoom bör konfigureras för att använda dubbla bildskärmar. Aktivera globala kortkommandon för Zoom för att stänga av/slå på ljudet i Rikets sal i Zoom (<kbd>Alt A</kbd>), och starta/stoppa Rikets sals videoflöde i Zoom ( <kbd>Alt V</kbd>).

Ställ in standard "mikrofon" för att vara mixerns kombinerade utgång (så att allt som hörs över Rikets sals ljudsystem sänds över Zoom, inklusive mikrofoner och media) och "kameran" att vara den virtuella kameran från OBS Studio .

#### Första konfiguration: M³

Aktivera alternativet `Visa media på en extern skärm eller i ett separat fönster`.

Aktivera och konfigurera OBS Studio-kompatibilitetsläget med hjälp av port- och lösenordsinformationen som konfigurerats i OBS Studio-konfigurationssteget.

#### Startar mötet

Starta Zoom-mötet och flytta det sekundära Zoom-mötesfönstret till den externa monitorn. Gör den i helskärm om så önskas. Det är här alla deltagare i fjärrmötet kommer att visas för församlingen att se.

När Zoom-mötet visas på den externa monitorn, öppna M³. Mediapresentationsfönstret öppnas automatiskt ovanpå Zoom på den externa bildskärmen. Synkronisera media om det behövs och gå in i mediekontrollläge genom att klicka på knappen ▶️ (spela upp) på huvudskärmen i M³, eller <kbd>Alt D</kbd>.

Aktivera Rikets sals videoflöde (<kbd>Alt V</kbd>), och lyft fram Rikets sals videoflöde om det behövs så att Zoom-deltagare ser Rikets salens podie. Slå på ljudet för Rikets salens ljudflöde i Zoom (<kbd>Alt A</kbd>). Det ska inte vara nödvändigt att inaktivera video- eller ljudflödet i Zoom under mötets varaktighet.

Starta uppspelning av bakgrundsmusik med knappen längst ner till vänster, eller <kbd>Alt K</kbd>.

#### Sänder delar från Rikets salens podie över Zoom

Ingen åtgärd krävs.

Olika kameravinklar/zoom kan väljas under mötet genom att använda menyn längst ned i M³ mediauppspelningskontrollfönstret; den här menyn innehåller en lista över alla konfigurerade kameravyscener i OBS.

#### Dela media i Rikets sal och över Zoom

Hitta media du vill dela i M³ medieuppspelningskontrollfönstret och tryck på "spela upp"-knappen.

När du är klar med att dela media, tryck på "stopp"-knappen i M³. Observera att videor automatiskt stoppas när de är färdiga.

#### Visar fjärrzoomdeltagare på Rikets sals monitor

Tryck på knappen "dölj/visa mediepresentationsfönster" i det nedre högra hörnet av M³ mediekontrollskärmen, eller <kbd>Alt Z</kbd> för att **gömma** mediapresentationsfönstret. Zoommötet kommer nu att synas på Rikets sals skärm.

> Om deltagaren har media att visa, följ stegen under underrubriken **Dela media i Rikets sal och över Zoom**.

När deltagaren har avslutat sin del, tryck på knappen "dölj/visa mediepresentationsfönster" i det nedre högra hörnet av M³ mediauppspelningskontrollfönstret, eller <kbd>Alt Z</kbd>, för att **visa** mediepresentationsfönstret. Rikets salens skärm kommer nu att visa årstexten.

### Genomför hybridmöten med endast M³ och Zoom

Om du av någon anledning inte vill använda OBS Studio, kan följande förslag kanske hjälpa dig att ställa in saker och ting så enkelt som möjligt.

#### Första konfiguration: Rikets sal-dator

Samma som motsvarande avsnitt ovan. Med tillägget av den globala kortkommandon för Zoom för att starta/stoppa skärmdelning (<kbd>Alt S</kbd>). "Kameran" kommer att vara kameraflödet från Rikets salskameran.

#### Första konfiguration: M³

Aktivera alternativet `Visa media på en extern skärm eller i ett separat fönster`.

#### Startar mötet

Samma som motsvarande avsnitt ovan.

#### Sänder delar från Rikets salens podie över Zoom

Samma som motsvarande avsnitt ovan.

#### Dela media i Rikets sal och över Zoom

Börja dela i Zoom genom att trycka på <kbd>Alt S</kbd>. I fönstret för zoomdelning som dyker upp väljer du den externa bildskärmen och aktiverar båda kryssrutorna längst ner till vänster (för ljud- och videooptimering). Årstexten kommer nu att delas över Zoom.

Hitta media du vill dela i M³ medieuppspelningskontrollfönstret och tryck på "spela upp"-knappen.

När du är klar med att dela media, tryck på <kbd>Alt S</kbd> för att avsluta delning av zoomskärm.

#### Visar fjärrzoomdeltagare på Rikets sals monitor

Samma som motsvarande avsnitt ovan.

### Skärmdumpar av presentationsläge

{% include screenshots/present-media.html lang=site.data.sv %}
