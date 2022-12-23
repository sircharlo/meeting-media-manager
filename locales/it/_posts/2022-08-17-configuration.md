---
tag: Configurazione
title: Impostazioni
ref: configuration
---

La schermata delle impostazioni è suddivisa in 4 sezioni. Molte opzioni si spiegano da sole ma qui ci sono ulteriori dettagli.

### Impostazioni applicazione

| Impostazioni | Spiegazione |
| ------- | ----------- |
| `Lingua interfaccia` | Imposta la lingua in cui M³ viene mostrato. <br><br> Grazie ai nostri numerosi aiutanti per aver tradotto l'app in così tante lingue! Se vuoi aiutare a migliorare una traduzione esistente o aggiungerne una, per favore apri una nuova ["discussion"]({{site.github}}/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M%C2%B3+into+a+language+I+speak,+LANGUAGE). |
| `Cartella dove salvare i media` | I media dell'adunanza saranno salvati in questa cartella per essere condivisi e utilizzati in seguito. |
| `Apri l'applicazione all'avvio del sistema` | Se abilitato, M³ sarà avviato quando l'utente corrente eseguirà l'accesso al computer. <br><br> _**Nota:** Non disponibile su Linux._ |
| `Avvia automaticamente la sincronizzazione dei media` | Questa opzione, se abilitata, attiva la sincronizzazione automatica dei media 5 secondi dopo l'avvio di M³. <br><br> _Per impedire la sincronizzazione automatica quando questa opzione è abilitata, premere il pulsante ⏸ (pausa) prima che trascorrano 5 secondi._ |
| `Apri la cartella dopo la sincronizzazione dei media` | Se abilitata, la cartella contenente i file multimediali scaricati per la settimana scelta si aprirà nel file manager del computer al termine della sincronizzazione. |
| `Chiudi l'applicazione dopo la generazione dei media` | Se abilitata, questa opzione chiuderà automaticamente M³ 5 secondi dopo il completamento della sincronizzazione dei media. <br><br> _Per evitare che M³ si chiuda automaticamente quando questa impostazione è abilitata, premi il pulsante 🏃 (persona che esce/corre) prima che il timer di 5 secondi sia scaduto._ |
| `Abilita la modalità di compatibilità di _OBS Studio_` | Se abilitata, questa opzione attingerà a OBS Studio per cambiare automaticamente le scene secondo necessità sia prima che dopo la condivisione dei media. <br><br> _Se abiliti questa impostazione, assicurati che OBS Studio sia configurato per utilizzare il plug-in `obs-websocket`, cosa che consentirà a M³ di comunicare con OBS Studio. <br><br> Inoltre, configura tutte le scene necessarie per la condivisione dei media e la visualizzazione sul palco in OBS. Come minimo, avrai bisogno di una scena con un `Cattura finestra` (consigliato) o un `Cattura schermo` configurato per catturare la finestra di presentazione dei media di M³ o lo schermo su cui il saranno presentati i media. <br><br> Dovrai anche configurare tutte le scene di ripresa del palco desiderate, ad esempio: inquadratura del leggio, inquadratura ampia del palco, etc._ |
| `Porta` | Porta su cui è configurato per l'ascolto il plug-in `obs-websocket`. |
| `Password` | Password configurata nelle impostazioni del plugin `obs-websocket`. |
| `Scena di visualizzazione del palco predefinita in OBS Studio` | Seleziona quale scena deve essere selezionata per impostazione predefinita quando viene avviata la modalità di presentazione multimediale. Di solito un'ampia inquadratura del palco o un'inquadratura del leggio. |
| `Scena della finestra dei media in OBS Studio` | Selezionare quale scena impostare in OBS Studio per essere catturata dalla finestra dei media di M³. |
| `Disabilita l'accelerazione hardware` | Abilita questa impostazione solo se riscontri problemi con la modalità di presentazione dei media. La modifica di questa impostazione causerà il riavvio di M³. |

### Impostazioni sincronizzazione congregazione

