<!-- markdownlint-disable no-inline-html -->

# Utilisation de M³ dans une salle du Royaume {#using-m3-at-a-kingdom-hall}

Ce guide vous guidera dans le processus de téléchargement, d'installation et de configuration de **Meeting Media Manager (M³)** dans une salle du Royaume. Suivez les étapes suivantes pour assurer une configuration optimale pour la gestion des médias pendant les réunions de l'assemblée locale.

## 1. Téléchargement et installation {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. Téléchargez la version appropriée pour votre système d'exploitation :
  - **Windows:**
    - Pour la plupart des systèmes Windows, téléchargez <a :href="data.win64">meeting-media-manager-[VERSION]-x64.exe</a>.
    - Pour les systèmes Windows 32 bits plus anciens, téléchargez <a :href="data.win32">meeting-media-manager-[VERSION]-ia32.exe</a>.
    - Pour une version portable, téléchargez <a :href="data.winPortable">meeting-media-manager-[VERSION]-portable.exe</a>.
  - **macOS:**
    - **Série M (Puce Apple)** : Téléchargez <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a>.
    - **Macs à processeur Intel**: Téléchargez <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a>.
  - **Linux:**
    - Téléchargez <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a>.
2. Si les liens de téléchargement ne fonctionnent pas, visitez la [page de téléchargement M³](https://github.com/sircharlo/meeting-media-manager/releases/latest) et téléchargez la bonne version manuellement.
3. Ouvrez le programme d'installation et suivez les instructions à l'écran pour installer M³.
4. Lancez M³.
5. Parcourez l'assistant de configuration.

### macOS uniquement : Étapes d'installation supplémentaires {#additional-steps-for-macos-users}

:::warning Avertissement

Cette section s'applique uniquement aux utilisateurs de macOS.

:::

En raison des mesures de sécurité mises en place par Apple, quelques étapes supplémentaires sont nécessaires pour exécuter l'application M³ sur des systèmes macOS modernes.

Exécutez les deux commandes suivantes dans Terminal, en modifiant le chemin vers M³ si nécessaire :

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Avertissement

En tant qu'utilisateur macOS, vous devrez suivre ces étapes chaque fois que vous installez ou mettez à jour M³.

:::

:::info Explication

La première commande _signe le code de l'application_. Ceci est nécessaire pour éviter que M³ ne soit détectée comme une application malveillante d'un développeur inconnu.

La deuxième commande _supprime l'indicateur de quarantaine_ de l'application. L'indicateur de quarantaine est utilisé pour avertir un utilisateur qu'une application potentiellement malveillante a été téléchargée à partir d'Internet.

:::

#### Méthode alternative {#alternative-method-for-macos-users}

Si vous ne parvenez toujours pas à lancer M³ après avoir entré les deux commandes de la section précédente, essayez ce qui suit :

1. Ouvrez les paramètres système de macOS à la section **Confidentialité et sécurité**.
2. Trouvez M³ et cliquez sur le bouton pour **Ouvrir quand même**.
3. Vous serez alors à nouveau averti et conseillé de ne pas « l'ouvrir à moins que vous ne soyez certain qu'elle provient d'une source digne de confiance ». Cliquez sur **Ouvrir quand même**.
4. Une autre alerte apparaîtra où vous devrez vous authentifier pour lancer l'application.
5. M³ devrait maintenant se lancer avec succès.

Si vous avez toujours des problèmes après avoir suivi toutes ces étapes, veuillez [ouvrir un ticket sur GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). Nous ferons de notre mieux pour vous aider.

### macOS uniquement : Réactivation de la présentation du site web après une mise à jour {#screen-sharing-issues}

:::warning Avertissement

Cette section s'applique uniquement aux utilisateurs de macOS.

:::

Certains utilisateurs de macOS ont signalé que la présentation du site Web ne fonctionne plus après avoir installé les mises à jour de M³.

Si la fenêtre média est noire lors de la présentation du site Web après une mise à jour de M³, essayez les étapes suivantes :

1. Ouvrez les paramètres système de macOS à la section **Confidentialité et sécurité**.
2. Allez à **Enregistrement d'écran**.
3. Sélectionnez M³ dans la liste.
4. Cliquez sur le bouton `-` (moins) pour la supprimer.
5. Cliquez sur le bouton `+` (plus) et sélectionnez M³ dans le dossier Applications.
6. Vous pourriez être invité à relancer M³ pour appliquer le changement.

Après ces étapes, le partage d'écran devrait fonctionner comme prévu.

:::tip Astuce

Ces étapes sont facultatives et peuvent être ignorées si vous ne prévoyez pas d'utiliser la fonction de présentation du site Web. Par contre, si vous prévoyez d'utiliser la fonction de présentation du site Web, il est recommandé de suivre ces étapes après chaque mise à jour pour s'assurer que la présentation fonctionne comme prévu.

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
