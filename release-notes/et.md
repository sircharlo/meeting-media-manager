<!-- markdownlint-disable no-duplicate-heading -->

# Mis on uut

Täielik nimekiri versioonide vahelistest muudatustest on esitatud failis CHANGELOG.md GitHubis.

## 25.4.1

### 🛠️ Parandused ja täiustused

- 🎬 **Fix Custom Start/End Time Assignment**: Prevent custom start and end times from being incorrectly applied to the wrong video.
- 📝 **Allow Mismatched Subtitles**: Enable use of subtitles even when they do not perfectly match the media file.
- 🪟 **Disable Rounded Corners on Windows**: Remove rounded corners for the media window on Windows.
- 🖼 **Include Non-Referenced Images in Media List**: Ensure all non-referenced images are added to the media list for completeness.
- ➕ **Prevent Duplicate Media Sections**: Avoid creating multiple media sections for the same media item.
- 📥 **Preserve Playlist Order on Import**: Maintain the original order of JWL playlists during the import process.

## 25.4.0

### ✨ Uued funktsioonid

- 🇵🇭 **New Language: Tagalog**: Added support for Tagalog, expanding the app's multilingual capabilities.
- 🎞 **Support for `.m4v` Video Format**: Now supports playback of `.m4v` files to improve media compatibility.

### 🛠️ Parandused ja täiustused

- 🎬 **Multiple Start/End Times for Single Video**: Allow a single video to appear in the media list multiple times with different custom start/end times.
- 📤 **Include Grouped Media in Auto Export**: Automatically export grouped media items along with others.
- 📡 **Correct `.m4v` Fetching from JW API**: Ensure `.m4v` files are correctly fetched from the JW API.

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
