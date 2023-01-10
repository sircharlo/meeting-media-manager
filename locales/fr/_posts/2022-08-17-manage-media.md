---
tag: Utilisation
title: Gérer les médias
ref: manage-media
---

L'écran de gestion des médias permet à l'utilisateur d'ajouter ou de supprimer des médias pour une réunion donnée, gérer les médias récurrents et même ajouter des médias spéciaux pour d'autres dates où aucune réunion ne serait normalement planifiée.

### Gérer les médias pour une journée particulière

Pour gérer les médias pour une réunion ou une journée donnée, il vous suffit de cliquer sur l'icône de ce jour sur l'écran principal de M³. Pour gérer les médias qui seront répétés à chaque réunion, cliquez sur l'icône des médias récurrents.

### Ajout de médias

Voici comment **ajouter** des médias à partir de l'écran de gestion des médias.

| Option                  | Explication                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `Type de téléversement` | Choisissez parmi l'un des 3 `types de média` (voir ci-dessous).                                         |
| `Médias à ajouter`      | Dépend du `type de média` choisi (voir ci-dessous).                                                     |
| `Préfixe`               | Jusqu'à 6 chiffres peuvent être ajoutés avant le ou les noms de fichiers multimédia, pour aider au tri. |
| `Liste des médias`      | Ceci montre les médias actuellement prévus pour la date sélectionnée.                                   |

Dans le champ `Médias à ajouter`, différentes options vous seront présentées selon le type de média sélectionné.

| `Type de média` | Le champ `Médias à ajouter`...                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cantique`      | ... affichera un menu avec toutes les vidéos des cantiques de la série *sjjm*, dans la langue des médias. Choisissez cette option par exemple pour ajouter un cantique pour le discours public, ou pour les visites du responsable de circonscription. <br><br> Le cantique sélectionné sera automatiquement téléchargé à partir de JW.org, dans la langue de l'assemblée locale ou du groupe, tel que configuré dans les [Réglages]({{page.lang}}/#configuration). |
| `JWPUB`         | ... vous permettra de naviguer vers (ou glisser-déposer) un fichier JWPUB. <br><br> Vous serez alors invité à sélectionner la section ou le chapitre à partir duquel vous souhaitez ajouter des médias. Cela ajoutera tant les médias intégrés que référencés à partir de cette section du fichier JWPUB. <br><br> Un exemple d'un fichier JWPUB couramment utilisé est le S-34, mais n'importe quel fichier JWPUB peut être utilisé ici.               |
| `Autre`         | ... vous permettra de naviguer vers (ou glisser-déposer) n'importe quel fichier multimédia qui est sur votre ordinateur. <br><br> *Notez que les fichiers PDF et SVG seront automatiquement convertis en images en haute définition par M³.*                                                                                                                                                                                                                        |

### Suppression, masquage et affichage des médias

Pour **supprimer**, **masquer**, ou **afficher** des médias, il vous suffit de trouver le fichier média désiré et de cliquer sur l'icône correspondante.

| Icône rouge 🟥 (supprimer)                                             | Icône ☑️ (case à cocher cochée)                                                                                                                                                   | Icône 🔲 (case à cocher décochée)                                                                                                                                                                      |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Le fichier média a été ajouté aux médias de ce jour par vous ou l'OV. | Le fichier média est référencé dans le matériel source de la réunion. <br><br> Il sera donc *téléchargé* à partir de JW.org ou *extrait* de la publication concernée. | Le fichier média est référencé dans le matériel source de la réunion. <br><br> Il a été masqué par vous ou par l'OV, donc il *ne sera pas* téléchargé ou ajouté aux médias de la réunion. |

### Captures d'écran de l'écran de gestion des médias

{% include screenshots/manage-media.html lang=site.data.fr %}
