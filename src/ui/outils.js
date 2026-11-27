export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function creer(tag, classe, html) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (html != null) e.innerHTML = html;
  return e;
}

export const attendre = ms => new Promise(r => setTimeout(r, ms));
export const mouvementReduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Espace insécable avant la ponctuation haute, comme on l'écrit en français. */
export const fr = t => t.replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ');

/** Montant avec espace fine pour les milliers : 1 240 */
export const montant = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

let scene = null, echelle = 1;
export function definirScene(el, k) { scene = el; echelle = k; }
export const echelleScene = () => echelle;

/** Centre d'un élément, en unités de scène (tient compte de la mise à l'échelle et des rotations). */
export function centre(el) {
  const r = el.getBoundingClientRect();
  const s = scene.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - s.left) / echelle, y: (r.top + r.height / 2 - s.top) / echelle };
}

/** Promesse résolue au prochain toucher sur l'élément (ou n'importe où si absent). */
export function toucher(el = document) {
  return new Promise(res => {
    const f = e => { e.preventDefault?.(); el.removeEventListener('pointerup', f); res(); };
    el.addEventListener('pointerup', f);
  });
}

export const hasard = (a, b) => a + Math.random() * (b - a);
export const choisir = tab => tab[Math.floor(Math.random() * tab.length)];
