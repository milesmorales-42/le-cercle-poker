// Le metteur en scène : il fait jouer les donnes au moteur, anime chaque étape,
// fait parler Lucien et les adversaires, et attend tes décisions.

import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Donne } from '../moteur/donne.js';
import { lire, nomRang } from '../moteur/cartes.js';
import { meilleure, nommer, titre, departage } from '../moteur/evaluation.js';
import { decider, profilAuNiveau } from '../moteur/ia.js';
import { chen, equite } from '../moteur/force.js';
import { generateur } from '../moteur/hasard.js';
import { creerCarte, devoiler } from '../ui/cartes.js';
import { volerJetons, dessinerPile, decomposer } from '../ui/jetons.js';
import { sons } from '../audio/sons.js';
import { attendre, centre, toucher, montant, creer, hasard, mouvementReduit } from '../ui/outils.js';
import { FICHES } from '../ui/persos.js';
import { replique } from './repliques.js';

gsap.registerPlugin(MotionPathPlugin);

const minuscule = t => t.charAt(0).toLowerCase() + t.slice(1);
const majuscule = t => t.charAt(0).toUpperCase() + t.slice(1);
const DU = { baron: 'du Baron', odette: 'd’Odette', kiki: 'de Kiki', notaire: 'du Notaire' };
// Brelan, full et carré sont masculins ; les autres combinaisons sont féminines
const masculin = e => e.cat === 3 || e.cat === 6 || e.cat === 7;
/** « ta paire de Rois », « ton brelan de Dames », « la paire de 7 du Baron », « le full d'Odette » */
const mainDe = (id, e) => id === 'toi'
  ? (masculin(e) ? 'ton ' : 'ta ') + minuscule(nommer(e))
  : (masculin(e) ? 'le ' : 'la ') + minuscule(nommer(e)) + ' ' + DU[id];
const unUne = e => (masculin(e) ? 'un ' : 'une ');
/** « ton Roi », « sa Dame » */
const possessif = (id, r) => (id === 'toi' ? (r === 12 ? 'ta ' : 'ton ') : r === 12 ? 'sa ' : 'son ') + nomRang(r);
const nomDe = id => (id === 'toi' ? 'toi' : FICHES[id].nom);

export class Partie {
  constructor({ scene, lumiere, plaques }) {
    this.scene = scene;
    this.lumiere = lumiere;
    this.plaques = plaques;
    this.rng = generateur();
    this.vitesse = mouvementReduit() ? 0.5 : 1;
  }

  // ---------- Lucien ----------
  async dire(html, attendreToucher = false) {
    const b = this.scene.bulleLucien;
    gsap.to(this.scene.lucien.tete, { y: 1.6, duration: 0.18, yoyo: true, repeat: 1 });
    await b.dire(html);
    if (attendreToucher) {
      b.attendre(true);
      await toucher(this.scene.el);
      b.attendre(false);
    } else {
      await attendre(Math.min(1300, 280 + html.length * 7));
    }
  }

  get L() { return { dire: (t, a) => this.dire(t, a) }; }

  async recit(moment, ctx = {}) {
    const f = this.dd?.recit?.[moment];
    if (!f) return false;
    const r = f(this.L, { d: this.d, rue: this.d?.rue, toiEnJeu: this.toiEnJeu, ...ctx });
    if (r && r.then) await r;
    return !!r;
  }

  get toiEnJeu() { const j = this.d?.joueur('toi'); return !!j && !j.couche; }

  // ---------- partie ----------
  async jouer(def) {
    this.def = def;
    this.tapis = Object.fromEntries(def.joueurs.map(id => [id, def.tapis]));
    this.scene.installer(def.joueurs.map(id => ({ id })));
    this.scene.el.classList.add('en-partie');
    this.scene.niveau.textContent = `Partie ${def.numero}, blindes ${def.blindes[0]}/${def.blindes[1]}`;
    this.majTapis();
    for (const ligne of def.ouverture || []) await this.dire(ligne, true);
    for (let i = 0; i < def.donnes.length; i++) {
      if (this.tapis.toi <= 0) break;
      await this.jouerDonne(def.donnes[i], i);
    }
    for (const ligne of def.cloture || []) await this.dire(ligne, true);
    this.scene.bulleLucien.cacher();
    this.scene.el.classList.remove('en-partie');
    return { jetons: this.tapis.toi };
  }

