import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lire } from '../src/moteur/cartes.js';
import { eval5, meilleure, nommer, departage, categorie, coeur } from '../src/moteur/evaluation.js';
import { calculerPots, partager } from '../src/moteur/pots.js';
import { Donne } from '../src/moteur/donne.js';
import { generateur } from '../src/moteur/hasard.js';
import { chen, equite } from '../src/moteur/force.js';
import { decider, PROFILS } from '../src/moteur/ia.js';

const m = t => meilleure(lire(t));

test('catégories de mains', () => {
  assert.equal(m('As Ks Qs Js Ts').cat, 8);
  assert.equal(categorie(m('As Ks Qs Js Ts')), 9);
  assert.equal(m('9c 9d 9h 9s Kd').cat, 7);
  assert.equal(m('Qs Qh Qd 7c 7s').cat, 6);
  assert.equal(m('Ad Jd 8d 6d 3d').cat, 5);
  assert.equal(m('8c 7d 6s 5h 4c').cat, 4);
  assert.equal(m('7s 7h 7d Kc 2s').cat, 3);
  assert.equal(m('Jc Jd 4h 4s Ac').cat, 2);
  assert.equal(m('Th Ts Kd 6c 3h').cat, 1);
  assert.equal(m('Ac Qd 9s 6h 2c').cat, 0);
});

test('la roue (A-2-3-4-5) est une quinte au 5, battue par 2-3-4-5-6', () => {
  const roue = m('Ah 2c 3d 4s 5h');
  assert.equal(roue.cat, 4);
  assert.equal(roue.tb[0], 5);
  assert.ok(m('2c 3d 4s 5h 6c').sc > roue.sc);
  assert.equal(nommer(roue), 'Quinte au 5');
});

test('meilleure main parmi 7 cartes', () => {
  const e = m('Ks 9d Kh 7c 2s 4h Tc');
  assert.equal(nommer(e), 'Paire de Rois');
  assert.equal(coeur(e).length, 2);
  assert.equal(nommer(m('8h 6h Kh 9h 3c 2h 7s')), 'Couleur à cœur');
  assert.equal(nommer(m('Ts 9d Js 8h 4c Qd 2c')), 'Quinte à la Dame');
  assert.equal(nommer(m('Qd Qc Ah 7s 3c 9d Qs')), 'Brelan de Dames');
  assert.equal(nommer(m('As Ad Ac Kd Kh 2c 3d')), 'Full aux As par les Rois');
});

test('départage : le kicker (partie 1, donne 3)', () => {
  const tableau = 'Ad 8c 3h 5s Jh';
  const toi = m('As Kc ' + tableau);
  const odette = m('Ah Qd ' + tableau);
  assert.ok(toi.sc > odette.sc);
  const d = departage(toi, odette);
  assert.equal(d.type, 'kicker');
  assert.equal(d.a, 13);
  assert.equal(d.b, 12);
});

test('départage : catégorie, hauteur, égalité', () => {
  assert.equal(departage(m('8h 6h Kh 9h 3c 2h 7s'), m('Ks Qd Kh 9h 3c 2h 7s')).type, 'categorie');
  assert.equal(departage(m('Ks Kd 2h 7c 9d'), m('Qs Qd Ah 7c 9d')).type, 'hauteur');
  const tableau = 'Ac Kd Ks Qh Jc';
  assert.equal(departage(m('As 4d ' + tableau), m('Ah 3c ' + tableau)).type, 'egalite');
});

test('pots annexes : trois tapis différents', () => {
  const pots = calculerPots([
    { id: 'a', engage: 100, couche: false },
    { id: 'b', engage: 300, couche: false },
    { id: 'c', engage: 300, couche: false },
    { id: 'd', engage: 50, couche: true },
  ]);
  assert.deepEqual(pots, [
    { montant: 350, eligibles: ['a', 'b', 'c'] },
    { montant: 400, eligibles: ['b', 'c'] },
  ]);
});

test('mise non suivie : elle revient à son auteur', () => {
  const pots = calculerPots([
    { id: 'a', engage: 100, couche: false },
    { id: 'b', engage: 500, couche: false },
  ]);
  assert.deepEqual(pots, [
    { montant: 200, eligibles: ['a', 'b'] },
    { montant: 400, eligibles: ['b'] },
  ]);
});

test('partage avec jeton impair : au premier à gauche du bouton', () => {
  assert.deepEqual(partager(25, ['x', 'y']), [{ id: 'x', montant: 13 }, { id: 'y', montant: 12 }]);
});

const trois = (tapis = [1000, 1000, 1000]) => [
  { id: 'toi', nom: 'Toi', tapis: tapis[0] },
  { id: 'odette', nom: 'Odette', tapis: tapis[1] },
  { id: 'baron', nom: 'Le Baron', tapis: tapis[2] },
];

