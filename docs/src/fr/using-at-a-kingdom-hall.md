# Utilisation de M³ dans une salle du Royaume {#using-m3-at-a-kingdom-hall}

Ce guide vous guidera dans le processus de téléchargement, d'installation et de configuration de **Meeting Media Manager (M³)** dans une salle du Royaume. Suivez les étapes suivantes pour assurer une configuration optimale pour la gestion des médias pendant les réunions de l'assemblée locale.

## 1. Téléchargement et installation {#download-and-install}

1. Visitez la [page de téléchargement de M³](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Téléchargez la version appropriée pour votre système d'exploitation :
   - **Windows:**
     - Pour la plupart des systèmes Windows, téléchargez `meeting-media-manager-[VERSION]-x64.exe`.
     - Pour les systèmes Windows 32 bits plus anciens, téléchargez `meeting-media-manager-[VERSION]-ia32.exe`.
   - **macOS:**
     - **Série M (Puce Apple)** : Téléchargez `meeting-media-manager-[VERSION]-arm64.dmg`.
     - **Macs à processeur Intel**: Téléchargez `meeting-media-manager-[VERSION]-x64.dmg`.
   - **Linux:**
     - Téléchargez `meeting-media-manager-[VERSION]-x86_64.AppImage`.
3. Ouvrez le programme d'installation et suivez les instructions à l'écran pour installer M³.
4. Lancez M³.
5. Parcourez l'assistant de configuration.

### macOS only: Additional installation steps {#additional-steps-for-macos-users}

:::warning Avertissement

This section only applies to macOS users.

:::

Due to Apple's security measures, a few additional steps are required to run the installed M³ app on modern macOS systems.

Run the following two commands in Terminal, modifying the path to M³ as needed:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Avertissement

As a macOS user, you will need to follow these steps every time you install or update M³.

:::

:::info Explication

The first command _signs the application's code_. This is required to prevent M³ from being detected as a malicious application from an unknown developer.

The second command _removes the quarantine flag_ from the application. The quarantine flag is used to warn users about potentially malicious applications that have been downloaded from the internet.

:::

#### Alternative method {#alternative-method-for-macos-users}

If you are still unable to launch M³ after entering the two commands from the previous section, please try the following:

1. Ouvrez les paramètres système de macOS à la section **Confidentialité et sécurité**.
2. Trouvez M³ et cliquez sur le bouton pour **Ouvrir quand même**.
3. Vous serez alors à nouveau averti et conseillé de ne pas « l'ouvrir à moins que vous ne soyez certain qu'elle provient d'une source digne de confiance ». Cliquez sur **Ouvrir quand même**.
4. Une autre alerte apparaîtra où vous devrez vous authentifier pour lancer l'application.
5. M³ devrait maintenant se lancer avec succès.

Si vous avez toujours des problèmes après avoir suivi toutes ces étapes, veuillez [ouvrir un ticket sur GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). Nous ferons de notre mieux pour vous aider.

### macOS only: Re-enabling website presentation after updates {#screen-sharing-issues}

:::warning Avertissement

This section only applies to macOS users.

:::

Some macOS users have reported that website presentation no longer works after installing updates to M³.

If the media window is black when presenting the website after updating M³, try the following steps:

1. Ouvrez les paramètres système de macOS à la section **Confidentialité et sécurité**.
2. Go to **Screen Recording**.
3. Select M³ in the list.
4. Click the `-` (minus) button to remove it.
5. Click the `+` (plus) button and select M³ from the Applications folder.
6. You may be prompted to relaunch M³ to apply the change.

After these steps, screen sharing should function as expected once again.

:::tip Astuce

These steps are optional and can be skipped if you do not plan to use the website presentation feature. On the other hand, if you do plan to use the website presentation feature, it is recommended to follow these steps after every update to ensure the feature works as expected.

:::

## 2. Assistant de configuration {#configuration-wizard}

### Langue d'affichage de l'application {#app-display-language}

Lors du premier lancement de M³, vous serez invité à choisir votre **langue d'affichage** désirée. Choisissez la langue que vous voulez que M³ utilise pour son interface.

:::tip Astuce

Ce n'est pas nécessairement la même langue que celle dans laquelle M³ va télécharger les médias. La langue pour les téléchargements de médias est configurée ultérieurement.

:::

### Type de profil {#profile-type}

L'étape suivante est de choisir un **type de profil**. Pour une installation régulière dans une salle du Royaume, choisissez **Régulier**. Cela configurera de nombreuses fonctionnalités qui sont couramment utilisées pour les réunions d'assemblées locales.

:::warning Avertissement

Vous ne devriez choisir **Autre** que si vous créez un profil pour lequel aucun média ne devrait être automatiquement téléchargé. Les médias devront être importés manuellement pour être utilisés dans ce profil. Ce type de profil est principalement utilisé pour utiliser M³ lors d'écoles théocratiques, des assemblées et d'autres événements spéciaux.

Le type de profil **Autre** est rarement utilisé. **Pour une utilisation normale lors des réunions d'assemblée locale, veuillez choisir _Régulier_.**

:::

### Recherche automatique d'assemblée locale {#automatic-congregation-lookup}

M³ peut tenter de trouver automatiquement le calendrier des réunions, la langue utilisée et le nom de votre assemblée locale.

Pour ce faire, utilisez le bouton **Recherche d'assemblée locale** à côté du champ de nom de l'assemblée. Entrez au moins une partie du nom et de la ville de l'assemblée.

Une fois que l'assemblée désirée est trouvée et sélectionnée, M³ préremplira toutes les informations disponibles, comme le **nom** de votre assemblée, la **langue des réunions**, et les **jours et heures des réunions**.

:::info Note

Cette recherche utilise des données publiques disponibles sur le site officiel des Témoins de Jéhovah.

:::

### Saisie manuelle des informations de l'assemblée locale {#manual-entry-of-congregation-information}

Si la recherche automatique n'a pas trouvé votre assemblée locale, vous pouvez bien sûr entrer manuellement les informations requises. L'assistant vous permettra de réviser et/ou d'entrer le **nom** de votre assemblée locale, la **langue des réunions**, et les **jours et heures des réunions**.

### Mise en cache des vidéos pour cantiques {#caching-videos-from-the-songbook}

Vous aurez également la possibilité de **mettre en cache toutes les vidéos des cantiques**. Cette option pré-télécharge toutes les vidéos pour les cantiques, réduisant ainsi le temps nécessaire pour récupérer les médias pour les réunions à l'avenir.

- **Avantages :** Les médias de réunion seront disponibles beaucoup plus rapidement.
- **Désavantages :** La taille du cache multimédia augmentera significativement, d’environ 5 Go.

:::tip Astuce

Si l'ordinateur de votre salle de Royaume a suffisamment d'espace de stockage, il est recommandé **d'activer** cette option, question de performances.

:::

### Configuration de l’intégration avec OBS Studio (facultatif) {#obs-studio-integration-configuration}

Si votre salle de Royaume utilise **OBS Studio** pour diffuser les réunions sur Zoom, M³ peut automatiquement s'intégrer avec ce programme. Lors du paramétrage initial, vous pouvez configurer l'intégration avec OBS Studio en entrant ce qui suit :

- **Port :** Le numéro de port utilisé pour se connecter au plugin Websocket d'OBS Studio.
- **Mot de passe :** Le mot de passe utilisé pour se connecter au plugin Websocket d'OBS Studio.
- **Scènes :** Les scènes de OBS Studio qui seront utilisées lors de présentations des médias. Vous aurez besoin d'une scène qui capture la fenêtre ou l'écran où les médias s'affichent, et d'une scène qui montre l'estrade.

:::tip Astuce

Si votre assemblée locale tient régulièrement des réunions hybrides, il est **fortement recommandé** d'activer l'intégration avec OBS Studio.

:::

## 3. Amusez-vous avec M³ {#enjoy-using-m3}

Une fois l'assistant d'installation terminé, M³ est prêt à vous aider à gérer et à présenter les médias pour les réunions d'assemblée locale. Profitez bien de l'application ! :tada:
