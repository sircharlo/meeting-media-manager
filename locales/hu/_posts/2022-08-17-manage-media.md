---
tag: Használat
title: Média kezelése
ref: manage-media
---

A médiakezelő képernyő lehetővé teszi a felhasználó számára, hogy bármely adott összejövetelhez médiát adjon hozzá vagy távolítson el, kezelje az ismétlődő médiafájlokat, sőt, olyan időpontokhoz is adhat egyedi fájlokat, amelyekre nincs beütemezve összejövetel.

### A média kezelése bármely napra vonatkozóan

Egy adott összejövetel vagy nap médiájának kezeléséhez egyszerűen kattintson az adott nap csempéjére az M³ főképernyőjén. A minden összejövetelen ismétlődő média kezeléséhez kattintson az Ismétlődő média csempére.

### Média hozzáadása

A következő módon **adhat hozzá** médiát a médiakezelő képernyőn.

| Lehetőség           | Magyarázat                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `Feltöltés típusa`  | Válasszon a 3 `médiatípus` közül (lásd alább).                                             |
| `Hozzáadandó média` | A kiválasztott `médiatípustól` függ (lásd alább).                                          |
| `Fájlnév előtag`    | Legfeljebb 6 számjegy adható a médiafájlok neve(i) elé a rendezés megkönnyítése érdekében. |
| `Média listája`     | Ez mutatja az aktuálisan tervezett médiát a kiválasztott dátumra.                          |

A `Hozzáadandó média` mezőben a kiválasztott médiatípustól függően különböző lehetőségek jelennek meg.

| `Média típusa` | A `Hozzáadandó média` mező                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Ének`         | ... shows a menu with all Kingdom song videos from the *sjjm* series, in the media language. Válassza ezt az opciót például a nyilvános előadáshoz, vagy a körzetfelvigyázói látogatásokhoz szükséges ének hozzáadásához. <br><br> A kiválasztott dal automatikusan letöltődik a JW.org-ról, a gyülekezet vagy csoport nyelvén, ahogyan azt a [Beállítások]({{page.lang}}/#configuration) oldalon konfigurálta. |
| `JWPUB`        | ... allows you to browse to (or drag and drop) a JWPUB file. <br><br> Ezután a program felkéri, hogy válassza ki azt a részt vagy fejezetet, amelyből médiát szeretne hozzáadni. Ez a beágyazott és a hivatkozott médiát is hozzáadja a JWPUB-fájlhoz az adott szakaszból. <br><br> An example of a commonly used JWPUB file is the S-34, but any JWPUB file can be used here.                      |
| `Egyedi`       | ... allows you to browse to (or drag and drop) any other media file(s) from your computer. <br><br> *Note that all PDF and SVG files will automatically be converted into high-resolution images by M³.*                                                                                                                                                                                                        |
| `JW.ORG`       | ... allows you to select a video from the latest featured videos on JW.org.                                                                                                                                                                                                                                                                                                                                                 |

### Média eltávolítása, elrejtése vagy megjelenítése

A média **eltávolításához**, **elrejtéséhez** vagy **megjelenítéséhez** egyszerűen keresse meg a nem kívánt médiafájlt, és kattintson a megfelelő ikonra.

| A médiának egy piros 🟥 (törlés) ikonja van                                            | A médiának van egy ☑️ (kipipált jelölőnégyzet) ikonja                                                                                                        | A médiának van egy 🔲 (nem kipipált jelölőnégyzet) ikonja                                                                                                                     |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A médiafájlt Ön vagy a videokonferencia szervezője adta hozzá az adott napi médiához. | The media file is referenced in the meeting's material. <br><br> It *will* be downloaded from JW.org or extracted from the relevant publication. | The media file is referenced in the meeting's material. <br><br> It was hidden by you or the VO, so it *will not* be downloaded or added to the meeting's media. |

### Képernyőképek a médiakezelő felületről

{% include screenshots/manage-media.html lang=site.data.hu %}
