/**
 * Ecrit les tenues generees directement dans public/garde-robe.html.
 *
 * Pourquoi : la page doit rester lisible dans les contextes qui n'executent
 * pas le JavaScript (apercu de fichier, navigateur embarque, app Fichiers).
 * Le script de la page regenere les tenues a chaque ouverture des qu'il tourne,
 * donc ce pre-rendu n'est qu'une photographie de secours.
 *
 * A relancer apres avoir modifie les pieces ou les regles :
 *   node scripts/build-garde-robe.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const CHEMIN = new URL('../public/garde-robe.html', import.meta.url);
const html = readFileSync(CHEMIN, 'utf8');

// Le moteur (donnees + regles + generateur + rendu d'une carte) est lu dans la
// page elle-meme : une seule source de verite, aucune duplication possible.
const debut = html.indexOf('/* ===', html.indexOf('"use strict";'));
const fin = html.indexOf('/* --- fin du bloc partage avec le script de pre-rendu --- */');
if (debut < 0 || fin < 0) throw new Error('Bloc moteur introuvable dans public/garde-robe.html');

const moteur = html.slice(debut, fin);
const { TENUES, carteHTML } = new Function(moteur + '\nreturn { TENUES, carteHTML };')();

const cartes = TENUES.map(t => carteHTML(t, true)).join('\n');
const compte = TENUES.length + (TENUES.length > 1 ? ' tenues' : ' tenue');

const sortie = html
  .replace(/<!--CARTES-->[\s\S]*?<!--\/CARTES-->/, '<!--CARTES-->\n' + cartes + '\n<!--/CARTES-->')
  .replace(/(<span class="compteur" id="compteur">)[^<]*(<\/span>)/, '$1' + compte + '$2');

writeFileSync(CHEMIN, sortie);
console.log(TENUES.length + ' tenues ecrites dans public/garde-robe.html');
