# Guide des paramètres {#settings-guide}

Ce guide complet explique tous les paramètres disponibles dans M³, organisés par catégorie. Comprendre ces paramètres vous aidera à configurer M³ pour qu'il fonctionne parfaitement selon les besoins de votre assemblée locale.

## Général {#application-configuration}

### Langue d'affichage {#display-language}

<!-- **Setting**: `localAppLang` -->

Choisissez la langue pour l'interface de M³. Ceci est indépendant de la langue utilisée pour les téléchargements de médias.

**Options** : Toutes les langues d'interface disponibles (anglais, espagnol, français, etc.)

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

**Exemple** : D MMMM YYYY

**Par défaut** : D MMMM YYYY

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

**Par défaut** : Aucune valeur (doit être définie lors de la configuration)

### Heure de réunion de semaine {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

L'heure de début de votre réunion de semaine.

**Format** : HH:MM (format 24 heures)

**Par défaut** : Aucune valeur (doit être définie lors de la configuration)

### Jour de réunion de fin de semaine {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

Le jour de la semaine où votre réunion de fin de semaine a lieu.

**Options** : Dimanche à samedi

**Par défaut** : Aucune valeur (doit être définie lors de la configuration)

### Heure de réunion de fin de semaine {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

L'heure de début de votre réunion de fin de semaine.

**Format** : HH:MM (format 24 heures)

**Par défaut** : Aucune valeur (doit être définie lors de la configuration)

### Semaine du responsable de circonscription {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

La semaine de la prochaine visite du responsable de circonscription.

**Format** : MM/JJ/AAAA

**Par défaut** : Aucune

### Date du Mémorial {#memorial-date}

<!-- **Setting**: `memorialDate` -->

La date de la prochaine célébration du Mémorial.

**Format** : MM/JJ/AAAA

**Par défaut** : Récupérée automatiquement à intervalles réguliers

### Changements d'horaire des réunions {#meeting-schedule-changes}

Ces paramètres vous permettent de configurer des changements temporaires à votre horaire de réunions :

- **Date de changement** : Quand le changement prend effet
- **Changement ponctuel** : Si c'est un changement permanent ou temporaire
- **Nouveau jour de réunion de semaine** : Nouveau jour pour la réunion de semaine
- **Nouvelle heure de début pour la réunion de semaine** : Nouvelle heure pour la réunion de semaine
- **Nouveau jour de réunion de fin de semaine** : Nouveau jour pour la réunion de fin de semaine
- **Nouvelle heure de début pour la réunion de fin de semaine** : Nouvelle heure pour la réunion de fin de semaine

### Mises à jour automatiques de l'horaire des réunions {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

Lorsque cette fonction est activée, M³ consulte régulièrement le site officiel des Témoins de Jéhovah pour vérifier s'il y a eu des changements concernant les jours et les horaires des réunions, et met automatiquement à jour le profil actuel.

Cela ne fonctionne que pour les profils qui ont été ajoutés via la recherche d'assemblées locales et dont le nom de l'assemblée locale n'a pas été modifié manuellement. Si la synchronisation a été désactivée en raison d'un changement de nom de l'assemblée locale, utilisez l'option **Activer la synchronisation des horaires** pour reconnecter le profil.

#### Activer la synchronisation des horaires {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Réassocie le profil actuel à la recherche d'assemblée locale afin que les mises à jour automatiques des jours et heures de réunion puissent reprendre. Cette option n'apparaît qu'une fois que le nom de l'assemblée a été modifié manuellement, car c'est précisément cette modification qui provoque la rupture du lien.

#### Actualiser l'horaire des réunions {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Synchronisez manuellement l'horaire actuel des réunions et celui à venir avec les informations disponibles sur le site officiel.

## Médias et lecture {#media-retrieval-and-playback}

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

Afficher un aperçu en direct de la fenêtre multimédia pendant l'affichage d'une image ou d'une vidéo.

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

Démarrer automatiquement la musique de fond lorsque M³ se lance, le cas échéant.

**Par défaut** : `vrai`

#### Marge d'arrêt avant la réunion {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Combien de secondes avant l'heure de début de réunion pour arrêter la musique de fond.

**Plage** : 0-300 secondes

**Par défaut** : 60 secondes

#### Volume de la musique {#music-volume}

<!-- **Setting**: `musicVolume` -->

