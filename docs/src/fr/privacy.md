# Politique de confidentialité {#privacy-policy}

Date d'entrée en vigueur : 22 novembre 2026

Meeting Media Manager (M³) est une application gratuite à code source ouvert, créée par des bénévoles. Cette politique explique quelles données M³ traite et où elles vont. Elle s'applique à toutes les versions de M³ : les programmes d'installation et la version portable proposés sur ce site, ainsi que les versions du Microsoft Store, du Snap Store et de Flathub.

**En bref :** M³ n'a ni comptes, ni publicités, ni traceurs publicitaires ou marketing. Vos paramètres et vos médias restent sur votre ordinateur. Pour repérer et corriger les problèmes, M³ envoie à ses développeurs des données de diagnostic : des rapports d'erreurs, ainsi que des informations sur chaque session et sur la rapidité de fonctionnement de M³. M³ en exclut ce qui pourrait vous identifier, vous ou votre assemblée, et votre adresse IP n'est pas conservée.

## Ce qui reste sur votre ordinateur {#on-your-computer}

M³ conserve les éléments suivants dans son dossier de données, sur votre ordinateur :

- les paramètres de chaque assemblée ou groupe, comme son nom, son horaire des réunions, sa langue et ses intégrations ;
- les médias et les publications qu'il télécharge, et les médias que vous ajoutez ;
- le mot de passe d'OBS Studio, si vous utilisez ce logiciel. M³ chiffre ce mot de passe à l'aide du stockage de mots de passe de votre système d'exploitation lorsque ce stockage est disponible ; lorsqu'il ne l'est pas, M³ le stocke en clair et vous le signale ;
- les paramètres de votre intégration à Zoom, si vous l'utilisez.

Les rapports d'erreurs contiennent certains de ces paramètres (voir ci-dessous), mais jamais ceux qui pourraient vous identifier, vous ou votre assemblée.

Si vous affichez le flux d'une caméra dans la fenêtre multimédia (une option destinée aux assemblées en langue des signes), il est uniquement affiché : M³ ne l'enregistre pas, ne le conserve pas et ne l'envoie pas. L'aperçu de la fenêtre multimédia que M³ vous montre est capturé sur votre ordinateur et n'est pas non plus conservé ni envoyé.

Vous pouvez supprimer tout cela à tout moment en supprimant le dossier de données de M³. Sous Windows, la désinstallation de M³ le supprime aussi. Les versions du Snap Store et de Flathub le conservent lorsque vous les désinstallez, sauf si vous leur demandez de ne pas le faire (`snap remove --purge` ou `flatpak uninstall --delete-data`).

## Données de diagnostic {#error-reports}

