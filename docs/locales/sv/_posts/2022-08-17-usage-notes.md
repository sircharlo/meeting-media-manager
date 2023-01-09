---
tag: Help
title: Anmärkningar om teknisk användning
ref: usage-notes
---

Appen bör kunna köras som den är på de flesta moderna datorer som kör Windows, Linux eller Mac.

### Windows: Installation och första uppstart

När du öppnar installationsprogrammet kan du få ett [error](assets/img/other/win-smartscreen.png) som indikerar att "Windows SmartScreen förhindrade att en okänd app startade". Detta beror på att appen inte har ett högt antal nedladdningar, och följaktligen inte är explicit "betrodd" av Windows. För att komma runt detta klickar du helt enkelt på "Mer info" och sedan på "Kör ändå".

### Linux: Installation och första uppstart

Enligt [officiell AppImage-dokumentation](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), om appen inte öppnas ordentligt, bekräfta utmatningen av följande kommando:

`ysctl kernel.unprivileged_userns_clone`

Om utdata är `0` kommer AppImage **inte** att köras om du inte kör följande kommando, följt av en omstart:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Se till att du läser på [vad detta innebär](https://lwn.net/Articles/673597/) innan du gör detta.

### MacOS: Installation och första uppstart

Om du när du startar appen får en varning om att appen inte kan öppnas, antingen för att "den inte laddades ner från App Store" eller för att "utvecklaren inte kan verifieras", så hjälper denna [Apples supportsida](https://support.apple.com/en-ca/HT202491) dig att komma förbi det.

Om du får ett meddelande som indikerar att du "inte har behörighet att öppna programmet", försök med några lösningar från [denna sida](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860).

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### MacOS: Automatisk uppdatering

Till skillnad från Windows och Linux är funktionalitet för automatisk uppdatering **inte** implementerad på macOS, och av tekniska skäl kommer förmodligen aldrig att bli det. Men en av två saker kommer att hända för Mac-användare när en uppdatering är tillgänglig:

- M³ kommer att försöka ladda ner uppdateringspaketet och öppna det automatiskt, varefter användaren måste manuellt slutföra installationen av M³-uppdateringen genom att dra och släppa den uppdaterade appen till sin Applikations-mapp. Sedan kommer de att kunna starta den nyligen uppdaterade M³ från deras Applikations-mapp som vanligt.
- Om det föregående steget misslyckas i något skede kommer M³ att visa ett ihållande meddelande som indikerar att en uppdatering är tillgänglig, med en länk till själva uppdateringen. Ett rött, pulserande meddelande kommer också att visas på inställningsknappen på huvudskärmen i M³. M³-versionsnumret på inställningsskärmen kommer att förvandlas till en knapp som, när den klickas, öppnar den senaste versionens nedladdningssida automatiskt.
