// Une donne de Texas Hold'em, de 2 à 6 joueurs : blindes, tours d'enchères, tapis,
// pots annexes et abattage. Le moteur est synchrone ; il consigne chaque étape dans
// des événements que l'interface anime ensuite à son rythme.

import { nouveauPaquet, cle } from './cartes.js';
import { meilleure } from './evaluation.js';
import { calculerPots, partager } from './pots.js';
import { generateur } from './hasard.js';

export const RUES = ['preflop', 'flop', 'turn', 'river'];

export class Donne {
  /**
   * @param {object} o
   * @param {{id:string, nom:string, tapis:number}[]} o.joueurs  dans l'ordre des sièges (sens des aiguilles d'une montre)
   * @param {string} o.bouton  id du joueur au bouton
   * @param {number} o.petite  petite blinde
   * @param {number} o.grosse  grosse blinde
   * @param {Object<string, object[]>} [o.mains]  cartes imposées par joueur (donnes scénarisées)
   * @param {object[]} [o.tableau]  cartes communes imposées (5)
   * @param {object} [o.rng]
   */
  constructor({ joueurs, bouton, petite, grosse, mains = {}, tableau = [], rng }) {
    this.rng = rng || generateur();
    this.joueurs = joueurs.filter(j => j.tapis > 0).map(j => ({
      id: j.id, nom: j.nom, tapis: j.tapis, depart: j.tapis,
      mise: 0, engage: 0, cartes: [], couche: false, aParle: false, peutRelancer: true,
    }));
    if (this.joueurs.length < 2) throw new Error('Il faut au moins deux joueurs avec des jetons.');
    this.petite = petite;
    this.grosse = grosse;
    this.boutonIdx = Math.max(0, this.joueurs.findIndex(j => j.id === bouton));
    this.rue = 0;
    this.tableau = [];
    this.miseMax = 0;
    this.relanceMin = grosse;
    this.dernierAgresseur = null;
    this.tour = null;
    this.finie = false;
    this.journal = [];
    this.resultat = null;

    // Paquet : les cartes imposées sont retirées, le reste est mélangé
    const imposees = [...Object.values(mains).flat(), ...tableau];
    const pris = new Set(imposees.map(cle));
    if (pris.size !== imposees.length) throw new Error('Carte imposée en double.');
    this.reste = this.rng.melanger(nouveauPaquet().filter(c => !pris.has(cle(c))));
    this.mainsImposees = mains;
    this.tableauImpose = tableau.slice();
  }

  // ---------- positions ----------
  get n() { return this.joueurs.length; }
  suivant(i) { return (i + 1) % this.n; }
  get idxPetite() { return this.n === 2 ? this.boutonIdx : this.suivant(this.boutonIdx); }
  get idxGrosse() { return this.suivant(this.idxPetite); }
  joueur(id) { return this.joueurs.find(j => j.id === id); }
  peutAgir(j) { return !j.couche && j.tapis > 0; }
  get enJeu() { return this.joueurs.filter(j => !j.couche); }
  get pot() { return this.joueurs.reduce((t, j) => t + j.engage, 0); }
  /** Ordre des joueurs à partir de la gauche du bouton (utile pour l'abattage et les jetons impairs). */
  ordreDepuisBouton() {
    const o = [];
    for (let k = 1; k <= this.n; k++) o.push(this.joueurs[(this.boutonIdx + k) % this.n]);
    return o;
  }

  noter(evt) { this.journal.push(evt); return evt; }

  // ---------- démarrage ----------
  demarrer() {
    const evts = [];
    const poser = (idx, montant, quoi) => {
      const j = this.joueurs[idx];
      const x = Math.min(montant, j.tapis);
      j.tapis -= x; j.mise += x; j.engage += x;
      evts.push(this.noter({ type: 'blinde', id: j.id, quoi, montant: x, tapis: j.tapis === 0 }));
    };
    poser(this.idxPetite, this.petite, 'petite');
    poser(this.idxGrosse, this.grosse, 'grosse');
    this.miseMax = this.grosse;
    this.relanceMin = this.grosse;

    // Deux cartes chacun, une à la fois, en commençant à gauche du bouton
    const ordre = this.ordreDepuisBouton();
    for (let tourCarte = 0; tourCarte < 2; tourCarte++) {
      for (const j of ordre) {
        const imposee = this.mainsImposees[j.id]?.[tourCarte];
        j.cartes.push(imposee || this.reste.pop());
      }
    }
    evts.push(this.noter({ type: 'distribution', ordre: ordre.map(j => j.id) }));

    // Premier à parler avant le flop : à gauche de la grosse blinde (le bouton à deux)
    this.tour = this.premierActifDepuis(this.suivant(this.idxGrosse));
    this.verifierFinDeTour();
    return evts;
  }

