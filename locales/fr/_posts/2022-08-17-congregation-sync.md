---
tag: Paramètres
title: Synchronisation au niveau de l'assemblée locale
ref: congregation-sync
---

Le frère désigné comme *organisateur des visioconférences* (OV) par le collège des anciens peut utiliser M³ pour gérer les médias mis à la disposition de l'équipe de soutien technique A/V de son assemblée locale.

Le OV, ou quelqu'un désigné par lui, peut :

- téléverser des **médias supplémentaires** à partager lors d'une réunion, par exemple pour la visite du responsable de circonscription, ou pour les discours publics
- **masquer** certains médias de JW.org qui ne sont pas pertinents pour une réunion donnée, par exemple, lorsqu'une partie a été remplacée par la filiale
- ajouter ou supprimer des **médias récurrents**, tels qu'une vidéo du texte de l'année ou une diapositive d'annonce

Tous ceux qui sont synchronisés avec la même assemblée locale recevront alors exactement les mêmes médias lorsqu'ils cliqueront sur le bouton *Rafraîchir les dossiers multimédias*.

Veuillez noter que la fonction de synchronisation de l'assemblée locale est optionnelle et entièrement facultative.

### Comment cela fonctionne

Le mécanisme de synchronisation sous-jacent de M³ utilise la technologie WebDAV. Cela signifie que l'OV (ou quelqu'un sous sa supervision) doit soit :

- configurer un serveur WebDAV sécurisé accessible par le web, **ou bien**
- utiliser un service de stockage cloud qui prend en charge le protocole WebDAV (voir le paramètre *Adresse web* dans la section *Configuration de la synchronisation au niveau de l'assemblée locale* ci-dessous).

Tous les utilisateurs qui souhaitent être synchronisés ensemble devront se connecter au même serveur WebDAV en utilisant les informations de connexion et les identifiants qui leur sont fournis par l'OV.

### Configuration de la synchronisation au niveau de l'assemblée locale

| Réglage | Explication |
| --- | --- |
| `Adresse web` | Adresse web du serveur WebDAV. Le protocole HTTP sécurisé (HTTPS) est requis. <br><br> ***Remarque :** L'étiquette de ce champ est en fait un bouton qui, une fois cliqué, affichera une liste des fournisseurs WebDAV qui sont connus pour être compatibles avec M³, et préremplira automatiquement certains paramètres pour ces fournisseurs. <br><br> Cette liste est fournie à titre de courtoisie et ne représente en aucun cas un endossement d'un service ou d'un fournisseur en particulier. Le meilleur serveur est toujours celui qui vous appartient...* |
| `Nom d'utilisateur` | Nom d'utilisateur pour le service WebDAV. |
| `Mot de passe` | Mot de passe pour le service WebDAV. <br><br> ***Remarque :** Tel qu'indiqué sur leurs pages d'assistance respectives, il se peut qu'un mot de passe spécifique à l'application doit être créé pour [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) et [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) afin d'activer les connexions WebDAV à leurs services.* |
| `Dossier de l'assemblée locale` | Il s'agit du dossier qui sera utilisé pour synchroniser les médias pour tous les utilisateurs de la synchronisation de l'assemblée locale. Vous pouvez soit taper un chemin d'accès ou le coller, soit utiliser votre souris pour naviguer vers le dossier cible. <br><br> ***Remarque :** Assurez-vous que tous les utilisateurs de l'assemblée locale utilisent le même chemin d'accès de dossier ; sinon, la synchronisation ne fonctionnera pas comme prévu.* |
| `Paramètres bloqués pour l'assemblée locale` | Une fois que l'OV a configuré les sections *Configuration des médias* et *Configuration des réunions* des [réglages]({{page.lang}}/#configuration) sur son propre ordinateur, il peut ensuite utiliser ce bouton pour imposer certains réglages à tous les utilisateurs synchronisés de l'assemblée locale (par exemple, les jours de réunion, la langue des médias, les paramètres de conversion, etc.). Cela signifie que les paramètres sélectionnés seront appliqués de manière forcée pour tous les utilisateurs synchronisés chaque fois qu'ils ouvrent M³. |

### Utilisation de la synchronisation d'assemblée locale pour gérer les médias

Une fois que la configuration de la synchronisation de l'assemblée locale est terminée, vous êtes prêt à commencer à [gérer les médias]({{page.lang}}/#manage-media) pour votre équipe d'assistance technique AV.

### Captures d'écran de la synchronisation de l'assemblée locale à l'œuvre

{% include screenshots/congregation-sync.html lang=site.data.fr %}
