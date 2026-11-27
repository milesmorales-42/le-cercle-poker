// Intelligence des adversaires, réglée par personnalité.
// Reprend l'idée de l'ancien moteur (chances contre des mains au hasard + cote du pot)
// et l'étend au jeu à plusieurs avec des styles bien distincts.

import { chen, equite } from './force.js';

/**
 * jeu : part des mains jouées avant le flop (0 serré … 1 tout)
 * agressivite : goût pour miser et relancer plutôt que suivre
 * bluff : fréquence des mises sans jeu
 * resistance : tendance à payer même sans la bonne cote
 * justesse : précision du calcul de cote (0 approximatif … 1 exact)
 */
export const PROFILS = {
  baron: { jeu: 0.72, agressivite: 0.72, bluff: 0.3, resistance: 0.3, justesse: 0.5 },
  odette: { jeu: 0.24, agressivite: 0.28, bluff: 0.03, resistance: 0.12, justesse: 0.75 },
  kiki: { jeu: 0.7, agressivite: 0.14, bluff: 0.04, resistance: 0.75, justesse: 0.3 },
  notaire: { jeu: 0.36, agressivite: 0.6, bluff: 0.12, resistance: 0.2, justesse: 0.95 },
};

/** Un adversaire progresse avec le niveau (0 à 1) : moins de cadeaux, plus de justesse. */
export function profilAuNiveau(nom, niveau = 0) {
  const p = { ...PROFILS[nom] };
  p.justesse = Math.min(1, p.justesse + niveau * 0.35);
  p.resistance = Math.max(0.05, p.resistance - niveau * 0.15);
  if (nom === 'baron') p.bluff = Math.max(0.15, p.bluff - niveau * 0.1);
  if (nom === 'odette') p.agressivite = Math.min(0.55, p.agressivite + niveau * 0.25);
  return p;
}

const arrondir = (x, pas) => Math.max(pas, Math.round(x / pas) * pas);

/**
 * Décision d'un adversaire.
 * @returns {{type:string, a?:number, intention:'valeur'|'bluff'|'faible'|'moyen', equite:number}}
 */
export function decider(donne, id, profil, rng) {
  const j = donne.joueur(id);
  const o = donne.options(id);
  const adversaires = donne.enJeu.length - 1;
  const r = rng.suivant();
  const pas = donne.petite >= 5 ? 5 : 1;
  const tailleMise = f => {
    const brut = donne.miseMax + (o.pot + o.aSuivre) * f;
    return Math.min(o.relanceMaxA, Math.max(o.relanceMinA, arrondir(brut, pas)));
  };

  // ---------- avant le flop ----------
  if (donne.rue === 0) {
    const note = chen(j.cartes);
    const eq = 0.3 + note / 40; // indication grossière pour l'interface
    let seuil = 10 - profil.jeu * 8;
    const relances = Math.max(0, Math.round((donne.miseMax - donne.grosse) / donne.grosse));
    seuil += Math.min(4, relances * 1.5);
    if (o.aSuivre > j.tapis * 0.4) seuil += 3; // payer gros demande une vraie main
    const forte = note >= seuil + 4;
    if (forte && o.peutRelancer && r < profil.agressivite + 0.25) {
      const cible = donne.miseMax <= donne.grosse ? donne.grosse * 3 : donne.miseMax * 2.6;
      return { type: 'relancer', a: Math.min(o.relanceMaxA, Math.max(o.relanceMinA, arrondir(cible, pas))), intention: 'valeur', equite: eq };
    }
    if (note >= seuil) return { type: o.peutParler ? 'parole' : 'suivre', intention: forte ? 'valeur' : 'moyen', equite: eq };
    if (o.peutParler) return { type: 'parole', intention: 'faible', equite: eq };
    if (o.peutRelancer && r < profil.bluff * 0.35 && relances === 0) {
      return { type: 'relancer', a: Math.min(o.relanceMaxA, Math.max(o.relanceMinA, arrondir(donne.grosse * 3, pas))), intention: 'bluff', equite: eq };
    }
    if (o.aSuivre <= donne.grosse && rng.suivant() < profil.resistance * 0.8) return { type: 'suivre', intention: 'faible', equite: eq };
    return { type: 'coucher', intention: 'faible', equite: eq };
  }

  // ---------- après le flop ----------
  const essais = 160 + Math.round(profil.justesse * 160);
  const eq = equite(j.cartes, donne.tableau, Math.max(1, adversaires), essais, rng);
  // Un joueur peu précis se trompe sur sa propre force
  const percue = Math.min(1, Math.max(0, eq + (rng.suivant() - 0.5) * (1 - profil.justesse) * 0.3));
  const cote = o.aSuivre > 0 ? o.aSuivre / (o.pot + o.aSuivre) : 0;
  const valeur = percue > 0.62 - profil.agressivite * 0.08;
  const monstre = percue > 0.82;

  if (o.peutParler) {
    if (valeur && o.peutRelancer && r < profil.agressivite + 0.3) {
      return { type: 'relancer', a: tailleMise(monstre ? 0.75 : 0.55), intention: 'valeur', equite: eq };
    }
    const tableauFait = donne.rue >= 1;
    if (tableauFait && o.peutRelancer && rng.suivant() < profil.bluff * (adversaires > 1 ? 0.6 : 1)) {
      return { type: 'relancer', a: tailleMise(0.6), intention: 'bluff', equite: eq };
    }
    return { type: 'parole', intention: percue > 0.4 ? 'moyen' : 'faible', equite: eq };
  }

  // Face à une mise
  if (monstre && o.peutRelancer && r < profil.agressivite + 0.15) {
    return { type: 'relancer', a: tailleMise(0.85), intention: 'valeur', equite: eq };
  }
  const marge = (1 - profil.justesse) * 0.08;
  const engageTout = o.suivreEstTapis || o.aSuivre > j.tapis * 0.5;
  const exigence = cote + (engageTout ? 0.08 : 0.02) - marge;
  if (percue >= exigence) return { type: 'suivre', intention: valeur ? 'valeur' : 'moyen', equite: eq };
  if (!engageTout && rng.suivant() < profil.resistance * (1 - cote)) return { type: 'suivre', intention: 'faible', equite: eq };
  if (o.peutRelancer && !engageTout && rng.suivant() < profil.bluff * 0.25) {
    return { type: 'relancer', a: tailleMise(0.9), intention: 'bluff', equite: eq };
  }
  return { type: 'coucher', intention: 'faible', equite: eq };
}
