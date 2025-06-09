<!-- markdownlint-disable no-duplicate-heading -->

# Vad är nytt

För den fullständiga listan över ändringar mellan versioner, se vår CHANGELOG.md-fil på GitHub.

## v25.6.0 Release Notes

### ✨ Nya funktioner

- ✨ **Metered connection setting**: Added a new setting to reduce download bandwidth usage on metered connections.
- ✨ **Improved streamed media handling**: Better support for streamed media, reducing latency-related issues.

### 🛠️ Förbättringar och justeringar

- 🛠️ **Better mime type handling**: Improved support for MIME types for better media compatibility.
- 🛠️ **Enhanced navigation drawer**: Improved mini state handling and added tooltip display for better user navigation.
- 🛠️ **Linux compatibility**: Forced GTK 3 usage on Linux to prevent UI and launch issues.

## 25.5.0

### ✨ Nya funktioner

- 🖼️ **OBS fördröjningsalternativ för bilder**: Lägg till en OBS Studio-inställning för att fördröja scenändringar när bilder visas för att förbättra övergångar.
- 🔊 **Stöd för .m4a Ljudformat**: Lagt till stöd för .m4a-ljudfiler för att utöka mediatyper.

### 🛠️ Förbättringar och justeringar

- 🔍 **Återställ Zoomning med Ctrl + Scroll**: Nollställning av zoomning för enklare navigering.
- 👤 **Dölj oanvänd media för kretsbesöket**: Dölj istället för att hoppa över media som inte används för kretsbesöket, för att hålla en renare presentation.
- 🎵 **Hitta dubletter av sånger**: Gör det lättare att hitta dubletter av sånger.

## 25.4.3

### 🛠️ Förbättringar och justeringar

- ➕ **Rensa media från v25.4.x**: Städa automatiskt upp övergivna eller felplacerade medier från v25.4.1 till v25.4.2 för att säkerställa att inga medier saknas eller är på fel plats i medialistan.

## 25.4.2

### 🛠️ Förbättringar och justeringar

- ➕ **Förhindra mediaduplicering**: Undvik att lägga till några medieobjekt flera gånger i medialistan.

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
