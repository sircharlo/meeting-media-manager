<!-- markdownlint-disable no-duplicate-heading -->

# Vad är nytt

För den fullständiga listan över ändringar mellan versioner, se vår CHANGELOG.md-fil på GitHub.

## v25.8.1

### ✨ Nya funktioner

- ✨ **Custom Media Sections**: Complete system for creating, editing, and managing custom media sections with color customization and drag-and-drop reordering.
- ✨ **Media Dividers**: Add titled dividers within media lists for better organization with top/bottom positioning options.
- ✨ **Section Repeat Mode**: Enable continuous playback within specific sections for seamless media loops.
- ✨ **Zoom Integration**: Automatic screen sharing start/stop coordination with media playback.

### 🛠️ Förbättringar och justeringar

- 🛠️ **Enhanced Section Headers**: New three-dots menu system with color picker, move up/down controls, repeat options, and delete functionality.
- ✨ **Inline Title Editing**: Edit media item titles directly in the interface without opening separate dialogs.
- 🛠️ **Improved Navigation**: Better keyboard shortcuts with scroll-to-selected functionality and enhanced media navigation.
- 🛠️ **Visual Enhancements**: Animation support during sorting operations and improved drag-and-drop visual feedback.

## 25.6.0

### ✨ Nya funktioner

- ✨ **Anslutning med datapriser**: Lagt till en ny inställning för att minska användningen av bandbredd för nedladdning anslutningar med datapriser.
- ✨ **Förbättrad mediehantering för streaming**: Bättre stöd för strömmade medier, vilket minskar latensrelaterade problem.

### 🛠️ Förbättringar och justeringar

- 🛠️ **Bättre hantering av mime-typer**: Förbättrat stöd för MIME-typer för bättre mediekompatibilitet.
- 🛠️ **Förbättrad navigation drawer**: Förbättrad hantering av miniläge och tillsatt verktygstips för bättre användarnavigering.
- 🛠️ **Linuxkompatibilitet**: Tvingad användning av GTK 3 på Linux för att förhindra problem med UI och uppstart.

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
