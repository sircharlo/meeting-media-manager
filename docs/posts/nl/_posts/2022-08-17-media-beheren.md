---
tag: Usage
title: 'Media beheren'
ref: manage-media
---

Het media beheer scherm staat de gebruiker toe om media toe te voegen en te verwijderen for elke vergadering, terugkerende media te beheren en zelfs om speciale media voor andere dagen in de week te beheren.

### Media beheren voor elke dag van de week

Om media te beheren voor een specifieke vergadering of dag, kan je eenvoudig op die dag klikken in het beginscherm. Om media terugkerende media te beheren dat op elke vergadering nodig is kan je om "Terugkerende media" klikken op het beginscherm.

### Media toevoegen

Zo **voeg** je media **toe** via het media beheer scherm.

| Optie                    | Uitleg                                                                       |
| ------------------------ | ---------------------------------------------------------------------------- |
| `Type upload`            | Kies een van de 3 soorten `media typen` (zie hieronder)                      |
| `Media om toe te voegen` | Afhankelijk van het gekozen `media type` (zie hieronder)                     |
| `Bestandsnaam prefix`    | Tot 6 getallen die voor de bestandsnaam komen te staan om te kunnen sorteren |
| `Media lijst`            | Deze lijst toont de huidige media die gepland staat voor de gekozen datum    |

In het `Media om toe te voegen` veld heb je verschillende opties, afhankelijk van het gekozen media type.

<table>
  <thead>
    <th><code>Media type</code></th>
    <th>Het <code>Media om toe te voegen</code> veld</th>
  </thead>
  <tbody>
    <tr>
      <td><code>Lied</code></td>
      <td>
        ... toont een menu met koninkrijksliederen van de <em>sjjm</em> serie, in jouw media taal. Kies deze optie om bijvoorbeeld het lied van de openbare lezing of van de kringopziener toe te voegen.<br>
        <br>
        Het gekozen lied zal automatisch gedownload worden van JW.org in de taal van jouw gemeente of groep, zoals ingesteld in de <a href="nl/#/configuratie">instellingen</a>.
      </td>
    </tr>
    <tr>
      <td><code>JWPUB</code></td>
      <td>
        Kies (of drag en drop) een JWPUB bestand.<br>
        <br>
        Je zal gevraagd worden om een sectie of hoofdstuk te selecteren waarvan je de media wilt toevoegen. Deze optie zal zowel de bijgeleverde als de gerefereerde media toevoegen.<br>
        <br>
        Een voorbeeld van een vaak gebruikte JWPUB bestand is het S-34 formulier, maar elk JWPUB bestand kan gebruikt worden.
      </td>
    </tr>
    <tr>
      <td><code>Custom</code></td>
      <td>
        Kies (of drag en drop) andere bestanden van je computer.<br>
        <br>
        <blockquote>Bedenk dat alle PDF en SVG bestanden automatisch worden omgezet in plaatjes van hoge resolutie door M³.</blockquote>
      </td>
    </tr>
  </tbody>
</table>

### Media verwijderen, verbergen en tonen

Om media te **verwijderen**, **verberen**, of te **tonen**, zoek je eenvoud het bestand waar het om gaat en druk je op het bijbehorende icoontje.

<table>
  <thead>
    <th>Media heeft een rood 🟥 (verwijder) icoontje</th>
    <th>Media heeft een ☑️ (checked checkbox) icoontje</th>
    <th>Media heeft een 🔲 (unchecked checkbox) icoontje</th>
  </thead>
  <tbody>
    <tr>
      <td>
        Het mediabestand was toegevoegd voor die dag door jouw of een andere gebruiker.<br>
        <br>
        Klik op het rode 🟥 (verwijder) icoontje om het bestand te verwijderen.<br>
        Klik nog een keer om te bevestigen
      </td>
      <td>
        Er wordt naar dit bestand verwezen in het materiaal van de vergadering.<br>
        <br>
        Het bestand <em>zal</em> gedownload worden van JW.org of gehaald worden uit de relevantie publicatie.
      </td>
      <td>
        Er werd naar dit bestand verwezen in het materiaal van de vergadering.<br>
        <br>
        Het bestand is verborden door jou of de VO, dus <em>zal</em> het <em>niet</em> gedownload of toegevoegd worden aan de media lijst.
      </td>
    </tr>
  </tbody>
</table>

### Schermafbeeldingen van het beheer media scherm

<table class="showcase" markdown="0">
{% include image.html src="manage/song-media.png" alt="Een lied toevoegen voor een openbare lezing" %}
{% include image.html src="manage/custom-media.png" alt="Een extra plaatje toevoegen" %}
{% include image.html src="manage/jwpub-extract.png" alt="Media importeren van een JWPUB bestand" %}
{% include image.html src="manage/jwpub-media.png" alt="Media tonen van een JWPUB bestand voordat het geïmporteerd wordt" %}
{% include image.html src="manage/rename-media.png" alt="Een mediabestand hernoemen" %}
</table>
