# Guide des paramètres {#settings-guide}

Ce guide complet explique tous les paramètres disponibles dans M³, organisés par catégorie. Comprendre ces paramètres vous aidera à configurer M³ pour qu'il fonctionne parfaitement selon les besoins de votre assemblée locale.

## Configuration de l'application {#application-configuration}

### Langue d'affichage {#display-language}

<!-- **Setting**: `localAppLang` -->

Choisissez la langue pour l'interface de M³. Ceci est indépendant de la langue utilisée pour les téléchargements de médias.

**Options** : Toutes les langues d'interface disponibles (Anglais, Espagnol, Français, etc.)

**Par défaut** : Anglais

### Mode sombre {#dark-mode}

<!-- **Setting**: `darkMode` -->

Contrôlez le thème d'apparence de M³.

**Options** :

- Basculer automatiquement selon la préférence du système
- Toujours utiliser le mode sombre
- Toujours utiliser le mode clair

**Par défaut** : Auto

### Premier jour de la semaine {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Définissez quel jour doit être considéré comme le premier jour de la semaine dans la vue calendrier.

**Options** : Dimanche à samedi

**Par défaut** : Dimanche

### Format de date {#date-format}

<!-- **Setting**: `localDateFormat` -->

Format utilisé pour afficher les dates dans l'application.

**Exemple** : D MMMM AAAA

**Par défaut** : D MMMM AAAA

### Démarrage automatique à la connexion {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Démarrer automatiquement M³ lorsque l'ordinateur démarre.

**Par défaut** : `faux`

## Réunions de l'assemblée locale {#congregation-meetings}

### Nom de l'assemblée locale {#congregation-name}

<!-- **Setting**: `congregationName` -->

Le nom de votre assemblée locale. Ceci est utilisé à des fins d'organisation et d'affichage.

**Par défaut** : Vide (doit être défini lors de la configuration)

### Langue des réunions {#meeting-language}

<!-- **Setting**: `lang` -->

La langue principale pour les téléchargements de médias. Ceci doit correspondre à la langue utilisée dans les réunions de votre assemblée locale.

**Options** : Toutes les langues disponibles sur le site officiel des Témoins de Jéhovah

**Par défaut** : Anglais (E)

### Langue secondaire {#fallback-language}

<!-- **Setting**: `langFallback` -->

Une langue secondaire à utiliser lorsque les médias ne sont pas disponibles dans la langue principale.

**Options** : Toutes les langues disponibles sur le site officiel des Témoins de Jéhovah

**Par défaut** : Aucune

### Jour de réunion de semaine {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

Le jour de la semaine où votre réunion de semaine a lieu.

**Options** : Dimanche à samedi

**Par défaut** : Aucun (doit être défini lors de la configuration)

### Heure de réunion de semaine {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

L'heure de début de votre réunion de semaine.

**Format** : HH:MM (format 24 heures)

**Par défaut** : Aucun (doit être défini lors de la configuration)

### Jour de réunion de fin de semaine {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

Le jour de la semaine où votre réunion de fin de semaine a lieu.

**Options** : Dimanche à samedi

**Par défaut** : Aucun (doit être défini lors de la configuration)

### Heure de réunion de fin de semaine {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

L'heure de début de votre réunion de fin de semaine.

**Format** : HH:MM (format 24 heures)

**Par défaut** : Aucun (doit être défini lors de la configuration)

### Semaine du responsable de circonscription {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

La semaine de la prochaine visite du responsable de circonscription.

**Format** : MM/JJ/AAAA

**Par défaut** : Aucune

### Date du Mémorial {#memorial-date}

<!-- **Setting**: `memorialDate` -->

La date de la prochaine célébration du Mémorial.

**Format** : MM/JJ/AAAA

**Par défaut** : Récupéré automatiquement périodiquement

### Changements d'horaire des réunions {#meeting-schedule-changes}

Ces paramètres vous permettent de configurer des changements temporaires à votre horaire de réunions :

- **Date de changement** : Quand le changement prend effet
- **Changement ponctuel** : Si c'est un changement permanent ou temporaire
- **Nouveau jour de semaine** : Nouveau jour pour la réunion de semaine
- **Nouvelle heure de semaine** : Nouvelle heure pour la réunion de semaine
- **Nouveau jour de fin de semaine** : Nouveau jour pour la réunion de fin de semaine
- **Nouvelle heure de fin de semaine** : Nouvelle heure pour la réunion de fin de semaine

### Mises à jour automatiques du calendrier des réunions {#mises à jour automatiques du calendrier des réunions}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

Lorsque cette option est activée, M3 vérifie périodiquement le site Web officiel des témoins de Jéhovah pour qu'il change la journée et l'heure de la réunion et mette à jour automatiquement le profil actuel.

Cela ne fonctionne que pour les profils qui ont été ajoutés avec la recherche de congrégation et dont le nom de la congrégation n'a pas été modifié manuellement. Si la synchronisation a été désactivée parce que le nom de la congrégation a changé, utilisez **Activer la synchronisation du programme** pour lier à nouveau le profil.

#### Rafraîchir l'horaire de la réunion {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Synchroniser manuellement le calendrier actuel et futur des réunions avec les informations du site Web officiel.

## Récupération et lecture des médias {#media-retrieval-and-playback}

### Connexion limitée {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Activez ceci si vous êtes sur une connexion de données limitée pour réduire l'utilisation de la bande passante.

**Par défaut** : `faux`

### Affichage des médias {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Activez la fonctionnalité d'affichage des médias. Ceci est requis pour présenter les médias sur un deuxième écran.

**Par défaut** : `faux`

#### Activer l'aperçu des médias {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Afficher un aperçu en direct de la fenêtre des médias pendant l'affichage d'une image ou d'une vidéo.

**Par défaut** : `vrai`

#### Démarrer la lecture en pause {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Les vidéos démarrent en mode pause au moment où leur lecture commence.

**Par défaut** : `faux`

### Musique de fond {#settings-guide-background-music}

#### Activer la musique {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Activez la fonctionnalité de musique de fond.

**Par défaut** : `vrai`

#### Démarrage automatique de la musique {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Démarrer automatiquement la musique de fond lorsque M³ se lance si approprié.

**Par défaut** : `vrai`

#### Tampon d'arrêt de réunion {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Combien de secondes avant l'heure de début de réunion pour arrêter la musique de fond.

**Plage** : 0-300 secondes

**Par défaut** : 60 secondes

#### Volume de la musique {#music-volume}

<!-- **Setting**: `musicVolume` -->

Niveau de volume pour la musique de fond (1-100%).

**Par défaut** : 100%

### Gestion du cache {#cache-management}

#### Activer le cache supplémentaire {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Activez la mise en cache supplémentaire pour de meilleures performances.

**Par défaut** : `faux`

#### Dossier de cache {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Emplacement personnalisé pour stocker les fichiers multimédias mis en cache.

**Par défaut** : Emplacement par défaut du système

#### Activer l'effacement automatique du cache {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Effacez automatiquement les anciens fichiers mis en cache pour économiser l'espace disque.

**Par défaut** : `vrai`

### Surveillance de dossiers {#settings-guide-folder-monitoring}

#### Activer le surveillant de dossier {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Surveillez un dossier pour les nouveaux fichiers multimédias et ajoutez-les automatiquement à M³.

**Par défaut** : `faux`

#### Dossier à surveiller {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Le chemin du dossier à surveiller pour les nouveaux fichiers multimédias.

**Par défaut** : Vide

## Intégrations {#integrations}

### Intégration Zoom {#settings-guide-zoom-integration}

#### Activer Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Activez les fonctionnalités d'intégration des réunions Zoom.

**Par défaut** : `faux`

#### Raccourci de partage d'écran {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Raccourci clavier pour déclencher le partage d'écran Zoom.

**Par défaut** : Aucune

### Intégration OBS Studio {#settings-guide-obs-integration}

#### Activer OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Activez l'intégration OBS Studio pour le changement automatique de scène.

**Par défaut** : `faux`

:::warning Note importante

