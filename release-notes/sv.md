<!-- markdownlint-disable no-duplicate-heading -->

# Vad är nytt

För den fullständiga listan över ändringar mellan versioner, se vår CHANGELOG.md-fil på GitHub.

## v25.9.1

### ✨ Nya funktioner

- ✨ **Mediafönstret alltid överst och helskärmsvisning**: Förbättrad alltid överst-funktion för mediafönstret, justera dynamiskt beroende på fullskärmsläget.
- ✨ **Inställningar för datumvisning**: Lagt till en användarinställning för att konfigurera formatet för datumvisning.
- ✨ **Mediatoning**: Infört tonade övergångar för media, istället för den mer abrupta tona-till-svart övergången som fanns innan.
- ✨ **macOS Click-through för inaktiva fönster**: Aktiverade musklick som går igenom till huvudfönstret i macOS, vilket bör göra det enklare att styra appen även när den inte är i fokus.

## v25.9.0

### ✨ Nya funktioner

- ✨ **Ladda ner Popup förbättringar**: Tillagt uppdateringsknapp och nedladdningsgruppering i datumordning i nedladdnings-popupen.
- ✨ **Bevakad mediaordningsminne**: Tillagd sektion ordningsminne för bevakade medieobjekt.

## v25.8.3

### ✨ Nya funktioner

- ✨ **Tonade övergångar för mediafönster**: Lagt till en ny avancerad inställning för att tona in/ut mediafönstret, detta ger em snyggare visuell övergång.
- ✨ **Bildvaraktighetskontroll och framstegsspårning**: Lagt till kontroll av bildens varaktighet och förloppsspårningskapacitet för upprepade sektioner.

## v25.8.1

### ✨ Nya funktioner

- ✨ **Anpassade mediesektioner**: Komplett system för att skapa, redigera och hantera anpassade mediesektioner med färganpassning och dra-och-släpp-beställning.
- ✨ **Mediaavdelares**: Lägg till avdelare i medielistor för bättre organisation med alternativ för topp/bottenpositionering.
- ✨ **Avsnitt Upprepningsläge**: Aktivera kontinuerlig uppspelning inom specifika sektioner för sömlösa media-loopar.
- ✨ **Zoomintegration**: Automatisk skärmdelning starta/stoppa koordination med medieuppspelning.

### 🛠️ Förbättringar och justeringar

- 🛠️ **Förbättrade sektionshuvuden**: Nytt menysystem med tre prickar med färgväljare, flytta upp/ner kontroller, upprepa alternativ och ta bort funktionalitet.
- ✨ **Inline titelredigering**: Redigera medietitlar direkt i gränssnittet utan att öppna separata dialogrutor.
- 🛠️ **Förbättrad navigering**: Bättre kortkommandon med scroll-till-vald funktionalitet och förbättrad medienavigering.
- 🛠️ **Visuella förbättringar**: Animeringsstöd vid sortering och förbättrad dra-och-släpp-visuell feedback.

## 25.6.0

### ✨ Nya funktioner

- ✨ **Anslutning med datapriser**: Lagt till en ny inställning för att minska användningen av bandbredd för nedladdning anslutningar med datapriser.
- ✨ **Förbättrad mediehantering för streaming**: Bättre stöd för strömmade medier, vilket minskar latensrelaterade problem.

### 🛠️ Förbättringar och justeringar

- 🛠️ **Bättre hantering av mime-typer**: Förbättrat stöd för MIME-typer för bättre mediekompatibilitet.
- 🛠️ **Förbättrad navigation**: Förbättrad hantering av miniläge och tillsatt verktygstips för bättre användarnavigering.
- 🛠️ **Linuxkompatibilitet**: Tvingad användning av GTK 3 på Linux för att förhindra problem med UI och uppstart.

## 25.5.0

### ✨ Nya funktioner

- 🖼️ **OBS fördröjningsalternativ för bilder**: Lägg till en OBS Studio-inställning för att fördröja scenändringar när bilder visas för att förbättra övergångar.
- 🔊 **Stöd för .m4a Ljudformat**: Lagt till stöd för .m4a-ljudfiler för att utöka mediatyper.

### 🛠️ Förbättringar och justeringar

- 🔍 **Återställ Zoomning med Ctrl + Scroll**: Nollställning av zoomning för enklare navigering.
- 👤 **Dölj oanvänd media för kretsbesöket**: Dölj istället för att hoppa över media som inte används för kretsbesöket, för att hålla en renare visning.
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
