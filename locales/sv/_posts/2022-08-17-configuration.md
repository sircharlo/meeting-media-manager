---
tag: Configuration
title: inställningar
ref: configuration
---

Skärmen Inställningar är uppdelad i 4 sektioner. De flesta av alternativen är självförklarande, men här är några ytterligare detaljer.

### Programinställningar

| Inställning | Förklaring |
| `Programspråk` | Ställer in språket som M³ visas på. <br><br> Tack till våra många bidragsgivare för att du har översatt appen till så många språk! Om du vill hjälpa till att förbättra en befintlig översättning eller lägga till en ny, vänligen öppna en ny ["discussion"]({{site.github}}/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M%C2%B3+into+a+language+I+speak,+LANGUAGE). |
| `Mapp för media` | Mötesmedia kommer att sparas i den här mappen för senare delning och användning. |
| `Starta programmet när datorn startas` | Om aktiverat, kommer M³ att starta när den aktuella användaren loggar in på datorn. <br><br> _**Obs!** Ej tillgängligt på Linux._ |
| `Initiera mediasynkronisering automatiskt` | Om det är aktiverat kommer det här alternativet automatiskt att initiera en mediasynkronisering 5 sekunder efter att M³ har startat. <br><br> _För att förhindra att den automatiska synkroniseringen inträffar när den här inställningen är aktiverad, tryck på ⏸-knappen (paus) innan 5-sekunderstimern är slut._ |
| `Öppna mapp efter mediasynkronisering` | När den är aktiverad öppnas mappen som innehåller det nedladdade mediet för den valda veckan i datorns filhanterare efter att mediesynkroniseringen är klar. |
| `Stäng programmet efter mediasynkronisering` | Om det är aktiverat, kommer detta alternativ automatiskt att avslutas M³ 5 sekunder efter att mediasynkroniseringen är klar. <br><br> _För att förhindra att M³ avslutas automatiskt när den här inställningen är aktiverad, tryck på knappen 🏃 (person som lämnar/springer) innan 5-sekunderstimern är slut._ |
| `Aktivera _OBS Studio_ kompabilitetsläge` | Om det är aktiverat kommer det här alternativet att öppna OBS Studio för att ändra scener automatiskt efter behov både före och efter delning av media. <br><br> _Om du aktiverar den här inställningen, se till att OBS Studio är konfigurerad att använda `obs-websocket` plugin, vilket är det som gör att M³ kan kommunicera med OBS Studio. <br><br> Konfigurera också alla nödvändiga scener för mediadelning och scenvisning i OBS. Åtminstone behöver du en scen med en `Window Capture` (rekommenderas) eller `Display Capture` konfigurerad för att fånga M³-mediapresentationsfönstret, eller skärmen där media kommer att presenteras. <br><br> Du måste också konfigurera alla önskade scener, till exempel: en bild av talarstolen, en bred bild av podiet, etc._ |
| `Port` | Port där `obs-websocket` plugin är konfigurerad för att lyssna. |
| `Lösenord` | Lösenordet konfigurerat i `obs-websocket`-pluginens inställningar. |
| `Standard scenvy i OBS Studio` | Välj vilken scen som ska väljas som standard när mediapresentationsläget startas. Vanligtvis en bred vy, eller en bild av talarstolen. |
| `Mediascen i OBS Studio` | Välj vilken scen som är konfigurerad i OBS Studio för att fånga M³-mediafönstret. |
| `Inaktivera hårdvaruacceleration` | Aktivera endast den här inställningen om du har problem med mediapresentationsläget. Om du ändrar denna inställning kommer M³ att starta om. |

### Inställningar för församlingssynkronisering

