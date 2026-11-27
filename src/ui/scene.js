// Construction de la table : salle, lampe, sièges, tapis, tableau, pot, ta main, Lucien.
// Toutes les positions sont en unités de scène (390 de large, hauteur variable).

import { gsap } from 'gsap';
import { creer, $, definirScene, centre } from './outils.js';
import { SYMBOLES_SVG } from './cartes.js';
import { Compteur } from './jetons.js';
import { Perso, FICHES } from './persos.js';
import { Bulle } from './bulles.js';

const LARGEUR = 390;
const HAUT_MIN = 800;

/** Hauteur du rebord de la table à l'abscisse x (le tapis est une grande ellipse). */
export const rebord = x => 980 - 780 * Math.sqrt(Math.max(0, 1 - ((x - 195) / 360) ** 2));

const DISPOSITIONS = {
  1: [{ x: 195, largeur: 126 }],
  2: [{ x: 98, largeur: 138 }, { x: 292, largeur: 138 }],
  3: [{ x: 64, largeur: 136 }, { x: 195, largeur: 124 }, { x: 326, largeur: 136 }],
};

export class Scene {
  constructor(app) {
    this.app = app;
    this.el = creer('div', 'scene');
    app.appendChild(this.el);
    this.el.insertAdjacentHTML('beforeend', SYMBOLES_SVG);
    this.sonde = creer('div', 'sonde');
    document.body.appendChild(this.sonde);
    this.mesurer();
    addEventListener('resize', () => this.mesurer());
    // la scène ne doit jamais défiler (le tapis déborde largement sous l'écran)
    this.el.addEventListener('scroll', () => { this.el.scrollTop = 0; this.el.scrollLeft = 0; });

    this.el.insertAdjacentHTML('beforeend', `
      <div class="monde">
      <div class="salle"></div>
      <div class="sieges"></div>
      <div class="table"><div class="feutre"><div class="flaque"></div><div class="anneau"></div></div></div>
      <div class="cone"></div>
      <div class="noms"></div>
      <div class="milieu"><div class="tableau">${[0, 1, 2, 3, 4].map(i => `<span class="fente" style="left:${i * 66}px"></span>`).join('')}</div>
        <div class="pot vide"><span class="tas"></span><span class="pot-t"><span>Pot</span><b class="pot-n"></b></span></div></div>
      <div class="mises"></div>
      <div class="ma-main"><p class="etiquette"></p><p class="mon-tapis"><span class="jeton j-jaune" style="--d:14px"></span><span class="mon-tapis-n"></span></p></div>
      <div class="lucien"></div>
      <div class="cartes-table"></div>
      <span class="bouton-d" hidden>D</span>
      <div class="vol"></div>
      </div>
      <div class="bulles"></div>
      <div class="lampe"><span class="cable"></span><span class="abat"></span><span class="rebord"></span></div>
      <div class="hud"><button class="menu" type="button" aria-label="Retour à la carte de membre"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
        <span class="niveau"></span>
        <button class="son" type="button" aria-label="Couper le son"><svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="ondes" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg></button></div>
      <div class="actions cache"></div>`);

    this.monde = $('.monde', this.el);
    this.sieges = $('.sieges', this.el);
    this.noms = $('.noms', this.el);
    this.mises = $('.mises', this.el);
    this.cartesTable = $('.cartes-table', this.el);
    this.vol = $('.vol', this.el);
    this.tableau = $('.tableau', this.el);
    this.potEl = $('.pot', this.el);
    this.compteur = new Compteur($('.pot-n', this.el), 0);
    this.tasPot = $('.pot .tas', this.el);
    this.etiquette = $('.etiquette', this.el);
    this.monTapis = $('.mon-tapis-n', this.el);
    this.boutonD = $('.bouton-d', this.el);
    this.lampe = $('.lampe', this.el);
    this.cone = $('.cone', this.el);
    this.actions = $('.actions', this.el);
    this.niveau = $('.niveau', this.el);
    this.bulles = $('.bulles', this.el);
    this.lucien = new Perso('lucien', $('.lucien', this.el));
    this.bulleLucien = new Bulle(this.bulles, { lucien: true });
    this.joueurs = new Map(); // id → { perso, nom, mise, cartes, bulle, place }
  }

  mesurer() {
    const vw = innerWidth, vh = innerHeight;
    const k = Math.min(vw / LARGEUR, vh / HAUT_MIN);
    const h = Math.max(HAUT_MIN, vh / k);
    const st = getComputedStyle(this.sonde);
    this.k = k; this.h = h;
    this.el.style.setProperty('--k', k);
    this.el.style.setProperty('--h', h + 'px');
    this.el.style.setProperty('--sat', parseFloat(st.paddingTop) / k + 'px');
    this.el.style.setProperty('--sab', parseFloat(st.paddingBottom) / k + 'px');
    this.sab = parseFloat(st.paddingBottom) / k;
    // centre de la lumière : le tableau, au milieu de la bande centrale
    this.centreY = (300 + (h - 348)) / 2;
    this.el.style.setProperty('--centre-y', this.centreY + 'px');
    definirScene(this.el, k);
    this.lumiere?.app?.renderer.resize(LARGEUR, h);
  }

