<!-- markdownlint-disable no-duplicate-heading -->

# Novità

Per l'elenco completo delle modifiche tra le versioni, consulta il file CHANGELOG.md su GitHub.

## PROSSIMA VERSIONE

### ✨ Nuove funzionalità

- ✨ **Timer Remote**: La pagina del timer per il tablet al lectern ha un layout di messa a fuoco opzionale, attivato in Impostazioni. Mostra il tempo in un grande anello di avanzamento che diventa giallo nell'ultimo minuto, poi rosso con la quantità di straordinari (+02:18), ed elenca i partecipanti Zoom la cui mano è alzata accanto ad esso, nell'ordine li alzarono: i primi quattro per nome, con un conto del resto. Ogni nuova mano lampeggia "la mano alzata" per tre secondi, e gli aggiornamenti della lista come mani su e giù. Il display attuale rimane il predefinito.
- ✨ **Zoom Meeting Manager (beta, Windows)**: Raised hands can now be reported without any control over the participants. With "Only tell me about raised hands" turned on (under the raised-hand helper in Settings), M³ still notices who raises their hand, in its notification and on the timer display for the chairman, but shows no buttons that unmute a participant or lower their hand: those are left to the A/V operator in Zoom itself. Useful where Zoom doesn't show the participant controls M³ needs, or where the operator would rather keep control.

## v26.10.2

### ✨ Nuove funzionalità

- ✨ **Suggerimenti sulle funzioni**: di tanto in tanto M³ suggerisce una funzione che un profilo non usa ancora, in una breve finestra "Lo sapevi?" che spiega a cosa serve. Mostra al massimo un suggerimento ogni volta che si apre un profilo, mai nei 15 minuti prima di un'adunanza né durante l'adunanza, e ricorda ogni risposta: "Ricordamelo più tardi" sposta il suggerimento in fondo alla coda, "No, grazie" lo nasconde definitivamente e "Non suggerire più funzioni" li disattiva tutti per quel profilo. Conta anche un "No" dato nella procedura guidata di configurazione, e le risposte possono essere ripristinate nelle Impostazioni, alla voce Avanzate.
- ✨ **Zoom Meeting Manager (beta, Windows)**: ora M³ può disporre la propria finestra e la finestra dell'adunanza Zoom sui tuoi schermi. Due nuovi passaggi nell'assistente di configurazione di Zoom chiedono dove deve andare l'adunanza Zoom. Su una mappa dei tuoi schermi scegli lo schermo di Zoom (mai quello occupato dalla finestra multimediale) e se Zoom lo ha tutto per sé o lo condivide con M³. Poi, su un disegno di quello schermo con la sua forma reale, trascini un divisore per dividerlo tra le due finestre; si aggancia alle proporzioni più comuni. Appena l'adunanza si apre, M³ apre l'elenco dei partecipanti di Zoom se gliel'hai chiesto, poi mette al loro posto entrambe le finestre e da quel momento tiene Zoom lì: quando Zoom sposta o ridimensiona la sua finestra da solo (dopo una condivisione dello schermo, o quando il suo elenco dei partecipanti si apre o si chiude), M³ lo rimette al suo posto, mentre una finestra che sposti tu stesso resta dove l'hai messa fino alla prossima adunanza. Ogni volta che M³ sposta Zoom di sua iniziativa, una notifica lo segnala e ti permette di fermarlo subito, finché M³ non viene riavviato o per sempre. Mentre Zoom condivide la finestra multimediale, cosa che nasconde la finestra dell'adunanza Zoom, M³ apre al suo posto l'elenco dei partecipanti di Zoom, così continui a vedere chi alza la mano per commentare. Con l'opzione "Meeting window view" di Zoom impostata su "Dual window" ("Use dual monitors" nelle versioni precedenti di Zoom), la seconda finestra di Zoom va a schermo intero dietro la finestra multimediale, quindi basta nascondere la finestra multimediale per vederla. M³ può anche affiancare le due finestre con la funzione di affiancamento di Windows stesso, così trascinando il bordo tra le due si ridimensionano entrambe. Un pulsante "Disponi finestre" nel popup di Zoom rimette tutto al suo posto in qualsiasi momento, e la disposizione si può cambiare in seguito nelle Impostazioni, sotto Zoom Meeting Manager. Viene salvata per ogni computer, perché dipende dai suoi schermi.

## v26.10.1