Niveau de volume pour la musique de fond (1-100%).

**Par défaut** : 100%

### Options de lecture et de téléchargement {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### Activer la transition en fondu lors du masquage ou de l'affichage de la fenêtre multimédia {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Activer les transitions en fondu lors de l'affichage ou du masquage de la fenêtre multimédia.

**Par défaut** : `vrai`

#### Activer le contrôle de vitesse de lecture {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Permettre de régler la vitesse de lecture audio et vidéo à partir du menu contextuel de l'élément multimédia.

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

#### Exclure les vidéos supplémentaires de l'Étude de La Tour de Garde {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Exclure les vidéos supplémentaires mentionnées dans les paragraphes de l'étude de La Tour de Garde.

**Par défaut** : `faux`

#### Exclure les vidéos de l'étude biblique de l'assemblée {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Choisissez les publications dont les vidéos référencées ne doivent pas être diffusées pendant l'étude biblique de l'assemblée. Recherche par titre ou symbole de publication.

**Par défaut** : Marche courageusement avec Dieu (`wcg`)

#### Exclure les médias de la brochure Enseignement {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclure les médias de la brochure Enseignement (th) des téléchargements de médias.

**Par défaut** : `vrai`

### Sous-titres {#subtitles}

#### Activer les sous-titres {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Activez la prise en charge des sous-titres pour la lecture des médias.

**Par défaut** : `faux`

#### Langue des sous-titres {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Langue pour les sous-titres (peut être différente de la langue des médias).

**Options** : Toutes les langues disponibles sur le site officiel des Témoins de Jéhovah

**Par défaut** : Aucune

### Gestion du cache {#cache-management}

#### Mettre en cache toutes les vidéos pour les cantiques {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Mettre en cache à l'avance toutes les vidéos des cantiques pour de meilleures performances. Notez que cela augmente la taille du cache des médias.

**Par défaut** : `faux`

#### Dossier de cache {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Emplacement personnalisé pour stocker les fichiers multimédias mis en cache.

**Par défaut** : Emplacement par défaut du système

#### Activer le nettoyage automatique du cache {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Effacez automatiquement les anciens fichiers mis en cache pour économiser l'espace disque.

**Par défaut** : `vrai`

### Titres de cantiques en pinyin {#pinyin-song-titles}

#### Préférer les cantiques en pinyin {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

Lorsqu'une version en pinyin d'un cantique de réunion se trouve dans le dossier des cantiques en pinyin, utiliser celle-ci à la place du cantique standard.

**Par défaut** : `faux`

#### Dossier de cantiques pinyin {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

Dossier contenant des vidéos de cantiques en pinyin (par exemple : `sjjm_s-Pi_CHS_066_r720P.mp4`). Lorsqu'un fichier en pinyin correspondant au numéro du cantique est trouvé, celui-ci sera lu à la place du cantique standard.

**Par défaut** : Vide

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

**Paramètre** : `convertFilesToMp4`

Convertir les fichiers multimédias exportés au format MP4 pour une meilleure compatibilité.

**Par défaut** : `faux`

### Shared Folder (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

These settings are in the **Integrations** category.

M³ can add media to your meetings from a folder kept in sync by a cloud storage app, such as Dropbox, OneDrive, iCloud Drive or Google Drive. This is useful when others prepare media for their parts and share it with you, or when M³ is used on more than one computer. A folder on this computer or on your network works too.

M³ creates a folder inside the shared folder for each upcoming meeting, named with the meeting's date written as year-month-day (for example, `2026-03-25`). Put photos, videos, audio files or JW Library playlists in a meeting's folder, and they're added to that meeting's media list automatically. To add files for another day, create a folder for it, named the same way. Anything else in the shared folder is ignored.

:::tip Astuce

Create a new folder used only for this, such as "Meeting media", and set it to always stay on this computer in your cloud storage app (often called "available offline"), so the files are ready before the meeting starts.

:::

#### Add Media From a Shared Folder {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Add the files put in the shared folder to the right meeting automatically.

**Par défaut** : `faux`

#### Shared Folder {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

The folder to add media from. The setup wizard offers to set it up for you.

**Par défaut** : Vide

#### Delete Past Meeting Folders {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

When a week is over, delete that week's dated folders, along with the files in them, to keep the shared folder tidy. Since the folder is shared, they're also deleted for everyone else who uses it. Turn this off to keep them.

