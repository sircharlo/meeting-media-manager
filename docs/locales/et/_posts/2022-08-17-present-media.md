---
tag: Usage
title: Meedia esitlusrežiim
ref: present-media
---

### Meediumiesitlusrežiimi kasutamine

Meediumiesitluse ja kontrolleri režiimid on loodud lihtsuse huvides ja koosolekutel vigade vältimiseks.

Kui valik `Esita meediat teisel monitoril või eraldi aknas` on lubatud, ilmub meediumiesitluse ekraan automaatselt välisele monitorile, kui see on olemas, või eraldi, lohistatavas ja suurust muudetavas aknas, kui välist monitori ei tuvastatud.

Ooterežiimis kuvatakse meediumiesitluse ekraanil seadetes konfigureeritud taustpilt. Kui taustapilti pole seadistatud, proovib M³ automaatselt tuua ja kuvada aastateksti.

Kui seadetes pole taustapilti konfigureeritud ja aastateksti ei saanud automaatselt laadida, kuvatakse ooterežiimis must taust.

Meediumikontrolleri režiimile pääseb juurde, klõpsates M³ põhiekraanil nuppu ▶️ (esita) või kasutades kiirklahvi <kbd>Alt D</kbd> (välise kuva jaoks).

Kui olete kontrolleri režiimi sisenenud, võimaldab kausta valimise ekraan teil valida kuupäeva, mille jaoks soovite meediumit kuvada. Kui praeguse päeva kaust on olemas, valitakse see automaatselt. Kui kuupäev on valitud, saate valitud kuupäeva igal ajal muuta, klõpsates ülaosas kuupäeva valiku nuppu.

### Meedia esitlemine

Meediumi esitamiseks vajutage soovitud faili nuppu ▶️ (esitus). Meediumi peitmiseks vajutage nuppu ⏹️ (stopp). Soovi korral saab videot peatatud ajal tagasi või edasi kerida. Pange tähele, et videote puhul tuleb stopp-nuppu vajutada **kaks korda**, et vältida video kogemata ja enneaegset peatamist koguduse heaks esitamise ajal. Videod peatuvad automaatselt, kui need on täielikult esitatud.

### Hübriidkoosolekute läbiviimine, kasutades M³, OBS Studio ja Zoom kombinatsiooni

Kõige lihtsam viis meediumite jagamiseks hübriidkoosolekute ajal on konfigureerida OBS Studio, M³ ja Zoom koos töötama.

#### Algkonfiguratsioon: kuningriigisaali arvuti

Seadke välise monitori ekraani eraldusvõimeks 1280x720 või midagi sellele lähedast.

Konfigureerige arvuti helikaardi väljund ühele mikseri sisendile ja mikseri kombineeritud väljund arvuti helikaardi sisendile.

#### Esialgne konfiguratsioon: OBS Studio

Installige OBS Studio või laadige alla kaasaskantav versioon.

Kui kasutate OBS Studio kaasaskantavat versiooni, installige pistikprogramm [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) ja kui kasutate OBS Studio kaasaskantavat versiooni, lisage virtuaalkaamera Windowsile, topeltklõpsates kaasasoleval installiskriptil.

