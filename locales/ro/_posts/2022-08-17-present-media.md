---
tag: Utilizare
title: Mod prezentare media
ref: present-media
---

### Folosind modul de prezentare media

Modurile de prezentare și de control media sunt concepute pentru simplitate și pentru a preveni greșelile în timpul reuniunilor.

Odată ce opțiunea `Prezentarea media pe un monitor extern sau într-o fereastră separată` este activată, ecranul de prezentare media va apărea automat pe ecranul extern dacă există, sau într-o fereastră separată, glisabilă și redimensionabilă în cazul în care nu a fost detectat niciun monitor extern.

Când este în așteptare, ecranul de prezentare media va afișa imaginea de fundal care este configurată în setări. Dacă nici o imagine de fundal nu a fost configurată, atunci M3 va încerca automat să preia și să afișeze yeartextul.

Dacă nici o imagine de fundal nu este configurată în setări şi yeartext nu a putut fi încărcat automat, un fundal negru va fi afişat când este în poziţie verticală.

Modul controller media poate fi accesat făcând clic pe butonul ▶️ (play) pe ecranul principal al M3, sau folosind tastatura rapidă <kbd>Alt D</kbd> (pentru afişare externă).

Odată ce ați introdus modul controler, ecranul de selecție a dosarelor vă va permite să selectați data pentru care doriți să afișați media. Dacă dosarul zilei curente există, acesta va fi apăsat automat. Odată ce este selectată o dată, încă poți schimba data selectată în orice moment făcând clic pe butonul de selectare a datei, în secțiunea de sus.

### Prezentare media

Pentru a reda media, apăsați butonul ▶️ (play) pentru fișierul pe care l-ați dori. Pentru a ascunde media, apăsați butonul ⏹️ (opriți). Dacă se doreşte, un videoclip poate fi răsucit sau accelerat în timpul întreruperii. Vă rugăm să rețineți că pentru videoclipuri; butonul de stop trebuie apăsat **de două ori** pentru a preveni oprirea accidentală şi prematură a unui videoclip în timp ce acesta este redat pentru congregare. Videoclipurile se vor opri automat când vor fi redate în întregime.

### Caracteristici suplimentare

M3 are câteva caracteristici suplimentare care pot fi folosite pentru a îmbunătăți experiența de prezentare a mass-media.

#### Prezent JW.org

Pentru a prezenta JW.org, puteți apăsa butonul <unk> (ellipsis) din partea de sus a ecranului și selectați `Open JW.org`. Acest lucru va deschide o nouă fereastră de control cu JW.org încărcat. Fereastra media va afișa și JW.org. Acum puteți utiliza fereastra controller pentru a naviga pe JW.org, iar fereastra media va afișa acțiunile dvs. Când ați terminat prezentând JW.org, puteți închide fereastra controller și să continuați cu modul normal de prezentare.

#### Zoom și pan imagini

Când o imagine este afișată, poți derula roata mouse-ului în timp ce planezi peste previzualizarea imaginii pentru a mări și micșora. Alternativ, poți de asemenea să faci dublu clic pe previzualizarea imaginii pentru a mări imaginea. Dublu-clic va alterna între 1,5x, 2x, 3x, 4x și înapoi la o zoom de 1x. Poți, de asemenea, ține apăsată și trage imaginea în jurul imaginii.

#### Sortează lista media

Lista media poate fi sortată făcând clic pe butonul de sortare din dreapta sus a ecranului. Elementele media vor avea un buton lângă ele care pot fi folosite pentru a glisa elementul media în sus sau în jos în listă. Cand sunteti multumit de comanda, puteti apasa butonul de sortare din nou pentru a bloca comanda.

#### Adaugă o melodie de ultim minut

Dacă trebuie să adaugi o melodie de ultim minut în lista media, poți apăsa butonul `♫ +` (adaugă melodia) în partea de sus a ecranului. O listă verticală va apărea cu o listă cu toate melodiile regatului. Când selectaţi unul, va fi adăugat imediat în partea de sus a listei media şi poate fi redat instantaneu. Fie va viziona melodia de pe JW.org, fie va reda melodia de pe cache-ul local dacă a fost descărcat anterior.

### Realizarea de reuniuni hibride utilizând o combinație de M3, OBS Studio și Zoom

