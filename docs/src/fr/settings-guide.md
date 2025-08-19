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

### Démarrage automatique à la connexion {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Démarrer automatiquement M³ lorsque l'ordinateur démarre.

**Par défaut** : `false`

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

La date de la prochaine célébration du Mémorial (fonctionnalité bêta).

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

## Récupération et lecture des médias {#media-retrieval-and-playback}

### Connexion limitée {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Activez ceci si vous êtes sur une connexion de données limitée pour réduire l'utilisation de la bande passante.

**Par défaut** : `false`

### Affichage des médias {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Activez la fonctionnalité d'affichage des médias. Ceci est requis pour présenter les médias sur un deuxième écran.

**Par défaut** : `false`

### Musique de fond {#background-music}

#### Activer la musique {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Activez la fonctionnalité de musique de fond.

**Par défaut** : `true`

#### Démarrage automatique de la musique {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Démarrer automatiquement la musique de fond lorsque M³ se lance si approprié.

**Par défaut** : `true`

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

**Par défaut** : `false`

#### Dossier de cache {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Emplacement personnalisé pour stocker les fichiers multimédias mis en cache.

**Par défaut** : Emplacement par défaut du système

#### Activer l'effacement automatique du cache {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Effacez automatiquement les anciens fichiers mis en cache pour économiser l'espace disque.

**Par défaut** : `true`

### Surveillance de dossiers {#folder-monitoring}

#### Activer le surveillant de dossier {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Surveillez un dossier pour les nouveaux fichiers multimédias et ajoutez-les automatiquement à M³.

**Par défaut** : `false`

#### Dossier à surveiller {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Le chemin du dossier à surveiller pour les nouveaux fichiers multimédias.

**Par défaut** : Vide

## Intégrations {#integrations}

### Intégration Zoom {#zoom-integration}

#### Activer Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Activez les fonctionnalités d'intégration des réunions Zoom.

**Par défaut** : `false`

#### Raccourci de partage d'écran {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Raccourci clavier pour déclencher le partage d'écran Zoom.

**Par défaut** : Aucune

### Intégration OBS Studio {#obs-integration}

#### Activer OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Activez l'intégration OBS Studio pour le changement automatique de scène.

**Par défaut** : `false`

:::warning Note importante

**Configuration audio requise** : L'intégration OBS Studio ne gère que le changement de vidéo/scène. L'audio des médias M³ **n'est pas automatiquement transmis** à Zoom ou OBS. Vous devez configurer les paramètres Audio original de Zoom ou utiliser « Partager le son de l'ordinateur » pour vous assurer que les participants à la réunion peuvent entendre les médias. Voir le [Guide de l'utilisateur](/fr/user-guide#audio-configuration) pour les instructions détaillées de configuration audio.

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

:::warning Note importante

**Configuration audio requise** : L'intégration OBS Studio ne gère que le changement de vidéo/scène. L'audio des médias M³ **n'est pas automatiquement transmis** à Zoom ou OBS. Le flux vidéo fonctionne comme une caméra virtuelle sans son, tout comme une webcam. Vous devez configurer les paramètres Audio original de Zoom ou utiliser « Partager le son de l'ordinateur » pour vous assurer que les participants à la réunion peuvent entendre les médias. Voir le [Guide de l'utilisateur](/fr/user-guide#audio-configuration) pour les instructions détaillées de configuration audio.

**Alternative** : Envisagez d'utiliser l'intégration Zoom à la place, car elle utilise le partage d'écran natif de Zoom qui gère l'audio plus facilement.

:::

## Paramètres avancés {#advanced-settings}

### Raccourcis clavier {#keyboard-shortcuts}

#### Activer les raccourcis clavier {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Activez les raccourcis clavier personnalisables pour le contrôle des médias.

**Par défaut** : `false`

#### Raccourcis de contrôle des médias {#media-control-shortcuts}

Configurez les raccourcis pour la lecture des médias :

- **Fenêtre multimédia** : Ouvrir/fermer la fenêtre multimédia
- **Média précédent** : Aller à l'élément multimédia précédent
- **Média suivant** : Aller à l'élément multimédia suivant
- **Pause/Reprendre** : Mettre en pause ou reprendre la lecture des médias
- **Arrêter les médias** : Arrêter la lecture des médias
- **Basculement de la musique** : Basculer la musique de fond

### Affichage des médias {#media-display}

#### Masquer le logo des médias {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Masquer le logo dans la fenêtre multimédia.

**Par défaut** : `false`

#### Résolution maximale {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Résolution maximale pour les fichiers multimédias téléchargés.

**Options** : 240p, 360p, 480p, 720p

**Par défaut** : 720p

#### Inclure les médias imprimés {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Inclure les médias des publications imprimées dans les téléchargements de médias.

**Par défaut** : `true`

#### Exclure les notes de bas de page {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Exclure les images de notes de bas de page des téléchargements de médias quand c'est possible.

**Par défaut** : `false`

#### Exclure les médias de la brochure Enseignement {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclure les médias de la brochure Enseignement (th) des téléchargements de médias.

**Par défaut** : `true`

### Sous-titres {#subtitles}

#### Activer les sous-titres {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Activez le support des sous-titres pour la lecture des médias.

**Par défaut** : `false`

#### Langue des sous-titres {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Langue pour les sous-titres (peut être différente de la langue des médias).

**Options** : Toutes les langues disponibles sur le site officiel des Témoins de Jéhovah

**Par défaut** : Aucune

### Exportation des médias {#media-export}

#### Activer l'exportation automatique des médias {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Exporter automatiquement les fichiers multimédias vers un dossier spécifié.

**Par défaut** : `false`

#### Dossier d'exportation des médias {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Chemin du dossier où les fichiers multimédias seront exportés automatiquement.

**Par défaut** : Vide

#### Convertir les fichiers en MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

Convertir les fichiers multimédias exportés au format MP4 pour une meilleure compatibilité.

**Par défaut** : `false`

### Zone de danger {#danger-zone}

:::warning Warning

Ces paramètres ne doivent être modifiés que si vous comprenez leurs implications.

:::

#### Désactiver le téléchargement des médias {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Désactiver complètement le téléchargement automatique des médias. Utilisez ceci uniquement pour les profils qui seront utilisés pour des événements spéciaux ou des configurations personnalisées.

**Par défaut** : `false`

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

### Dépannage {#troubleshooting}

- Si les médias ne téléchargent pas, vérifiez les paramètres de votre horaire de réunion
- Si l'intégration OBS ne fonctionne pas, vérifiez les paramètres du port et du mot de passe
- Si les performances sont lentes, essayez d'activer le cache supplémentaire ou de réduire la résolution
- Si vous rencontrez des problèmes de langue, vérifiez les paramètres de l'interface et de la langue des médias
- Si les participants Zoom ne peuvent pas entendre le son des médias, configurez les paramètres Audio original de Zoom ou utilisez "Partager le son de l'ordinateur"
- **Conseil** : Considérez d'utiliser l'intégration Zoom à la place de OBS Studio pour une gestion audio plus simple.