### ✨ Nuove funzionalità

- ✨ **Zoom Meeting Manager (beta, Windows)**: una nuova integrazione che gestisce Zoom al posto tuo per ogni adunanza. Può avviare l'adunanza Zoom della tua congregazione quando la musica di sottofondo parte prima dell'adunanza. Quando la musica si ferma poco prima dell'inizio dell'adunanza, si collega all'audio del computer, riattiva il microfono, accende il video dell'host e disattiva l'audio a tutti senza consentire loro di riattivarlo. Quando la musica viene riprodotta prima o dopo un'adunanza, fa il contrario: si disconnette dall'audio del computer, spegne il video dell'host e consente a tutti di riattivare l'audio (invitandoli a farlo). Può anche condividere la finestra multimediale in Zoom automaticamente durante la visualizzazione dei media, assicurandosi che la finestra multimediale sia ciò che viene condiviso e mai nient'altro sullo schermo. Un nuovo pulsante Zoom nell'isola di azione mostra se è stata trovata una finestra dell'adunanza Zoom e consente di eseguire manualmente questi passaggi. Un assistente di configurazione, proposto quando attivi l'opzione (la configurazione guidata iniziale ora lo propone su Windows al posto della condivisione dello schermo tramite scorciatoia da tastiera) e disponibile in qualsiasi momento dal pulsante Zoom o dalle Impostazioni, controlla Zoom, impara i nomi dei pulsanti del microfono e della videocamera nella tua lingua e prova ogni passaggio insieme a te. All'avvio, M³ controlla anche che tutto ciò che automatizza in Zoom funzioni, aprendo se necessario l'adunanza nei giorni di adunanza, nell'ora e un quarto che precede l'inizio (limitandosi a guardare, senza premere nulla, se altri sono già nell'adunanza); se qualcosa non funziona, te lo segnala e sospende le sue automazioni di Zoom finché non viene riavviato o un nuovo controllo non ha esito positivo, così nulla va storto durante l'adunanza. Questo controllo è attivo per impostazione predefinita e può essere disattivato nelle Impostazioni. Man mano che ciascuno di questi passaggi va a buon fine, i promemoria corrispondenti nelle liste di controllo prima e dopo l'adunanza delle azioni rapide vengono spuntati per te, contrassegnati come eseguiti automaticamente in Zoom. Poiché non può essere usato insieme alla condivisione dello schermo tramite scorciatoia da tastiera, le Impostazioni lo segnalano sotto quella delle due opzioni che non è disponibile, indicando quale disattivare. Funziona con Zoom in qualsiasi lingua e non richiede di installare nient'altro oltre a Zoom.

- ✨ **Timer dell'adunanza**: ora è possibile aggiungere parti personalizzate anche nei giorni di adunanza, per gli aggiornamenti del Corpo Direttivo, programmi speciali e qualsiasi altra cosa che non faccia parte del programma regolare. Ognuna è cronometrata come qualsiasi altra parte, e il nome e la durata possono essere modificati dal popup del timer o dall'elenco delle parti.