  premierActifDepuis(idx) {
    for (let k = 0; k < this.n; k++) {
      const i = (idx + k) % this.n;
      if (this.peutAgir(this.joueurs[i])) return i;
    }
    return null;
  }

  // ---------- enchères ----------
  /** Joueur qui doit parler, ou null si le tour d'enchères est clos. */
  get joueurActif() { return this.finie ? null : this.tour === null ? null : this.joueurs[this.tour]; }

  options(id) {
    const j = this.joueur(id);
    const aSuivre = Math.max(0, this.miseMax - j.mise);
    const maxA = j.mise + j.tapis;
    const autresQuiPeuventSuivre = this.joueurs.some(o => o !== j && this.peutAgir(o));
    const minA = this.miseMax === 0 ? Math.min(this.grosse, maxA) : Math.min(this.miseMax + this.relanceMin, maxA);
    return {
      aSuivre: Math.min(aSuivre, j.tapis),
      peutParler: aSuivre === 0,
      peutSuivre: aSuivre > 0,
      suivreEstTapis: aSuivre >= j.tapis,
      peutRelancer: j.peutRelancer && maxA > this.miseMax && autresQuiPeuventSuivre,
      relanceMinA: minA,
      relanceMaxA: maxA,
      estMise: this.miseMax === 0,
      pot: this.pot,
      tapis: j.tapis,
    };
  }

  /**
   * @param {string} id
   * @param {{type:'coucher'|'parole'|'suivre'|'relancer'|'tapis', a?:number}} action
   *        a : montant total de la mise après relance (« relancer à »)
   */
  agir(id, action) {
    const j = this.joueurs[this.tour];
    if (!j || j.id !== id) throw new Error(`Ce n’est pas à ${id} de parler.`);
    const o = this.options(id);
    let { type } = action;
    let a = action.a;
    if (type === 'tapis') {
      a = j.mise + j.tapis;
      type = a > this.miseMax && o.peutRelancer ? 'relancer' : 'suivre';
    }
    if (type === 'parole' && !o.peutParler) type = 'suivre';
    if (type === 'suivre' && o.peutParler) type = 'parole';
    if (type === 'relancer' && !o.peutRelancer) type = o.peutParler ? 'parole' : 'suivre';

    const evt = { type: 'action', id, rue: this.rue };
    if (type === 'coucher') {
      j.couche = true;
      Object.assign(evt, { action: 'coucher' });
    } else if (type === 'parole') {
      Object.assign(evt, { action: 'parole' });
    } else if (type === 'suivre') {
      const x = Math.min(this.miseMax - j.mise, j.tapis);
      j.tapis -= x; j.mise += x; j.engage += x;
      Object.assign(evt, { action: 'suivre', montant: x, mise: j.mise, tapis: j.tapis === 0 });
    } else if (type === 'relancer') {
      a = Math.round(Math.min(Math.max(a ?? o.relanceMinA, o.relanceMinA), o.relanceMaxA));
      const estMise = this.miseMax === 0;
      const hausse = a - this.miseMax;
      const x = a - j.mise;
      j.tapis -= x; j.mise += x; j.engage += x;
      const pleine = hausse >= this.relanceMin;
      this.miseMax = a;
      this.dernierAgresseur = j.id;
      for (const autre of this.joueurs) {
        if (autre === j || !this.peutAgir(autre)) continue;
        // Relance incomplète (tapis trop court) : ceux qui ont déjà parlé peuvent suivre, pas relancer
        if (!pleine && autre.aParle) autre.peutRelancer = false;
        autre.aParle = false;
      }
      if (pleine) {
        this.relanceMin = hausse;
        for (const autre of this.joueurs) if (autre !== j) autre.peutRelancer = true;
      }
      Object.assign(evt, { action: estMise ? 'miser' : 'relancer', montant: x, mise: j.mise, tapis: j.tapis === 0 });
    }
    j.aParle = true;
    j.peutRelancer = true;
    this.noter(evt);

    // Joueur suivant
    this.tour = this.prochainADevoirParler(this.suivant(this.tour));
    this.verifierFinDeTour();
    return [evt];
  }

  prochainADevoirParler(depuis) {
    if (this.enJeu.length <= 1) return null;
    for (let k = 0; k < this.n; k++) {
      const i = (depuis + k) % this.n;
      const j = this.joueurs[i];
      if (this.peutAgir(j) && (!j.aParle || j.mise < this.miseMax)) return i;
    }
    return null;
  }

