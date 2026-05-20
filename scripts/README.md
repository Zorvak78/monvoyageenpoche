# Scripts

## `fetch-images.mjs`

Récupère une photo Wikipédia / Wikimedia Commons pour chaque lieu utilisant
encore le placeholder. Met à jour le champ `image:` dans le frontmatter et
génère un fichier `IMAGE_CREDITS.md` à la racine.

### Utilisation

À lancer depuis ton poste local (le container Claude n'a pas l'accès réseau
vers Wikipédia).

```bash
# Récupère les images pour tous les pays
npm run fetch-images

# Cible un seul pays
npm run fetch-images -- italie
npm run fetch-images -- japon
npm run fetch-images -- perou

# Force la récupération même si le lieu a déjà une image (rare cas)
npm run fetch-images -- --force
```

Le script :
- ignore les lieux qui ont déjà une image autre que `placeholder.svg`
- télécharge en `1200 px` de large en `.jpg`
- enregistre sous `public/images/lieux/<pays>/<slug>.jpg`
- met à jour le `.md` du lieu pour pointer sur ce nouveau chemin
- liste à la fin les lieux pour lesquels aucune image n'a été trouvée

Temps d'exécution : environ 1 à 2 minutes pour ~140 lieux.

### Après exécution

```bash
git add public/images/lieux src/content/lieux IMAGE_CREDITS.md
git commit -m "feat: images Wikipédia pour les lieux"
git push
```

### Si certaines images sont incorrectes

Wikipédia renvoie parfois une image inattendue (drapeau, blason au lieu d'une
photo). Pour corriger un lieu :

1. Trouver la bonne image (Wikimedia Commons, Unsplash, Flux)
2. La poser dans `public/images/lieux/<pays>/<slug>.jpg`
3. Vérifier que le `.md` pointe bien dessus

Pour les lieux marqués « non trouvés » dans le résumé, idem : déposer
manuellement l'image et mettre à jour le frontmatter.
