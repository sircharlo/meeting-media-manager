---
tag: Configuration
title: 'Instellingen'
ref: configuration
---

Het instellingen scherm is verdeeld in 4 secties. De meeste opties spreken voor zich, maar hier zijn wat extra details.

### Applicatie setup

<table>
<tbody>
    <tr>
      <td><code>Applicatie taal</code></td>
      <td>
        De taal waarin M³ wordt weergegeven.<br>
        <br>
        Alle vrijwilliger, enorm bedankt voor het vertalen van deze app in zo veel talen! Als je wilt meehelpen aan het verbeteren van een bestaande vertaling of een nieuwe taal wilt toevoegen, open dan alsjeblieft een nieuwe <a href="https://github.com/sircharlo/meeting-media-manager/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M³+into+a+language+I+speak,+LANGUAGE">discussie</a>.
      </td>
    </tr>
    <tr>
      <td><code>Folder waar de media wordt opgeslagen</code></td>
      <td>Media voor de vergaderingen wordt in deze folder opgeslagen voor later gebruik.</td>
    </tr>
    <tr>
      <td><code>Start de app bij systeem opstarten</code></td>
      <td>Als deze optie aan staat, zal M³ automatisch opstarten zodra de huidige gebruiker inlogt op de computer.<br>
      <br>
      <blockquote><strong>Let op:</strong> Niet beschikbaar voor Linux.</blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Automatisch media syncen</code></td>
      <td>
        Als deze optie aan staat, zal M³ automatisch media gaan ophalen 5 seconden nadat de applicatie is opgestart.<br>
        <br>
        <blockquote>
          Om te voorkomen dat media wordt opgehaald kan je op de ⏸ (pauze) knop drukken voordat de 5-seconden timer om is.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Open folder na media sync</code></td>
      <td>
        Als deze optie aan staat, zal de folder waar media voor die week wordt opgeslagen automatisch geopend worden nadat de media sync klaar is.
      </td>
    </tr>
    <tr>
      <td><code>Sluit app na media sync</code></td>
      <td>
        Als deze optie aan staat, zal M³ 5 seconden na de media sync, zichzelf automatisch afsluiten.<br>
        <br>
        <blockquote>
          Om te voorkomen dat M³ zichzelf afsluit kan je de 🏃 (persoon aan het rennen) knop indrukken voordate de 5-seconden timer om is.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Zet <em>OBS Studio</em> integratie modus aan</code></td>
      <td>
        Als deze optie aan staat, zal M³ verbinding maken met OBS Studio om automatisch de scenes aan te passen voor en na het delen van media.<br>
        <br>
        <blockquote>
          Als je deze optie wilt gebruiken, moet je zorgen dat OBS Studio gebruikt maakt van de <code>obs-websockets</code> plugin, die M³ in staat stelt om met OBS Studio te verbinden.<br>
          <br>
          Bovendien moet je alle nodige scenes for media delen en podium tonen instellen in OBS. Op z'n minst heb je een scene nodig met <code>Window Capture</code> (aanbevolen) of <code>Display Capture</code> ingesteld om het media presentatie scherm van M³ te tonen, of het externe scherm waar de media gepresenteerd wordt.<br>
          <br>
          Je moet ook alle gewilde scenes voor het podium beeld instellen, bijvoorbeeld:
          <ul>
            <li>Een weergave van de spreker</li>
            <li>Een wijd beeld van het hele podium</li>
            <li>De studieleider en de lezer samen</li>
            <li>Een weergave van de tafel voor een demonstratie</li>
          </ul>
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Poort</code></td>
      <td>De poort waar de <code>obs-websockets</code> plugin op luistert.
      </td>
    </tr>
    <tr>
      <td><code>Wachtwoord</code></td>
      <td>Het wachtwoord dat is ingesteld in de instellingen van de <code>obs-websockets</code> plugin.
      </td>
    </tr>
    <tr>
      <td><code>Standaard scene voor het podium in OBS Studio</code></td>
      <td>
        Selecteer de scene die je als standaard wilt wanneer de media presentatie modus aan wordt gezet. Vaak is dit het podium wijd beeld of het beeld voor de spreker.
      </td>
    </tr>
    <tr>
      <td><code>Media scherm scene in OBS Studio</code></td>
      <td>Selecteer welke scene in OBS is ingesteld om het media scherm van M³ te tonen.</td>
    </tr>
    <tr>
      <td><code>Zet hardware acceleratie uit</code></td>
      <td>
        Zet deze optie alleen aan als je problemen ondervindt met de media presentie modus. Na het veranderen moet je M³ opnieuw opstarten.
      </td>
    </tr>
  </tbody>
