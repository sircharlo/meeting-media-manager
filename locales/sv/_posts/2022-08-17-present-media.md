---
tag: Användning
title: Mediapresentationsläge
ref: present-media
---

### Använda mediapresentationsläge

Mediepresentationen och kontrolllägena är designade för enkelhet och för att förhindra misstag under möten.

När alternativet `Visa media på en extern skärm eller i ett separat fönster` är aktiverat, kommer mediapresentationsskärmen automatiskt att visas på den externa monitorn om den finns, eller i ett separat, dragbart och storleksändringsbart fönster om ingen extern monitor upptäcktes.

Bildskärmen för media kommer att visa bakgrundsbilden som är konfigurerad i inställningarna. Om ingen bakgrundsbild har konfigurerats kommer M³ att försöka hämta och visa årstexten automatiskt.

Om ingen bakgrundsbild är konfigurerad i inställningarna och årstexten inte kunde laddas automatiskt, kommer en svart bakgrund att visas i standbyläge.

Mediekontrolläget kan nås genom att klicka på knappen ▶️ (spela upp) på huvudskärmen i M³, eller genom att använda kortkommandot <kbd>Alt D</kbd> (för extern skärm).

I mediapresentationsläge kan du välja vilket datum du vill visa media för. Om den aktuella dagens mapp finns kommer den automatiskt att väljas. När ett datum är valt kan du kan fortfarande ändra det valda datumet när som helst genom att klicka på knappen datumval i det översta avsnittet.

### Presentera media

För att spela upp media trycker du på ▶️ (play) knappen för den fil du vill visa. För att dölja media trycker du på ⏹️ (stopp) knappen. En video kan spolas bakåt eller framåt om videon pausats. Observera att stoppknappen för videor måste tryckas på **två gånger** för att förhindra oavsiktligt stopp under uppspelningen. Videor stoppas automatiskt när de har spelats upp i sin helhet.

### Genomför hybridmöten med en kombination av M³, OBS Studio och Zoom

Det överlägset enklaste sättet att dela media under hybridmöten är att konfigurera OBS Studio, M³ och Zoom för att fungera tillsammans.

#### Första konfiguration: Rikets sal-dator

Ställ in den externa bildskärmens skärmupplösning till 1280x720, eller något i närheten av det.

Konfigurera datorns ljudkorts utgång så att den går till en av mixerns ingångar och mixerns kombinerade utgång för att gå till datorns ljudkortsingång.

#### Ställa in: OBS Studio

Installera OBS Studio, eller ladda ner den portabla versionen.

Om du använder den portabla versionen av OBS Studio, installera plugin-programmet [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) och om du använder den portabla versionen av OBS Studio, lägg till den virtuella kameran till Windows genom att dubbelklicka på det medföljande installationsskriptet.

