# Correctifs, rapidité, assistants IA, réservations et sécurité

## 1. Corriger les bugs
- Ouvrir un shooting affiche « Page not found » : la page de détail n'est pas bien reliée à la liste des shootings. Réparation de la liaison, pour que chaque shooting publié s'ouvre.
- Corriger les deux défauts repérés dans l'espace privé (dossiers et publications), puis tester le parcours complet : envoyer des photos, publier, ouvrir le shooting côté public, ouvrir un lien de téléchargement.
- Traduire en français la page « introuvable » et la page d'erreur.

## 2. Images plus rapides
- Au moment de l'envoi, créer automatiquement une version légère de chaque photo (miniature ~600 px et version écran ~1600 px, format WebP), directement dans le navigateur de Mody.
- Le site public affiche les versions légères. L'original reste réservé au téléchargement client.
- Les liens des photos restent valables plus longtemps et sont mis en cache, pour éviter de tout recharger à chaque visite.
- Chargement progressif : les premières photos d'abord, les suivantes au défilement, avec un fond coloré en attendant.
- Un bouton « Optimiser les anciennes photos » dans l'admin pour traiter les photos déjà envoyées.

## 3. Gestion des réservations (admin)
- Nouvelle page « Réservations » : liste des demandes (nom, téléphone, formule, date, message, origine : formulaire ou assistant).
- Statuts : nouvelle, confirmée, terminée, annulée. Filtres et notes internes.
- Le formulaire de la page d'accueil enregistre la demande **et** garde le bouton WhatsApp.
- Compteur des nouvelles demandes sur le tableau de bord.

## 4. Assistant de réservation (visiteurs)
- Bulle de discussion sur le site, en français.
- Il connaît les tarifs, les formules, les frais de transport et les réseaux de Mody.
- Il pose les questions utiles (nom, téléphone, formule, date, lieu), récapitule, puis enregistre la réservation après confirmation du client. Il propose aussi WhatsApp.
- Il ne donne jamais d'informations privées et n'invente pas de prix.

## 5. Assistant admin (pour Mody)
- Panneau de discussion dans l'espace privé.
- Il peut : résumer les réservations, changer un statut, rédiger le texte d'une publication, proposer un titre et une catégorie, lister les dossiers et les liens de partage, rédiger une réponse WhatsApp à un client.
- Toute action qui modifie quelque chose demande une confirmation.
- Réservé au compte admin.

## 6. Sécuriser toute l'application
- Base de données : accès réservé à l'admin partout ; les visiteurs peuvent seulement **créer** une réservation, jamais lire celles des autres.
- Toutes les requêtes passent par des paramètres sécurisés (aucune requête construite à la main), ce qui bloque les injections SQL.
- Validation stricte de tout ce qui est saisi (longueur, format téléphone, date, texte) côté navigateur **et** côté serveur.
- Protection XSS : aucun contenu saisi n'est interprété comme du code ; le texte des publications et des messages est affiché uniquement comme du texte.
- En-têtes de sécurité du site (anti-clickjacking, politique de contenu, pas de fuite du référent).
- Inscription fermée après la création du compte de Mody ; protection des mots de passe compromis déjà active.
- Limite anti-abus sur le formulaire et l'assistant de réservation (nombre de demandes par visiteur).
- Liens de partage : jeton long et aléatoire, vérification de l'expiration et de l'activation côté serveur.
- Scan de sécurité final et correction de ce qu'il signale.

## Détails techniques
- Routes : `shootings.tsx` devient un layout avec `<Outlet />` (ou fusion en `shootings.index.tsx` + `shootings.$slug.tsx`), cause du 404.
- Photos : colonnes `thumb_path`, `display_path`, `width`, `height` sur `photos` ; redimensionnement via canvas → WebP à l'upload ; URLs signées 24 h + cache côté query ; `loading="lazy"`, `decoding="async"`, `width/height`.
- Table `bookings` (name, phone, offer, event_date, location, message, source, status, admin_notes) + GRANT ; RLS : insert public via server function validée zod, lecture/écriture admin uniquement. Table `rate_limits` pour limiter les envois par IP.
- IA : Lovable AI Gateway, modèle par défaut, routes serveur en streaming (`/api/chat/booking` public avec limite, `/api/chat/admin` avec vérification du rôle admin). Outils : `create_booking` (visiteur), `list_bookings`, `update_booking_status`, `draft_post`, `list_folders` (admin).
- Sécurité : zod sur toutes les server functions, pas de `dangerouslySetInnerHTML`, en-têtes CSP/X-Frame-Options/Referrer-Policy dans le middleware, désactivation des inscriptions, linter + security scan.
