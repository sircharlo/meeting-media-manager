---
tag: Utilizzo
title: Modalità presentazione multimedia
ref: present-media
---

### Utilizzo della modalità di presentazione dei media

Le modalità di presentazione dei media e di controllo sono progettate per essere semplici e per evitare errori durante le adunanze.

Una volta abilitata l'opzione `Mostra i media su un monitor esterno o in una finestra separata`, la schermata di presentazione dei media apparirà automaticamente sul monitor esterno se presente, o in una finestra separata, trascinabile e ridimensionabile se non è stato rilevato alcun monitor esterno.

In standby, la schermata di presentazione dei media visualizzerà l'immagine di sfondo configurata nelle impostazioni. Se non è stata configurata alcuna immagine di sfondo, M³ tenterà di recuperare e visualizzare automaticamente il testo della scrittura dell'anno.

Se nelle impostazioni non è configurata alcuna immagine di sfondo e non è stato possibile caricare automaticamente il testo della scrittura dell'anno, in standby verrà visualizzato uno sfondo nero.

È possibile accedere alla modalità controllo multimediale facendo clic sul pulsante ▶️ (riproduci) nella schermata principale di M³ o utilizzando la scorciatoia da tastiera <kbd>Alt D</kbd> (per display esterno).

Una volta entrato in modalità controllo, la schermata di selezione della cartella ti consentirà di selezionare la data per la quale desideri visualizzare i file multimediali. Se la cartella del giorno corrente esiste, verrà automaticamente preselezionata. Una volta selezionata una data, puoi comunque modificare la data selezionata in qualsiasi momento facendo clic sul pulsante di selezione della data, nella sezione in alto.

### Presentare i media

Per riprodurre contenuti multimediali, premi il pulsante ▶️ (riproduci) per il file che desideri. Per nascondere il file multimediale, premi il pulsante ⏹️ (stop). Se lo si desidera, un video può essere riavvolto o fatto avanzare velocemente mentre è in pausa. Tieni presente che per i video, il pulsante di interruzione deve essere premuto **due volte** per evitare di interrompere accidentalmente e prematuramente un video durante la riproduzione per la congregazione. I video si interromperanno automaticamente quando saranno stati riprodotti per intero.

### Extra Features

M³ ha alcune funzionalità extra che possono essere utilizzate per migliorare l'esperienza di presentazione dei media.

#### Presenta JW.org

Per presentare il sito JW.org puoi premere il pulsante ⋮ (tre puntini) nella parte superiore dello schermo e selezionare `Apri JW.org`. Questo aprirà una nuova finestra di controllo con JW.org caricato. Anche la finestra multimediale mostrerà JW.org. Ora puoi usare la finestra di controllo per navigare in JW.org e la finestra multimediale mostrerà le tue azioni. Quando hai finito di presentare JW.org, puoi chiudere la finestra di controllo e continuare con la normale modalità di presentazione dei media.

#### Zoomma e sposta immagini

Quando un'immagine viene visualizzata, è possibile scorrere la rotellina del mouse mentre si passa sopra l'anteprima dell'immagine per ingrandire e rimpicciolire. In alternativa, puoi anche fare doppio clic sull'anteprima dell'immagine per ingrandirla. Il doppio clic alternerà tra 1.5x, 2x, 3x, 4x e indietro ad uno zoom 1x. È inoltre possibile tenere premuto e trascinare l'immagine per spostarla.

#### Ordina l'elenco dei media

L'elenco dei media può essere ordinato facendo clic sul pulsante di ordinamento in alto a destra dello schermo. A sinistra di ogni media c'è un pulsante che può essere utilizzato per trascinare l'elemento multimediale su o giù nella lista. Quando sei soddisfatto dell'ordine, puoi fare nuovamente clic sul pulsante di ordinamento per bloccare l'ordine.

#### Aggiungi un cantico dell'ultimo minuto

If you need to add a last-minute song to the media list, you can press the `♫ +` (add song) button at the top of the screen. A dropdown will appear with a list of all the Kingdom songs. When you select one, it will immediately be added to the top of the media list and it can be played instantly. It will either stream the song from JW.org, or play the song from the local cache if it was previously downloaded.

