# Guida alle impostazioni {#settings-guide}

Questa guida completa spiega tutte le impostazioni disponibili in M³, organizzate per categoria. Capire queste impostazioni ti aiuterà a configurare M³ in modo che funzioni perfettamente per le esigenze della tua congregazione.

## Generale {#application-configuration}

### Lingua di visualizzazione {#display-language}

<!-- **Setting**: `localAppLang` -->

Scegli la lingua dell'interfaccia di M³. È indipendente dalla lingua usata per il download dei media.

**Opzioni**: tutte le lingue dell'interfaccia disponibili (inglese, spagnolo, francese, ecc.)

**Predefinito**: inglese

### Modalità scura {#dark-mode}

<!-- **Setting**: `darkMode` -->

Controlla il tema dell'aspetto di M³.

**Opzioni**:

- Cambia automaticamente in base alle preferenze di sistema
- Usa sempre la modalità scura
- Usa sempre la modalità chiara

**Predefinito**: Automatico

### Primo giorno della settimana {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Imposta quale giorno deve essere considerato il primo giorno della settimana nella vista calendario.

**Opzioni**: da domenica a sabato

**Predefinito**: domenica

### Formato della data {#date-format}

<!-- **Setting**: `localDateFormat` -->

Formato usato per mostrare le date nell'app.

**Esempio**: D MMMM YYYY

**Predefinito**: D MMMM YYYY

### Avvio automatico all'accesso {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Avvia automaticamente M³ all'accensione del computer.

**Predefinito**: `false`

## Adunanze di congregazione {#congregation-meetings}

### Nome della congregazione {#congregation-name}

<!-- **Setting**: `congregationName` -->

Il nome della tua congregazione. Viene usato a scopo di organizzazione e visualizzazione.

**Predefinito**: vuoto (deve essere impostato durante la configurazione)

### Lingua delle adunanze {#meeting-language}

<!-- **Setting**: `lang` -->

La lingua principale per il download dei media. Dovrebbe corrispondere alla lingua usata nelle adunanze della tua congregazione.

**Opzioni**: tutte le lingue disponibili sul sito ufficiale dei Testimoni di Geova

**Predefinito**: inglese (E)

### Lingua di ripiego {#fallback-language}

<!-- **Setting**: `langFallback` -->

Una lingua secondaria da usare quando i media non sono disponibili nella lingua principale.

**Opzioni**: tutte le lingue disponibili sul sito ufficiale dei Testimoni di Geova

**Predefinito**: Nessuna

### Giorno dell'adunanza infrasettimanale {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

Il giorno della settimana in cui si tiene l'adunanza infrasettimanale.

**Opzioni**: da domenica a sabato

**Predefinito**: Nessuno (deve essere impostato durante la configurazione)

### Orario dell'adunanza infrasettimanale {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

L'orario di inizio dell'adunanza infrasettimanale.

**Formato**: HH:MM (formato 24 ore)

**Predefinito**: Nessuno (deve essere impostato durante la configurazione)

### Giorno dell'adunanza del fine settimana {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

Il giorno della settimana in cui si tiene l'adunanza del fine settimana.

**Opzioni**: da domenica a sabato

**Predefinito**: Nessuno (deve essere impostato durante la configurazione)

### Orario dell'adunanza del fine settimana {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

L'orario di inizio dell'adunanza del fine settimana.

**Formato**: HH:MM (formato 24 ore)

**Predefinito**: Nessuno (deve essere impostato durante la configurazione)

### Settimana del sorvegliante di circoscrizione {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

La settimana della prossima visita del sorvegliante di circoscrizione.

**Formato**: MM/DD/YYYY

**Predefinito**: Nessuna

### Data della Commemorazione {#memorial-date}

<!-- **Setting**: `memorialDate` -->

La data della prossima Commemorazione.

**Formato**: MM/DD/YYYY

**Predefinito**: recuperato automaticamente a intervalli regolari

### Modifiche al programma delle adunanze {#meeting-schedule-changes}

Queste impostazioni ti permettono di configurare modifiche temporanee al programma delle adunanze:

- **Data della modifica**: quando la modifica ha effetto
- **Modifica una tantum**: se si tratta di una modifica permanente o temporanea
- **Nuovo giorno infrasettimanale**: nuovo giorno per l'adunanza infrasettimanale
- **Nuovo orario infrasettimanale**: nuovo orario per l'adunanza infrasettimanale
- **Nuovo giorno del fine settimana**: nuovo giorno per l'adunanza del fine settimana
- **Nuovo orario del fine settimana**: nuovo orario per l'adunanza del fine settimana

