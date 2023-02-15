---
tag: Utilisation
title: Mode de présentation des médias
ref: present-media
---

### Utiliser le mode de présentation des médias

Le mode de gestion et présentation des médias est conçu pour être simple et éviter les erreurs lors des réunions.

Une fois que l'option `Présenter les médias sur un écran externe ou dans une fenêtre séparée` est activée, l'écran de présentation des médias apparaîtra automatiquement sur le moniteur externe si détecté, ou dans une fenêtre séparée, glissable et redimensionnable si aucun moniteur externe n'a été détecté.

En mode veille, l'écran de présentation des médias affiche l'image d'arrière-plan qui est configurée dans les réglages. Si aucune image d'arrière-plan n'a été configurée, M³ tentera alors de récupérer automatiquement et d'afficher le texte de l'année.

Si aucune image de fond n'est configurée dans les réglages et que le texte de l'année n'a pu être chargé automatiquement, un fond noir sera affiché en mode veille.

Vous pouvez accéder au mode de présentation des médias en cliquant sur le bouton ▶️ (lecture) sur l'écran principal de M³, ou en utilisant le raccourci clavier <kbd>Alt D</kbd>.

Une fois que vous êtes entré en mode présentation, l'écran de sélection de dossier vous permettra de sélectionner la date pour laquelle vous souhaitez afficher les médias. Si un dossier existe avec la date du jour actuel, il sera automatiquement présélectionné. Une fois qu'une date est sélectionnée, vous pouvez modifier la date sélectionnée à tout moment en cliquant sur le bouton de sélection de la date, dans la section supérieure.

### Présentation des médias

Pour lire des médias, appuyez sur le bouton ▶️ (lecture) pour le fichier que vous souhaitez. Pour masquer le média, appuyez sur le bouton ⏹️ (arrêt). Une vidéo peut être reculée ou avancée rapidement lorsqu'elle est sur pause, si désiré. Veuillez noter que pour les vidéos, le bouton d'arrêt doit être appuyé **deux fois** pour arrêter la vidéo. Ceci est pour éviter d'arrêter accidentellement et prématurément une vidéo pendant qu'elle est en cours de lecture devant l'assemblée locale. Une vidéo s'arrête automatiquement lorsqu'elle a été visionné au complet.

### Fonctionnalités supplémentaires

M³ possède quelques fonctionnalités supplémentaires qui peuvent être utiles pour améliorer l'expérience de présentation des médias.

#### Présenter JW.org

Pour présenter JW.org, vous pouvez appuyer sur le bouton ⋮ (ellipse) en haut de l'écran, et sélectionner `Ouvrir JW.org`. Cela ouvrira une nouvelle fenêtre de contrôle avec JW.org chargé. La fenêtre des médias affichera également JW.org. Vous pouvez maintenant utiliser la fenêtre de contrôle pour naviguer sur JW.org, et la fenêtre média affichera vos actions. Lorsque vous avez terminé de présenter JW.org, vous pouvez fermer la fenêtre de contrôle et continuer avec le mode de présentation des médias comme d'habitude.

#### Zoomer et déplacer les images

Lorsqu'une image est affichée, vous pouvez, en survolant l'aperçu de l'image, faire défiler la molette de la souris pour effectuer un zoom avant ou arrière. Vous pouvez également double-cliquer sur l'aperçu de l'image pour effectuer un zoom avant. Un double-clic alterne entre 1.5x, 2x, 3x, 4x et retour au zoom 1x. Vous pouvez également maintenir la souris enfoncée et faire glisser l'image pour déplacer la partie visible.

#### Trier la liste des médias

La liste des médias peut être triée en cliquant sur le bouton de tri en haut à droite de l'écran. Chaque élément média affichera un bouton qui permettra de glisser l'élément vers le haut ou vers le bas dans la liste. Lorsque vous êtes satisfait avec l'ordre, vous pouvez cliquer à nouveau sur le bouton de tri pour verrouiller l'ordre.

#### Ajouter un cantique supplémentaire

Si vous avez besoin d'ajouter un cantique rapidement à la liste des médias, vous pouvez appuyer sur le bouton `♫ +` (ajouter un cantique) en haut de la fenêtre. Une liste déroulante apparaîtra avec une liste de tous les cantiques. Lorsque vous en sélectionnez un, il sera immédiatement ajouté en haut de la liste des médias et peut commencer à être lu immédiatement. Il sera soit diffusé depuis JW.org, ou lu à partir du cache local s'il a été précédemment téléchargé.

### Tenir des réunions hybrides en utilisant M³, OBS Studio et Zoom

La façon la plus simple de partager des médias lors de réunions hybrides consiste à configurer OBS Studio, M³ et Zoom pour qu'ils travaillent ensemble.

#### Configuration initiale : Ordinateur de la Salle du Royaume

Réglez la résolution du moniteur externe à 1280x720.

Configurez la sortie de la carte de son de l'ordinateur pour aller à l'une des entrées du mixeur de son de la Salle du Royaume et la sortie combinée du mixeur pour aller à l'entrée de la carte de son de l'ordinateur.

#### Configuration initiale : OBS Studio

Installez OBS Studio ou téléchargez la version portable.

Si vous utilisez la version portable d'OBS Studio, installez le plugin [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/), et ajoutez la caméra virtuelle à Windows en double-cliquant sur le script d'installation fourni.

Si vous avez OBS Studio v27 ou plus ancien, vous devez installer le plugin [obs-websocket](https://github.com/obsproject/obs-websocket). Sinon, obs-websocket est inclus. Configurez un numéro de port et un mot de passe pour obs-websocket.

Dans les réglages de OBS Studio, sous `Général` > `Zone de notifications`, activez toutes les cases à cocher. Sous `Sortie` > `Streaming`, activez un encodeur matériel si disponible. Sous `Vidéo` > `Résolution de base (zone de travail)` et `Résolution de sortie (mis à l'échelle)`, choisissez `1280x720`, et sous `Filtre de mise à l'échelle`, choisissez `Bilinéaire`.

Configurez au moins 2 scènes : une pour l'affichage des médias (`Capture de fenêtres` ou `Capture de moniteur` avec le curseur de souris désactivé et le titre de fenêtre ou moniteur approprié sélectionné), et un pour la scène avec l'estrade (`Périphérique de capture vidéo` avec la caméra de la Salle du Royaume sélectionnée). Vous pouvez ajouter autant de scènes que nécessaire, la caméra étant ajustée, zoomée et recadrée selon les besoins (vue du pupitre, vue avec conducteur et lecteur ensembles, vue de la table des étudiants, etc.).

Ajoutez un raccourci à OBS Studio, avec le paramètre `--startvirtualcam`, dans le dossier Démarrage du profil d'utilisateur Windows, pour s'assurer que OBS Studio soit démarré automatiquement lorsque l'utilisateur se connecte.

#### Configuration initiale : Zoom de la Salle du Royaume

Zoom doit être configuré pour utiliser plus d'un moniteur. Activez les raccourcis clavier globaux pour Zoom pour activer/désactiver le "microphone" de la Salle du Royaume dans Zoom (<kbd>Alt A</kbd>), et activer/désactiver le flux vidéo de la Salle du Royaume dans Zoom (<kbd>Alt V</kbd>).

Définissez le "microphone" par défaut pour être la sortie combinée du mixeur (pour que tout ce qui est entendu sur le système de son de la Salle du Royaume soit transmis par Zoom, y compris le son des microphones et des médias) et la "caméra" pour être la caméra virtuelle fournie par OBS Studio.

#### Configuration initiale : M³

Activer l'option `Présenter les médias sur un écran externe ou dans une fenêtre séparée`.

Activez et configurez le mode de compatibilité avec OBS Studio, en utilisant les informations de port et de mot de passe configurées dans l'étape de configuration d'OBS Studio.

#### Démarrage de la réunion

Démarrez la réunion Zoom et déplacez la fenêtre de réunion de Zoom secondaire sur le moniteur externe. Rendez-la plein écran si désiré. C'est là que les participants Zoom de la réunion seront affichés pour que l'assemblée locale puisse les voir lorsque nécessaire.

Une fois que la réunion Zoom est affichée sur le moniteur externe, ouvrez M³. La fenêtre de présentation des médias s'ouvrira automatiquement par-dessus Zoom sur le moniteur externe. Synchronisez les médias si nécessaire, et entrer en mode de gestion et présentation des médias en cliquant sur le bouton ▶️ (lecture) sur l'écran principal de M³, ou <kbd>Alt D</kbd>.

Activez le flux vidéo de la Salle du Royaume (<kbd>Alt V</kbd>), et mettez en évidence ("spotlight") le flux vidéo de la Salle du Royaume si nécessaire pour que les participants dans Zoom voient l'estrade de la Salle du Royaume. Activez le flux audio de la Salle du Royaume dans Zoom (<kbd>Alt A</kbd>). Il ne devrait pas être nécessaire de désactiver le flux vidéo ou audio dans Zoom pour la durée de la réunion.

Démarrez la lecture de la musique d'arrière-plan en utilisant le bouton en bas à gauche, ou <kbd>Alt K</kbd>.

#### Diffusion de parties en présentiel à la Salle du Royaume vers Zoom

Aucune action requise.

Différents angles ou scènes de caméra peuvent être choisis pendant la réunion en utilisant le menu en bas de la fenêtre de gestion des médias de M³ ; ce menu contiendra une liste de toutes les scènes de caméra configurées dans OBS.

#### Partage de médias à la Salle du Royaume et sur Zoom

Trouvez le média que vous voulez partager dans la fenêtre de gestion des médias de M³ et appuyez sur le bouton ▶️ (lecture).

Lorsque vous avez terminé de partager le média, appuyez sur le bouton ⏹️ (arrêt). Notez que les vidéos s'arrêtent automatiquement une fois terminées.

#### Affichage des participants Zoom sur le moniteur externe de la Salle du Royaume

Appuyez sur le bouton "masquer/afficher la fenêtre de présentation des médias" dans le coin inférieur droit de l'écran de gestion des médias de M³, ou sur <kbd>Alt Z</kbd>, pour **masquer** la fenêtre de présentation du média. La réunion Zoom sera désormais visible sur le moniteur de la Salle du Royaume.

> Si le participant doit montrer des médias, suivez les étapes sous la sous-rubrique **Partage de médias à la Salle du Royaume et sur Zoom**.

Une fois que le participant a terminé sa partie, appuyez à nouveau sur le bouton "masquer/afficher la fenêtre de présentation des médias" dans le coin inférieur droit de l'écran de gestion des médias de M³, ou sur <kbd>Alt Z</kbd>, pour **afficher** la fenêtre de présentation des médias. Le moniteur de la Salle du Royaume affichera maintenant le texte de l'année.

### Tenir des réunions hybrides en utilisant uniquement M³ et Zoom

Si vous ne souhaitez pas utiliser OBS Studio pour une raison quelconque, les suggestions suivantes vous aideront peut-être à mettre en place un système aussi simple que possible.

#### Configuration initiale sans OBS : Ordinateur de la Salle du Royaume

Identique à la section correspondante ci-dessus. Avec l'ajout du raccourci clavier global pour Zoom pour démarrer/arrêter le partage d'écran (<kbd>Alt S</kbd>). La "caméra" sera le flux de la caméra de la Salle du Royaume.

#### Configuration initiale sans OBS: M³

Activer l'option `Présenter les médias sur un écran externe ou dans une fenêtre séparée`.

#### Démarrage de la réunion sans OBS

Identique à la section correspondante ci-dessus.

#### Diffusion de parties en présentiel à la Salle du Royaume vers Zoom sans OBS

Identique à la section correspondante ci-dessus.

#### Partage de médias à la Salle du Royaume et sur Zoom sans OBS

Commencez le partage dans Zoom en appuyant sur <kbd>Alt S</kbd>. Dans la fenêtre de partage de Zoom qui apparaît, choisissez le moniteur externe et activez les deux cases à cocher en bas à gauche (pour l'optimisation du son et de la vidéo). Le texte de l'année sera maintenant partagé sur Zoom.

Trouvez le média que vous voulez partager dans la fenêtre de gestion des médias de M³ et appuyez sur le bouton ▶️ (lecture).

Lorsque vous avez terminé de partager le média, appuyez sur <kbd>Alt S</kbd> pour terminer le partage d'écran Zoom.

#### Affichage des participants Zoom sur le moniteur externe de la Salle du Royaume sans OBS

Identique à la section correspondante ci-dessus.

### Captures d'écran du mode de présentation des médias

{% include screenshots/present-media.html lang=site.data.fr %}
