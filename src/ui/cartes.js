// Cartes à jouer en DOM : indices A K Q J, figures aux noms traditionnels, dos du Cercle.
// La face et le dos sont deux faces d'un même élément que GSAP retourne en 3D (rotationY).

import { indice, nomCarte, COULEURS } from '../moteur/cartes.js';
import { creer } from './outils.js';

const NOMS = {
  13: ['David', 'Charles', 'César', 'Alexandre'],
  12: ['Pallas', 'Judith', 'Rachel', 'Argine'],
  11: ['Ogier', 'La Hire', 'Hector', 'Lancelot'],
};

const petales = attr => [0, 72, 144, 216, 288].map(a => `<ellipse ${attr} cx="50" cy="20" rx="9" ry="13" transform="rotate(${a} 50 34)"/>`).join('');
const EMBLEMES = {
  13: `<svg class="emb" viewBox="0 0 100 80" aria-hidden="true"><g class="ink"><path fill="var(--jaune)" d="M12 62 16 24l17 18L50 14l17 28 17-18 4 38Z"/><path fill="var(--vermillon)" d="M12 62h76v11H12Z"/></g><path class="k" d="M12 62 16 24l17 18L50 14l17 28 17-18 4 38Z"/><path class="k" d="M12 62h76v11H12Z"/><circle class="k" style="fill:var(--carton)" cx="16" cy="21" r="4"/><circle class="k" style="fill:var(--carton)" cx="50" cy="10" r="4"/><circle class="k" style="fill:var(--carton)" cx="84" cy="21" r="4"/><circle cx="50" cy="67.5" r="3.2" fill="var(--outremer)"/><circle cx="31" cy="67.5" r="2.4" fill="var(--encre)"/><circle cx="69" cy="67.5" r="2.4" fill="var(--encre)"/></svg>`,
  12: `<svg class="emb" viewBox="0 0 100 80" aria-hidden="true"><g class="ink">${petales('fill="var(--vermillon)"')}<path fill="var(--vert)" d="M52 58c8-8 18-8 24-4-6 6-16 8-24 4Z"/></g>${petales('class="k"')}<circle class="k" style="fill:var(--jaune)" cx="50" cy="34" r="7"/><path class="k" d="M50 49c0 10-2 18-6 26M52 58c8-8 18-8 24-4-6 6-16 8-24 4Z"/></svg>`,
  11: `<svg class="emb" viewBox="0 0 100 80" aria-hidden="true"><g class="ink"><path fill="var(--outremer)" d="M22 58c0-18 12-28 28-28s28 10 28 28Z"/><path fill="var(--vermillon)" d="M18 58h64v10H18Z"/><path fill="var(--jaune)" d="M58 32c8-14 22-21 32-18-6 7-14 15-24 22Z"/></g><path class="k" d="M22 58c0-18 12-28 28-28s28 10 28 28Z"/><path class="k" d="M18 58h64v10H18Z"/><path class="k" d="M58 32c8-14 22-21 32-18-6 7-14 15-24 22Z"/><path class="k" style="stroke-width:1.8" d="M64 28c6-6 14-10 22-12"/></svg>`,
};

const couleurSvg = s => `<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#s-${COULEURS[s]}"/></svg>`;

/** Symboles des quatre couleurs, à insérer une fois dans la page. */
export const SYMBOLES_SVG = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="s-pique" viewBox="0 0 100 100"><path d="M50 5C78 29 95 45 95 62c0 13-10 22-22 22-9 0-16-4-20-11 1 10 5 17 12 23H35c7-6 11-13 12-23-4 7-11 11-20 11C15 84 5 75 5 62 5 45 22 29 50 5Z"/></symbol>
<symbol id="s-coeur" viewBox="0 0 100 100"><path d="M50 93C21 70 5 52 5 32 5 17 16 7 29 7c10 0 17 6 21 14 4-8 11-14 21-14 13 0 24 10 24 25 0 20-16 38-45 61Z"/></symbol>
<symbol id="s-carreau" viewBox="0 0 100 100"><path d="M50 3 87 50 50 97 13 50Z"/></symbol>
<symbol id="s-trefle" viewBox="0 0 100 100"><circle cx="50" cy="28" r="20"/><circle cx="27" cy="57" r="20"/><circle cx="73" cy="57" r="20"/><path d="M45 52h10c0 21 4 33 12 44H33c8-11 12-23 12-44Z"/></symbol>
</svg>`;

function faceHTML(c, w) {
  const petite = w < 70;
  const i = indice(c.r);
  const s = couleurSvg(c.s);
  let centre;
  if (NOMS[c.r]) centre = EMBLEMES[c.r] + (petite ? '' : `<span class="nom-fig">${NOMS[c.r][c.s]}</span>`);
  else if (c.r === 14 && c.s === 0) centre = `<svg class="pip as" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3"/><use href="#s-pique" x="20" y="19" width="60" height="60"/></svg>`;
  else centre = `<svg class="pip${c.r === 14 ? ' as' : ''}" viewBox="0 0 100 100" aria-hidden="true"><use href="#s-${COULEURS[c.s]}"/></svg>`;
  return `<span class="idx"><b>${i}</b>${s}</span>${petite ? '' : `<span class="idx bas"><b>${i}</b>${s}</span>`}${centre}`;
}

/**
 * Crée une carte. Sans `c`, seule le dos existe (carte d'un adversaire tant qu'elle est cachée).
 * @param {{r:number, s:number}|null} c
 * @param {number} w  largeur en unités de scène
 */
export function creerCarte(c, w = 58) {
  const el = creer('div', 'carte' + (w < 70 ? ' petite' : ''));
  el.style.setProperty('--w', w + 'px');
  el.innerHTML = `<div class="f"></div><div class="d"></div><div class="voile"></div>`;
  if (c) devoiler(el, c);
  return el;
}

/** Écrit la face d'une carte (au moment où on la retourne). */
export function devoiler(el, c) {
  const w = parseFloat(el.style.getPropertyValue('--w')) || 58;
  el.classList.toggle('rouge', c.s === 1 || c.s === 2);
  el.querySelector('.f').innerHTML = faceHTML(c, w);
  el.dataset.carte = c.r * 4 + c.s;
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', nomCarte(c));
}
