// Les parties du Cercle. Les premières sont scénarisées : le paquet est préparé pour que
// la situation à apprendre arrive, mais tu joues librement et Lucien s'adapte.
//
// Une donne scénarisée :
//   bouton, mains { id: 'As Kh' }, tableau 'Ad 8c 3h 5s Jh'
//   ia { id: ({o, rue, d}) => action | null }  (null : l'adversaire décide seul)
//   recit : moments où Lucien parle (fonctions async qui reçoivent L et le contexte)
//     avant, blindes, cartes, conseil (renvoie {type, a, texte}), apresAction, rue, fin

const dizaine = x => Math.max(20, Math.round(x / 10) * 10);

const P1 = {
  id: 'p1', numero: 1, titre: 'Première main', resume: 'Blindes, flop, abattage, kicker',
  joueurs: ['toi', 'odette', 'baron'], tapis: 1000, blindes: [10, 20], coach: 1,
  ouverture: [
    'Bonsoir. Moi, c’est Lucien, le croupier du Cercle.',
    'Ici, pas de leçon au tableau : on joue de vraies mains, et je t’explique au fur et à mesure.',
    'Ce soir, tu joues contre Odette et le Baron. Chacun commence avec 1 000 jetons.',
  ],
  cloture: [
    'Première partie terminée. Tu sais suivre, te coucher, relancer et lire un abattage.',
    'La prochaine fois, on parle de la couleur. Et le Baron voudra sa revanche.',
  ],
  donnes: [
    {
      bouton: 'toi',
      mains: { toi: 'Ks 9d', odette: 'Qc 3h', baron: '7d 6d' },
      tableau: 'Kh 7c 2s 4h Tc',
      ia: {
        odette: ({ o, rue }) => (rue === 0 ? 'suivre' : o.peutParler ? 'parole' : 'coucher'),
        baron: ({ o, rue }) => (rue === 0 ? 'parole' : rue === 1 && o.peutParler ? { type: 'relancer', a: 40 } : o.peutParler ? 'parole' : 'suivre'),
      },
      recit: {
        avant: L => L.dire('Le disque blanc devant toi, c’est le <b>bouton</b>. Il tourne d’un joueur à chaque donne. Celui qui l’a parle en dernier après le flop : c’est la meilleure place.', true),
        blindes: L => L.dire('Odette et le Baron posent les <b>blindes</b>, 10 et 20. Ce sont des mises obligatoires : il y a toujours quelque chose à gagner.', true),
        cartes: L => L.dire('Deux cartes chacun, face cachée. Ton <b>K</b>, c’est un Roi : sur toutes les tables, A, K, Q et J veulent dire As, Roi, Dame et Valet.', true),
        conseil: ({ o, rue }) => {
          if (rue === 0) return { type: 'suivre', texte: 'À trois, le bouton parle en premier avant le flop. Pour rester dans le coup, <b>suis</b> la grosse blinde : 20 jetons.' };
          if (rue === 1 && !o.peutParler) return { type: 'suivre', texte: 'Le Baron mise 40. Avec ta paire de Rois, <b>suivre</b> est raisonnable.' };
          if (rue === 1) return { type: 'parole', texte: 'Personne n’a misé. Tu peux dire <b>parole</b> : tu restes sans rien payer.' };
          if (rue === 2) return o.peutParler
            ? { type: 'parole', texte: 'Il dit parole : il passe sans miser. Toi aussi, tu peux <b>parler</b>. Ça ne coûte rien.' }
            : { type: 'suivre', texte: 'Il mise encore. Ta paire tient toujours : tu peux suivre.' };
          if (rue === 3) return o.peutParler
            ? { type: 'relancer', a: 60, texte: 'Dernière carte. Tu penses être devant ? <b>Mise</b> : s’il a moins bien, il paiera peut-être.' }
            : { type: 'suivre', texte: 'Dernière mise à payer avant l’abattage. Ta paire de Rois vaut bien ça.' };
          return null;
        },
        apresAction: (L, { evt, rue }) => {
          if (evt.id === 'baron' && rue === 0 && evt.action === 'parole') return L.dire('Odette complète sa blinde, le Baron dit <b>parole</b> : il ne rajoute rien. Tout le monde a misé autant, on passe au flop.');
          if (evt.id === 'odette' && evt.action === 'coucher') return L.dire('Odette se <b>couche</b> : elle rend ses cartes et laisse ce qu’elle a déjà misé.');
          return null;
        },
        rue: (L, { rue, toiEnJeu }) => {
          if (rue === 1) return L.dire(toiEnJeu
            ? 'Le <b>flop</b> : trois cartes communes, pour tout le monde. Ta main, ce sont les cinq meilleures cartes entre les tiennes et celles-ci. Un Roi ! Avec le tien, ça fait une <b>paire de Rois</b>.'
            : 'Le <b>flop</b> : trois cartes communes. Regarde : un Roi. Avec tes cartes, tu aurais eu une paire de Rois.', true);
          if (rue === 2) return L.dire('Le <b>turn</b>, quatrième carte commune. Nouveau tour d’enchères.');
          if (rue === 3) return L.dire('La <b>river</b>, la dernière. Après ce tour, on montre les cartes.');
          return null;
        },
      },
    },
    {
      bouton: 'odette',
      mains: { toi: '7c 2d', odette: 'Js 4c', baron: 'Ah Jd' },
      tableau: 'Ac 9h 5s Qd 3c',
      ia: {
        odette: () => 'coucher',
        baron: ({ o, rue }) => {
          if (rue === 0) return o.miseMax <= 20 ? { type: 'relancer', a: 60 } : 'suivre';
          return o.peutParler ? { type: 'relancer', a: dizaine(o.pot * 0.6) } : 'suivre';
        },
      },
      recit: {
        avant: L => L.dire('Le bouton a tourné : Odette l’a. Le Baron pose la petite blinde, toi la <b>grosse</b>. Tes 20 jetons partent tout seuls.', true),
        cartes: L => L.dire('7 et 2, de couleurs différentes : la pire main du jeu. Voyons ce qu’en pensent les autres.'),
        conseil: ({ o, rue }) => {
          if (rue === 0 && !o.peutParler) return { type: 'coucher', texte: 'Le Baron <b>relance</b> à 60 : pour continuer, il faudrait payer 40 de plus. Avec 7-2, on se <b>couche</b>. C’est le geste le plus rentable du poker.' };
          if (rue > 0 && !o.peutParler) return { type: 'coucher', texte: 'Tu n’as rien touché, et lui mise encore. Couche-toi : tu limites la casse.' };
          return null;
        },
        apresAction: (L, { evt }) => {
          if (evt.id === 'odette' && evt.action === 'coucher') return L.dire('Odette se couche tout de suite. Elle ne joue que ses bonnes mains : retiens ça pour plus tard.');
          if (evt.id === 'toi' && evt.action === 'coucher') return L.dire('Bien vu. Tu perds ta blinde, pas plus. Les bons joueurs se couchent bien plus souvent qu’ils ne jouent.');
          return null;
        },
        fin: (L, { toiAPaye }) => (toiAPaye ? L.dire('Avec 7-2, chaque jeton payé était perdu d’avance. Ce n’est pas grave : c’est comme ça qu’on apprend.') : null),
      },
    },
    {
      bouton: 'baron',
      mains: { toi: 'As Kc', odette: 'Ah Qd', baron: '9c 6c' },
      tableau: 'Ad 8c 3h 5s Jh',
      ia: {
        baron: ({ o, rue }) => (rue === 0 && o.miseMax <= 20 ? 'suivre' : 'coucher'),
        odette: ({ o }) => (o.peutParler ? 'parole' : 'suivre'),
      },
      recit: {
        avant: L => L.dire('Le bouton passe au Baron. Cette fois, c’est toi qui poses la petite blinde, et Odette la grosse.'),
        cartes: L => L.dire('<b>As-Roi</b> ! Une des meilleures mains de départ.', true),
        conseil: ({ o, rue }) => {
          if (rue === 0 && !o.peutParler) return { type: 'relancer', a: 60, texte: 'Le Baron a suivi. Avec As-Roi, ne te contente pas de compléter : <b>relance</b> à 60. Ceux qui veulent voir le flop paieront plus cher.' };
          if (rue >= 1 && o.peutParler) return { type: 'relancer', a: dizaine(o.pot * 0.5), texte: rue === 1 ? 'Une <b>paire d’As</b>, avec un Roi à côté. Tu parles en premier : mise environ la moitié du pot.' : 'Tu es toujours devant. Continue de miser, Odette paie.' };
          if (rue >= 1) return { type: 'suivre', texte: 'Odette mise. Avec ta paire d’As, tu suis.' };
          return null;
        },
        apresAction: (L, { evt }) => {
          if (evt.id === 'baron' && evt.action === 'coucher') return L.dire('Le Baron jette ses cartes : trop cher pour lui. Il reste Odette.');
          return null;
        },
        rue: (L, { rue, toiEnJeu }) => (rue === 1 && toiEnJeu ? L.dire('Un As au flop. Tu as une paire d’As. Odette, elle, a payé ta relance : elle a peut-être un As aussi.') : null),
      },
    },
  ],
};

const bientot = (numero, titre, resume) => ({ id: 'p' + numero, numero, titre, resume, bientot: true });

export const PARTIES = [
  P1,
  bientot(2, 'La couleur', 'Tirages, couleur, quinte, miser pour être payé'),
  bientot(3, 'Le bluff du Baron', 'Bluffer, lire un adversaire, se coucher face à la force'),
  bientot(4, 'Tapis', 'Faire tapis, pots annexes'),
  bientot(5, 'Le pot partagé', 'Égalités, le tableau joue'),
  bientot(6, 'Kiki s’installe', 'Partie libre à quatre'),
  bientot(7, 'La grande table', 'Partie libre, adversaires plus forts'),
  bientot(8, 'Le Notaire', 'Partie libre contre le meilleur joueur du Cercle'),
];
