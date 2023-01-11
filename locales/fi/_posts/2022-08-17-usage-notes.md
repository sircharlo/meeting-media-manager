---
tag: Tuki
title: Tekniset käyttöohjeet
ref: usage-notes
---

Sovelluksen toimii useimmissa nykyaikaisissa tietokoneissa, joissa on Windows, Linux, tai macOS.

### Windows: Asennus ja ensimmäinen käynnistys

Asennusohjelman avaamisen yhteydessä saatat saada [virheen](assets/img/other/win-smartscreen.png), joka osoittaa, että "Windows SmartScreen esti tunnistamattoman sovelluksen käynnistämistä". Tämä johtuu siitä, että sovelluksella ei ole suuri määrä latauksia eikä Windows-sovellus näin ollen nimenomaisesti "luota" ohjelmaa. Jos haluat kiertää tämän, klikkaa "Lisää tietoa", sitten "Suorita joka tapauksessa".

### Linux: Asennus ja ensimmäinen käynnistys

[virallinen AppImage-dokumentaatio](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html):n mukaisesti, jos sovellus ei avaudu kunnolla, vahvista seuraavan komennon tulos:

`sysctl kernel.unprivileged_userns_clone`

Jos tulos on `0`, AppImage **ei** suoriteta, ellet suorita seuraavaa komentoa ja sen jälkeen uudelleenkäynnistystä:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Muista lukea [mitä tämä pitää sisällään](https://lwn.net/Articles/673597/) ennen kuin teet tämän.

### macOS: Asennus ja ensimmäinen käynnistys

Jos saat sovelluksen käynnistämisen yhteydessä varoituksen, että sovellusta ei voi avata, joko siksi, että "se ei ole ladattu App Storesta" tai koska "kehittäjää ei voida vahvistaa", tämä [Applen tukisivu](https://support.apple.com/en-ca/HT202491) auttaa sinua pääsemään ohi että.

Jos saat viestin, joka ilmoittaa, että sinulla ei ole oikeutta avata sovellusta, kokeile joitain ratkaisuja osoitteesta [tämä sivu](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860).

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Automaattinen päivitys

Toisin kuin Windows ja Linux, MacOs **ei** ole ottanut automaattipäivitystoimintoa käyttöön, ja teknisistä syistä luultavasti ei koskaan tule tekemään niin. Kuitenkin toinen kahdesta asiasta tapahtuu Macin käyttäjille, kun päivitys on saatavilla:

- M³ yrittää ladata päivityspaketin ja avata sen automaattisesti, jonka jälkeen käyttäjän on suoritettava M³-päivityksen asennus manuaalisesti vetämällä ja pudottamalla päivitetty sovellus heidän Sovelluskansioon. Sitten he voivat käynnistää äskettäin päivitetyn M³ kansiosta normaalisti.
- Jos edellinen vaihe ei onnistu missään vaiheessa, M³ näyttää jatkuvan ilmoituksen, joka osoittaa, että päivitys on saatavilla ja linkki itse päivitykseen. Punainen, sykkivä ilmoitus tulee näkyviin myös asetuspainikkeessa, joka on M³:n päänäytössä. M³-version numero asetusnäytössä muuttuu painikkeeksi joka kerran avaa lataussivun automaattisesti.