M³ envoie des données de diagnostic à [Sentry](https://sentry.io), le service que ses développeurs utilisent pour repérer et corriger les bogues.

**Rapports d'erreurs**, lorsqu'un problème survient dans M³. Un rapport peut contenir :

- l'erreur, et l'endroit du code de M³ où elle s'est produite ;
- la version de M³, votre système d'exploitation et sa version, votre langue et votre fuseau horaire, et des informations de base sur votre matériel, comme votre carte graphique ;
- les étapes qui ont mené à l'erreur, comme les pages ouvertes dans M³ et les fichiers qu'il téléchargeait ;
- l'état de M³ à ce moment-là : ses paramètres, et ce qu'il faisait, comme le média en cours de lecture ou la réunion qu'il préparait ;
- lorsqu'une partie de M³ plante, un rapport de plantage de celle-ci, qui peut contenir une portion de sa mémoire au moment du plantage.

**Informations de session**, à chaque exécution de M³ : le moment où il a démarré et s'il s'est arrêté normalement ou a planté, avec la version de M³ et votre système d'exploitation.

**Informations de performances**, à chaque session : le temps que mettent les pages de M³ à s'ouvrir, et la durée de ses requêtes vers les serveurs ci-dessous, avec leurs adresses.

### Ce que M³ exclut {#left-out}

Avant d'envoyer ses données de diagnostic, M³ en retire ce qui pourrait vous identifier, vous ou votre assemblée :

- le nom de l'assemblée, son identifiant de réunion Zoom, et les noms des participants Zoom ;
- le code PIN des paramètres et le mot de passe d'OBS Studio ;
- les noms des dossiers et des fichiers de votre ordinateur : seuls subsistent le lecteur ou le dossier de premier niveau d'un dossier, et le type d'un fichier ;
- l'adresse indiquée dans le paramètre « Adresse du site web », lorsqu'il ne s'agit pas de l'adresse par défaut ;
- votre nom d'utilisateur, dans les chemins de dossiers de ses rapports.

Ces données ne contiennent aucun nom, aucune adresse e-mail ni aucun compte, puisque M³ n'en a pas. M³ demande à Sentry de ne pas enregistrer votre adresse IP, et Sentry est configuré pour ne pas la conserver.

Les responsables de M³ n'utilisent ces données que pour repérer et corriger les problèmes. Sentry les stocke aux États-Unis et les supprime au bout d'une durée limitée. La [politique de confidentialité de Sentry](https://sentry.io/privacy/) explique comment il les traite.

## Serveurs auxquels M³ se connecte {#connections}

Pour faire son travail, M³ se connecte aux serveurs ci-dessous. Comme pour tout site web que vous visitez, ces serveurs peuvent voir l'adresse IP de votre ordinateur.

- **Le site web officiel des Témoins de Jéhovah** et ses serveurs de téléchargement, pour télécharger les médias des réunions et les publications, ainsi que les informations qui s'y rapportent. La politique de confidentialité propre à ce site s'applique à ce qu'il reçoit.
- **GitHub**, où M³ est publié, pour vérifier et télécharger les mises à jour de M³, et pour afficher ses nouveautés. Les versions du Microsoft Store, du Snap Store et de Flathub obtiennent plutôt leurs mises à jour depuis leur boutique.
- **jsDelivr**, pour télécharger les polices dont certaines langues ont besoin, et le composant que M³ utilise pour lire les fichiers PDF.
- **Apple, Cloudflare, icanhazip.com et ipify.org**, pour vérifier si votre ordinateur est connecté à Internet.
- **Sentry**, pour envoyer les données de diagnostic décrites ci-dessus.

Si vous les utilisez, M³ fonctionne aussi avec les éléments suivants, sur votre ordinateur ou votre réseau local :

- **Zoom :** M³ contrôle l'application Zoom sur votre ordinateur. M³ lui-même n'envoie rien aux serveurs de Zoom.
- **OBS Studio :** M³ se connecte à OBS Studio sur votre ordinateur ou votre réseau local.
- **Le minuteur à distance :** M³ fait fonctionner un petit serveur web sur votre réseau local, pour qu'un autre appareil puisse afficher le minuteur de réunion.

Lorsque vous affichez le site web officiel des Témoins de Jéhovah dans la fenêtre du site web de M³, il fonctionne comme dans un navigateur web.

## Boutiques d'applications {#stores}

Si vous installez M³ depuis le Microsoft Store, le Snap Store ou Flathub, cette boutique gère l'installation et les mises à jour de M³, selon sa propre politique de confidentialité. M³ lui-même fonctionne de la même façon dans toutes les versions.

## Modifications de cette politique {#changes}

Si M³ se met à traiter les données différemment, cette page sera mise à jour, avec une nouvelle date en haut de page. Son historique se trouve sur [GitHub](https://github.com/sircharlo/meeting-media-manager/commits/master/docs/src/en/privacy.md).

## Des questions ? {#questions}

Si vous avez une question sur cette politique ou sur vos données, [ouvrez un ticket sur GitHub](https://github.com/sircharlo/meeting-media-manager/issues).
