---
tag: Aide
title: Notes techniques
ref: usage-notes
---

L'application devrait fonctionner tel quel sur la plupart des ordinateurs modernes sous Windows, Linux ou macOS.

### Windows : Installation et premier lancement

Lors de l'ouverture de l'installateur, vous pourriez avoir une [erreur](assets/img/other/win-smartscreen.png) indiquant que « Windows SmartScreen a empêché une application non reconnue de démarrer ». Ceci est dû au fait que l'application n'a pas un nombre élevé de téléchargements, et par conséquent n'est pas explicitement "reconnue" par Windows. Pour contourner ce problème, cliquez simplement sur "Plus d'infos", puis "Exécuter quand même".

### Linux : Installation et premier lancement

Conformément à la documentation officielle de [AppImage](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), si l'application ne s'ouvre pas correctement, confirmez le résultat de la commande suivante :

`sysctl kernel.unprivileged_userns_clone`

Si le résultat est `0`, alors l'AppImage **ne fonctionnera pas**, à moins que vous n'exécutiez la commande suivante, suivie d'un redémarrage :

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Assurez-vous de lire sur [ce que cela implique](https://lwn.net/Articles/673597/) avant de le faire.

### macOS : Installation et premier lancement

Si au lancement de l'application, vous recevez un avertissement indiquant que l'application ne peut pas être ouverte, soit parce que "elle n'a pas été téléchargée depuis l'App Store" ou parce que "le développeur ne peut pas être vérifié", alors cette [page de support Apple](https://support.apple.com/en-ca/HT202491) vous aidera à passer outre cela.

Si vous recevez un message indiquant que vous "n'avez pas la permission d'ouvrir l'application", essayez d'appliquer quelques-unes des suggestions que l'on peut retrouver sur [cette page-ci](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860) par exemple l'exécution de la commande suivante dans `Terminal.app` :

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS : Problèmes avec les permissions audio ou de microphone dans macOS Sonoma

Depuis macOS Sonoma, certains utilisateurs rencontrent un problème où M³ affiche à plusieurs reprises un message d'erreur indiquant qu'il a besoin d'accéder au microphone. L'exécution de la commande suivante dans `Terminal.app` a résolu le problème pour certains :

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS : Mise à jour automatique de l'application

Contrairement à Windows et Linux, la fonctionnalité de mise à jour automatique **n'est pas implémentée** sur macOS, et pour des raisons techniques probablement ne le sera jamais. Cependant, une des deux choses suivantes se passera pour les utilisateurs de macOS lorsqu'une mise à jour sera disponible :

- M³ tentera de télécharger le paquet de mise à jour et l'ouvrira automatiquement, après quoi l'utilisateur devra terminer manuellement l'installation de la mise à jour de M³ en glissant/déposant l'application mise à jour dans son dossier Applications. Ensuite, ils pourront lancer le M³ mis à jour à partir de leur dossier Applications comme d'habitude.
- Si l'étape précédente échoue, M³ affichera une notification indiquant qu'une mise à jour est disponible, avec un lien vers la mise à jour elle-même. Une notification rouge clignotante s'affichera également sur le bouton Réglages de l'écran principal de M³. Le numéro de version M³ dans l'écran des réglages se transformera en un bouton qui, une fois cliqué, ouvrira automatiquement la page de téléchargement de la dernière version.
