# Guide de l'utilisateur {#user-guide}

Ce guide utilisateur complet vous aidera à maîtriser toutes les fonctionnalités de M³, de la configuration de base aux techniques avancées de présentation de médias.

## Pour commencer {#getting-started}

### Premier lancement {#first-launch}

Lorsque vous lancez M³ pour la première fois, vous serez guidé à travers un assistant de configuration qui configurera les paramètres essentiels pour votre assemblée locale :

1. **Choisissez votre langue d'interface** - Ceci détermine dans quelle langue les menus et boutons de M³ seront affichés
2. **Sélectionnez le type de profil** - Choisissez « Régulier » pour un usage normal de l'assemblée locale ou « Autre » pour des événements spéciaux
3. **Configurez les informations de l'assemblée locale** - Entrez les détails de votre assemblée locale ou utilisez la fonction de recherche automatique
4. **Configurez l'horaire des réunions** - Configurez vos heures de réunion de semaine et de fin de semaine
5. **Fonctionnalités optionnelles** - Configurez l'intégration OBS, la musique de fond et d'autres fonctionnalités avancées

:::tip Astuce

Prenez votre temps pendant la configuration - mais vous pourrez toujours modifier ces paramètres plus tard dans le menu Paramètres.

:::

### Aperçu de l'interface principale {#main-interface}

L'interface principale de M³ se compose de plusieurs zones clés :

- **Tiroir de navigation** - Accédez à différentes sections et paramètres
- **Vue calendrier** - Parcourez les médias par date
- **Liste des médias** - Affichez et gérez les médias pour les dates sélectionnées
- **Barre d'outils** - Accès rapide aux fonctions communes
- **Barre d'état** - Affiche la progression des téléchargements, la musique de fond et le statut de connexion OBS Studio

## Media Management {#user-guide-media-management}

### Comprendre la vue calendrier {#calendar-view}

La vue calendrier affiche votre horaire de réunions et les médias disponibles :

- **Jours de réunion** - Les jours surlignés montrent quand les réunions sont programmées
- **Indicateurs de médias** - Les icônes montrent quels types de médias sont disponibles
- **Navigation par date** - Utilisez les touches fléchées pour naviguer entre les mois

<!-- ### Downloading Media {#downloading-media}

::: info Note

Download speed depends on your internet connection and the size of media files. Videos typically take longer to download than images.

::: -->

### Organiser les médias {#organizing-media}

M³ organise automatiquement les médias par type de réunion et section :

- **Sections de réunion** - Les médias sont regroupés par parties de réunion (Causerie publique, Joyaux de la Parole de Dieu, etc.)
- **Sections personnalisées** - Vous pouvez créer des sections personnalisées pour des médias supplémentaires si aucune réunion n'est programmée ce jour-là

## Présentation des médias {#media-presentation}

### Ouvrir le lecteur multimédia {#opening-media-player}

Pour présenter des médias lors d'une réunion :

1. Sélectionnez la date et l'élément multimédia que vous souhaitez présenter
2. Cliquez sur le bouton de lecture ou utilisez le raccourci clavier
3. Le média commencera à jouer sur l'affichage multimédia
4. Utilisez les contrôles pour lire, mettre en pause ou naviguer dans les médias

### Contrôles du lecteur multimédia {#media-player-controls}

Le lecteur multimédia fournit des contrôles complets :

- **Lecture/Pause** - Démarrer ou mettre en pause la lecture des médias
- **Arrêt** - Arrêter la lecture

<!-- - **Previous/Next** - Navigate between media items
- **Volume** - Adjust playback volume -->

<!-- - **Fullscreen** - Toggle fullscreen mode -->

- **Zoom/Pan** - Utilisez la molette de la souris pour zoomer, faites glisser pour faire un panoramique (pour les images)

### Fonctionnalités de présentation avancées {#advanced-presentation}

#### Timing personnalisé {#custom-timing}

Définissez des temps de début et de fin personnalisés pour les médias :

