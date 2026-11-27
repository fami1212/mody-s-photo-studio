# Mody's Photo Studio

je veux creer une application moderne pour un ami photographe il s'appelle Mody creons la etape par etape

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ca95aa2b-144a-4428-87e1-2cb09b12a49c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Déploiement sur Vercel

Le build Nitro utilise le preset Vercel et génère la sortie compatible Build Output API avec `npm run build`. Dans Vercel, choisissez le framework **Other**, utilisez `npm run build` comme commande de build, laissez le répertoire de sortie vide et n’ajoutez pas de réécriture générale vers `/`.

Configurez les variables suivantes dans les paramètres Vercel, pour chaque environnement utilisé :

- `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` pour le client navigateur.
- `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` pour les fonctions serveur.
- `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SECRET_KEY` côté serveur uniquement, pour les opérations privées. Ne préfixez jamais cette clé avec `VITE_`.

L’assistant admin ne dépend d’aucun fournisseur IA ni de crédits. Il répond à des commandes prédéfinies : résumé des réservations, liste des demandes, dossiers et liens actifs, changement de statut après confirmation, et modèles de publications ou de réponses WhatsApp. Les textes sont des modèles à personnaliser, pas de la rédaction IA libre. L’application et Supabase doivent toutefois rester disponibles.

Le chatbot public répond sans appel à un fournisseur IA et sans quota de messages. Il renseigne les tarifs officiels, les déplacements et les moyens de réservation; il ne consulte pas l’agenda et ne confirme pas de créneau. Les questions hors de cette FAQ sont orientées vers WhatsApp. Les réponses sont prédéfinies et ne constituent pas une conversation IA libre.
