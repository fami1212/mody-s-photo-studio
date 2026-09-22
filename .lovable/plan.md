# Espace admin pour Mody

## Ce que ça donne

Mody se connecte à une page privée du site. Depuis là, il gère tout : ses photos, ses dossiers, et les publications qui apparaissent sur le site public. Tout ce qu'il publie côté admin se voit immédiatement côté visiteurs.

## Étape 1 — Activer l'espace de stockage et les comptes

Activation de Lovable Cloud : base de données, stockage de photos et connexion sécurisée, sans compte externe à créer.

Un seul compte administrateur : celui de Mody. Les visiteurs n'ont jamais de compte.

## Étape 2 — Connexion privée

- Une page `/auth` (e-mail + mot de passe) pour Mody uniquement.
- Tout l'espace admin est protégé : un visiteur qui tente d'y aller est renvoyé vers la page de connexion.
- Bouton de déconnexion dans l'admin.

## Étape 3 — Photos et dossiers

Page `/admin/dossiers` :
- Créer, renommer, supprimer un dossier (ex : « Mariage Sara & Amine », « Studio novembre »).
- Envoyer plusieurs photos d'un coup dans un dossier (glisser-déposer), avec barre de progression.
- Voir les photos en grille, les réordonner, en supprimer, choisir la photo de couverture.

## Étape 4 — Publications (shootings)

Page `/admin/publications` :
- Créer une publication : titre, texte, catégorie (Mariage, Studio, Extérieur…), date, photo de couverture, et les photos choisies depuis un dossier.
- Statut brouillon ou publié. Le brouillon reste invisible du public mais visible pour Mody.

Côté site public :
- `/shootings` : la liste des publications, en grille façon feed.
- `/shootings/<titre>` : la publication complète avec sa galerie.
- La galerie de la page d'accueil affiche automatiquement les dernières photos publiées, à la place des images d'exemple actuelles.

## Étape 5 — Partage de dossier par lien (en dernier)

- Depuis un dossier, Mody génère un lien privé à envoyer au client.
- La personne ouvre le lien sans compte, voit les photos et peut les télécharger (une par une ou tout le dossier).
- Options : désactiver le lien, date d'expiration.

## Détails techniques

- Base : tables `folders`, `photos`, `posts`, `post_photos`, `share_links`, plus `user_roles` avec un rôle `admin` (jamais stocké sur le profil).
- Stockage : bucket privé `photos` pour les originaux, lecture publique passant par des URLs signées ; les photos rattachées à une publication publiée sont lisibles par tous.
- Sécurité : RLS sur toutes les tables, écriture réservée au rôle admin, lecture publique limitée aux publications au statut « publié ».
- Routes protégées sous `src/routes/_authenticated/`, pages publiques en haut niveau avec leurs propres métadonnées de partage.
- Upload direct navigateur → stockage, miniatures générées à l'affichage.
- Les liens de partage utilisent un jeton aléatoire vérifié côté serveur, sans exposer le reste de la bibliothèque.

## Ordre de livraison

1. Cloud + connexion admin
2. Dossiers + upload de photos
3. Publications + pages publiques reliées
4. Liens de partage téléchargeables
