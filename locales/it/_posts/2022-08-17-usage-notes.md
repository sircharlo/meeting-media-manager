---
tag: Aiuto
title: Note tecniche di utilizzo
ref: usage-notes
---

L'app dovrebbe funzionare sulla maggior parte dei computer moderni che eseguono Windows, Linux o Mac.

### Windows: installazione e primo avvio

Avviando l'installazione potresti ottenere un [errore](assets/img/other/win-smartscreen.png) indicante che "Windows SmartScreen blocca l'avvio di app sconosciute". Questo a causa del fatto che l'app non ha un alto numero di download e di conseguenza non è considerata sicura da Windows. Per ovviare a questo, clicca su "Altre informazioni poi "Avvia comunque".

### Linux: Installazione e primo avvio

Come per la [documentazione AppImage ufficiale](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), se l'app non riesce ad avviarsi correttamente, conferma l'output del comando seguente:

`sysctl kernel.unprivileged_userns_clone`

Se l'output è `0`, allora AppImage **non** si avvierà a meno che non esegui il comando seguente, seguito da un riavvio:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Assicurati di leggere [cosa comporta](https://lwn.net/Articles/673597/) prima di farlo.

### macOS: Installazione e primo avvio

Se durante l'installazione ottieni un avviso che l'app non può essere avviata perché "non è stata scaricata dall'App store" oppure "lo sviluppatore non può essere verificato", allora questa [pagina del supporto Apple](https://support.apple.com/en-ca/HT202491) potrà aiutarti.

Se ricevi un messaggio indicante che "non hai il permesso di aprire l'applicazione", allora prova qualche soluzione da [questa pagina](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860).

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Aggiornamento automatico

Diversamente da Windows e Linux, la funzione di aggiornamento automatico **non** è disponibile in macOS, e per ragioni tecniche probabilmente non lo sarà mai. Tuttavia quando è disponibile un aggiornamento potrà verificarsi una di queste due cose:

- M³ tenterà di scaricare il pacchetto di aggiornamento e aprirlo automaticamente, dopodiché l'utente dovrà completare manualmente l'installazione dell'aggiornamento di M³ trascinando e rilasciando l'app aggiornata nella propria cartella Applicazioni. Quindi, si potrà avviare M³ appena aggiornato dalla cartella Applicazioni come di consueto.
- Se il passaggio precedente fallisce sempre, M³ visualizzerà una notifica persistente che indica che è disponibile un aggiornamento, con un collegamento all'aggiornamento stesso. Una notifica rossa lampeggiante verrà visualizzata anche sul pulsante delle impostazioni nella schermata principale di M³. Il numero di versione di M³ nella schermata delle impostazioni si trasformerà in un pulsante che, una volta cliccato, apre automaticamente la pagina di download dell'ultima versione.
