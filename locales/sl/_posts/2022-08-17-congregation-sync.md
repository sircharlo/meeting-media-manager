---
tag: Nastavitve
title: Sinhronizacija
ref: congregation-sync
---

Brat, ki ga starešinstvo postavi za *organizatorja videokonference*, lahko s pomočjo programa M³ pripravi medijsko vsebino, ki je potem na voljo skupini za tehnično avdio/video podporo v njegovi občini.

Organizator videokonference ali nekdo, ki ga on določi, lahko:

- naloži **dodatno** multimedijo za shod, na primer za obisk okrajnega nadzornika ali za govore javnih govornikov;
- **skrije** multimedijo z jw.org, ki ni pomembna za določen shod, na primer, če je točko zamenjal podružnični urad;
- doda ali odstrani **ponavljajočo se multimedijo**, na primer videoposnetek z letnim stavkom ali diapozitiv z obvestilom.

Vsi, ki so sinhronizirani z isto občino, bodo nato prejeli popolnoma enako multimedijsko vsebino, ko bodo kliknili na gumb *Posodobi multimedijske mape*.

Upoštevajte, da je funkcija sinhronizacije povsem neobvezna in da je stvar izbire.

### Kako deluje

Program M³ za sinhronizacijo uporablja WebDAV. To pomeni, da mora organizator videokonference (ali oseba pod njegovim nadzorom):

- nastaviti zaščiten strežnik WebDAV, ki je dostopen prek spleta, **ali**
- uporabiti storitev shranjevanja v oblaku, ki jo ponuja tretja oseba in ki podpira protokol WebDAV (glej *Spletni naslov* v razdelku *Nastavitev sinhronizacije* spodaj).

Vsi uporabniki, ki želijo uporabljati isto sinhronizirano vsebino, se morajo povezati z istim strežnikom WebDAV s podatki, ki jim jih posreduje njihov organizator videokonference.

### Nastavitev sinhronizacije

| Nastavitev                           | Pojasnilo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Spletni naslov`                     | Spletni naslov strežnika WebDAV. Zahteva se varna povezava HTTP (HTTPS). <br><br>***Opomba:** Ko kliknete na gumb Spletni naslov, se prikaže seznam ponudnikov WebDAV, za katere je znano, da so združljivi z M³, in ki samodejno predizpolnijo nekatere nastavitve za te ponudnike. <br><br> Ta seznam je na voljo kot predlog in nikakor ne predstavlja priporočila za določeno storitev ali ponudnika. Najboljši strežnik je vedno tisti, ki je v vaši lasti ...* |
| `Uporabniško ime`                    | Uporabniško ime za storitev WebDAV.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `Geslo`                              | Geslo za storitev WebDAV. <br><br>***Opomba:** Za aplikaciji [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) in [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) bo morda treba ustvariti posebno geslo (tako kot je to opisano na njunih straneh za podporo), da bi omogočili povezavo WebDAV z njunimi storitvami.*                                                                          |
| `Mapa za sinhronizacijo`             | To je mapa, ki bo uporabljena za sinhronizacijo multimedijske vsebine za vse uporabnike, ki so povezani z občinsko sinhronizacijo. Pot lahko vnesete/prilepite ali pa z miško poiščete ciljno mapo. <br><br>***Opomba:** Poskrbite, da bodo vsi uporabniki občinske sinhronizacije vnesli isto pot do mape, sicer sinhronizacija ne bo delovala.*                                                                                                                                |
| `Nastavitve na ravni celotne občine` | Ko organizator videokonference na svojem računalniku v [Nastavitvah]({{page.lang}}/#configuration) konfigurira razdelka *Nastavitev multimedije* in *Nastavitev shoda*, lahko s tem gumbom vsem uporabnikom občinske sinhronizacije vsili določene nastavitve (na primer dneve shodov, jezik multimedije, nastavitve pretvorbe itd.). To pomeni, da bodo izbrane nastavitve vsiljene vsem sinhroniziranim uporabnikom vsakič, ko bodo odprli M³.                                             |

### Uporaba sinhronizacije za upravljanje multimedijske vsebine

Ko je nastavitev sinhronizacije končana, lahko začnete [Upravljati multimedijo]({{page.lang}}/#manage-media) za tehnično avdio/video ekipo v vaši občini.

### Zaslonske slike sinhronizacije

{% include screenshots/congregation-sync.html lang=site.data.sl %}
