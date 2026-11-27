// Sons réels : Kenney Casino Audio, Impact Sounds et Interface Sounds (CC0).
// Web Audio : chaque son est décodé une fois, puis joué avec une légère variation de hauteur
// pour que deux jetons ne sonnent jamais exactement pareil.

const GROUPES = {
  melange: ['card-shuffle'],
  eventail: ['card-fan-1', 'card-fan-2'],
  glisse: ['card-slide-1', 'card-slide-2', 'card-slide-3', 'card-slide-4', 'card-slide-5', 'card-slide-6', 'card-slide-7', 'card-slide-8'],
  pose: ['card-place-1', 'card-place-2', 'card-place-3', 'card-place-4'],
  pousse: ['card-shove-1', 'card-shove-2', 'card-shove-3', 'card-shove-4'],
  paquet: ['cards-pack-take-out-1', 'cards-pack-take-out-2'],
  jeton: ['chip-lay-1', 'chip-lay-2', 'chip-lay-3'],
  choc: ['chips-collide-1', 'chips-collide-2', 'chips-collide-3', 'chips-collide-4'],
  ramasse: ['chips-handle-1', 'chips-handle-2', 'chips-handle-3', 'chips-handle-4', 'chips-handle-5', 'chips-handle-6'],
  pile: ['chips-stack-1', 'chips-stack-2', 'chips-stack-3', 'chips-stack-4', 'chips-stack-5', 'chips-stack-6'],
  toc: ['toc-1', 'toc-2', 'toc-3'],
  impact: ['choc-1', 'choc-2'],
  lampe: ['lampe'],
};

const CLE = 'le-cercle-son';

class Sons {
  constructor() {
    this.ctx = null;
    this.maitre = null;
    this.tampons = {};
    this.charge = null;
    let pref = null;
    try { pref = localStorage.getItem(CLE); } catch { /* stockage indisponible */ }
    this.actif = pref !== 'non';
  }

  contexte() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.maitre = this.ctx.createGain();
      this.maitre.gain.value = 0.9;
      this.maitre.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Télécharge et décode tous les sons (une seule fois). */
  charger(base = import.meta.env.BASE_URL) {
    if (this.charge) return this.charge;
    const ctx = this.contexte();
    if (!ctx) return (this.charge = Promise.resolve());
    const noms = [...new Set(Object.values(GROUPES).flat())];
    this.charge = Promise.all(noms.map(async n => {
      try {
        const r = await fetch(`${base}sons/${n}.mp3`);
        const brut = await r.arrayBuffer();
        this.tampons[n] = await new Promise((ok, ko) => ctx.decodeAudioData(brut, ok, ko));
      } catch { /* un son manquant ne doit jamais bloquer le jeu */ }
    }));
    return this.charge;
  }

  /** À appeler dans un geste de l'utilisateur (iPhone : le son ne démarre qu'ainsi). */
  debloquer() {
    const ctx = this.contexte();
    if (!ctx) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* Safari ancien */ }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    const vide = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = vide; s.connect(ctx.destination); s.start(0);
  }

  basculer() {
    this.actif = !this.actif;
    try { localStorage.setItem(CLE, this.actif ? 'oui' : 'non'); } catch { /* rien */ }
    return this.actif;
  }

  /**
   * @param {keyof GROUPES} groupe
   * @param {{volume?:number, vitesse?:number, delai?:number, varier?:boolean}} o
   */
  jouer(groupe, { volume = 1, vitesse = 1, delai = 0, varier = true } = {}) {
    if (!this.actif || !this.ctx || this.ctx.state !== 'running') return;
    const liste = GROUPES[groupe];
    if (!liste) return;
    const nom = liste[Math.floor(Math.random() * liste.length)];
    const tampon = this.tampons[nom];
    if (!tampon) return;
    const src = this.ctx.createBufferSource();
    src.buffer = tampon;
    src.playbackRate.value = vitesse * (varier ? 0.94 + Math.random() * 0.12 : 1);
    const g = this.ctx.createGain();
    g.gain.value = volume;
    src.connect(g).connect(this.maitre);
    src.start(this.ctx.currentTime + delai);
  }
}

export const sons = new Sons();
