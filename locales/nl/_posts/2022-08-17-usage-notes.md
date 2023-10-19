---
tag: Hulp
title: Technische gebruiksnotities
ref: usage-notes
---

Deze applicatie zou moeten werken op de meeste moderne computers met Windows, Linux of MacOS.

### Windows: Installatie en eerste keer opstarten

Bij het openen van het installatiebestand krijg je misschien een [error](assets/img/other/win-smartscreen.png) die het volgende zegt: "Windows SmartScreen voorkwam dat een niet herkende applicatie geïnstalleerd werd". Dit komt omdat deze applicatie geen hoog aantal downloads heeft en daarom niet uitdrukkelijk "vertrouwd" wordt door Windows. Om dit op te lossen klik je op "Meer info" en dan "Toch uitvoeren".

### Linux: Installatie en eerste keer opstarten

Volgens de [officiële AppImage documentatie](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), als de app niet goed opent, controleer dan het resultaat van het volgende commando:

`sysctl kernel.unprivileged_userns_clone`

Als het resultaat `0` is, dan wordt de applicatie **niet** uitgevoerd, behalve als je het volgende commando uitvoert, gevolgd door het opnieuw opstarten van de computer:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Zorg ervoor dat je [weet wat dit inhoudt](https://lwn.net/Articles/673597/) voordat je dit doet.

### macOS: Installatie en eerste keer opstarten

Als je bij het openen van de applicatie de waarschuwing "het was niet gedownload van de App Store" of "de ontwikkelaar kan niet worden geverifieerd", dan kan deze [Apple help pagina](https://support.apple.com/en-ca/HT202491) je helpen om het probleem op te lossen.

Als je de waarschuwing "je hebt geen toestemming om de applicatie te openen" krijgt, probeer dan de oplossingen op [deze stackoverflow pagina](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860), bijvoorbeeld het volgende commando in `Terminal.app`:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Problemen met audio- of microfoonmachtigingen in macOS Sonoma

Sinds macOS Sonoma kunnen sommige gebruikers een probleem ondervinden waarbij M³ herhaaldelijk een foutmelding geeft dat het toegang tot de microfoon nodig heeft. Het uitvoeren van het volgende commando in `Terminal.app` heeft het probleem opgelost voor sommigen:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Automatisch updaten

Niet zoals Windows and Linux, is de automatisch updaten functie **niet** beschikbaar voor macOS en voor technische redenen zal dat waarschijnlijk nooit gebeuren. Een van de volgende dingen zal gebeuren als er een update beschikbaar is voor MacOS gebruikers:

- M³ zal proberen de update te downloaden en openen, waarna de gebruiker zelf handmatig de installatie van de update moet voltooien door de nieuwe versie te slepen naar de applicatie folder zoals gewoonlijk. Daarna, kan je de nieuwe versie van M³ vanaf de applicatie folder openen zoals gewoonlijk.
- Als de vorige stap mislukt, zal M³ een notificatie tonen die aangeeft dat er een update beschikbaar is met een link om de update te downloaden. De instellingen-knop zal een rode kleur krijgen. Het M³ versie nummer linksonder in het instellingen scherm zal een link worden die je verwijst naar de download pagina voor de update.
