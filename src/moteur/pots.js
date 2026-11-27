// Pots principal et annexes, calculés à partir de ce que chacun a engagé dans la donne.

/**
 * @param {{id:string, engage:number, couche:boolean}[]} joueurs
 * @returns {{montant:number, eligibles:string[]}[]} du pot principal au dernier pot annexe.
 * Un pot avec un seul éligible est une mise non suivie : elle revient à son auteur.
 */
export function calculerPots(joueurs) {
  const niveaux = [...new Set(joueurs.filter(j => !j.couche && j.engage > 0).map(j => j.engage))].sort((a, b) => a - b);
  const pots = [];
  let prec = 0;
  for (const niveau of niveaux) {
    let montant = 0;
    for (const j of joueurs) montant += Math.max(0, Math.min(j.engage, niveau) - prec);
    const eligibles = joueurs.filter(j => !j.couche && j.engage >= niveau).map(j => j.id);
    if (montant > 0) {
      // Deux niveaux successifs avec les mêmes éligibles forment un seul pot
      const dernier = pots[pots.length - 1];
      if (dernier && dernier.eligibles.join() === eligibles.join()) dernier.montant += montant;
      else pots.push({ montant, eligibles });
    }
    prec = niveau;
  }
  // Jetons de joueurs couchés au-dessus du plus haut niveau encore en jeu : au dernier pot
  const reste = joueurs.reduce((t, j) => t + Math.max(0, j.engage - prec), 0);
  if (reste > 0 && pots.length) pots[pots.length - 1].montant += reste;
  return pots;
}

/**
 * Partage un pot entre les gagnants. Les jetons qui ne se divisent pas vont aux premiers
 * gagnants à gauche du bouton (ordre fourni par l'appelant).
 */
export function partager(montant, gagnantsDansLOrdre) {
  const n = gagnantsDansLOrdre.length;
  const part = Math.floor(montant / n);
  let reste = montant - part * n;
  return gagnantsDansLOrdre.map(id => ({ id, montant: part + (reste-- > 0 ? 1 : 0) }));
}