  majTapis(id) {
    for (const [jid, j] of this.scene.joueurs) {
      if (id && id !== jid) continue;
      const t = this.d?.joueur(jid)?.tapis ?? this.tapis[jid];
      if (jid === 'toi') this.scene.monTapis.textContent = montant(t);
      else j.nom.querySelector('.tapis-n').textContent = montant(t);
    }
  }

  // ---------- une donne ----------
  async jouerDonne(dd, index) {
    this.dd = dd;
    const [petite, grosse] = this.def.blindes;
    const mains = Object.fromEntries(Object.entries(dd.mains || {}).map(([id, t]) => [id, lire(t)]));
    this.d = new Donne({
      joueurs: this.def.joueurs.map(id => ({ id, nom: FICHES[id]?.nom || 'Toi', tapis: this.tapis[id] })),
      bouton: dd.bouton, petite, grosse, mains, tableau: lire(dd.tableau), rng: this.rng,
    });
    this.cartes = Object.fromEntries(this.def.joueurs.map(id => [id, []]));
    this.cartesTableau = [];
    this.toiAPaye = false;
    this.scene.placerBouton(dd.bouton, index > 0);
    sons.jouer('melange', { volume: 0.5 });
    await this.recit('avant');

    let evts = this.d.demarrer();
    await this.animer(evts);
    while (!this.d.finie) {
      const j = this.d.joueurActif;
      if (j) {
        const avant = j.id === 'toi' ? this.photoToi() : null;
        const action = j.id === 'toi' ? await this.tourToi() : await this.tourAdversaire(j);
        evts = this.d.agir(j.id, action);
        await this.animer(evts);
        if (j.id === 'toi' && evts[0].montant > 0) this.toiAPaye = true;
        const dit = await this.recit('apresAction', { evt: evts[0], rue: evts[0].rue });
        if (!dit && j.id === 'toi' && this.def.coach <= 2) await this.commenterChoix(evts[0], avant);
      } else {
        evts = this.d.avancer();
        await this.animer(evts);
      }
    }
    await this.recit('fin', { resultat: this.d.resultat, toiAPaye: this.toiAPaye });
    for (const [id, t] of Object.entries(this.d.tapisFinaux())) this.tapis[id] = t;
    await this.toucherPourContinuer();
    await this.ranger();
  }

  async toucherPourContinuer() {
    await attendre(500);
  }

  // ---------- les tours de parole ----------
  async tourToi() {
    const o = this.d.options('toi');
    const ctx = { o, rue: this.d.rue, d: this.d };
    const conseil = this.def.coach <= 2 ? this.dd.recit?.conseil?.(ctx) : null;
    this.scene.joueurs.forEach(j => j.perso?.regarder(0, 1.2));
    if (conseil?.texte) await this.dire(conseil.texte);
    else if (this.def.coach <= 1) await this.dire(this.explicationTour(o));
    const action = await this.plaques.demander(o, {
      conseil: this.def.coach <= 2 ? conseil : null,
      pas: this.def.blindes[0] >= 5 ? 5 : 1,
      avertirCouche: () => this.dire('Attention : personne n’a misé, tu peux dire <b>parole</b> sans rien payer. Te coucher maintenant, c’est abandonner une main gratuite.'),
    });
    return action;
  }

  /** Ta situation juste avant de jouer : force de ta main et ce qu'il fallait payer. */
  photoToi() {
    const toi = this.d.joueur('toi');
    const o = this.d.options('toi');
    const adversaires = Math.max(1, this.d.enJeu.length - 1);
    const force = this.d.rue === 0 ? null : equite(toi.cartes, this.d.tableau, adversaires, 300, this.rng);
    return { o, note: chen(toi.cartes), force, rue: this.d.rue, main: this.scene.etiquette.textContent };
  }

