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

### Tenir des réunions hybrides en utilisant M³, OBS Studio et Zoom

La façon la plus simple de partager des médias lors de réunions hybrides consiste à configurer OBS Studio, M³ et Zoom pour qu'ils travaillent ensemble.

#### Configuration initiale : Ordinateur de la Salle du Royaume

Réglez la résolution du moniteur externe à 1280x720.

Configurez la sortie de la carte de son de l'ordinateur pour aller à l'une des entrées du mixeur de son de la Salle du Royaume et la sortie combinée du mixeur pour aller à l'entrée de la carte de son de l'ordinateur.

#### Configuration initiale : OBS Studio

Installez OBS Studio ou téléchargez la version portable.

Si vous utilisez la version portable d'OBS Studio, installez le plugin [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) , et si vous utilisez la version portable d'OBS Studio, ajoutez la caméra virtuelle à Windows en double-cliquant sur le script d'installation fourni.

If you have OBS Studio v27 or older, you need to install the [obs-websocket](https://github.com/obsproject/obs-websocket) plugin. Otherwise obs-websocket is included. Configure a port number and password for obs-websocket.

In the OBS settings, under `General` > `System Tray`, enable all checkboxes. Under `Output` > `Streaming`, enable a hardware encoder if available. Under `Video` > `Base (Canvas) Resolution` and `Output (Scaled) Resolution`, choose `1280x720`, and under `Downscale Filter`, choose `Bilinear`.

Set up at least 2 scenes: one for the media display (`Window Capture` or `Display Capture` with the mouse cursor disabled and the appropriate window title/monitor selected), and one for the stage view (`Video Capture Device` with the KH camera selected). You may add as many scenes as required, with the camera adjusted, zoomed-in and cropped as needed (lectern view, conductor and reader view, table view, etc.).

Add a shortcut to OBS Studio, with the `--startvirtualcam` parameter, to the Startup folder of the Windows user profile, to ensure that OBS Studio gets started automatically when the user logs in.

#### Initial configuration: Kingdom Hall Zoom

Zoom should be configured to use dual monitors. Enable global keyboard shortcuts for Zoom to mute/unmute the Kingdom Hall audio in Zoom (<kbd>Alt A</kbd>), and start/stop the Kingdom Hall video feed in Zoom (<kbd>Alt V</kbd>).

Set the default "microphone" to be sound booth mixer's combined output (so that everything that is heard over the Kingdom Hall sound system is transmitted over Zoom, including microphones and media) and the "camera" to be the virtual camera provided by OBS Studio.

#### Initial configuration: M³

Enable the `Present media on an external monitor or in a separate window` option.

Enable and configure OBS Studio compatibility mode, using the port and password information configured in the OBS Studio configuration step.

#### Starting the meeting

Start the Zoom meeting, and move the secondary Zoom meeting window to the external monitor. Make it fullscreen if desired. This is where any remote meeting participants will be displayed for the congregation to see.

Once the Zoom meeting is being displayed on the external monitor, open M³. The media presentation window will automatically open on top of Zoom on the external monitor. Sync media if necessary, and enter media controller mode by clicking the ▶️ (play) button on the main screen of M³, or <kbd>Alt D</kbd>.

Enable the Kingdom Hall video feed (<kbd>Alt V</kbd>), and spotlight the Kingdom Hall video feed if necessary so that Zoom participants see the Kingdom Hall stage. Unmute the Kingdom Hall audio feed in Zoom (<kbd>Alt A</kbd>). It should not be necessary to disable the video or audio feed in Zoom for the duration of the meeting.

Start background music playback using the button on the bottom left, or <kbd>Alt K</kbd>.

#### Broadcasting in-person parts from the Kingdom Hall stage over Zoom

No action necessary.

Various camera angles/zoom can be chosen during the meeting by using the menu on the bottom of the M³ media playback control window; this menu will contain a list of all configured camera view scenes in OBS.

#### Sharing media at the Kingdom Hall and over Zoom

Find the media you want to share in the M³ media playback control window, and press the "play" button.

When you're done sharing media, press the "stop" button in M³. Note that videos automatically stop upon completion.

#### Displaying remote Zoom participants on the Kingdom Hall monitor

Press the "hide/show media presentation window" button in the lower right corner of the M³ media controller screen, or <kbd>Alt Z</kbd>, to **hide** the media presentation window. The Zoom meeting will now be visible on the Kingdom Hall monitor.

> If the participant has media to show, follow the steps under the **Sharing media at the Kingdom Hall and over Zoom** subheading.

Once the participant has finished their part, press the "hide/show media presentation window" button in the lower right corner of the M³ media playback control window, or <kbd>Alt Z</kbd>, to **show** the media presentation window. The Kingdom Hall monitor will now show the yeartext.

### Conducting hybrid meetings using only M³ and Zoom

If you do not wish to use OBS Studio for any reason, the following suggestions will perhaps help you to set things up as simply as possible.

#### Initial configuration without OBS: Kingdom Hall computer

Same as corresponding section above. With the addition of the global keyboard shortcut for Zoom for starting/stopping screen sharing (<kbd>Alt S</kbd>). The "camera" will be the camera feed from the Kingdom Hall camera.

#### Initial configuration without OBS: M³

Enable `the Present media on an external monitor or in a separate window` option.

#### Starting the meeting without OBS

Same as corresponding section above.

#### Broadcasting in-person parts from the Kingdom Hall stage over Zoom without OBS

Same as corresponding section above.

#### Sharing media at the Kingdom Hall and over Zoom without OBS

Start sharing in Zoom by hitting <kbd>Alt S</kbd>. In the Zoom sharing window that pops up, choose the external monitor and enable both checkboxes on the bottom left (for sound and video optimization). The yeartext will now be shared over Zoom.

Find the media you want to share in the M³ media playback control window, and press the "play" button.

When you're done sharing media, hit <kbd>Alt S</kbd> to end Zoom screen sharing.

#### Displaying remote Zoom participants on the Kingdom Hall monitor without OBS

Same as corresponding section above.

### Screenshots of Presentation Mode

{% include posts/present-media.md lang=site.data.fr %}
