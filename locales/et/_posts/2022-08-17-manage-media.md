---
tag: Usage
title: Meedia haldamine
ref: manage-media
---

Meediumihalduse ekraan võimaldab kasutajal lisada või eemaldada meediat mis tahes koosoleku jaoks, hallata korduvaid meediat ja isegi lisada spetsiaalseid meediat muudeks kuupäevadeks, mil koosolekuid tavaliselt ei planeerita.

### Meedia haldamine konkreetse päeva jaoks

Meedia haldamiseks konkreetsel koosoolekul või päeval, vajuta lihtsalt selle päeva ruudule M³-e avaekraanil. Et hallata korduvkasutatavat meediat, vajuta Korduv meedia ruudule.

### Meeda lisamine

Siit saate teada, kuidas **lisada** meediat meediahalduse ekraanilt.

| Võimalus | Selgitus |
| --- | --- |
| `Üleslaadimise tüüp` | Valige üks kolmest `meedia tüübist` (vaata allpool). |
| `Meedia lisamiseks` | Oleneb valitud `meedia tüübist` (vt allpool). |
| `Failinime eesliide` | Meediafaili nime(de) ette saab sortimise hõlbustamiseks lisada kuni 6 numbrit. |
| `Meedia nimekiri` | See näitab valitud kuupäeva jaoks praegu kavandatud meediat. |

Väljal `Meedia lisamiseks` kuvatakse teile sõltuvalt valitud meedia tüübist erinevad valikud.

| `Meedia tüüp` | Väli `Meedia lisamiseks` |
| --- | --- |
| `Laul` | ... näitab nimekirja kõikidest kuningriigilaulude videotest *sjjm* seerias, rakenduses seadistatud keeles. Vali see, kui soovid lisada avaliku kõne avalaulu või laule RÜ külastuseks. <br><br>Valitud laul laaditakse autmaatselt alla JW.org lehelt, seadistatud keeles, nii kuidas see on valitud [Seaded]({{page.lang}}/#configuration) lehel. |
| `JWPUB` | ... lubab sul valida (või lohistada) JWPUB fail. <br><br>Sellisel juhul palutakse sul valida, millisest osast, või peatükist sa soovid meediat lisada. This will add both embedded and referenced media from that section in the JWPUB file. <br><br> An example of a commonly used JWPUB file is the S-34, but any JWPUB file can be used here. |
| `Kohandatud sätted` | ... allow you to browse to (or drag and drop) any other media file(s) from your computer. <br><br> *Note that all PDF and SVG files will automatically be converted into high-resolution images by M³.* |

### Meediumi eemaldamine, peitmine ja näitamine

Meediumite **eemaldamiseks**, **peitmiseks** või **kuvamiseks** otsige lihtsalt üles meediumifail, mida te ei soovi, ja klõpsake vastaval ikoonil.

| Punane 🟥 (kustutamise) ikoon | ☑️ (märgitud ruut) ikoon | 🔲 (märkimata ruut) ikoon |
| --- | --- | --- |
| Meediafaili lisasite selle päeva meediasse teie või AVÜ. | The media file is referenced in the meeting's material. <br><br> It *will* be downloaded from JW.org or extracted from the relevant publication. | The media file is referenced in the meeting's material. <br><br> It was hidden by you or the VO, so it *will not* be downloaded or added to the meeting's media. |

### Meediumihalduskuva kuvatõmmised

{% include screenshots/manage-media.html lang=site.data.et %}
