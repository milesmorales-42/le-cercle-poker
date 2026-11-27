// Évaluation des mains, reprise de l'ancien moteur et complétée :
// meilleure main de 5 cartes parmi 5 à 7, noms en français, départage expliqué.

import { nomRang, nomRangPluriel, deRangs, auRang, NOMS_COULEURS } from './cartes.js';

export const CATEGORIES = ['Carte haute', 'Paire', 'Double paire', 'Brelan', 'Quinte', 'Couleur', 'Full', 'Carré', 'Quinte flush', 'Quinte flush royale'];

/** Évalue exactement 5 cartes. sc : score comparable (plus grand = meilleur). */
export function eval5(cs) {
  const rs = cs.map(c => c.r).sort((a, b) => b - a);
  const couleur = cs.every(c => c.s === cs[0].s);
  const n = {};
  for (const r of rs) n[r] = (n[r] || 0) + 1;
  const g = Object.keys(n).map(Number).sort((a, b) => n[b] - n[a] || b - a);
  let haut = 0;
  if (g.length === 5) {
    if (rs[0] - rs[4] === 4) haut = rs[0];
    else if (rs[0] === 14 && rs[1] === 5) haut = 5; // la roue : A-2-3-4-5
  }
  let cat, tb;
  if (haut && couleur) { cat = 8; tb = [haut]; }
  else if (n[g[0]] === 4) { cat = 7; tb = [g[0], g[1]]; }
  else if (n[g[0]] === 3 && n[g[1]] === 2) { cat = 6; tb = [g[0], g[1]]; }
  else if (couleur) { cat = 5; tb = rs; }
  else if (haut) { cat = 4; tb = [haut]; }
  else if (n[g[0]] === 3) { cat = 3; tb = g; }
  else if (n[g[0]] === 2 && n[g[1]] === 2) { cat = 2; tb = g; }
  else if (n[g[0]] === 2) { cat = 1; tb = g; }
  else { cat = 0; tb = rs; }
  let sc = cat;
  for (let i = 0; i < 5; i++) sc = sc * 15 + (tb[i] || 0);
  return { cat, tb, sc, cartes: cs };
}

const COMBIS = {};
function combinaisons(n, k) {
  const id = n + '_' + k;
  if (COMBIS[id]) return COMBIS[id];
  const out = [];
  const rec = (debut, acc) => {
    if (acc.length === k) { out.push(acc.slice()); return; }
    for (let i = debut; i < n; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); }
  };
  rec(0, []);
  return (COMBIS[id] = out);
}

/** Meilleure main de 5 cartes parmi 5, 6 ou 7. */
export function meilleure(cartes) {
  let m = null;
  for (const ix of combinaisons(cartes.length, 5)) {
    const e = eval5(ix.map(i => cartes[i]));
    if (!m || e.sc > m.sc) m = e;
  }
  return m;
}

/** Catégorie affichée (la quinte flush à l'As devient « royale »). */
export const categorie = e => (e.cat === 8 && e.tb[0] === 14 ? 9 : e.cat);

/** Nom complet de la main, à la française. */
export function nommer(e) {
  const t = e.tb;
  switch (e.cat) {
    case 0: return 'Hauteur ' + nomRang(t[0]);
    case 1: return 'Paire ' + deRangs(t[0]);
    case 2: return `Double paire, ${nomRangPluriel(t[0])} et ${nomRangPluriel(t[1])}`;
    case 3: return 'Brelan ' + deRangs(t[0]);
    case 4: return 'Quinte ' + auRang(t[0]);
    case 5: return `Couleur à ${NOMS_COULEURS[e.cartes[0].s]}`;
    case 6: return `Full aux ${nomRangPluriel(t[0])} par les ${nomRangPluriel(t[1])}`;
    case 7: return 'Carré ' + deRangs(t[0]);
    default: return t[0] === 14 ? 'Quinte flush royale' : 'Quinte flush ' + auRang(t[0]);
  }
}

/** Nom court pour les gros titres de l'abattage : « Paire de Rois », « Couleur », « Full »… */
export function titre(e) {
  if (e.cat === 5) return 'Couleur';
  if (e.cat === 6) return 'Full';
  if (e.cat === 2) return 'Double paire';
  return nommer(e);
}

/** Cartes qui forment la combinaison (sans les kickers), pour les mettre en lumière. */
export function coeur(e) {
  const t = e.tb;
  if ([4, 5, 6, 8].includes(e.cat)) return e.cartes.slice();
  if (e.cat === 0) return e.cartes.filter(c => c.r === t[0]);
  if (e.cat === 2) return e.cartes.filter(c => c.r === t[0] || c.r === t[1]);
  return e.cartes.filter(c => c.r === t[0]);
}

/**
 * Explique ce qui sépare deux mains : catégorie, hauteur de la combinaison ou kicker.
 * Renvoie { type: 'categorie' | 'hauteur' | 'kicker' | 'egalite', a, b } (a et b : rangs décisifs).
 */
export function departage(e1, e2) {
  if (e1.sc === e2.sc) return { type: 'egalite' };
  if (e1.cat !== e2.cat) return { type: 'categorie' };
  // Nombre de rangs qui décrivent la combinaison elle-même, avant les kickers
  const nCoeur = { 0: 1, 1: 1, 2: 2, 3: 1, 4: 1, 5: 5, 6: 2, 7: 1, 8: 1 }[e1.cat];
  for (let i = 0; i < 5; i++) {
    const a = e1.tb[i] || 0, b = e2.tb[i] || 0;
    if (a !== b) return { type: i < nCoeur ? 'hauteur' : 'kicker', a, b };
  }
  return { type: 'egalite' };
}
