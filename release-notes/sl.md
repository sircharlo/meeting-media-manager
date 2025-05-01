<!-- markdownlint-disable no-duplicate-heading -->

# Kaj je novega

Za celoten seznam sprememb med različicami si oglejte našo datoteko CHANGELOG.md na GitHubu.

## 25.4.3

### 🛠️ Izboljšave in popravki

- ➕ **Čiščenje multimedijskih datotek iz verzije v25.4.x**: Samodejno čiščenje preostalih ali napačno umeščenih multimedijskih datotek iz verzije v25.4.1 v verzijo v25.4.2, da na seznamu multimedijske vsebine ne bo manjkala nobena datoteka ali da ne bo na napačnem mestu.

## 25.4.2

### 🛠️ Izboljšave in popravki

- ➕ **Preprečevanje podvojenih multimedijskih datotek**: Preprečitev večkratnega dodajanja nekaterih multimedijskih elementov na seznam multimedijske vsebine.

## 25.4.1

### 🛠️ Izboljšave in popravki

- 🎬 **Popravek prilagoditve začetnega/končnega časa po meri**: Preprečite, da bi se začetni in končni čas nepravilno uporabila za napačen videoposnetek.
- 📝 **Omogočanje neusklajenih podnapisov**: Omogočite uporabo podnapisov, tudi če se ne ujemajo popolnoma z multimedijsko datoteko.
- 🪟 **Onemogočite zaobljene vogale v sistemu Windows**: Odstranite zaobljene vogale za multimedijsko okno v operacijskem sistemu Windows.
- 🖼 **Vključitev slik, ki niso del referenc, na seznam multimedijskih datotek**: Na seznam multimedijskih datotek dodajte vse slike, ki niso del referenc.
- ➕ **Preprečevanje podvojenih multimedijskih razdelkov**: Preprečite ustvarjanje več multimedijskih razdelkov za isti multimedijski element.
- 📥 **Shrani vrstni red seznama predvajanja pri uvozu**: Pri uvozu se ohrani originalni vrstni red seznamov predvajanja JW Library.

## 25.4.0

### ✨ Nove funkcije

- 🇵🇭 **Nov jezik: tagalščina**: Dodana je bila podpora za tagalščino, s čimer so se razširile večjezične možnosti aplikacije.
- 🎞 **Podpora za `.m4v` video format**: Zdaj podpira predvajanje datotek `.m4v`, s čimer je izboljšana združljivost multimedijskih vsebin.

### 🛠️ Izboljšave in popravki

- 🎬 **Več začetnih/končnih časov za en videoposnetek**: Omogočeno je, da se en videoposnetek večkrat prikaže na multimedijskem seznamu z različnimi začetnimi/končnimi časi, nastavljenimi po meri.
- 📤 **Vključitev združenih medijev v samodejni izvoz**: Samodejno izvozi združene multimedijske datoteke skupaj z drugimi.
- 📡 **Pravilno pridobivanje datotek `.m4v` iz vmesnika JW API**: Poskrbi, da se datoteke `.m4v` pravilno pridobivajo iz vmesnika JW API.

## 25.3.1

### ✨ Nove funkcije

- 🌏 **Nov jezik: korejščina**: Dodana podpora za korejski jezik, s čimer se širi dostopnost za več uporabnikov.

### 🛠️ Izboljšave in popravki

- ⚡ **Izboljšana zmogljivost in uporaba procesorja**: Optimizacija delovanja za zmanjšanje porabe procesorja in povečanje učinkovitosti.
- 🔄 **Odpravljene težave s sinhronizacijo in sesutjem**: Rešene so različne težave, povezane s sinhronizacijo in stabilnostjo, da se izboljša zanesljivost.
- 📜 **Prikaži opombe ob izdaji za obstoječe občine**: Poskrbi, da se opombe o izdaji prikažejo le za občine, ki so že naložene.

## 25.3.0

### ✨ Nove funkcije

- 🎵 **Predvajanje glasbe v ozadju z videoposnetki**: Omogoči, da se glasba v ozadju predvaja tudi med ogledom videoposnetkov.
- 🎥 **Signal od kamere za multimedijsko vsebino znakovnega jezika**: Dodaj možnost, da je za uporabnike znakovnega jezika v oknu multimedijske vsebine prikazan signal od kamere.
- 📅 **Samodejni datum spominske slovesnosti in ozadje**: Samodejno zaznavanje in nastavitev datuma spominske slovesnosti ter priprava slike za prikaz na zaslonu med spominsko slovenostjo.
- 📜 **V aplikaciji prikaži opombe ob izdaji**: Prikaz opomb ob izdaji neposredno v aplikaciji, tako da lahko uporabniki po posodobitvi enostavno pregledajo spremembe.

### 🛠️ Izboljšave in popravki

- ⚡ **Optimiziranje pametnega čiščenja predpomnilnika**: Izboljšan je mehanizem pametnega čiščenja predpomnilnika za boljšo zmogljivost in učinkovitost.
- 📂 **Pravilna umestitev multimedijske vsebine okrajnega nadzornika**: Poskrbljeno je, da je multimedijska vsebina okrajnega nadzornika umeščena v pravi razdelek.
- 📅 **Izključitev multimedijske vsebine rednih shodov v času spominske slovesnosti**: Za preprečitev napak je za spominsko slovenost onemogočeno pridobivanje multimedijske vsebine rednih shodov.
- 📅 **Med spominsko slovenostjo so razdelki rednih shodov skriti**: Razdelki, ki med spominsko slovenostjo niso nepotrebni, so zaradi preglednosti skriti.
- 📖 **Popravljeni so prenosi svetopisemskih videoposnetkov za znakovni jezik**: Iz seznamov predvajanja JWL se zdaj pravilno prenesejo videoposnetki poglavij Svetega pisma v znakovnem jeziku.
