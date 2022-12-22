---
tag: Usage
title: Média kezelése
ref: manage-media
---

A médiakezelő képernyő lehetővé teszi a felhasználó számára, hogy bármely adott összejövetelhez médiát adjon hozzá vagy távolítson el, kezelje az ismétlődő médiafájlokat, sőt, olyan időpontokhoz is adhat egyedi fájlokat, amelyekre nincs beütemezve összejövetel.

### A média kezelése bármelyik napra

Egy adott összejövetel vagy nap médiájának kezeléséhez egyszerűen kattintson az adott nap csempéjére az M³ főképernyőjén. A minden összejövetelen ismétlődő média kezeléséhez kattintson az Ismétlődő média csempére.

### Média hozzáadása

Így adhat hozzá **médiát** a médiakezelő képernyőn.

| Opció           | Magyarázat                                         |
| ---------------- | --------------------------------------------------- |
| `Feltöltés típusa` | Válasszon a 3 `médiatípus` közül (lásd alább). |
| `Hozzáadandó média`   | A kiválasztott `médiatípustól` függ (lásd alább).       |
| `Fájlnév előtag` | Legfeljebb 6 számjegy adható a médiafájlok neve(i) elé a rendezés megkönnyítése érdekében. |
| `Média listája` | Ez mutatja az aktuálisan tervezett médiát a kiválasztott dátumra. |

A `Hozzáadandó média` mezőben a kiválasztott médiatípustól függően különböző lehetőségek jelennek meg.

| `Média típusa` | A `Hozzáadandó média` mező |
| ------------ | ------------------------ |
| `Ének` | ... megjelenít egy menüt az Énekeljünk örömmel (_sjj_) című kiadványban található összes ének videójával a média nyelvén. Válassza ezt az opciót például a nyilvános előadásokhoz, vagy a körzetfelvigyázói látogatásokhoz tartozó ének hozzáadásához. <br><br> A kiválasztott ének automatikusan letöltődik a JW.org-ról, a gyülekezet vagy csoport nyelvén, ahogyan azt a [Beállítások]({{page.lang}}/#configuration)-ban konfigurálta. |
| `JWPUB` | ... lehetővé teszi, hogy tallózzon (vagy idehúzzon) egy JWPUB fájlt. <br><br> Ezután a rendszer kéri, hogy válassza ki azt a részt vagy fejezetet, amelyből médiát szeretne hozzáadni. Ez a beágyazott és hivatkozott anyagokat is hozzáadja a JWPUB fájlból a kiválasztott részből. <br><br> Az általánosan használt JWPUB fájl például az S-38, de bármelyik JWPUB fájl használható. |
| `Egyedi` | ... lehetővé teszi a böngészést más médiafájlokhoz (vagy a számítógépen lévő médiafájl(ok) behúzását). <br><br> _Ne feledje, hogy minden PDF és SVG fájlt az M³ automatikusan nagy felbontású képekké alakít át._ |

### Média eltávolítása, elrejtése vagy megjelenítése

A média **eltávolításához**, **elrejtéséhez** vagy **megjelenítéséhez** egyszerűen keresse meg a nem kívánt médiafájlt, és kattintson a megfelelő ikonra.

| A médiának egy piros 🟥 (törlés) ikonja van. | A médiának van egy ☑️ (kipipált jelölőnégyzet) ikonja. | A médiának van egy 🔲 (nem kipipált jelölőnégyzet) ikonja. |
| ---------------------- | --------------------------- | ------------------------------ |
| A médiafájlt Ön vagy a videokonferencia szervezője adta hozzá az adott napi médiához. | A médiafájlra az összejövetel anyagaiban hivatkoznak. <br><br> Ez _le lesz_ töltve a JW.org-ról vagy a megfelelő kiadványból. | A médiafájlra az összejövetel anyagaiban hivatkoznak. <br><br> Ön vagy a videokonferencia szervezője elrejtette, így _nem lesz_ letöltve vagy hozzáadva az összejövetel médiájához. |

### Képernyőképek a médiakezelő felületről

{% include screenshots/manage-media.html lang=site.data.hu %}
