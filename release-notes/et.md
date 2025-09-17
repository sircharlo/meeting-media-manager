<!-- markdownlint-disable no-duplicate-heading -->

# Mis on uut

Täielik nimekiri versioonide vahelistest muudatustest on esitatud failis CHANGELOG.md GitHubis.

## v25.9.1

### ✨ Uued funktsioonid

- ✨ **Media Window Always on Top & Fullscreen Behavior**: Fixed and improved always-on-top behavior for the media window, adjusting dynamically based on fullscreen state.
- ✨ **Date Display Format Setting**: Added a user setting to configure a date display format.
- ✨ **Media Crossfade**: Implemented crossfade transitions for media display, instead of the more abrupt fade-to-black transition that was present before.
- ✨ **macOS Click-Through on Inactive Windows**: Enabled mouse click passthrough on the main window for macOS, which should make it easier to control the app even when it's not focused.

## v25.9.0

### ✨ Uued funktsioonid

- ✨ **Allalaadimise hüpikakna täiustused**: Lisati värskendamise nupp ja allalaadimise hüpikaknas allalaadimiste rühmitamine kuupäeva järgi.
- ✨ **Vaadatud meedia järjekorra mälu**: Lisati vaadatud meediaelementide järjekorra mälu.

## v25.8.3

### ✨ Uued funktsioonid

- ✨ **Meediaakna üleminekud**: Lisatud on uus täiustatud säte, mis võimaldab meediaaknal sujuvalt sisse ja välja tuhmuda, pakkudes sõbralikumat visuaalseid üleminekuid.
- ✨ **Pildi kestuse kontroll ja esituse jälgimine**: Lisatud pildi kestuse kontroll ja esituse jälgimise võimalus korduvate osade jaoks.

## v25.8.1

### ✨ Uued funktsioonid

- ✨ **Kohandatud meediajaotised**: Täielik süsteem kohandatud meediajaotiste loomiseks, redigeerimiseks ja haldamiseks, värvide kohandamise ja drag-and-drop-funktsiooniga ümberjärjestamise võimalusega.
- ✨ **Meedia jaotised**: Lisage meedia nimekirjadesse pealkirjadega jaotised, et neid paremini organiseerida, kasutades ülemise/alumise paigutuse valikuid.
- ✨ **Jaotise kordusrežiim**: võimaldab pidevat taasesitust kindlate jaotiste piires, et saavutada sujuv meedia esitus.
- ✨ **Zoom-koostöö**: ekraani jagamise automaatne käivitamine/peatamine kooskõlas meedia taasesitusega.

### 🛠️ Parandused ja täiustused

- 🛠️ **Täiustatud jaotise pealkirjad**: uus kolmepunktiline menüüsüsteem värvivalijaga, üles/alla liigutamise nuppude, kordamisvalikute ja kustutamise funktsiooniga.
- ✨ **Pealkirjade redigeerimine**: redigeerige meediaelementide pealkirju otse kasutajaliideses, ilma eraldi dialoogaknaid avamata.
- 🛠️ **Parem navigeerimine**: Paremad klaviatuurikombinatsioonid valitud kohani kerimise funktsiooniga ja täiustatud meedianavigeerimine.
- 🛠️ **Visuaalsed täiustused**: Animaatsiooni tugi sorteerimistoimingute ajal ja parandatud drag-and-drop visuaalne tagasiside.

## 25.6.0

### ✨ Uued funktsioonid

- ✨ **Mobiilse ühenduse seaded**: Lisatud uus säte, mis vähendab allalaadimisribalaiuse kasutust mobiilsetel internetiühendustel.
- ✨ **Parandatud voogesituse meediahaldus**: Parem tugi voogesituse meediale, vähendades viivitustega seotud probleeme.

### 🛠️ Parandused ja täiustused

- 🛠️ **Parandatud mime-tüübi käsitlemine**: Parem meedia ühilduvus tänu täiustatud MIME-tüüpide toele.
- 🛠️ **Täiustatud navigeerimismenüü**: parandatud mini-oleku käsitlemine ja lisatud abiteate kuvamine, et parandada kasutaja navigeerimist.
- 🛠️ **Linuxi ühilduvus**: Linuxis on GTK 3 kasutamine kohustuslik, et vältida kasutajaliidese ja käivitamisega seotud probleeme.

## 25.5.0

### ✨ Uued funktsioonid

- 🖼️ **OBS viivitusvalik piltide jaoks**: Lisa OBS Studio seadistus, et viivitada stseeni muutusi piltide kuvamisel, parandades üleminekuid.
- 🔊 **.m4a audioformaadi toetus**: Lisatud ühilduvus `.m4a` audiofailidele, et laiendada toetatud meediatüüpe.

### 🛠️ Parandused ja täiustused

- 🔍 **Suurenduse taastamine klahvikombinatsiooniga `Ctrl` + `Scroll`**: Võimaldab uuesti koheselt suumi juhtimist + kerimist, et navigeerimine oleks lihtsam.
- 👤 **Peida kasutamata RÜ-meedia**: Peida kasutamata meedia ringkonaülevaataja külastuste ajal, et säilitada puhtam esitus.
- 🎵 **Parandatud dubleeritud laulude indikaatorit**: Parandatud duplikaatlaulude visuaalset märki, et neid oleks lihtsam tuvastada.