**Par défaut** : `vrai`

## Minuteur de réunion {#meeting-timer}

### Activer le minuteur de réunion {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Activer une fenêtre de minuteur séparée pour chronométrer les parties d'une réunion. Il s'agit d'une fonctionnalité bêta qui ne devrait être activée que si elle est approuvée localement.

**Par défaut** : `faux`

### Comportement de la fenêtre du minuteur {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configurer si la fenêtre du minuteur s'ouvre automatiquement, si le minuteur des parties compte par défaut en montant ou bien à rebours, si l'horloge utilise le format 12 heures ou 24 heures, et si la valeur actuelle du minuteur devrait être affichée sur le bouton du minuteur dans l'îlot d'actions.

### Accès rapide au minuteur {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Choisissez comment accéder au minuteur depuis la fenêtre principale :

- **Commandes rapides lors du survol du bouton du minuteur** : au survol du bouton du minuteur dans l'îlot d'actions, la partie en cours de chronométrage s'affiche avec les boutons « Démarrer », « Mettre en pause », « Arrêter » et « Partie suivante », sans ouvrir la fenêtre contextuelle complète du minuteur. Option activée par défaut.
- **Afficher un panneau du minuteur dans la fenêtre principale** : garde la liste complète des parties de la réunion et les commandes du minuteur toujours visibles, dans un panneau ancré sur le côté droit de la fenêtre principale. La fenêtre contextuelle complète reste accessible depuis l'îlot d'actions pour les paramètres de la fenêtre et de l'affichage.

### Minuteur à distance {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemotePort` -->

Lorsque cette option est activée, M³ diffuse une copie en lecture seule de l'affichage du minuteur sous forme de page web sur votre réseau local, pour une tablette ou un téléphone au pupitre : l'orateur voit le temps restant sans que celui-ci apparaisse sur l'écran de l'assemblée locale ou dans un partage Zoom. La page suit le minuteur en temps réel, y compris le compte à rebours avant la réunion, l'horloge, les couleurs de dépassement de temps et l'alerte main levée ; toutes les commandes restent dans M³.

Les adresses à ouvrir sur l'appareil sont indiquées dans la fenêtre contextuelle du minuteur, avec un bouton pour les copier. Ne modifiez le port que si un autre programme l'utilise déjà. Notez que, tant que cette option est activée, toute personne se trouvant sur le même réseau peut ouvrir la page ; celle-ci n'affiche toutefois que le minuteur.

**Par défaut** : `faux`, port `8787`

### Formats d'affichage du minuteur {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Choisissez des formats d’affichage analogique ou numérique pour l’heure et les minuteurs à rebours. L'indicateur d'alerte du compte à rebours peut faire passer l'anneau de compte à rebours analogique à une couleur d'alerte pendant la dernière minute.

Le format de compte à rebours **Horloge analogique avec indicateur visuel de temps** affiche le temps restant pour une partie sous la forme d'un secteur sur le cadran d'une horloge analogique, de l'aiguille des minutes jusqu'à la fin prévue, ce qui permet de voir d'un coup d'œil à la fois l'heure et le temps restant. Le dépassement de temps apparaît sous la forme d'un second secteur, de la couleur de dépassement. Ce format s'applique également au compte à rebours avant la réunion et fonctionne en mode « Compte croissant ».

### Compte à rebours et horaire des réunions {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Afficher un compte à rebours avant les réunions et, si désiré, indiquer si la réunion est en avance ou en retard par rapport à l'horaire prévu. Le compte à rebours de la réunion apparaît uniquement sur l'affichage du minuteur, et non dans la fenêtre multimédia.

### Apparence du minuteur et dépassement de temps {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Personnalisez la taille et les couleurs du texte du minuteur, et configurez les indicateurs de dépassement de temps tels que les couleurs alternées, le clignotement et la possibilité de n'afficher que le dépassement de temps en mode « Compte croissant ».

## Intégrations {#integrations}