Cel mai simplu mod de a împărtăși mass-media în timpul întâlnirilor hibride este de departe configurarea OBS Studio, M3 și Zoom de a lucra împreună.

#### Configurare inițială: Sala regatului

Setați rezoluția ecranului monitorului extern la 1280x720, sau ceva apropiat de acesta.

Configurați ieșirea cardului de sunete pentru a merge la unul dintre mixerii de sunete, și amestecul de sunet al sunetului pentru a merge la sistemul de introducere a cardului sonor.

#### Configurare iniţială: OBS Studio

Instalați OBS Studio sau descărcați versiunea portabilă.

Dacă utilizaţi versiunea portabilă a OBS Studio, instalaţi plugin-ul [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) , și dacă folosiți versiunea portabilă a OBS Studio, adăugați camera virtuală la Windows făcând clic pe scriptul de instalare furnizat.

Dacă aveți OBS Studio v27 sau mai mare, trebuie să instalați plugin-ul [obs-websocket](https://github.com/obsproject/obs-websocket). În caz contrar este inclus şi obs-websocket-ul. Configurați un număr de port și o parolă pentru obs-websocket.

În setările OBS, sub `General` > `System Tray`, activează toate casetele de selectare. În `Ieșire` > `Streaming`activați codificatorul de hardware, dacă este disponibil. Sub rezoluţia `Video` > `Rezoluţia de bază (Canvas)` şi Rezoluţia `de ieşire`alege `1280x720`, și sub `Filtru Downscale`, alege `Bilinear`.

Configurați cel puțin 2 scene: una pentru ecranul media (`Captură de fereastră` sau `Afișează Captura` cu cursorul mouse-ului dezactivat și titlu/monitor corespunzător selectat), și unul pentru vizualizarea etapei (`Dispozitiv de Captură Video` cu camera KH selectată). De asemenea, puteţi adăuga o altă scenă specifică pentru imagini, unde fereastra media este vizibilă împreună cu podiumul într-un afişaj de imagine-în-imagine. Puteţi adăuga câte scene este necesar, cu camera ajustată, zoomed-in şi decupate după necesităţi (vedere lectură, dirijor şi cititor, vedere faţă de masă etc.).

Activează filtrul `Scaling/Aspect` pe toată fereastra `Captura` sau `Captură` cu o Rezoluție `` din Rezoluția `(Canvas)` Acest lucru va asigura că fereastra media este întotdeauna extinsă la rezoluţia rezultatului camerei virtuale.

Adaugă o scurtătură la OBS Studio, cu parametrul `--startvirtualcam` , în folderul Startup al profilului de utilizator Windows, pentru a se asigura că OBS Studio este pornit automat când utilizatorul se autentifică.

#### Configurația inițială: Zoom în Sala Regatului

Zoom trebuie configurat să folosească monitoare duble. Enable global keyboard shortcuts for Zoom to mute/unmute the Kingdom Hall audio in Zoom (<kbd>Alt A</kbd>), and start/stop the Kingdom Hall video feed in Zoom (<kbd>Alt V</kbd>).

Setați "microfonul" implicit să fie ieșirea mixerului de sunet (astfel încât tot ce este auzit în sistemul de sunet al Regatului să fie transmis prin Zoom, inclusiv microfoanele și mass-media) și „camera” care vor fi camera virtuală furnizată de OBS Studio.

#### Configurația inițială: M3

Activați opțiunea `Prezentați media pe un monitor extern sau într-o fereastră` separată.

Activaţi şi configuraţi modul de compatibilitate OBS Studio, folosind portul şi parola informaţii configurate în pasul de configurare OBS Studio.

#### Începerea şedinţei

Începeţi şedinţa Zoom şi mutaţi fereastra secundară a şedinţei Zoom pe monitorul extern. Faceți-l pe tot ecranul, dacă doriți. Aici va fi afișat participanților la o întâlnire la distanță pentru a vedea congregația.

Odată ce ședința Zoom este afișată pe monitorul extern, deschideți M3. Fereastra de prezentare media se va deschide automat deasupra Zoom pe monitorul extern. Sincronizaţi dacă este necesar şi introduceţi modul controller media făcând clic pe butonul ▶️ (play) pe ecranul principal al M3, sau <kbd>Alt D</kbd>.

Activează feed-ul video de la Sala Regatului (<kbd>Alt V</kbd>), și să evidențieze feed-ul video din Sala regatului, dacă este necesar, astfel încât participanții să vadă etapa din Sala Regatului. Dă silențios fluxul audio la Sala Regatului în Zoom (<kbd>Alt A</kbd>). Nu ar trebui să fie necesară dezactivarea fluxului video sau audio din Zoom pe durata ședinței. Asiguraţi-vă că "Sunetul original pentru muzicieni" este activat în Zoom, pentru a asigura cea mai bună calitate audio pentru participanţii la întâlnirile de la distanţă.

Pornește redarea de fundal folosind butonul din stânga jos, sau <kbd>Alt K</kbd>.

#### Difuzarea de părți în persoană din etapa înaltă a regatului prin Zoom

Nicio acțiune necesară.

În timpul întâlnirii pot fi alese diferite unghiuri de cameră/zoom folosind meniul din partea de jos a ferestrei de control a redării media M3; acest meniu va conține o listă cu toate scenele configurate de vizualizare a camerei, în OBS.

#### Partajează media la Sala Regatului și la Zoom

Găsiți fișierele media pe care doriți să le partajați în fereastra de control a redării M3 și apăsați butonul "redare".

Cand ai terminat impartasiti media, apasati butonul "stop" din M3. Țineți cont că videoclipurile se opresc automat la finalizare.

#### Afişează participanţii la Zoom de la distanţă pe monitorul din Sala Regatului

Apăsați butonul "ascundere/afișare fereastră de prezentare media" în colțul din dreapta jos al ecranului de control media M3, sau <kbd>Alt Z</kbd>, pentru a **ascunde** fereastra de prezentare media. Întâlnirea Zoom va fi vizibilă acum pe monitorul din Sala Regatului.

> Dacă participantul are mass-media de arătat, urmează pașii de sub subrubrica **Partajare media la Sala Regatului și la Zoom**.

Odată ce participantul și-a terminat partea sa, apăsaţi pe butonul "ascunde/arată fereastra de prezentare media" în colţul din dreapta jos al ferestrei de control a redării media M3, sau <kbd>Alt Z</kbd>, la **arată** fereastra de prezentare media. Monitorul din Sala Regatului va arăta acum yeartextul.

### Realizarea de reuniuni hibride utilizând doar M3 și Zoom

Dacă nu doriţi să utilizaţi OBS Studio pentru orice motiv, următoarele sugestii vă vor ajuta probabil să stabiliți lucrurile cât mai simplu posibil.

#### Configuratie initiala fara OBS: Sala regatului

La fel ca în secţiunea corespunzătoare de mai sus. Cu adăugarea scurtăturii globale de tastatură pentru Zoom pentru pornirea/oprirea partajării ecranului (<kbd>Alt S</kbd>). Camera foto va fi alimentată de camera foto de la camera din Regat.

#### Configurația inițială fără OBS: M3

Activați opțiunea `Prezentați media pe un monitor extern sau într-o fereastră` separată.

#### Începerea şedinţei fără OBS

La fel ca în secţiunea corespunzătoare de mai sus.

#### Difuzarea pieselor în persoană din etapa de vârf a regatului de peste Zoom fără OBS

La fel ca în secţiunea corespunzătoare de mai sus.

#### Partajează media la Sala Regatului și la Zoom fără OBS

Începe să distribui în Zoom atingând <kbd>Alt S</kbd>. În fereastra de partajare Zoom care apare în sus, alegeți monitorul extern și activați ambele căsuțe în stânga jos (pentru optimizarea sunetului și a video). Acum textul yeartext va fi partajat prin Zoom.

Găsiți fișierele media pe care doriți să le partajați în fereastra de control a redării M3 și apăsați butonul "redare".

Cand ai terminat sa partajezi media, apasa <kbd>Alt S</kbd> pentru a pune capăt partajării ecranului Zoom.

#### Afişează participanţii la Zoom de la distanţă pe monitorul din Sala Regatului fără OBS

La fel ca în secţiunea corespunzătoare de mai sus.

### Capturi ecran în Modul Prezentare

{% include screenshots/present-media.html lang=site.data.ro %}