Om du har OBS Studio v27 eller äldre, måste du installera [obs-websocket](https://github.com/obsproject/obs-websocket) plugin. Annars ingår obs-websocket. Konfigurera ett portnummer och lösenord för obs-websocket.

I OBS-inställningarna, under `Allmänt` > `systemfältet`, aktivera alla kryssrutor. Under `Output` > `Streaming`, aktivera en hårdvarukodare om tillgänglig. Under `Video` > `Base (Canvas) resolution` och `Output (Scaled) Resolution`, välj `1280x720`och under `Downscale Filter`väljer du `Bilinear`.

Konfigurera minst 2 scener: en för media display (`Window Capture` eller `Display Capture` med muspekaren inaktiverad och lämplig fönstertitel/bildskärm vald), och en för scenvyn (`Video Capture Device` med RS-kameran vald). Du kan lägga till så många scener som krävs, med kameran justerad, zooma in och beskurna efter behov (talarstol, läsare, bordsvy etc.).

Lägg till en genväg till OBS Studio, med parametern `--startvirtualcam`, till Startup-mappen i Windows användarprofil, för att säkerställa att OBS Studio startar automatiskt när användaren loggar in.

#### Ställa in: Zoom på Rikets sal

Zoom bör konfigureras för att använda dubbla bildskärmar. Aktivera globala kortkommandon för Zoom för att stänga av/på ljudet från Rikets sal i Zoom (<kbd>Alt A</kbd>), och starta/stoppa videoflöde i Zoom (<kbd>Alt V</kbd>).

Ställ in standard "mikrofon" för att vara mixerns kombinerade utgång (så att allt som hörs över Rikets sals ljudsystem sänds över Zoom, inklusive mikrofoner och media) och "kameran" att vara den virtuella kameran från OBS Studio .

#### Ställa in: M³

Aktivera alternativet `Visa media på en extern skärm eller i ett separat fönster`.

Aktivera och konfigurera OBS Studio-kompatibilitetsläget med hjälp av port- och lösenordsinformationen som konfigurerats i OBS Studio-konfigurationssteget.

#### Startar mötet

Starta Zoom-mötet och flytta fönstret för Zoom-möten till den externa bildskärmen. Gör det till fullskärm om så önskas. Det är här som alla deltagare på distans kommer att visas för församlingen.

När Zoom-mötet visas på den externa skärmen, öppna M³. Presentationsfönstret öppnas automatiskt ovanpå Zoom på den externa skärmen. Synkronisera media vid behov och ange mediekontrolläget genom att klicka på knappen ▶️ (play) på huvudskärmen på M³, eller <kbd>Alt D</kbd>.

Aktivera Rikets salens videoflöde (<kbd>Alt V</kbd>), och spotlighta videoflödet vid behov så att Zoom deltagarna ser Rikets salscenen. Slå av/på ljudflödet från Rikes sal i Zoom (<kbd>Alt A</kbd>). Det bör inte vara nödvändigt att inaktivera video-eller ljudflödet i Zoom under mötet.

Starta uppspelning av bakgrundsmusik med knappen längst ner till vänster, eller <kbd>Alt K</kbd>.

#### Sänder delar från Rikets salens podie över Zoom

Ingen åtgärd krävs.

Olika kameravinklar/zoom kan väljas under mötet genom att använda menyn längst ned i M³ mediauppspelningskontrollfönstret; den här menyn innehåller en lista över alla konfigurerade kameravyscener i OBS.

#### Dela media i Rikets sal och över Zoom

Hitta media du vill dela i M³ medieuppspelningskontrollfönstret och tryck på "spela upp"-knappen.

När du är klar med att dela media, tryck på "stopp"-knappen i M³. Observera att videoklipp stoppas automatiskt.

#### Visar zoomdeltagare på skärmen i Rikets sal

Tryck på knappen "dölj/visa mediapresentationsläget" i nedre högra hörnet av M³ media styrenheten, eller <kbd>Alt Z</kbd>, att **dölja** media presentationsfönstret. Zoommötet kommer nu att synas i skärmen på Rikets sal.

> Om deltagaren har media att visa, följ stegen under underrubriken **Dela media i Rikets sal och över Zoom**.

När deltagaren har avslutat sin del, Tryck på knappen "dölja/visa mediapresentationsläget" i nedre högra hörnet av M³ kontrollfönstret, eller <kbd>Alt Z</kbd>, för att **visa** media presentationsfönstret. Skärmen i Rikets sal kommer nu att visa årstexten.

### Genomför hybridmöten med endast M³ och Zoom

Om du av någon anledning inte vill använda OBS Studio, kan följande förslag kanske hjälpa dig att ställa in saker och ting så enkelt som möjligt.

#### Ställa in: Rikets sal-datorn

Samma som motsvarande avsnitt ovan. Med tillägg av den globala kortkommandot för Zoom för att starta/stoppa skärmdelning (<kbd>Alt S</kbd>). "Kamera" kommer att vara kameraflödet från Rikets sal.

#### Ställa in: M³ utan OBS Studio

Aktivera alternativet `Visa media på en extern skärm eller i ett separat fönster`.

#### Startar mötet utan OBS Studio

Samma som motsvarande avsnitt ovan.

#### Sänder delar från Rikets salens podie över Zoom utan OBS Studio

Samma som motsvarande avsnitt ovan.

#### Dela media i Rikets sal och över Zoom utan OBS Studio

Börja dela i Zoom genom att trycka på <kbd>Alt S</kbd>. I Zoom-delningsfönstret som dyker upp väljer du den externa bildskärmen och aktiverar båda kryssrutorna längst ner till vänster (för ljud- och videooptimering). Årstexten kommer nu att delas över Zoom.

Hitta media du vill dela i M³ medieuppspelningskontrollfönstret och tryck på "spela upp"-knappen.

När du är klar med att dela media, tryck på <kbd>Alt S</kbd> för att avsluta delning av zoomskärm.

#### Visar fjärrzoomdeltagare på skärmen i Rikets sal utan OBS Studio

Samma som motsvarande avsnitt ovan.

### Skärmdumpar av presentationsläge

{% include screenshots/present-media.html lang=site.data.sv %}
