---
tag: Hjälp
title: Anmärkningar om teknisk användning
ref: usage-notes
---

Programmet ska köras som på de flesta moderna datorer som kör Windows, Linux eller macOS.

### Windows: Installation och första uppstart

När du öppnar installationsprogrammet kan du få ett [fel](assets/img/other/win-smartscreen.png) som indikerar att "Windows SmartScreen förhindrade en okänd app från att starta". Detta beror på att programmet inte har ett stort antal nedladdningar, och följaktligen inte är uttryckligen "betrodd" av Windows. För att komma runt detta klickar du bara på "Mer info" och sedan "Kör ändå".

### Linux: Installation och första uppstart

Enligt [officiell AppImage-dokumentation](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), om appen inte öppnas ordentligt, bekräfta utmatningen av följande kommando:

`sysctl kernel.unprivileged_userns_clone`

Om utdata är `0` kommer AppImage **inte** att köras om du inte kör följande kommando, följt av en omstart:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Se till att du läser på [vad detta innebär](https://lwn.net/Articles/673597/) innan du gör detta.

### macOS: Installation och första uppstart

Om du när du startar appen får en varning om att appen inte kan öppnas, antingen för att "den inte laddades ner från App Store" eller för att "utvecklaren inte kan verifieras", så hjälper denna [Apples supportsida](https://support.apple.com/en-ca/HT202491) dig att komma förbi det.

Om du får ett meddelande som indikerar att du "inte har behörighet att öppna programmet", försök med några lösningar från [denna sida](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860), exempelvis genom att köra följande kommando i `Terminal.app`:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Problem med ljud- eller mikrofonbehörigheter i macOS Sonoma

Från och med macOS Sonoma, kan vissa användare kan stöta på ett problem där M³ upprepade gånger ger ett felmeddelande som indikerar att den behöver tillgång till mikrofonen. Följande kommando i `Terminal.app` har löst problemet för vissa:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Automatisk uppdatering

Till skillnad från Windows och Linux är autouppdatering **inte** implementerat på macOS och kommer troligen av tekniska skäl aldrig att bli det heller. Men en av två saker kommer att hända för macOS-användare när en uppdatering är tillgänglig:

- M³ kommer att försöka hämta uppdateringspaketet och öppna det automatiskt, varefter användaren måste manuellt slutföra installationen av M³-uppdateringen genom att dra och släppa den uppdaterade programmet till sin programmapp. Sedan kommer de att kunna starta den nyligen uppdaterade M³ från sin programmapp som vanligt.
- Om föregående steg misslyckas i något skede, kommer M³ att visa en avisering som indikerar att en uppdatering är tillgänglig, med en länk till själva uppdateringen. En röd, pulserande notifiering kommer också att visas på inställningsknappen i huvudskärmen på M³. M³ versionsnummer i inställningar kommer att förvandlas till en knapp som öppnar senaste utgåvans nedladdningssida automatiskt.
