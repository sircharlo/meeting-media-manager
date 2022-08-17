---
tag: Usage
title: 'Media presenteren'
ref: present-media
---

### Media presentatie modus gebruiken

De media presentatie modus heeft als doel simpel te zijn om fouten tijdens de vergadering te voorkomen.

Zodra de optie "Zet knop aan om media op een externe monitor of apart scherm af te spelen" aan staan, zal het media presentatie scherm automatisch verschijnen op een externe monitor als die er is. Zo niet, zal hij in een apart sleepbaar scherm verschijnen.

Wanneer er geen media getoond wordt, zal de achtergrondfoto die is ingesteld in de instellingen getoond worden. Als er geen achtergrondfoto is ingesteld zal M³ proberen de jaartekst van dit jaar op te halen en te toneen.

Als er geen achtergrondfoto is ingesteld en de jaartekst niet beschikbaar is, zal er een zwart scherm getoond worden.

Media presentatie modus kan geopend worden door op de ▶️ (play) knop op het beginscherm van M³ te klikken, of door de toetsenbord snelkoppeling <kbd>Alt</kbd> <kbd>D</kbd> (voor externe display).

Zodra je de presentatie modus hebt geopend, zal er een selectiescherm verschijnen waar je de datum die je wilt presenteren kan aanklikken. Als de datum van vandaag bestaat, zal die automatisch geopend worden. Je kan altijd de datum veranderen door op de knop met de gekozen datum te klikken bovenin het scherm.

### Media presenteren

Om media af te spelen, druk je op de ▶️ (play) knop, voor het bestand waar het om gaat. Om media te verbergen, druk je op de ⏹️ (stop) knop. Een filmpje kan teruggespoeld of doorgespoeld worden terwijl hij gepauzeerd is. Bedenk dat je voor filmpjes **twee keer** op de stop knop moet drukken om te voorkomen dat je per ongeluk het filmpje te vroeg stopt. Filmpjes stoppen automatisch zodra ze het einde bereikt hebben.

De "home" knop rechtsonder het scherm zal je terugbrengen naar het beginscherm van M³. De "toon/verberg mediascherm" knop verbergt en toont het mediascherm zodat je bijvoorbeeld Zoom in beeld kan brengen.

### Hybride vergaderingen houden met M³, OBS Studio, en Zoom

De simpelste manier om media te delen tijdens een hybride vergadering is door OBS Studio, M³ en Zoom samen te laten werken.

#### Eerste opzet: computer van de Koninkrijkszaal

Zet de resolutie van het externe scherm op 1280x720 of iets in de buurt.

Stel de computer zo in dat het geluid van de computer naar een van de geluidsinstallatie inputs gaat en het gecombineerde geluid van de geluidsinstallatie naar de geluidskaart van de computer gaat.

#### Eerste opzet: OBS Studio

Installeer OBS Studio, of download een portable versie van OBS Studio.

Installeer de  [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) plugin, en als je de portable versie van OBS Studio gebruikt, voeg de virtual camera toe aan Windows door dubbel te klikken op het gegeven installatie script.

