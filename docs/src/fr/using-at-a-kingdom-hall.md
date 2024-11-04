# Utiliser M³ dans une salle du Royaume

Ce guide vous guidera dans le processus de téléchargement, d'installation et de configuration de **Meeting Media Manager (M³)** dans une salle du Royaume. Suivez les étapes suivantes pour assurer une configuration optimale pour la gestion des médias pendant les réunions de l'assemblée locale.

## 1. Téléchargement et installation

1. Visitez la [page de téléchargement de M³](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Téléchargez la version appropriée pour votre système d'exploitation (Windows, macOS ou Linux).
3. Ouvrez le programme d'installation et suivez les instructions à l'écran pour installer M³.
4. Lancez M³.
5. Parcourez l'assistant de configuration.

### Additional steps for macOS Users

Due to Apple's security measures, a few additional steps are required to run M³ on modern macOS systems.

First, run the following two commands in Terminal (modify the path to M³ as needed):

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::tip Explanation

These commands do two things that will prevent M³ from being detected as a malicious application on your system: the first one signs the application's code locally, and the second one removes the quarantine flag from the application. The quarantine flag is used to warn users about applications that have been downloaded from the internet.

:::

If you are still unable to launch M³ after entering the two commands, please try the following:

1. Open the macOS system **Privacy & Security** settings.
2. Find the entry for M³ and click the button to **Open Anyway**.
3. You will then be warned again, and given the advice to not "open this unless you are certain it is from a trustworthy source." Click **Open Anyway**.
4. Another warning will appear, where you’ll need to authenticate to launch the app.
5. M³ should now launch successfully.

If you still have issues after following all these steps, please [open an issue on GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). We will do our best to help.

## 2. Assistant de configuration

### Langue d'affichage

Lors du premier lancement de M³, vous serez invité à choisir votre **langue d'affichage** désirée. Choisissez la langue que vous voulez que M³ utilise pour son interface.

:::tip Astuce

Ce n'est pas nécessairement la même langue que celle dans laquelle M³ va télécharger les médias. La langue pour les téléchargements de médias est configurée ultérieurement.

:::

### Type de profil

L'étape suivante est de choisir un **type de profil**. Pour une installation régulière dans une salle du Royaume, choisissez **Régulier**. Cela configurera de nombreuses fonctionnalités qui sont couramment utilisées pour les réunions d'assemblées locales.

:::warning Avertissement

Vous ne devriez choisir **Autre** que si vous créez un profil pour lequel aucun média ne devrait être automatiquement téléchargé. Les médias devront être importés manuellement pour être utilisés dans ce profil. Ce type de profil est principalement utilisé pour utiliser M³ lors d'écoles théocratiques, des assemblées et d'autres événements spéciaux.

Le type de profil **Autre** est rarement utilisé. **Pour une utilisation normale lors des réunions d'assemblée locale, veuillez choisir _Régulier_.**

:::

### Recherche automatique d'assemblée locale

M³ peut tenter de trouver automatiquement le calendrier des réunions, la langue utilisée et le nom de votre assemblée locale.

Pour ce faire, utilisez le bouton **Recherche d'assemblée locale** à côté du champ de nom de l'assemblée. Entrez au moins une partie du nom et de la ville de l'assemblée.

Une fois que l'assemblée désirée est trouvée et sélectionnée, M³ préremplira toutes les informations disponibles, comme le **nom** de votre assemblée, la **langue des réunions**, et les **jours et heures des réunions**.

:::info Note

Cette recherche utilise des données publiques disponibles sur le site officiel des Témoins de Jéhovah.

:::

### Saisie manuelle des informations de l'assemblée

Si la recherche automatique n'a pas trouvé votre assemblée locale, vous pouvez bien sûr entrer manuellement les informations requises. L'assistant vous permettra de réviser et/ou d'entrer le **nom** de votre assemblée locale, la **langue des réunions**, et les **jours et heures des réunions**.

### Mise en cache des cantiques en format vidéo

Vous aurez également la possibilité de **mettre en cache toutes les vidéos des cantiques**. Cette option pré-télécharge toutes les vidéos pour les cantiques, réduisant ainsi le temps nécessaire pour récupérer les médias pour les réunions à l'avenir.

- **Avantages :** Les médias de réunion seront disponibles beaucoup plus rapidement.
- **Désavantages :** La taille du cache multimédia augmentera significativement, d’environ 5 Go.

:::tip Astuce

Si l'ordinateur de votre salle de Royaume a suffisamment d'espace de stockage, il est recommandé **d'activer** cette option, question de performances.

:::

### Configuration de l’intégration avec OBS Studio (facultatif)

Si votre salle de Royaume utilise **OBS Studio** pour diffuser les réunions sur Zoom, M³ peut automatiquement s'intégrer avec ce programme. Lors du paramétrage initial, vous pouvez configurer l'intégration avec OBS Studio en entrant ce qui suit :

- **Port :** Le numéro de port utilisé pour se connecter au plugin Websocket d'OBS Studio.
- **Mot de passe :** Le mot de passe utilisé pour se connecter au plugin Websocket d'OBS Studio.
- **Scènes :** Les scènes de OBS Studio qui seront utilisées lors de présentations des médias. Vous aurez besoin d'une scène qui capture la fenêtre ou l'écran où les médias s'affichent, et d'une scène qui montre l'estrade.

:::tip Astuce

Si votre assemblée locale tient régulièrement des réunions hybrides, il est **fortement recommandé** d'activer l'intégration avec OBS Studio.

:::

## 3. Amusez-vous avec M³

Une fois l'assistant d'installation terminé, M³ est prêt à vous aider à gérer et à présenter les médias pour les réunions d'assemblée locale. Profitez bien de l'application ! :tada:
