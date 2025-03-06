<!-- markdownlint-disable no-inline-html -->

# Utilizzando M³ in una Sala del Regno {#using-m3-at-a-kingdom-hall}

Questa guida ti guiderà nel processo di download, installazione e configurazione di **Meeting Media Manager (M³)** presso una Sala del Regno. Segui i passaggi per garantire una corretta configurazione per la gestione dei media durante le riunioni della congregazione.

## 1. Scarica e installa {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. Scarica la versione corretta per il tuo sistema operativo:
  - **Windows:**
    - Per la maggior parte dei sistemi Windows, scarica <a :href="data.win64">meeting-media-manager-[VERSION]-x64.exe</a>.
    - Per vecchi sistemi Windows a 32 bit, scarica <a :href="data.win32">meeting-media-manager-[VERSION]-ia32.exe</a>.
    - Per la versione portatile, scarica <a :href="data.winPortable">meeting-media-manager-[VERSION]-portable.exe</a>.
  - **macOS:**
    - **M-series (Apple Silicon)**: Scarica <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a>.
    - **Mac basati su Intel**: Scarica <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a>.
  - **Linux:**
    - Scarica <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a>.
2. Se i link per il download non funzionano, visita la [pagina di download M³](https://github.com/sircharlo/meeting-media-manager/releases/latest) e scarica la versione corretta manualmente.
3. Aprire il programma di installazione e seguire le istruzioni sullo schermo per installare M³.
4. Avvia M³.
5. Passa attraverso la procedura guidata di configurazione.

### solo per macOS: Ulteriori step di installazione {#additional-steps-for-macos-users}

:::warning Attenzione

Questa sezione si applica solo agli utenti macOS.

:::

A causa delle misure di sicurezza di Apple, sono necessari alcuni passaggi aggiuntivi per eseguire l'app M³ installata su moderni sistemi macOS.

Eseguire i seguenti due comandi nel Terminale, modificando il percorso di M³ secondo necessità:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Attenzione

Come utente macOS, dovrai seguire questi passaggi ogni volta che installi o aggiorni M³.

:::

:::info Spiegazione

Il primo comando _firma il codice dell'applicazione_. Questo è necessario per evitare che M³ venga rilevato come un'applicazione dannosa da uno sviluppatore sconosciuto.

Il secondo comando _rimuove il flag di quarantena_ dall'applicazione. Il flag di quarantena viene utilizzata per avvertire gli utenti di applicazioni potenzialmente dannose che sono state scaricate da Internet.

:::

#### Metodo alternativo {#alternative-method-for-macos-users}

Se non sei ancora in grado di avviare M³dopo aver inserito i due comandi dalla sezione precedente, prova quanto segue:

1. Apri le impostazioni del sistema macOS **Privacy & Security**.
2. Trova la voce per M³ e fai clic sul pulsante per **Apri comunque**.
3. Sarete quindi avvertiti di nuovo, e dato il consiglio di non "aprire questo a meno che non siete certi che sia da una fonte affidabile." Clicca Su **Apri Comunque**.
4. Apparirà un altro avviso, dove dovrai autenticarti per avviare l'app.
5. M³ dovrebbe ora avviarsi con successo.

Se hai ancora problemi dopo aver seguito tutti questi passaggi, per favore [apri un problema su GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). Faremo del nostro meglio per aiutare.

### solo per macOS: Riattiva la presentazione del sito web dopo gli aggiornamenti {#screen-sharing-issues}

:::warning Attenzione

Questa sezione si applica solo agli utenti macOS.

:::

Alcuni utenti di macOS hanno segnalato che la presentazione del sito web non funziona più dopo l'installazione di aggiornamenti a M³.

Se la finestra multimediale è nera quando si presenta il sito web dopo l'aggiornamento di M³, provare i seguenti passaggi:

1. Apri le impostazioni del sistema macOS **Privacy & Security**.
2. Vai alla **Registrazione schermo**.
3. Selezionare M³ nella lista.
4. Clicca sul pulsante `-` (minus) per rimuoverlo.
5. Fare clic sul pulsante `+` (più) e seleziona M³ dalla cartella Applicazioni.
6. Si può essere invitati a rilanciare M³ per applicare la modifica.

Dopo questi passaggi, la condivisione dello schermo dovrebbe funzionare nuovamente come previsto.

:::tip Suggerimento

Questi passaggi sono opzionali e possono essere saltati se non si prevede di utilizzare la funzione di presentazione del sito web. D'altra parte, se si prevede di utilizzare la funzione di presentazione del sito web, si raccomanda di seguire questi passaggi dopo ogni aggiornamento per garantire che la funzionalità funzioni come previsto.

:::

## 2. Configurazione guidata {#configuration-wizard}

### Lingua di visualizzazione app {#app-display-language}

Quando si esegue M³ per la prima volta, ti verrà chiesto di scegliere la tua **lingua di visualizzazione preferita**. Scegliere la lingua che si desidera utilizzare M³per la sua interfaccia.

:::tip Suggerimento

Questa non deve essere necessariamente la stessa lingua di quella in cui M³ scaricherà i media. La lingua per i download multimediali è configurata in un passo successivo.

:::

### Tipo di profilo {#profile-type}

Il passo successivo è scegliere un **tipo di profilo**. Per una configurazione normale in una Sala del Regno, scegli **Normale**. Questo configurerà molte funzionalità che sono comunemente usate per le adunanze di congregazione.

:::warning Attenzione

Dovresti scegliere **Altro** solo se stai creando un profilo per il quale nessun media dovrebbe essere scaricato automaticamente. I media dovranno essere importati manualmente per essere utilizzati in questo profilo. Questo tipo di profilo è usato per lo più per utilizzare M³ durante scuole teocratiche, assemblee, convenzioni e altri eventi speciali.

Il tipo di profilo **Altro** è raramente utilizzato. **For normal use during congregation meetings, please choose _Regular_.**
:::

:::

### Ricerca congregazione automatica {#automatic-congregation-lookup}

M³può tentare di trovare automaticamente gli orari delle adunanze, la lingua e il nome completo della tua congregazione.

Per farlo, usa il pulsante **Ricerca Congregazione** accanto al campo del nome della congregazione e inserisci almeno parte del nome della congregazione e della città.

Una volta trovata e selezionata la congregazione corretta, M³precompilerà tutte le informazioni disponibili, come il **nome della tua congregazione**, **lingua dell'adunanza**, e **giorni e orari delle adunanze**.

:::info Nota

Questa ricerca utilizza i dati pubblicamente disponibili dal sito ufficiale dei Testimoni di Geova.

:::

### Inserimento manuale di informazioni di congregazione {#manual-entry-of-congregation-information}

Se la ricerca automatica non ha trovato la tua congregazione, puoi naturalmente inserire manualmente le informazioni richieste. La procedura guidata ti permetterà di rivedere e/o inserire il **nome della tua congregazione**, **lingua dell' adunanza**, e **giorni e orari delle adunanze**.

### Memorizzazione dei video dal libro delle canzoni {#caching-videos-from-the-songbook}

Ti verrà data anche la possibilità di **memorizzare nella cache tutti i video dal libro dei cantici**. Questa opzione scarica in anticipo tutti i video del libro dei cantici, riducendo il tempo necessario per recuperare i media per le riunioni in futuro.

- **Pro:** I media per riunioni saranno disponibili molto più velocemente.
- **Contro:** La dimensione della cache multimediale aumenterà significativamente, di circa 5GB.

:::tip Suggerimento

Se la tua Sala del Regno dispone di spazio di archiviazione sufficiente, è consigliabile **abilitare** questa opzione per l'efficienza e le prestazioni percepite.

:::

### Configurazione  Integrazione Obs Studio (Opzionale) {#obs-studio-integration-configuration}

Se la tua Sala del Regno usa **OBS Studio** per trasmettere riunioni ibride su Zoom, M³ può automaticamente integrarsi con quel programma. Durante la configurazione, è possibile configurare l'integrazione con OBS Studio inserendo quanto segue:

- **Porta:** Il numero di porta utilizzato per connettersi al plugin Websocket OBS Studio.
- **Password:** La password utilizzata per connettersi al plugin Websocket di OBS Studio.
- **Scene:** Le scene OBS che verranno utilizzate durante le presentazioni multimediali. Avrai bisogno di una scena che cattura la finestra o lo schermo multimediale, e di una che mostri il palco.

:::tip Suggerimento

::: tip Tip
If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.

:::

## 3. Divertiti usando M³ {#enjoy-using-m3}

Una volta completata la procedura guidata di installazione, M³ è pronta ad aiutare a gestire e presentare i media per le riunioni di congregazione. Divertiti con l'app! :tada:
