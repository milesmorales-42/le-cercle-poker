// Les personnages vivent : respiration, clignements, regard qui suit le jeu,
// réactions (se pencher, reculer, hausser le sourcil) et tics qui trahissent leur main.

import { gsap } from 'gsap';
import * as portraits from '../persos/portraits.js';
import { mouvementReduit } from './outils.js';

export const FICHES = {
  lucien: { nom: 'Lucien', encre: 'var(--vermillon)' },
  baron: { nom: 'Le Baron', encre: 'var(--outremer)' },
  odette: { nom: 'Odette', encre: 'var(--vert)' },
  kiki: { nom: 'Kiki', encre: 'var(--jaune)' },
  notaire: { nom: 'Le Notaire', encre: '#7C766E' },
};

export class Perso {
  constructor(id, conteneur) {
    this.id = id;
    this.el = conteneur;
    this.el.innerHTML = portraits[id]();
    this.svg = this.el.querySelector('svg');
    this.tete = this.svg.querySelector('[data-part="tete"]');
    this.corps = this.svg.querySelector('[data-part="corps"]');
    this.regards = [...this.svg.querySelectorAll('[data-part="regard"]')];
    this.paupieres = [...this.svg.querySelectorAll('[data-part="paupiere"]')];
    this.sourcils = this.svg.querySelector('[data-part="sourcils"]');
    this.lunettes = this.svg.querySelector('[data-part="lunettes"]');
    this.lueur = this.svg.querySelector('[data-part="lueur"]');
    this.minuteurs = [];
    if (!mouvementReduit()) this.vivre();
  }

  vivre() {
    // Respiration : tout le buste monte à peine. On anime l'image entière (composée par le
    // processeur graphique) plutôt que l'intérieur du SVG, qu'il faudrait redessiner à chaque image.
    this.svg.style.willChange = 'transform';
    this.souffle = gsap.to(this.svg, { y: -1.6, scaleY: 1.006, transformOrigin: '50% 100%', duration: gsap.utils.random(2, 2.6), yoyo: true, repeat: -1, ease: 'sine.inOut' });
    const cligner = () => {
      this.cligner();
      this.minuteurs.push(setTimeout(cligner, gsap.utils.random(2200, 6000)));
    };
    this.minuteurs.push(setTimeout(cligner, gsap.utils.random(600, 3000)));
  }

  cligner() {
    for (const p of this.paupieres) {
      gsap.timeline()
        .to(p, { attr: { height: p.dataset.ferme }, duration: 0.07, ease: 'power1.in' })
        .to(p, { attr: { height: p.dataset.ouvert }, duration: 0.12, ease: 'power1.out' }, '+=0.04');
    }
  }

  /** Oriente le regard (en unités du dessin : quelques pixels suffisent). */
  regarder(dx, dy = 0) {
    gsap.to(this.regards, { x: Math.max(-2.6, Math.min(2.6, dx)), y: Math.max(-1.6, Math.min(1.6, dy)), duration: 0.35, ease: 'power2.out' });
  }

  /** Se penche vers la lumière (réflexion, mise forte). */
  pencher() {
    return gsap.timeline()
      .to(this.el, { y: 4, scale: 1.035, duration: 0.35, ease: 'power2.out', transformOrigin: '50% 100%' })
      .to(this.el, { y: 0, scale: 1, duration: 0.6, ease: 'power2.inOut' }, '+=0.5');
  }

  reculer() {
    return gsap.timeline()
      .to(this.el, { y: -3, scale: 0.975, duration: 0.3, ease: 'power2.out', transformOrigin: '50% 100%' })
      .to(this.el, { y: 0, scale: 1, duration: 0.7, ease: 'power2.inOut' }, '+=0.6');
  }

  hausserSourcil() {
    if (!this.sourcils) return null;
    return gsap.timeline().to(this.sourcils, { y: -2.6, duration: 0.16, ease: 'power2.out' }).to(this.sourcils, { y: 0, duration: 0.4, ease: 'power2.inOut' }, '+=0.6');
  }

  secouerTete() {
    return gsap.timeline().to(this.tete, { rotation: 4, svgOrigin: '120 200', duration: 0.12 }).to(this.tete, { rotation: -4, duration: 0.18 }).to(this.tete, { rotation: 0, duration: 0.2 });
  }

  hocherTete() {
    return gsap.timeline().to(this.tete, { y: '+=3', duration: 0.14, ease: 'power1.out' }).to(this.tete, { y: '-=3', duration: 0.2, ease: 'power1.inOut' });
  }

  /** Odette retire ses lunettes quand sa main est forte. */
  retirerLunettes(oui = true) {
    if (!this.lunettes) return;
    gsap.to(this.lunettes, { y: oui ? -16 : 0, opacity: oui ? 0 : 1, duration: 0.5, ease: 'power2.inOut' });
  }

  /** Kiki range son téléphone (son visage n'est plus éclairé par l'écran). */
  rangerTelephone(oui = true) {
    if (!this.lueur) return;
    gsap.to(this.lueur, { opacity: oui ? 0 : 1, duration: 0.6 });
  }

  eteindre(oui = true) { this.el.classList.toggle('couche', oui); }

  detruire() {
    this.minuteurs.forEach(clearTimeout);
    this.souffle?.kill();
    gsap.killTweensOf([this.el, this.svg, this.tete, this.corps, ...this.regards, ...this.paupieres]);
  }
}
