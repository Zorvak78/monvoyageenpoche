#!/usr/bin/env node
/**
 * Récupère une image Wikipédia / Wikimedia Commons pour chaque lieu utilisant
 * encore le placeholder. Met à jour le frontmatter et écrit un fichier de
 * crédits global.
 *
 * Stratégie :
 *   1. Cherche l'article via l'API de recherche MediaWiki (fr puis en) avec un
 *      indice pays pour désambiguïser (« Florence Italie » au lieu de
 *      « Florence » qui tombe sur la page d'homonymie).
 *   2. Récupère le thumbnail 1200 px de l'article trouvé via prop=pageimages.
 *   3. Télécharge et met à jour le frontmatter.
 *
 * Usage :
 *   node scripts/fetch-images.mjs              # tous les pays
 *   node scripts/fetch-images.mjs italie       # un pays spécifique
 *   node scripts/fetch-images.mjs --force      # force la récupération même
 *                                              # si une image est déjà définie
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LIEUX_DIR = path.join(ROOT, 'src/content/lieux');
const IMAGES_DIR = path.join(ROOT, 'public/images/lieux');
const CREDITS_FILE = path.join(ROOT, 'IMAGE_CREDITS.md');

const TARGET_WIDTH = 1200;
const RATE_LIMIT_MS = 200;
const USER_AGENT = 'MonVoyageEnPoche/1.0 (https://monvoyageenpoche.fr; contact@monvoyageenpoche.fr) Node/22';
const PLACEHOLDER = '/images/placeholder.svg';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const COUNTRY_FILTER = args.find(a => !a.startsWith('--'));

const COUNTRY_NAMES = {
  italie:  { fr: 'Italie',  en: 'Italy' },
  japon:   { fr: 'Japon',   en: 'Japan' },
  perou:   { fr: 'Pérou',   en: 'Peru' },
  namibie: { fr: 'Namibie', en: 'Namibia' },
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Recherche un article via l'API de recherche puis récupère son thumbnail.
 * Utilise generator=search qui combine recherche + récupération d'images en
 * une seule requête.
 */
async function searchAndGetImage(lang, query) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: String(TARGET_WIDTH),
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '3',
    redirects: '1',
    origin: '*',
  });
  const url = `https://${lang}.wikipedia.org/w/api.php?${params}`;

  let resp;
  try {
    resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  } catch (e) {
    return { error: `network: ${e.message}` };
  }
  if (resp.status === 429) {
    return { error: 'rate_limit', retry: true };
  }
  if (!resp.ok) {
    return { error: `http_${resp.status}` };
  }

  let data;
  try {
    data = await resp.json();
  } catch {
    return { error: 'invalid_json' };
  }

  const pages = data?.query?.pages;
  if (!pages) return { error: 'no_results' };

  // Trier par ordre de recherche (index)
  const sorted = Object.values(pages).sort((a, b) => (a.index || 0) - (b.index || 0));
  for (const page of sorted) {
    const thumb = page.thumbnail?.source;
    if (!thumb) continue;
    if (/\.svg\.png$/i.test(thumb)) continue;
    if (page.thumbnail.width < 200) continue;
    return {
      url: thumb,
      title: page.title,
      page: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      lang,
    };
  }
  return { error: 'no_thumbnail_in_results' };
}

async function findImage(title, country) {
  const cn = COUNTRY_NAMES[country] || { fr: country, en: country };
  // Liste de requêtes, par ordre de préférence
  const queries = [
    { lang: 'fr', q: `${title} ${cn.fr}` },
    { lang: 'fr', q: title },
    { lang: 'en', q: `${title} ${cn.en}` },
    { lang: 'en', q: title },
  ];

  const attempts = [];
  for (const { lang, q } of queries) {
    let r;
    for (let retry = 0; retry < 3; retry++) {
      r = await searchAndGetImage(lang, q);
      if (r.url) return { ...r, attempts };
      attempts.push({ lang, q, error: r.error });
      if (r.retry) {
        await sleep(2000 * (retry + 1));
        continue;
      }
      break;
    }
    await sleep(RATE_LIMIT_MS);
  }
  return { error: 'not_found', attempts };
}

async function downloadImage(url, dest) {
  const resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${url}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const km = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (km) fm[km[1]] = km[2].replace(/^"(.*)"$/, '$1');
  }
  return fm;
}

async function processLieu(filepath, country, slug) {
  const content = await fs.readFile(filepath, 'utf8');
  const fm = parseFrontmatter(content);
  if (!fm?.title) return { status: 'skip', reason: 'no-title' };

  const currentImage = fm.image || '';
  const isPlaceholder = !currentImage || currentImage === PLACEHOLDER;
  if (!FORCE && !isPlaceholder) {
    return { status: 'skip', reason: 'already-has-image', title: fm.title };
  }

  const padded = `${country}/${slug}`.padEnd(35);
  process.stdout.write(`  ${padded} ${fm.title.padEnd(30)} `);

  const image = await findImage(fm.title, country);
  if (!image.url) {
    console.log(`❌ ${image.error || 'not_found'}`);
    if (image.attempts) {
      for (const a of image.attempts) {
        console.log(`     · [${a.lang}] "${a.q}" → ${a.error}`);
      }
    }
    return { status: 'not_found', title: fm.title, country, slug };
  }

  const dest = path.join(IMAGES_DIR, country, `${slug}.jpg`);
  const publicPath = `/images/lieux/${country}/${slug}.jpg`;
  try {
    await downloadImage(image.url, dest);
  } catch (e) {
    console.log(`❌ download: ${e.message}`);
    return { status: 'error', title: fm.title, error: e.message };
  }

  const newContent = content.replace(/^image:\s*"[^"]*"$/m, `image: "${publicPath}"`);
  await fs.writeFile(filepath, newContent);
  console.log(`✓ [${image.lang}] ${image.title}`);

  return {
    status: 'ok',
    title: fm.title,
    matched: image.title,
    country, slug,
    source: image.url,
    page: image.page,
  };
}

async function main() {
  let countries = (await fs.readdir(LIEUX_DIR, { withFileTypes: true }))
    .filter(d => d.isDirectory()).map(d => d.name).sort();
  if (COUNTRY_FILTER) countries = countries.filter(c => c === COUNTRY_FILTER);

  console.log(`Pays à traiter : ${countries.join(', ')}`);
  console.log(`FORCE = ${FORCE}`);
  console.log('');

  const results = [];
  for (const country of countries) {
    const dir = path.join(LIEUX_DIR, country);
    console.log(`\n=== ${country.toUpperCase()} ===`);
    const files = (await fs.readdir(dir)).filter(f => f.endsWith('.md')).sort();
    for (const file of files) {
      const slug = path.basename(file, '.md');
      try {
        const r = await processLieu(path.join(dir, file), country, slug);
        results.push(r);
      } catch (e) {
        console.log(`  ${country}/${slug} ⚠ ${e.message}`);
        results.push({ status: 'error', country, slug, error: e.message });
      }
      await sleep(RATE_LIMIT_MS);
    }
  }

  const ok = results.filter(r => r.status === 'ok');
  const notFound = results.filter(r => r.status === 'not_found');
  const errors = results.filter(r => r.status === 'error');
  const skipped = results.filter(r => r.status === 'skip');

  console.log('\n\n=== RÉSUMÉ ===');
  console.log(`✓ Récupérés      : ${ok.length}`);
  console.log(`❌ Non trouvés    : ${notFound.length}`);
  console.log(`⚠ Erreurs        : ${errors.length}`);
  console.log(`↷ Ignorés         : ${skipped.length} (déjà une image)`);

  if (notFound.length) {
    console.log('\nÀ ajouter manuellement :');
    notFound.forEach(r => console.log(`  - ${r.country}/${r.slug}  (« ${r.title} »)`));
  }

  const sorted = [...ok].sort((a, b) =>
    a.country.localeCompare(b.country) || a.title.localeCompare(b.title)
  );
  const credits = [
    '# Crédits images',
    '',
    'Toutes les photos hébergées localement viennent de Wikipédia / Wikimedia Commons, sous licence Creative Commons (CC BY-SA principalement) ou domaine public. Cliquer sur le lien pour les conditions exactes de chaque image.',
    '',
    'Pour signaler une image incorrecte ou demander un retrait, contacter contact@monvoyageenpoche.fr.',
    '',
    '| Pays | Lieu | Source Wikipédia |',
    '|---|---|---|',
    ...sorted.map(r => `| ${r.country} | ${r.title} | [${r.matched}](${r.page}) |`),
    '',
  ].join('\n');
  await fs.writeFile(CREDITS_FILE, credits);
  console.log(`\nCrédits écrits : ${CREDITS_FILE}`);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
