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

### Extra Features

M³ has a few extra features that can be used to enhance the media presentation experience.

#### Present JW.org

To present JW.org, you can press the ⋮ (ellipsis) button at the top of the screen, and select `Open JW.org`. This will open a new controller window with JW.org loaded. The media window will also display JW.org. Now you can use the controller window to navigate JW.org, and the media window will display your actions. When you are done presenting JW.org, you can close the controller window, and continue with the normal media presentation mode.

#### Zoom and pan images

When an image is being displayed, you can scroll the mouse wheel while hovering over the image preview to zoom in and out. Alternatively, you can also double click on the image preview to zoom in. Double clicking will alternate between 1.5x, 2x, 3x, 4x and back to 1x zoom. You can also hold and drag the image to pan around the image.

#### Sort the media list

The media list can be sorted by clicking the sort button at the top right of the screen. The media items will have a button appear next to them that can be used to drag the media item up or down in the list. When you are satisfied with the order, you can click the sort button again to lock the order.

#### Add a last-minute song

If you need to add a last-minute song to the media list, you can press the `♫ +` (add song) button at the top of the screen. A dropdown will appear with a list of all the Kingdom songs. When you select one, it will immediately be added to the top of the media list and it can be played instantly. It will either stream the song from JW.org, or play the song from the local cache if it was previously downloaded.

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