Kui teil on OBS Studio v27 või vanem, peate installima pistikprogrammi [obs-websocket](https://github.com/obsproject/obs-websocket). Uuema versiooni jaoks on obs-websocket vaikimis olemas. Konfigureerige obs-websocketi pordi number ja parool.

Lubage OBS-i seadetes jaotises `General` > `System Tray` kõik märkeruudud. Jaotises `Väljund` > `Voogesitus` lubage riistvarakooder, kui see on saadaval. Jaotises `Video` > `Põhi (lõuendi) eraldusvõime` ja `Väljundi (skaalatud) eraldusvõime` valige `1280 x 720` ja jaotises `Downscale Filter`, valige `Bilineaarne`.

Seadistage vähemalt 2 stseeni: üks meediumikuva jaoks (`Window Capture` või `Display Capture`, kus hiirekursor on keelatud ja sobiv akna pealkiri/monitor on valitud) ja üks lavavaade (`videohõiveseade`, kus on valitud KH-kaamera). Saate lisada nii palju stseene, kui vaja, kui kaamera on reguleeritud, sisse suumitud ja kärbitud (kõnepuldi vaade, juhi- ja lugejavaade, tabelivaade jne).

Lisage OBS Studio otsetee parameetriga `--startvirtualcam` Windowsi kasutajaprofiili käivituskausta tagamaks, et OBS Studio käivitub kasutaja sisselogimisel automaatselt.

#### Esialgne konfiguratsioon: Kuningriigisaali suum

Suum tuleks konfigureerida kahe monitori kasutamiseks. Lubage Zoomi globaalsed klaviatuuri otseteed, et vaigistada / vaigistada suumis kuningriigisaali heli (<kbd>Alt A</kbd>) ja käivitada/peatada kuningriigisaali videovoog suumis ( <kbd>Alt V</kbd>).

Seadke vaikimisi "mikrofon" mikseri kombineeritud väljundiks (nii et kõik kuningriigisaali helisüsteemi kaudu kostuv heli edastatakse Zoomi kaudu, sealhulgas mikrofonid ja meedia) ja "kaameraks" OBS Studio pakutav virtuaalne kaamera .

#### Esialgne konfiguratsioon: M³

Lubage valik `Esita meediat teisel monitoril või eraldi aknas`.

Lubage ja konfigureerige OBS Studio ühilduvusrežiim, kasutades OBS Studio seadistamise etapis konfigureeritud pordi ja parooli teavet.

#### Koosoleku alustamine

Käivitage Zoomi koosolek ja teisaldage teisene Zoom koosoleku aken välisele monitorile. Soovi korral tehke see täisekraaniks See on koht, kus kogudusel kuvatakse kõik kaugkoosolekul osalejad.

Kui Zoomi koosolekut kuvatakse välisel monitoril, avage M³. Meediumiesitluse aken avaneb automaatselt välise monitori suumi ülaosas. Vajadusel sünkroonige meediumid ja sisenege meediumikontrolleri režiimi, klõpsates M³ põhiekraanil nuppu ▶️ (esita) või <kbd>Alt D</kbd>.

Lubage kuningriigisaali videovoog (<kbd>Alt V</kbd>) ja tõstke vajadusel esile kuningriigisaali videovoog, et Suumi osalejad näeksid kuningriigisaali lava. Tühista kuningriigisaali helivoo vaigistus suumis (<kbd>Alt A</kbd>). Koosoleku ajaks ei tohiks Zoomis video- või helivoogu välja lülitada.

Alustage taustamuusika taasesitamist vasakpoolses allnurgas oleva nupu või <kbd>Alt K</kbd> abil.

#### Kuningriigisaali lavalt osade otseülekanne Zoomi kaudu

Tegevus pole vajalik.

Koosoleku ajal saab valida erinevaid kaameranurki/suumi, kasutades M³ meedia taasesituse juhtakna allosas olevat menüüd; see menüü sisaldab kõigi OBS-is konfigureeritud kaameravaate stseenide loendit.

#### Meedia jagamine kuningriigisaalis ja Zoomi kaudu

Otsige M³ meedia taasesituse juhtaknas üles meedium, mida soovite jagada, ja vajutage nuppu "Esita".

Kui olete meedia jagamise lõpetanud, vajutage M³ nuppu "stopp". Pange tähele, et videod peatuvad automaatselt pärast lõpetamist.

#### Suumi kaugosalejate kuvamine kuningriigisaali monitoril

Vajutage M³ meediumikontrolleri ekraani alumises paremas nurgas nuppu „peida/näita meediaesitluse aken” või **peitmiseks** <kbd>Alt Z</kbd> meediaesitluse aken. Zoomi koosolek on nüüd nähtav kuningriigisaali monitoril.

> Kui osalejal on näidata meediat, järgige alampealkirja **Meedia jagamine kuningriigisaalis ja Zoomi kaudu** all olevaid juhiseid.

Kui osaleja on oma osa lõpetanud, vajutage M³ meedia taasesituse juhtakna alumises paremas nurgas nuppu "peida/näita meediaesitluse aken" või <kbd>Alt Z</kbd>, meediaesitluse akna **kuvamiseks**. Kuningriigisaali monitor näitab nüüd aastateksti.

### Hübriidkoosolekute läbiviimine, kasutades ainult M³ ja Zoom

Kui te ei soovi mingil põhjusel OBS Studiot kasutada, aitavad järgmised soovitused teil asju võimalikult lihtsalt seadistada.

#### Algkonfiguratsioon: kuningriigisaali arvuti

Sama, mis ülaltoodud vastav jaotis. Suumi globaalse kiirklahvi lisamisega ekraani jagamise alustamiseks/peatamiseks (<kbd>Alt S</kbd>). "Kaamera" on kuningriigisaali kaamera kaameravoog.

#### Esialgne konfiguratsioon: M³

Lubage valik `Esita meediat teisel monitoril või eraldi aknas`.

#### oosoleku alustamine

Sama, mis ülaltoodud vastav jaotis.

#### Kuningriigisaali lavalt osade otseülekanne Zoomi kaudu

Sama, mis ülaltoodud vastav jaotis.

#### Meedia jagamine kuningriigisaalis ja Zoomi kaudu

Alustage suumis jagamist, vajutades <kbd>Alt S</kbd>. Valige avanevas suumi jagamise aknas väline monitor ja lubage mõlemad all vasakul olevad märkeruudud (heli ja video optimeerimiseks). Aastateksti jagatakse nüüd Zoomi kaudu.

Otsige M³ meedia taasesituse juhtaknas üles meedium, mida soovite jagada, ja vajutage nuppu "Esita".

Kui olete meedia jagamise lõpetanud, vajutage suumiekraani jagamise lõpetamiseks <kbd>Alt S</kbd>.

#### Suumi kaugosalejate kuvamine kuningriigisaali monitoril

Sama, mis ülaltoodud vastav jaotis.

### Esitlusrežiimi ekraanipildid

{% include screenshots/present-media.html lang=site.data.et %}
