# Concevoir un éditeur de cartes holographiques prêt pour l’impression

## Conclusion

Le prototype constitue une excellente interface de prévisualisation, mais son rendu HTML/CSS n’est pas directement imprimable : l’inclinaison, les modes de fusion, le reflet et l’animation simulent un matériau qui, en fabrication, est obtenu par un support, une feuille de foil, des encres et parfois un vernis.

La bonne architecture consiste à séparer deux objets :

1. un **aperçu écran**, destiné à donner une intuition réaliste du résultat ;
2. un **dossier de fabrication**, déterministe et conforme au profil technique de l’imprimeur.

Le choix de l’imprimeur et du procédé doit intervenir avant de figer l’export. Les tolérances, noms des tons directs, ordre des pages, gabarits, limites du foil et profils colorimétriques varient selon les ateliers. L’éditeur devrait donc fonctionner avec des **profils d’imprimeur versionnés**, et non avec une règle universelle codée en dur.

## 1. Ce que signifie « holographique » en fabrication

### A. Carton ou film holographique imprimé

Toute la surface de départ réfléchit la lumière. Une couche de blanc opaque est imprimée sous certaines parties de l’image pour bloquer l’effet ; les zones sans blanc laissent apparaître l’holographie. Le fichier de production comprend donc généralement :

- l’illustration couleur ;
- un masque de blanc séparé ;
- éventuellement un masque de vernis sélectif ;
- le recto, le verso et les repères du gabarit selon les instructions de l’atelier.

Sur un support métallique ou holographique, les encres CMJN seules peuvent rester translucides et être modifiées par le support. Le blanc de soutien sert à rendre les couleurs opaques et vives ; il peut aussi masquer totalement le matériau.[^1]

Cette méthode correspond le mieux au prototype actuel : « masque holographique » devrait en réalité devenir un éditeur de **blanc de soutien**, affiché à l’utilisateur sous une forme intuitive comme « holographie visible ici ».

### B. Foil holographique sélectif, à chaud ou à froid

Le support peut être un carton classique ; le foil est déposé uniquement sur les formes demandées. Le fabricant attend généralement :

- l’impression couleur CMJN ;
- un masque de foil distinct, idéalement vectoriel et en aplat 100 % ;
- parfois une page séparée, parfois un ton direct nommé dans un PDF multicouche.

Solopress, par exemple, demande une page CMJN et une page de foil vectorielle en noir 100 %, sans remettre la couleur du foil dans l’artwork CMJN.[^2] BoardGamesMaker fixe également des contraintes de fabrication minimales de 0,2 mm pour les traits et 0,4 mm entre éléments pour ses options de foil chaud/froid.[^3]

Cette méthode permet des accents nets, mais ne reproduit pas automatiquement un arc-en-ciel complexe sur toute l’illustration.

### C. Autres effets à ne pas confondre

- Encre métallique : pigment réfléchissant, moins miroir qu’un foil.
- Vernis sélectif : brillance ou relief local, mais pas d’holographie à lui seul.
- Pelliculage holographique pleine surface : film appliqué sur toute la carte.
- Embossage/débossage : relief mécanique, avec ses propres tolérances et matrices.

Le configurateur doit nommer le **procédé physique**, pas seulement proposer des styles visuels comme « Galaxy » ou « Rainbow ».

## 2. Le dossier que l’imprimeur demandera probablement

Le paquet de production conseillé serait un ZIP comprenant :

| Élément | Format recommandé | Contenu |
|---|---|---|
| Rectos | PDF prêt à imprimer, une carte par page | CMJN, fond perdu inclus, dimensions exactes |
| Verso(s) | PDF séparé ou pages appariées | Même gabarit et même orientation |
| Masque blanc | Vecteurs/tons directs ou PDF N&B selon l’atelier | Où le blanc opaque doit être imprimé |
| Masque foil | Vecteurs/tons directs ou PDF N&B | Où le foil doit être posé |
| Masque vernis | Vecteurs/tons directs | Où appliquer le vernis sélectif |
| Forme de découpe | Gabarit fourni par l’imprimeur | Trait technique non imprimable, coins et sens |
| Manifeste | CSV/JSON + fiche PDF lisible | Identifiant, quantité, recto-verso, orientation, procédé |
| Packaging | PDF sur gabarit dédié | Étui, boîte, notice et codes si inclus |
| Aperçus | JPG/PNG basse définition | Contrôle humain, jamais fichier maître |

