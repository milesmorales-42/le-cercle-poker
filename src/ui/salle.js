// La carte de membre du Cercle : une partie tamponnée par partie jouée.

import { gsap } from 'gsap';
import { creer } from './outils.js';
import { sons } from '../audio/sons.js';

const STYLE = `
.carte-membre { position: absolute; left: 18px; right: 18px; z-index: 70; padding: 22px 18px 18px; border-radius: 16px; background: var(--carton); color: var(--encre);
  box-shadow: 0 30px 60px -20px rgba(0,0,0,.8); }
.carte-membre::before { content: ""; position: absolute; inset: 7px; border-radius: 11px; border: 1.5px solid var(--vermillon); pointer-events: none; }
.carte-membre h1 { position: relative; margin: 0; font: 400 34px/1 var(--f-titre); }
.carte-membre h1 .ink { position: absolute; left: 0; top: 0; color: var(--vermillon); transform: translate(-2px, 2px); }
.carte-membre h1 .key { position: relative; }
.carte-membre .sous { margin: 6px 0 14px; font: 500 14px/1.3 var(--f-texte); color: #6B5E52; }
.carte-membre ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.carte-membre li button { width: 100%; display: grid; grid-template-columns: 44px minmax(0,1fr); gap: 12px; align-items: center; text-align: left; padding: 8px 6px; border: 0; border-radius: 10px; background: none; color: var(--encre); cursor: pointer; }
.carte-membre li button:not([disabled]):active { background: rgba(28,24,20,.06); }
.carte-membre li button[disabled] { cursor: default; opacity: .45; }
.carte-membre .rond { width: 44px; height: 44px; border-radius: 50%; border: 1.5px dashed rgba(28,24,20,.35); display: grid; place-items: center; font: 400 18px/1 var(--f-titre); color: rgba(28,24,20,.5); }
.carte-membre .rond.tampon-ok { border: 2.5px solid var(--vermillon); color: var(--vermillon); transform: rotate(-12deg); font-size: 11px; letter-spacing: .02em; text-align: center; line-height: 1.05; }
.carte-membre .rond.ouverte { border: 1.5px solid var(--encre); color: var(--encre); }
.carte-membre .t { font: 400 18px/1.15 var(--f-titre); }
.carte-membre .r { font: 500 13.5px/1.3 var(--f-texte); color: #6B5E52; }
.carte-membre .r em { font-style: normal; color: var(--vermillon); }
`;

/** Affiche la carte de membre ; renvoie la partie choisie. */
export function salle(scene, parties, progression) {
  if (!document.getElementById('style-salle')) {
    const s = creer('style'); s.id = 'style-salle'; s.textContent = STYLE; document.head.appendChild(s);
  }
  return new Promise(resoudre => {
    const voile = creer('div');
    Object.assign(voile.style, { position: 'absolute', inset: '0', zIndex: 69, background: 'rgba(8,5,3,.55)' });
    const carte = creer('section', 'carte-membre');
    carte.style.top = `calc(var(--sat) + 56px)`;
    carte.innerHTML = `<h1><span class="ink" aria-hidden="true">Le Cercle</span><span class="key">Le Cercle</span></h1>
      <p class="sous">Carte de membre. Chaque partie jouée y laisse son tampon.</p>
      <ol>${parties.map((p, i) => {
        const fini = progression.terminee(p.id);
        const ouverte = progression.ouverte(parties, i);
        const rond = fini ? `<span class="rond tampon-ok">Joué</span>` : `<span class="rond${ouverte ? ' ouverte' : ''}">${p.numero}</span>`;
        const resume = p.bientot ? `<em>Bientôt.</em> ${p.resume}` : p.resume;
        return `<li><button type="button" data-i="${i}" ${ouverte ? '' : 'disabled'}>${rond}<span><span class="t">${p.titre}</span><br><span class="r">${resume}</span></span></button></li>`;
      }).join('')}</ol>`;
    scene.el.append(voile, carte);
    gsap.fromTo(voile, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo(carte, { y: 60, opacity: 0, rotation: -2 }, { y: 0, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.4)' });
    carte.querySelectorAll('button[data-i]').forEach(b => {
      b.onclick = () => {
        sons.debloquer();
        sons.jouer('pose', { volume: 0.6 });
        const p = parties[Number(b.dataset.i)];
        gsap.to(carte, { y: 40, opacity: 0, duration: 0.35, ease: 'power2.in' });
        gsap.to(voile, { opacity: 0, duration: 0.35, onComplete: () => { voile.remove(); carte.remove(); resoudre(p); } });
      };
    });
  });
}
