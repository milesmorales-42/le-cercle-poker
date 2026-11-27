// Cartes : { r: 2..14, s: 0..3 }. Couleurs : 0 pique, 1 cœur, 2 carreau, 3 trèfle.

export const COULEURS = ['pique', 'coeur', 'carreau', 'trefle'];
export const NOMS_COULEURS = ['pique', 'cœur', 'carreau', 'trèfle'];
export const SYMBOLES = ['♠', '♥', '♦', '♣'];

const COURT = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J' };
const SINGULIER = { 14: 'As', 13: 'Roi', 12: 'Dame', 11: 'Valet' };
const PLURIEL = { 14: 'As', 13: 'Rois', 12: 'Dames', 11: 'Valets' };

/** Indice imprimé sur la carte : A, K, Q, J, 10…2 */
export const indice = r => COURT[r] || String(r);
/** « As », « Roi », « Dame », « Valet », « 10 »… */
export const nomRang = r => SINGULIER[r] || String(r);
export const nomRangPluriel = r => PLURIEL[r] || String(r);
/** « d'As », « de Rois », « de 7 » */
export const deRangs = r => (r === 14 ? 'd’As' : 'de ' + nomRangPluriel(r));
/** « à l'As », « à la Dame », « au Roi », « au 9 » */
export const auRang = r => (r === 14 ? 'à l’As' : r === 12 ? 'à la Dame' : 'au ' + nomRang(r));
export const rouge = c => c.s === 1 || c.s === 2;
export const cle = c => c.r * 4 + c.s;
export const nomCarte = c => `${nomRang(c.r)} de ${NOMS_COULEURS[c.s]}`;

export function nouveauPaquet() {
  const p = [];
  for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) p.push({ r, s });
  return p;
}

/** Lit une notation compacte : « As Kh Td 2c » (rangs 23456789TJQKA, couleurs s h d c). */
export function lire(texte) {
  if (!texte) return [];
  return texte.trim().split(/\s+/).map(t => {
    const r = '23456789TJQKA'.indexOf(t[0].toUpperCase()) + 2;
    const s = 'shdc'.indexOf(t[1].toLowerCase());
    if (r < 2 || s < 0) throw new Error(`Carte illisible : ${t}`);
    return { r, s };
  });
}

export const ecrire = cartes => cartes.map(c => '23456789TJQKA'[c.r - 2] + 'shdc'[c.s]).join(' ');