Des imprimeurs de cartes demandent couramment un PDF CMJN à 300 ppp, un fond perdu d’environ 3 mm et une zone de sécurité. PrintNinja indique 3 mm de fond perdu et recommande de garder le contenu critique à 5 mm du bord coupé ; BoardGamesMaker demande au minimum 300 ppp et environ 1/8 pouce de fond perdu et de marge de sécurité.[^3][^4] Ces nombres doivent rester paramétrables : le gabarit contractuel du fabricant choisi prévaut toujours.

### Exemple dimensionnel

Pour une carte finie de 63 × 88 mm avec 3 mm de fond perdu :

- page exportée : **69 × 94 mm** ;
- ligne de coupe : 63 × 88 mm ;
- contenu critique : idéalement au moins 5 mm à l’intérieur de la coupe ;
- fond et images pleine page : prolongés jusqu’au bord de 69 × 94 mm.

À 300 ppp, une page raster de 69 × 94 mm représente environ **815 × 1 110 pixels**. Mais textes, cadres, logos, traits et masques devraient rester vectoriels dans le PDF.

## 3. Traduction directe dans le produit

### Commencer par une « recette de fabrication »

Avant l’édition graphique, l’utilisateur choisit :

- format fini et orientation ;
- imprimeur ou profil générique ;
- support/carton, grammage et cœur noir/bleu/blanc ;
- procédé holographique ;
- recto, verso, nombre de cartes et quantité ;
- finition : mate, brillante, texture, vernis, coins, emballage.

Ce choix charge un profil contenant les dimensions, fonds perdus, zones sûres, rayon des coins, résolution minimale, espaces colorimétriques, tons directs attendus, limites de détail et convention de fichiers.

### Transformer les calques du prototype

| Prototype actuel | Fonction de production proposée |
|---|---|
| Image | Artwork couleur imprimable |
| Trame | Motif réellement disponible dans le catalogue du fabricant, ou simple simulation |
| Foil | Masque physique binaire ou tramé si explicitement accepté |
| Reflet | Simulation d’aperçu uniquement, jamais exportée par défaut |
| Masque holographique | Éditeur « visible / atténué / bloqué », converti en masque de blanc |
| Paillettes / grain / halo | Séparer « texture imprimée » de « finition matérielle » |
| Mouvement 3D | Aperçu uniquement |

L’intensité du foil à 72 %, le mode `color-dodge` et l’angle du spectre n’ont pas d’équivalent universel sur presse. Ils doivent soit piloter la simulation seulement, soit être traduits vers une option réellement proposée par un fournisseur donné.

### Interface indispensable

- Vue permanente des trois limites : fond perdu, coupe, zone sûre.
- Avertissement si texte/logo traverse la zone sûre.
- Contrôle de résolution **effective à la taille placée**, et non de la taille brute du fichier.
- Détection des images manquantes, transparences problématiques et détails trop fins.
- Mode d’inspection par séparation : Couleur / Blanc / Foil / Vernis / Découpe.
- Simulation « sans blanc », « blanc partiel » et « blanc total » sur support holo.
- Contrôle du contraste et taille minimale des caractères.
- Recto-verso avec indication explicite du sens de retournement.
- Épreuve PDF téléchargeable et validation finale avec checklist.
- Estimation qui prévient que certaines finitions imposent une quantité minimale ou un devis.

## 4. Architecture d’export recommandée

Le navigateur peut conserver l’éditeur et l’aperçu, mais la génération finale devrait être effectuée par un moteur de rendu contrôlé, idéalement côté serveur :

