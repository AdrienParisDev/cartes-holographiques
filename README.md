# HoloLab

HoloLab est un atelier de création de cartes holographiques directement utilisable dans le navigateur. Il permet de construire une carte à partir de plusieurs calques, d’appliquer des matières et des textures indépendantes, puis d’observer leur réaction à la lumière et au mouvement.

La V2 fait évoluer le projet d’une démonstration visuelle vers un véritable prototype d’outil de composition. Elle introduit notamment un modèle de calques, la propagation des traitements, un éditeur de textures et une première séparation entre création numérique et préparation à l’impression.

## Démonstration

**[Ouvrir HoloLab](https://adrienparisdev.github.io/cartes-holographiques/)**

Déplacez le curseur sur la carte pour modifier son inclinaison et la position de la lumière. Sélectionnez ensuite un calque dans le configurateur pour examiner ses traitements, ses textures et les effets qu’il reçoit par propagation.

## Évolution du projet

### V1 — Démonstrateur holographique

La première version validait le concept visuel et les interactions principales :

- prévisualisation holographique en temps réel ;
- inclinaison 3D pilotée par le pointeur ;
- reflet lumineux dynamique ;
- réglage de la lumière, de la perspective et de l’amplitude du mouvement ;
- activation indépendante des principaux effets visuels ;
- import et recadrage d’une image ;
- vue agrandie avec loupe ;
- interface responsive en HTML, CSS et JavaScript natifs.

Cette version traitait encore la carte comme une composition essentiellement globale. Les effets étaient convaincants visuellement, mais ils n’étaient pas organisés comme les propriétés d’un véritable document éditable.

### V2 — Atelier de composition par calques

La V2 structure la carte comme une pile de calques indépendants et fait évoluer l’interface vers un outil de création plus complet.

#### Composition et gestion des calques

- quatre calques de démonstration composent le visuel initial ;
- ajout, remplacement, recadrage et suppression de calques ;
- renommage et réorganisation par glisser-déposer ;
- visibilité indépendante pour chaque calque ;
- distinction entre premier plan et arrière-plan ;
- transparence des images utilisée comme masque pour limiter les traitements.

#### Support holographique

- révélation du support configurable par calque ;
- intensité de révélation indépendante ;
- matières simulées : diffraction croisée, galaxie, spectre intégral et métal gravé ;
- palettes spectrales Prisme, Aurore, Solaire et Glace ;
- contrôle de l’intensité, du mode de fusion et de l’angle du spectre ;
- simulation de plusieurs supports physiques et finitions.

#### Textures locales

- ajout de plusieurs textures sur un même calque ;
- lignes croisées, scintillement, zigzags et facettes ;
- géométrie propre à chaque texture : espacement et angle ;
- traitement holographique optionnel et indépendant ;
- palette, intensité et réponse lumineuse spécifiques à la texture ;
- animation web facultative avec comportement et vitesse réglables ;
- aperçu isolé du calque ou de la composition complète dans la modale de textures.

#### Propagation des traitements

- propagation du support vers les calques inférieurs ;
- propagation individuelle ou groupée des textures ;
- indication de la provenance des traitements hérités ;
- distinction visuelle entre traitements locaux et hérités ;
- modification des héritages uniquement depuis leur calque source afin de conserver une chaîne de dépendances lisible.

#### Contrôles d’aperçu non destructifs

Le bloc « Traitements de » situé sous la carte s’adapte au calque sélectionné :

- seuls les traitements réellement actifs sont affichés ;
- les traitements locaux peuvent être masqués ou réaffichés temporairement ;
- cette action ne supprime ni le support ni les textures configurées ;
- les traitements hérités sont affichés à titre informatif avec leur calque source ;
- un état vide explicite apparaît lorsqu’un calque ne possède aucun traitement.

#### Création numérique et impression

Un sélecteur permet de basculer entre deux destinations de création sans dupliquer l’interface.

Le mode **Numérique** conserve les réglages nécessaires au rendu interactif, notamment les animations web.

Le mode **Impression** ajoute les paramètres liés à la fabrication :

- support physique ;
- procédé d’impression ;
- système d’encres ;
- finition générale ;
- diagnostic de compatibilité entre le support, le procédé et les textures.

Les réglages qui décrivent l’intention holographique — matière, palette, intensité, fusion et angle — restent communs aux deux modes.

#### Interface réorganisée

- configurateur regroupé en quatre étapes repliables ;
- réglages détaillés rattachés au calque actif ;
- informations de propagation visibles dans les vignettes ;
- vues principale, agrandie et modale alimentées par un rendu partagé ;
- meilleure séparation entre composition, réglages optiques et paramètres de prévisualisation.

## Architecture de la V2

Le projet reste volontairement sans framework ni dépendance d’exécution. Le JavaScript est désormais organisé en modules spécialisés :

- état et modèle de la carte ;
- gestion des calques ;
- support et compatibilité de production ;
- textures et traitements holographiques ;
- propagation des effets ;
- rendu partagé ;
- recadrage, inspection et mouvement 3D.

Cette organisation évite de dupliquer la logique entre les différentes vues et facilite l’ajout de nouveaux matériaux, textures ou profils de fabrication.

## Technologies

- HTML5 sémantique ;
- CSS moderne : variables, masques, dégradés, modes de fusion et transformations 3D ;
- JavaScript natif avec modules ES ;
- Canvas API pour le recadrage des images ;
- GitHub Pages pour la démonstration publique.

## Utilisation locale

Aucune installation n’est nécessaire.

1. Clonez le dépôt :

   ```bash
   git clone git@github.com:AdrienParisDev/cartes-holographiques.git
   ```

2. Servez le dossier avec un serveur HTTP local.

   Exemple avec Python :

   ```bash
   python3 -m http.server 5500
   ```

3. Ouvrez `http://localhost:5500` dans un navigateur moderne.

L’utilisation d’un serveur local est recommandée, car la V2 repose sur des modules JavaScript que certains navigateurs bloquent lorsque `index.html` est ouvert directement depuis le système de fichiers.

## État du projet

HoloLab V2 est un prototype fonctionnel centré sur la composition et la prévisualisation. Le système de calques, les textures, la propagation des traitements et les modes Numérique et Impression sont en place.

Cette version a vocation à devenir une démonstration de conception d’interface et de rendu interactif dans un portfolio. Elle n’est pas présentée comme un service de production ou comme un outil prêt à transmettre des fichiers à un imprimeur.

## Dernières étapes avant la présentation

Deux étapes restent prévues avant l’intégration du projet au portfolio :

1. **Construire un véritable parcours utilisateur** : clarifier le point d’entrée, l’ordre des actions, les retours de l’interface et l’aboutissement d’une création.
2. **Repenser l’ergonomie responsive** : adapter la hiérarchie, la navigation et la manipulation des calques pour obtenir une expérience pleinement cohérente sur mobile comme sur ordinateur.

Les évolutions nécessaires pour transformer HoloLab en produit professionnel complet sont volontairement conservées hors de ce périmètre.

## Auteur

Projet imaginé et développé par [AdrienParisDev](https://github.com/AdrienParisDev).
