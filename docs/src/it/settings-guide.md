# Guida Impostazioni {#settings-guide}

Questa guida completa spiega tutte le impostazioni disponibili in M³, organizzate per categoria. Capire queste impostazioni ti aiuterà a configurare M³ in modo che funzioni perfettamente per le esigenze della tua congregazione.

## Configurazione dell'applicazione {#application-configuration}

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

### Data Commemorazione {#memorial-date}

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

Funziona solo per i profili aggiunti con la ricerca della congregazione e il cui nome della congregazione non è stato modificato manualmente. Se la sincronizzazione è stata disabilitata perché il nome della congregazione è cambiato, usa **Abilita sincronizzazione programma** per ricollegare il profilo.

#### Aggiorna il programma delle adunanze {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Sincronizza manualmente il programma delle adunanze attuale e futuro con le informazioni del sito ufficiale.

## Recupero e riproduzione dei media {#media-retrieval-and-playback}

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

### Musica di Sottofondo {#settings-guide-background-music}

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

### Gestione della cache {#cache-management}

#### Abilita la cache extra {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Abilita la memorizzazione aggiuntiva nella cache per prestazioni migliori.

**Predefinito**: `false`

#### Cartella della cache {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Posizione personalizzata per archiviare i file multimediali nella cache.

**Predefinito**: posizione predefinita del sistema

#### Abilita la cancellazione automatica della cache {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Cancella automaticamente i vecchi file nella cache per risparmiare spazio su disco.

**Predefinito**: `true`

### Monitoraggio Cartelle {#settings-guide-folder-monitoring}

#### Abilita il monitoraggio delle cartelle {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Monitora una cartella per nuovi file multimediali e aggiungili automaticamente a M³.

**Predefinito**: `false`

#### Cartella da monitorare {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Il percorso della cartella da monitorare per i nuovi file multimediali.

**Predefinito**: vuoto

## Integrazioni {#integrations}

### Integrazione di Zoom {#settings-guide-zoom-integration}

#### Abilita Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Abilita le funzioni di integrazione con le riunioni Zoom.

**Predefinito**: `false`

#### Scorciatoia per la condivisione dello schermo {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Scorciatoia da tastiera per attivare la condivisione dello schermo di Zoom.

**Predefinito**: Nessuna

### Integrazione di OBS Studio {#settings-guide-obs-integration}

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

- **Posticipa le immagini**: ritarda la condivisione delle immagini a OBS finché non vengono attivate manualmente
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

### Timer dell'adunanza {#meeting-timer}

#### Abilita il timer dell'adunanza {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Abilita una finestra timer separata per cronometrare le parti dell'adunanza. Questa è una funzione beta e dovrebbe essere abilitata solo se approvata localmente.

**Predefinito**: `false`

#### Comportamento della finestra del timer {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configura se la finestra del timer si apre automaticamente, se i timer dei partecipanti contano in avanti o alla rovescia per impostazione predefinita, se l'orologio usa il formato a 12 o 24 ore, e se il valore corrente del timer è mostrato sul pulsante del timer nell'isola delle azioni.

#### Formati di visualizzazione del timer {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Scegli formati di visualizzazione analogici o digitali per l'ora del giorno e i timer del conto alla rovescia. L'indicatore di avviso del conto alla rovescia può spostare l'anello analogico del conto alla rovescia verso un colore di avviso durante l'ultimo minuto.

#### Conto alla rovescia dell'adunanza e stato del programma {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Mostra un conto alla rovescia prima delle adunanze programmate e, se vuoi, indica se l'adunanza è in anticipo o in ritardo sul programma. Il conto alla rovescia dell'adunanza appare solo sul display del timer, non sulla visualizzazione principale dei media.

#### Aspetto del timer e tempo superato {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Personalizza la dimensione e i colori del testo del timer e configura gli indicatori di tempo superato, come colori alternati, lampeggiamento e la visualizzazione del solo tempo superato trascorso in modalità conteggio in avanti.

## Impostazioni avanzate {#advanced-settings}

### Scorciatoie da Tastiera {#settings-guide-keyboard-shortcuts}

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

### Visualizzazione dei media {#media-display}

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

### Esportazione Media {#settings-guide-media-export}

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

Disabilita l'accelerazione hardware dopo aver riavviato M³. Può aiutare con problemi grafici o arresti anomali su alcuni sistemi, ma non è altrimenti consigliato.

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

1. Inizia con la configurazione guidata per impostare le impostazioni di base
2. Abilita «Pulsante di visualizzazione dei media» per accedere alle funzioni di presentazione
3. Configura con precisione il programma delle adunanze
4. Configura l'integrazione con OBS se fai adunanze ibride

### Per gli utenti esperti {#advanced-users}

1. Usa il monitoraggio delle cartelle per sincronizzare i media da un archivio cloud
2. Abilita l'esportazione automatica dei media a scopo di backup
3. Configura le scorciatoie da tastiera per un uso efficiente
4. Configura l'integrazione con Zoom per la condivisione automatica dello schermo

### Ottimizzazione delle prestazioni {#performance-optimization}

1. Abilita la cache extra per prestazioni migliori
2. Usa una risoluzione massima adeguata alle tue esigenze
3. Configura la cancellazione automatica della cache per gestire lo spazio su disco
4. Valuta l'impostazione della connessione a consumo se hai una banda limitata

### Risoluzione Problemi {#settings-guide-troubleshooting}

- Se i media non si scaricano, controlla le impostazioni del programma delle adunanze
- Se l'integrazione con OBS non funziona, verifica le impostazioni della porta e della password
- Se le prestazioni sono lente, prova ad abilitare la cache extra o a ridurre la risoluzione
- Se hai problemi con le lingue, controlla le impostazioni della lingua sia dell'interfaccia sia dei media
- Se i partecipanti su Zoom non riescono a sentire l'audio dei media, configura le impostazioni dell'Audio originale di Zoom o usa «Condividi audio del computer»
- **Suggerimento**: valuta di usare l'integrazione con Zoom invece di OBS Studio per una gestione dell'audio più semplice
