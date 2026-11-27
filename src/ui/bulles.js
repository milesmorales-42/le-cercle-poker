// Bulles de dialogue : le texte s'écrit lettre à lettre (SplitText), avec une pause
// après la ponctuation. Un toucher sur la bulle termine la phrase d'un coup.

import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { creer, fr, mouvementReduit } from './outils.js';

gsap.registerPlugin(SplitText);

const QUEUE_LUCIEN = `<svg class="queue" viewBox="0 0 22 16"><path d="M0 -2.4 14 -2.4 21 15Z" fill="var(--carton)"/><path d="M0 0 21 15 14 0" fill="none" stroke="var(--ink)" stroke-width="2" opacity=".9" transform="translate(3 2.5)"/><path d="M0 0 21 15 14 0" fill="none" stroke="var(--encre)" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const queueAdv = gauche => gauche
  ? `<svg class="queue" viewBox="0 0 28 16" style="left:8px"><path d="M10 -2.4 24 -2.4 2 15Z" fill="var(--carton)"/><path d="M10 0 2 15 24 0" fill="none" stroke="var(--ink)" stroke-width="2" opacity=".9" transform="translate(3 2.5)"/><path d="M10 0 2 15 24 0" fill="none" stroke="var(--encre)" stroke-width="1.6" stroke-linejoin="round"/></svg>`
  : `<svg class="queue" viewBox="0 0 28 16" style="right:8px"><path d="M4 -2.4 18 -2.4 26 15Z" fill="var(--carton)"/><path d="M4 0 26 15 18 0" fill="none" stroke="var(--ink)" stroke-width="2" opacity=".9" transform="translate(3 2.5)"/><path d="M4 0 26 15 18 0" fill="none" stroke="var(--encre)" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

export class Bulle {
  /**
   * @param {HTMLElement} parent
   * @param {{lucien?:boolean, encre?:string, queueGauche?:boolean}} o
   */
  constructor(parent, { lucien = false, encre, queueGauche = true } = {}) {
    this.el = creer('div', 'bulle ' + (lucien ? 'lucien-b' : 'adv'));
    if (encre) this.el.style.setProperty('--ink', encre);
    this.el.innerHTML = `<p></p>${lucien ? QUEUE_LUCIEN : queueAdv(queueGauche)}<span class="suite"></span>`;
    this.p = this.el.querySelector('p');
    parent.appendChild(this.el);
    this.tl = null;
    this.visible = false;
    this.el.addEventListener('pointerup', () => { if (this.tl && this.tl.progress() < 1) this.tl.progress(1); });
  }

  placer(styles) { Object.assign(this.el.style, styles); }

  /**
   * Écrit une phrase. Renvoie une promesse résolue quand elle est entièrement écrite.
   * Le texte peut contenir <b> pour un mot clé.
   */
  dire(html) {
    if (this.tl) this.tl.progress(1).kill();
    if (this.split) { this.split.revert(); this.split = null; }
    this.p.innerHTML = fr(html);
    this.el.classList.remove('attend');
    const apparition = !this.visible;
    this.visible = true;
    gsap.set(this.el, { visibility: 'visible' });
    if (mouvementReduit()) { gsap.set(this.el, { opacity: 1, scale: 1 }); return Promise.resolve(); }
    this.split = new SplitText(this.p, { type: 'words,chars' });
    const tl = gsap.timeline();
    if (apparition) tl.fromTo(this.el, { scale: 0.72, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.34, ease: 'back.out(2.2)' });
    else tl.fromTo(this.el, { scale: 0.97 }, { scale: 1, duration: 0.2, ease: 'power2.out' });
    let t = apparition ? 0.12 : 0.04;
    for (const c of this.split.chars) {
      tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.08 }, t);
      t += /[.,:;!?…]/.test(c.textContent) ? 0.2 : 0.022;
    }
    this.tl = tl;
    return new Promise(res => tl.eventCallback('onComplete', res));
  }

  /** Signale qu'on attend un toucher pour continuer. */
  attendre(oui = true) { this.el.classList.toggle('attend', oui); }

  cacher(immediat = false) {
    if (!this.visible) return;
    this.visible = false;
    this.el.classList.remove('attend');
    if (this.tl) this.tl.progress(1).kill();
    if (immediat || mouvementReduit()) { gsap.set(this.el, { visibility: 'hidden' }); return; }
    gsap.to(this.el, { scale: 0.85, opacity: 0, duration: 0.18, ease: 'power2.in', onComplete: () => gsap.set(this.el, { visibility: 'hidden' }) });
  }
}
