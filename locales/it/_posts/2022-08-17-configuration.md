---
tag: Configurazione
title: Impostazioni
ref: configuration
---

La schermata delle impostazioni è suddivisa in 4 sezioni. Molte opzioni si spiegano da sole ma qui ci sono ulteriori dettagli.

### Impostazioni applicazione

| Impostazioni | Spiegazione |
| --- | --- |
| `Modalità offline` | If enabled, M³ will not attempt to connect to JW.org or your congregation server. This is useful for when you have a poor internet connection and want to save bandwidth. |
| `Preferenza tema` | Select the theme you prefer. If you select `System`, M³ will use the system's theme. |
| `Nome della congregazione` | The name of your congregation. This is used to support multiple congregations who share the same computer. |
| `Lingua interfaccia` | Imposta la lingua in cui viene visualizzato M³. <br><br> Grazie ai nostri numerosi volontari per aver tradotto l'app in così tante lingue! Se desideri contribuire a migliorare una traduzione esistente o aggiungerne una nuova, apri una nuova [discussione]({{site.github}}/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M%C2%B3+into+a+language+I+speak,+LANGUAGE). |
| `Cartella dove salvare i media` | I media dell'adunanza saranno salvati in questa cartella per essere condivisi e utilizzati in seguito. |
| `Custom cache path` | By default, publications and other data are saved in a different directory for each user. You can change this directory if you want to share the cached data between multiple users on the same computer. |
| `Formato della data per le cartelle delle adunanze` | The date format used for the meeting folders. <br><br> ***Note:** When using a congregation server, please ensure that everyone configures the same date format.* |
| `Apri l'applicazione all'avvio del sistema` | Se abilitato, M³ sarà avviato quando l'utente corrente eseguirà l'accesso al computer. <br><br> ***Nota:** Non disponibile su Linux.* |
| `Avvia automaticamente la sincronizzazione dei media` | Questa opzione, se abilitata, attiva la sincronizzazione automatica dei media 5 secondi dopo l'avvio di M³. <br><br> *Per impedire la sincronizzazione automatica quando questa opzione è abilitata, premere il pulsante ⏸ (pausa) prima che trascorrano 5 secondi.* |
| `Apri la cartella dopo la sincronizzazione dei media` | If enabled, the folder containing the downloaded media for the chosen week will open in the computer's file manager after the media sync is complete. |
| `Esci dall'app dopo la sincronizzazione dei media` | Se abilitata, questa opzione chiuderà automaticamente M³ 5 secondi dopo il completamento della sincronizzazione dei media. <br><br> *Per evitare che M³ si chiuda automaticamente quando questa impostazione è abilitata, premi il pulsante 🏃 (persona che esce/corre) prima che il timer di 5 secondi sia scaduto.* |
| `Abilita la modalità di compatibilità di *OBS Studio_` | Se abilitata, questa opzione attingerà a OBS Studio per cambiare automaticamente le scene secondo necessità sia prima che dopo la condivisione dei media. <br><br> *Se abiliti questa impostazione, assicurati che OBS Studio sia configurato per utilizzare il plug-in `obs-websocket`, cosa che consentirà a M³ di comunicare con OBS Studio. <br><br> Inoltre, configura tutte le scene necessarie per la condivisione dei media e la visualizzazione sul palco in OBS. Come minimo, avrai bisogno di una scena con un `Cattura finestra` (consigliato) o un `Cattura schermo` configurato per catturare la finestra di presentazione dei media di M³ o lo schermo su cui il saranno presentati i media. <br><br> Dovrai anche configurare tutte le scene di ripresa del palco desiderate, ad esempio: inquadratura del leggio, inquadratura ampia del palco, etc.* |
| `Porta` | Porta su cui è configurato per l'ascolto il plug-in `obs-websocket`. |
| `Password` | Password configurata nelle impostazioni del plugin `obs-websocket`. |
| `Scena di visualizzazione del palco predefinita in OBS Studio` | Seleziona quale scena deve essere selezionata per impostazione predefinita quando viene avviata la modalità di presentazione multimediale. Di solito un'ampia inquadratura del palco o un'inquadratura del leggio. |
| `Scena della finestra dei media in OBS Studio` | Selezionare quale scena impostare in OBS Studio per essere catturata dalla finestra dei media di M³. |
| `OBS Studio scene to display Zoom participants` | An optional scene to quickly and efficiently manage the display of Zoom participants during hybrid meetings. <br><br> When this scene is configured, the behavior of the [Media Presentation mode]({{page.lang}}/#present-media) changes somewhat. When in this mode, a toggle button will appear which, when enabled, will cause the media window to be hidden, and the Zoom scene to be shown. The OBS scene picker will also be hidden. Sharing media will automatically show the media scene as per usual, and after sharing media, the media window will disappear immediately. <br><br> When the toggle is disabled, the media window and scene pickers will be shown again. |
| `Disabilita l'aggiornamento automatico dell'app` | When this option is enabled, M³ will not automatically self-update when closed. |
| `Disabilita l'accelerazione hardware` | Abilita questa impostazione solo se riscontri problemi con la modalità di presentazione dei media. La modifica di questa impostazione causerà il riavvio di M³. |

### Impostazioni sincronizzazione congregazione

Vedere la sezione [Sincronizzazione della congregazione]({{page.lang}}/#congregation-sync) per i dettagli su cosa fa esattamente e come configurare questa sezione.

### Impostazioni media

| Impostazioni | Spiegazione |
| --- | --- |
| `Lingua dei media` | Seleziona la lingua della tua congregazione o gruppo. Tutti i media saranno scaricati da JW.org in questa lingua. |
| `Lingua dei media di riserva` | This language is used whenever the primary media language is not available. <br><br> For example, if you select Irish as your media language and English as your fallback, whenever a publication or video is not available in Irish, it will be fetched in English. |
| `Risoluzione massima dei video` | I video saranno scaricati da JW.org con questa risoluzione oppure con quella immediatamente inferiore. Utile per connessioni limitate o con scarsa banda. |
| `Abilita sottotitoli per i video` | Enable this option if you want to fetch subtitles for videos, whenever available. Subtitles will be shown by default, but can be toggled on/off while presenting. |
| `Converti media nel formato MP4` | Immagini e file audio saranno automaticamente convertiti nel formato MP4 per essere utilizzati direttamente con Zoom["native MP4 sharing feature"](assets/img/other/zoom-mp4-share.png)durante le adunanze di congregazione completamente in remoto tenute con Zoom. Ciò include tutte le immagini e i file multimediali scaricati da JW.org, nonché i file multimediali aggiunti dall'utente o dall'OV. <br><br> ***Nota:** Questa opzione adatta per le riunioni Zoom della congregazione tenute **solo da remoto**. Se conduci adunanze di congregazione **ibride** o **regolari**, cerca di utilizzare [Modalità presentazione multimedia]({{page.lang}}/#present-media) attivando invece l'opzione `Mostra i media su un monitor esterno o in una finestra separata` e disattiva questa opzione.* |
| `Mantieni i media originali dopo la conversione` | If this setting is enabled, picture and audio files will be kept in the media folder after being converted to MP4 format, rather than deleted. Questa avrà come conseguenza una cartella dei media leggermente più disordinata e generalmente non è necessario abilitarla se si condivide un file multimediale tramite la condivisione MP4 di Zoom. (See `Convert media to MP4 format` above.) <br><br> ***Nota:** visibile solo se `Converti media nel formato MP4` è abilitato.* |
| `Mostra i media su un monitor esterno o in una finestra separata` | Questa impostazione ti consentirà di utilizzare M³ per presentare immagini, video e file audio durante riunioni di congregazione **ibride** o **di persona**. The media playback management screen can then be accessed by clicking the ▶️ (play) button on the main screen of M³. <br><br> La presentazione dei media avverrà automaticamente in un monitor esterno se presente; in caso contrario, il supporto verrà visualizzato in una finestra separata e ridimensionabile. <br><br> ***Note:** This option is best suited for either **hybrid** or **regular** congregation meetings. <br><br> If conducting **remote-only** congregation Zoom meetings, look into activating the `Convert media to MP4 format` option and sharing the media with Zoom's native MP4 sharing instead.* |
| `Immagine di sfondo per la modalità di presentazione multimediale` | Per impostazione predefinita, M³ tenterà di recuperare il testo della scrittura dell'anno in corso nella lingua selezionata in precedenza, per visualizzarlo su uno sfondo nero quando si è in [Modalità presentazione multimedia]({{page.lang}}/#present-media) e nessun altro media viene riprodotto. Se il recupero automatico del testo della scrittura dell'anno non riesce per qualche motivo, o se desideri visualizzare un'immagine di sfondo diversa, puoi utilizzare il pulsante "Sfoglia" per selezionare un'immagine personalizzata o il pulsante "Aggiorna" per provare a recuperare automaticamente il testo della scrittura dell'anno. <br><br> ***Nota:** se [Sincronizzazione della congregazione]({{page.lang}}/#congregation-sync) è abilitato, la selezione di un'immagine di sfondo personalizzata la sincronizzerà automaticamente per tutti gli utenti sincronizzati della congregazione.* |
| `Nascondi la finestra dei media al termine della riproduzione dei media` | If enabled, the media window will be hidden immediately after each media file has finished playing. <br><br> ***Note:** This setting is especially useful for sign-language meetings.* |
| `Enable keyboard shortcuts during media playback` | This setting allows you to set custom key combinations to play and stop media. This is useful in combination with a USB remote control, for example. |
| `Crea playlist da utilizzare con *VLC_` | Abilita questa opzione se desideri generare automaticamente playlist per ogni riunione, che possono quindi essere caricate in VLC, se stai utilizzando quell'app per visualizzare contenuti multimediali invece di [Modalità presentazione multimedia]({{page.lang}}/#present-media). |
| `Escludi tutti i media dall'opuscolo` | Se abilitato, non includerà i media dell'opuscolo *Lettura e insegnamento* in ogni riunione infrasettimanale. |
| `Exclude Enjoy Life Forever images outside the Congregation Bible Study` | If enabled, this will prevent images from the *Live Forever* book (*lff*) from being included, for example for student assignments during the midweek meeting. |
| `Includere l'edizione stampata se disponibile` | If enabled, renderings of the printed editions of publications will be included when available. This could be useful for some tables or groups of images that are clearer in printed form. |

### Impostazioni Adunanza

| Impostazioni | Spiegazione |
| --- | --- |
| `Special congregation` | If enabled, no media will be downloaded from JW.org. Only manually added media will be available. This is useful for theocratic schools, for example. |
| `Adunanza infrasettimanale` | Indicare il giorno e l'ora abituale della riunione infrasettimanale; utilizzato per nominare le cartelle e la dissolvenza automatica della musica di sottofondo (vedi sotto). |
| `Adunanza del fine settimana` | Indicare il giorno e l'ora abituali per l'adunanza del fine settimana. |
| `Abilita il pulsante per riprodurre li cantici in ordine casuale` | Abilita il pulsante nella schermata principale che riprodurrà i cantici da *sjjm* in ordine casuale. Questo è utile, ad esempio, per riprodurre i cantici come musica di sottofondo prima e dopo le adunanze nella Sala del Regno. To the right of this option is a button to download all available Kingdom songs, which could be useful to prevent buffering delays. |
| `Volume di riproduzione dei cantici` | Impostare il volume di riproduzione della musica di sottofondo. |
| `Interrompere automaticamente la riproduzione dei cantici` | Se `Abilita il pulsante per riprodurre i cantici in ordine casuale` è attiva, questa opzione consentirà di specificare il ritardo dopo il quale la musica di sottofondo sarà arrestata automaticamente. Questo può essere: un determinato numero di minuti, o un numero prestabilito di secondi prima dell'inizio dell'adunanza (nel caso in cui la musica di sottofondo sia stata avviata prima di una riunione). |

### Screenshot della schermata delle impostazioni

{% include screenshots/configuration.html lang=site.data.it %}
