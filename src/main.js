import '@fontsource/young-serif';
import '@fontsource-variable/bricolage-grotesque';
import './styles/jeu.css';
import { gsap } from 'gsap';
import { Scene } from './ui/scene.js';
import { Lumiere } from './fx/lumiere.js';
import { Plaques } from './ui/plaques.js';
import { intro } from './ui/intro.js';
import { salle } from './ui/salle.js';
import { Partie } from './partie/jeu.js';
import { PARTIES } from './partie/scenarios.js';
import { progression } from './partie/progression.js';
import { sons } from './audio/sons.js';
import { creer } from './ui/outils.js';

async function demarrer() {
  progression.charger();
  const scene = new Scene(document.getElementById('app'));
  await document.fonts?.ready;
  const lumiere = await new Lumiere().init(scene.el, { largeur: 390, hauteur: scene.h, centre: scene.centreTableau, echelle: scene.k });
  scene.relierLampe(lumiere);
  const plaques = new Plaques(scene.actions);
  sons.charger();

  // son et menu
  const boutonSon = scene.el.querySelector('.hud .son');
  const majSon = () => {
    boutonSon.querySelector('.ondes').style.display = sons.actif ? '' : 'none';
    boutonSon.setAttribute('aria-label', sons.actif ? 'Couper le son' : 'Remettre le son');
  };
  majSon();
  boutonSon.onclick = () => { sons.debloquer(); sons.basculer(); majSon(); };
  scene.el.querySelector('.hud .menu').onclick = () => quitter(scene);

  await intro(scene, lumiere, { courte: progression.donnees.introVue });
  progression.marquerIntro();

  // Première visite : on s'assoit directement à la première partie
  let premiere = !progression.terminee('p1');
  for (;;) {
    const choix = premiere ? PARTIES[0] : await salle(scene, PARTIES, progression);
    premiere = false;
    const partie = new Partie({ scene, lumiere, plaques });
    const res = await partie.jouer(choix);
    progression.terminer(choix.id, res.jetons);
    await finDePartie(scene, lumiere, choix);
  }
}

async function finDePartie(scene, lumiere, partie) {
  sons.jouer('impact', { volume: 0.6 });
  const t = creer('div', 'tampon', `<span class="t-ink">Partie ${partie.numero} jouée</span><span class="t-key">Partie ${partie.numero} jouée</span>`);
  t.style.setProperty('--taille', '40px');
  t.style.top = scene.centreY - 30 + 'px';
  scene.el.appendChild(t);
  lumiere.pluieDeJetons(80, scene.h - 300);
  await gsap.timeline()
    .fromTo(t, { opacity: 0, scale: 2 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power4.in' })
    .fromTo(t.querySelector('.t-ink'), { x: 14, y: -10 }, { x: 3, y: 2, duration: 0.6, ease: 'back.out(3)' })
    .to(t, { opacity: 0, duration: 0.5 }, '+=1.6');
  t.remove();
}

function quitter(scene) {
  if (scene.el.querySelector('.confirmer-quitter')) return;
  const boite = creer('div', 'confirmer-quitter');
  Object.assign(boite.style, {
    position: 'absolute', left: '24px', right: '24px', top: 'calc(var(--sat) + 60px)', zIndex: 80, padding: '18px', borderRadius: '14px',
    background: 'var(--carton)', color: 'var(--encre)', boxShadow: '0 30px 60px -20px rgba(0,0,0,.8)', display: 'grid', gap: '14px',
  });
  boite.innerHTML = `<p style="margin:0;font:400 20px/1.2 var(--f-titre)">Quitter la partie ?</p>
    <p style="margin:0;font:450 15px/1.4 var(--f-texte)">La donne en cours est perdue. Les parties déjà terminées restent tamponnées sur ta carte de membre.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="plaque p-ivoire" type="button">Rester</button><button class="plaque p-verm" type="button">Quitter</button></div>`;
  scene.el.appendChild(boite);
  const [rester, partir] = boite.querySelectorAll('button');
  rester.onclick = () => boite.remove();
  partir.onclick = () => location.reload();
}

demarrer();
