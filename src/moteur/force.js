// Force d'une main : formule de Chen avant le flop, simulation après.

import { nouveauPaquet, cle } from './cartes.js';
import { meilleure } from './evaluation.js';

/** Formule de Chen (de -1 à 20) : une note simple de la force de deux cartes avant le flop. */
export function chen([a, b]) {
  const haute = Math.max(a.r, b.r), basse = Math.min(a.r, b.r);
  const valeur = r => (r === 14 ? 10 : r === 13 ? 8 : r === 12 ? 7 : r === 11 ? 6 : r / 2);
  let s = valeur(haute);
  if (a.r === b.r) s = Math.max(5, s * 2);
  if (a.s === b.s) s += 2;
  const ecart = haute - basse - 1;
  if (a.r !== b.r) {
    s -= ecart <= 0 ? 0 : ecart === 1 ? 1 : ecart === 2 ? 2 : ecart === 3 ? 4 : 5;
    if (ecart <= 1 && haute < 12) s += 1;
  }
  return Math.ceil(s);
}

/**
 * Probabilité de gagner (égalités comptées à moitié) contre n mains inconnues.
 * @param {object[]} main  deux cartes
 * @param {object[]} tableau  0 à 5 cartes
 * @param {number} adversaires
 * @param {number} essais
 * @param {object} rng  générateur (hasard.js)
 * @param {object[]} [exclues]  cartes connues ailleurs (mortes)
 */
export function equite(main, tableau, adversaires, essais, rng, exclues = []) {
  const pris = new Set([...main, ...tableau, ...exclues].map(cle));
  const reste = nouveauPaquet().filter(c => !pris.has(cle(c)));
  const manque = 5 - tableau.length;
  const besoin = adversaires * 2 + manque;
  let total = 0;
  for (let t = 0; t < essais; t++) {
    for (let i = 0; i < besoin; i++) {
      const j = i + Math.floor(rng.suivant() * (reste.length - i));
      [reste[i], reste[j]] = [reste[j], reste[i]];
    }
    const tab = tableau.concat(reste.slice(adversaires * 2, besoin));
    const moi = meilleure(main.concat(tab)).sc;
    let meilleurAdv = 0;
    let egaux = 0;
    for (let a = 0; a < adversaires; a++) {
      const sc = meilleure([reste[a * 2], reste[a * 2 + 1]].concat(tab)).sc;
      if (sc > meilleurAdv) { meilleurAdv = sc; egaux = sc === moi ? 1 : 0; }
      else if (sc === meilleurAdv && sc === moi) egaux++;
    }
    if (moi > meilleurAdv) total += 1;
    else if (moi === meilleurAdv) total += 1 / (egaux + 1);
  }
  return total / essais;
}