- ✨ **Timer dell'adunanza**: accesso più rapido al timer. Passando il mouse sul pulsante del timer nell'isola di azione ora viene mostrata la parte cronometrata con i pulsanti Inizia, Pausa, Ferma e Prossima parte, senza aprire il popup (un'impostazione, attiva per impostazione predefinita). Una nuova impostazione consente inoltre di mantenere l'intero elenco delle parti e i comandi del timer in un pannello agganciato sul lato destro della finestra principale, sempre visibile.

- ✨ **Timer dell'adunanza**: una nuova visualizzazione del conto alla rovescia, "Orologio analogico con arco temporale", mostra il tempo rimasto per una parte come uno spicchio sul quadrante di un orologio analogico, dalla lancetta dei minuti alla fine prevista, così con un solo sguardo vedi sia l'ora sia il tempo rimasto. Il tempo superato viene mostrato come uno spicchio rosso. Funziona anche per il conto alla rovescia prima dell'adunanza e in modalità conto in avanti.

- ✨ **Timer dell'adunanza**: il conto alla rovescia prima dell'adunanza ora è etichettato "L'adunanza inizia tra" e il display del timer mostra il nome della parte cronometrata, così "4:59" non può più essere scambiato per l'ora del giorno.

- ✨ **Timer dell'adunanza**: i tempi registrati di ciascun giorno possono essere cancellati in un'unica operazione, previa conferma, dal popup del timer o dal pannello agganciato.

- ✨ **Zoom Meeting Manager (beta, Windows)**: un nuovo assistente per le mani alzate. Durante un'adunanza, M³ controlla l'elenco dei partecipanti di Zoom per individuare le mani alzate. Quando qualcuno alza la mano, una notifica in M³ consente all'operatore di riattivare l'audio di quel partecipante con un clic e, quando ha finito di parlare, di disattivargli di nuovo l'audio e abbassargli la mano con un altro clic; il pulsante Zoom nell'isola di azione elenca le mani alzate con gli stessi pulsanti. Ogni azione viene eseguita sulla riga di quel partecipante in Zoom, in base al suo nome esatto, e M³ non interviene su nessuno quando due partecipanti hanno lo stesso nome. Se il timer dell'adunanza è attivo, sul display del timer per il presidente compare anche una grande mano con il nome del partecipante, che può essere attivata manualmente dai popup del timer o di Zoom. M³ impara come Zoom indica le mani alzate nella tua lingua tramite un solo pulsante (che alza e abbassa la tua mano), proposto anche nell'assistente di configurazione.

- ✨ **Timer dell'adunanza**: un nuovo timer remoto, opzionale. Quando è attivato, M³ rende disponibile una copia di sola lettura del display del timer come pagina web sulla rete locale, così un tablet o un telefono sul leggio può mostrare all'oratore il tempo rimanente senza che compaia sullo schermo della congregazione o nella condivisione Zoom. La pagina segue il timer in tempo reale (parti, conto alla rovescia prima dell'adunanza, orologio, colori del tempo superato, avviso della mano) e tutti i comandi restano in M³. Gli indirizzi da aprire sono mostrati nel popup del timer, con un pulsante per copiarli.

- ✨ **Configurazione guidata**: la configurazione guidata ora chiede se conservi i file per le adunanze in un'app di archiviazione cloud come Dropbox, OneDrive, iCloud Drive o Google Drive. In tal caso, ti aiuta a scegliere lì una cartella condivisa e mostra come funziona: M³ crea una cartella per ogni adunanza in programma, con il nome della data dell'adunanza, e i file inseriti vengono aggiunti automaticamente a quell'adunanza, su ogni computer che usa la cartella.

## v26.9.0

### ✨ Nuove funzionalità

- ✨ **Azioni rapide prima/dopo l'adunanza**: un nuovo pannello con pulsanti grandi aiuta nei momenti che precedono e seguono immediatamente ogni adunanza: conto alla rovescia in tempo reale, avvio/arresto della musica di sottofondo con un tocco, avvio/arresto della registrazione e una lista di controllo per congregazione, suddivisa in categorie e modificabile dalle Impostazioni. Il pannello prima dell'adunanza si chiude automaticamente quando l'adunanza inizia e la lista di controllo è completata (o dopo un breve periodo di tolleranza), e può sempre essere chiuso manualmente.

## v26.8.0

### ✨ Nuove funzionalità

- ✨ **Nuovo design dell'intera app**: un ampio rinnovamento grafico e dell'interazione che riguarda le finestre di dialogo, l'elenco e l'intestazione dei media, le Impostazioni e la configurazione guidata. La configurazione guidata ora presenta una domanda per schermata, con una barra di avanzamento. Tutte le richieste sono state sostituite da una finestra di dialogo uniforme con lo stile dell'app, e la selezione dell'intervallo di pagine dei PDF (per le importazioni da pubblicazioni e tramite trascinamento) ora usa un selettore a griglia di miniature invece di un campo di testo libero. Aggiunto un nuovo tour della Guida rapida al termine della configurazione guidata. Include anche uno stile rinnovato per schede e intestazioni, con ombre adatte alla modalità scura, e diverse correzioni del contrasto in modalità scura (etichette dei campi attivi, percentuali di avanzamento dei download).
- ✨ **Pagina Impostazioni**: riorganizzata in un layout a due pannelli, con una nuova sezione globale Preferenze in cui sono stati spostati gli interruttori degli aggiornamenti automatici e beta, prima presenti nella finestra Informazioni (che ora è puramente informativa).
- ✨ **Pulsante Aggiungi altri media**: aggiunta un'impostazione per scegliere esattamente in quali sezioni dell'adunanza mostrare il pulsante di scelta rapida "aggiungi altri media", insieme a un'impostazione per una modalità compatta (solo icona).
- ✨ **Elenco dei media**: durante l'aggiunta, gli elementi ora mostrano dei segnaposto di caricamento invece di apparire vuoti, i gruppi di media indicano nel badge il numero di elementi nascosti (es. "9 elementi (2 nascosti)"), gli elementi all'interno di un gruppo possono essere riordinati trascinandoli e, con finestre molto strette, gli elementi si riducono a chip compatti con descrizione comando invece di affollare la riga.

## v26.7.7

### ✨ Nuove funzionalità

- ✨ **Qualità dell'anteprima dei media**: l'anteprima dei media ora disegna i fotogrammi video tramite canvas con un ridimensionamento di alta qualità, eliminando le anteprime seghettate o sfocate (soprattutto con contenuti ricchi di testo, come i cantici). L'anteprima si disattiva anche automaticamente se deve correggere ripetutamente lo sfasamento della riproduzione di uno stesso video, e puoi riattivarla con un clic.

## v26.7.6

### ✨ Nuove funzionalità

- ✨ **Esclusione dei video dello Studio biblico di congregazione**: aggiunta un'impostazione per escludere i video dello Studio biblico di congregazione provenienti da pubblicazioni specifiche (per impostazione predefinita il libro **Cammina coraggiosamente con Dio**), con un selettore di pubblicazioni in cui è possibile cercare.
- ✨ **Numeri di pagina dei documenti**: gli elenchi dei media delle pubblicazioni e dell'importazione JWPUB ora mostrano dopo il titolo il numero di pagina di ogni documento (o i numeri, se le pagine sono più di una). Questo può aiutarti a trovare rapidamente un media specifico quando conosci il numero della pagina in cui si trova.

## v26.7.4

### ✨ Nuove funzionalità

- ✨ **Recupero dei media mancanti**: gli elementi multimediali il cui file locale è andato perso (ad es. eliminato dalla cancellazione automatica della cache, o rimosso manualmente) mostrano ora un pulsante di riproduzione disabilitato, una didascalia «mancante» che indica il file da cercare e una nuova azione «Individua file» per ricollegare l'elemento a un file sul disco.
- ✨ **Avviso di compatibilità**: aggiunto un banner ignorabile che avvisa gli utenti con combinazioni di sistema operativo/architettura presto non più supportate (macOS 12 Monterey e Windows a 32 bit) di aggiornare prima che i futuri aggiornamenti dell'app richiedano un sistema più recente.

## v26.7.0

### ✨ Nuove funzionalità

- ✨ **Riproduzione audio collegata**: aggiunto il supporto per riprodurre l'audio di un file insieme al video di un altro file. Può essere utile per riprodurre presentazioni video con musica di accompagnamento.
- ✨ **Layout dei media monitorati**: aggiunta la persistenza degli elementi multimediali monitorati e dell'ordine delle sezioni tra le cartelle monitorate. Questo garantisce che l'elenco dei media venga mostrato allo stesso modo anche quando la cartella monitorata è sincronizzata tra più dispositivi.

## v26.6.1

### ✨ Nuove funzionalità

- ✨ **Anteprima dei media**: aggiunto un overlay di anteprima dei media dal vivo che può essere attivato o disattivato dalle impostazioni o dal popup di visualizzazione.
- ✨ **Cerca media**: aggiunta una casella di ricerca rapida nell'elenco dei media che consente di trovare rapidamente i media per titolo. Per usarla, basta usare la scorciatoia da tastiera standard per la ricerca (Ctrl+F o Cmd+F).
- ✨ **Filtra le impostazioni**: aggiunta una casella di filtro alla pagina delle impostazioni che consente di trovare le impostazioni per parola chiave o categoria. Per usarla, basta fare clic sul pulsante Cerca nell'angolo in alto a destra della pagina delle impostazioni, oppure usare la scorciatoia da tastiera standard per la ricerca (Ctrl+F o Cmd+F).
- ✨ **Avviso di sovrapposizione della musica di sottofondo**: aggiunta una notifica di avviso quando si avvia un media mentre è in riproduzione la musica di sottofondo. Gli utenti possono scegliere di fermare la musica di sottofondo dalla notifica.

## v26.6.0

### ✨ Nuove funzionalità

- ✨ **Timer**: aggiunte modalità di visualizzazione analogica e lo stato del resoconto dei tempi.
- ✨ **Profili**: aggiunte l'importazione e l'esportazione delle impostazioni del profilo nelle impostazioni avanzate e nella configurazione guidata.
- ✨ **Finestra multimediale**: aggiunto il supporto per nascondere automaticamente la finestra multimediale dopo la riproduzione quando era inizialmente nascosta. Questo è pratico quando, ad esempio, un oratore in collegamento vuole mostrare delle immagini.

## v26.5.0

### ✨ Nuove funzionalità

- ✨ **Importazione PDF**: aggiunto un nuovo flusso di importazione PDF alla finestra Media delle pubblicazioni, che consente di importare automaticamente la versione PDF di una pubblicazione come singole immagini quando desiderato.

## v26.4.8

### ✨ Nuove funzionalità

- ✨ **JW Stream**: aggiunto JW Stream all'elenco dei siti web di cui è possibile eseguire il mirroring.

## v26.4.0

### ✨ Nuove funzionalità

- ✨ **Timer dell'adunanza**: è stata aggiunta una nuova funzione di timer per l'adunanza. È facoltativo e può essere abilitato nelle impostazioni avanzate, se lo si desidera. Il timer consente all'operatore multimediale di tenere traccia del tempo impiegato per le parti dell'adunanza, oppure di mostrare il tempo trascorso sulla parte in corso su uno schermo dedicato visibile solo all'oratore.

## v26.3.0

### ✨ Nuove funzionalità

- ✨ **Media della Commemorazione**: il recupero automatico dei media della Commemorazione non è più in beta! L'app scaricherà automaticamente il video di benvenuto e l'immagine da mostrare durante la Commemorazione, quando disponibili nella lingua configurata.
- ✨ **Velocità di riproduzione**: aggiunto il controllo della velocità di riproduzione con indicatore visivo e ripristino manuale. Questa funzione è visibile solo se abilitata nelle impostazioni avanzate.
- ✨ **Cantici in pinyin**: aggiunta un'opzione per sostituire i cantici con la versione in pinyin per le adunanze tenute in cinese.

## v26.2.0

### ✨ Nuove funzionalità

- ✨ **Controllo dello spazio su disco**: aggiunta una funzione che monitora lo spazio su disco e avvisa quando sta per esaurirsi.

## v26.1.5

### ✨ Nuove funzionalità

- ✨ **Media della Commemorazione**: recupera automaticamente il banner e il video introduttivo della Commemorazione nelle lingue supportate quando viene selezionata la data della Commemorazione.

## v26.1.0

### ✨ Nuove funzionalità

- ✨ **Sincronizzazione automatica del programma delle adunanze**: aggiunta la possibilità di sincronizzare automaticamente date e orari delle adunanze con il sito ufficiale. Questa funzione è abilitata per impostazione predefinita e può essere attivata manualmente o disabilitata nelle impostazioni avanzate.
- ✨ **Modifiche future del programma**: l'app include ora le modifiche future del programma quando si crea una congregazione usando la ricerca sul sito web, se disponibili.
- ✨ **Cache condivisa per le installazioni a livello di macchina**: le installazioni a livello di macchina condividono ora una cartella dati comune per impostazione predefinita, ottimizzando l'uso dello spazio di archiviazione e della banda tra più utenti sullo stesso computer.

## v25.12.2

### ✨ Nuove funzionalità

- ✨ **Pulsanti zoom/panoramica**: aggiunta la possibilità di tenere premuti i pulsanti di zoom e panoramica per una regolazione continua.

## v25.12.0

### ✨ Nuove funzionalità

- ✨ **Menu contestuale multi-selezione**: aggiunto il supporto per le azioni del menu tasto destro quando sono selezionati più elementi multimediali.
- ✨ **Scorciatoie da tastiera**: aggiunte `Ctrl/Cmd+A` per selezionare tutti i media, `H` per nascondere i media selezionati e `Shift+Up/Down` per la navigazione della selezione da tastiera.
- ✨ **Impostazioni dei video dello Studio Torre di Guardia**: aggiunta un'impostazione per escludere i video extra dello Studio Torre di Guardia.
- ✨ **Sezioni comprimibili**: aggiunta la possibilità di comprimere le sezioni nei giorni senza adunanza per una vista più pulita.
- ✨ **Sito web JW Events**: aggiunta la possibilità di presentare il sito web JW Events oltre al sito ufficiale principale.
- ✨ **Personalizzazione dell'importazione delle playlist**: aggiunta la possibilità di personalizzare il prefisso che viene aggiunto agli elementi multimediali quando si importano le playlist di JW.
- ✨ **Navigazione del mirroring del sito web**: aggiunto un interruttore per passare automaticamente all'elenco dei media dopo che il mirroring del sito web è stato interrotto.
- ✨ **Controlli di registrazione OBS**: aggiunta la possibilità di controllare le registrazioni di OBS.
- ✨ **Anteprima del testo dell'anno**: aggiunta la possibilità di vedere l'anteprima del testo dell'anno successivo a partire da dicembre di ogni anno.
- ✨ **Notifiche di aggiornamento**: aggiunte notifiche di avviso se si esegue una versione beta o se gli aggiornamenti sono disabilitati, e migliorata la visualizzazione dell'avanzamento del download degli aggiornamenti.
- ✨ **Impostazioni dell'accelerazione hardware**: aggiunta un'opzione per disabilitare permanentemente l'accelerazione hardware se necessario.

## v25.11.0

### ✨ Nuove funzionalità

- ✨ **Selezione dei media JWPUB**: aggiunto un modo per selezionare singoli media dai file JWPUB.
- ✨ **Focus automatico della finestra multimediale**: aggiunta un'impostazione facoltativa per mettere automaticamente a fuoco la finestra multimediale dopo la condivisione dello schermo su Zoom.
- ✨ **Overlay del cursore per la visualizzazione su TV**: migliorato l'overlay del cursore nella finestra del sito web per una migliore visibilità del puntatore del mouse sugli schermi TV.
- ✨ **Registrazione dell'adunanza**: aggiunta una nuova funzione di registrazione dell'adunanza, per controllare un'app di registrazione esterna.
- ✨ **Ricerca sul sito**: aggiunta la possibilità di cercare media o pubblicazioni sul sito usando la ricerca intelligente.
- ✨ **Importazione manuale semplice delle pubblicazioni**: aggiunta la funzione per importare facilmente pubblicazioni da JW.org, come riviste, libri, programmi e inviti.
- ✨ **Miglioramenti per la lingua dei segni**: aggiunta una conferma prima di riprodurre interi file per le lingue dei segni e il supporto per selezionare più clip, ad esempio quando più paragrafi devono essere letti consecutivamente.
- ✨ **Navigazione delle clip**: aggiunta la visualizzazione della durata agli elementi dell'elenco delle clip e migliorata la navigazione delle clip.
- 🛠️ **Visualizzazione dei media**: garantito che la visualizzazione dei media diventi visibile quando inizia la riproduzione, anche se era nascosta prima.

## v25.10.1

### ✨ Nuove funzionalità

- ✨ **Configurazione guidata – Passaggio Zoom**: aggiunto un passaggio di integrazione con Zoom alla configurazione guidata per una configurazione iniziale più semplice.
- ✨ **Miglioramenti al selettore di schermi**: mostra una rappresentazione visiva accurata di tutti gli schermi, oltre alla dimensione e posizione attuali della finestra principale, nel popup di visualizzazione. Questo rende più facile scegliere lo schermo corretto su cui mostrare la finestra multimediale.
- ✨ **Preferenza della finestra multimediale**: l'app ricorderà ora lo schermo preferito su cui mostrare la finestra multimediale, se specificato dall'utente.

## v25.10.0

### ✨ Nuove funzionalità

- ✨ **Avvia la riproduzione in pausa**: aggiunta una nuova impostazione per consentire alla riproduzione di iniziare in pausa, utile agli operatori audio/video per preparare la loro configurazione (come avviare la condivisione su Zoom) prima che il media inizi a essere riprodotto nella finestra multimediale.
- ✨ **Notifiche di aggiornamento**: gli utenti verranno ora avvisati degli aggiornamenti tramite un banner nell'app, che permetterà anche di installare gli aggiornamenti immediatamente, invece di aspettare il successivo riavvio dell'app.
- ✨ **Eventi personalizzati**: aggiunti hook di eventi facoltativi che possono attivare scorciatoie da tastiera quando vengono rilevati determinati eventi. Può essere utile agli operatori audio/video per eseguire automaticamente azioni al di fuori dell'app. Ad esempio, le luci smart potrebbero essere accese e spente prima e dopo la riproduzione dei media negli auditorium in cui si usano proiettori; oppure si può richiamare uno script dopo la riproduzione dell'ultimo cantico di un'adunanza per automatizzare varie azioni in un'adunanza Zoom.

## v25.9.1

### ✨ Nuove funzionalità

- ✨ **Finestra multimediale sempre in primo piano e comportamento a schermo intero**: corretto e migliorato il comportamento sempre-in-primo-piano della finestra multimediale, adattandolo dinamicamente in base allo stato a schermo intero.
- ✨ **Impostazione del formato di visualizzazione della data**: aggiunta un'impostazione utente per configurare un formato di visualizzazione della data.
- ✨ **Dissolvenza incrociata dei media**: implementate transizioni in dissolvenza incrociata per la visualizzazione dei media, al posto della più brusca transizione con dissolvenza al nero presente in precedenza.
- ✨ **Arresto automatico della musica**: ottimizzato l'arresto automatico della musica di sottofondo, che ora si comporta allo stesso modo sia che la musica sia stata avviata automaticamente sia che non lo sia
- ✨ **Click-through su finestre inattive in macOS**: abilitato il passaggio dei clic del mouse sulla finestra principale in macOS, il che dovrebbe rendere più facile controllare l'app anche quando non è in primo piano.

## v25.9.0

### ✨ Nuove funzionalità

- ✨ **Miglioramenti del popup di download**: aggiunti il pulsante di aggiornamento e il raggruppamento dei download per data nel popup di download.
- ✨ **Memoria dell'ordine dei media monitorati**: aggiunta la memoria dell'ordine delle sezioni per gli elementi multimediali monitorati.

## v25.8.3

### ✨ Nuove funzionalità

- ✨ **Transizioni in dissolvenza della finestra multimediale**: aggiunta una nuova impostazione avanzata per far comparire e scomparire in dissolvenza la finestra multimediale, offrendo transizioni visive più morbide.
- ✨ **Controllo della durata delle immagini e monitoraggio dell'avanzamento**: aggiunte le funzioni di controllo della durata delle immagini e di monitoraggio dell'avanzamento per le sezioni ripetute.

## v25.8.1

### ✨ Nuove funzionalità

- ✨ **Sezioni multimediali personalizzate**: sistema completo per creare, modificare e gestire sezioni multimediali personalizzate, con personalizzazione del colore e riordinamento tramite trascinamento.
- ✨ **Separatori dei media**: aggiunge separatori con titolo negli elenchi dei media per una migliore organizzazione, con opzioni di posizionamento in alto/in basso.
- ✨ **Modalità ripetizione sezione**: abilita la riproduzione continua all'interno di sezioni specifiche per loop dei media senza interruzioni.
- ✨ **Integrazione con Zoom**: avvio e arresto automatici della condivisione dello schermo coordinati con la riproduzione dei media.

## v25.7.0

### ✨ Nuove funzionalità

- Nessuna nuova funzionalità per questa versione!

## 25.6.0

### ✨ Nuove funzionalità

- ✨ **Impostazione per connessioni a consumo**: aggiunta una nuova impostazione per ridurre l'uso della banda di download sulle connessioni a consumo.
- ✨ **Gestione migliorata dei media in streaming**: supporto migliore per i media in streaming, con meno problemi legati alla latenza.

## 25.5.0

### ✨ Nuove funzionalità

- 🖼️ **Opzione di ritardo OBS per le immagini**: aggiunge un'impostazione di OBS Studio per ritardare i cambi di scena quando si mostrano le immagini, migliorando le transizioni.
- 🔊 **Supporto per il formato audio `.m4a`**: aggiunge la compatibilità con i file audio `.m4a` per ampliare i tipi di media supportati.

## 25.4.0

### ✨ Nuove funzionalità

- 🇵🇭 **Nuova lingua: tagalog**: aggiunto il supporto per il tagalog, ampliando le capacità multilingue dell'app.
- 🎞 **Supporto per il formato video `.m4v`**: ora supporta la riproduzione dei file `.m4v` per migliorare la compatibilità dei media.

## 25.3.1

### ✨ Nuove funzionalità

- 🌏 **Nuova lingua: coreano**: aggiunge il supporto per la lingua coreana, ampliando l'accessibilità per più utenti.

## 25.3.0

### ✨ Nuove funzionalità

- 🎵 **Riproduci la musica di sottofondo con i video**: consente alla musica di sottofondo di continuare a suonare mentre si guardano i video.
- 🎥 **Feed della videocamera per i media nella lingua dei segni**: aggiunge la possibilità di mostrare un feed della videocamera nella finestra multimediale specificamente per gli utenti della lingua dei segni.
- 📅 **Data e sfondo automatici della Commemorazione**: rileva e imposta automaticamente la data della Commemorazione e prepara l'immagine di sfondo della Commemorazione.
- 📜 **Mostra le note di rilascio nell'app**: mostra le note di rilascio direttamente nell'applicazione così gli utenti possono rivedere facilmente le modifiche dopo un aggiornamento.

## 25.2.1

### ✨ Nuove funzionalità

- 🔄 **Consenti tentativi di riconnessione a OBS**: introdotta la possibilità di forzare manualmente la riconnessione di OBS quando necessario.
- 🗑 **Pulizia automatica delle vecchie cartelle di esportazione per data**: rimuove automaticamente le cartelle di esportazione per data obsolete per mantenere organizzato lo spazio di archiviazione.

## 25.2.0

### ✨ Nuove funzionalità

- 🌍 **Usa la lingua di sistema per impostazione predefinita**: rileva e usa automaticamente le impostazioni locali del sistema per un'esperienza più personalizzata.
- 🏷 **Supporto dei tag per i media esportati**: aggiunge tag di metadati ai file multimediali esportati per una migliore organizzazione.
- 🔄 **Downgrade automatico da beta a stabile**: consente il downgrade automatico dalle versioni beta alle versioni stabili quando necessario.
- 🌐 **Estrai gli indici di lingua MEPS più recenti**: recupera gli indici di lingua MEPS più recenti direttamente dal sito ufficiale, garantendo un supporto linguistico aggiornato.

## 25.1.0

### ✨ Nuove funzionalità

- 📅 **Apri date precedenti**: consente di aprire le date precedenti della settimana corrente, utile quando il giorno dell'adunanza viene spostato più avanti nella settimana.
- 🛑 **Banner di errore per OBS Studio**: aggiunto un banner di errore quando OBS Studio non è connesso in un giorno di adunanza, così che gli utenti vengano avvisati.
- 📚 **Raggruppa i media per pubblicazione**: raggruppa i media della stessa pubblicazione di riferimento per una panoramica più pulita e ordinata.
- 🎵 **Avviso cantici duplicati**: mostra un avviso se dei cantici compaiono più di una volta nell'elenco dei media per le adunanze del fine settimana.
- 🔄 **Pianificazione dei programmi futuri**: consente di pianificare le future modifiche al programma delle adunanze, utile per i cambi di orario annuali o per la visita del sorvegliante di circoscrizione a una congregazione vicina.

## 24.11.0

### ✨ Nuove funzionalità

- 🖥️ **Presentazione del sito web su macOS**: La presentazione del sito web è ora supportata su macOS 🚀
- ⌨️ **Scorciatoie da tastiera per la riproduzione**: introdotte scorciatoie da tastiera per fermare, mettere in pausa e riprendere la riproduzione dei media 🚀
- 🌐 **Indirizzo personalizzato per il download dei media**: aggiunta la possibilità di impostare l'indirizzo web da cui scaricare i media 🚀
- 🎬 **Selettore istantaneo delle scene OBS**: aggiunto il selettore istantaneo delle scene di OBS Studio e rinnovata la funzione di selezione delle scene nelle impostazioni
- 📖 **Più lingue per la documentazione**: il sito web della documentazione ora supporta più lingue

## 24.10.10

### ✨ Nuove funzionalità

- ⌨️ **Scorciatoie per spostarsi tra i media**: aggiunte scorciatoie da tastiera per passare all'elemento multimediale successivo/precedente
- 🖱️ **Menu contestuale degli elementi multimediali**: aggiunto un menu, accessibile con il tasto destro del mouse, per nascondere e rinominare gli elementi multimediali
- ✂️ **Importazione di playlist JWL con tagli**: i tagli dei video ora vengono rispettati nelle playlist JWL importate

## 24.10.9

### ✨ Nuove funzionalità

- 🗑️ **Eliminazione dei media aggiuntivi di un giorno**: aggiunta un'opzione per eliminare tutti i file multimediali aggiuntivi del giorno attualmente selezionato