**Configuration audio requise** : L'intégration OBS Studio ne gère que le changement de vidéo/scène. L'audio des médias M³ **n'est pas automatiquement transmis** à Zoom ou OBS. Vous devez configurer les paramètres Audio original de Zoom ou utiliser « Partager le son de l'ordinateur » pour vous assurer que les participants à la réunion peuvent entendre les médias. Voir le [Guide de l'utilisateur](/user-guide#audio-configuration) pour les instructions détaillées de configuration audio.

**Alternative** : Envisagez d'utiliser l'intégration Zoom à la place, car elle utilise le partage d'écran natif de Zoom qui gère l'audio plus facilement.

:::

#### Port OBS {#obs-port}

<!-- **Setting**: `obsPort` -->

Le numéro de port pour se connecter au WebSocket OBS Studio.

**Par défaut** : Aucune

#### Mot de passe OBS {#obs-password}

<!-- **Setting**: `obsPassword` -->

Le mot de passe pour la connexion WebSocket OBS Studio.

**Par défaut** : Aucune

#### Scènes OBS {#obs-scenes}

Configurez quelles scènes OBS utiliser pour différents usages :

- **Scène caméra** : Scène montrant la caméra/l'estrade
- **Scène média** : Scène pour afficher les médias
- **Scène image** : Scène pour afficher les images (par exemple, une scène PiP montrant à la fois les médias et l'orateur)

#### Options avancées OBS {#obs-advanced-options}

- **Différer les images** : Retarder le partage d'images vers OBS jusqu'à ce qu'elles soient déclenchées manuellement
- **Basculement rapide** : Activer le basculement rapide on/off pour l'intégration OBS
- **Changer de scène après les médias** : Retourner automatiquement à la scène précédente après les médias
- **Se souvenir de la scène précédente** : Se souvenir et restaurer la scène précédente
- **Masquer les icônes** : Masquer les icônes liées à OBS dans l'interface
- **Contrôles d'enregistrement** : Afficher les contrôles qui démarrent et arrêtent l'enregistrement d'OBS depuis M3

:::warning Note importante

**Configuration audio requise** : L'intégration OBS Studio ne gère que le changement de vidéo/scène. L'audio des médias M³ **n'est pas automatiquement transmis** à Zoom ou OBS. Le flux vidéo fonctionne comme une caméra virtuelle sans son, tout comme une webcam. Vous devez configurer les paramètres Audio original de Zoom ou utiliser « Partager le son de l'ordinateur » pour vous assurer que les participants à la réunion peuvent entendre les médias. Voir le [Guide de l'utilisateur](/user-guide#audio-configuration) pour les instructions détaillées de configuration audio.

**Alternative** : Envisagez d'utiliser l'intégration Zoom à la place, car elle utilise le partage d'écran natif de Zoom qui gère l'audio plus facilement.

:::

### Événements personnalisés {#custom-events}

#### Activer les événements personnalisés {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Activer les raccourcis personnalisés qui seront déclenchés lorsqu'un événement spécifique est détecté (par exemple, les médias sont lus, mis en pause ou arrêtés).

**Par défaut** : `faux`

#### Raccourcis d'événements personnalisés {#custom-event-shortcuts}

##### Raccourci de l'évènement de lecture de média {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Raccourci qui est déclenché lorsque le média est lu.

**Par défaut** : Aucune

##### Raccourci de l'événement de mise en pause {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Raccourci déclenché lorsque le média est mis en pause.

**Par défaut** : Aucune

##### Raccourci de l'évènement de média arrêté {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Raccourci qui est déclenché lorsque le média est arrêté.

**Par défaut** : Aucune

##### Raccourci de l'événement de cantique final d'une réunion {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Raccourci qui est déclenché lorsque la lecture du dernier cantique se termine pendant une réunion.

**Par défaut** : Aucune

### Enregistrement des réunions {#meeting-recordings}

#### Activer l'intégration d'application d'enregistrement externe {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Permettre à M³ de contrôler une application d'enregistrement séparée à l'aide de raccourcis clavier. Ceci n'enregistre pas à l'intérieur de M3; il envoie les raccourcis configurés lorsque vous appuyez sur **Démarrer l'enregistrement** ou **Arrêter l'enregistrement** dans la fenêtre pop-up des enregistrements de la réunion.

Cette option est masquée lorsque les contrôles d'enregistrement d'OBS sont activés. Si vous utilisez OBS Studio, utilisez plutôt les contrôles d'enregistrement d'OBS dans l'intégration d'OBS.

**Par défaut** : `faux`

#### Raccourcis d'enregistrement et dossier {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Configurer le raccourci clavier qui démarre l'enregistrement, le raccourci optionnel qui arrête l'enregistrement, et le dossier où l'application externe enregistre les enregistrements. Si aucun raccourci d'arrêt n'est fourni, M3 réutilise le raccourci de démarrage. Lorsqu'un dossier est configuré, M³ affichera un bouton pour l'ouvrir.

### Horaire de la réunion {#temps-de-réunion}

#### Activer le minuteur de réunion {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Activer une fenêtre de minuterie séparée pour chronométrer les parties d'une réunion. Il s'agit d'une fonctionnalité bêta qui ne devrait être activée que si elle est approuvée localement.

**Par défaut** : `faux`

#### Comportement de la fenêtre de minuterie {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configurer si la fenêtre de minuterie s'ouvre automatiquement, si le minuteur compte en montant ou bien à rebours, si l'horloge utilise 12 heures ou 24 heures, et si la valeur actuelle du minuteur devrait être affichée sur le bouton de minuterie dans l'île d'action.

#### Formats d'affichage du minuteur {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Choisissez des formats d’affichage analogique ou numérique pour l’heure et les minuteurs à rebours. L'indicateur d'alerte du compte à rebours peut faire passer l'anneau de compte à rebours analogique à une couleur d'alerte pendant la dernière minute.

#### Compte à rebours des réunions et statut de la planification {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Afficher un compte à rebours avant les réunions planifiées et éventuellement afficher si la réunion est en avance ou en arrière. Le minuteur de la réunion apparaît uniquement sur l'affichage du minuteur, et non sur la fenêtre d'affichage des médias.

#### Apparence du minuteur et du surtemps {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Personnalisez la taille et les couleurs du texte du chronomètre, et configurez les indicateurs de surtemps tels que les couleurs alternées, le clignotement et la possibilité d'afficher le surtemps écoulé uniquement en mode de comptage ascendant.

## Paramètres avancés {#advanced-settings}

### Raccourcis clavier {#settings-guide-keyboard-shortcuts}

#### Activer les raccourcis clavier {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Activez les raccourcis clavier personnalisables pour le contrôle des médias.

**Par défaut** : `faux`

#### Raccourcis de contrôle des médias {#media-control-shortcuts}

Configurez les raccourcis pour la lecture des médias :

- **Fenêtre multimédia** : Ouvrir/fermer la fenêtre multimédia
- **Média précédent** : Aller à l'élément multimédia précédent
- **Média suivant** : Aller à l'élément multimédia suivant
- **Pause/Reprendre** : Mettre en pause ou reprendre la lecture des médias
- **Arrêter les médias** : Arrêter la lecture des médias
- **Basculement de la musique** : Basculer la musique de fond

### Affichage des médias {#media-display}

#### Activer la transition en fondu lors du masquage ou de l'affichage de la fenêtre des médias {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Lorsque activé, la fenêtre des médias se cachera et apparaîtra en douceur au lieu de ce faire instantanément. Cela offre une expérience visuelle plus raffinée.

**Par défaut** : `vrai`

#### Activer le contrôle de vitesse de lecture {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Permettre de régler la vitesse de lecture audio et vidéo à partir du menu contextuel de l'élément média.

**Par défaut** : `faux`

#### Masquer le logo des médias {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Masquer le logo dans la fenêtre multimédia.

**Par défaut** : `faux`

#### Résolution maximale {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Résolution maximale pour les fichiers multimédias téléchargés.

**Options** : 240p, 360p, 480p, 720p, 1080p

**Par défaut** : 720p

#### Inclure les médias imprimés {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Inclure les médias des publications imprimées dans les téléchargements de médias.

**Par défaut** : `vrai`

#### Exclure les notes de bas de page {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Exclure les images de notes de bas de page des téléchargements de médias quand c'est possible.

**Par défaut** : `faux`

#### Exclure les vidéos supplémentaires de La Tour de Garde {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Exclure les vidéos supplémentaires mentionnées dans les paragraphes de l'étude de La Tour de Garde.

**Par défaut** : `faux`

#### Exclure les médias de la brochure Enseignement {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclure les médias de la brochure Enseignement (th) des téléchargements de médias.

**Par défaut** : `vrai`

### Sous-titres {#subtitles}

#### Activer les sous-titres {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Activez le support des sous-titres pour la lecture des médias.

**Par défaut** : `faux`

#### Langue des sous-titres {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Langue pour les sous-titres (peut être différente de la langue des médias).

**Options** : Toutes les langues disponibles sur le site officiel des Témoins de Jéhovah

**Par défaut** : Aucune

### Exportation des médias {#settings-guide-media-export}

#### Activer l'exportation automatique des médias {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Exporter automatiquement les fichiers multimédias vers un dossier spécifié.

**Par défaut** : `faux`

#### Dossier d'exportation des médias {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Chemin du dossier où les fichiers multimédias seront exportés automatiquement.

**Par défaut** : Vide

#### Convertir les fichiers en MP4 {#convert-files-to-mp4}

**Paramètre**: `convertFilesToMp4`

Convertir les fichiers multimédias exportés au format MP4 pour une meilleure compatibilité.

**Par défaut** : `faux`

### Transfert des paramètres du profil {#profile-settings-transfer}

Exporter les paramètres du profil actuel vers un fichier JSON, ou importer un fichier de paramètres de profil précédemment exporté. L'importation remplace les paramètres du profil actuel.

### Zone de danger {#danger-zone}

:::warning Avertissement

Ces paramètres ne doivent être modifiés que si vous comprenez leurs implications.

:::

#### Adresse du site Web {#base-url}

<!-- **Setting**: `baseUrl` -->

Entrez l'adresse utilisée pour accéder au site officiel des Témoins de Jéhovah.

**Par défaut** : `jw.org`

#### Désactiver l'accélération matérielle {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Désactiver l'accélération matérielle au redémarrage de M³. Cela peut aider avec des bugs graphiques ou des plantages sur certains systèmes, mais n'est pas recommandé autrement.

**Par défaut** : `faux`

#### Masquer le rappel concernant l'accélération matérielle {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Masquer le rappel invitant à réactiver l'accélération matérielle après sa désactivation manuelle.

**Par défaut** : `faux`

#### Désactiver le téléchargement des médias {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Désactiver complètement le téléchargement automatique des médias. Utilisez ceci uniquement pour les profils qui seront utilisés pour des événements spéciaux ou des configurations personnalisées.

**Par défaut** : `faux`

## Conseils pour une configuration optimale {#configuration-tips}

### Pour les nouveaux utilisateurs {#new-users}

1. Démarrez avec l'assistant d'installation pour configurer les paramètres de base
2. Activer "Bouton d'affichage des médias" pour accéder aux fonctionnalités de présentation
3. Configurez votre horaire de réunion avec précision
4. Configurez l'intégration OBS si vous utilisez des réunions hybrides

### Pour les utilisateurs avancés {#advanced-users}

1. Utilisez le monitoring des dossiers pour synchroniser les médias depuis le stockage cloud
2. Activer l'exportation automatique des médias à des fins de sauvegarde
3. Configurez les raccourcis clavier pour une opération efficace
4. Configurez l'intégration Zoom pour le partage d'écran automatique

### Optimisation des performances {#performance-optimization}

1. Activer le cache supplémentaire pour de meilleures performances
2. Utilisez la résolution maximale appropriée pour vos besoins
3. Configurer l'effacement automatique du cache pour gérer l'espace disque
4. Considérez le paramètre de connexion limitée si sur une bande passante limitée

### Résolution des problèmes {#settings-guide-troubleshooting}

- Si les médias ne téléchargent pas, vérifiez les paramètres de votre horaire de réunion
- Si l'intégration OBS ne fonctionne pas, vérifiez les paramètres du port et du mot de passe
- Si les performances sont lentes, essayez d'activer le cache supplémentaire ou de réduire la résolution
- Si vous rencontrez des problèmes de langue, vérifiez les paramètres de l'interface et de la langue des médias
- Si les participants Zoom ne peuvent pas entendre le son des médias, configurez les paramètres Audio original de Zoom ou utilisez "Partager le son de l'ordinateur"
- **Conseil** : Considérez d'utiliser l'intégration Zoom à la place de OBS Studio pour une gestion audio plus simple.