  /** Lucien réagit à tes choix : il relève les vraies erreurs, et salue parfois un bon coup. */
  async commenterChoix(evt, avant) {
    if (!avant) return;
    const { o, note, force, rue, main } = avant;
    if (evt.action === 'coucher') {
      if (rue === 0 && note >= 12) {
        const nom = main.startsWith('Paire') ? 'une ' + minuscule(main) : main.replace(', assorties', '');
        await this.dire(`Jeter ${nom} ? C’est une des meilleures mains de départ. Face à une petite mise, on la joue.`);
      } else if (rue > 0 && force >= 0.65 && o.aSuivre <= o.pot * 0.75) {
        await this.dire(`Dommage : avec ${minuscule(main)}, tu étais sûrement devant. Pour une mise de cette taille, on suit.`);
      }
      return;
    }
    if (evt.action === 'suivre' && evt.tapis && force !== null && force < 0.3) {
      await this.dire('Suivre à tapis avec une main aussi faible, c’est risquer toute la partie sur un coup de chance. Croisons les doigts.');
      return;
    }
    if ((evt.action === 'miser' || evt.action === 'relancer') && force !== null && force >= 0.75 && Math.random() < 0.5) {
      await this.dire(hasard(0, 1) < 0.5 ? 'Joli. Avec une main pareille, il faut faire payer.' : 'Bien. Tu mises quand tu es devant : c’est tout le jeu.');
    }
  }

  explicationTour(o) {
    if (o.peutParler) return this.d.rue === 0
      ? 'Personne n’a relancé : tu peux dire <b>parole</b> et voir le flop gratuitement, ou relancer.'
      : 'Personne n’a misé : <b>parler</b> ne coûte rien. Tu peux aussi miser.';
    if (o.suivreEstTapis) return `Pour suivre, il faut mettre tous tes jetons : ${montant(o.aSuivre)}. Sinon, couche-toi.`;
    return `Pour rester, il faut <b>suivre</b> : ${montant(o.aSuivre)} jetons. Sinon, relance ou couche-toi.`;
  }

  async tourAdversaire(j) {
    const s = this.scene.joueurs.get(j.id);
    const o = this.d.options(j.id);
    s.nom.classList.add('parle');
    s.perso.regarder(0, 1.4);
    const force = this.dd.ia?.[j.id]?.({ o, rue: this.d.rue, d: this.d });
    let decision;
    if (force) decision = typeof force === 'string' ? { type: force, intention: 'moyen' } : { intention: 'moyen', ...force };
    else decision = decider(this.d, j.id, profilAuNiveau(j.id, this.def.niveau || 0), this.rng);
    if (!mouvementReduit()) s.perso.pencher();
    await attendre(hasard(650, 1250) * this.vitesse);
    // Les tics : ce qui trahit chacun
    if (j.id === 'baron' && decision.intention === 'bluff') s.perso.hausserSourcil();
    if (j.id === 'odette' && decision.intention === 'valeur') s.perso.retirerLunettes(true);
    if (j.id === 'kiki' && decision.intention === 'valeur') s.perso.rangerTelephone(true);
    s.nom.classList.remove('parle');
    return decision;
  }

  /** Ce que dit un adversaire en agissant (avant l'animation des jetons). */
  repliqueAction(evt) {
    if (evt.id === 'toi') return;
    const s = this.scene.joueurs.get(evt.id);
    const j = this.d.joueur(evt.id);
    let quoi = evt.action;
    if (evt.tapis && (quoi === 'miser' || quoi === 'relancer' || quoi === 'suivre')) quoi = 'tapis';
    const ligne = replique(evt.id, quoi, { x: montant(j.mise), pot: montant(this.d.pot) });
    if (!ligne) return;
    s.bulle.dire(ligne);
    clearTimeout(s.minuteurBulle);
    s.minuteurBulle = setTimeout(() => s.bulle.cacher(), 2400);
  }

  // ---------- animations ----------
  async animer(evts) {
    for (const e of evts) {
      switch (e.type) {
        case 'blinde': await this.animerMise(e.id, e.montant, false); break;
        case 'distribution':
          await this.recit('blindes');
          await this.distribuer(e.ordre);
          this.majEtiquette();
          await this.recit('cartes');
          break;
        case 'action': await this.animerAction(e); break;
        case 'ramasser': await this.ramasser(e.mises); break;
        case 'rue':
          await this.montrerRue(e);
          this.majEtiquette(true);
          await this.recit('rue', { rue: e.rue });
          break;
        case 'mainsRetournees': await this.retournerMains(e.ids, true); break;
        case 'abattage': await this.abattage(e); break;
        case 'gain': await this.gain(e); break;
        default: break;
      }
    }
  }