Installeer de [obs-websocket](https://github.com/obsproject/obs-websocket) plugin. Configureer het poortnummer en het wachtwoord voor obs-websocket.

In de instellingen van OBS, onder `General` > `System Tray`, Vink alle checkboxes aan. Onder `Output` > `Streaming`, zet een hardware encoder aan als er een beschikbaar is. Onder `Video` > `Base (Canvas) Resolution` en `Output (Scaled) Resolution`, kies `1280x720`, en onder `Downscale Filter`, kies `Bilinear`.

Zet ten minste 2 scenes op: een voor de media (`Window Capture` of `Display Capture` met de muis cursor uitgeschakeld en het juiste scherm geselecteerd), en een voor het podiumbeeld (`Video Capture Device` met de camera van de zaal geselecteerd). Je kan zo veel scenes maken als je maar nodig hebt, met een andere camera stand of ingezoomd bijvoorbeeld (spreker, studieleider met lezer, demonstratie, etc.).

Voeg een snelkoppeling van OBS Studio toe met de `--startvirtualcam` parameter, in de opstart folder van Windows om te zorgen dat OBS Studio automatisch opstart zodra de gebruiker inlogt.

#### Eerste opzet: computer van de Koninkrijkszaal (Zoom)

Zoom moet ingesteld worden met "dual monitors". Zet de globale snelkoppelingen voor Zoom om de microfoon aan en uit te zetten (<kbd>Alt</kbd> <kbd>A</kbd>), en om de video te starten/stoppen (<kbd>Alt</kbd> <kbd>V</kbd>) aan.

Zet de standaard "microphone" op de gecombineerde output van de geluidsinstallatie (zodat alles wat in de zaal te horen is naar Zoom wordt gestuurd, inclusief microfoons en media) and de "camera" op de virtuale camera van OBS Studio.

#### Eerste opzet: M³

Zet de optie "Zet knop aan om media op een externe monitor of apart scherm af te spelen" aan.

Ze de OBS Studio integratie aan, gebruik makend van het poortnummer en wachtwoord dat je hebt ingesteld in OBS Studio. Selecteer de standaard media en podium scene.

#### Een vergadering starten

Start de Zoom vergadering en breng het tweede zoom scherm naar de externe monitor. Maak het tweede Zoom scherm fullscreen als dat gewild is. Dit is waar de Zoom aandelen op getoond worden zodat de mensen in de zaal het kunnen volgen.

Zodra Zoom getoond wordt op het externe scherm, open je M³. Het mediascherm zal automatisch geopend worden bovenop het Zoom scherm op de externe monitor.Haal de nodige media media and open de media presentatie modus door op de ▶️ (play) knop op het beginscherm van M³ te drukken, of met <kbd>Alt</kbd> <kbd>D</kbd>.

Zet de video van de zaal in in Zoom (<kbd>Alt</kbd> <kbd>V</kbd>), en "spotlight" (indien nodig) de zaal video zodat de Zoom deelnemers het podium kunnen zien. Zet je microfoon in Zoom (<kbd>Alt</kbd> <kbd>A</kbd>). Het zou niet nodig moeten zijn om de video of microfoon uit te zetten tijdens de vergadering.

Start de achtergrond muziek door op de knop linksonder te drukken, of met <kbd>Alt</kbd> <kbd>K</kbd>.

#### Fysieke aandelen in de koninkrijkszaal tonen via Zoom

Geen actie nodig.

De verschillende camera/zoom standen kunnen gekozen worden door het menu onderin het presentatie scherm van M³; Dit menu heeft alle scenes die ingesteld zijn via OBS, behalve de scene die gebruikt wordt om de media te tonen.

#### Media delen in de koninkrijkszaal en via Zoom

Vind de media die je wilt delen in M³ en druk op de "play" knop.

Wanneer je klaar bent met delen, druk je op de "stop" knop in M³. Bedenk dat filmpjes automatisch stoppen zodra ze afgelopen zijn.

#### Zoom aandelen tonen in de koninkrijkszaal

Druk op de "toon/verberg mediascherm" knop rechtsonder in M³ of gebruik <kbd>Alt</kbd> <kbd>Z</kbd>, om het mediascherm te **verbergen**. De Zoom vergadering is nu zichtbaar op het externe scherm.

> Als de Zoom deelnemer media heeft om te tonen, volg de stoppen onder het kopje **Media delen in de koninkrijkszaal en via Zoom**.

Zodra de Zoom deelnemer klaar is, druk je weer op de "toon/verberg mediascherm" knop rechtsonder in M³ of gebruik je <kbd>Alt</kbd> <kbd>Z</kbd>, om het mediascherm te **tonen**. De gekozen achtergrond (of de jaartekst) is nu weer zichtbaar op de externe monitor.

### Hybride vergaderingen houden met alleen M³ en Zoom

Als je geen gebruik wilt maken van OBS Studio, om wat voor reden dan ook, wordt het volgende aangeraden om het proces zo simpel mogelijk te houden.

#### Eerste opzet (alleen M³ en Zoom): Zoom in de Koninkrijkszaal

Hetzelfde als de sectie hierboven, met de aanvulling dat de globale snelkoppeling van Zoom om te starten/stoppen met media delen (<kbd>Alt</kbd> <kbd>S</kbd>) is. De "camera" zal de camera in de koninkrijkszaal zijn.

#### Eerste opzet (alleen M³ en Zoom): M³

Zet de optie "Zet knop aan om media op een externe monitor of apart scherm af te spelen" aan.

#### Een vergadering starten (Alleen M³ en Zoom)

Hetzelfde als de instructies met OBS Studio erbij.

#### Fysieke aandelen in de koninkrijkszaal tonen via Zoom (Alleen M³ en Zoom)

Hetzelfde als de instructies met OBS Studio erbij.

#### Media delen in de koninkrijkszaal en via Zoom (alleen M³ en Zoom)

Start het delen in Zoom door <kbd>Alt</kbd> <kbd>S</kbd> in te drukken. In Zoom komt er een scherm in beeld. Kies de externe monitor en vink beide checkboxes aan linksonderin (voor geluid en video optimalisatie). The jaartekst wordt nu via Zoom gedeeld.

Vind de media die je wilt delen in M³ en druk op de "play" knop. De media wordt nu zichtbaar in de koninkrijkszaal en in Zoom.

Wanneer je klaar bent, druk je weer op <kbd>Alt</kbd> <kbd>S</kbd> om de Zoom share te stoppen. De koninkrijkszaal monitor toont nu weer de gekozen achtergrond of de jaartekst.

#### Zoom aandelen tonen in de koninkrijkszaal (alleen M³ en Zoom)

Hetzelfde als de instructies met OBS Studio erbij.

### Schermafbeeldingen van de media presentatie modus

<table class="showcase" markdown="0">
{% include image.html src="present/launch-present-mode.png" alt="Knop om de media presentatie modus te openen" %}
{% include image.html src="present/meeting-picker.png" alt="Selecteer een vergadering waarvoor je media wilt tonen" %}
{% include image.html src="present/default-bg.png" alt="Standaard media achtergrond, met jaartekst" %}
{% include image.html src="present/media-list.png" alt="Lijst van de media die getoond kan worden" %}
{% include image.html src="present/standby-mode.png" alt="M³ mediascherm in standby modus" %}
{% include image.html src="present/picture-playing.png" alt="Een afbeelding tonen" %}
{% include image.html src="present/video-playing.png" alt="Een filmpje afspelen" %}
{% include image.html src="present/video-scrub.png" alt="Naar een specifiek moment in het filmpje springen" %}
</table>
