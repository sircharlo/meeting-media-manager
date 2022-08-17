---
tag: Configuration
title: 'Gemeente sync'
ref: congregation-sync
---

De broeder die is aangesteld als _videoconferentie organisator_ (VO) door het lichaam van ouderlingen kan M³ gebruiken om te beheren welke media beschikbaar wordt gemaakt voor het technische A/V ondersteuning team van zijn gemeente.
De VO, of iemand anders die door hem is aangesteld, kan:

- **extra** media uploaden om te delen tijdens een vergadering, zoals wanneer de kringopziener komt of voor een openbare lezing
- Media van JW.org **verbergen** dat niet relevant is voor de gekozen vergadering, bijvoorbeeld, wanneer een aandeel wordt vervangen door een plaatselijke behoefte
- **Terugkerende** media verwijderen of toeviegen, zoals een jaartekst filmpje of een mededelingen slideshow

Iedereen die verbonden is met dezelfde gemeente ontvangt deze wijzigingen automatisch wanneer ze op de _Haal media op_ knop drukken.

Bedenk dat de gemeente sync optie geheel optioneel is.

### Hoe het werkt

M³'s onderliggende sync mechanisme gebruikt WebDAV. Dat bekent dat de VO (of iemand onder zijn leiding) een van de volgende opties moet kiezen:

- Een veilige WebDAV server opzetten die bereikbaar is via het internet, **of**
- een externe cloud storage service gebruiken die het WebDAV protocol ondersteunt (see the `gemeente sync hostnaam` instelling in the _Gemeente sync setup_ sectie hieronder).

Alle gebruikers die gesynchroniseerd willen worden moeten verbinden met dezelfde WebDAV server door gebruik te maken van de informatie en inloggegevens die de VO heeft opgegeven.

### Gemeente sync

<table>
  <thead>
    <tr>
      <th>Instelling</th>
      <th>Uitleg</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>Gemeente sync hostnaam</code></td>
      <td>
      Het webadres van de WebDAV server. Veilige HTTP (HTTPS) is verplicht.<br>
        <br>
        <blockquote>
          <strong>Let op:</strong>De knop hostnaam toont een lijst met WebDAV providers waarvan bevestigd is dat ze werken met M³, en zal automatisch sommige velden voor je invullen. <br><br>De lijst is bedoeld om te helpen, maar is op geen enkele manier een promotie van een bepaalde service of aanbieder. De beste server is altijd degene die je zelf beheert...
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Gemeente sync poort</code></td>
      <td>Normaal gesproken 443 for standaard HTTPS, maar is misschien anders, afhankelijk van de website.</td>
    </tr>
    <tr>
      <td><code>Gemeente sync gebruikersnaam</code> </td>
      <td>Gebruikersnaam voor de WebDAV service.</td>
    </tr>
    <tr>
      <td><code>Gemeente sync wachtwoord</code></td>
      <td>
        Wachtwoord voor de WebDAV service.<br>
        <br>
        <blockquote>
          <strong>Let op:</strong> Onder andere voor <a href="https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box">Box</a> en <a href="https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/">Koofr</a> moet je een app-specifiek wachtwoord instellen om WebDAV connecties toe te staan.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Gemeente sync folder</code></td>
      <td>
        Dit is de folder die gebruikt zal worden om alle media voor de vergaderingen te synchroniseren tussen gebruikers<br>
        <br>
        Je kan het pad er in plakken/typen of navigeren via je muis naar de juiste folder<br>
        <br>
        <blockquote>
          <strong>Let op:</strong>Zorg ervoor dat alle gemeente sync gebruikers hetzelfde pad invullen, anders werkt de sync niet zoals verwacht.
        </blockquote>
      </td>
    </tr>
    <tr>
      <td><code>Gemeente-brede instellingen</code></td>
      <td>
        Zodra de VO de <em>Media setup</em> en <em>Vergadering setup</em> secties van de <a href="nl/#/configuratie">M³ instellingen</a> op zijn eigen computer heeft ingesteld, kan hij deze knop gebruiken om bepaalde instellingen vast te zetten voor alle gemeente sync gebruikers (bijvoorbeeld, vergadering dagen/tijden, media taal, conversie instellingen, etc.). Dit betekent dat sommige instellingen geforceerd aan of uit staan voor alle gesynchroniseerde gebruikers elke keer dat zij M³ openen.
      </td>
    </tr>
  </tbody>
</table>

### Gemeente sync gebruiken om media te beheren

Zodra de gemeente sync setup compleet is, ben je klaar om te beginnen met <a href="nl/#/media beheren">media beheren</a> voor het technische AV ondersteuning team van jouw gemeente.

### Schermafbeeldingen van de gemeente sync in actie

<table class="showcase" markdown="0">
{% include image.html src="settings/cong.png" alt="Gemeente sync setup" %}
</table>
