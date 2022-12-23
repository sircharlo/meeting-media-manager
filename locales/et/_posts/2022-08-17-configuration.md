---
tag: Configuration
title: Seaded
ref: configuration
---

Seadete ekraan on jagatud 4 osaks. Enamik valikuid on iseenesestmõistetavad, kuid siin on mõned täiendavad üksikasjad.

### Rakenduse sätted

| Seadistamine | Selgitus |
| ------- | ----------- |
| `Kuvatav keel` | Määrab keele, milles M³ kuvatakse. <br><br> Täname meie paljusid kaastöötajaid rakenduse nii paljudesse keeltesse tõlkimise eest! Kui soovite aidata parandada olemasolevat tõlget või lisada uut, avage uus ["discussion"]({{site.github}}/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M%C2%B3+into+a+language+I+speak,+LANGUAGE). |
| `Kaust, kuhu meedia salvestada` | Koosolekumeedia salvestatakse sellesse kausta hilisemaks jagamiseks ja kasutamiseks. |
| `Käivitage rakendus arvuti operatsioonisüsteemi käivitamisel` | Kui see on lubatud, käivitub M³, kui praegune kasutaja arvutisse sisse logib. <br><br> _**Märkus.** pole Linuxis saadaval._ |
| `Käivitage meedia sünkroonimine automaatselt` | Kui see on lubatud, käivitab see valik automaatselt meediumisünkroonimise 5 sekundit pärast M³ käivitamist. <br><br> _Automaatse sünkroonimise vältimiseks, kui see säte on lubatud, vajutage nuppu ⏸ (paus), enne kui 5-sekundiline taimer on täis._ |
| `Avage kaust pärast meedia sünkroonimist` | Kui see on lubatud, avaneb pärast meedia sünkroonimise lõppemist arvuti failihalduris valitud nädala allalaaditud meediat sisaldav kaust. |
| `Pärast meedia sünkroonimist sulgege rakendus` | Kui see on lubatud, suletakse see suvand automaatselt M³ 5 sekundit pärast meedia sünkroonimise lõpetamist. <br><br> _Et vältida M³ automaatset väljumist, kui see seade on lubatud, vajutage nuppu 🏃 (inimene lahkub/jooksmas), enne kui 5-sekundiline taimer on täis._ |
| `Luba OBS Studio ühilduvusrežiim` | Kui see on lubatud, puudutab see suvand OBS Studiot, et muuta stseene vastavalt vajadusele nii enne kui ka pärast meedia jagamist. <br><br> _Selle sätte lubamisel veenduge, et OBS Studio on konfigureeritud kasutama pistikprogrammi `obs-websocket`, mis võimaldab M³-l OBS Studioga suhelda. <br><br> Samuti konfigureerige kõik vajalikud stseenid OBS-is meedia jagamiseks ja lavakuvamiseks. Selleks vajate stseeni, millel on `aknahõive` (soovitatav) või `kuvahõive`, mis on konfigureeritud jäädvustama M³ meediaesitluse akent, või ekraani, millel esitletakse meediat. <br><br> Samuti peate konfigureerima kõik soovitud lavavaate stseenid, näiteks: võte kõnepuldist, lai võte lavast, etc._ |
| `Port` | Port, millele pistikprogramm `obs-websocket` on seadistatud kuulama. |
| `Parool` | Parool on seadistatud pistikprogrammi `obs-websocket` seadetes. |
| `Vaikimisi lavavaate stseen OBS Studios` | Valige, milline stseen tuleb meediumiesitlusrežiimi käivitamisel vaikimisi valida. Tavaliselt lai vaade või kaader kõnepuldist. |
| `Meediaakna stseen OBS Studios` | Valige, milline stseen on OBS Studios konfigureeritud M³ meediumiakna jäädvustamiseks. |
| `Keela riistvaraline kiirendus` | Lubage see säte ainult siis, kui teil on meediumiesitlusrežiimiga probleeme. Selle sätte muutmine põhjustab M³ taaskäivitamise. |

### Koguduse sünkroonimise sätted