## 25.4.3

### 🛠️ Parandused ja täiustused

- ➕ **Media puhastamine alates v25.4.x**: Puhastab automaatselt orvuks jäänud või valesti paigutatud meediafailid alates v25.4.1 kuni v25.4.2, et tagada, et meediafailid ei puuduks või ei oleks meediafailide nimekirjas vales kohas.

## 25.4.2

### 🛠️ Parandused ja täiustused

- ➕ \*_Topelt meediafailide vältimine_: Välista mõnede meediaelementide korduvat lisamist meedia nimekirja.

## 25.4.1

### 🛠️ Parandused ja täiustused

- **Parandatud algus/lõpuaja määramine**: Väldi olukorda, kus kohandatud algus/lõpu aeg saab määratud valele meediafailile.
- 📝 **Luba kohandatud subtiitreid**: Võimaldab subtiitrite kasutamise isegi siis, kui need ei vasta täielikult meediafailile.
- 🪟 **Lülita välja ümardatud nurgad Windowsis**: Eemaldage ümardatud nurgad meediaaknast Windowsis.
- 🖼 **Lisa meedia loetelusse viitamata pilte**: Veenduge, et kõik mitteviidatud pildid lisatakse meeda nimekirja.
- ➕ **Dubleerivate meediasektsioonide tekkimise vältimine**: Vältige mitme meediasektsiooni loomist sama meediaelemendi jaoks.
- 📥 **Säilita esitusloendi järjekorda importimisel**: Säilitab JWL-i esitusloendite algse järjekorra importimise ajal.

## 25.4.0

### ✨ Uued funktsioonid

- 🇵🇭 **Uus keel: Tagalog**: Lisati tugi tagalogi keelele, mis laiendab rakenduse mitmekeelsuse võimekust.
- 🎞 **.m4v-videoformaadi toetus**: Programm toetab meedia ühilduvuse parandamiseks `.m4v` failide taasesitamist.

### 🛠️ Parandused ja täiustused

- 🎬 **Mitmed algus-/lõpuajad video jaoks**: Võimaldab ühe video ilmumist meediakanalite loetelus mitu korda erinevate kohandatud algus-/lõppaegadega.
- 📤 **Rühmitatud meedia lisamine automaatsesse eksportimisse**: Ekspordib automaatselt rühmitatud meediaelemendid koos teistega.
- 📡 **Parandatud `.m4v` JW API-st kättesaamine**: Tagatud on`.m4v` failide korrektne kättesaamine JW API-st.

## 25.3.1

### ✨ Uued funktsioonid

- 🌏 **Uus keel: Korea**: Lisatud toetus korea keelele, laiendades ligipääsetavust rohkematele kasutajatele.

### 🛠️ Parandused ja täiustused

- ⚡ **Parandatud jõudlust ja protsessori kasutust**: Optimeeritud jõudlust, et vähendada protsessori kasutamist ja suurendada tõhusust.
- 🔄**Sünkroniseerimise ja tõrgete lahendamine**: Lahendatud on mitmesugused sünkroonimise ja stabiilsusega seotud probleemid, et parandada usaldusväärsust.
- 📜 **Näita olemasolevatele kogudustele avaldamismärkusi**: Avaldamismärkused kuvatakse ainult nende koguduste puhul, mis on juba laetud.

## 25.3.0

### ✨ Uued funktsioonid

- 🎵 **Taustamuusika mängimine koos videotega**: Luba taustamuusika mängimist videote vaatamise ajal jätkata.
- 🎥 **Kaamerapilt viipekeelse meedia jaoks**: Lisage võimalus kuvada meediaaknas kaameravoogu spetsiaalselt viipekeelsetele kasutajatele.
- 📅 **Automaatne mälestusõhtu kuupäev ja taust**: Automaatselt tuvastab ja seab mälestusõhtupäeva ning valmistab ette mälestusõhtu koosoleku taustapildi.
- 📜 **Ekraaniväljaande märkuste kuvamine rakenduses**: Näidake väljaande märkusi otse rakenduses, et kasutajad saaksid pärast uuendust hõlpsasti muudatusi üle vaadata.

### 🛠️ Parandused ja täiustused

- ⚡ **Optimeeritud nutikas vahemälu puhastamine**: Parandatud nutika vahemälu puhastamise loogikat, et saavutada parem jõudlus ja tõhusus.
- 📂 **Korrektne ringkonnaülevaataja meediafailide paigutus**: Veenduge, et ringkonnaülevaataja külastuse meediafailid on paigutatud õigesse sektsiooni.
- 📅 **Välista tavakoosoleku meediafailid mälestusõhtuks**: Vigade vältimiseks ei lae programm alla tavakoosolekute jaoks meediafaile.
- 📅 **Peitke korralise koosoleku osad mälestusõhtul**: Eemaldage mittevajalikud koosolekute sektsioonid mälestusõhtu ajal, et kujundus oleks puhtam.
- 📖 **Parandatud viipekeelse piibli videote allalaadimine**: Lae alla õiged viipekeelsete Piibli peatükkide videod JWL-i esitusloendist.
