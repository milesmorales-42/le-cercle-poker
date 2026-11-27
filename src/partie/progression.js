// Ta progression, gardée sur l'appareil : parties terminées et jetons gagnés.

const CLE = 'le-cercle-v2';

export const progression = {
  donnees: { parties: {}, introVue: false },

  charger() {
    try {
      const brut = localStorage.getItem(CLE);
      if (brut) this.donnees = { ...this.donnees, ...JSON.parse(brut) };
    } catch { /* stockage indisponible : on joue sans mémoire */ }
    return this;
  },

  sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(this.donnees)); } catch { /* rien */ }
  },

  terminee(id) { return !!this.donnees.parties[id]?.fini; },

  terminer(id, jetons) {
    const avant = this.donnees.parties[id];
    this.donnees.parties[id] = { fini: true, jetons: Math.max(jetons, avant?.jetons || 0) };
    this.sauver();
  },

  ouverte(parties, index) {
    const p = parties[index];
    if (p.bientot) return false;
    return index === 0 || this.terminee(parties[index - 1].id);
  },

  marquerIntro() { this.donnees.introVue = true; this.sauver(); },
};