test('blindes et ordre de parole à trois', () => {
  const d = new Donne({ joueurs: trois(), bouton: 'toi', petite: 10, grosse: 20, rng: generateur(1) });
  d.demarrer();
  assert.equal(d.joueur('odette').mise, 10);
  assert.equal(d.joueur('baron').mise, 20);
  assert.equal(d.joueurActif.id, 'toi'); // à trois, le bouton parle en premier avant le flop
  d.agir('toi', { type: 'suivre' });
  assert.equal(d.joueurActif.id, 'odette');
  d.agir('odette', { type: 'suivre' });
  assert.equal(d.joueurActif.id, 'baron'); // la grosse blinde a toujours la parole
  d.agir('baron', { type: 'parole' });
  assert.equal(d.joueurActif, null);
  const evts = d.avancer();
  assert.equal(evts.find(e => e.type === 'rue').cartes.length, 3);
  assert.equal(d.pot, 60);
  assert.equal(d.joueurActif.id, 'odette'); // après le flop : premier actif à gauche du bouton
});

test('à deux : le bouton pose la petite blinde et parle en premier, puis en dernier', () => {
  const d = new Donne({ joueurs: trois().slice(0, 2), bouton: 'toi', petite: 10, grosse: 20, rng: generateur(2) });
  d.demarrer();
  assert.equal(d.joueur('toi').mise, 10);
  assert.equal(d.joueur('odette').mise, 20);
  assert.equal(d.joueurActif.id, 'toi');
  d.agir('toi', { type: 'suivre' });
  d.agir('odette', { type: 'parole' });
  d.avancer();
  assert.equal(d.joueurActif.id, 'odette');
});

test('tout le monde se couche : la grosse blinde ramasse', () => {
  const d = new Donne({ joueurs: trois(), bouton: 'toi', petite: 10, grosse: 20, rng: generateur(3) });
  d.demarrer();
  d.agir('toi', { type: 'coucher' });
  d.agir('odette', { type: 'coucher' });
  assert.equal(d.joueurActif, null);
  const evts = d.avancer();
  const gain = evts.find(e => e.type === 'gain');
  assert.equal(gain.abattage, false);
  assert.equal(d.joueur('baron').tapis, 1010);
  assert.ok(d.finie);
});

test('relance minimum : au moins la taille de la dernière relance', () => {
  const d = new Donne({ joueurs: trois(), bouton: 'toi', petite: 10, grosse: 20, rng: generateur(4) });
  d.demarrer();
  d.agir('toi', { type: 'relancer', a: 60 }); // relance de 40
  const o = d.options('odette');
  assert.equal(o.relanceMinA, 100);
  d.agir('odette', { type: 'relancer', a: 150 }); // relance de 90
  assert.equal(d.options('baron').relanceMinA, 240);
});

test('tapis trop court pour relancer : celui qui a déjà parlé ne peut que suivre', () => {
  const d = new Donne({ joueurs: trois([1000, 1000, 70]), bouton: 'toi', petite: 10, grosse: 20, rng: generateur(5) });
  d.demarrer();
  d.agir('toi', { type: 'relancer', a: 60 });
  d.agir('odette', { type: 'suivre' });
  d.agir('baron', { type: 'tapis' }); // 70 : hausse de 10, moins que la relance minimum
  assert.equal(d.joueurActif.id, 'toi');
  assert.equal(d.options('toi').peutRelancer, false);
  assert.equal(d.options('toi').aSuivre, 10);
});

test('donne scénarisée : première paire de la partie 1', () => {
  const d = new Donne({
    joueurs: trois(), bouton: 'toi', petite: 10, grosse: 20, rng: generateur(6),
    mains: { toi: lire('Ks 9d'), baron: lire('7d 6d'), odette: lire('Qc 3h') },
    tableau: lire('Kh 7c 2s 4h Tc'),
  });
  d.demarrer();
  d.agir('toi', { type: 'suivre' });
  d.agir('odette', { type: 'suivre' });
  d.agir('baron', { type: 'parole' });
  d.avancer();
  d.agir('odette', { type: 'parole' });
  d.agir('baron', { type: 'relancer', a: 40 });
  d.agir('toi', { type: 'suivre' });
  d.agir('odette', { type: 'coucher' });
  d.avancer();
  for (let rue = 2; rue <= 3; rue++) {
    d.agir('baron', { type: 'parole' });
    d.agir('toi', { type: 'parole' });
    d.avancer();
  }
  assert.ok(d.finie);
  const gain = d.journal.find(e => e.type === 'gain');
  assert.equal(gain.pots[0].gagnants[0].id, 'toi');
  assert.equal(nommer(gain.mains.toi), 'Paire de Rois');
  assert.equal(d.joueur('toi').tapis, 1000 - 60 + 140);
});

