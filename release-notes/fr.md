<!-- markdownlint-disable no-duplicate-heading -->

# Quoi de neuf

Pour la liste complète des changements entre les versions, consultez notre fichier CHANGELOG.md sur GitHub.

## v25.8.3

### ✨ Nouvelles fonctionnalités

- ✨ **Transitions en fondu de la fenêtre multimédia** : Ajout d'un nouveau paramètre avancé pour faire apparaître et disparaître la fenêtre multimédia en fondu, offrant des transitions visuelles plus fluides.
- ✨ **Contrôle de la durée des images et suivi de la progression** : Ajout du contrôle de la durée des images et des capacités de suivi de la progression pour les sections répétées.

## v25.8.1

### ✨ Nouvelles fonctionnalités

- ✨ **Sections de médias personnalisées** : Système complet pour créer, modifier et gérer des sections de médias personnalisées avec personnalisation des couleurs et réorganisation par glisser-déposer.
- ✨ **Séparateurs de médias** : Ajoutez des séparateurs titrés dans les listes de médias pour une meilleure organisation avec des options de positionnement haut/bas.
- ✨ **Mode de répétition de section** : Activez la lecture en boucle dans des sections spécifiques pour des boucles de médias fluides.
- ✨ **Intégration Zoom** : Coordination automatique du démarrage/arrêt du partage d'écran avec la lecture des médias.

### 🛠️ Améliorations et ajustements

- 🛠️ **En-têtes de section améliorés** : Nouveau système de menu à trois points avec sélecteur de couleur, contrôles de déplacement haut/bas, options de répétition et fonctionnalité de suppression.
- ✨ **Édition de titre en ligne** : Modifiez les titres des éléments multimédias directement dans l'interface sans ouvrir de boîtes de dialogue séparées.
- 🛠️ **Navigation améliorée** : Meilleurs raccourcis clavier avec fonctionnalité de défilement vers la sélection et navigation multimédia améliorée.
- 🛠️ **Améliorations visuelles** : Support d'animation pendant les opérations de tri et retour visuel amélioré du glisser-déposer.

## 25.6.0

### ✨ Nouvelles fonctionnalités

- ✨ **Paramètre de connexion limitée** : Ajout d'un nouveau paramètre pour réduire l'utilisation de la bande passante de téléchargement sur les connexions limitées.
- ✨ **Gestion améliorée des médias diffusés** : Meilleur support pour les médias diffusés, réduisant les problèmes liés à la latence.

### 🛠️ Améliorations et ajustements

- 🛠️ **Meilleure gestion des types MIME** : Support amélioré des types MIME pour une meilleure compatibilité des médias.
- 🛠️ **Tiroir de navigation amélioré** : Gestion améliorée de l'état mini et ajout de l'affichage des infobulles pour une meilleure navigation utilisateur.
- 🛠️ **Compatibilité Linux** : Utilisation forcée de GTK 3 sur Linux pour éviter les problèmes d'interface et de lancement.

## 25.5.0

### ✨ Nouvelles fonctionnalités

- 🖼️ **Option de délai OBS pour les images** : Ajout d'un paramètre OBS Studio pour retarder les changements de scène lors de l'affichage d'images, améliorant les transitions.
- 🔊 **Support du format audio `.m4a`** : Ajout de la compatibilité pour les fichiers audio `.m4a` pour étendre les types de médias pris en charge.

### 🛠️ Améliorations et ajustements

- 🔍 **Restaurer le zoom avec `Ctrl` + `Défilement`** : Réactiver le zoom immédiat avec le geste contrôle + défilement pour une navigation plus facile.
- 👤 **Masquer les médias CO inutilisés** : Masquer plutôt que d'ignorer les médias inutilisés pour les visites du responsable de circonscription pour maintenir une présentation plus propre.
- 🎵 **Améliorer l'indicateur de cantique en double** : Améliorer l'indice visuel pour les cantiques en double pour les rendre plus faciles à identifier.

## 25.4.3

### 🛠️ Améliorations et ajustements

- ➕ **Nettoyer les médias de v25.4.x** : Nettoyer automatiquement les médias orphelins ou mal placés de v25.4.1 à v25.4.2 pour s'assurer qu'aucun média ne manque ou n'est au mauvais endroit dans la liste des médias.

## 25.4.2

### 🛠️ Améliorations et ajustements

- ➕ **Prévenir les médias en double** : Éviter d'ajouter plusieurs fois certains éléments multimédias à la liste des médias.

## 25.4.1

### 🛠️ Améliorations et ajustements

- 🎬 **Corriger l'assignation des temps de début/fin personnalisés** : Empêcher les temps de début et de fin personnalisés d'être incorrectement appliqués à la mauvaise vidéo.
- 📝 **Permettre les sous-titres non assortis** : Permettre l'utilisation de sous-titres même lorsqu'ils ne correspondent pas parfaitement au fichier multimédia.
- 🪟 **Désactiver les coins arrondis sur Windows** : Supprimer les coins arrondis pour la fenêtre multimédia sur Windows.
- 🖼 **Inclure les images non référencées dans la liste des médias** : S'assurer que toutes les images non référencées sont ajoutées à la liste des médias pour la complétude.
- ➕ **Prévenir les sections de médias en double** : Éviter de créer plusieurs sections de médias pour le même élément multimédia.
- 📥 **Préserver l'ordre de la liste de lecture lors de l'import** : Maintenir l'ordre original des listes de lecture JWL pendant le processus d'import.

## 25.4.0

### ✨ Nouvelles fonctionnalités

- 🇵🇭 **Nouvelle langue : Tagalog** : Ajout du support pour le tagalog, étendant les capacités multilingues de l'application.
- 🎞 **Support du format vidéo `.m4v`** : Support maintenant la lecture des fichiers `.m4v` pour améliorer la compatibilité des médias.

### 🛠️ Améliorations et ajustements

- 🎬 **Temps de début/fin multiples pour une seule vidéo** : Permettre à une seule vidéo d'apparaître plusieurs fois dans la liste des médias avec différents temps de début/fin personnalisés.
- 📤 **Inclure les médias groupés dans l'export automatique** : Exporter automatiquement les éléments multimédias groupés avec les autres.
- 📡 **Corriger la récupération `.m4v` depuis l'API JW** : S'assurer que les fichiers `.m4v` sont correctement récupérés depuis l'API JW.

## 25.3.1

### ✨ Nouvelles fonctionnalités

- 🌏 **Nouvelle langue : Coréen** : Ajout du support pour la langue coréenne, étendant l'accessibilité pour plus d'utilisateurs.

### 🛠️ Améliorations et ajustements

- ⚡ **Améliorer les performances et l'utilisation du CPU** : Optimiser les performances pour réduire l'utilisation du CPU et améliorer l'efficacité.
- 🔄 **Fix Synchronization & Crash Issues**: Resolve various sync-related and stability issues to improve reliability.
- 📜 **Show Release Notes for Existing Congregations**: Ensure release notes are only displayed for congregations that are already loaded.

## 25.3.0

### ✨ Nouvelles fonctionnalités

- 🎵 **Play Background Music with Videos**: Allow background music to continue playing while videos are being viewed.
- 🎥 **Camera Feed for Sign Language Media**: Add the ability to display a camera feed on the media window specifically for sign language users.
- 📅 **Automatic Memorial Date & Background**: Automatically detect and set the Memorial date and prepare the Memorial background image.
- 📜 **Show Release Notes In-App**: Display release notes directly in the application so users can easily review changes after an update.

### 🛠️ Améliorations et ajustements

- ⚡ **Optimize Smart Cache Clearing**: Improve the smart cache-clearing mechanism for better performance and efficiency.
- 📂 **Correct Circuit Overseer Media Placement**: Ensure Circuit Overseer media is placed in the correct section.
- 📅 **Exclude Regular Meeting Media for Memorial**: Prevent fetching standard meeting media for the Memorial to prevent errors.
- 📅 **Hide Regular Meeting Sections on Memorial**: Remove unnecessary meeting sections during the Memorial event for a cleaner layout.
- 📖 **Fix Sign Language Bible Video Downloads**: Correctly download Sign Language Bible chapter videos from JWL playlists.
