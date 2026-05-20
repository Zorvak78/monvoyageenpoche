#!/usr/bin/env node
/**
 * Récupère une image Wikipédia / Wikimedia Commons pour chaque lieu utilisant
 * encore le placeholder.
 *
 * Stratégie en 3 niveaux :
 *   1. Lookup direct par titre exact (titles=...) avec suivi de redirections
 *      → fonctionne pour les noms sans homonymie (Bologne, Lecce, Cusco).
 *   2. Recherche full-text avec indice pays (« Florence Italie ») et
 *      gsrlimit élevé → on examine les 10 premiers résultats.
 *   3. Pour chaque candidat, **vérification par coordonnées GPS** :
 *      l'article Wikipedia doit avoir des coordonnées dans un rayon < 80 km
 *      des coordonnées du .md. Élimine les faux positifs (films, personnes,
 *      événements, batailles).
 *
 * Usage :
 *   node scripts/fetch-images.mjs              # tous les pays
 *   node scripts/fetch-images.mjs italie       # un pays spécifique
 *   node scripts/fetch-images.mjs --force      # ré-télécharge tout
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
const RATE_LIMIT_MS = 150;
const COORDS_TOLERANCE_KM = 80;
const USER_AGENT = 'MonVoyageEnPoche/1.0 (https://monvoyageenpoche.fr; contact@monvoyageenpoche.fr)';
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

function haversineKm(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
            Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function mediawikiQuery(lang, params) {
  const url = `https://${lang}.wikipedia.org/w/api.php?` + new URLSearchParams({
    format: 'json',
    formatversion: '2',
    origin: '*',
    ...params,
  });
  for (let retry = 0; retry < 3; retry++) {
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (resp.status === 429) {
        await sleep(2000 * (retry + 1));
        continue;
      }
      if (!resp.ok) return { error: `http_${resp.status}` };
      return { data: await resp.json() };
    } catch (e) {
      if (retry === 2) return { error: `network: ${e.message}` };
      await sleep(1000);
    }
  }
  return { error: 'rate_limit_exhausted' };
}

/**
 * Récupère thumbnail + coords pour un set de pages identifié par titles ou
 * par une recherche.
 */
async function fetchPagesWithImage(lang, baseParams) {
  const r = await mediawikiQuery(lang, {
    action: 'query',
    prop: 'pageimages|coordinates',
    piprop: 'thumbnail',
    pithumbsize: String(TARGET_WIDTH),
    colimit: '1',
    redirects: '1',
    ...baseParams,
  });
  if (r.error) return { error: r.error };
  const pages = r.data?.query?.pages;
  if (!pages || pages.length === 0) return { error: 'no_pages' };
  return { pages };
}

function evaluateCandidate(page, lieuCoords, lang, log) {
  const thumb = page.thumbnail?.source;
  if (!thumb) {
    log.push(`     · ${page.title} → pas de thumbnail`);
    return null;
  }
  if (/\.svg\.png$/i.test(thumb)) {
    log.push(`     · ${page.title} → SVG ignoré`);
    return null;
  }
  if (page.thumbnail.width < 200) {
    log.push(`     · ${page.title} → image trop petite`);
    return null;
  }
  // Vérification coords
  const co = page.coordinates?.[0];
  if (!co) {
    log.push(`     · ${page.title} → article sans coordonnées (peut-être un article hors-lieu)`);
    return { ...makeResult(page, thumb, lang), uncertain: true };
  }
  const articleCoords = { lat: co.lat, lng: co.lon };
  const distance = haversineKm(lieuCoords, articleCoords);
  if (distance > COORDS_TOLERANCE_KM) {
    log.push(`     · ${page.title} → coords à ${Math.round(distance)} km, rejeté`);
    return null;
  }
  log.push(`     · ${page.title} → coords à ${Math.round(distance)} km ✓`);
  return makeResult(page, thumb, lang);
}

function makeResult(page, thumb, lang) {
  return {
    url: thumb,
    title: page.title,
    page: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
    lang,
  };
}