Se avsnittet [Församlingssynkronisering]({{page.lang}}/#congregation-sync) för detaljer om exakt vad detta gör och hur du konfigurerar det här avsnittet.

### Mediainställningar

| Inställning | Förklaring |
| `Mediaspråk` | Välj språket för din församling eller grupp. Alla media kommer att laddas ner från JW.org på detta språk. |
| `Videoupplösning` | Videor som laddas ner från JW.org kommer att laddas ner med denna upplösning, eller nästa tillgängliga lägre upplösning. Användbar för situationer med begränsad eller låg bandbredd. |
| `Konvertera media till MP4-format` | Detta kommer automatiskt att konvertera alla bild- och ljudfiler till MP4-format, för användning med Zooms["native MP4 sharing feature"](assets/img/other/zoom-mp4-share.png)under **helt digitala** församlingsmöten via Zoom. Detta inkluderar alla bilder och mediefiler som laddats ner från JW.org, såväl som ytterligare mediefiler som lagts till av användaren eller VO. <br><br> _**Obs:** Det här alternativet är bäst lämpat för **enbart digitala** församlingsmöten via Zoom. Om du genomför antingen **hybrid** eller **vanliga** församlingsmöten, titta på att använda [Mediapresentationsläge]({{page.lang}}/#present-media) genom att aktivera alternativet `Visa media på en extern skärm eller i ett separat fönster` istället och inaktivera det här alternativet ._ |
| `Behåll ursprungliga filer efter konvertering.` | Om den här inställningen är aktiverad kommer bild- och ljudfiler att behållas i mediamappen efter att de konverterats till MP4-format, istället för att raderas. Detta kommer att resultera i en något mer rörig mediamapp och behöver i allmänhet inte aktiveras om du delar media genom Zoom MP4-delning. (Se `Konvertera media till MP4-format` ovan.) <br><br> _**Obs!** Visas endast om `Konvertera media till MP4-format` också är aktiverat._ |
| `Visa media på en extern skärm eller i ett separat fönster` | Den här inställningen gör att du kan använda M³ för att presentera bilder, videor och ljudfiler under **hybrid** eller **vanliga** församlingsmöten. kan sedan nås genom att klicka på knappen ▶️ (spela upp) på huvudskärmen i M³. <br><br> Mediapresentationsskärmen kommer automatiskt att använda en extern bildskärm om sådan finns; Om inte kommer media att visas i ett separat fönster som kan ändras storlek. <br><br> _**Obs!** Det här alternativet är bäst lämpat för antingen **hybrid** eller **vanliga** församlingsmöten. <br><br> Om du genomför **enbart fjärranslutna** församlings Zoom-möten, titta på att aktivera alternativet Konvertera media till MP4-format och dela media med Zooms inbyggda MP4-delning istället._ |
| `Bakgrundsbild för mediavisning` | Som standard kommer M³ att försöka hämta årstexten på det språk som valts tidigare, för att visa den på en svart bakgrund i [Mediapresentationsläge]({{page.lang}}/#present-media) och inget annat media spelas. Om den automatiska hämtningen av årstexten misslyckas av någon anledning, eller om du vill visa en annan bakgrundsbild, kan du antingen använda knappen "Bläddra" för att välja en anpassad bild, eller knappen "Uppdatera" för att försöka hämta årstexten automatiskt igen. <br><br> _**Obs:** Om [Församlingssynkronisering]({{page.lang}}/#congregation-sync) är aktiverat, val av en anpassad bakgrundsbild kommer att synkronisera den för alla användare av församlingssynkronisering automatiskt._ |
| `Skapa spellistor för _VLC_` | Aktivera detta om du vill skapa spellistor för varje möte automatiskt, som sedan kan laddas i VLC, om du använder den appen för att visa media istället för [Mediapresentationsläge]({{page.lang}}/#present-media). |
| `Exkludera all media från broschyren _th_` | Om det är aktiverat kommer detta att förhindra att media från broschyren _Ansök dig själv_ tas med vid varje mittveckamöte. |
| `Exkludera bilder från broschyren _lffi_` | Om det är aktiverat förhindrar detta att bilder från _Live Forever_-broschyren (_lffi_) inkluderas, till exempel för skoluppgifter under veckomötet. |

### Mötesinställningar

| Inställning | Förklaring |
| `Veckomöte` | Ange vanlig dag och tid för veckomötet; används för mappnamn och automatisk uttoning av bakgrundsmusik (se nedan). |
| `Helgmöte` | Ange vanlig dag och tid för helgmötet. |
| `Aktivera knapp för spelnings av slumpvalda Rikets sånger.` | Aktivera en knapp på huvudskärmen som kommer att spela Rikets sånger från _sjjm_-serien, i slumpmässig ordning. Detta är till exempel användbart för att spela sånger före och efter möten i Rikets sal som bakgrundsmusik. |
| `Musikvolym` | Ställer in volymen med vilken bakgrundsmusiken ska spelas. |
| `Stoppa musikspelning automatiskt` | Om `Aktivera knapp för spelnings av slumpvalda Rikets sånger.` är aktiv, låter den här inställningen dig ange en fördröjning efter vilken bakgrundsmusik ska stoppas automatiskt. Detta kan vara antingen: ett visst antal minuter, eller ett förutbestämt antal sekunder före mötets början (i det fall bakgrundsmusiken startades före ett möte). |

### Skärmdumpar av inställningsskärmen

{% include screenshots/configuration.html lang=site.data.sv %}