  verifierFinDeTour() {
    if (this.tour !== null) {
      const j = this.joueurs[this.tour];
      // Seul joueur capable de parler et rien à suivre : inutile de lui demander
      const capables = this.joueurs.filter(x => this.peutAgir(x));
      if (capables.length === 1 && capables[0] === j && j.mise >= this.miseMax) this.tour = null;
    }
    if (this.enJeu.length <= 1) this.tour = null;
  }

  /** Plus personne ne peut miser : on retourne tout jusqu'à l'abattage. */
  get enchereClose() {
    return this.joueurs.filter(j => this.peutAgir(j)).length <= 1;
  }

  // ---------- rues ----------
  /** À appeler quand joueurActif est null : ramasse les mises, distribue la suite ou conclut. */
  avancer() {
    if (this.finie) return [];
    const evts = [];
    const mises = this.joueurs.filter(j => j.mise > 0).map(j => ({ id: j.id, montant: j.mise }));
    if (mises.length) evts.push(this.noter({ type: 'ramasser', mises }));
    for (const j of this.joueurs) { j.mise = 0; j.aParle = false; j.peutRelancer = true; }
    this.miseMax = 0;
    this.relanceMin = this.grosse;

    if (this.enJeu.length === 1) return evts.concat(this.conclureSansAbattage());

    // Tapis : quand les enchères sont closes, on montre les mains avant de retourner la suite
    if (this.enchereClose && this.rue < 3 && !this.mainsMontrees) {
      this.mainsMontrees = true;
      evts.push(this.noter({ type: 'mainsRetournees', ids: this.enJeu.map(j => j.id) }));
    }

    if (this.rue === 3) return evts.concat(this.abattage());

    this.rue++;
    const nb = this.rue === 1 ? 3 : 1;
    const nouvelles = [];
    for (let k = 0; k < nb; k++) {
      const imposee = this.tableauImpose[this.tableau.length];
      const c = imposee || this.reste.pop();
      this.tableau.push(c);
      nouvelles.push(c);
    }
    evts.push(this.noter({ type: 'rue', rue: this.rue, nom: RUES[this.rue], cartes: nouvelles }));

    // Après le flop, le premier joueur actif à gauche du bouton parle d'abord
    // (à deux, c'est donc la grosse blinde : le bouton parle en dernier).
    this.tour = this.enchereClose ? null : this.premierActifDepuis(this.suivant(this.boutonIdx));
    this.verifierFinDeTour();
    return evts;
  }

  conclureSansAbattage() {
    const gagnant = this.enJeu[0];
    const total = this.pot;
    gagnant.tapis += total;
    for (const j of this.joueurs) j.engage = 0;
    this.finie = true;
    this.resultat = { abattage: false, pots: [{ montant: total, gagnants: [{ id: gagnant.id, montant: total }] }] };
    return [this.noter({ type: 'gain', abattage: false, ...this.resultat })];
  }

  abattage() {
    const evts = [];
    const enJeu = this.enJeu;
    const mains = {};
    for (const j of enJeu) mains[j.id] = meilleure(j.cartes.concat(this.tableau));
    // Ordre de révélation : le dernier agresseur d'abord, puis dans le sens du jeu
    const ordreBase = this.ordreDepuisBouton().filter(j => !j.couche);
    let ordre = ordreBase;
    const agresseur = this.dernierAgresseur && ordreBase.find(j => j.id === this.dernierAgresseur);
    if (agresseur) {
      const k = ordreBase.indexOf(agresseur);
      ordre = ordreBase.slice(k).concat(ordreBase.slice(0, k));
    }
    evts.push(this.noter({ type: 'abattage', ordre: ordre.map(j => j.id), mains }));

    const pots = calculerPots(this.joueurs.map(j => ({ id: j.id, engage: j.engage, couche: j.couche })));
    const ordreJetons = this.ordreDepuisBouton().map(j => j.id);
    const resultats = pots.map(p => {
      const meilleurScore = Math.max(...p.eligibles.map(id => mains[id].sc));
      const gagnants = ordreJetons.filter(id => p.eligibles.includes(id) && mains[id].sc === meilleurScore);
      const parts = partager(p.montant, gagnants);
      for (const g of parts) this.joueur(g.id).tapis += g.montant;
      return { montant: p.montant, eligibles: p.eligibles, gagnants: parts, retour: p.eligibles.length === 1 };
    });
    for (const j of this.joueurs) j.engage = 0;
    this.finie = true;
    this.resultat = { abattage: true, mains, pots: resultats };
    evts.push(this.noter({ type: 'gain', abattage: true, mains, pots: resultats }));
    return evts;
  }

  /** Tapis de chacun après la donne, pour la suivante. */
  tapisFinaux() {
    return Object.fromEntries(this.joueurs.map(j => [j.id, j.tapis]));
  }
}
