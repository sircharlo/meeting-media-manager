---
tag: Configurare
title: Sincronizarea congregației
ref: congregation-sync
---

Fratele desemnat ca organizator *videoConference* (VO) de corpul bătrânilor poate folosi M3 pentru a gestiona ce media este pusă la dispoziția echipei tehnice de asistență A/V în congregația sa.

OV sau o persoană desemnată de acesta poate:

- încarcă **suplimentar** media pentru a fi partajată în timpul unei ședințe, cum ar fi pentru vizita supraveghetorului circuitului sau pentru conferințele vorbitorilor publici
- **ascunde** media de la JW.org care nu este relevantă pentru o anumită întâlnire, de exemplu, atunci când o parte a fost înlocuită de sucursala locală
- adăugați sau eliminați **recurente** , cum ar fi un videoclip text de an sau un slide de anunț

Toţi cei care sunt sincronizaţi cu aceeaşi congregaţie vor primi exact aceeaşi media atunci când fac clic pe butonul *Actualizează dosarele media*.

Vă rugăm să reţineţi că funcţia de sincronizare a congregaţiei este opt-in şi complet opţională.

### Cum funcţionează

Mecanismul de sincronizare de bază al M3 folosește WebDAV. Aceasta înseamnă că OV (sau cineva aflat sub supravegherea sa) trebuie:

- setează un server WebDAV securizat care este accesibil web, **sau**
- utilizează un serviciu de stocare în cloud care suportă protocolul WebDAV (vezi setarea ** a adresei Web în secțiunea *Congregation sync setup* de mai jos).

Toți utilizatorii care doresc să fie sincronizați împreună vor trebui să se conecteze la același server WebDAV folosind informațiile de conectare și acreditările oferite de către VO.

### Configurare sincronizare congregație

| Setare                                 | Explicație                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Adresă web`                           | Adresa web a serverului WebDAV. Este necesar HTTP securizat (HTTPS). <br><br> ***Notă:** Butonul de adresă web, odată ce se dă click, va afișa o listă de furnizori WebDAV care au fost cunoscuți ca fiind compatibili cu M3 și care vor înlocui automat anumite setări pentru acești furnizori. <br><br> Această listă este furnizată ca o curtoazie și nu reprezintă în niciun caz o aprobare a unui anumit serviciu sau furnizor. Cel mai bun server este întotdeauna cel pe care îl deține...* |
| `Nume de utilizator`                   | Nume de utilizator pentru serviciul WebDAV.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `Parolă`                               | Parola pentru serviciul WebDAV. <br><br> ***Notă:** Conform detaliilor din paginile lor respective de sprijin, pentru [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) și [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) ar putea fi necesară o parolă specifică fiecărei aplicații, pentru a permite conexiuni WebDAV la serviciile lor.*                                                                                  |
| `Configurare sincronizare congregație` | Acesta este folderul care va fi folosit pentru a sincroniza media pentru toți utilizatorii de sincronizare congregare. Poți tipa/lipi pe o traiectorie sau să folosești mouse-ul pentru a naviga la folderul țintă. <br><br> ***Notă:** Asigurați-vă că toți utilizatorii sincronizați introduc aceeași cale de dosare; altfel sincronizarea nu va funcționa conform așteptărilor.*                                                                                                                            |
| `Setări generale al congregației`      | Odată ce OV a configurat secțiunile *Media setup* și *Întâlnire* din secțiunea [Setări]({{page.lang}}/#configuration) pe propriul calculator, el poate utiliza apoi acest buton pentru a impune anumite setări pentru toți utilizatorii de sincronizare a congregației (de exemplu, zile de întâlnire, limbaj media, setări de conversie etc. Aceasta înseamnă că setările selectate vor fi aplicate forțat pentru toți utilizatorii sincronizați de fiecare dată când deschid M3.                                         |

### Utilizare sincronizare congregare pentru gestionarea media

Odată ce configurarea sincronizării de congregare este completă, sunteți gata să porniți cu [Managing media]({{page.lang}}/#manage-media) pentru echipa de asistență tehnică AV a congregsului dvs.

### Capturi de ecran sincronizare în acțiune

{% include screenshots/congregation-sync.html lang=site.data.ro %}