  posMise(id) {
    const m = this.scene.joueurs.get(id).mise;
    return { x: parseFloat(m.style.left), y: parseFloat(m.style.top) };
  }

  posTapis(id) {
    if (id === 'toi') return { x: 44, y: this.scene.h - 92 - this.scene.sab };
    return centre(this.scene.joueurs.get(id).nom);
  }

  posCarte(id, k) {
    if (id === 'toi') {
      return { x: 28 + 37 + k * 60, y: this.scene.h - 140 - this.scene.sab - 52 + k * 5, rot: k ? 5 : -6, w: 74 };
    }
    const p = this.scene.joueurs.get(id).cartesPos;
    return { x: p.x + 10 + k * 12, y: p.y + 14 + k * 2, rot: k ? 7 : -8, w: 22 };
  }

  posTableau(i) {
    const c = centre(this.scene.tableau);
    return { x: c.x - 161 + 29 + i * 66, y: c.y };
  }

  placer(el, p, w) {
    gsap.set(el, { x: p.x - w / 2, y: p.y - 0.71 * w, rotation: p.rot || 0 });
  }

  async animerMise(id, m, son = true) {
    if (!m) return;
    const j = this.d.joueur(id);
    const tl = volerJetons(this.scene.vol, this.posTapis(id), this.posMise(id), m, { son });
    if (!son) sons.jouer('jeton', { volume: 0.4 });
    this.majTapis(id);
    await tl;
    dessinerPile(this.scene.joueurs.get(id).mise, j.mise);
    gsap.fromTo(this.scene.joueurs.get(id).mise, { scale: 1.12 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' });
  }

  async distribuer(ordre) {
    const o = this.scene.origineDonne;
    const tl = gsap.timeline();
    let t = 0;
    for (let tour = 0; tour < 2; tour++) {
      for (const id of ordre) {
        const p = this.posCarte(id, tour);
        const el = creerCarte(null, p.w);
        this.scene.cartesTable.appendChild(el);
        this.cartes[id][tour] = el;
        gsap.set(el, { x: o.x - p.w / 2, y: o.y - 0.71 * p.w, rotationY: 180, rotation: -25, scale: id === 'toi' ? 0.4 : 1.3, transformPerspective: 800 });
        const fin = { x: p.x - p.w / 2, y: p.y - 0.71 * p.w };
        tl.to(el, {
          duration: 0.44 * this.vitesse, ease: 'power3.out', rotation: p.rot, scale: 1,
          motionPath: { path: [{ x: (o.x + fin.x) / 2, y: Math.min(o.y, fin.y) - 70 }, fin], curviness: 1.25 },
        }, t);
        tl.call(() => sons.jouer('glisse', { volume: 0.55 }), null, t);
        t += 0.12 * this.vitesse;
      }
    }
    await tl;
    const mes = this.cartes.toi;
    const toi = this.d.joueur('toi');
    mes.forEach((el, i) => devoiler(el, toi.cartes[i]));
    sons.jouer('pose', { volume: 0.6 });
    await gsap.to(mes, { rotationY: 0, y: '-=6', duration: 0.45, ease: 'back.out(1.6)', stagger: 0.14 });
    gsap.to(mes, { y: '+=6', duration: 0.3, ease: 'power2.out' });
  }

  majEtiquette(rueNouvelle = false) {
    const toi = this.d.joueur('toi');
    const et = this.scene.etiquette;
    if (!toi || toi.couche) { et.style.opacity = '.35'; return; }
    et.style.opacity = '1';
    let texte;
    if (this.d.tableau.length === 0) {
      const [a, b] = toi.cartes;
      const haute = Math.max(a.r, b.r), basse = Math.min(a.r, b.r);
      texte = a.r === b.r ? nommer(meilleure([a, b, { r: 2, s: 9 }, { r: 3, s: 9 }, { r: 4, s: 9 }])) : `${nomRang(haute)}-${nomRang(basse)}${a.s === b.s ? ', assorties' : ''}`;
    } else texte = nommer(meilleure(toi.cartes.concat(this.d.tableau)));
    if (texte !== et.textContent) {
      const avant = et.dataset.cat;
      const cat = this.d.tableau.length ? String(meilleure(toi.cartes.concat(this.d.tableau)).cat) : '-';
      et.textContent = texte;
      et.dataset.cat = cat;
      if (rueNouvelle && avant !== cat) {
        gsap.fromTo(et, { scale: 1.25, transformOrigin: '0% 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
        const c = centre(et);
        this.lumiere.eclat(c.x - 20, c.y, 1.2, 0.8);
      }
    }
  }

  async animerAction(e) {
    const id = e.id;
    this.repliqueAction(e);
    const s = this.scene.joueurs.get(id);
    if (e.action === 'coucher') {
      sons.jouer('pousse', { volume: 0.55 });
      const cible = { x: 195 + hasard(-30, 30), y: this.scene.centreY - 70 };
      await gsap.to(this.cartes[id], {
        x: cible.x - 20, y: cible.y - 20, rotation: hasard(-40, 40), opacity: 0, scale: id === 'toi' ? 0.5 : 0.9,
        duration: 0.45, ease: 'power2.in', stagger: 0.06,
      });
      if (id === 'toi') this.majEtiquette();
      else { s.perso.eteindre(true); s.nom.classList.add('couche'); }
      return;
    }
    if (e.action === 'parole') {
      sons.jouer('toc', { volume: 0.9 });
      sons.jouer('toc', { volume: 0.7, delai: 0.13 });
      this.ondes(id);
      await attendre(380);
      return;
    }
    // suivre, miser, relancer
    if (e.tapis) await this.effetTapis(id);
    await this.animerMise(id, e.montant);
  }

  ondes(id) {
    const p = this.posMise(id);
    for (let k = 0; k < 2; k++) {
      const o = creer('span');
      Object.assign(o.style, { width: '40px', height: '24px', borderRadius: '50%', border: '1.5px solid rgba(255,216,145,.55)' });
      this.scene.vol.appendChild(o);
      gsap.fromTo(o, { x: p.x - 20, y: p.y - 12, scale: 0.3, opacity: 1 }, { scale: 1.8, opacity: 0, duration: 0.6, delay: k * 0.13, ease: 'power2.out', onComplete: () => o.remove() });
    }
  }

  async effetTapis(id) {
    sons.jouer('impact', { volume: 1 });
    sons.jouer('pile', { volume: 0.8, delai: 0.05 });
    this.lumiere.balancer(4.5);
    const s = this.scene.joueurs.get(id);
    if (s?.perso) s.perso.pencher();
    const monde = this.scene.monde;
    if (!mouvementReduit()) {
      const tl = gsap.timeline();
      for (let i = 0; i < 10; i++) {
        const a = 8 * (1 - i / 10);
        tl.to(monde, { x: (i % 2 ? 1 : -1) * a, y: (Math.random() - 0.5) * a * 0.7, duration: 0.045, ease: 'none' });
      }
      tl.to(monde, { x: 0, y: 0, duration: 0.1 });
    }
    await this.tamponner('Tapis', 86, this.scene.centreY - 44);
  }

  /** Un mot imprimé sur la table : l'encre rouge vient se caler sous le trait. */
  async tamponner(mot, taille, y, duree = 1.2) {
    const t = creer('div', 'tampon', `<span class="t-ink">${mot}</span><span class="t-key">${mot}</span>`);
    t.style.setProperty('--taille', taille + 'px');
    t.style.top = y + 'px';
    this.scene.el.appendChild(t);
    const encre = t.querySelector('.t-ink');
    const tl = gsap.timeline({ onComplete: () => t.remove() });
    tl.fromTo(t, { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.24, ease: 'power4.in' })
      .fromTo(encre, { x: 14, y: -10 }, { x: 4, y: 3, duration: 0.5, ease: 'back.out(3)' })
      .to(t, { opacity: 0, scale: 0.96, duration: 0.45, ease: 'power1.in' }, `+=${duree}`);
    await attendre(500);
    return tl;
  }

  async ramasser(mises) {
    const pot = this.scene.centrePot;
    sons.jouer('ramasse', { volume: 0.7 });
    const tls = mises.map(m => {
      const el = this.scene.joueurs.get(m.id).mise;
      el.innerHTML = '';
      return volerJetons(this.scene.vol, this.posMise(m.id), pot, m.montant, { max: 4, hauteur: 24, son: false });
    });
    await Promise.all(tls);
    this.majPot();
  }

  majPot() {
    const total = this.d.joueurs.reduce((t, j) => t + j.engage - j.mise, 0);
    const potEl = this.scene.potEl;
    potEl.classList.toggle('vide', total <= 0);
    this.scene.compteur.regler(total);
    const jetons = decomposer(total, 9);
    const places = [[2, 13], [14, 3], [24, 15], [10, 19], [28, 1], [20, 8], [4, 2], [30, 18], [16, 22]];
    this.scene.tasPot.innerHTML = jetons.map((cls, i) => `<span class="jeton ${cls}" style="left:${places[i][0]}px;top:${places[i][1]}px"></span>`).join('');
  }

  async montrerRue(e) {
    const o = this.scene.origineDonne;
    const w = 58;
    if (e.rue === 1) {
      const p0 = this.posTableau(0);
      const els = e.cartes.map(c => {
        const el = creerCarte(c, w);
        this.scene.cartesTable.appendChild(el);
        gsap.set(el, { x: o.x - w / 2, y: o.y - 0.71 * w, rotationY: 180, rotation: -20, scale: 0.6, transformPerspective: 800 });
        return el;
      });
      this.cartesTableau.push(...els);
      const tl = gsap.timeline();
      els.forEach((el, k) => {
        tl.to(el, {
          duration: 0.46 * this.vitesse, ease: 'power3.out', scale: 1, rotation: 0,
          motionPath: { path: [{ x: (o.x + p0.x) / 2, y: p0.y - 120 }, { x: p0.x - w / 2 + k * 0.6, y: p0.y - 0.71 * w - k * 0.8 }], curviness: 1.2 },
        }, k * 0.07);
        tl.call(() => sons.jouer('glisse', { volume: 0.6 }), null, k * 0.07);
      });
      await tl;
      await attendre(120);
      sons.jouer('pose', { volume: 0.7 });
      await gsap.to(els, { rotationY: 0, duration: 0.4, ease: 'power2.inOut' });
      sons.jouer('eventail', { volume: 0.45 });
      await gsap.to(els, { x: (k) => this.posTableau(k).x - w / 2, y: p0.y - 0.71 * w, duration: 0.5, ease: 'power3.out' });
    } else {
      const idx = e.rue + 1;
      const p = this.posTableau(idx);
      const el = creerCarte(e.cartes[0], w);
      this.scene.cartesTable.appendChild(el);
      this.cartesTableau.push(el);
      gsap.set(el, { x: o.x - w / 2, y: o.y - 0.71 * w, rotationY: 180, rotation: -20, scale: 0.6, transformPerspective: 800 });
      sons.jouer('glisse', { volume: 0.6 });
      await gsap.to(el, {
        duration: 0.46 * this.vitesse, ease: 'power3.out', scale: 1, rotation: 0,
        motionPath: { path: [{ x: (o.x + p.x) / 2, y: p.y - 110 }, { x: p.x - w / 2, y: p.y - 0.71 * w }], curviness: 1.2 },
      });
      // la river se fait attendre un peu plus
      await attendre(e.rue === 3 ? 380 : 120);
      sons.jouer('pose', { volume: 0.7 });
      await gsap.to(el, { rotationY: 0, duration: 0.42, ease: 'back.out(1.4)' });
    }
    this.scene.joueurs.forEach(j => j.perso?.regarder(0, 1.6));
  }

  /** Retourne les cartes des adversaires : on les agrandit pour qu'on les lise. */
  async retournerMains(ids, tapis = false) {
    for (const id of ids) {
      if (id === 'toi') continue;
      const petites = this.cartes[id];
      if (!petites.length || petites[0].dataset.grande) continue;
      const j = this.d.joueur(id);
      const base = this.posCarte(id, 0);
      const vers195 = base.x < 195 ? 1 : base.x > 195 ? -1 : 0;
      const grandes = j.cartes.map((c, k) => {
        const el = creerCarte(c, 40);
        el.dataset.grande = '1';
        this.scene.cartesTable.appendChild(el);
        const p = { x: base.x + 6 + vers195 * 14 + k * 30, y: base.y + 26, rot: k ? 4 : -4 };
        gsap.set(el, { x: p.x - 20, y: p.y - 28.4, rotation: p.rot, rotationY: 180, scale: 0.55, transformPerspective: 700 });
        return el;
      });
      petites.forEach(el => el.remove());
      this.cartes[id] = grandes;
      sons.jouer('pose', { volume: 0.65 });
      await gsap.to(grandes, { rotationY: 0, scale: 1, duration: 0.45, ease: 'back.out(1.5)', stagger: 0.1 });
      if (!tapis) await attendre(250);
    }
  }

  async abattage(e) {
    this.lumiere.resserrer(this.scene.centreTableau, 200, 0.9);
    await attendre(350);
    const etiquettes = [];
    for (const id of e.ordre) {
      if (id === 'toi') {
        gsap.to(this.cartes.toi, { y: '-=10', duration: 0.3, yoyo: true, repeat: 1 });
      } else {
        // suspense : le dernier à montrer se fait attendre
        if (id === e.ordre[e.ordre.length - 1] && e.ordre.length > 1) await attendre(450);
        await this.retournerMains([id]);
      }
      if (id === 'toi') { await attendre(300); continue; } // ta main est déjà nommée sous tes cartes
      const nom = creer('div', 'main-nom', nommer(e.mains[id]));
      // le nom de la main se pose au-dessus des cartes retournées
      const p = this.posCarte(id, 0);
      const vers195 = p.x < 195 ? 1 : p.x > 195 ? -1 : 0;
      Object.assign(nom.style, { left: p.x + 21 + vers195 * 14 + 'px', top: p.y - 26 + 'px' });
      this.scene.vol.appendChild(nom);
      etiquettes.push([id, nom]);
      gsap.fromTo(nom, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3 });
      await attendre(380);
    }
    this.etiquettesAbattage = etiquettes;
  }

  async gain(e) {
    const potPrincipal = e.pots[0];
    const gagnantsPrincipal = potPrincipal.gagnants.map(g => g.id);
    if (e.abattage) {
      // les cartes gagnantes se lèvent, les autres s'éteignent
      const gagnante = e.mains[gagnantsPrincipal[0]];
      const cles = new Set(gagnantsPrincipal.flatMap(id => e.mains[id].cartes.map(c => String(c.r * 4 + c.s))));
      const toutes = [...this.cartesTableau, ...Object.values(this.cartes).flat()];
      for (const el of toutes) {
        if (!el.dataset.carte) continue;
        if (cles.has(el.dataset.carte)) {
          gsap.to(el, { y: '-=8', duration: 0.35, ease: 'back.out(2)' });
          const c = centre(el);
          this.lumiere.eclat(c.x, c.y, 0.9, 1);
        } else el.classList.add('terne');
      }
      for (const [id, nom] of this.etiquettesAbattage || []) if (gagnantsPrincipal.includes(id)) nom.classList.add('gagne');
      sons.jouer('pose', { volume: 0.5 });
      await this.tamponner(gagnantsPrincipal.length > 1 ? 'Partage' : titre(gagnante), gagnantsPrincipal.length > 1 ? 54 : 44, this.scene.centreY - 120, 1.6);
    }
    // les jetons partent vers les gagnants
    this.scene.potEl.classList.add('vide');
    this.scene.compteur.regler(0, false);
    this.scene.tasPot.innerHTML = '';
    const depart = this.scene.centrePot;
    const vols = [];
    for (const p of e.pots) {
      for (const g of p.gagnants) {
        if (!g.montant) continue;
        vols.push(volerJetons(this.scene.vol, depart, this.posTapis(g.id), g.montant, { max: 8, hauteur: 60 }));
      }
    }
    sons.jouer('ramasse', { volume: 0.8 });
    await Promise.all(vols);
    this.majTapis();
    const toiGagne = gagnantsPrincipal.includes('toi');
    if (toiGagne) {
      sons.jouer('choc', { volume: 0.6 });
      sons.jouer('choc', { volume: 0.5, delai: 0.15 });
      sons.jouer('pile', { volume: 0.6, delai: 0.3 });
      this.lumiere.pluieDeJetons(potPrincipal.montant >= 200 ? 70 : 36, this.scene.h - 300);
    }
    // réactions des adversaires
    for (const [id, s] of this.scene.joueurs) {
      if (id === 'toi' || !s.perso) continue;
      const j = this.d.joueur(id);
      if (!j || j.couche) continue;
      const gagne = gagnantsPrincipal.includes(id);
      if (gagne) s.perso.pencher(); else s.perso.secouerTete();
      const l = replique(id, gagne ? 'gagne' : 'perd');
      if (l && (gagne || e.abattage)) { s.bulle.dire(l); setTimeout(() => s.bulle.cacher(), 2600); }
    }
    await this.expliquerResultat(e);
  }

  async expliquerResultat(e) {
    const p = e.pots[0];
    const ids = p.gagnants.map(g => g.id);
    if (!e.abattage) {
      const g = ids[0];
      await this.dire(g === 'toi'
        ? 'Tout le monde s’est couché : le pot est à toi, sans montrer tes cartes.'
        : `${FICHES[g].nom} ramasse le pot sans montrer ses cartes : tous les autres se sont couchés.`, true);
      return;
    }
    if (ids.length > 1) {
      const autres = ids.filter(id => id !== 'toi').map(nomDe);
      const qui = ids.includes('toi') ? `${autres.join(', ')} et toi avez` : `${autres.slice(0, -1).join(', ')} et ${autres[autres.length - 1]} ont`;
      await this.dire(`Égalité : ${qui} la même main, ${minuscule(nommer(e.mains[ids[0]]))}. Le pot est <b>partagé</b>.`, true);
      return;
    }
    const g = ids[0];
    const perdants = p.eligibles.filter(id => id !== g).sort((a, b) => e.mains[b].sc - e.mains[a].sc);
    if (!perdants.length) return;
    const pr = perdants[0];
    const eg = e.mains[g], ep = e.mains[pr];
    const dep = departage(eg, ep);
    let texte;
    if (dep.type === 'kicker') {
      const les2 = g === 'toi' || pr === 'toi' ? 'Vous avez tous les deux' : `${nomDe(g)} et ${nomDe(pr)} ont tous les deux`;
      texte = `L’<b>abattage</b>. ${les2} ${unUne(eg)}${minuscule(nommer(eg))}. On compare alors la carte d’à côté, le <b>kicker</b> : ${possessif(g, dep.a)} bat ${possessif(pr, dep.b)}.`;
    } else {
      texte = `L’<b>abattage</b> : ${mainDe(g, eg)} bat ${mainDe(pr, ep)}.`;
    }
    texte += g === 'toi' ? ' Le pot est à toi.' : '';
    await this.dire(majuscule(texte), true);
  }

  async ranger() {
    this.lumiere.relacher();
    for (const s of this.scene.joueurs.values()) {
      s.bulle?.cacher();
      if (s.perso) { s.perso.eteindre(false); s.perso.retirerLunettes(false); s.perso.rangerTelephone(false); }
      s.nom?.classList.remove('couche', 'parle');
      if (s.mise) s.mise.innerHTML = '';
    }
    for (const [, nom] of this.etiquettesAbattage || []) gsap.to(nom, { opacity: 0, duration: 0.2, onComplete: () => nom.remove() });
    this.etiquettesAbattage = [];
    const o = this.scene.origineDonne;
    const toutes = [...this.scene.cartesTable.children];
    sons.jouer('glisse', { volume: 0.45 });
    await gsap.to(toutes, { x: o.x - 20, y: o.y - 30, rotation: hasard(-30, 30), scale: 0.5, opacity: 0, duration: 0.45, ease: 'power2.in', stagger: 0.025 });
    this.scene.cartesTable.innerHTML = '';
    this.scene.etiquette.textContent = '';
    this.scene.etiquette.dataset.cat = '';
    this.scene.potEl.classList.add('vide');
    this.scene.compteur.regler(0, false);
    this.majTapis();
  }
}
