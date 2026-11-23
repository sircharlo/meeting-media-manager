# Informativa sulla privacy {#privacy-policy}

Data di entrata in vigore: 22 novembre 2026

Meeting Media Manager (M³) è un'app gratuita e open source realizzata da volontari. Questa informativa spiega quali dati gestisce M³ e dove finiscono. It applies to every version of M³: the installers and portable version from this website, and the versions in the Microsoft Store and the Snap Store.

**In breve:** M³ non ha account, né pubblicità, né tracker pubblicitari o di marketing. Le tue impostazioni e i tuoi media restano sul tuo computer. Per individuare e risolvere i problemi, M³ invia ai suoi sviluppatori dati diagnostici: segnalazioni di errore e informazioni su ogni sessione e sulla velocità con cui funziona M³. M³ ne esclude ciò che potrebbe identificare te o la tua congregazione, e il tuo indirizzo IP non viene conservato.

## Cosa resta sul tuo computer {#on-your-computer}

M³ conserva quanto segue nella sua cartella dei dati sul tuo computer:

- le impostazioni di ogni congregazione o gruppo, come il nome, gli orari delle adunanze, la lingua e le integrazioni;
- i media e le pubblicazioni che scarica, e i media che aggiungi tu;
- la password di OBS Studio, se lo usi. M³ la cifra con l'archivio delle password del tuo sistema operativo, quando è disponibile; quando non lo è, M³ la memorizza come testo semplice e te lo segnala;
- le impostazioni dell'integrazione con Zoom, se la usi.

Le segnalazioni di errore includono alcune di queste impostazioni (vedi sotto), ma mai quelle che potrebbero identificare te o la tua congregazione.

Se mostri il flusso di una videocamera nella finestra multimediale (un'opzione per le congregazioni di lingua dei segni), viene solo visualizzato: M³ non lo registra, non lo salva e non lo invia. L'anteprima della finestra multimediale che M³ ti mostra viene acquisita sul tuo computer e anch'essa non viene né salvata né inviata.

Puoi eliminare tutto questo in qualsiasi momento eliminando la cartella dei dati di M³. Su Windows, anche disinstallare M³ la elimina. The Snap Store version keeps it when you uninstall it, unless you ask it not to (`snap remove --purge`).

## Dati diagnostici {#error-reports}

M³ invia dati diagnostici a [Sentry](https://sentry.io), il servizio che i suoi sviluppatori usano per individuare e correggere i bug.

**Segnalazioni di errore**, quando qualcosa va storto in M³. Una segnalazione può contenere:

- l'errore e il punto del codice di M³ in cui si è verificato;
- la versione di M³, il tuo sistema operativo e la sua versione, la tua lingua e il tuo fuso orario, e informazioni di base sul tuo hardware, come la scheda grafica;
- i passaggi che hanno portato all'errore, come le pagine aperte in M³ e i file che stava scaricando;
- lo stato di M³ in quel momento: le sue impostazioni e ciò che stava facendo, come i media in riproduzione o l'adunanza che stava preparando;
- quando una parte di M³ si arresta in modo anomalo, un rapporto sull'arresto anomalo di quella parte, che può includere una porzione della sua memoria al momento dell'arresto.

**Informazioni sulla sessione**, ogni volta che M³ viene eseguito: quando è stato avviato e se si è chiuso normalmente o si è arrestato in modo anomalo, con la versione di M³ e il tuo sistema operativo.

**Informazioni sulle prestazioni**, in ogni sessione: quanto tempo impiegano ad aprirsi le pagine di M³ e quanto tempo impiegano le sue richieste ai server elencati sotto, con i loro indirizzi.

### Cosa esclude M³ {#left-out}

Prima di inviare i suoi dati diagnostici, M³ rimuove ciò che potrebbe identificare te o la tua congregazione:

- il nome della congregazione, l'ID della sua adunanza Zoom e i nomi dei partecipanti Zoom;
- il PIN delle impostazioni e la password di OBS Studio;
- i nomi delle cartelle e dei file sul tuo computer: restano solo l'unità o la cartella di primo livello di una cartella, e il tipo di un file;
- l'indirizzo nell'impostazione «Indirizzo web», quando non è quello predefinito;
- il tuo nome utente, nei percorsi delle cartelle presenti nelle sue segnalazioni.

I dati non contengono alcun nome, indirizzo email o account, perché M³ non ne ha. M³ chiede a Sentry di non registrare il tuo indirizzo IP, e Sentry è impostato per non conservarlo.

Gli sviluppatori di M³ usano questi dati solo per individuare e risolvere i problemi. Sentry li conserva negli Stati Uniti e li elimina dopo un periodo di tempo limitato. L'[informativa sulla privacy di Sentry](https://sentry.io/privacy/) spiega come li gestisce.

## Server a cui si connette M³ {#connections}

Per svolgere il suo lavoro, M³ si connette ai server elencati sotto. Come per qualsiasi sito web che visiti, questi server possono vedere l'indirizzo IP del tuo computer.

- **Il sito ufficiale dei Testimoni di Geova** e i suoi server di download, per scaricare i media per le adunanze e le pubblicazioni, e le relative informazioni. A ciò che quel sito riceve si applica la sua informativa sulla privacy.
- **GitHub**, dove M³ è pubblicato, per cercare e scaricare gli aggiornamenti di M³ e per mostrarne le novità. The Microsoft Store and Snap Store versions get their updates from their store instead.
- **jsDelivr**, per scaricare i font necessari ad alcune lingue e il componente che M³ usa per leggere i file PDF.
- **Apple, Cloudflare, icanhazip.com e ipify.org**, per verificare se il tuo computer è connesso a internet.
- **Sentry**, per inviare i dati diagnostici descritti sopra.

Se li usi, M³ funziona anche con i seguenti, sul tuo computer o sulla tua rete locale:

- **Zoom:** M³ controlla l'app Zoom sul tuo computer. M³ stesso non invia nulla ai server di Zoom.
- **OBS Studio:** M³ si connette a OBS Studio sul tuo computer o sulla tua rete locale.
- **Il timer remoto:** M³ esegue un piccolo server web sulla tua rete locale, così un altro dispositivo può mostrare il timer dell'adunanza.

Quando visualizzi il sito ufficiale dei Testimoni di Geova nella finestra del sito di M³, funziona come in un browser web.

## Store {#stores}

If you install M³ from the Microsoft Store or the Snap Store, that store handles its installation and updates, under its own privacy policy. M³ in sé funziona allo stesso modo in ogni versione.

## Modifiche a questa informativa {#changes}

Se M³ inizierà a gestire i dati in modo diverso, questa pagina verrà aggiornata, con una nuova data in alto. La sua cronologia è disponibile su [GitHub](https://github.com/sircharlo/meeting-media-manager/commits/master/docs/src/en/privacy.md).

## Domande {#questions}

Se hai una domanda su questa informativa o sui tuoi dati, [apri una segnalazione su GitHub](https://github.com/sircharlo/meeting-media-manager/issues).
