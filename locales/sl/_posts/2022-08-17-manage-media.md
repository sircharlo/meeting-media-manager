---
tag: Uporaba
title: Upravljanje multimedijske vsebine
ref: manage-media
---

Na zaslonu za upravljanje multimedijske vsebine lahko uporabnik dodaja ali odstranjuje multimedijsko vsebino za kateri koli shod, upravlja ponavljajočo se multimedijsko vsebino in celo dodaja posebno multimedijsko vsebino za druge datume, za katere običajno ni načrtovan noben shod.

### Upravljanje multimedijske vsebine za kateri koli dan

Če želite upravljati multimedijsko vsebino za določen shod ali dan, preprosto kliknite na ploščico tistega dne na glavnem zaslonu M³. Če želite upravljati multimedijsko vsebino, ki se ponavlja na vsakem shodu, kliknite na ploščico Ponavljajoča se multimedijska vsebina.

### Dodajanje multimedijske vsebine

Takole lahko **dodate** multimedijsko vsebino z zaslona za urejanje multimedijske vsebine.

| Možnost                                       | Pojasnilo                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| `Vrsta nalaganja`                             | Izberite eno od treh `vrst multimedijskih vsebin` (glej spodaj).                |
| `Multimedijske vsebine, ki jih želite dodati` | Odvisno od izbrane `vrste multimedijske vsebine` (glej spodaj).                 |
| `Predpona imena datoteke`                     | Pred ime multimedijske datoteke lahko dodate do 6 številk za lažje razvrščanje. |
| `Seznam multimedijske vsebine`                | To prikazuje trenutno načrtovano multimedijsko vsebino za izbrani datum.        |

V polju `Multimedijske vsebine, ki jih želite dodati` so na voljo različne možnosti, odvisno od izbrane vrste multimedijskih vsebin.

| `Vrsta multimedijske vsebine` | Polje `Multimedijske vsebine, ki jih želite dodati`                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Pesem`                       | ... prikaže meni z vsemi videoposnetki kraljestvenih pesmi iz serije *sjjm* v jeziku multimedijske vsebine. To možnost izberite, če želite na primer dodati pesem za javni govor ali za obiske okrajnega nadzornika. <br><br>Izbrana pesem bo samodejno prenesena s spletne strani jw.org v jeziku občine ali skupine, kot je nastavljeno v [Nastavitvah]({{page.lang}}/#configuration).                                                              |
| `JWPUB`                       | ... omogoča, da na računalniku poiščete datoteko JWPUB (ali pa jo povlečete in spustite). <br><br> Nato boste morali izbrati razdelek ali poglavje, iz katerega želite dodati multimedijsko vsebino. S tem bo dodana tako vdelana multimedijska vsebina kot tudi vsebina iz referenc iz izbranega razdelka datoteke JWPUB. <br><br> Primer pogosto uporabljene datoteke JWPUB je S-34, vendar lahko uporabite katero koli datoteko JWPUB. |
| `Po meri`                     | ... omogoča, da na računalniku poiščete katero koli drugo multimedijsko datoteko (ali pa jo povlečete in spustite). <br><br>*Upoštevajte, da bo program M³ vse datoteke PDF in SVG samodejno pretvoril v slike visoke ločljivosti.*                                                                                                                                                                                                                   |
| `JW.ORG`                      | ... vam omogoča, da izberete videoposnetek med najnovejšimi objavljenimi videoposnetki na jw.org.                                                                                                                                                                                                                                                                                                                                                                 |

### Odstranjevanje, skrivanje in prikazovanje multimedijske vsebine

Če želite **odstraniti**, **skriti** ali **prikazati** multimedijsko vsebino, preprosto poiščite multimedijsko datoteko, ki je ne potrebujete, in kliknite na ustrezno ikono.

| Rdeča 🟥 (izbriši) ikona                                        | Ikona ☑️ (odkljukano potrditveno polje)                                                                                                                      | Ikona 🔲 (neodkljukano potrditveno polje)                                                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The media file was added to that day's media by you or the VO. | The media file is referenced in the meeting's material. <br><br> It *will* be downloaded from JW.org or extracted from the relevant publication. | The media file is referenced in the meeting's material. <br><br> It was hidden by you or the VO, so it *will not* be downloaded or added to the meeting's media. |

### Screenshots of the media management screen

{% include screenshots/manage-media.html lang=site.data.sl %}
