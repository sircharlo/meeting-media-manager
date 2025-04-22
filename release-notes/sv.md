<!-- markdownlint-disable no-duplicate-heading -->

# Vad är nytt

För den fullständiga listan över ändringar mellan versioner, se vår CHANGELOG.md-fil på GitHub.

## 25.4.3

### 🛠️ Förbättringar och justeringar

- ➕ **Clean Up Media From v25.4.x**: Automatically clean up orphaned or misplaced media from v25.4.1 to v25.4.2 to ensure no media is missing or in the wrong place in the media list.

## 25.4.2

### 🛠️ Förbättringar och justeringar

- ➕ **Prevent Duplicate Media**: Avoid adding some media items multiple times to the media list.

## 25.4.1

### 🛠️ Förbättringar och justeringar

- 🎬 **Fixa anpassad start-/sluttidsuppgift**: Förhindra att anpassade start- och sluttider inte tillämpas felaktigt på fel video.
- 📝 **Tillåt felaktiga undertexter**: Använd undertexter även om de inte matchar perfekt med videon.
- 🪟 **Inaktivera rundade hörn på fönster**: Ta bort rundade hörn för mediafönstret i Windows.
- 🖼️ **Inkludera bilder som inte är refererade i medielistan**: Se till att alla bilder läggs till i medielistan för enhetlighet.
- ➕ **Förhindra duplicera mediesektioner**: Undvik att skapa flera mediesektioner för samma medieobjekt.
- 📥 **Bevara ordning på spellistan vid import**: Behåll den ursprungliga ordningen för JWL spellistor under importprocessen.

## 25.4.0

### ✨ Nya funktioner

- 🇵🇭 **Nytt språk: Tagalog**: Lagt till stöd för Tagalog som utökar därmed appens flerspråkighet.
- 🎞️ **Stöd för `.m4v` videoformat**: Stöder nu uppspelning av `.m4v`-filer för att förbättra mediekompatibiliteten.

### 🛠️ Förbättringar och justeringar

- 🎬 **Flera start-/sluttider för en video**: Tillåt att en enda video visas i medielistan flera gånger med olika anpassade start-/sluttider.
- 📤 **Inkludera grupperade media i Auto export**: Exportera automatiskt grupperade mediaobjekt tillsammans med andra.
- 📡 **Korrekt `.m4v` Hämtar från JW API**: Se till att `.m4v`-filer hämtas korrekt från JW API.

## 25.3.1

### ✨ Nya funktioner

- 🌏 **Nytt språk: Koreanska**: Lägg till stöd för det Koreanska språket, utöka tillgängligheten för fler användare.

### 🛠️ Förbättringar och justeringar

- ⚡ **Förbättra prestanda och processoranvändning**: Optimera prestanda för att minska processoranvändningen och öka effektiviteten.
- 🔄 **Fixa synkronisering och kraschproblem**: Lös olika synkroniserings- och stabilitetsproblem för att förbättra tillförlitligheten.
- 📜 **Visa versionshistorik för befintliga församlingar**: Se till att versionshistoriken endast visas för församlingar som redan används.

## 25.3.0

### ✨ Nya funktioner

- 🎵 **Spela bakgrundsmusik med videor**: Tillåt bakgrundsmusik att fortsätta spela medan videor visas.
- 🎥 **Kameraflöde för teckenspråk**: Lägg till möjligheten att visa ett kameraflöde i mediafönstret speciellt för teckenspråksanvändare.
- 📅 **Automatisk datum och bakgrund för minneshögtiden**: Ställ in automatiskt bakgrundsbild och datum för minneshögtiden.
- 📜 **Visa versionsinfo i appen**: Visa versionsinformation direkt i programmet så att användarna enkelt kan se vad som är ändrats efter en uppdatering.

### 🛠️ Förbättringar och justeringar

- ⚡ **Optimera Smart Cache rensning**: Förbättra den smarta cache-mekanismen för bättre prestanda och effektivitet.
- 📂 **Korrekt mediaplacering för kretsveckan**: Se till att kretsveckans media placeras i rätt avsnitt.
- 📅 **Slipp det vanliga mötesmediat vid minneshögtiden**: Förhindra hämtning av standardmötesmedia för minneshögtiden för att förhindra fel.
- 📅 **Dölj vanliga mötespunkter vid minneshögtiden**: Ta bort vanliga mötestillfällen under minneshögtiden för en renare layout.
- 📖 **Ordna bibeln på teckenspråk**: Ladda ner videor för korrekt bibelkapitel från JWL spellistor.