Vedere la sezione [Sincronizzazione della congregazione]({{page.lang}}/#congregation-sync) per i dettagli su cosa fa esattamente e come configurare questa sezione.

### Impostazioni media

| Impostazioni | Spiegazione |
| ------- | ----------- |
| `Lingua dei media` | Seleziona la lingua della tua congregazione o gruppo. Tutti i media saranno scaricati da JW.org in questa lingua. |
| `Risoluzione massima dei video` | I video saranno scaricati da JW.org con questa risoluzione oppure con quella immediatamente inferiore. Utile per connessioni limitate o con scarsa banda. |
| `Converti media nel formato MP4` | Immagini e file audio saranno automaticamente convertiti nel formato MP4 per essere utilizzati direttamente con Zoom["native MP4 sharing feature"](assets/img/other/zoom-mp4-share.png)durante le adunanze di congregazione **completamente in remoto** tenute con Zoom. Ciò include tutte le immagini e i file multimediali scaricati da JW.org, nonché i file multimediali aggiunti dall'utente o dall'OV. <br><br> _**Nota:** Questa opzione adatta per le riunioni Zoom della congregazione tenute **solo da remoto**. Se conduci adunanze di congregazione **ibride** o **regolari**, cerca di utilizzare [Modalità presentazione multimedia]({{page.lang}}/#present-media) attivando invece l'opzione `Mostra i media su un monitor esterno o in una finestra separata` e disattiva questa opzione ._ |
| `Mantieni i media originali dopo la conversione` | Se questa impostazione è abilitata, i file immagine e audio verranno conservati nella cartella multimediale dopo essere stati convertiti in formato MP4, invece di essere eliminati. Questa avrà come conseguenza una cartella dei media leggermente più disordinata e generalmente non è necessario abilitarla se si condivide un file multimediale tramite la condivisione MP4 di Zoom. (Vedi `Converti media nel formato MP4` sopra.) <br><br> _**Nota:** visibile solo se `Converti media nel formato MP4` è abilitato._ |
| `Mostra i media su un monitor esterno o in una finestra separata` | Questa impostazione ti consentirà di utilizzare M³ per presentare immagini, video e file audio durante riunioni di congregazione **ibride** o **di persona**. È possibile accedere a facendo clic sul pulsante ▶️ (riproduci) nella schermata principale di M³. <br><br> La presentazione dei media avverrà automaticamente in un monitor esterno se presente; in caso contrario, il supporto verrà visualizzato in una finestra separata e ridimensionabile. <br><br> _**Nota:** questa opzione è più adatta per riunioni di congregazione **ibride** o **normali**. <br><br> Se conduci riunioni Zoom della congregazione **solo da remoto**, attivare l'opzione Converti media nel formato MP4 e condividere i contenuti multimediali con la condivisione MP4 nativa di Zoom._ |
| `Immagine di sfondo per la modalità di presentazione multimediale` | Per impostazione predefinita, M³ tenterà di recuperare il testo della scrittura dell'anno in corso nella lingua selezionata in precedenza, per visualizzarlo su uno sfondo nero quando si è in [Modalità presentazione multimedia]({{page.lang}}/#present-media) e nessun altro media viene riprodotto. Se il recupero automatico del testo della scrittura dell'anno non riesce per qualche motivo, o se desideri visualizzare un'immagine di sfondo diversa, puoi utilizzare il pulsante "Sfoglia" per selezionare un'immagine personalizzata o il pulsante "Aggiorna" per provare a recuperare automaticamente il testo della scrittura dell'anno. <br><br> _**Nota:** se [Sincronizzazione della congregazione]({{page.lang}}/#congregation-sync) è abilitato, la selezione di un'immagine di sfondo personalizzata la sincronizzerà automaticamente per tutti gli utenti sincronizzati della congregazione._ |
| `Crea playlist da utilizzare con _VLC_` | Abilita questa opzione se desideri generare automaticamente playlist per ogni riunione, che possono quindi essere caricate in VLC, se stai utilizzando quell'app per visualizzare contenuti multimediali invece di [Modalità presentazione multimedia]({{page.lang}}/#present-media). |
| `Escludi tutti i media dell'opuscolo th` | Se abilitato, non includerà i media dell'opuscolo _Lettura e insegnamento_ in ogni riunione infrasettimanale. |
| `Escludere immagini dall'opuscolo _lffi_` | Se abilitata, non saranno incluse le immagini dell'opuscolo _Vivere felici per sempre_ (_lffi_), ad esempio per le parti degli studenti durante l'adunanza infrasettimanale. |

### Impostazioni adunanza

| Impostazioni | Spiegazione |
| ------- | ----------- |
| `Adunanza infrasettimanale` | Indicare il giorno e l'ora abituale della riunione infrasettimanale; utilizzato per nominare le cartelle e la dissolvenza automatica della musica di sottofondo (vedi sotto). |
| `Adunanza del fine settimana` | Indicare il giorno e l'ora abituali per l'adunanza del fine settimana. |
| `Abilita il pulsante per riprodurre i cantici in ordine casuale` | Abilita il pulsante nella schermata principale che riprodurrà i cantici da _sjjm_ in ordine casuale. Questo è utile, ad esempio, per riprodurre i cantici come musica di sottofondo prima e dopo le adunanze nella Sala del Regno. |
| `Volume di riproduzione dei cantici` | Impostare il volume di riproduzione della musica di sottofondo. |
| `Interrompere automaticamente la riproduzione dei cantici` | Se `Abilita il pulsante per riprodurre i cantici in ordine casuale` è attiva, questa opzione consentirà di specificare il ritardo dopo il quale la musica di sottofondo sarà arrestata automaticamente. Questo può essere: un determinato numero di minuti, o un numero prestabilito di secondi prima dell'inizio dell'adunanza (nel caso in cui la musica di sottofondo sia stata avviata prima di una riunione). |

### Screenshot della schermata delle impostazioni

{% include screenshots/configuration.html lang=site.data.it %}
