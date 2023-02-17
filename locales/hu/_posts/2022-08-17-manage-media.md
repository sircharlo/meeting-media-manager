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

| `Média típusa` | A `Hozzáadandó média` mező                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Ének`         | ... megjelenít egy menüt az *sjjm* kiadványból származó összes Királyság-ének videójával, a média nyelvén. Válassza ezt az opciót például a nyilvános előadáshoz, vagy a körzetfelvigyázói látogatásokhoz szükséges ének hozzáadásához. <br><br> A kiválasztott dal automatikusan letöltődik a JW.org-ról, a gyülekezet vagy csoport nyelvén, ahogyan azt a [Beállítások]({{page.lang}}/#configuration) oldalon konfigurálta. |
| `JWPUB`        | ... lehetővé teszi, hogy tallózzon (vagy fogd és vidd) egy JWPUB fájlt. <br><br> Ezután a program felkéri, hogy válassza ki azt a részt vagy fejezetet, amelyből médiát szeretne hozzáadni. Ez a beágyazott és a hivatkozott médiát is hozzáadja a JWPUB-fájlhoz az adott szakaszból. <br><br> Az általánosan használt JWPUB fájl példája az S-38, de bármilyen JWPUB fájl használható.                           |
| `Egyedi`       | ... lehetővé teszi a böngészést (vagy fogd és vidd) tetszőleges médiafájl(ok)ra a számítógépről. <br><br>*Vegye figyelembe, hogy minden PDF és SVG fájlt az alkalmazás automatikusan nagy felbontású képekké alakít át.*                                                                                                                                                                                                      |
| `JW.ORG`       | ... lehetővé teszi, hogy kiválasszon egy videót a JW.org oldalon található legújabb videók közül.                                                                                                                                                                                                                                                                                                                                         |

### Média eltávolítása, elrejtése vagy megjelenítése

A média **eltávolításához**, **elrejtéséhez** vagy **megjelenítéséhez** egyszerűen keresse meg a nem kívánt médiafájlt, és kattintson a megfelelő ikonra.

| A médiának egy piros 🟥 (törlés) ikonja van                                            | A médiának van egy ☑️ (kipipált jelölőnégyzet) ikonja                                                                                                              | A médiának van egy 🔲 (nem kipipált jelölőnégyzet) ikonja                                                                                                                                         |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A médiafájlt Ön vagy a videokonferencia szervezője adta hozzá az adott napi médiához. | A médiafájlra az összejöveteli anyagban hivatkoznak. <br><br>Ezek a JW.org oldalról *lesznek* letöltve, vagy a vonatkozó kiadványból lesznek kinyerve. | A médiafájlra az összejöveteli anyagban hivatkoznak. <br><br>Ön vagy a videokonferencia szervezője elrejtette, így *nem kerül* letöltésre vagy hozzáadásra a megbeszélés médiájához. |

### Képernyőképek a médiakezelő felületről

{% include screenshots/manage-media.html lang=site.data.hu %}