This category also holds the [shared folder](#settings-guide-folder-monitoring) settings, for adding media from Dropbox, OneDrive, iCloud Drive or Google Drive.

### Intégration Zoom {#settings-guide-zoom-integration}

#### Activer Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Activez les fonctionnalités d'intégration des réunions Zoom.

**Par défaut** : `faux`

#### Raccourci de partage d'écran {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Raccourci clavier pour déclencher le partage d'écran Zoom.

**Par défaut** : Aucune

#### Mise au premier plan automatique de la fenêtre multimédia {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Mettre automatiquement au premier plan la fenêtre multimédia dès le démarrage du partage d'écran sur Zoom. Ceci n'est généralement pas nécessaire, mais peut s'avérer utile sur certains systèmes si la fenêtre multimédia perd régulièrement le focus une fois le partage d'écran lancé.

**Par défaut** : `faux`

### Gestionnaire de réunions Zoom {#zoom-meeting-manager}

Le gestionnaire de réunions Zoom (bêta, Windows uniquement) pilote l'application de bureau Zoom à votre place, avant, pendant et après chaque réunion. Son assistant de configuration, proposé lorsque vous l'activez, vous guide pas à pas pour chaque automatisation.

#### Pendant que M³ pilote Zoom {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Zoom n'offre pas de véritable interface d'automatisation ; M³ pilote donc l'application Zoom par l'intermédiaire de son interface d'accessibilité, qui permet de presque tout faire sans la souris (la liste des participants, ses menus, la fenêtre de partage). Certaines actions peuvent toutefois nécessiter de déplacer la souris ou de changer la fenêtre au premier plan pendant un instant, par exemple pour faire réapparaître la barre d'outils de Zoom lorsqu'elle s'est masquée automatiquement. Chaque fois que cela se produit, M³ recouvre sa propre fenêtre d'un message « M³ pilote Zoom » qui indique l'action en cours, accompagné d'un bouton **Annuler cette automatisation**. Le même message s'affiche pendant les vérifications de l'assistant de configuration et pendant l'autotest. Un raccourci clavier global (par défaut `Ctrl+Alt+Escape`), actif uniquement pendant l'exécution d'une automatisation, permet de l'annuler depuis n'importe quelle application, même lorsque Zoom est au premier plan. L'annulation arrête immédiatement M³ ; Zoom risque alors d'être resté dans un état intermédiaire, pensez donc à le vérifier.

**Par défaut** : `Ctrl+Alt+Escape`

#### Gestion des mains levées {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert`, `zoomHandRaisedPhrase` -->

Pendant une réunion, M³ surveille la liste des participants de Zoom pour repérer les mains levées. Lorsqu'une personne lève la main, une notification dans M³ vous permet de **réactiver le micro** de ce participant en un clic, puis, une fois son intervention terminée, de **couper de nouveau son micro et baisser sa main** d'un autre clic. Le bouton Zoom de l'îlot d'actions affiche la liste des mains levées, avec les mêmes boutons. Chaque action s'applique à la ligne de ce participant dans Zoom, identifiée par son nom exact ; si deux participants portent le même nom, M³ ne touche à aucun des deux.

Si le [minuteur de réunion](#meeting-timer) est activé, une grande main accompagnée du nom du participant apparaît également sur l'affichage du minuteur, à l'intention du président, et un bouton **Alerte main levée** dans les fenêtres contextuelles du minuteur et de Zoom permet de l'afficher manuellement. La grande main nécessite l'affichage du minuteur ; les notifications et les boutons fonctionnent sans celui-ci.

Zoom signale les mains levées dans sa propre langue ; M³ doit donc d'abord apprendre comment il le fait : lorsque votre réunion est ouverte dans Zoom, cliquez sur **Apprendre comment Zoom signale les mains levées**. M³ lève votre propre main, repère comment Zoom la signale dans la liste des participants et quelle entrée de menu permet de la baisser, puis la baisse. L'assistant de configuration propose également cette étape.

**Par défaut** : `faux`

### Intégration OBS Studio {#settings-guide-obs-integration}

#### Activer OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Activez l'intégration OBS Studio pour le changement automatique de scène.

**Par défaut** : `faux`

:::warning Note importante

**Configuration audio requise** : L'intégration OBS Studio ne gère que le partage d'écran. L'audio des médias M³ **n'est pas automatiquement transmis** aux participants Zoom lorsque vous utilisez OBS Studio. Vous devez configurer les paramètres Son d'origine de Zoom ou utiliser « Partager le son de l'ordinateur » pour vous assurer que les participants à la réunion peuvent entendre les médias. Voir le [Guide de l'utilisateur](/user-guide#audio-configuration) pour les instructions détaillées de configuration audio.

**Note** : L'intégration Zoom utilise le partage d'écran natif de Zoom, qui gère l'audio plus facilement que l'intégration OBS Studio.

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

- **Ne pas partager automatiquement les images** : Retarder le partage d'images vers OBS jusqu'à ce qu'elles soient déclenchées manuellement
- **Basculement rapide** : Activer le basculement rapide on/off pour l'intégration OBS
- **Changer de scène après les médias** : Retourner automatiquement à la scène précédente après les médias
- **Se souvenir de la scène précédente** : Se souvenir de la scène précédente et la restaurer
- **Masquer les icônes** : Masquer les icônes liées à OBS dans l'interface
- **Commandes d'enregistrement** : Affiche les commandes permettant de démarrer et d'arrêter l'enregistrement dans OBS Studio depuis M³

:::warning Note importante

**Configuration audio requise** : L'intégration OBS Studio ne gère que le changement de vidéo/scène. L'audio des médias M³ **n'est pas automatiquement transmis** à Zoom ou OBS. Le flux vidéo fonctionne comme une caméra virtuelle sans son, tout comme une webcam. Vous devez configurer les paramètres Son d'origine de Zoom ou utiliser « Partager le son de l'ordinateur » pour vous assurer que les participants à la réunion peuvent entendre les médias. Voir le [Guide de l'utilisateur](/user-guide#audio-configuration) pour les instructions détaillées de configuration audio.

**Alternative** : Envisagez d'utiliser l'intégration Zoom à la place, car elle utilise le partage d'écran natif de Zoom qui gère l'audio plus facilement.

:::

### Événements personnalisés {#custom-events}

#### Activer les événements personnalisés {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Activer les raccourcis personnalisés qui seront déclenchés lorsqu'un événement spécifique est détecté (par exemple, les médias sont lus, mis en pause ou arrêtés).

**Par défaut** : `faux`

#### Raccourcis d'événements personnalisés {#custom-event-shortcuts}

##### Raccourci de l'événement de lecture de média {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Raccourci qui est déclenché lorsque le média est lu.

**Par défaut** : Aucune

##### Raccourci de l'événement de mise en pause {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Raccourci déclenché lorsque le média est mis en pause.

**Par défaut** : Aucune

##### Raccourci de l'événement de média arrêté {#custom-event-media-stop-shortcut}

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

Permettre à M³ de contrôler une application d'enregistrement séparée à l'aide de raccourcis clavier. Cette fonction n'enregistre pas directement dans M³ ; elle transmet plutôt les raccourcis configurés lorsque vous cliquez sur **Démarrer l'enregistrement** ou **Arrêter l'enregistrement** dans la fenêtre contextuelle des enregistrements de réunion, vers l'application d'enregistrement.

Cette option est masquée lorsque le contrôle des enregistrements pour OBS Studio est activé. Si vous utilisez OBS Studio, utilisez plutôt les contrôles d'enregistrement d'OBS Studio dans l'intégration d'OBS Studio.

**Par défaut** : `faux`

#### Raccourcis et dossier pour les enregistrements {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Configurez le raccourci clavier qui lance l'enregistrement, un raccourci facultatif qui interrompt l'enregistrement, ainsi que le dossier dans lequel l'application externe enregistre les fichiers. Si aucun raccourci d'arrêt n'est défini, M³ réutilisera le raccourci de démarrage. Lorsqu'un dossier est configuré, M³ affichera un bouton pour l'ouvrir.

## Interface et raccourcis {#interface-shortcuts}

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

### Bouton « Ajouter des médias » {#add-more-media-button}

#### Sections avec un bouton Ajouter des médias {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Choisissez les sections de la réunion qui afficheront leur propre bouton permettant d'ajouter vos propres fichiers multimédias, en plus du bouton « Ajouter des médias » situé dans la barre d'outils supérieure, qui fonctionne toujours pour toutes les sections.

**Par défaut** : « Discours public », « Vie chrétienne », « Visite du responsable de circonscription » et « Personnalisé »

#### Bouton « Ajouter des médias » compact {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

N'afficher qu'une icône pour le bouton « Ajouter des médias » / « Ajouter un cantique » dans les en-têtes de section. Lorsque cette option est désactivée, le bouton affiche également du texte à côté de l'icône s'il y a suffisamment d'espace.

**Par défaut** : `vrai`

### Poignée de glissement des médias {#media-drag-handle}

#### Afficher la poignée de glissement {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Afficher une petite poignée sur chaque élément multimédia pour pouvoir le faire glisser et le réorganiser. Il est toujours possible de réorganiser les éléments multimédias en les faisant glisser en cliquant n'importe où sur ceux-ci ; cette option n'a pour seul effet que d'afficher ou de masquer l'icône de poignée.

**Par défaut** : `vrai`

### Actions rapides pour avant et après les réunions {#before-after-meeting-quick-actions}

#### Afficher les actions rapides de réunion {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Afficher un panneau d'avant-réunion et d'après-réunion comprenant des commandes utiles (musique de fond, enregistrement) ainsi qu'une liste de contrôle personnalisable pour chacun d'entre eux.

**Par défaut** : `vrai`

Les catégories et les tâches des listes de contrôle, tant pour les rubriques d'avant-réunion que d'après-réunion, sont gérées à partir de cette même section de paramètres : vous pouvez ajouter, renommer, réorganiser ou supprimer des catégories et des tâches selon les besoins de votre assemblée.

## Paramètres avancés {#advanced-settings}

### Transfert des paramètres du profil {#profile-settings-transfer}

Exporter les paramètres du profil actuel vers un fichier JSON, ou importer un fichier de paramètres de profil précédemment exporté. L'importation remplace les paramètres du profil actuel.

### Zone à risque {#danger-zone}

:::warning Avertissement

Ces paramètres ne doivent être modifiés que si vous comprenez leurs implications.

:::

#### Adresse du site web {#base-url}

<!-- **Setting**: `baseUrl` -->

Entrez l'adresse utilisée pour accéder au site officiel des Témoins de Jéhovah.

**Par défaut** : `jw.org`

#### Désactiver l'accélération matérielle {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Désactiver l'accélération matérielle au redémarrage de M³. Cela peut aider à résoudre des problèmes graphiques ou des plantages sur certains systèmes, mais ce n'est pas recommandé dans les autres cas.

**Par défaut** : `faux`

#### Désactiver le rappel concernant l'accélération matérielle {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Masquer le rappel invitant à réactiver l'accélération matérielle après sa désactivation manuelle.

**Par défaut** : `faux`

#### Désactiver le téléchargement des médias {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Désactiver complètement le téléchargement automatique des médias. Utilisez ceci uniquement pour les profils qui seront utilisés pour des événements spéciaux ou des configurations personnalisées.

**Par défaut** : `faux`

## Conseils pour une configuration optimale {#configuration-tips}

### Pour les nouveaux utilisateurs {#new-users}

1. Démarrez avec l'assistant de configuration pour définir les paramètres de base
2. Activez l'option « Activer la fonction de lecture des médias » pour accéder aux fonctionnalités de présentation
3. Configurez votre horaire de réunion avec précision
4. Configurez l'intégration OBS si vous utilisez des réunions hybrides

### Pour les utilisateurs avancés {#advanced-users}

1. Use a shared folder to add media from cloud storage, such as Dropbox or OneDrive
2. Activer l'exportation automatique des médias à des fins de sauvegarde
3. Configurez les raccourcis clavier pour une utilisation efficace
4. Configurez l'intégration Zoom pour le partage d'écran automatique

### Optimisation des performances {#performance-optimization}

1. Mettez en cache les vidéos des cantiques pour de meilleures performances
2. Utilisez la résolution maximale appropriée pour vos besoins
3. Configurer l'effacement automatique du cache pour gérer l'espace disque
4. Envisagez d'utiliser le paramètre de connexion limitée si votre bande passante est limitée

### Résolution des problèmes {#settings-guide-troubleshooting}

- Si les médias ne se téléchargent pas, vérifiez les paramètres de votre horaire de réunion
- Si l'intégration OBS ne fonctionne pas, vérifiez les paramètres du port et du mot de passe
- Si les performances sont lentes, essayez d'activer le cache supplémentaire ou de réduire la résolution
- Si vous rencontrez des problèmes de langue, vérifiez les paramètres de langue de l'interface et des médias
- Si les participants Zoom ne peuvent pas entendre le son des médias, configurez les paramètres Son d'origine de Zoom ou utilisez « Partager le son de l'ordinateur »
- **Conseil** : Envisagez d'utiliser l'intégration Zoom à la place d'OBS Studio pour une gestion audio plus simple.