### Aggiornamenti automatici del programma delle adunanze {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

Quando abilitato, M³ controlla periodicamente sul sito ufficiale dei Testimoni di Geova le modifiche del giorno e dell'orario delle adunanze e aggiorna automaticamente il profilo corrente.

Funziona solo per i profili aggiunti con la ricerca della congregazione e il cui nome della congregazione non è stato modificato manualmente. Se la sincronizzazione è stata disabilitata perché il nome della congregazione è cambiato, usa **Abilita sincronizzazione degli orari** per ricollegare il profilo.

#### Abilita sincronizzazione degli orari {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Ricollega il profilo corrente alla ricerca della congregazione, in modo che gli aggiornamenti automatici del giorno e dell'orario delle adunanze possano riprendere. Viene mostrato solo dopo che il nome della congregazione è stato modificato manualmente, perché è proprio questo a interrompere il collegamento.

#### Aggiorna il programma delle adunanze {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Sincronizza manualmente il programma delle adunanze attuale e futuro con le informazioni del sito ufficiale.

## Media e riproduzione {#media-retrieval-and-playback}

### Connessione a consumo {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Abilita questa opzione se hai una connessione dati limitata per ridurre l'uso della banda.

**Predefinito**: `false`

### Visualizzazione dei media {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Abilita la funzione di visualizzazione dei media. È necessaria per presentare i media su un secondo monitor.

**Predefinito**: `false`

#### Abilita l'anteprima dei media {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Mostra un'anteprima dal vivo della finestra multimediale mentre viene mostrata un'immagine o un video.

**Predefinito**: `true`

#### Avvia la riproduzione in pausa {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Avvia i video in stato di pausa quando inizia la riproduzione.

**Predefinito**: `false`

### Musica di sottofondo {#settings-guide-background-music}

#### Abilita la musica {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Abilita la funzione della musica di sottofondo.

**Predefinito**: `true`

#### Avvio automatico della musica {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Avvia automaticamente la musica di sottofondo all'avvio di M³ quando opportuno.

**Predefinito**: `true`

#### Margine di arresto prima dell'adunanza {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Quanti secondi prima dell'orario di inizio dell'adunanza fermare la musica di sottofondo.

**Intervallo**: 0-300 secondi

**Predefinito**: 60 secondi

#### Volume della musica {#music-volume}

<!-- **Setting**: `musicVolume` -->

Livello del volume della musica di sottofondo (1-100%).

**Predefinito**: 100%

### Opzioni di riproduzione e download {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### Abilita le transizioni in dissolvenza della finestra multimediale {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Abilita le transizioni in dissolvenza in entrata/uscita quando si mostra o si nasconde la finestra multimediale.

**Predefinito**: `true`

#### Abilita il controllo della velocità di riproduzione {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Consente di regolare la velocità di riproduzione di audio e video dal menu contestuale dell'elemento multimediale.

**Predefinito**: `false`

#### Nascondi il logo nei media {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Nasconde il logo nella finestra multimediale.

**Predefinito**: `false`

#### Risoluzione massima {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Risoluzione massima per i file multimediali scaricati.

**Opzioni**: 240p, 360p, 480p, 720p, 1080p

**Predefinito**: 720p

#### Includi i media stampati {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Includi i media delle pubblicazioni stampate nei download dei media.

**Predefinito**: `true`

#### Escludi le note in calce {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Escludi le immagini delle note in calce dai download dei media quando possibile.

**Predefinito**: `false`

#### Escludi i video aggiuntivi dello Studio Torre di Guardia {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Escludi i video aggiuntivi a cui si fa riferimento nei paragrafi dello Studio Torre di Guardia.

**Predefinito**: `false`

#### Escludi i video dello Studio biblico di congregazione {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Scegli le pubblicazioni i cui video citati non devono essere mostrati durante lo Studio biblico di congregazione. Cerca per titolo o simbolo della pubblicazione.

**Predefinito**: Cammina coraggiosamente con Dio (`wcg`)

#### Escludi i media dell'opuscolo Insegna {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Escludi dai download dei media i media dell'opuscolo Insegna (th).

**Predefinito**: `true`

### Sottotitoli {#subtitles}

#### Abilita i sottotitoli {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Abilita il supporto dei sottotitoli per la riproduzione dei media.

**Predefinito**: `false`

#### Lingua dei sottotitoli {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Lingua dei sottotitoli (può essere diversa dalla lingua dei media).

**Opzioni**: tutte le lingue disponibili sul sito ufficiale dei Testimoni di Geova

**Predefinito**: Nessuna

### Gestione della cache {#cache-management}

#### Memorizza nella cache i video del libro dei cantici {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Memorizza in anticipo nella cache tutti i video del libro dei cantici per prestazioni migliori. Nota che questo aumenta le dimensioni della cache dei media.

**Predefinito**: `false`

#### Cartella della cache {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Posizione personalizzata per archiviare i file multimediali nella cache.

**Predefinito**: posizione predefinita del sistema

#### Abilita la cancellazione automatica della cache {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Cancella automaticamente i vecchi file nella cache per risparmiare spazio su disco.

**Predefinito**: `true`

### Titoli dei cantici in pinyin {#pinyin-song-titles}

#### Preferisci i cantici in pinyin {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

Quando nella cartella dei cantici in pinyin viene trovata una versione pinyin di un cantico dell'adunanza, viene usata al posto del cantico standard.

**Predefinito**: `false`

#### Cartella dei cantici in pinyin {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

Cartella contenente i video dei cantici in pinyin (ad es. `sjjm_s-Pi_CHS_066_r720P.mp4`). Quando viene trovato un file pinyin corrispondente al numero del cantico dell'adunanza, verrà riprodotto al posto del cantico standard.

**Predefinito**: vuoto

### Esportazione dei media {#settings-guide-media-export}

#### Abilita l'esportazione automatica dei media {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Esporta automaticamente i file multimediali in una cartella specificata.

**Predefinito**: `false`

#### Cartella di esportazione dei media {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Percorso della cartella in cui i file multimediali verranno esportati automaticamente.

**Predefinito**: vuoto

#### Converti i file in MP4 {#convert-files-to-mp4}

**Impostazione**: `convertFilesToMp4`

Converte i file multimediali esportati in formato MP4 per una migliore compatibilità.

**Predefinito**: `false`

### Cartella condivisa (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

Queste impostazioni si trovano nella categoria **Integrazioni**.

M³ può aggiungere media alle tue adunanze da una cartella mantenuta sincronizzata da un'app di archiviazione cloud, come Dropbox, OneDrive, iCloud Drive o Google Drive. È utile quando altri preparano i media per le loro parti e li condividono con te, oppure quando M³ viene usato su più di un computer. Funziona anche con una cartella su questo computer o sulla tua rete.

M³ crea una cartella all'interno della cartella condivisa per ogni adunanza in programma, con il nome della data dell'adunanza scritta nel formato anno-mese-giorno (ad esempio, `2026-03-25`). Metti foto, video, file audio o playlist di JW Library nella cartella di un'adunanza e verranno aggiunti automaticamente all'elenco dei media di quell'adunanza. Per aggiungere file per un altro giorno, crea una cartella anche per quel giorno, con un nome nello stesso formato. Tutto il resto presente nella cartella condivisa viene ignorato.

:::tip Suggerimento

Crea una nuova cartella usata solo per questo scopo, ad esempio "Media adunanze", e nella tua app di archiviazione cloud impostala in modo che rimanga sempre su questo computer (spesso questa opzione si chiama "disponibile offline"), così i file saranno pronti prima che inizi l'adunanza.

:::

#### Aggiungi media da una cartella condivisa {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Aggiunge automaticamente all'adunanza giusta i file inseriti nella cartella condivisa.

**Predefinito**: `false`

#### Cartella condivisa {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

La cartella da cui aggiungere i media. La configurazione guidata si offre di impostarla per te.

**Predefinito**: vuoto

#### Elimina le cartelle delle adunanze passate {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

Quando una settimana è finita, elimina le cartelle datate di quella settimana, insieme ai file che contengono, per mantenere ordinata la cartella condivisa. Dato che la cartella è condivisa, vengono eliminate anche per tutti gli altri che la usano. Disattiva questa opzione per conservarle.

**Predefinito**: `true`

## Timer dell'adunanza {#meeting-timer}

### Abilita il timer dell'adunanza {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Abilita una finestra timer separata per cronometrare le parti dell'adunanza. Questa è una funzione beta e dovrebbe essere abilitata solo se approvata localmente.

**Predefinito**: `false`

### Comportamento della finestra del timer {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configura se la finestra del timer si apre automaticamente, se i timer dei partecipanti contano in avanti o alla rovescia per impostazione predefinita, se l'orologio usa il formato a 12 o 24 ore e se il valore corrente del timer viene mostrato sul pulsante del timer nell'isola di azione.

