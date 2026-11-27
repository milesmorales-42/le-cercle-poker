// Tes actions : trois plaques de casino (se coucher, parler ou suivre, miser ou relancer)
// et un panneau de mise où l'on fait monter une pile de jetons du bout du doigt.

import { gsap } from 'gsap';
import { creer, montant } from './outils.js';
import { dessinerPile } from './jetons.js';
import { sons } from '../audio/sons.js';

export class Plaques {
  constructor(conteneur) {
    this.el = conteneur;
    this.panneau = null;
  }

  cacher() {
    this.el.classList.add('cache');
    gsap.to(this.el, { y: 90, opacity: 0, duration: 0.25, ease: 'power2.in' });
    this.fermerPanneau();
  }

  /**
   * @param {object} o  options du moteur (Donne.options)
   * @param {{conseil?:{type:string, a?:number}, avertirCouche?:()=>void, pas?:number}} aide
   * @returns {Promise<{type:string, a?:number}>}
   */
  demander(o, { conseil, avertirCouche, pas = 5 } = {}) {
    return new Promise(resoudre => {
      const milieu = o.peutParler ? 'Parole' : o.suivreEstTapis ? `Tapis ${montant(o.aSuivre)}` : `Suivre ${montant(o.aSuivre)}`;
      const seulTapis = o.relanceMinA >= o.relanceMaxA;
      const droite = seulTapis ? `Tapis ${montant(o.relanceMaxA)}` : o.estMise ? 'Miser' : 'Relancer';
      this.el.innerHTML = '';
      const pCouche = creer('button', 'plaque p-ivoire', 'Se coucher');
      const pMilieu = creer('button', 'plaque p-jaune', milieu);
      const pDroite = creer('button', 'plaque p-verm', droite);
      pCouche.type = pMilieu.type = pDroite.type = 'button';
      pDroite.hidden = !o.peutRelancer;
      this.el.append(pCouche, pMilieu, pDroite);
      if (!o.peutRelancer) this.el.style.gridTemplateColumns = '1fr 1.2fr';
      else this.el.style.gridTemplateColumns = '';

      if (conseil) {
        const cible = conseil.type === 'coucher' ? pCouche : conseil.type === 'relancer' ? pDroite : pMilieu;
        cible.classList.add('conseil');
      }

      const finir = action => {
        sons.jouer('pose', { volume: 0.35 });
        this.cacher();
        resoudre(action);
      };

      let confirme = false;
      pCouche.onclick = () => {
        if (o.peutParler && avertirCouche && !confirme) {
          confirme = true;
          pCouche.textContent = 'Me coucher quand même';
          pCouche.classList.add('confirmer');
          avertirCouche();
          return;
        }
        finir({ type: 'coucher' });
      };
      pMilieu.onclick = () => finir({ type: o.peutParler ? 'parole' : 'suivre' });
      pDroite.onclick = () => {
        if (seulTapis) return finir({ type: 'tapis' });
        this.ouvrirPanneau(o, conseil?.type === 'relancer' ? conseil.a : null, pas, finir);
      };

      this.el.classList.remove('cache');
      gsap.fromTo(this.el, { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, ease: 'back.out(1.6)' });
      gsap.fromTo([pCouche, pMilieu, pDroite], { y: 14 }, { y: 0, duration: 0.4, stagger: 0.05, ease: 'back.out(2)' });
    });
  }

  ouvrirPanneau(o, suggere, pas, finir) {
    this.fermerPanneau();
    const min = o.relanceMinA, max = o.relanceMaxA;
    const p = creer('div', 'panneau');
    p.innerHTML = `
      <div class="haut"><div><div class="quoi">${o.estMise ? 'Ta mise' : 'Relancer à'}</div><div class="montant"></div></div><div class="apercu mise" style="position:relative;transform:none"></div></div>
      <div class="piste"><div class="rail"><i></i></div><span class="poignee jeton j-vermillon"></span></div>
      <div class="raccourcis"><button type="button" data-v="min">Min</button><button type="button" data-v="demi">½ pot</button><button type="button" data-v="pot">Pot</button><button type="button" data-v="max">Tapis</button></div>
      <div class="bas"><button class="plaque p-ivoire" type="button">Annuler</button><button class="plaque p-verm ok" type="button"></button></div>`;
    this.el.parentElement.appendChild(p);
    this.panneau = p;
    const elMontant = p.querySelector('.montant'), ok = p.querySelector('.ok'), piste = p.querySelector('.piste');
    const poignee = p.querySelector('.poignee'), remplissage = p.querySelector('.rail i'), apercu = p.querySelector('.apercu');
    const arrondi = v => Math.min(max, Math.max(min, Math.round(v / pas) * pas));
    // échelle progressive : précise pour les petites mises, rapide vers le tapis
    const versT = v => Math.pow((v - min) / Math.max(1, max - min), 1 / 1.7);
    const versV = t => (t >= 0.995 ? max : arrondi(min + (max - min) * Math.pow(t, 1.7)));
    let v = arrondi(suggere ?? min), dernierSon = 0;
    const afficher = () => {
      const t = max > min ? versT(v) : 1;
      const largeur = piste.clientWidth || 300;
      gsap.set(poignee, { x: t * largeur });
      remplissage.style.width = t * 100 + '%';
      elMontant.textContent = montant(v);
      const tapis = v >= max;
      ok.textContent = tapis ? `Tapis ${montant(v)}` : `${o.estMise ? 'Miser' : 'Relancer à'} ${montant(v)}`;
      dessinerPile(apercu, v - o.maMise);
    };
    const regler = nv => {
      nv = arrondi(nv);
      if (nv !== v) {
        v = nv;
        const now = performance.now();
        if (now - dernierSon > 70) { sons.jouer('pile', { volume: 0.25, vitesse: 1.1 }); dernierSon = now; }
      }
      afficher();
    };
    const depuisPointeur = e => {
      const r = piste.getBoundingClientRect();
      regler(versV(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))));
    };
    piste.addEventListener('pointerdown', e => { piste.setPointerCapture(e.pointerId); depuisPointeur(e); });
    piste.addEventListener('pointermove', e => { if (piste.hasPointerCapture(e.pointerId)) depuisPointeur(e); });
    // Relancer « au pot » : suivre d'abord, puis ajouter la taille du pot ainsi grossi
    const potApres = o.pot + o.aSuivre;
    const cibles = { min, max, demi: o.miseMax + potApres * 0.5, pot: o.miseMax + potApres };
    p.querySelectorAll('.raccourcis button').forEach(b => {
      b.onclick = () => regler(cibles[b.dataset.v]);
    });
    p.querySelector('.p-ivoire').onclick = () => { this.fermerPanneau(); };
    ok.onclick = () => { this.fermerPanneau(); finir(v >= max ? { type: 'tapis' } : { type: 'relancer', a: v }); };
    gsap.fromTo(p, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' });
    requestAnimationFrame(afficher);
  }

  fermerPanneau() {
    if (!this.panneau) return;
    const p = this.panneau;
    this.panneau = null;
    gsap.to(p, { y: 40, opacity: 0, duration: 0.2, onComplete: () => p.remove() });
  }
}
