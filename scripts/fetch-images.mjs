#!/usr/bin/env node
/**
 * Récupère une image Wikipédia / Wikimedia Commons pour chaque lieu utilisant
 * encore le placeholder. Met à jour le frontmatter et écrit un fichier de
 * crédits global.
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
const RATE_LIMIT_MS = 250;
const USER_AGENT = 'MonVoyageEnPoche/1.0 (https://monvoyageenpoche.fr)';
const PLACEHOLDER = '/images/placeholder.svg';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const COUNTRY_FILTER = args.find(a => !a.startsWith('--'));

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchWikipedia(lang, title) {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

function upscale(url, width) {
  // .../thumb/x/yy/Name.jpg/320px-Name.jpg → .../thumb/x/yy/Name.jpg/1200px-Name.jpg
  return url.replace(/\/(\d+)px-([^/]+)$/, `/${width}px-$2`);
}

function buildCandidates(title, country) {
  const list = [title];
  // Variantes utiles
  if (title.startsWith("L'")) list.push(title.replace("L'", 'L’'));
  const countryHint = { italie: 'Italie', japon: 'Japon', perou: 'Pérou', namibie: 'Namibie' }[country];
  if (countryHint && !title.includes('(')) list.push(`${title} (${countryHint})`);
  return list;
}

async function findImage(title, country) {
  for (const lang of ['fr', 'en']) {
    for (const candidate of buildCandidates(title, country)) {
      const data = await fetchWikipedia(lang, candidate);
      await sleep(RATE_LIMIT_MS);
      const thumb = data?.thumbnail?.source;
      if (!thumb) continue;
      // Skip flags, coats of arms (souvent .svg.png ou tout petits)
      if (/\.svg\.png$/i.test(thumb)) continue;
      if (data?.thumbnail?.width && data.thumbnail.width < 200) continue;
      return {
        url: upscale(thumb, TARGET_WIDTH),
        page: data.content_urls?.desktop?.page
              || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(candidate)}`,
        title: data.title,
        lang,
      };
    }
  }
  return null;
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

  process.stdout.write(`  ${country}/${slug.padEnd(30)} → recherche « ${fm.title} »… `);

  const image = await findImage(fm.title, country);
  if (!image) {
    console.log('❌ aucune image trouvée');
    return { status: 'not_found', title: fm.title, country, slug };
  }

  const ext = '.jpg';
  const dest = path.join(IMAGES_DIR, country, `${slug}${ext}`);
  const publicPath = `/images/lieux/${country}/${slug}${ext}`;

  try {
    await downloadImage(image.url, dest);
  } catch (e) {
    console.log(`❌ téléchargement: ${e.message}`);
    return { status: 'error', title: fm.title, error: e.message };
  }

  const newContent = content.replace(
    /^image:\s*"[^"]*"$/m,
    `image: "${publicPath}"`,
  );
  await fs.writeFile(filepath, newContent);
  console.log(`✓ (${image.lang}) ${image.title}`);

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
  const countries = (await fs.readdir(LIEUX_DIR)).filter(d =>
    !COUNTRY_FILTER || d === COUNTRY_FILTER
  );
  const results = [];

  for (const country of countries) {
    const dir = path.join(LIEUX_DIR, country);
    const stats = await fs.stat(dir).catch(() => null);
    if (!stats?.isDirectory()) continue;

    console.log(`\n=== ${country.toUpperCase()} ===`);
    const files = (await fs.readdir(dir)).filter(f => f.endsWith('.md')).sort();
    for (const file of files) {
      const slug = path.basename(file, '.md');
      const r = await processLieu(path.join(dir, file), country, slug);
      results.push(r);
    }
  }

  // Summary
  console.log('\n=== RÉSUMÉ ===');
  const ok = results.filter(r => r.status === 'ok');
  const notFound = results.filter(r => r.status === 'not_found');
  const errors = results.filter(r => r.status === 'error');
  const skipped = results.filter(r => r.status === 'skip');
  console.log(`✓ Récupérés : ${ok.length}`);
  console.log(`❌ Non trouvés : ${notFound.length}`);
  console.log(`⚠ Erreurs : ${errors.length}`);
  console.log(`↷ Ignorés : ${skipped.length} (déjà une image)`);
  if (notFound.length) {
    console.log('\nÀ ajouter manuellement (mets une URL Unsplash, Flux, etc.) :');
    notFound.forEach(r => console.log(`  - ${r.country}/${r.slug}  (« ${r.title} »)`));
  }

  // Credits file
  const sorted = [...ok].sort((a, b) => a.country.localeCompare(b.country) || a.title.localeCompare(b.title));
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
  console.error(e);
  process.exit(1);
});