  /** Point d'où partent les cartes : la main de Lucien. */
  get origineDonne() { return { x: 304, y: this.h - 150 - this.sab }; }
  get centrePot() { return centre(this.potEl.querySelector('.tas')); }
  get centreTableau() { return { x: 195, y: this.centreY }; }

  /**
   * Installe les joueurs autour de la table.
   * @param {{id:string, nom:string, tapis:number}[]} joueurs  dans l'ordre des sièges ; 'toi' en premier
   */
  installer(joueurs) {
    for (const j of this.joueurs.values()) { j.perso?.detruire(); j.bulle?.el.remove(); }
    this.joueurs.clear();
    this.sieges.innerHTML = ''; this.noms.innerHTML = ''; this.mises.innerHTML = '';
    const adversaires = joueurs.filter(j => j.id !== 'toi');
    const places = DISPOSITIONS[adversaires.length] || DISPOSITIONS[3];
    adversaires.forEach((j, i) => {
      const p = places[i];
      const h = p.largeur * 1.25;
      const ry = rebord(p.x);
      const siege = creer('div', 'siege');
      Object.assign(siege.style, { left: p.x - p.largeur / 2 + 'px', top: ry - 0.71 * h + 'px', width: p.largeur + 'px' });
      this.sieges.appendChild(siege);
      const perso = new Perso(j.id, siege);
      const nx = Math.min(334, Math.max(56, p.x));
      const ny = ry + 18;
      const nom = creer('div', 'nom', `<b>${FICHES[j.id].nom}</b><span class="tapis-n"></span>`);
      Object.assign(nom.style, { left: nx + 'px', top: ny + 'px' });
      this.noms.appendChild(nom);
      // mise : juste sous le nom, côté centre (au-dessus du tableau)
      const mx = nx + (195 - nx) * (adversaires.length === 3 && p.x === 195 ? 0 : 0.5), my = ny + 54;
      const mise = creer('div', 'mise');
      Object.assign(mise.style, { left: mx + 'px', top: my + 'px' });
      this.mises.appendChild(mise);
      // cartes cachées : à côté du nom, vers le centre
      const cx = nx + (nx < 195 ? 50 : nx > 195 ? -74 : -82), cy = ny + 4;
      const bulle = new Bulle(this.bulles, { encre: FICHES[j.id].encre, queueGauche: p.x >= 195 });
      this.joueurs.set(j.id, { id: j.id, perso, nom, mise, siege, place: p, cartesPos: { x: cx, y: cy }, bulle, cartes: [] });
    });
    // toi
    const mise = creer('div', 'mise');
    Object.assign(mise.style, { left: '104px', top: this.h - 318 + 'px' });
    this.mises.appendChild(mise);
    this.joueurs.set('toi', { id: 'toi', mise, cartes: [], cartesPos: null });
    this.ajusterBulles();
  }

  ajusterBulles() {
    for (const j of this.joueurs.values()) {
      if (!j.bulle) continue;
      const p = j.place;
      const h = p.largeur * 1.25;
      const ry = rebord(p.x);
      const haut = ry - 0.71 * h;
      // la bulle se place au-dessus de l'épaule, côté centre de la table
      if (p.x < 195) j.bulle.placer({ left: Math.max(8, p.x - 10) + 'px', top: Math.max(54, haut + 6) + 'px', transformOrigin: '10% 100%' });
      else if (p.x > 195) j.bulle.placer({ right: Math.max(8, 390 - p.x - 10) + 'px', top: Math.max(54, haut + 6) + 'px', transformOrigin: '90% 100%' });
      else j.bulle.placer({ left: '214px', top: Math.max(54, haut - 6) + 'px', transformOrigin: '10% 100%' });
    }
    this.bulleLucien.placer({ bottom: `calc(${236}px + var(--sab))` });
  }

  /** Place le bouton du donneur devant un joueur. */
  placerBouton(id, anime = true) {
    const j = this.joueurs.get(id);
    const m = j.mise;
    // le bouton se pose devant le joueur, côté extérieur de sa mise
    const n = this.joueurs.get(id).nom;
    const x = id === 'toi' ? 42 : parseFloat(n.style.left) + (parseFloat(n.style.left) < 195 ? -40 : parseFloat(n.style.left) > 195 ? 40 : -64);
    const y = id === 'toi' ? parseFloat(m.style.top) : parseFloat(n.style.top) + 46;
    this.boutonD.hidden = false;
    if (anime && !this.boutonD.dataset.place) gsap.set(this.boutonD, { x, y });
    else if (anime) gsap.to(this.boutonD, { x, y, duration: 0.6, ease: 'power3.inOut' });
    else gsap.set(this.boutonD, { x, y });
    this.boutonD.dataset.place = id;
  }

  /** La lampe et le cône suivent le balancement calculé par la lumière. */
  relierLampe(lumiere) {
    this.lumiere = lumiere;
    lumiere.surBalance = a => {
      this.lampe.style.transform = `rotate(${a}deg)`;
      this.cone.style.transform = `rotate(${a}deg)`;
      const f = this.el.querySelector('.flaque');
      f.style.transform = `translateX(${(-a * 14).toFixed(1)}px)`;
    };
  }
}
