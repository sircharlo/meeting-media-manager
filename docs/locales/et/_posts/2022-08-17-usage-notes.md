---
tag: Help
title: Tehnilised kasutusjuhised
ref: usage-notes
---

Rakendus peaks töötama nii nagu enamikus kaasaegsetes Windowsi, Linuxi või Maci arvutites.

### Windows: Paigaldamine ja esimene käivitamine

Installeri avamisel võite saada [error](assets/img/other/win-smartscreen.png), mis näitab, et "Windows SmartScreen takistas tundmatu rakenduse käivitamist". Selle põhjuseks on asjaolu, et rakendusel pole palju allalaadimiste arvu ja seetõttu ei usalda Windows seda selgelt. Sellest mööda minemiseks klõpsake lihtsalt nuppu "Lisateave" ja seejärel "Käivita ikkagi".

### Linux: Paigaldamine ja esimene käivitamine

Vastavalt [ametlik AppImage dokumentatsioon](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html)-le, kui rakendus ei avane korralikult, kinnitage järgmise käsu väljund:

`ysctl kernel.unprivileged_userns_clone`

Kui väljund on `0`, siis rakendust AppImage **ei** käivitata, kui te ei käivita järgmist käsku, millele järgneb taaskäivitamine:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Enne selle tegemist lugege kindlasti läbi sait [mida see endaga kaasa toob](https://lwn.net/Articles/673597/).

### MacOS: Paigaldamine ja esimene käivitamine

Kui saate rakenduse käivitamisel hoiatuse, et rakendust ei saa avada, kuna "seda pole App Store'ist alla laaditud" või "arendajat ei saa kinnitada", siis see [Apple'i tugileht](https://support.apple.com/en-ca/HT202491) aitab teil sellest mööda minna. et.

Kui teile kuvatakse teade, et teil pole luba rakenduse avamiseks, proovige mõnda lahendust saidilt [sellel lehel](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860).

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### MacOS: Automaatne värskendus

Erinevalt Windowsist ja Linuxist pole automaatse värskendamise funktsioon macOS-is **ei** rakendatud ja tehnilistel põhjustel seda tõenäoliselt kunagi ei rakendata. Kui värskendus on saadaval, juhtub Maci kasutajatel aga üks kahest asjast.

- M³ proovib värskenduspaketti alla laadida ja selle automaatselt avada, misjärel peab kasutaja M³ värskenduse installimise käsitsi lõpule viima, pukseerides värskendatud rakenduse kausta Rakendused. Seejärel saavad nad äsja värskendatud M³ oma rakenduste kaustast tavapäraselt käivitada.
- Kui eelmine samm mõnes etapis ebaõnnestub, kuvab M³ püsiva teate, mis näitab, et värskendus on saadaval, koos lingiga värskenduse enda juurde. Punane pulseeriv teade kuvatakse ka M³ põhiekraani seadete nupul. M³ versiooninumber seadete ekraanil muutub nupuks, millel pärast klõpsamist avaneb automaatselt uusima versiooni allalaadimisleht.
