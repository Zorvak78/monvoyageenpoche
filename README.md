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
vérifiés côté serveur par `functions/_middleware.ts` : sans session valide, aucune
page n'est transmise (pas même le code de l'application).

### Mise en service

1. Créer un projet **Cloudflare Pages** connecté à ce dépôt
   (commande de build `npm run build`, dossier de sortie `dist`).
2. Dans **Settings → Variables and Secrets**, définir :
   - `PRIVE_USER` — l'identifiant de connexion ;
   - `PRIVE_PASSWORD` — le mot de passe (type *Secret*).
3. Redéployer. L'espace est alors accessible sur `https://<projet>.pages.dev/prive/`.

Changer `PRIVE_PASSWORD` invalide immédiatement toutes les sessions ouvertes.

### Ajouter une rubrique

Créer `public/prive/<nom>/index.html` : la protection s'applique automatiquement.
Ajouter ensuite une carte dans `public/prive/index.html` pour y accéder.

### Développement local

```sh
npm run build
npx wrangler pages dev dist --binding PRIVE_USER=test PRIVE_PASSWORD=test
```
