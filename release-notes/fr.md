<!-- markdownlint-disable no-duplicate-heading -->

# Quoi de neuf

Pour la liste complète des changements entre les versions, consultez notre fichier CHANGELOG.md sur GitHub.

## v25.10.1

### ✨ Nouvelles fonctionnalités

- ✨ **Assistant de configuration – Étape Zoom** : ajout d'une étape d'intégration Zoom à l'assistant de configuration pour faciliter la configuration initiale.
- ✨ **Améliorations apportées au sélecteur d'écran** : Affiche une représentation visuelle fidèle de tous les écrans, ainsi que la taille et l'emplacement actuels de la fenêtre principale, dans la fenêtre contextuelle d'affichage. Cela facilite le choix de l'écran sur lequel la fenêtre multimédia devrait s'afficher.
- ✨ **Préférence d'écran pour la fenêtre multimédia** : L'application mémorisera désormais l'écran préféré sur lequel la fenêtre multimédia devrait s'afficher, si l'utilisateur l'a spécifié.

## v25.10.0

### ✨ Nouvelles fonctionnalités

- ✨ **Démarrer la lecture en mode pause** : Ajout d'un nouveau paramètre permettant de démarrer la lecture en mode pause, ce qui peut être utile aux opérateurs audiovisuels, afin qu'ils puissent se préparer (par exemple, démarrer le partage Zoom) avant que le média ne commence à être lu dans la fenêtre multimédia.
- ✨ **Notifications de mise à jour** : Les utilisateurs seront désormais informés des mises à jour via une bannière intégrée à l'application, qui leur permettra également d'installer les mises à jour immédiatement, sans avoir à attendre le prochain redémarrage de l'application.
- ✨ **Événements personnalisés** : Ajout d'un système d'événements pouvant déclencher des raccourcis clavier lorsque certains événements sont détectés. Cela peut être utile pour les opérateurs audiovisuels afin d'exécuter automatiquement des actions en dehors de l'application. Par exemple, des lumières intelligentes pourraient être allumées et éteintes avant et après la lecture de médias dans les auditoriums où des projecteurs sont utilisés ; ou bien un script pourrait être lancé après la lecture du dernier cantique d'une réunion afin d'automatiser diverses actions dans une réunion Zoom.

## v25.9.1

### ✨ Nouvelles fonctionnalités

- ✨ **Comportement de la fenêtre multimédia** : correction et amélioration du comportement « toujours au premier plan » de la fenêtre multimédia, qui s'ajuste désormais dynamiquement en fonction du mode plein écran.
- ✨ **Paramètre d'affichage de la date** : ajout d'un paramètre utilisateur permettant de configurer le format d'affichage de la date.
- ✨ **Transition en fondu enchaîné pour les médias** : mise en place de transitions en fondu enchaîné pour l'affichage des médias, au lieu de la transition plus brusque qui était présente auparavant.
- ✨ **Arrêt automatique de la musique** : Optimisation du comportement de l'arrêt automatique de la musique de fond afin qu'il se comporte de la même manière, que la musique ait été lancée automatiquement ou non.
- ✨ **Clics sur les fenêtres inactives sous macOS** : désormais, les clics de souris sont pris en charge dans la fenêtre principale sous macOS même si elle n'est pas au premier plan, ce qui devrait faciliter le contrôle de l'application.

## v25.9.0

### ✨ Nouvelles fonctionnalités

- ✨ **Améliorations de la fenêtre contextuelle de téléchargements** : Ajout d'un bouton d'actualisation et regroupement des téléchargements par date dans la fenêtre contextuelle de téléchargements.
- ✨ **Mémorisation de l'ordre des médias** : Ajout de la mémorisation de l'ordre des éléments multimédias de dossiers surveillés.

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
- 🔄 **Corriger les problèmes de synchronisation et de plantage** : résoudre divers problèmes liés à la synchronisation et à la stabilité pour améliorer la fiabilité.
- 📜 **Afficher les notes de version pour les assemblées locales existantes** : S'assurer que les notes de publication ne sont affichées que pour les congrégations déjà chargées.

## 25.3.0

### ✨ Nouvelles fonctionnalités

- 🎵 **Jouer de la musique de fond avec des vidéos** : Permettre à la musique de fond de continuer à jouer pendant que des vidéos sont visionnées.
- 🎥 **Feed de la caméra pour les médias en langue des signes** : Ajoute la possibilité d'afficher un flux de caméra sur la fenêtre multimédia spécifiquement pour les réunions en langue des signes.
- 📅 **Date et fond pour mémorial** : Détecte et définit automatiquement la date du mémorial et prépare l'image de fond pour le mémorial.
- 📜 **Afficher les notes de version dans l'application** : afficher les notes de version directement dans l'application afin que les utilisateurs puissent facilement revoir les changements après une mise à jour.

### 🛠️ Améliorations et ajustements

- ⚡ **Optimiser le nettoyage intelligent du cache** : Améliore le mécanisme intelligent de nettoyage du cache pour une meilleure performance et efficacité.
- 📂 **Visite du responsable** : S'assurer que les médias pour la visite du responsable de circonscription sont placés dans la bonne section.
- 📅 **Exclure les médias de réunions régulières pour le mémorial** : Empêcher la tentative de récupération des médias de réunions normales pendant la semaine du mémorial pour éviter des erreurs.
- 📅 **Cacher les sections de réunions régulières pendant le mémorial** : cacher les sections de réunions non utilisées pendant le mémorial pour une mise en page plus propre.
- 📖 **Correction des téléchargements de la Bible en langue des signes** : Télécharger correctement les vidéos de la Bible en langue des signes à partir de listes de lecture.