1. le projet est stocké comme une scène structurée (dimensions physiques, objets, polices, images, masques) ;
2. le serveur reconstruit les pages à la taille physique exacte ;
3. les images sont converties avec une gestion colorimétrique explicite ;
4. textes et formes restent vectoriels lorsque possible ;
5. les masques deviennent des pages séparées ou des tons directs selon le profil ;
6. un contrôle prépresse bloque l’export en cas d’erreur et signale les avertissements ;
7. le ZIP et une empreinte de version sont archivés avec la commande.

Une capture d’écran, un export Canvas en PNG ou l’impression CSS du composant 3D ne suffisent pas : ils peuvent rasteriser les textes, perdre les dimensions physiques, rester en RVB et incorporer des reflets qui n’existent pas dans le procédé réel.

### Modèle minimal d’un profil imprimeur

```json
{
  "id": "printer-process-version",
  "trimMm": [63, 88],
  "bleedMm": 3,
  "safeMm": 5,
  "cornerRadiusMm": 3,
  "minimumDpi": 300,
  "colorPolicy": "CMYK_ICC_PROFILE_TO_CONFIRM",
  "separations": ["ARTWORK", "WHITE", "HOLO_FOIL", "VARNISH"],
  "minimumLineMm": 0.2,
  "minimumGapMm": 0.4,
  "pageOrder": "supplier-specific",
  "templateRevision": "YYYY-MM-DD"
}
```

Les noms de tons directs et règles de surimpression ne doivent pas être universalisés. Pixartprinting, par exemple, impose un ton direct nommé `White` et la surimpression pour son flux ; un autre RIP ou imprimeur peut attendre un autre nom ou des pages séparées.[^1]

## 5. Points de vigilance majeurs

### La couleur écran n’est pas la couleur imprimée

Les écrans utilisent le RVB et émettent de la lumière ; l’impression emploie des encres, un support et un éclairage ambiant. Prévoir : profil ICC confirmé par l’imprimeur, conversion contrôlée, avertissement pour les couleurs hors gamut, épreuve contractuelle si l’exactitude est importante, et aucune promesse « identique à l’écran ».

### Les masques doivent être fabricables

Les petits cheveux, étoiles, trames et textes fins peuvent boucher, s’écailler ou se décaler. Printed.com recommande le vectoriel, déconseille les zones petites ou complexes en foil numérique et recommande au moins 7 pt pour le texte concerné.[^5] Le validateur doit utiliser les seuils du procédé sélectionné.

### Coupe et repérage

Une petite variation de coupe rend les bordures minces visiblement inégales. PrintNinja avertit spécifiquement que des bordures uniformes de 1/8 pouce peuvent révéler les variations de coupe.[^6] Proposer des cadres plus larges, éviter les filets proches du bord et afficher une simulation de tolérance aléatoire seraient très utiles.

### Transparence et blanc

Dans l’artwork couleur, « blanc » ne signifie pas automatiquement « encre blanche ». Sur support holographique, une zone sans encre blanche peut laisser apparaître le matériau. L’interface doit rendre cette distinction impossible à manquer.

### Recto-verso et données variables

Chaque face doit être appariée sans ambiguïté avec son verso. Utiliser des identifiants immuables, un ordre explicite et une planche de contrôle. Ne pas se fier uniquement aux noms saisis par les utilisateurs.

### Droits et modération

Le prototype utilise une carte Pokémon. Pour un service commercial, l’impression et la vente de contenus doivent être autorisées. Prévoir déclaration de droits, procédure de signalement, politique de contenus, journal de consentement et contrôle des marques/personnages. Cette question doit être validée juridiquement avant lancement.

### Confidentialité, conservation et sécurité

Les fichiers peuvent contenir œuvres inédites et données personnelles. Définir durée de conservation, suppression, accès de l’imprimeur, chiffrement, sauvegardes et sous-traitance dans le contrat et l’interface.

### Contrôle physique

Avant une vraie production, commander :

