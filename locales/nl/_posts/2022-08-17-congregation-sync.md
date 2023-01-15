---
tag: Configuratie
title: Gemeente sync
ref: congregation-sync
---

De broeder die is aangesteld als *videoconferentie organisator* (VO) door het lichaam van ouderlingen kan M³ gebruiken om te beheren welke media beschikbaar wordt gemaakt voor het technische A/V ondersteuning team van zijn gemeente.

De VO, of iemand anders die door hem is aangesteld, kan:

- **extra** media uploaden om te delen tijdens een vergadering, zoals wanneer de kringopziener komt of voor een openbare lezing
- Media van JW.org **verbergen** dat niet relevant is voor de gekozen vergadering, bijvoorbeeld, wanneer een aandeel wordt vervangen door een plaatselijke behoefte
- **Terugkerende** media verwijderen of toevoegen, zoals een jaartekst filmpje of een mededelingen slideshow

Iedereen die verbonden is met dezelfde gemeente ontvangt deze wijzigingen automatisch wanneer ze op de *Haal media op* knop drukken.

Bedenk dat de gemeente sync optie geheel optioneel is.

### Hoe het werkt

M³'s onderliggende sync mechanisme gebruikt WebDAV. Dat bekent dat de VO (of iemand onder zijn leiding) een van de volgende opties moet kiezen:

- Een veilige WebDAV server opzetten die bereikbaar is via het internet, **of**
- een externe cloud storage service gebruiken die het WebDAV protocol ondersteunt (zie de *Hostnaam* optie in de *Gemeente sync setup* sectie hieronder).

Alle gebruikers die gesynchroniseerd willen worden moeten verbinden met dezelfde WebDAV server door gebruik te maken van de informatie en inloggegevens die de VO heeft opgegeven.

### Gemeente sync configuratie

| Instelling | Uitleg |
| --- | --- |
| `Hostnaam` | Het webadres van de WebDAV server. Veilige HTTP (HTTPS) is verplicht. <br><br> ***Let op:** De knop hostnaam toont een lijst met WebDAV providers waarvan bevestigd is dat ze werken met M³, en zal automatisch sommige velden voor je invullen. <br><br> De lijst is bedoeld om te helpen, maar is op geen enkele manier een promotie van een bepaalde service of aanbieder. De beste server is altijd degene die je zelf beheert...* |
| `Gebruikersnaam` | Gebruikersnaam voor de WebDAV service. |
| `Wachtwoord` | Wachtwoord voor de WebDAV service. <br><br> ***Let op:** Onder andere voor [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) en [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) moet je een app-specifiek wachtwoord instellen om WebDAV connecties toe te staan.* |
| `Gemeente sync folder` | Dit is de folder die gebruikt zal worden om alle media voor de vergaderingen te synchroniseren tussen gebruikers. Je kan het pad er in plakken/typen of navigeren via je muis naar de juiste folder. <br><br> ***Let op:** Zorg ervoor dat alle gemeente sync gebruikers hetzelfde pad invullen, anders werkt de synchronisatie niet zoals verwacht.* |
| `Gemeente brede instellingen` | Zodra de VO de *Media setup* en *Vergadering setup* secties van de [Instellingen]({{page.lang}}/#configuration) op zijn eigen computer heeft ingesteld, kan hij deze knop gebruiken om bepaalde instellingen vast te zetten voor alle gemeente sync gebruikers (bijvoorbeeld, vergadering dagen/tijden, media taal, conversie instellingen, etc.). Dit betekent dat sommige instellingen geforceerd aan of uit staan voor alle gesynchroniseerde gebruikers elke keer dat zij M³ openen. |

### Gemeente sync gebruiken om media te beheren

Zodra de gemeente sync set-up compleet is, ben je klaar om te beginnen met [Media beheren]({{page.lang}}/#manage-media) voor het technische AV-ondersteuning team van jouw gemeente.

### Schermafbeeldingen van de gemeente sync in actie

{% include screenshots/congregation-sync.html lang=site.data.nl %}