Mida see täpselt teeb ja kuidas seda jaotist konfigureerida, vaadake jaotisest [Koguduse sünkroonimine]({{page.lang}}/#congregation-sync).

### Meedia sätted

| Seadistamine | Selgitus |
| ------- | ----------- |
| `Meedia keel` | Valige oma koguduse või rühma keel. Kogu meedia laaditakse saidilt JW.org selles keeles alla. |
| `Maksimaalne eraldusvõime videote jaoks` | Veebisaidilt JW.org alla laaditud videod laaditakse alla selle eraldusvõimega või järgmise saadaoleva madalama eraldusvõimega. Kasulik piiratud või väikese ribalaiusega olukordades. |
| `Teisenda meedia MP4-vormingusse` | See teisendab kõik pildi- ja helifailid automaatselt MP4-vormingusse, et neid saaks kasutada koos Zoomi funktsiooniga["native MP4 sharing feature"](assets/img/other/zoom-mp4-share.png)**täielikult kauge** koguduse Zoomi koosolekutel. See hõlmab kõiki JW.org-ist alla laaditud pilte ja meediumifaile, samuti kasutaja või VO lisatud täiendavaid meediumifaile. <br><br> _**Märkus.** See valik sobib kõige paremini **ainult kaugjuhtimise** koguduse koosolekute jaoks. Kui korraldate kas **hübriid** või **regulaarseid** koguduse koosolekuid, proovige kasutada [Meedia esitlusrežiim]({{page.lang}}/#present-media), aktiveerides selle asemel valiku `Esita meediat teisel monitoril või eraldi aknas` ja keelake see valik ._ |
| `Pärast teisendamist säilita algsed meediafailid` | Kui see säte on lubatud, hoitakse pildi- ja helifaile pärast nende MP4-vormingusse teisendamist meediumikaustas, ja ei kustutata. Selle tulemuseks on pisut segasem meediumikaust ja üldiselt ei pea seda lubama, kui jagate meediat Zoom MP4 jagamise kaudu. (Vaadake ülalt `Teisenda meedia MP4-vormingusse`.) <br><br> _**Märkus.** Nähtav ainult siis, kui `Teisenda meedia MP4-vormingusse` on samuti lubatud._ |
| `Esita meediat teisel monitoril või eraldi aknas` | See seade võimaldab teil kasutada M³ piltide, videote ja helifailide esitamiseks **hübriid-** või **isiklikul** koguduse koosolekutel. Seejärel pääseb juurde, klõpsates M³ põhiekraanil nuppu ▶️ (esita). <br><br> Meediumiesitluse ekraan kasutab automaatselt välist monitori, kui see on olemas; kui mitte, kuvatakse meedium eraldi muudetava suurusega aknas. <br><br> _**Märkus.** See valik sobib kõige paremini kas **hübriid-** või **tavaliste** koguduse koosolekute jaoks. <br><br> Kui korraldate **ainult kaugjuhtimisega** koguduse Zoomi koosolekuid, proovige aktiveerida suvand Teisenda meedia MP4-vormingusse ja jagada meediat Zoomi oma MP4-jagamisega._ |
| `Taustapilt koosoleku režiimi jaoks` | Vaikimisi proovib M³ tuua jooksva aasta teksti eelnevalt valitud keeles, et kuvada seda mustal taustal, kui režiimis [Meedia esitlusrežiim]({{page.lang}}/#present-media) ja muud meediat ei esitata. Kui automaatne aastateksti otsimine mingil põhjusel ebaõnnestub või kui soovite kuvada teistsugust taustpilti, võite kasutada kohandatud pildi valimiseks nuppu "Sirvi" või aastateksti automaatset toomist uuesti nupuga "Värskenda". <br><br> _**Märkus.** Kui [Koguduse sünkroonimine]({{page.lang}}/#congregation-sync) on lubatud, sünkroonib kohandatud taustpildi valimine selle automaatselt kõigi koguduse sünkroonimise kasutajate jaoks._ |
| `Looge _VLC-ga_ kasutamiseks esitusloendeid` | Lubage see, kui soovite luua iga koosoleku jaoks automaatselt esitusloendeid, mida saab seejärel VLC-sse laadida, kui kasutate seda rakendust meediumi kuvamiseks [Meedia esitlusrežiim]({{page.lang}}/#present-media) asemel. |
| `Ära arvesta th brošüürist kogu meediat` | Kui see on lubatud, takistab see brošüüri _Rakenda ennast_ meedia kaasamist igal kesknädalasel koosolekul. |
| `Ära arvesta pilte _lffi_ brošüürist` | Kui see on lubatud, takistab see piltide kaasamist _Live Forever_ brošüürist (_lffi_), näiteks õpilaste ülesannete jaoks kesknädalasel koosolekul. |

### Koosoleku sätted

| Seadistamine | Selgitus |
| ------- | ----------- |
| `Nädalasisene koosolek` | Märkige kesknädalase koosoleku tavaline päev ja kellaaeg; kasutatakse kaustade nimetamiseks ja taustamuusika automaatseks tuhmumiseks (vt allpool). |
| `Nädalavahetuse koosolek` | Märkige nädalavahetuse koosoleku päev ja kellaaeg. |
| `Luba nupp kuningriigi laulude juhuesituses esitamiseks` | Lubage põhikuval nupp, mis esitab juhuslikus järjekorras kuningriigi laule sarjast _sjjm_. See on kasulik näiteks laulude esitamiseks enne ja pärast koosolekuid kuningriigisaalis taustamuusikana. |
| `Laulu taasesituse helitugevus` | Määrab helitugevuse, millega taustamuusikat esitatakse. |
| `Lõpeta laulude esitamine automaatselt` | Kui `Luba nupp kuningriigi laulude juhuesituses esitamiseks` on aktiivne, võimaldab see säte määrata viivituse, mille järel taustmuusika automaatselt peatatakse. See võib olla kas: määratud arv minuteid või etteantud arv sekundeid enne koosoleku algust (juhul, kui taustamuusika käivitati enne koosolekut). |

### Seadete ekraani kuvatõmmised

{% include screenshots/configuration.html lang=site.data.et %}
