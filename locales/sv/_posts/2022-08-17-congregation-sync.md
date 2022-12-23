---
tag: Configuration
title: Församlingssynkronisering
ref: congregation-sync
---

Brodern som utsetts till _videokonferensarrangör_ (VO) av de äldste kan använda M³ för att hantera vilka media som görs tillgängliga för det tekniska A/V-supportteamet i hans församling.

VO, eller någon utsedd av honom, kan:

- ladda upp **ytterligare** media som ska delas under ett möte, till exempel för kretstillsyningsmannens besök eller för offentliga föreläsningar
- **dölj** media från JW.org som inte är relevant för ett visst möte, till exempel när en del har ersatts av den lokala avdelningskontoret
- lägg till eller ta bort **återkommande** media, till exempel en årstextvideo eller en meddelandebild

Alla som är synkroniserade till samma församling kommer sedan att få exakt samma media när de klickar på knappen _Uppdatera mediamappar_.

Observera att funktionen för församlingssynkronisering är helt valfri.

### Hur det fungerar

M³s underliggande synkroniseringsmekanism använder WebDAV. Detta innebär att VO (eller någon under hans överinseende) måste antingen:

- konfigurera en säker WebDAV-server som är tillgänglig på webben, **eller**
- använd en tredjeparts molnlagringstjänst som stöder WebDAV-protokollet (se Värdnamn-inställningen i avsnittet _Inställningar för församlingssynkronisering_ nedan).

All users that wish to be synchronized together will need to connect to the same WebDAV server using the connection information and credentials provided to them by their VO.

### Inställningar för församlingssynkronisering

| Inställning | Förklaring |
| ------- | ----------- |
| `Värdnamn` | Webbadress till WebDAV-servern. Säker HTTP (HTTPS) krävs. <br><br> _**Obs:** Etiketten för det här fältet är faktiskt en knapp som, när den väl klickas, visar en lista över WebDAV-leverantörer som har varit kända för att vara kompatibla med M³, och som automatiskt fyller i vissa inställningar för dessa leverantörer. <br><br> Den här listan representerar inte på något sätt ett stöd från någon särskild tjänst eller leverantör. Den bästa servern är alltid den du äger..._ |
| `Användarnamn` | Användarnamn för WebDAV-tjänsten. |
| `Lösenord` | Lösenord för WebDAV-tjänsten. <br><br> _**Obs:** Som beskrivs i deras respektive supportsidor kan ett appspecifikt lösenord behöva skapas för [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) och [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) för att aktivera WebDAV-anslutningar till deras tjänster._ |
| `Församlingens synkroniseringsmapp` | Det här är mappen som kommer att användas för att synkronisera media för alla användare av församlingssynkronisering. Du kan antingen skriva/klistra in en sökväg eller använda muspekaren för att navigera till målmappen. <br><br> _**Obs:** Se till att alla användare av församlingssynkronisering anger samma mappsökväg; annars fungerar inte synkroniseringen som förväntat._ |
| `Övergripande församlingsinställningar` | När VO har konfigurerat avsnitten _Mediainställningar_ och _Mötesinställningar_ i [inställningar]({{page.lang}}/#configuration) på sin egen dator, kan han använda den här knappen för att tillämpa vissa inställningar för alla församlingssynkroniseringsanvändare (till exempel mötesdagar, mediespråk, konverteringsinställningar och så vidare). Detta innebär att de valda inställningarna kommer att tillämpas med kraft för alla synkroniserade användare varje gång de öppnar M³. |

### Använder församlingssynkronisering för att hantera media

När konfigureringen av församlingssynkroniseringen är klar är du redo att starta [Hantera media]({{page.lang}}/#manage-media) för din församlings tekniska AV-supportteam.

### Skärmdumpar av församlingssynkronisering i aktion

{% include screenshots/congregation-sync.html lang=site.data.sv %}
