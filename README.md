# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Espace privé

Tout ce qui se trouve sous `/prive/` est protégé par identifiant et mot de passe,
vérifiés par le Worker (`worker/index.ts`). Ces pages ne sont **pas** des fichiers
statiques : elles sont embarquées dans le Worker (`private/*.html`) et ne sont
transmises qu'après une connexion réussie.

### Mise en service

Le Worker est déployé par `npx wrangler deploy` (configuration : `wrangler.toml`).
Dans le tableau de bord Cloudflare, **Settings → Variables and Secrets**, définir :

- `PRIVE_USER` — identifiant de connexion (Text) ;
- `PRIVE_PASSWORD` — mot de passe (**Secret**).

Puis redéployer. L'espace est accessible sur `/prive/`.
Changer `PRIVE_PASSWORD` invalide immédiatement toutes les sessions ouvertes.

> Le champ `name` de `wrangler.toml` doit correspondre au nom du Worker créé
> dans le tableau de bord, sinon un second Worker serait créé au déploiement.

### Ajouter une rubrique

1. Créer `private/<nom>.html` ;
2. l'importer dans `worker/index.ts` et l'ajouter à la table `PAGES` ;
3. ajouter une carte dans `private/hub.html`.

### Essai en local

```sh
npm run build
npx wrangler dev --var PRIVE_USER:test --var PRIVE_PASSWORD:test
```