async function findImage(title, country, lieuCoords) {
  const cn = COUNTRY_NAMES[country] || { fr: country, en: country };
  const log = [];
  let uncertainFallback = null;

  // ─── NIVEAU 1 : lookup direct par titre ───
  for (const lang of ['fr', 'en']) {
    const titleVariants = [title, `${title} (${cn[lang]})`];
    for (const t of titleVariants) {
      log.push(`  [${lang}] lookup direct « ${t} »`);
      const r = await fetchPagesWithImage(lang, { titles: t });
      await sleep(RATE_LIMIT_MS);
      if (r.error) { log.push(`     · ${r.error}`); continue; }
      for (const page of r.pages) {
        if (page.missing) { log.push(`     · ${page.title} → article inexistant`); continue; }
        const ev = evaluateCandidate(page, lieuCoords, lang, log);
        if (ev && !ev.uncertain) return { ...ev, log };
        if (ev?.uncertain && !uncertainFallback) uncertainFallback = { ...ev, log: [...log] };
      }
    }
  }

  // ─── NIVEAU 2 : recherche avec indice pays ───
  for (const lang of ['fr', 'en']) {
    const queries = [`${title} ${cn[lang]}`, title];
    for (const q of queries) {
      log.push(`  [${lang}] recherche « ${q} »`);
      const r = await fetchPagesWithImage(lang, {
        generator: 'search',
        gsrsearch: q,
        gsrlimit: '10',
      });
      await sleep(RATE_LIMIT_MS);
      if (r.error) { log.push(`     · ${r.error}`); continue; }
      // Trier par index de recherche
      const sorted = [...r.pages].sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
      for (const page of sorted) {
        const ev = evaluateCandidate(page, lieuCoords, lang, log);
        if (ev && !ev.uncertain) return { ...ev, log };
        if (ev?.uncertain && !uncertainFallback) uncertainFallback = { ...ev, log: [...log] };
      }
    }
  }

  if (uncertainFallback) {
    log.push('  ⚠ retour à un candidat sans coordonnées (incertain)');
    return { ...uncertainFallback, uncertain: true, log };
  }

  return { error: 'not_found', log };
}

async function downloadImage(url, dest) {
  const resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
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
    if (km) {
      let v = km[2].trim();
      if (/^".*"$/.test(v)) v = v.slice(1, -1);
      fm[km[1]] = v;
    }
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

  const lat = Number(fm.lat);
  const lng = Number(fm.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.log(`  ${country}/${slug} ⚠ coordonnées invalides`);
    return { status: 'error', error: 'invalid_coords', title: fm.title };
  }

  console.log(`\n  ${country}/${slug} — « ${fm.title} »`);
  const image = await findImage(fm.title, country, { lat, lng });
  if (image.log) image.log.forEach(l => console.log(l));

  if (!image.url) {
    console.log(`  ❌ aucune image trouvée pour ${fm.title}`);
    return { status: 'not_found', title: fm.title, country, slug };
  }

  const dest = path.join(IMAGES_DIR, country, `${slug}.jpg`);
  const publicPath = `/images/lieux/${country}/${slug}.jpg`;
  try {
    await downloadImage(image.url, dest);
  } catch (e) {
    console.log(`  ❌ téléchargement: ${e.message}`);
    return { status: 'error', title: fm.title, error: e.message };
  }

  const newContent = content.replace(/^image:\s*"[^"]*"$/m, `image: "${publicPath}"`);
  await fs.writeFile(filepath, newContent);
  console.log(`  ✓ [${image.lang}] ${image.title}${image.uncertain ? ' (incertain — vérifier)' : ''}`);

  return {
    status: 'ok',
    title: fm.title,
    matched: image.title,
    country, slug,
    source: image.url,
    page: image.page,
    uncertain: !!image.uncertain,
  };
}

async function main() {
  let countries = (await fs.readdir(LIEUX_DIR, { withFileTypes: true }))
    .filter(d => d.isDirectory()).map(d => d.name).sort();
  if (COUNTRY_FILTER) countries = countries.filter(c => c === COUNTRY_FILTER);

  console.log(`Pays à traiter : ${countries.join(', ')}`);
  console.log(`FORCE = ${FORCE}`);
  console.log(`Tolérance coords : ${COORDS_TOLERANCE_KM} km`);

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
    }
  }

  const ok = results.filter(r => r.status === 'ok');
  const okSure = ok.filter(r => !r.uncertain);
  const okUncertain = ok.filter(r => r.uncertain);
  const notFound = results.filter(r => r.status === 'not_found');
  const errors = results.filter(r => r.status === 'error');
  const skipped = results.filter(r => r.status === 'skip');

  console.log('\n\n=== RÉSUMÉ ===');
  console.log(`✓ Récupérés (sûrs)    : ${okSure.length}`);
  console.log(`? Récupérés (à vérifier) : ${okUncertain.length}`);
  console.log(`❌ Non trouvés         : ${notFound.length}`);
  console.log(`⚠ Erreurs             : ${errors.length}`);
  console.log(`↷ Ignorés              : ${skipped.length}`);

  if (notFound.length) {
    console.log('\nÀ ajouter manuellement :');
    notFound.forEach(r => console.log(`  - ${r.country}/${r.slug}  (« ${r.title} »)`));
  }
  if (okUncertain.length) {
    console.log('\nÀ vérifier visuellement (image acceptée mais sans contrôle GPS) :');
    okUncertain.forEach(r => console.log(`  - ${r.country}/${r.slug}  (« ${r.matched} »)`));
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
    ...sorted.map(r => `| ${r.country} | ${r.title}${r.uncertain ? ' ⚠' : ''} | [${r.matched}](${r.page}) |`),
    '',
  ].join('\n');
  await fs.writeFile(CREDITS_FILE, credits);
  console.log(`\nCrédits écrits : ${CREDITS_FILE}`);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