1. un kit d’échantillons de supports et finitions ;
2. une épreuve avec une mire couvrant blancs, noirs, aplats, petits textes, dégradés et plusieurs densités de masque ;
3. un mini-lot pilote ;
4. une validation sous plusieurs angles et éclairages, ainsi que des tests de rayure, pliage et brassage.

## 6. Ordre de développement conseillé

### Phase 1 — Éditeur techniquement honnête

- Format physique, fond perdu, coupe et zone sûre.
- Artwork recto/verso structuré.
- Masque holographique/blanc éditable.
- Inspection des séparations.
- Export d’un dossier générique clairement marqué « à valider par l’imprimeur ».

### Phase 2 — Intégration d’un imprimeur pilote

- Obtenir son guide prépresse, ses gabarits et des fichiers exemples validés.
- Créer un profil versionné pour un seul format et un seul procédé.
- Faire valider automatiquement et humainement dix fichiers tests.
- Produire un échantillon physique et ajuster la simulation écran.

### Phase 3 — Commande industrielle

- Prix, quantités, emballage, taxes et livraison.
- Verrouillage de la version du projet commandé.
- BAT numérique/physique, suivi des validations et statuts.
- Transmission sécurisée du package et reprise des erreurs prépresse.

## 7. Questions à poser à l’imprimeur avant de coder l’export

1. Quel procédé exact produit l’effet : support holographique, pelliculage, cold foil ou hot foil ?
2. Quels formats finis, rayons de coins, cartons, cœurs, grammages et finitions proposez-vous ?
3. Quel gabarit, fond perdu, zone sûre et tolérance de coupe utilisez-vous ?
4. Quel format PDF et quel profil ICC attendez-vous ? Acceptez-vous RVB ou exigez-vous CMJN ?
5. Les polices doivent-elles être incorporées ou vectorisées ?
6. Comment livrer le blanc, le foil, le vernis et la découpe : pages, calques ou tons directs ? Avec quels noms exacts et quelle surimpression ?
7. Quelles sont les épaisseurs, espacements, tailles de texte et couvertures maximales pour chaque finition ?
8. Comment ordonner et nommer rectos, versos et cartes variables ?
9. Fournissez-vous un contrôle prépresse, un BAT et un rapport d’erreurs exploitable automatiquement ?
10. Quelles quantités minimales, limites de couverture, coûts de clichés/matrices et contraintes d’emballage s’appliquent ?
11. Pouvez-vous fournir un package d’exemple déjà passé en production et un jeu d’échantillons physiques ?
12. Votre API accepte-t-elle fichiers, devis, commandes, BAT et statuts, ou faut-il un échange manuel ?

## Recommandation de cadrage

Le meilleur prochain jalon n’est pas encore « exporter chez tous les imprimeurs ». C’est un vertical très étroit : **une carte 63 × 88 mm, un imprimeur, un support holographique, un masque de blanc, un recto et un verso**. Ce pilote donnera les contraintes réelles nécessaires pour concevoir ensuite un système de profils extensible.

## Sources

[^1]: Pixartprinting, [« White printing »](https://support.pixartprinting.com/hc/en-us/articles/360017494239-White-printing), consulté en septembre 2026.
[^2]: Solopress, [« Foil Artwork Guide »](https://www.solopress.com/support-guides/foil/), consulté en septembre 2026.
[^3]: BoardGamesMaker, [« Design Your Own Collectible Game Cards »](https://www.boardgamesmaker.com/print/design-collectible-game-cards.html), consulté en septembre 2026.
[^4]: PrintNinja, [« Custom Card Game Printing »](https://printninja.com/printing-products/card-game-printing/), consulté en septembre 2026.
[^5]: Printed.com, [« Foiling: A Designer’s Guide »](https://www.printed.com/uploads/assets/2025/02/27/foil-artwork-guide-1740677357.pdf?1740677357=), consulté en septembre 2026.
[^6]: PrintNinja, [« Card Deck Setup Guides »](https://printninja.com/card-deck-setup-guides/), mis à jour en avril 2026.

