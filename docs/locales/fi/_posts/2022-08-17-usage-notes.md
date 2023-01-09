---
tag: Help
title: Tekniset käyttöohjeet
ref: usage-notes
---

Sovelluksen pitäisi toimia useimmissa nykyaikaisissa Windows-, Linux- tai Mac-tietokoneissa.

### Windows: Asennus ja ensimmäinen käynnistys

Kun avaat asennusohjelman, saatat saada [error](assets/img/other/win-smartscreen.png), joka ilmaisee, että "Windows SmartScreen esti tunnistamattoman sovelluksen käynnistymisen". Tämä johtuu siitä, että sovelluksella ei ole suurta määrää latauksia, ja siksi Windows ei ole "luottanut" siihen. Voit kiertää tämän napsauttamalla "Lisätietoja" ja sitten "Suorita silti".

### Linux: Asennus ja ensimmäinen käynnistys

[virallinen AppImage-dokumentaatio](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html):n mukaisesti, jos sovellus ei avaudu kunnolla, vahvista seuraavan komennon tulos:

`ysctl kernel.unprivileged_userns_clone`

Jos tulos on `0`, AppImage **ei** suoriteta, ellet suorita seuraavaa komentoa ja sen jälkeen uudelleenkäynnistystä:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Muista lukea [mitä tämä pitää sisällään](https://lwn.net/Articles/673597/) ennen kuin teet tämän.

### MacOS: Asennus ja ensimmäinen käynnistys

Jos saat sovelluksen käynnistämisen yhteydessä varoituksen, että sovellusta ei voi avata, joko siksi, että "se ei ole ladattu App Storesta" tai koska "kehittäjää ei voida vahvistaa", tämä [Applen tukisivu](https://support.apple.com/en-ca/HT202491) auttaa sinua pääsemään ohi että.

Jos saat viestin, joka ilmoittaa, että sinulla ei ole oikeutta avata sovellusta, kokeile joitain ratkaisuja osoitteesta [tämä sivu](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860).

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### MacOS: Automaattinen päivitys

Toisin kuin Windows ja Linux, automaattinen päivitystoiminto **ei** ole käytössä macOS:ssä, eikä teknisistä syistä todennäköisesti koskaan tule olemaankaan. Kuitenkin yksi kahdesta asiasta tapahtuu Mac-käyttäjille, kun päivitys on saatavilla:

- M³ yrittää ladata päivityspaketin ja avata sen automaattisesti, minkä jälkeen käyttäjän on suoritettava M³-päivityksen asennus manuaalisesti vetämällä ja pudottamalla päivitetty sovellus Sovellukset-kansioonsa. Sitten he voivat käynnistää juuri päivitetyn M³:n Sovellukset-kansiostaan tavalliseen tapaan.
- Jos edellinen vaihe epäonnistuu jossain vaiheessa, M³ näyttää jatkuvan ilmoituksen, joka ilmoittaa, että päivitys on saatavilla, ja linkin itse päivitykseen. Punainen, sykkivä ilmoitus näkyy myös M³:n päänäytön asetuspainikkeessa. Asetusnäytön M³-versionumero muuttuu painikkeeksi, jota napsautettaessa uusimman julkaisun lataussivu avautuu automaattisesti.
