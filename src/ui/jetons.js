// Jetons : piles de mise, jetons qui volent en arc, compteur à rouleaux.

import { gsap } from 'gsap';
import { creer, centre, montant } from './outils.js';
import { sons } from '../audio/sons.js';

const VALEURS = [[500, 'j-jaune'], [100, 'j-noir'], [25, 'j-vermillon'], [5, 'j-blanc']];

/** Décompose un montant en jetons visibles (au plus `max`). */
export function decomposer(m, max = 8) {
  const out = [];
  let reste = m;
  for (const [v, cls] of VALEURS) {
    while (reste >= v && out.length < max) { out.push(cls); reste -= v; }
  }
  if (!out.length && m > 0) out.push('j-blanc');
  return out;
}

/** Affiche une pile de mise : jetons empilés et montant. */
export function dessinerPile(el, m) {
  if (!m) { el.innerHTML = ''; return; }
  const jetons = decomposer(m, 7).reverse();
  el.innerHTML = `<span class="pile">${jetons.map((cls, i) => `<span class="jeton ${cls}" style="top:${8 - i * 3}px"></span>`).join('')}</span><span>${montant(m)}</span>`;
}

/**
 * Fait voler des jetons d'un point à un autre, en arc, avec un son par jeton.
 * @returns {gsap.core.Timeline}
 */
export function volerJetons(couche, de, vers, m, { max = 6, hauteur = 46, son = true } = {}) {
  const tl = gsap.timeline();
  const jetons = decomposer(m, max);
  jetons.forEach((cls, i) => {
    const j = creer('span', 'jeton ' + cls);
    j.style.setProperty('--d', '22px');
    couche.appendChild(j);
    const dx = (Math.random() - 0.5) * 8, dy = (Math.random() - 0.5) * 6;
    const x0 = de.x - 11 + dx, y0 = de.y - 11 + dy, x1 = vers.x - 11 + dx * 0.4, y1 = vers.y - 11 - i * 2;
    gsap.set(j, { x: x0, y: y0, scale: 0.9, opacity: 0 });
    const t = i * 0.055;
    tl.to(j, { opacity: 1, duration: 0.05 }, t);
    tl.to(j, {
      duration: 0.42, ease: 'power2.inOut',
      motionPath: { path: [{ x: x0, y: y0 }, { x: (x0 + x1) / 2, y: Math.min(y0, y1) - hauteur }, { x: x1, y: y1 }], curviness: 1.2 },
      scale: 1, rotation: (Math.random() - 0.5) * 50,
    }, t);
    if (son) tl.call(() => sons.jouer(i === 0 ? 'jeton' : 'choc', { volume: 0.55 }), null, t + 0.38);
    tl.to(j, { opacity: 0, duration: 0.12 }, t + 0.44);
    tl.call(() => j.remove(), null, t + 0.6);
  });
  return tl;
}

/** Compteur à rouleaux : chaque chiffre défile jusqu'à sa nouvelle valeur. */
export class Compteur {
  constructor(el, valeur = 0) {
    this.el = el;
    this.el.classList.add('compteur');
    this.valeur = -1;
    this.regler(valeur, false);
  }

  regler(v, anime = true) {
    v = Math.max(0, Math.round(v));
    const txt = montant(v);
    const ancien = this.el.dataset.txt || '';
    if (txt.length !== ancien.length) {
      this.el.innerHTML = [...txt].map(ch => /\d/.test(ch)
        ? `<span class="col">${'0123456789'.split('').map(d => `<span>${d}</span>`).join('')}</span>`
        : '<span class="sep"></span>').join('');
      anime = anime && ancien.length > 0;
    }
    const cols = [...this.el.querySelectorAll('.col')];
    const chiffres = [...txt].filter(ch => /\d/.test(ch));
    // chaque colonne fait dix chiffres de haut : un chiffre = 10 % de sa hauteur
    cols.forEach((col, i) => {
      const yPercent = -10 * Number(chiffres[i]);
      if (anime) gsap.to(col, { yPercent, duration: 0.5 + i * 0.08, ease: 'power3.out' });
      else gsap.set(col, { yPercent });
    });
    this.el.dataset.txt = txt;
    this.el.setAttribute('aria-label', String(v));
    this.valeur = v;
  }
}

export { centre };
