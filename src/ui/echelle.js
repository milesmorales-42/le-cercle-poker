// L'échelle des combinaisons : de la plus forte (en haut) à la plus faible.
// Pendant la leçon, chaque combinaison vue en jeu y reçoit son tampon ;
// en partie, le bouton des cartes l'ouvre comme antisèche.

import { gsap } from 'gsap';
import { creer } from './outils.js';
import { sons } from '../audio/sons.js';

const ECHELLE = [
  [9, 'Quinte flush royale', '10, J, Q, K, A de la même couleur', 'Ah Kh Qh Jh Th'],
  [8, 'Quinte flush', 'Cinq cartes qui se suivent, de la même couleur', '9s 8s 7s 6s 5s'],
  [7, 'Carré', 'Quatre cartes de même valeur', '7c 7d 7h 7s Kd'],
  [6, 'Full', 'Un brelan et une paire', 'Qs Qh Qd 5c 5s'],
  [5, 'Couleur', 'Cinq cartes de la même couleur', 'Ad Jd 8d 6d 3d'],
  [4, 'Quinte', 'Cinq cartes qui se suivent', '8c 7d 6s 5h 4c'],
  [3, 'Brelan', 'Trois cartes de même valeur', '7s 7h 7d Kc 2s'],
  [2, 'Double paire', 'Deux paires', 'Jc Jd 4h 4s Ac'],
  [1, 'Paire', 'Deux cartes de même valeur', 'Th Ts Kd 6c 3h'],
  [0, 'Carte haute', 'Rien : ta plus haute carte compte', 'Ac Qd 9s 6h 2c'],
];

const SYMB = { s: 'pique', h: 'coeur', d: 'carreau', c: 'trefle' };
const mini = t => t.split(' ').map(c => {
  const r = c[0] === 'T' ? '10' : c[0];
  const rouge = c[1] === 'h' || c[1] === 'd';
  return `<span class="mc${rouge ? ' r' : ''}">${r}<svg viewBox="0 0 100 100"><use href="#s-${SYMB[c[1]]}"/></svg></span>`;
}).join('');

const STYLE = `
.echelle { position: absolute; left: 14px; right: 14px; z-index: 75; padding: 16px 14px 14px; border-radius: 16px; background: var(--carton); color: var(--encre); box-shadow: 0 30px 60px -20px rgba(0,0,0,.8);
  display: flex; flex-direction: column; max-height: calc(var(--h) - var(--sat) - var(--sab) - 66px); }
.echelle::before { content: ""; position: absolute; inset: 6px; border-radius: 11px; border: 1.5px solid var(--vermillon); pointer-events: none; }
.echelle h2 { margin: 2px 4px 2px; font: 400 24px/1.1 var(--f-titre); }
.echelle .sous { margin: 0 4px 10px; font: 500 13px/1.3 var(--f-texte); color: #6B5E52; }
.echelle ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 1px; overflow-y: auto; min-height: 0; flex: 1; }
.echelle li { display: grid; grid-template-columns: 30px minmax(0,1fr); column-gap: 10px; align-items: center; padding: 4px; border-radius: 8px; transition: opacity .3s; }
.echelle .ligne1 { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.echelle li.cachee { opacity: .32; }
.echelle .rang { width: 28px; height: 28px; border-radius: 50%; border: 1.5px dashed rgba(28,24,20,.35); display: grid; place-items: center; font: 400 13px/1 var(--f-titre); color: rgba(28,24,20,.6); }
.echelle li.vue .rang { border: 2.5px solid var(--vermillon); color: var(--vermillon); }
.echelle .nomc { font: 400 15px/1.15 var(--f-titre); }
.echelle .desc { display: block; font: 500 12px/1.3 var(--f-texte); color: #6B5E52; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.echelle .cartes { display: flex; gap: 2px; }
.echelle .mc { display: inline-flex; align-items: center; gap: 1px; padding: 2px 3px; border-radius: 3px; background: #fff8ec; box-shadow: inset 0 0 0 1px rgba(28,24,20,.18); font: 400 11px/1 var(--f-titre); font-variant-numeric: lining-nums; color: var(--encre); }
.echelle .mc.r { color: var(--vermillon); }
.echelle .mc svg { width: 8px; height: 8px; fill: currentColor; }
.echelle .fermer { margin-top: 10px; width: 100%; flex: none; }
`;

/**
 * @param {object} scene
 * @param {{vues?:Set<number>, nouvelles?:number[], lecon?:boolean}} o
 * @returns {Promise<void>} résolue quand on referme l'échelle
 */
export function montrerEchelle(scene, { vues = new Set(), nouvelles = [], lecon = false } = {}) {
  if (!document.getElementById('style-echelle')) {
    const s = creer('style'); s.id = 'style-echelle'; s.textContent = STYLE; document.head.appendChild(s);
  }
  return new Promise(resoudre => {
    const voile = creer('div');
    Object.assign(voile.style, { position: 'absolute', inset: '0', zIndex: 74, background: 'rgba(8,5,3,.6)' });
    const p = creer('section', 'echelle');
    p.style.top = 'calc(var(--sat) + 50px)';
    p.innerHTML = `<h2>Les combinaisons</h2><p class="sous">De la plus forte à la plus faible. Ta main, ce sont tes cinq meilleures cartes parmi les sept.</p>
      <ol>${ECHELLE.map(([cat, nom, desc, ex], i) => {
        const vue = vues.has(cat) || nouvelles.includes(cat);
        const classe = lecon ? (vue ? 'vue' : 'cachee') : '';
        return `<li class="${classe}" data-cat="${cat}"><span class="rang">${i + 1}</span><span><span class="ligne1"><span class="nomc">${nom}</span><span class="cartes">${mini(ex)}</span></span><span class="desc">${desc}</span></span></li>`;
      }).join('')}</ol>
      <button class="plaque p-jaune fermer" type="button">${lecon ? 'Continuer' : 'Fermer'}</button>`;
    scene.el.append(voile, p);
    gsap.fromTo(voile, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(p, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' });
    // les nouvelles combinaisons reçoivent leur tampon, de la plus faible à la plus forte
    const ordre = [...nouvelles].sort((a, b) => a - b);
    ordre.forEach((cat, k) => {
      const li = p.querySelector(`li[data-cat="${cat}"]`);
      const rond = li.querySelector('.rang');
      gsap.fromTo(rond, { scale: 2.2, rotation: -25, opacity: 0 }, {
        scale: 1, rotation: -8, opacity: 1, duration: 0.34, ease: 'power4.in', delay: 0.55 + k * 0.42,
        onStart: () => sons.jouer('impact', { volume: 0.35, vitesse: 1.4 }),
      });
      gsap.fromTo(li, { backgroundColor: 'rgba(232,174,60,0)' }, { backgroundColor: 'rgba(232,174,60,.28)', duration: 0.25, yoyo: true, repeat: 1, delay: 0.75 + k * 0.42 });
    });
    p.querySelector('.fermer').onclick = () => {
      sons.jouer('pose', { volume: 0.5 });
      gsap.to(p, { y: 40, opacity: 0, duration: 0.3, ease: 'power2.in' });
      gsap.to(voile, { opacity: 0, duration: 0.3, onComplete: () => { voile.remove(); p.remove(); resoudre(); } });
    };
  });
}
