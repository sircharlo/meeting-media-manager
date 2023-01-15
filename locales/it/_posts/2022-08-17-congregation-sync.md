---
tag: Configurazione
title: Sincronizzazione della congregazione
ref: congregation-sync
---

Il fratello incaricato come *organizzatore della videoconferenza* (OV) dal corpo degli anziani può usare M³ per rendere disponibili i media alla squadra A/V della sua congregazione.

L'OV, o qualcuno da lui designato, può:

- carica media **aggiuntivi** da condividere durante l'adunanza, come la visita del sorvegliante di circoscrizione o il discorso pubblico
- **nascondi** contenuti multimediali da JW.org che non sono rilevanti per una determinata adunanza, ad esempio, quando una parte è stata sostituita dalla filiale
- aaggiungi o rimuovi media **ricorrenti**, come un video con il testo della scrittura dell'anno o una diapositiva con annuncio

Tutti coloro che sono sincronizzati con la stessa congregazione riceveranno quindi esattamente lo stesso file multimediale quando fanno clic sul pulsante *Aggiorna le cartelle con i media* button.

Tieni presente che la funzione di sincronizzazione della congregazione è attiva e del tutto facoltativa.

### Come funziona

Il meccanismo di sincronizzazione di M³ utilizza WebDAV. Ciò significa che l'OV (o qualcuno sotto la sua supervisione) deve:

- configurare un server WebDAV protetto accessibile dal Web, **o**
- use a third-party cloud storage service that supports the WebDAV protocol (see the *Web address* setting in the *Congregation sync setup* section below).

Tutti gli utenti che desiderano essere sincronizzati insieme dovranno connettersi allo stesso server WebDAV utilizzando le informazioni di connessione e le credenziali fornite loro dal proprio OV.

### Impostazioni sincronizzazione congregazione

| Impostazioni                                       | Spiegazione                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Web address`                                      | Indirizzo Web del server WebDAV. È richiesto HTTP sicuro (HTTPS). <br><br> ***Note:** l'etichetta per questo campo è in realtà un pulsante che, una volta cliccato, mostrerà un elenco di provider WebDAV noti per essere compatibili con M³ e precompilerà automaticamente determinate impostazioni per tali provider. <br><br> Questo elenco è fornito a titolo di cortesia e non rappresenta in alcun modo un'approvazione di un particolare servizio o fornitore. Il server migliore è sempre quello che possiedi...* |
| `Username`                                         | Nome utente per il servizio WebDAV.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `Password`                                         | Password per il servizio WebDAV. <br><br> ***Note:** come dettagliato nelle rispettive pagine di supporto, potrebbe essere necessario creare una password specifica per l'app per [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) e [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) per abilitare le connessioni WebDAV ai loro servizi.*                                                                                                          |
| `Cartella di sincronizzazione della congregazione` | Questa è la cartella che verrà utilizzata per sincronizzare i media per tutti gli utenti sincronizzati della congregazione. Puoi digitare/incollare in un percorso o utilizzare il mouse per navigare fino alla cartella di destinazione. <br><br> ***Note:** assicurati che tutti gli utenti sincronizzati dellacongregazione inseriscano lo stesso percorso della cartella; altrimenti la sincronizzazione non funzionerà come previsto.*                                                                                           |
| `Impostazioni a livello di congregazione`          | Una volta che l'OV ha configurato le sezioni *Impostazioni media* and *Impostazioni adunanza* di [Impostazioni]({{page.lang}}/#configuration) sul proprio computer, può utilizzare questo pulsante per applicare determinate impostazioni per tutti gli utenti sincronizzati della congregazione (ad esempio, giorni dell'adunanza, lingua dei media, impostazioni di conversione e così via). Ciò significa che le impostazioni selezionate verranno applicate forzatamente a tutti gli utenti sincronizzati ogni volta che aprono M³.           |

### Utilizzo della sincronizzazione della congregazione per gestire i contenuti multimediali

Una volta completata la configurazione della sincronizzazione della congregazione, sei pronto per avviare [Gestione media]({{page.lang}}/#manage-media) per la squadra AV della tua congregazione.

### Screenshot della sincronizzazione della congregazione in azione

{% include screenshots/congregation-sync.html lang=site.data.it %}
