# Pravilnik o zasebnosti {#privacy-policy}

Datum začetka veljavnosti: 22. november 2026

Meeting Media Manager (M³) je brezplačna odprtokodna aplikacija, ki so jo izdelali prostovoljci. Ta pravilnik pojasnjuje, katere podatke M³ obdeluje in kam gredo. Velja za vse različice M³: namestitvene programe in prenosno različico s tega spletnega mesta ter različici v trgovinah Microsoft Store in Snap Store.

**Na kratko:** M³ nima uporabniških računov, nima oglasov in nima sledilnikov za oglaševanje ali trženje. Tvoje nastavitve in multimedijska vsebina ostanejo na tvojem računalniku. Za iskanje in odpravljanje težav M³ svojim razvijalcem pošilja diagnostične podatke: poročila o napakah ter podatke o vsaki seji in o tem, kako hitro M³ deluje. Iz njih M³ izpusti vse, kar bi lahko identificiralo tebe ali tvojo občino, tvoj naslov IP pa se ne shranjuje.

## Kaj ostane na tvojem računalniku {#on-your-computer}

M³ v svoji podatkovni mapi na tvojem računalniku hrani naslednje:

- nastavitve vsake občine ali skupine, na primer njeno ime, razpored shodov, jezik in integracije;
- multimedijsko vsebino in publikacije, ki jih prenese, ter multimedijsko vsebino, ki jo dodaš;
- geslo za OBS Studio, če ga uporabljaš. M³ geslo šifrira s shrambo gesel tvojega operacijskega sistema, kadar je ta na voljo; kadar ni, ga M³ shrani kot navadno besedilo in te o tem obvesti;
- tvoje nastavitve integracije z Zoomom, če jo uporabljaš.

Poročila o napakah vsebujejo nekatere od teh nastavitev (glej spodaj), nikoli pa ne tistih, ki bi lahko identificirale tebe ali tvojo občino.

Če v multimedijskem oknu prikazuješ sliko s kamere (možnost za občine v znakovnem jeziku), se ta samo prikazuje: M³ je ne snema, ne shranjuje in ne pošilja. Predogled multimedijskega okna, ki ti ga M³ prikazuje, se zajema na tvojem računalniku in se prav tako ne shranjuje in ne pošilja.

Vse to lahko kadar koli izbrišeš tako, da izbrišeš podatkovno mapo M³. V sistemu Windows jo izbriše tudi odstranitev M³. Različica iz trgovine Snap Store jo ob odstranitvi obdrži, razen če ji naročiš, naj je ne obdrži (`snap remove --purge`).

## Diagnostični podatki {#error-reports}

M³ pošilja diagnostične podatke storitvi [Sentry](https://sentry.io), ki jo njegovi razvijalci uporabljajo za iskanje in odpravljanje napak.

**Poročila o napakah**, ko gre v M³ kaj narobe. Poročilo lahko vsebuje:

- napako in mesto v kodi M³, kjer se je zgodila;
- različico M³, tvoj operacijski sistem in njegovo različico, tvoj jezik in časovni pas ter osnovne podatke o tvoji strojni opremi, na primer o grafični kartici;
- korake, ki so pripeljali do napake, na primer strani, odprte v M³, in datoteke, ki jih je M³ prenašal;
- stanje M³ v tistem trenutku: njegove nastavitve in to, kar je počel, na primer predvajano multimedijsko vsebino ali shod, ki ga je pripravljal;
- kadar se sesuje kateri od delov M³, poročilo o sesutju tega dela, ki lahko vključuje del njegovega pomnilnika v trenutku sesutja.

**Podatki o seji**, ob vsakem zagonu M³: kdaj se je zagnal in ali se je normalno končal ali sesul, skupaj z različico M³ in tvojim operacijskim sistemom.

**Podatki o zmogljivosti**, v vsaki seji: koliko časa potrebujejo strani M³, da se odprejo, in koliko časa trajajo njegove zahteve do spodaj navedenih strežnikov, skupaj z njihovimi naslovi.

### Kaj M³ izpusti {#left-out}

Preden M³ pošlje svoje diagnostične podatke, odstrani vse, kar bi lahko identificiralo tebe ali tvojo občino:

- ime občine, ID številko njenega Zoom shoda in imena udeležencev v Zoomu;
- kodo PIN za nastavitve in geslo za OBS Studio;
- imena map in datotek na tvojem računalniku: pri mapi ostane le njen pogon ali najvišja nadrejena mapa, pri datoteki pa le njena vrsta;
- naslov v nastavitvi »Naslov spletnega mesta«, kadar ni privzeti;
- tvoje uporabniško ime v poteh do map v njegovih poročilih.

Podatki ne vsebujejo nobenega imena, e-poštnega naslova ali uporabniškega računa, saj M³ ničesar od tega nima. M³ prosi Sentry, naj ne beleži tvojega naslova IP, Sentry pa je nastavljen tako, da ga ne shranjuje.

Vzdrževalci M³ te podatke uporabljajo samo za iskanje in odpravljanje težav. Sentry jih shranjuje v Združenih državah in jih po omejenem času izbriše. [Pravilnik o zasebnosti storitve Sentry](https://sentry.io/privacy/) pojasnjuje, kako jih obdeluje.

## Strežniki, s katerimi se M³ povezuje {#connections}

Za svoje delovanje se M³ povezuje s spodaj navedenimi strežniki. Kot pri vsakem spletnem mestu, ki ga obiščeš, lahko ti strežniki vidijo naslov IP tvojega računalnika.

- **Uradno spletno mesto Jehovovih prič** in njegovi strežniki za prenos, za prenašanje multimedijske vsebine za shode in publikacij ter podatkov o njih. Za to, kar to spletno mesto prejme, velja njegov lastni pravilnik o zasebnosti.
- **GitHub**, kjer je M³ objavljen, za preverjanje in prenos posodobitev M³ ter za prikaz novosti v njem. Različici iz trgovin Microsoft Store in Snap Store namesto tega posodobitve prejemata iz svoje trgovine.
- **jsDelivr**, za prenos pisav, ki jih potrebujejo nekateri jeziki, in komponente, ki jo M³ uporablja za branje datotek PDF.
- **Apple, Cloudflare, icanhazip.com in ipify.org**, za preverjanje, ali je tvoj računalnik povezan z internetom.
- **Sentry**, za pošiljanje zgoraj opisanih diagnostičnih podatkov.

Če jih uporabljaš, M³ deluje tudi z naslednjimi, na tvojem računalniku ali v tvojem lokalnem omrežju:

- **Zoom:** M³ upravlja aplikacijo Zoom na tvojem računalniku. Sam ne pošilja ničesar na Zoomove strežnike.
- **OBS Studio:** M³ se poveže s programom OBS Studio na tvojem računalniku ali v lokalnem omrežju.
- **Oddaljeni časovnik:** M³ v tvojem lokalnem omrežju poganja majhen spletni strežnik, da lahko druga naprava prikazuje časovnik shoda.

Ko uradno spletno mesto Jehovovih prič prikažeš v oknu spletnega mesta v M³, deluje enako kot v spletnem brskalniku.

## Trgovine {#stores}

Če M³ namestiš iz trgovine Microsoft Store ali Snap Store, za njegovo namestitev in posodobitve skrbi ta trgovina, in sicer v skladu s svojim pravilnikom o zasebnosti. M³ sam deluje enako v vseh različicah.

## Spremembe tega pravilnika {#changes}

Če bo M³ začel podatke obdelovati drugače, bo ta stran posodobljena, na vrhu pa bo naveden nov datum. Njena zgodovina je na voljo na [GitHubu](https://github.com/sircharlo/meeting-media-manager/commits/master/docs/src/en/privacy.md).

## Vprašanja {#questions}

Če imaš vprašanje o tem pravilniku ali o svojih podatkih, [prijavi težavo na GitHubu](https://github.com/sircharlo/meeting-media-manager/issues).
