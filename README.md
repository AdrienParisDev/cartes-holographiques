# HoloLab

HoloLab est un prototype d’atelier interactif pour créer et prévisualiser des cartes holographiques dans le navigateur.

Le projet explore le rendu d’une surface brillante en temps réel à partir de calques CSS, de mouvements 3D et de contrôles personnalisables. Il fonctionne entièrement côté client, sans framework ni dépendance.

## Démonstration

**[Ouvrir HoloLab](https://adrienparisdev.github.io/cartes-holographiques/)**

Déplacez le curseur sur la carte pour modifier son inclinaison et la position du reflet.

## Fonctionnalités

- aperçu holographique interactif en temps réel ;
- inclinaison 3D pilotée par le pointeur ;
- réglage de la lumière, du reflet, de la perspective et de l’amplitude du mouvement ;
- activation indépendante des calques visuels : image, trame, foil, paillettes et reflet ;
- import d’images PNG, JPEG ou WebP ;
- outil de recadrage avec zoom, déplacement et rotation ;
- vue agrandie avec loupe et contrôle des calques ;
- interface responsive pour ordinateur, tablette et mobile.

## Technologies

- HTML5 sémantique ;
- CSS moderne : variables, dégradés, modes de fusion et transformations 3D ;
- JavaScript natif ;
- Canvas API pour le recadrage des images ;
- GitHub Pages pour la démonstration publique.

## Utilisation locale

Aucune installation n’est nécessaire.

1. Clonez le dépôt :

   ```bash
   git clone git@github.com:AdrienParisDev/cartes-holographiques.git
   ```

2. Ouvrez `index.html` dans un navigateur moderne.

Pour éviter les restrictions que certains navigateurs appliquent aux fichiers locaux, vous pouvez aussi servir le dossier avec un serveur HTTP local de votre choix.

## État du projet

HoloLab est actuellement un prototype expérimental. La personnalisation visuelle et les interactions principales sont fonctionnelles, mais l’enregistrement des créations, la bibliothèque de cartes et l’export final ne sont pas encore implémentés.

## Pistes d’évolution

- sauvegarde locale des cartes et des réglages ;
- bibliothèque de créations ;
- export en image haute résolution ;
- masques holographiques personnalisés ;
- palettes et types de foil entièrement configurables ;
- prise en charge tactile approfondie.

## Auteur

Projet imaginé et développé par [AdrienParisDev](https://github.com/AdrienParisDev).