### Condurre riunioni ibride utilizzando una combinazione di M³, OBS Studio e Zoom

Il modo di gran lunga più semplice per condividere contenuti multimediali durante le riunioni ibride è configurare OBS Studio, M³ e Zoom in modo che funzionino insieme.

#### Configurazione iniziale: computer della Sala del Regno

Imposta la risoluzione dello schermo del monitor esterno su 1280x720 o qualcosa di simile.

Configura l'uscita della scheda audio del computer in modo che vada a uno degli ingressi del mixer audio e l'uscita combinata del mixer audio in modo che vada all'ingresso della scheda audio del computer.

#### Configurazione iniziale: OBS Studio

Installa OBS Studio o scarica la versione portatile.

Se utilizzi la versione portatile di OBS Studio, installa il plug-in [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) e, se utilizzi la versione portatile di OBS Studio, aggiungi la videocamera virtuale a Windows facendo doppio clic sullo script di installazione fornito.

Se hai OBS Studio v27 o precedente, devi installare il plug-in [obs-websocket](https://github.com/obsproject/obs-websocket). Altrimenti è incluso obs-websocket. Configurare un numero di porta e una password per obs-websocket.

Nelle impostazioni di OBS, sotto `General` > `System Tray`, attiva tutte le caselle di controllo. In `Output` > `Streaming`, abilita un codificatore hardware se disponibile. Sotto `Video` > `Base (Canvas) Resolution` e `Output (Scaled) Resolution`, scegli `1280x720`, e sotto `Downscale Filter`, scegli `Bilinear`.

Impostare almeno 2 scene: una per la visualizzazione dei media (`Window Capture` o `Display Capture` con il cursore del mouse disabilitato e il titolo della finestra/monitor appropriato selezionato), e una per la vista del palco (`Video Capture Device` con la videocamera della Sala del Regno selezionata). È possibile aggiungere tutte le scene necessarie, con la telecamera regolata, ingrandita e ritagliata secondo necessità (vista leggio, vista conduttore e lettore, vista tavolo, ecc.).

Aggiungi un collegamento a OBS Studio, con il parametro `--startvirtualcam`, nella cartella Avvio del profilo utente di Windows, per essere sicuri che OBS Studio venga avviato automaticamente quando l'utente effettua l'accesso.

#### Configurazione iniziale: Zoom Sala del Regno

Zoom deve essere configurato per utilizzare due monitor. Abilita le scorciatoie da tastiera globali per Zoom per disattivare/riattivare l'audio della Sala del Regno in Zoom (<kbd>Alt A</kbd>) e avviare/arrestare il flusso video della Sala del Regno in Zoom ( <kbd>Alt V</kbd>).

Imposta il "microfono" predefinito in modo che sia l'uscita combinata del mixer audio (in modo che tutto ciò che viene ascoltato tramite il sistema audio della Sala del Regno venga trasmesso tramite Zoom, inclusi microfoni e media) e la "videocamera" in modo che sia la videocamera virtuale fornita da OBS Studio.

#### Configurazione iniziale: M³

Abilita l'opzione `Mostra i media su un monitor esterno o in una finestra separata`.

Abilita e configura la modalità di compatibilità di OBS Studio, utilizzando le informazioni sulla porta e sulla password configurate nel passaggio di configurazione di OBS Studio.

#### Avvio dell'adunanza

Avvia la riunione Zoom e sposta la finestra secondaria della riunione Zoom sul monitor esterno. Rendilo a schermo intero se lo desideri. Qui è dove verranno visualizzati tutti i partecipanti alla riunione remota affinché la congregazione possa vederli.

Una volta che la riunione Zoom viene visualizzata sul monitor esterno, apri M³. La finestra di presentazione dei media si aprirà automaticamente sopra Zoom sul monitor esterno. Sincronizza i contenuti multimediali se necessario e accedi alla modalità controllo multimediale facendo clic sul pulsante ▶️ (riproduci) nella schermata principale di M³ o su <kbd>Alt D</kbd>.

Abilita il flusso video della Sala del Regno (<kbd>Alt V</kbd>) e mettilo in evidenza, se necessario, in modo che i partecipanti di Zoom vedano il palco della Sala del Regno. Riattiva il flusso audio della Sala del Regno in Zoom (<kbd>Alt A</kbd>). Non dovrebbe essere necessario disabilitare il flusso video o audio in Zoom per tutta la durata della riunione.

Avvia la riproduzione della musica di sottofondo utilizzando il pulsante in basso a sinistra o <kbd>Alt K</kbd>.

#### Trasmettere parti presentate di persona dal palco della Sala del Regno su Zoom

Nessuna azione necessaria.

È possibile scegliere vari angoli di ripresa/zoom durante la riunione utilizzando il menu nella parte inferiore della finestra di controllo della riproduzione multimediale di M³; questo menu conterrà un elenco di tutte le scene di visualizzazione della telecamera configurate in OBS.

#### Condivisione di contenuti multimediali nella Sala del Regno e tramite Zoom

Trova il file multimediale che desideri condividere nella finestra di controllo della riproduzione multimediale M³ e premi il pulsante "riproduci".

Quando hai finito di condividere i media, premi il pulsante "stop" in M³. Tieni presente che i video si interrompono automaticamente una volta completati.

#### Visualizzazione dei partecipanti Zoom remoti sul monitor della Sala del Regno

Premi il pulsante "nascondi/mostra la finestra di presentazione multimediale" nell'angolo in basso a destra della schermata del controller multimediale M³ o <kbd>Alt Z</kbd> per **nascondere** la finestra di presentazione multimediale. La riunione Zoom sarà ora visibile sul monitor della Sala del Regno.

> Se il partecipante ha contenuti multimediali da mostrare, segui i passaggi sotto il sottotitolo **Condivisione di contenuti multimediali nella Sala del Regno e tramite Zoom**.

Una volta che il partecipante ha terminato la sua parte, premi il pulsante "nascondi/mostra la finestra di presentazione multimediale" nell'angolo in basso a destra della finestra di controllo della riproduzione multimediale M³, oppure <kbd>Alt Z</kbd>, per **mostrare** la finestra di presentazione multimediale. Il monitor della Sala del Regno ora mostrerà il testo della scrittura dell'anno.

### Condurre riunioni ibride utilizzando solo M³ e Zoom

Se non desideri utilizzare OBS Studio per qualsiasi motivo, i seguenti suggerimenti forse ti aiuteranno a impostare le cose nel modo più semplice possibile.

#### Configurazione iniziale: computer della Sala del Regno

Uguale alla sezione corrispondente sopra. Con l'aggiunta della scorciatoia da tastiera globale per Zoom per avviare/arrestare la condivisione dello schermo (<kbd>Alt S</kbd>). La "telecamera" sarà il flusso video dalla telecamera della Sala del Regno.

#### Configurazione iniziale: M³

Abilita l'opzione `Mostra i media su un monitor esterno o in una finestra separata`.

#### Avvio dell'adunanza senza OBS

Uguale alla sezione corrispondente sopra.

#### Trasmettere parti presentate di persona dal palco della Sala del Regno su Zoom

Uguale alla sezione corrispondente sopra.

#### Condivisione di contenuti multimediali nella Sala del Regno e tramite Zoom

Inizia a condividere in Zoom premendo <kbd>Alt S</kbd>. Nella finestra di condivisione Zoom che si apre, scegli il monitor esterno e attiva entrambe le caselle di controllo in basso a sinistra (per l'ottimizzazione audio e video). Il testo della scrittura dell'anno verrà ora condiviso su Zoom.

Trova il file multimediale che desideri condividere nella finestra di controllo della riproduzione multimediale M³ e premi il pulsante "riproduci".

Quando hai finito di condividere contenuti multimediali, premi <kbd>Alt S</kbd> per terminare la condivisione dello schermo Zoom.

#### Visualizzazione dei partecipanti Zoom remoti sul monitor della Sala del Regno

Uguale alla sezione corrispondente sopra.

### Screenshot della modalità di presentazione

{% include screenshots/present-media.html lang=site.data.it %}
