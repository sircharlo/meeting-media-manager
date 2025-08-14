# Foire aux questions {#frequently-asked-questions}

## Questions générales {#general-questions}

### :earth_americas: Cette application dépend-elle de sites ou sources externes, ou d'une intervention humaine, pour télécharger les publications, médias et autre contenu pour les réunions ? {#external-dependencies}

**Non.** L'application M³ fonctionne de la même manière que l'application JW Library. Elle télécharge les publications, médias et autre contenu directement à partir du site officiel des Témoins de Jéhovah. L'application détermine automatiquement ce qui doit être téléchargé et quand le contenu précédemment téléchargé n'est plus à jour et devrait être re-téléchargé.

:::info Note

Le code source de cette application est disponible afin de donner à tous la possibilité de l'examiner et de vérifier ce qui se passe sous le capot.

:::

### :thinking: Cette application enfreint-elle les conditions d'utilisation du site officiel des Témoins de Jéhovah ? {#terms-of-use}

**Non.** Les [conditions d'utilisation](https://www.jw.org/finder?docid=1011511&prefer=content) du site officiel des Témoins de Jéhovah autorisent spécifiquement le type d'utilisation que nous faisons. Voici l'extrait pertinent de ces conditions :

> Il n’est pas permis de :
>
> Créer à des fins de diffusion des applications ou des techniques permettant de collecter, de copier, de télécharger, d’extraire des données, du HTML, des images ou du texte de ce site. (Cela n’interdit **pas** la diffusion d’applications gratuites et non commerciales conçues pour télécharger des fichiers électroniques depuis la partie publique du site, par exemple des fichiers EPUB, PDF, MP3 et MP4.)

### :question: Quels systèmes d'exploitation M³ prend-il en charge ? {#operating-systems}

M³ prend en charge Windows, macOS et Linux :

- **Windows** : Windows 10 et versions ultérieures (versions 64 bits et 32 bits disponibles)
- **macOS** : macOS 10.15 (Catalina) et versions ultérieures (support Intel et Apple Silicon)
- **Linux** : La plupart des distributions Linux modernes (format AppImage)

### :globe_with_meridians: M³ fonctionne-t-il dans ma langue ? {#language-support}

**Oui !** M³ offre un support multilingue complet :

- **Langues des médias** : Téléchargez des médias dans l'une des centaines de langues disponibles sur le site officiel des Témoins de Jéhovah
- **Langues de l'interface** : Utilisez l'interface de M³ dans de nombreuses langues différentes
- **Paramètres indépendants** : Vous pouvez utiliser l'interface dans une langue tout en téléchargeant des médias dans une autre

## Installation et configuration {#installation-setup}

### :computer: Comment installer M³ ? {#installation}

Téléchargez la version appropriée pour votre système d'exploitation depuis la [page des versions](https://github.com/sircharlo/meeting-media-manager/releases/latest) et suivez les instructions d'installation dans le [guide de configuration](/using-at-a-kingdom-hall#download-and-install).

### :gear: Comment configurer M³ pour la première fois ? {#first-time-setup}

M³ inclut un assistant de configuration qui vous guide à travers la configuration essentielle :

1. Choisissez votre langue d'interface
2. Sélectionnez le type de profil (Régulier ou Autre)
3. Configurez les informations de l'assemblée locale
4. Configurez l'horaire des réunions
5. Configurez les fonctionnalités optionnelles comme l'intégration OBS

## Gestion des médias {#media-management}

### :download: Comment M³ télécharge-t-il les médias ? {#media-download}

M³ télécharge automatiquement les médias pour les réunions à venir en :

1. Vérifiant votre horaire de réunions
2. Déterminant quels médias sont nécessaires
3. Téléchargeant depuis le site officiel des Témoins de Jéhovah dans votre langue sélectionnée
4. Organisant les médias par date et type de réunion
5. Mettant en cache les fichiers pour une utilisation hors ligne

### :calendar: Puis-je télécharger des médias pour des dates spécifiques ? {#specific-dates}

Oui ! M³ vous permet de :

- Télécharger automatiquement des médias pour les réunions à venir
- Importer des médias personnalisés pour n'importe quelle date

### :folder: Comment importer mes propres fichiers multimédias ? {#import-media}

Vous pouvez importer des médias personnalisés de plusieurs façons :

- **Import de fichiers** : Utilisez le bouton d'import pour ajouter des vidéos, images ou fichiers audio
- **Glisser-déposer** : Faites glisser les fichiers directement dans M³
- **Surveillance de dossiers** : Configurez un dossier surveillé pour les imports automatiques
- **Fichiers JWPUB et listes de lecture** : Importez des publications et des listes de lecture

### :speaker: Puis-je importer des enregistrements audio de la Bible ? {#audio-bible}

Oui ! M³ inclut une fonctionnalité Bible audio qui vous permet de :

1. Sélectionner des livres et chapitres de la Bible
2. Choisir des versets spécifiques ou des plages de versets
3. Télécharger des enregistrements audio
4. Les utiliser lors des réunions

## Fonctionnalités de présentation {#presentation-features}

### :tv: Comment présenter des médias pendant les réunions ? {#present-media}

Pour présenter des médias :

1. Sélectionnez la date
2. Cliquez sur le bouton de lecture sur l'élément multimédia que vous voulez présenter ou utilisez les raccourcis clavier
3. Utilisez les contrôles du lecteur multimédia pour mettre en pause, naviguer ou arrêter la lecture
4. Use zoom/pan features for images
5. Set custom timing if needed

### :keyboard: Quels raccourcis clavier sont disponibles ? {#keyboard-shortcuts}

M³ prend en charge les raccourcis clavier personnalisables pour :

- Ouverture/fermeture de la fenêtre multimédia
- Navigation précédente/suivante des médias
- Contrôles de lecture/pause/arrêt
- Basculement de la musique de fond

<!-- - Fullscreen mode -->

### :music: Comment fonctionne la musique de fond ? {#background-music}

Les fonctionnalités de musique de fond incluent :

- Lecture automatique lorsque M³ démarre, avant le début de la réunion
- Arrêt automatique avant le début des réunions
- Redémarrage automatique après les réunions
- Contrôle de volume indépendant
- Temps de pause configurable

### :video_camera: Comment configurer l'intégration Zoom ? {#zoom-setup}

Pour intégrer avec Zoom :

1. Activez l'intégration Zoom dans les paramètres de M³
2. Configurez le raccourci de partage d'écran qui est défini dans Zoom. Assurez-vous que le raccourci est "global" dans les paramètres de Zoom.
3. M³ démarrera et arrêtera automatiquement le partage d'écran Zoom lors des présentations de médias

## Intégration OBS Studio {#obs-integration}

### :video_camera: Comment configurer l'intégration OBS Studio ? {#obs-setup}

Pour intégrer avec OBS Studio :

1. Installez OBS Studio et le plugin WebSocket
2. Activez l'intégration OBS dans les paramètres de M³
3. Entrez le port et le mot de passe OBS
4. Configurez les scènes pour la caméra, les médias et les images
5. Testez la lecture

### :arrows_counterclockwise: Comment fonctionne le basculement automatique des scènes ? {#scene-switching}

M³ bascule automatiquement les scènes OBS en fonction de :

- Type de média (vidéo, image, etc.)
- Votre configuration de scène
- Paramètres comme "Différer les images"
- Si vous revenez à la scène précédente après le média

### :pause_button: Qu'est-ce que la fonction "Différer les images" ? {#postpone-images}

Cette fonction retarde le partage des images vers OBS jusqu'à ce que vous les déclenchez manuellement. C'est utile pour :

- Afficher les images à l'audience en personne d'abord
- Avoir plus de contrôle sur le timing
- Éviter les changements de scène précoces

## Fonctionnalités avancées {#advanced-features}

### :cloud: Comment fonctionne la surveillance de dossiers ? {#folder-monitoring}

La surveillance de dossiers vous permet de :

1. Sélectionner un dossier à surveiller pour les nouveaux fichiers
2. Importer automatiquement les nouveaux fichiers multimédias qui sont synchronisés avec le stockage cloud comme Dropbox ou OneDrive

### :file_folder: Qu'est-ce que l'exportation automatique des médias ? {#media-export}

L'exportation automatique des médias :

1. Exporte les fichiers multimédias vers un dossier spécifié
2. Organise les fichiers par date et section
3. Convertit les fichiers en format MP4 (optionnel)
4. Maintenir une sauvegarde organisée des fichiers multimédias de la réunion

### :family: Puis-je gérer plusieurs assemblées ? {#multiple-congregations}

Oui ! M³ prend en charge plusieurs profils pour :

- Différentes assemblées
- Événements spéciaux
- Différents groupes
- Paramètres et médias séparés pour chaque

## Dépannage {#troubleshooting}

### :warning: Les médias ne téléchargent pas. Que dois-je vérifier ? {#media-not-downloading}

Vérifiez ces problèmes courants :

1. **Horaire des réunions** : Vérifiez vos jours et heures de réunion
2. **Paramètres de langue** : Assurez-vous que la langue de vos médias est correcte
3. **Connexion Internet** : Vérifiez votre connexion Internet
4. **Disponibilité de la langue** : Vérifiez que la langue est disponible sur le site officiel des Témoins de Jéhovah

<!-- 5. **Manual Refresh**: Try manually refreshing to check for new media -->

### :video_camera: L'intégration OBS n'est pas fonctionnelle. Que dois-je vérifier ? {#obs-not-working}

Vérifiez ces problèmes liés à OBS :

1. **Installation OBS** : Assurez-vous que OBS Studio est installé et en cours d'exécution
2. **Plugin WebSocket** : Vérifiez que le plugin WebSocket est installé
3. **Port et mot de passe** : Vérifiez les paramètres de votre port et de votre mot de passe OBS
4. **Pare-feu** : Assurez-vous que le pare-feu n'empêche pas la connexion

### :speaker: M³ envoie-t-il automatiquement l'audio des médias à Zoom lors de l'utilisation d'OBS Studio ? {#audio-to-zoom}

**Non.** M³ ne transmet pas automatiquement l'audio des médias à Zoom ou OBS Studio. Le flux vidéo fonctionne comme une caméra virtuelle sans son, tout comme une webcam. Pour avoir le son de la musique/vidéo disponible automatiquement dans Zoom, vous devez vous assurer que Zoom 'entend' le flux audio provenant de l'ordinateur, puis vous devez activer le paramètre **Audio Original** dans Zoom.

**Notes importantes :**

- Vous devez activer l'Audio Original **à chaque fois** avant de démarrer une réunion Zoom
- Ce paramètre n'est pas lié à M³ - vous rencontreriez le même problème audio lors de l'utilisation d'un autre lecteur multimédia et sans utiliser les fonctionnalités de partage d'écran et d'audio de Zoom
- Le paramètre Audio Original a trois sous-options - généralement, les deux premières doivent être activées et la troisième désactivée pour une qualité audio optimale
- Si vous rencontrez toujours des problèmes audio, vous pouvez peut-être utiliser l'option "Partager le son de l'ordinateur" de Zoom à la place
- Alternativement, envisagez d'utiliser l'intégration Zoom, car elle utilise le partage d'écran natif de Zoom.

**Pourquoi est-ce nécessaire ?**
M³ joue des médias avec son sur votre ordinateur, mais ce son n'est pas automatiquement transmis via le flux vidéo vers Zoom lors de l'utilisation d'OBS Studio. Le paramètre Audio Original permet à Zoom de capturer le son joué sur votre ordinateur lors du partage d'écran, si votre ordinateur est correctement configuré (par exemple : l'ordinateur a une deuxième carte son qui est utilisée pour la lecture des médias qui Zoom écoute comme un microphone.)

### :snail: M³ fonctionne lentement. Comment puis-je améliorer les performances ? {#performance-issues}

Essayez ces optimisations de performances :

1. **Activer le cache supplémentaire** : Activez le cache supplémentaire dans les paramètres
2. **Fermer les autres applications** : Fermez les applications inutiles
3. **Vérifier l'espace disque** : Assurez-vous d'avoir suffisamment d'espace disque libre
4. **Réduire la résolution** : Réduisez la résolution maximale

### :speech_balloon: J'ai des problèmes de langue. Que dois-je vérifier ? {#language-issues}

Vérifiez ces paramètres de langue :

1. **Langue de l'interface** : Vérifiez votre paramètre de langue d'affichage
2. **Langue des médias** : Vérifiez la langue de téléchargement de vos médias
3. **Disponibilité de la langue** : Assurez-vous que la langue est disponible sur le site officiel des Témoins de Jéhovah
4. **Fallback Language**: Try setting a fallback language

## Support et communauté {#support-community}

### :radioactive: Comment signaler un problème ? {#how-do-i-report-an-issue}

Veuillez [signaler le problème sur GitHub](https://github.com/sircharlo/meeting-media-manager/issues). Incluez :

- Une description détaillée du problème
- Les étapes pour reproduire l'erreur
- Votre système d'exploitation et la version de M³
- Les messages d'erreur, les journaux et les captures d'écran

### :new: Comment puis-je demander une nouvelle fonctionnalité ou une amélioration ? {#how-can-i-request-a-new-feature-or-enhancement}

Veuillez [ouvrir une discussion](https://github.com/sircharlo/meeting-media-manager/discussions) sur GitHub. Décrivez :

- La fonctionnalité que vous souhaitez voir
- Comment elle bénéficierait aux utilisateurs
- Toute exigence ou préférence spécifique

### :handshake: Comment puis-je contribuer au code ? {#how-can-i-contribute-some-code}

Veuillez [consulter le guide de contribution](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) sur GitHub. Nous accueillons les contributions de code et les demandes d'extraction !

### :globe_with_meridians: Comment puis-je aider à la traduction ? {#translations}

M³ utilise Crowdin pour la gestion des traductions. Vous pouvez contribuer aux traductions en :

1. Visitant le [projet Crowdin](https://crowdin.com/project/meeting-media-manager)
2. Sélectionnant votre langue
3. Translating strings that need work
4. Examinant les traductions existantes

### :x: Puis-je faire un don pour soutenir le projet ? {#can-i-make-a-donation-to-the-project}

Merci de votre intérêt à soutenir le projet! Cependant, dans l'esprit de Matthieu 10:8, les dons ne sont **pas** acceptés et ne le seront jamais. Cette appli a été faite avec amour et un peu de temps libre. Nous espérons que vous l'apprécierez ! :tada:

:::tip :book: Matthieu 10:8

"Vous avez reçu gratuitement, donnez gratuitement."

:::

## Questions techniques {#technical-questions}

### :floppy_disk: Quel espace disque M³ utilise-t-il ? {#disk-space}

L'utilisation de l'espace disque dépend de :

- **Résolution des médias** : Les résolutions plus élevées utilisent plus d'espace
- **Contenu mis en cache** : Les fichiers multimédias sont mis en cache localement
- **Cache supplémentaire** : Le cache supplémentaire peut augmenter l'utilisation
- **Médias exportés** : Les fonctionnalités d'exportation utilisent de l'espace supplémentaire

Les utilisations typiques varient de 2-10GB selon les paramètres et l'utilisation.

### :shield: M³ est-il sécurisé et privé ? {#security-privacy}

Oui ! M³ est conçu avec la sécurité et la confidentialité en tête :

- **Stockage local** : Tous les données de réunion sont stockées localement sur votre ordinateur
- **Téléchargements directs** : Les médias sont téléchargés directement depuis le site officiel des Témoins de Jéhovah
- **Code source ouvert** : Le code est ouvert pour examen et vérification
- **Rapports de bogues** : Peu de données peuvent être collectées à des fins de dépannage

### :arrows_clockwise: À quelle fréquence M³ vérifie-t-il les mises à jour ? {#update-frequency}

M³ vérifie les mises à jour :

- **Mises à jour de l'application** : Vérifie automatiquement les nouvelles versions chaque fois que l'application est ouverte
- **Mises à jour des médias** : Vérifie automatiquement les nouveaux médias de réunion chaque fois que l'application est ouverte
- **Mises à jour des langues** : Détection dynamique des nouvelles langues si nécessaire
