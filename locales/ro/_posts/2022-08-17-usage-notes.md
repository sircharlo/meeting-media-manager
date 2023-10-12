---
tag: Ajutor
title: Note tehnice de utilizare
ref: usage-notes
---

Aplicația ar trebui să funcționeze așa cum este pe majoritatea calculatoarelor moderne care rulează Windows, Linux sau macOS.

### Windows: Instalare și prima lansare

La deschiderea instalatorului, puteți obține o eroare [](assets/img/other/win-smartscreen.png) care indică faptul că "Windows SmartScreen a împiedicat pornirea unei aplicații nerecunoscute". Acest lucru se datorează faptului că aplicația nu are un număr mare de descărcări și, în consecință, nu este în mod explicit „de încredere” de către Windows. Pentru a trece peste asta, fă clic pe „Mai multe informații”, apoi „Rulează”.

### Linux: Instalare și prima lansare

Conform documentației oficiale [AppImage](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), dacă aplicația nu reușește să se deschidă corect, confirmă rezultatul următoarei comenzi:

`kernel.unprivileged_userns_clone`

Dacă rezultatul este `0`, apoi AppImage va rula **not** numai dacă rulați următoarea comandă, urmată de o repornire :

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Asigură-te că ai citit pe [ce implică](https://lwn.net/Articles/673597/) înainte de a face acest lucru.

### macOS: Instalare și lansare

Dacă la lansarea aplicației, primiți un avertisment că aplicația nu poate fi deschisă, fie pentru că "nu a fost descărcat din magazinul de aplicații" sau pentru că "dezvoltatorul nu poate fi verificat", apoi acest [Pagina de suport Apple](https://support.apple.com/en-ca/HT202491) vă va ajuta să depășiți acest lucru.

If you get a message indicating that you "do not have permission to open the application", then try some solutions from [this page](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860), for example running the following command in `Terminal.app`:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Issues with audio or microphone permissions in macOS Sonoma

Since macOS Sonoma, some users might encounter an issue where M³ repeatedly gives an error message indicating that it needs access to the microphone. Executing the following command in `Terminal.app` has resolved the issue for some:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Auto-update

Spre deosebire de Windows și Linux, funcția de auto-actualizare este **nu** implementată pe macOS și probabil din motive tehnice nu va fi niciodată. Cu toate acestea, unul dintre două lucruri se va întâmpla pentru utilizatorii macOS atunci când este disponibilă o actualizare:

- M3 va încerca să descarce pachetul de actualizare și să îl deschidă automat, după care utilizatorul va trebui să finalizeze manual instalarea actualizării M3 prin glisarea și adăugarea aplicației actualizate în dosarul Aplicații. Apoi, vor putea lansa M3 nou actualizat din dosarul Aplicații ca de obicei.
- Dacă pasul anterior eșuează în orice stadiu, M3 va afișa o notificare persistentă, indicând că o actualizare este disponibilă, cu un link către actualizare. O notificare roșie în pulsing va fi de asemenea afișată pe butonul de setări în ecranul principal al M3. Numărul versiunii M3 din ecranul de setări se va transforma într-un buton care, odată apăsat, deschide pagina de descărcare automată a ultimei versiuni.
