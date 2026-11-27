// Générateur pseudo-aléatoire reproductible (mulberry32) : utile pour les tests et les rejouer.

export function generateur(graine = Date.now() >>> 0) {
  let a = graine >>> 0;
  const suivant = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    suivant,
    entier: n => Math.floor(suivant() * n),
    melanger(tab) {
      for (let i = tab.length - 1; i > 0; i--) {
        const j = Math.floor(suivant() * (i + 1));
        [tab[i], tab[j]] = [tab[j], tab[i]];
      }
      return tab;
    },
    choisir: tab => tab[Math.floor(suivant() * tab.length)],
  };
}
