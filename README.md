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
- `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SECRET_KEY` côté serveur uniquement, pour le rate limiting et les opérations privées. Ne préfixez jamais cette clé avec `VITE_`.
- `LOVABLE_API_KEY` côté serveur pour activer les assistants IA. Sans cette clé, l’assistant public propose WhatsApp au lieu de planter.

L’assistant public répond à une première question tarifaire. À la deuxième interaction, ou si le service IA échoue, il prépare le message et redirige vers WhatsApp. Le rate limiting serveur reste actif (120 requêtes par adresse IP et par heure). Appliquez les migrations Supabase du dépôt avant la mise en production.
