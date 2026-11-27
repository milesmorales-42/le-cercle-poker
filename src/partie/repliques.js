// Ce que disent les adversaires quand ils agissent. {x} : montant, {pot} : pot après la mise.

export const REPLIQUES = {
  baron: {
    parole: ['Parole.', 'Je vous écoute.', 'Parole, voyons la suite.'],
    suivre: ['Je suis.', 'Soit.', 'Allons-y.'],
    miser: ['Je mise {x}. Histoire de voir.', 'Disons {x}.', '{x}, pour commencer.'],
    relancer: ['Je relance à {x}.', 'Relance, {x}. Pour l’élégance du geste.'],
    tapis: ['Tapis.', 'Tout. Tapis.'],
    coucher: ['Trop cher pour moi.', 'Je vous laisse ça.'],
    gagne: ['Merci, merci.', 'La chance sourit aux audacieux.'],
    perd: ['Hmpf. Bien joué.', 'La chance du débutant.'],
  },
  odette: {
    parole: ['Parole.'],
    suivre: ['Je suis.', 'Je paie.'],
    miser: ['Je mise {x}.', '{x}.'],
    relancer: ['Relance à {x}.'],
    tapis: ['Tapis.'],
    coucher: ['Je me couche. Ce n’est pas mon heure.', 'Sans moi.', 'Je passe.'],
    gagne: ['Merci bien.', 'Ah, voilà.'],
    perd: ['Bien joué.', 'Je l’avais vu venir.'],
  },
  kiki: {
    parole: ['Check.', 'Parole.'],
    suivre: ['Je suis. On sait jamais.', 'Vas-y, je paie.', 'Je suis, je suis.'],
    miser: ['Allez, {x}.'],
    relancer: ['Relance, {x} !'],
    tapis: ['Tapis ! Allez.'],
    coucher: ['Bon, je lâche.', 'Pas pour moi.'],
    gagne: ['Ah ouais !', 'Trop facile.'],
    perd: ['Sérieux ?', 'Ah non…'],
  },
  notaire: {
    parole: ['Parole.'],
    suivre: ['{x} pour en gagner {pot}. Je suis.', 'Je suis.'],
    miser: ['{x}.'],
    relancer: ['Relance à {x}.'],
    tapis: ['Tapis.'],
    coucher: ['Je passe.'],
    gagne: ['Comme prévu.'],
    perd: ['Statistiquement acceptable.'],
  },
};

export function replique(id, quoi, valeurs = {}) {
  const liste = REPLIQUES[id]?.[quoi];
  if (!liste) return null;
  const t = liste[Math.floor(Math.random() * liste.length)];
  return t.replace(/\{(\w+)\}/g, (_, k) => valeurs[k] ?? '');
}
