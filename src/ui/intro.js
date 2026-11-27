// L'ouverture : la salle est noire, on allume la lampe (ce toucher débloque aussi le son
// sur iPhone), Lucien étale le paquet en arc et le retourne d'un geste, le titre s'imprime.

import { gsap } from 'gsap';
import { creer, attendre, toucher, mouvementReduit } from './outils.js';
import { creerCarte } from './cartes.js';
import { nouveauPaquet } from '../moteur/cartes.js';
import { sons } from '../audio/sons.js';

export async function intro(scene, lumiere, { courte = false } = {}) {
  const noir = creer('div', 'noir');
  Object.assign(noir.style, { position: 'absolute', inset: '0', background: '#060403', zIndex: 60, opacity: 0.97 });
  scene.el.appendChild(noir);
  scene.lampe.classList.add('eteinte');
  gsap.set(scene.cone, { opacity: 0 });
  const invite = creer('button', 'invite', 'Touche pour allumer la lampe');
  Object.assign(invite.style, {
    position: 'absolute', left: '50%', top: '46%', transform: 'translateX(-50%)', zIndex: 61, border: '0', background: 'none',
    font: '500 15px/1.3 var(--f-texte)', color: 'var(--carton-doux)', padding: '16px 24px', cursor: 'pointer',
  });
  invite.type = 'button';
  scene.el.appendChild(invite);
  gsap.fromTo(invite, { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 0.4 });
  gsap.to(invite, { opacity: 0.45, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.6 });

  await toucher(scene.el);
  sons.debloquer();
  gsap.killTweensOf(invite);
  invite.remove();
  sons.jouer('lampe', { volume: 0.9, varier: false });

  // la lampe grésille puis s'allume
  scene.lampe.classList.remove('eteinte');
  const flicker = gsap.timeline();
  if (!mouvementReduit()) {
    flicker.to(noir, { opacity: 0.35, duration: 0.05 })
      .to(noir, { opacity: 0.85, duration: 0.06 })
      .to(noir, { opacity: 0.2, duration: 0.05 }, '+=0.08')
      .to(noir, { opacity: 0.6, duration: 0.05 })
      .to(noir, { opacity: 0, duration: 0.5, ease: 'power2.out' }, '+=0.06');
  } else flicker.to(noir, { opacity: 0, duration: 0.4 });
  gsap.to(scene.cone, { opacity: 1, duration: 0.8, delay: 0.2 });
  lumiere.agiter(0.6);
  await flicker;
  noir.remove();

  if (courte) { await attendre(300); return; }

  // l'étalé en arc, puis le retournement en vague
  const paquet = nouveauPaquet().sort((a, b) => a.s - b.s || b.r - a.r);
  const w = 30;
  const cy = scene.centreY - 10;
  const o = scene.origineDonne;
  const cartes = paquet.map(c => {
    const el = creerCarte(c, w);
    scene.cartesTable.appendChild(el);
    gsap.set(el, { x: o.x - w / 2, y: o.y - w * 0.71, rotationY: 180, rotation: -20, scale: 0.8, transformPerspective: 600 });
    return el;
  });
  sons.jouer('paquet', { volume: 0.6 });
  await attendre(250);
  sons.jouer('eventail', { volume: 0.7 });
  const n = cartes.length;
  await gsap.to(cartes, {
    duration: 0.9, ease: 'power3.out', stagger: 0.012, scale: 1,
    x: i => { const a = -0.95 + (1.9 * i) / (n - 1); return 195 + Math.sin(a) * 160 - w / 2; },
    y: i => { const a = -0.95 + (1.9 * i) / (n - 1); return cy + (1 - Math.cos(a)) * 120 - 40 - w * 0.71; },
    rotation: i => (-0.95 + (1.9 * i) / (n - 1)) * 57.3 * 0.9,
  });
  await attendre(200);
  sons.jouer('eventail', { volume: 0.55, vitesse: 1.15 });
  await gsap.to(cartes, { rotationY: 0, duration: 0.42, ease: 'power2.inOut', stagger: 0.014 });

  // le titre s'imprime au-dessus de l'éventail
  const titre = creer('div', 'tampon', '<span class="t-ink">Le Cercle</span><span class="t-key">Le Cercle</span>');
  titre.style.setProperty('--taille', '74px');
  titre.style.top = cy - 150 + 'px';
  scene.el.appendChild(titre);
  sons.jouer('impact', { volume: 0.5 });
  await gsap.timeline()
    .fromTo(titre, { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power4.in' })
    .fromTo(titre.querySelector('.t-ink'), { x: 16, y: -12 }, { x: 4, y: 3, duration: 0.6, ease: 'back.out(3)' });
  lumiere.eclat(195, cy - 110, 2.2, 1.2);
  await attendre(900);

  // on ramasse l'éventail
  sons.jouer('glisse', { volume: 0.5 });
  gsap.to(titre, { opacity: 0, y: -20, duration: 0.6, delay: 0.3, onComplete: () => titre.remove() });
  await gsap.to(cartes, { x: o.x - w / 2, y: o.y - w * 0.71, rotation: 0, rotationY: 180, scale: 0.6, opacity: 0, duration: 0.5, ease: 'power2.in', stagger: { each: 0.008, from: 'end' } });
  cartes.forEach(c => c.remove());
}
