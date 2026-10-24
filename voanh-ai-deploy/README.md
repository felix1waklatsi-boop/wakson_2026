# VOANH AI — production deployment

Version sécurisée de VOANH AI basée sur l'interface fournie.

## Architecture

- `index.html` : interface web, stockage local IndexedDB, conversations, mémoire, agents, export/import, thèmes, dictée vocale et vision.
- `api/chat.js` : proxy serveur vers Mistral Chat Completions.
- `api/agents.js` : génération des 20 agents lors de l'initialisation.
- `api/health.js` : vérification de configuration serveur.
- `vercel.json` : configuration de déploiement et en-têtes de sécurité.

## Sécurité

La clé Mistral n'est **jamais envoyée au navigateur** et n'est pas incluse dans le dépôt. Elle doit être définie comme variable d'environnement `MISTRAL_API_KEY` dans Vercel.

## Déploiement Vercel

1. Créer une clé API Mistral dans Mistral Studio.
2. Importer ce dossier dans un dépôt GitHub ou utiliser Vercel CLI.
3. Dans Vercel → Project Settings → Environment Variables, créer `MISTRAL_API_KEY` pour Production (et Preview si souhaité).
4. Déployer.
5. Ouvrir l'URL de production : le premier écran vérifie automatiquement `/api/health`.

### CLI

```bash
npm install -g vercel
vercel login
vercel
vercel env add MISTRAL_API_KEY production
vercel --prod
```

## Local

```bash
npm install -g vercel
vercel dev
```

Puis ouvrir l'URL locale indiquée par Vercel.

## Modèles

La version fournie utilise les identifiants Mistral actuels suivants :
- `mistral-large-latest`
- `mistral-medium-3-5`
- `mistral-small-latest`
- `codestral-latest`
- `ministral-14b-latest`
- `ministral-8b-latest`
- `ministral-3b-latest`

Les capacités et disponibilités peuvent évoluer chez Mistral. Le serveur applique une liste blanche afin d'éviter qu'un modèle arbitraire soit injecté dans l'API.