### Accesso rapido al timer {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Scegli come accedere al timer dalla finestra principale:

- **Controlli rapidi al passaggio sul pulsante del timer**: passando il mouse sul pulsante del timer nell'isola di azione viene mostrata la parte cronometrata, con i pulsanti Inizia, Pausa, Ferma e Prossima parte, senza aprire il popup completo del timer. Attivo per impostazione predefinita.
- **Mostra un pannello timer nella finestra principale**: mantiene l'intero elenco delle parti dell'adunanza e i comandi del timer in un pannello agganciato sul lato destro della finestra principale, sempre visibile. Il popup completo resta disponibile dall'isola di azione per le impostazioni della finestra e della visualizzazione.

### Timer remoto {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemoteFocusLayout`, `timerRemotePort` -->

Quando è attivato, M³ rende disponibile una copia di sola lettura del display del timer come pagina web sulla rete locale, per un tablet o un telefono sul leggio: l'oratore vede il tempo rimanente senza che compaia sullo schermo della congregazione o nella condivisione Zoom. La pagina segue il timer in tempo reale, compresi il conto alla rovescia prima dell'adunanza, l'orologio, i colori del tempo superato e l'avviso della mano, e tutti i comandi restano in M³.

Con il **layout mirato per il timer remoto** attivo, la pagina mostra il tempo in un grande anello di avanzamento: verde acqua finché c'è tempo, giallo nell'ultimo minuto, poi rosso con il tempo di superamento (`+02:18`). I partecipanti Zoom che hanno alzato la mano sono elencati accanto, nell'ordine in cui l'hanno fatto, i primi quattro per nome e gli altri con un conteggio, e ogni nuova mano fa lampeggiare per qualche secondo un avviso «Mano alzata» mentre le mani restano elencate. La visualizzazione predefinita resta il grande tempo semplice.

Finché la pagina è aperta, mantiene acceso lo schermo del dispositivo, così un tablet sul leggio non si blocca né si oscura a metà parte. Dove il browser non lo consente sull'indirizzo HTTP semplice della pagina, riproduce un video silenzioso per tenere acceso lo schermo.

Gli indirizzi da aprire sul dispositivo sono elencati nel popup del timer, con un pulsante per copiarli. Cambia la porta solo se un altro programma la usa già. Nota che chiunque sia connesso alla stessa rete può aprire la pagina mentre questa opzione è attiva; la pagina mostra solo il timer.

**Predefinito**: `false`, porta `8787`

### Formati di visualizzazione del timer {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Scegli formati di visualizzazione analogici o digitali per l'ora del giorno e i timer del conto alla rovescia. L'indicatore di avviso del conto alla rovescia può spostare l'anello analogico del conto alla rovescia verso un colore di avviso durante l'ultimo minuto.

Il formato di conto alla rovescia **Orologio analogico con arco temporale** mostra il tempo rimasto per una parte come uno spicchio sul quadrante di un orologio analogico, dalla lancetta dei minuti alla fine prevista, così con un solo sguardo vedi sia l'ora sia il tempo rimasto. Il tempo superato viene mostrato come un secondo spicchio nel colore del tempo superato. Si applica anche al conto alla rovescia prima dell'adunanza e funziona in modalità conto in avanti.

### Conto alla rovescia dell'adunanza e stato del programma {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Mostra un conto alla rovescia prima delle adunanze programmate e, se vuoi, indica se l'adunanza è in anticipo o in ritardo sul programma. Il conto alla rovescia dell'adunanza appare solo sul display del timer, non sulla visualizzazione principale dei media.

### Aspetto del timer e tempo superato {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Personalizza la dimensione e i colori del testo del timer e configura gli indicatori di tempo superato, come colori alternati, lampeggiamento e la visualizzazione del solo tempo superato trascorso in modalità conteggio in avanti.

## Integrazioni {#integrations}

Questa categoria contiene anche le impostazioni della [cartella condivisa](#settings-guide-folder-monitoring), per aggiungere media da Dropbox, OneDrive, iCloud Drive o Google Drive.

### Integrazione con Zoom {#settings-guide-zoom-integration}

#### Abilita Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Attiva le funzioni di integrazione con le adunanze Zoom.

**Predefinito**: `false`

#### Scorciatoia per la condivisione dello schermo {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Scorciatoia da tastiera per attivare la condivisione dello schermo di Zoom.

**Predefinito**: Nessuna

#### Primo piano automatico della finestra multimediale {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Metti automaticamente in primo piano la finestra multimediale dopo l'avvio della condivisione dello schermo di Zoom. Di solito non è necessario, ma su alcuni sistemi può essere utile se la finestra multimediale perde spesso il primo piano dopo l'avvio della condivisione dello schermo di Zoom.

**Predefinito**: `false`

### Zoom Meeting Manager {#zoom-meeting-manager}

Zoom Meeting Manager (beta, solo Windows) gestisce l'app desktop di Zoom al posto tuo per ogni adunanza. Il suo assistente di configurazione, proposto quando lo attivi, ti guida passo passo in ciascuna automazione.

#### Mentre M³ gestisce Zoom {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Zoom non offre un'interfaccia di automazione adeguata, quindi M³ controlla l'app Zoom tramite la sua interfaccia di accessibilità, che funziona senza spostare il mouse, anche quando Zoom nasconde la sua barra degli strumenti. Zoom porta comunque in primo piano la propria finestra per un momento quando M³ ne preme i pulsanti, e il mouse si sposta solo come ultima risorsa, se Zoom non risponde in nessun altro modo. Ogni volta che M³ gestisce Zoom, copre la propria finestra con un avviso "M³ sta gestendo Zoom" che indica cosa sta succedendo, con un pulsante **Annulla questa automazione**. Lo stesso avviso viene mostrato durante i controlli dell'assistente di configurazione e durante l'autotest. Una scorciatoia da tastiera globale (predefinita `Ctrl+Alt+Escape`), attiva solo mentre un'automazione è in esecuzione, la annulla da qualsiasi punto, anche quando Zoom è in primo piano. L'annullamento ferma M³ immediatamente; Zoom potrebbe quindi restare a metà operazione, perciò controllalo.

**Predefinito**: `Ctrl+Alt+Escape`

#### Assistente mani alzate {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert` -->

Durante un'adunanza, M³ controlla l'elenco dei partecipanti di Zoom per individuare le mani alzate. Quando qualcuno alza la mano, una notifica in M³ ti permette di **riattivare l'audio** di quel partecipante con un clic e, quando ha finito di parlare, di **disattivargli di nuovo l'audio e abbassargli la mano** con un altro clic. Il pulsante Zoom nell'isola di azione elenca le mani alzate con gli stessi pulsanti. Ogni azione viene eseguita sulla riga di quel partecipante in Zoom, in base al suo nome esatto; se due partecipanti hanno lo stesso nome, M³ non interviene su nessuno dei due.

Se il [timer dell'adunanza](#meeting-timer) è abilitato, sulla visualizzazione del timer per il presidente appare anche una grande mano con il nome del partecipante, e un pulsante **Avviso mano** nei popup del timer e di Zoom permette di mostrarla manualmente. Questa parte ha bisogno della visualizzazione del timer; le notifiche e i pulsanti funzionano senza di essa.

Zoom indica le mani alzate nella propria lingua, quindi M³ deve prima impararlo: con la tua adunanza aperta in Zoom, fai clic su **Scopri come Zoom indica le mani alzate**. M³ alza la tua mano, rileva come Zoom la indica nell'elenco dei partecipanti e quale voce di menu la abbassa, poi la abbassa di nuovo. L'assistente di configurazione offre anche questo passaggio.

**Predefinito**: `false`

#### Disposizione delle finestre {#zoom-meeting-manager-window-layout}

<!-- **Setting**: `zoomMeetingManagerWindowLayout` -->

M³ può mettere la finestra dell'adunanza Zoom, e la propria finestra principale, dove vuoi tu sui tuoi schermi. L'assistente di configurazione ti chiede dove in due passaggi, che il pulsante **Scegli la disposizione** qui riapre in qualsiasi momento:

1. Su una mappa dei tuoi schermi, disposti come sono, scegli lo schermo per l'adunanza Zoom. Lo schermo occupato dalla finestra multimediale non viene mai proposto. Se lo schermo di Zoom non è quello su cui si trova M³, scegli se Zoom lo ha tutto per sé o lo condivide con M³ (M³ allora si sposta anch'esso lì).
2. Su un disegno di quello schermo con la sua forma reale, trascina il divisore per dividerlo tra M³ e Zoom. Si aggancia alle proporzioni più comuni (metà, un terzo, un quarto e così via); tieni premuto `Alt` per trascinarlo liberamente. Il divisore non rende mai una finestra più piccola della sua dimensione minima: Zoom ha bisogno di più spazio quando il suo elenco dei partecipanti è aperto. Su uno schermo verticale, le due finestre vanno una sopra l'altra.

Appena l'adunanza si apre, M³ apre l'elenco dei partecipanti di Zoom se gliel'hai chiesto, poi mette al loro posto entrambe le finestre. Da quel momento tiene Zoom al suo posto: quando Zoom sposta o ridimensiona la sua finestra da solo, dopo una condivisione dello schermo o quando il suo elenco dei partecipanti si apre o si chiude, M³ lo rimette al suo posto. Se sposti o ridimensioni Zoom tu stesso, M³ lo lascia dove l'hai messo fino alla prossima adunanza. Ogni volta che M³ sposta Zoom di sua iniziativa, una notifica lo segnala, con due pulsanti nel caso desse fastidio: **Lascia stare Zoom** lo ferma finché M³ non viene riavviato, e **Disattiva** disattiva la disposizione delle finestre finché non la riattivi qui. Quando vengono collegati o scollegati degli schermi, M³ dispone di nuovo le finestre; se lo schermo di Zoom non c'è più, Zoom condivide lo schermo di M³ e M³ te lo segnala.

Mentre Zoom condivide la finestra multimediale, nasconde la propria finestra dell'adunanza, elenco dei partecipanti compreso. Con **Mostra l'elenco dei partecipanti durante la condivisione** attivo, M³ apre allora l'elenco dei partecipanti di Zoom in una finestra a parte, al posto di Zoom, così continui a vedere chi alza la mano per commentare. Se lo chiudi, resta chiuso fino alla prossima condivisione; Zoom lo chiude da solo quando la condivisione termina, e la sua finestra dell'adunanza torna al suo posto.

Con l'opzione **Meeting window view** di Zoom impostata su **Dual window** (**Use dual monitors** nelle versioni precedenti di Zoom), Zoom apre una seconda finestra (che mostra lo schermo condiviso o chi parla). M³ la mette a schermo intero sullo schermo della finestra multimediale, dietro la finestra multimediale: nascondi la finestra multimediale per vederla, per esempio per vedere i partecipanti.

Quando **Affiancale con Windows** è attivo, M³ affianca le due finestre con la funzione di affiancamento di Windows stesso, come se le avessi trascinate ai bordi dello schermo, quindi trascinando il bordo tra le due si ridimensionano entrambe. Per farlo, M³ porta ogni finestra in primo piano per un momento.

Il pulsante **Disponi finestre** nel popup di Zoom rimette tutto al suo posto in qualsiasi momento. La disposizione delle finestre viene salvata per ogni computer, perché dipende dai suoi schermi.

**Predefinito**: disattivato

### Integrazione con OBS Studio {#settings-guide-obs-integration}

#### Abilita OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Abilita l'integrazione con OBS Studio per il cambio automatico di scena.

**Predefinito**: `false`

:::warning Nota importante

**Configurazione audio necessaria**: l'integrazione con OBS Studio gestisce solo la condivisione dello schermo. L'audio dei media di M³ **non viene trasmesso automaticamente** ai partecipanti su Zoom quando si usa OBS Studio. Devi configurare le impostazioni dell'Audio originale di Zoom o usare «Condividi audio del computer» per garantire che i partecipanti all'adunanza possano sentire i media. Consulta la [Guida utente](/user-guide#audio-configuration) per istruzioni dettagliate sulla configurazione dell'audio.

**Nota**: l'integrazione con Zoom usa la condivisione dello schermo nativa di Zoom, che gestisce l'audio in modo più fluido rispetto all'integrazione con OBS Studio.

:::

#### Porta OBS {#obs-port}

<!-- **Setting**: `obsPort` -->

Il numero di porta per connettersi al WebSocket di OBS Studio.

**Predefinito**: Nessuna

#### Password OBS {#obs-password}

<!-- **Setting**: `obsPassword` -->

La password per la connessione WebSocket di OBS Studio.

**Predefinito**: Nessuna

#### Scene OBS {#obs-scenes}

Configura quali scene di OBS usare per scopi diversi:

- **Scena videocamera**: scena che mostra la videocamera/il leggìo
- **Scena media**: scena per mostrare i media
- **Scena immagini**: scena per mostrare le immagini (ad esempio una scena PIP che mostra sia i media sia l'oratore)

#### Opzioni avanzate OBS {#obs-advanced-options}

- **Non condividere automaticamente le immagini**: ritarda la condivisione delle immagini su OBS finché non viene avviata manualmente
- **Attivazione rapida**: abilita l'attivazione/disattivazione rapida dell'integrazione con OBS
- **Cambia scena dopo il media**: torna automaticamente alla scena precedente dopo il media
- **Ricorda la scena precedente**: ricorda e ripristina la scena precedente
- **Nascondi le icone**: nascondi le icone relative a OBS nell'interfaccia
- **Controlli di registrazione**: mostra i controlli che avviano e fermano la registrazione di OBS da M³

:::warning Nota importante

**Configurazione audio necessaria**: l'integrazione con OBS Studio gestisce solo il video/il cambio di scena. L'audio dei media di M³ **non viene trasmesso automaticamente** a Zoom o OBS. Il flusso video funziona come una videocamera virtuale senza audio, proprio come una webcam. Devi configurare le impostazioni dell'Audio originale di Zoom o usare «Condividi audio del computer» per garantire che i partecipanti all'adunanza possano sentire i media. Consulta la [Guida utente](/user-guide#audio-configuration) per istruzioni dettagliate sulla configurazione dell'audio.

**Alternativa**: valuta di usare invece l'integrazione con Zoom, poiché usa la condivisione dello schermo nativa di Zoom che gestisce l'audio in modo più fluido.

:::

### Eventi personalizzati {#custom-events}

#### Abilita gli eventi personalizzati {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Abilita scorciatoie personalizzate che verranno attivate quando viene rilevato un evento specifico (ad es. quando un media viene riprodotto, messo in pausa o fermato).

**Predefinito**: `false`

#### Scorciatoie per gli eventi personalizzati {#custom-event-shortcuts}

##### Scorciatoia riproduci media {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Scorciatoia che viene attivata quando un media viene riprodotto.

**Predefinito**: Nessuna

##### Scorciatoia pausa media {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Scorciatoia che viene attivata quando un media viene messo in pausa.

**Predefinito**: Nessuna

##### Scorciatoia ferma media {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Scorciatoia che viene attivata quando un media viene fermato.

**Predefinito**: Nessuna

##### Scorciatoia ultimo cantico {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Scorciatoia che viene attivata quando viene riprodotto l'ultimo cantico durante un'adunanza.

**Predefinito**: Nessuna

### Registrazioni delle adunanze {#meeting-recordings}

#### Abilita l'integrazione con app di registrazione esterne {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Consenti a M³ di controllare un'applicazione di registrazione separata con scorciatoie da tastiera. Questo non registra all'interno di M³; invia le scorciatoie configurate quando premi **Avvia registrazione** o **Ferma registrazione** nel popup delle registrazioni delle adunanze.

Questa opzione è nascosta quando i controlli di registrazione OBS sono abilitati. Se usi OBS Studio, usa invece i controlli di registrazione OBS nell'integrazione con OBS.

**Predefinito**: `false`

#### Scorciatoie e cartella di registrazione {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Configura la scorciatoia da tastiera che avvia la registrazione, la scorciatoia facoltativa che la ferma e la cartella in cui l'app esterna salva le registrazioni. Se non viene fornita una scorciatoia di arresto, M³ riutilizza la scorciatoia di avvio. Quando è configurata una cartella, M³ mostra un pulsante per aprirla.

## Interfaccia e scorciatoie {#interface-shortcuts}

### Scorciatoie da tastiera {#settings-guide-keyboard-shortcuts}

#### Abilita le scorciatoie da tastiera {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Abilita scorciatoie da tastiera personalizzabili per il controllo dei media.

**Predefinito**: `false`

#### Scorciatoie per il controllo dei media {#media-control-shortcuts}

Configura le scorciatoie per la riproduzione dei media:

- **Finestra multimediale**: apri/chiudi la finestra multimediale
- **Media precedente**: vai all'elemento multimediale precedente
- **Media successivo**: vai all'elemento multimediale successivo
- **Pausa/Riprendi**: metti in pausa o riprendi la riproduzione dei media
- **Ferma il media**: ferma la riproduzione dei media
- **Attiva/disattiva musica**: attiva o disattiva la musica di sottofondo

### Pulsante Aggiungi altri media {#add-more-media-button}

#### Sezioni con un pulsante Aggiungi media {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Scegli in quali sezioni dell'adunanza mostrare un pulsante dedicato per aggiungere i tuoi media, oltre al pulsante "Aggiungi media" nella barra degli strumenti in alto, che funziona sempre per tutte le sezioni.

**Predefinito**: Discorso pubblico, Vita cristiana, Visita del sorvegliante di circoscrizione e sezioni personalizzate

#### Pulsante Aggiungi media compatto {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

Mostra solo un'icona per il pulsante "Aggiungi altri media"/"Aggiungi un cantico" nelle intestazioni delle sezioni. Quando è disattivato, il pulsante mostra anche un testo accanto all'icona se c'è abbastanza spazio.

**Predefinito**: `true`

### Maniglia di trascinamento dei media {#media-drag-handle}

#### Mostra la maniglia di trascinamento {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Mostra una piccola maniglia su ogni elemento multimediale per trascinarlo e riordinarlo. Gli elementi multimediali possono sempre essere riordinati trascinandoli da qualsiasi punto; questa opzione determina solo se mostrare l'icona della maniglia.

**Predefinito**: `true`

### Azioni rapide prima/dopo l'adunanza {#before-after-meeting-quick-actions}

#### Mostra le azioni rapide per l'adunanza {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Mostra un pannello prima dell'adunanza e un pannello dopo l'adunanza con comandi utili (musica di sottofondo, registrazione) e una lista di controllo personalizzabile per ciascuno.

**Predefinito**: `true`

Le categorie e le attività delle liste di controllo per i pannelli prima e dopo l'adunanza si gestiscono da questa stessa sezione delle impostazioni: aggiungi, rinomina, riordina o elimina categorie e attività secondo le esigenze della tua congregazione.

## Impostazioni avanzate {#advanced-settings}

### Trasferimento delle impostazioni del profilo {#profile-settings-transfer}

Esporta le impostazioni del profilo corrente in un file JSON o importa un file di impostazioni del profilo esportato in precedenza. L'importazione sostituisce le impostazioni del profilo corrente.

### Zona pericolosa {#danger-zone}

:::warning Attenzione

Queste impostazioni dovrebbero essere modificate solo se ne comprendi le implicazioni.

:::

#### URL di base {#base-url}

<!-- **Setting**: `baseUrl` -->

Dominio di base usato per scaricare pubblicazioni e media.

**Predefinito**: `jw.org`

#### Disabilita l'accelerazione hardware {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Disabilita l'accelerazione hardware dopo aver riavviato M³. Può aiutare a risolvere problemi grafici o arresti anomali su alcuni sistemi, ma per il resto è sconsigliato.

**Predefinito**: `false`

#### Nascondi il promemoria dell'accelerazione hardware {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Nascondi il promemoria per riattivare l'accelerazione hardware dopo che è stata disabilitata manualmente.

**Predefinito**: `false`

#### Disabilita il recupero dei media {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Disabilita completamente i download automatici dei media. Usa questa opzione solo per i profili che verranno usati per eventi speciali o altre configurazioni personalizzate.

**Predefinito**: `false`

## Consigli per una configurazione ottimale {#configuration-tips}

### Per i nuovi utenti {#new-users}

1. Inizia con la configurazione guidata per definire le impostazioni di base
2. Attiva "Abilita riproduzione multimediale" per accedere alle funzionalità di presentazione
3. Configura con precisione il programma delle adunanze
4. Configura l'integrazione con OBS se fai adunanze ibride

### Per gli utenti esperti {#advanced-users}

1. Usa una cartella condivisa per aggiungere media da un servizio di archiviazione cloud, come Dropbox o OneDrive
2. Abilita l'esportazione automatica dei media a scopo di backup
3. Configura le scorciatoie da tastiera per un uso efficiente
4. Configura l'integrazione con Zoom per la condivisione automatica dello schermo

### Ottimizzazione delle prestazioni {#performance-optimization}

1. Memorizza nella cache i video del libro dei cantici per prestazioni migliori
2. Usa una risoluzione massima adeguata alle tue esigenze
3. Configura la cancellazione automatica della cache per gestire lo spazio su disco
4. Valuta l'impostazione della connessione a consumo se hai una banda limitata

### Risoluzione dei problemi {#settings-guide-troubleshooting}

- Se i media non si scaricano, controlla le impostazioni del programma delle adunanze
- Se l'integrazione con OBS non funziona, verifica le impostazioni della porta e della password
- Se le prestazioni sono lente, prova ad abilitare la cache extra o a ridurre la risoluzione
- Se hai problemi con le lingue, controlla le impostazioni della lingua sia dell'interfaccia sia dei media
- Se i partecipanti su Zoom non riescono a sentire l'audio dei media, configura le impostazioni dell'Audio originale di Zoom o usa «Condividi audio del computer»
- **Suggerimento**: valuta di usare l'integrazione con Zoom invece di OBS Studio per una gestione dell'audio più semplice