<!-- 1. Right-click on a media item
2. Select "Edit Timing" -->

1. Cliquez sur la durée d'une vidéo en haut à gauche de sa miniature
2. Définissez les temps de début et de fin
3. Sauvegardez vos modifications

#### Zoom et panoramique {#zoom-pan}

Pour les images et vidéos :

- **Zoom avant/arrière** - Utilisez la molette de la souris ou les contrôles de zoom sur la miniature
- **Panoramique** - Cliquez et faites glisser la miniature pour déplacer l'image
- **Réinitialiser le zoom** - Cliquez pour revenir au zoom original

#### Keyboard Shortcuts {#user-guide-keyboard-shortcuts}

Configurez des raccourcis clavier personnalisés pour un accès rapide. Notez qu'aucun raccourci clavier n'est défini par défaut.

**Contrôles de médias intégrés** (lorsque la fenêtre principale est focalisée et affiche la liste des médias) :

- **Tab/Shift+Tab** - Naviguer entre les éléments multimédia
- **Flèche haut/bas** - Naviguer entre les éléments multimédia
- **Espace** - Lire/Mettre en pause les médias
- **Échap** - Arrêter les médias

**Raccourcis personnalisables** (lorsqu'ils sont activés dans les paramètres) :

- **Fenêtre multimédia**\* - Ouvrir/fermer la fenêtre multimédia
- **Média précédent/suivant**\* - Naviguer entre les éléments multimédia
- **Pause/Reprendre**\* - Contrôler la lecture des médias
- **Arrêter les médias**\* - Arrêter la lecture des médias
- **Basculer la musique**\* - Contrôler la musique de fond

**Note (\*):** Raccourci global - disponible même lorsque l'application n'est pas focalisée

## Background Music {#user-guide-background-music}

### Configuration de la musique de fond {#background-music-setup}

La musique de fond joue automatiquement avant les réunions et s'arrête au moment approprié :

1. **Activer la musique** - Activez la musique de fond dans les paramètres
2. **Démarrage automatique** - La musique démarrera automatiquement lorsque M³ se lance, si approprié
3. **Arrêt de réunion** - La musique s'arrête automatiquement avant l'heure de début de la réunion
4. **Contrôle manuel** - Utilisez le bouton de musique dans la barre d'état pour démarrer/arrêter manuellement
5. **Redémarrage** - Reprenez la musique après les réunions d'un clic

## Zoom Integration {#user-guide-zoom-integration}

M³ peut s'intégrer avec Zoom pour le partage d'écran automatique :

1. **Activer l'intégration** - Activez l'intégration Zoom dans les paramètres
2. **Configurer le raccourci** - Configurez le raccourci clavier de partage d'écran qui est configuré dans Zoom. Assurez-vous que la case à cocher "global" est cochée dans Zoom.
3. **Contrôle automatique** - M³ basculera automatiquement le partage d'écran dans Zoom selon les besoins
4. **Contrôle manuel** - Vous pouvez toujours contrôler manuellement le partage d'écran en utilisant Zoom si nécessaire

## OBS Studio Integration {#user-guide-obs-integration}

### Setting Up OBS Integration {#user-guide-obs-setup}

Pour utiliser M³ avec OBS Studio pour les réunions hybrides :

1. **Installer OBS Studio** - Téléchargez et installez OBS Studio
2. **Activer WebSocket** - Installez le plugin WebSocket dans OBS
3. **Configurer M³** - Entrez le port et le mot de passe OBS dans les paramètres de M³
4. **Configurer les scènes** - Créez des scènes pour la caméra, les médias et autre contenu
5. **Tester** - Vérifiez que la lecture fonctionne correctement

### Gestion des scènes OBS {#obs-scene-management}

M³ change automatiquement les scènes OBS pendant les présentations :

- **Scène caméra** - Affiche la vue de l'estrade/caméra
- **Scène média** - Affiche le contenu multimédia
- **Scène image** - Affiche les images (peut être reportée si activée)
- **Changement automatique** - Les scènes changent selon le type de média et les paramètres

### Fonctionnalités OBS avancées {#advanced-obs}

#### Postpone Images {#user-guide-postpone-images}

Activez cette option pour retarder le partage d'images vers OBS jusqu'à ce qu'il soit déclenché manuellement :

1. Activez « Reporter les images » dans les paramètres OBS
2. Les images ne seront partagées que lorsque vous cliquez sur le bouton pour les afficher en utilisant OBS Studio. Ceci est utile pour montrer les images à l'auditoire en personne en premier.

#### Scene Switching Behavior {#user-guide-scene-switching}

Configurez comment M³ gère les changements de scène :

- **Changer après les médias** - Retourner automatiquement à la scène précédente
- **Se souvenir de la scène précédente** - Restaurer la scène qui était active avant les médias

### Configuration audio pour les réunions hybrides {#audio-configuration}

Lorsque vous utilisez M³ avec OBS Studio pour des réunions hybrides (en personne + Zoom), vous devez configurer les paramètres audio pour vous assurer que les participants à la réunion peuvent entendre les médias :

#### Paramètres audio Zoom {#zoom-audio-settings}

**Avant chaque réunion, vous devez activer l'Audio original dans Zoom :**

1. **Ouvrez Zoom** et allez dans Paramètres
2. **Naviguez vers Audio** → **Avancé**
3. **Activez « Afficher l'option de réunion pour 'Activer le son original'"**
4. **Cochez « Désactiver l'annulation d'écho »** (première case à cocher)
5. **Cochez « Désactiver la suppression de bruit »** (deuxième case à cocher)
6. **Décochez « Désactiver le mode musique haute fidélité »** (troisième case à cocher)
7. **Avant de commencer chaque réunion**, cliquez sur le bouton « Audio original » dans les contrôles de réunion

**Alternative : Partager le son de l'ordinateur**
Si l'Audio original ne fonctionne pas bien dans votre configuration :

1. **Avant de jouer les médias**, allez dans l'onglet **Avancé** dans les options de partage d'écran Zoom
2. **Cochez « Partager le son de l'ordinateur »**
3. **Note** : Cette option doit être activée chaque fois que vous démarrez une nouvelle session Zoom

**Meilleure alternative** : Envisagez d'utiliser l'intégration Zoom de M³ au lieu d'OBS Studio, car elle utilise le partage d'écran natif de Zoom qui gère l'audio plus facilement et ne nécessite pas de configuration audio complexe.

#### Pourquoi la configuration audio est nécessaire {#why-audio-config}

M³ joue les médias avec du son sur votre ordinateur, mais cet audio **n'est pas automatiquement transmis** à travers le flux vidéo vers OBS Studio. C'est le même comportement que vous expérimenteriez avec n'importe quel autre lecteur multimédia.

**Le problème audio n'est pas lié à M³** - c'est une limitation de la façon dont le streaming vidéo d'OBS Studio fonctionne avec Zoom. Le flux vidéo agit comme une caméra virtuelle sans son, tout comme une webcam, vous devez donc configurer explicitement Zoom pour capturer l'audio de l'ordinateur. Cela implique que votre ordinateur a deux cartes son, et si ce n'est pas le cas, vous ne pourrez probablement pas utiliser l'intégration OBS Studio avec succès.

**Solution alternative** : Envisagez d'utiliser l'intégration Zoom à la place, car elle utilise le partage d'écran et audio natif de Zoom, qui gère l'audio plus facilement.

#### Résolution des problèmes audio {#audio-troubleshooting}

**Problèmes courants :**

- **Pas d'audio dans Zoom** : Vérifiez si l'Audio original est activé et correctement configuré
- **Mauvaise qualité audio** : Vérifiez que les trois cases à cocher Audio original sont correctement définies
- **Audio ne fonctionne pas après le redémarrage de Zoom** : Les paramètres Audio original doivent être réactivés pour chaque nouvelle session Zoom

**Meilleures pratiques :**

- Testez la configuration et le partage audio avant les réunions
- Créez une liste de contrôle pour la configuration audio
- Envisagez d'utiliser « Partager le son de l'ordinateur » comme option de secours
- **Envisagez d'utiliser l'intégration Zoom au lieu d'OBS Studio** pour une gestion audio plus simple
- Assurez-vous que tous les opérateurs audiovisuels connaissent ces paramètres

## Import et gestion des médias {#media-import}

### Importer des médias personnalisés {#importing-custom-media}

Ajoutez vos propres fichiers multimédias à M³ :

1. **Import de fichiers** - Utilisez le bouton d'import pour ajouter des vidéos, images ou fichiers audio
2. **Glisser-déposer** - Faites glisser les fichiers directement dans M³
3. **Surveillance de dossiers** - Configurez un dossier surveillé pour les imports automatiques
4. **Fichiers JWPUB et listes de lecture** - Importez des publications et des listes de lecture

### Gérer les médias importés {#managing-imported-media}

- **Organiser par date** - Assignez les médias importés à des dates spécifiques
- **Sections personnalisées** - Créez des sections personnalisées pour l'organisation
- **Modifier les propriétés** - Modifiez les titres, descriptions et timing
- **Supprimer les médias** - Supprimez les éléments multimédias indésirables

### Import de la Bible audio {#audio-bible-import}

Importez des enregistrements audio de versets bibliques :

1. Cliquez sur le bouton « Bible audio »
2. Sélectionnez le livre et le chapitre de la Bible
3. Choisir des versets spécifiques ou des plages de versets
4. Téléchargez les fichiers audio
5. Utilisez-les

## Folder Monitoring and Export {#user-guide-folder-monitoring}

### Configuration de la surveillance de dossiers {#folder-monitoring-setup}

Surveillez un dossier pour les nouveaux fichiers multimédias :

1. **Activer le surveillant de dossier** - Activez la surveillance de dossier dans les paramètres
2. **Sélectionner le dossier** - Choisissez le dossier à surveiller
3. **Import automatique** - Les nouveaux fichiers sont automatiquement ajoutés à M³
4. **Organisation** - Les fichiers sont organisés par date selon la structure du dossier

### Media Export {#user-guide-media-export}

Exportez automatiquement les médias vers des dossiers organisés :

1. **Activer l'export automatique** - Activez l'export des médias dans les paramètres
2. **Sélectionner le dossier d'export** - Choisissez où sauvegarder les fichiers exportés
3. **Organisation automatique** - Les fichiers sont organisés par date et section
4. **Options de format** - Convertissez les fichiers en MP4 pour une meilleure compatibilité

## Présentation du site web {#website-presentation}

### Présenter le site officiel {#presenting-the-website}

Partagez le site officiel sur des écrans externes :

1. **Ouvrir le mode site web** - Cliquez sur le bouton de présentation du site web
2. **Affichage externe** - Le site web s'ouvre dans une nouvelle fenêtre
3. **Navigation** - Utilisez les contrôles du navigateur pour naviguer

### Contrôles du site web {#website-controls}

- **Navigation** - Contrôles de navigation standard du navigateur
- **Actualiser** - Recharger la page actuelle
- **Fermer** - Quitter le mode de présentation du site web

## Advanced Features {#user-guide-advanced-features}

### Multiple Congregations {#user-guide-multiple-congregations}

Gérez plusieurs assemblées locales ou groupes :

1. **Créer des profils** - Configurez des profils séparés pour différentes assemblées locales
2. **Changer de profils** - Utilisez le sélecteur d'assemblée locale pour basculer entre les profils
3. **Paramètres séparés** - Chaque profil a ses propres paramètres et médias
4. **Ressources partagées** - Les fichiers multimédias sont partagés entre les profils dans la mesure du possible

### Raccourcis clavier {#keyboard-shortcuts-guide}

Configurez des raccourcis clavier personnalisés pour une utilisation efficace :

1. **Activer les raccourcis** - Activez les raccourcis clavier dans les paramètres
2. **Configurer les raccourcis** - Configurez des raccourcis pour les actions communes
3. **Pratiquer** - Apprenez vos raccourcis pour une utilisation plus rapide
4. **Personnaliser** - Ajustez les raccourcis selon vos préférences

## Résolution des problèmes {#troubleshooting-guide}

### Problèmes courants {#common-issues}

#### Media Not Downloading {#user-guide-media-not-downloading}

- Vérifiez vos paramètres d'horaire de réunions
- Vérifiez votre connexion Internet
- Vérifiez si les médias sont disponibles dans votre langue sélectionnée

#### OBS Integration Not Working {#user-guide-obs-not-working}

- Vérifiez que le plugin OBS WebSocket est installé
- Vérifiez les paramètres de port et de mot de passe
- Assurez-vous qu'OBS est en cours d'exécution

#### Problèmes audio dans Zoom/OBS {#audio-issues}

- **Pas d'audio dans Zoom** : Activez l'Audio original dans les paramètres Zoom et avant chaque réunion
- **Mauvaise qualité audio** : Vérifiez les trois cases à cocher Audio original (deux premières activées, troisième désactivée)
- **Audio ne fonctionne pas après redémarrage** : L'Audio original doit être réactivé pour chaque nouvelle session Zoom
- **Solution alternative** : Utilisez l'option « Partager le son de l'ordinateur » dans le partage d'écran Zoom

#### Performance Issues {#user-guide-performance-issues}

- Activez le cache supplémentaire
- Réduisez la résolution maximale
- Effacez les anciens fichiers mis en cache
- Vérifiez l'espace disque disponible

#### Language Issues {#user-guide-language-issues}

- Vérifiez le paramètre de langue des médias
- Assurez-vous que la langue est disponible sur JW.org
- Essayez une langue secondaire
- Vérifiez le paramètre de langue de l'interface

### Obtenir de l'aide {#getting-help}

Si vous rencontrez des problèmes :

1. **Vérifiez la documentation** - Consultez ce guide et autre documentation disponible
2. **Recherchez les problèmes** - Cherchez des problèmes similaires sur GitHub
3. **Signalez les problèmes** - Créez un nouveau problème avec des informations détaillées

## Meilleures pratiques {#best-practices}

### Avant les réunions {#before-meetings}

1. **Vérifiez les téléchargements** - Assurez-vous que tous les médias sont téléchargés
2. **Testez l'équipement** - Vérifiez que les écrans et l'audio fonctionnent
3. **Préparez les médias** - Examinez et organisez les médias pour la réunion ; assurez-vous qu'aucun fichier multimédia ne manque
4. **Configurez l'audio** - Pour les réunions hybrides, activez l'Audio original dans Zoom ou configurez « Partager le son de l'ordinateur »

### Pendant les réunions {#during-meetings}

1. **Restez concentré** - Utilisez l'interface épurée et sans distraction
2. **Utilisez les raccourcis** - Maîtrisez les raccourcis clavier pour une utilisation fluide
3. **Surveillez l'audio** - Gardez un œil sur les niveaux de volume, si cela fait partie de vos responsabilités
4. **Soyez préparé** - Ayez le prochain élément multimédia prêt
5. **Vérifiez l'audio** - Pour les réunions hybrides, assurez-vous que les participants Zoom peuvent entendre les médias

### Après les réunions {#after-meetings}

1. **Démarrer la musique de fond** - Démarrez la lecture de la musique de fond
2. **Planifier à l'avance** - Préparez la prochaine réunion en vous assurant que tout est en place
3. **Nettoyer** - Fermez le lecteur multimédia quand vous êtes prêt à partir

### Maintenance régulière {#regular-maintenance}

1. **Mettre à jour M³** - Gardez l'application à jour
2. **Effacer le cache** - Effacez périodiquement les anciens fichiers mis en cache
3. **Vérifier les paramètres** - Examinez et mettez à jour les paramètres selon les besoins