test('le tableau joue : pot partagé', () => {
  const d = new Donne({
    joueurs: trois(), bouton: 'toi', petite: 10, grosse: 20, rng: generateur(7),
    mains: { toi: lire('Ac 2d'), baron: lire('Kh 3c'), odette: lire('Jd Jc') },
    tableau: lire('5s 6d 7c 8h 9s'),
  });
  d.demarrer();
  d.agir('toi', { type: 'suivre' });
  d.agir('odette', { type: 'coucher' });
  d.agir('baron', { type: 'parole' });
  while (!d.finie) {
    if (d.joueurActif) d.agir(d.joueurActif.id, { type: 'parole' });
    else d.avancer();
  }
  const gain = d.journal.find(e => e.type === 'gain');
  assert.equal(gain.pots[0].gagnants.length, 2);
  // Pot de 50 (20 + 20 + la petite blinde d'Odette), coupé en deux parts de 25
  assert.equal(d.joueur('toi').tapis, 1005);
  assert.equal(d.joueur('baron').tapis, 1005);
});

test('tapis à trois : pot principal et pot annexe, mains retournées', () => {
  const d = new Donne({
    joueurs: trois([1000, 200, 600]), bouton: 'toi', petite: 10, grosse: 20, rng: generateur(8),
    mains: { toi: lire('As Ad'), odette: lire('Ks Kd'), baron: lire('Qs Qd') },
    tableau: lire('2c 7h 9d Jc 3s'),
  });
  d.demarrer();
  d.agir('toi', { type: 'relancer', a: 600 });
  d.agir('odette', { type: 'tapis' });
  d.agir('baron', { type: 'tapis' });
  const vus = [];
  while (!d.finie) vus.push(...d.avancer());
  assert.ok(vus.some(e => e.type === 'mainsRetournees'));
  const gain = vus.find(e => e.type === 'gain');
  assert.equal(gain.pots.length, 2);
  assert.equal(d.joueur('toi').tapis, 1800);
  assert.equal(d.joueur('odette').tapis + d.joueur('baron').tapis, 0);
});

test('chen et équité donnent des ordres de grandeur sensés', () => {
  assert.ok(chen(lire('As Ad')) >= 20);
  assert.ok(chen(lire('7c 2d')) <= 0);
  const rng = generateur(9);
  const aa = equite(lire('As Ad'), [], 1, 1500, rng);
  assert.ok(aa > 0.8 && aa < 0.9, `AA contre une main : ${aa}`);
  const tirage = equite(lire('8h 6h'), lire('Kh 9h 3c'), 1, 1500, rng);
  assert.ok(tirage > 0.3 && tirage < 0.55, `tirage couleur : ${tirage}`);
});

test('cinq cents donnes jouées par l’IA : jetons conservés, toujours des actions légales', () => {
  const rng = generateur(42);
  const noms = ['baron', 'odette', 'kiki', 'notaire'];
  let tapis = { baron: 1000, odette: 1000, kiki: 1000, notaire: 1000 };
  let bouton = 0;
  for (let n = 0; n < 500; n++) {
    const vivants = noms.filter(id => tapis[id] > 0);
    if (vivants.length < 2) tapis = { baron: 1000, odette: 1000, kiki: 1000, notaire: 1000 };
    const joueurs = noms.filter(id => tapis[id] > 0).map(id => ({ id, nom: id, tapis: tapis[id] }));
    const avant = joueurs.reduce((t, j) => t + j.tapis, 0);
    const d = new Donne({ joueurs, bouton: joueurs[bouton % joueurs.length].id, petite: 10, grosse: 20, rng });
    d.demarrer();
    let garde = 0;
    while (!d.finie) {
      assert.ok(garde++ < 200, 'donne interminable');
      const j = d.joueurActif;
      if (j) {
        const choix = decider(d, j.id, PROFILS[j.id], rng);
        if (choix.type === 'relancer') {
          const o = d.options(j.id);
          assert.ok(o.peutRelancer, 'relance proposée alors qu’elle est interdite');
          assert.ok(choix.a >= o.relanceMinA && choix.a <= o.relanceMaxA, `relance hors bornes ${choix.a}`);
        }
        d.agir(j.id, choix);
      } else d.avancer();
    }
    const apres = Object.values(d.tapisFinaux()).reduce((t, x) => t + x, 0);
    assert.equal(apres, avant, `jetons perdus à la donne ${n}`);
    tapis = { ...tapis, ...d.tapisFinaux() };
    bouton++;
  }
});