</table>

### Gemeente sync setup

Zie de [gemeente sync](#/gemeente-sync) sectie voor details over wat deze optie is en hoe je het instelt.

### Media setup

<table>
  <thead>
    <tr>
      <th>Instelling</th>
      <th>Uitleg</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>Media taal</code></td>
      <td>Selecteer de taal van jouw gemeente of groep. Alle media zal van JW.org gedownload worden in deze taal.</td>
    </tr>
    <tr>
      <td><code>Maximale resolutie voor filmpjes</code></td>
      <td>
        Filmpjes van JW.org worden in deze resolutie gedownload of de eerst volgende, lagere, beschikbare resolutie. Handig voor situaties met weinig bandbreedte.
      </td>
    </tr>
    <tr>
      <td><code>Converteer media naar MP4 formaat</code></td>
      <td>
        Deze optie zorgt dat alle plaatjes en audio bestanden worden geconverteerd naar MP4 formaat, om te gebruiken met de <a href="assets/img/other/zoom-mp4-share.png">MP4 deel functie</a> van Zoom tijdens <strong>volledig digitale</strong> gemeente Zoom vergaderingen. Dit omvat alle plaatje en media bestanden die gedownload worden van JW.org en alle extra media bestanden die worden toegevoegd door de gebruiker of de VO.<br>
        <br>
        <blockquote>
          <strong>Let op:</strong> Deze optie is bedoeld voor <strong>volledig digitale</strong> gemeente Zoom vergaderingen. Als je <strong>hybrid</strong> of <strong>gewone</strong> gemeente vergaderingen houdt, probeer dan de <a href="nl/#/media-presenteren">media presentatie modus</a> door het activeren van de <code>Zet knop aan om media op een externe monitor of apart scherm af te spelen</code> optie, en zet deze optie uit.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Behoud originele media bestanden na omzetten</code></td>
      <td>
        Als deze optie aan staat zullen de originele plaatjes en auto bestanden die worden omgezet naar MP4 formaat behouden worden in plaats van verwijderd en vervangen door de filmpjes. Dit zorgt dat de media folder wat chaotischer eruit komt te zien en hoeft over het algemeen niet aangezet worden om media via Zoom MP4 delen te tonen. (Zie <code>Converteer media naar MP4 formaat</code> hierboven.)<br>
        <br>
        <blockquote><strong>Let op:</strong> Alleen zichtbaar als <code>Converteer media naar MP4 formaat</code> aan staat.</blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Zet knop aan om media op een externe monitor of apart scherm af te spelen</code></td>
      <td>
        Deze instelling stelt je in staat om de gedownloade media te presenteren tijdens <strong>hybride</strong> of <strong>gewone</strong> gemeente vergaderingen. <a href="nl/#/media-presenteren">Media presentatie modus</a> kan dan geopend worden door op de ▶️ (play) knop op het beginscherm van M³ te klikken.<br>
        <br>
        Het media presentatie scherm zal automatisch geopend worden op een extern scherm als die beschikbaar is; zo niet, zal de media getoond worden in een los, sleepbaar scherm.<br>
        <br>
        <blockquote>
          <strong>Let op:</strong> Deze optie werkt het beste voor <strong>hybride</strong> of <strong>gewone</strong> gemeente vergaderingen.<br>
          <br>
          Als je <strong>volledig digitale</strong> gemeente Zoom vergadering houdt, bekijk dan de <code>Converteer media naar MP4 formaat</code> optie en het delen van media via Zoom's eigen MP4 deel functie.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Achtergrondplaatje voor media presentatie modus</code></td>
      <td>
        Standaard zal M³ proberen om de jaartekst van dit jaar in de gekozen media taal proberen op te halen om die als achtergrond te tonen in de <a href="nl/#/media-presenteren">media presentatie modus</a> wanneer er geen media wordt afgespeeld. Als het ophalen van jaartekst mislukt of je om een andere reden een andere achtergrond wilt gebruiken kan je de 'Blader' knop gebruiken om een andere plaatje te selecteren of de 'refresh' knop gebruiken om de jaartekst nog een keer op te halen.<br>
        <br>
        <blockquote>
          <strong>Let op:</strong> Als <a href="nl/#/gemeente-sync">gemeente sync</a> aan is gezet, zal de achtergrond automatisch gesynchroniseerd worden met alle andere gebruikers van jullie gemeente.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Maak playlists voor het gebruik met <em>VLC</em></code></td>
      <td>
        Zet deze optie aan om automatisch playlists te genereren van elke vergaderingen, om die in VLC te laden als je VLC gebruikt in plaats van de <a href="nl/#/media-presenteren">media presentatie modus</a>.
      </td>
    </tr>
    <tr>
      <td><code>Sluit alle media van de <em>th</em> brochure uit</td>
      <td>Als deze optie aan staat, zal de media van de <em>Leg je toe op</em> brochure niet worden gedownload voor de doordeweekse vergadering.</td>
    </tr>
    <tr>
      <td><code>Sluit audio en video bestanden van de <em>lffi</em> brochure uit</code></td>
      <td>
        Als deze optie aan staat, zal de audio and video van de <em>Voor eeuwig gelukkig</em> brochure (<em>lffi</em>), van bijvoorbeeld de bijbelstudie, niet gedownload worden. Plaatjes van de <em>lffi</em> brochure worden niet beïnvloed door deze instelling.
      </td>
    </tr>
    <tr>
      <td><code>Sluit afbeeldingen van de <em>lffi</em> brochure uit</code></td>
      <td>
        Als deze optie aan staat, zullen de plaatjes van de <em>Voor eeuwig gelukkig</em> brochure (<em>lffi</em>), van bijvoorbeeld de bijbelstudie, niet gedownload worden. Videos en audio van de <em>lffi</em> brochure worden niet beïnvloed door deze instelling.
      </td>
    </tr>
  </tbody>
</table>

### Vergadering setup

<table>
  <thead>
    <tr>
      <th>Instelling</th>
      <th>Uitleg</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>Doordeweekse vergadering</code></td>
      <td>Stel in welke dag en tijd de doordeweekse vergadering normaal gehouden wordt. Dit wordt gebruikt voor de naamgeving van de media folders en het automatisch stoppen van achtergrond muziek (zie hieronder).</td>
    </tr>
    <tr>
      <td><code>Weekend vergadering</code></td>
      <td>Stel in welke dag en tijd de weekend vergadering normaal gehouden wordt.</td>
    </tr>
    <tr>
      <td><code>Zet knop aan om koninkrijksliederen op shuffle af te spelen</code></td>
      <td>
        Deze knop knop om het beginscherm te staan en speelt koninkrijksliederen van <em>sjjm</em> serie, in willekeurige volgorde, af. Dit is handig om bijvoorbeeld voor en na de vergadering achtergrond muziek af te spelen in de Koninkrijkszaal.
      </td>
    </tr>
    <tr>
      <td><code>Muziek afspeelvolume</code></td>
      <td>Stelt de volume in voor de achtergrondmuziek.</td>
    </tr>
    <tr>
      <td><code>Automatisch stoppen met achtergrondmuziek afspelen</code></td>
      <td>
        Als <code>Zet knop aan om koninkrijksliederen op shuffle af te spelen</code> aan staat, zorgt deze instelling ervoor dat de achtergrond muziek automatisch stopt met spelen na een ingestelde tijd.<br>
        <br>
        Dit kan zijn:
        <ul>
          <li>na een vast aantal minuten, <strong>of</strong></li>
          <li>
            een aantal seconden voor de vergadering begint (als de muziek wordt afgespeeld op een vergadering dag voordat de vergadering is begonnen).
          </li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

### Screenshots of the settings screen

<table class="showcase" markdown="0">
{% include image.html src="settings/app.png" alt="Applicatie configuratie" %}
{% include image.html src="settings/media.png" alt="Media setup" %}
{% include image.html src="settings/meeting.png" alt="Vergadering setup" %}
</table>
