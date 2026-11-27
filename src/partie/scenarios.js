// Le parcours du Cercle : une initiation courte en trois leçons (le déroulement,
// les combinaisons, les exceptions), puis des tables libres de plus en plus dures.
//
// Une donne scénarisée :
//   bouton, mains { id: 'As Kh' }, tableau 'Ad 8c 3h 5s Jh'
//   cartesSurTable : tout le monde montre sa main et personne ne mise (démonstration rapide)
//   blindes [petite, grosse] et tapis { id: n } pour cette donne seulement
//   ia { id: ({o, rue, d}) => action | null }  (null : l'adversaire décide seul)
//   recit : ce que dit Lucien (avant, cartes, conseil, apresAction, rue, fin)
//   echelle : combinaisons à tamponner sur l'échelle après l'abattage
//   sansExplication : Lucien ne commente pas l'abattage à sa façon habituelle (le récit s'en charge)

const T = 'toucher'; // Lucien attend un toucher pour continuer

const DEROULEMENT = {
  id: 'l2', numero: 2, groupe: 'Initiation', titre: 'Le déroulement', resume: 'Blindes, enchères, flop, turn, river, abattage',
  joueurs: ['toi', 'odette', 'baron'], tapis: 1000, blindes: [10, 20], coach: 1,
  ouverture: ['Maintenant, une vraie main, avec des mises. Je t’explique au fil des cartes.'],
  cloture: ['Voilà comment se joue une main. Dernière leçon : les cas particuliers.'],
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
        avant: L => L.dire('Le jeton D, c’est le <b>bouton</b> : il tourne à chaque donne. Les deux joueurs à sa gauche posent les <b>blindes</b>, des mises obligatoires.', T),
        cartes: L => L.dire('Deux cartes chacun, face cachée cette fois : elles ne sont qu’à toi.'),
        conseil: ({ o, rue }) => {
          if (rue === 0) return { type: 'suivre', texte: 'À toi de parler. Pour jouer la main, <b>suis</b> la grosse blinde : 20.' };
          if (rue === 1 && !o.peutParler) return { type: 'suivre', texte: 'Il <b>mise</b> 40. Tu peux suivre, <b>relancer</b> ou te <b>coucher</b>. Avec ta paire, suis.' };
          if (o.peutParler && rue < 3) return { type: 'parole', texte: 'Personne ne mise : dis <b>parole</b>, ça ne coûte rien.' };
          if (rue === 3 && o.peutParler) return { type: 'relancer', a: 60, texte: 'Dernière carte. <b>Mise</b> : s’il a moins bien, il paiera.' };
          return { type: 'suivre', texte: 'Suis pour voir sa main.' };
        },
        apresAction: (L, { evt, rue }) => {
          if (evt.id === 'baron' && rue === 0 && evt.action === 'parole') return L.dire('Tout le monde a misé autant : on passe aux cartes communes.');
          if (evt.id === 'odette' && evt.action === 'coucher') return L.dire('Odette se <b>couche</b> : elle abandonne sa main et sa mise.');
          return null;
        },
        rue: (L, { rue, toiEnJeu }) => {
          if (rue === 1) return L.dire(toiEnJeu
            ? 'Le <b>flop</b> : les trois premières cartes communes. Avec ton Roi, tu as une paire de Rois.'
            : 'Le <b>flop</b> : trois cartes communes, pour tout le monde.', T);
          if (rue === 2) return L.dire('Le <b>turn</b> : une quatrième carte, et un nouveau tour d’enchères.');
          if (rue === 3) return L.dire('La <b>river</b> : la dernière. Ensuite, on montre les cartes.');
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
        baron: ({ o, rue }) => (rue === 0 ? (o.miseMax <= 20 ? { type: 'relancer', a: 60 } : 'suivre') : o.peutParler ? { type: 'relancer', a: Math.max(20, Math.round((o.pot * 0.6) / 10) * 10) } : 'suivre'),
      },
      recit: {
        avant: L => L.dire('Le bouton passe à Odette. Cette fois, c’est toi qui poses la grosse blinde.'),
        cartes: L => L.dire('7 et 2 : la plus mauvaise main du jeu.'),
        conseil: ({ o, rue }) => {
          if (o.peutParler) return null;
          return rue === 0
            ? { type: 'coucher', texte: 'Le Baron <b>relance</b> à 60. Avec 7-2, couche-toi : tu ne perds que ta blinde.' }
            : { type: 'coucher', texte: 'Rien touché, et il mise encore : couche-toi.' };
        },
      },
    },
  ],
};

const COMBINAISONS = {
  id: 'l1', numero: 1, groupe: 'Initiation', titre: 'Les combinaisons', resume: 'Les dix mains, de la carte haute à la quinte flush royale',
  joueurs: ['toi', 'odette', 'baron'], tapis: 1000, blindes: [10, 20], coach: 1,
  ouverture: [
    'Bonsoir, moi c’est Lucien, le croupier. Ici, on apprend en jouant.',
    'D’abord, les combinaisons. Chacun reçoit deux cartes, puis cinq cartes communes arrivent au milieu. Ta main, ce sont tes cinq meilleures cartes parmi les sept.',
  ],
  cloture: ['Tu connais les dix combinaisons. Tu les retrouves à tout moment avec le bouton des cartes, en haut. Prochaine leçon : le déroulement d’une main.'],
  donnes: [
    {
      cartesSurTable: true, blindes: [0, 0], bouton: 'toi', echelle: [0, 1, 2], sansExplication: true,
      mains: { toi: 'Ac 8d', odette: '6h 3c', baron: 'Kc 9d' },
      tableau: '9s 6d 2c Kh Jd',
      recit: {
        cartes: L => L.dire('On joue cartes sur table : tout le monde montre sa main. Sur les cartes, A, K, Q et J veulent dire As, Roi, Dame et Valet.', T),
        rue: (L, { rue }) => {
          if (rue === 1) return L.dire('Odette a une <b>paire</b> de 6, le Baron une paire de 9. Toi, rien : tu joues ta <b>carte haute</b>, l’As.', T);
          if (rue === 2) return L.dire('Un Roi : le Baron a maintenant deux paires, une <b>double paire</b>.', T);
          return null;
        },
        fin: L => L.dire('Carte haute, paire, double paire : le bas de l’échelle.', T),
      },
    },
    {
      cartesSurTable: true, blindes: [0, 0], bouton: 'odette', echelle: [3, 4, 5], sansExplication: true,
      mains: { toi: 'Ah 4h', odette: 'Ts 9c', baron: '7s 7c' },
      tableau: '7d 8h Jc Qh 2h',
      recit: {
        rue: (L, { rue }) => {
          if (rue === 1) return L.dire('Trois 7 pour le Baron : un <b>brelan</b>.', T);
          if (rue === 2) return L.dire('La Dame donne à Odette cinq cartes qui se suivent, de 8 à la Dame : une <b>quinte</b>.', T);
          if (rue === 3) return L.dire('Un cœur ! Tu as cinq cartes de la même couleur : une <b>couleur</b>.', T);
          return null;
        },
        fin: L => L.dire('La couleur bat la quinte, qui bat le brelan. Cette fois, c’est toi qui gagnes.', T),
      },
    },
    {
      cartesSurTable: true, blindes: [0, 0], bouton: 'baron', echelle: [6, 7, 8, 9], sansExplication: true,
      mains: { toi: 'Qs Qd', odette: '5d 5c', baron: '7s 9s' },
      tableau: '5s 5h Qc 8s 6s',
      recit: {
        rue: (L, { rue }) => {
          if (rue === 1) return L.dire('Toi : trois Dames et deux 5, un <b>full</b>. Odette : les quatre 5, un <b>carré</b>.', T);
          if (rue === 3) return L.dire('Le 6 de pique ! Le Baron a cinq piques qui se suivent : une <b>quinte flush</b>.', T);
          return null;
        },
        fin: L => L.dire('Au-dessus de la quinte flush, il n’y a que la <b>quinte flush royale</b> : 10, J, Q, K, As de la même couleur.', T),
      },
    },
  ],
};

const EXCEPTIONS = {
  id: 'l3', numero: 3, groupe: 'Initiation', titre: 'Les exceptions', resume: 'Kicker, pot partagé, la roue, tapis et pot annexe',
  joueurs: ['toi', 'odette', 'baron'], tapis: 1000, blindes: [10, 20], coach: 1,
  ouverture: ['Quatre cas particuliers, et tu connais toutes les règles. Les trois premiers, cartes sur table.'],
  cloture: ['C’est tout pour les règles. Maintenant, à toi de jouer : je te laisse la table.'],
  donnes: [
    {
      cartesSurTable: true, blindes: [0, 0], bouton: 'toi', sansExplication: true,
      mains: { toi: 'As Kc', odette: 'Ah Qd', baron: '9c 6c' },
      tableau: 'Ad 8c 3h 5s Jh',
      recit: {
        rue: (L, { rue }) => (rue === 1 ? L.dire('Un As au flop : Odette et toi avez la même <b>paire d’As</b>.', T) : null),
        fin: L => L.dire('Même paire ? On compare la carte d’à côté, le <b>kicker</b> : ton Roi bat sa Dame.', T),
      },
    },
    {
      cartesSurTable: true, bouton: 'odette', sansExplication: true,
      mains: { toi: 'Ac 2d', odette: 'Kh 3c', baron: 'Jd Jc' },
      tableau: '5s 6d 7c 8h 9s',
      recit: {
        rue: (L, { rue }) => (rue === 3 ? L.dire('Le tableau fait une quinte à lui seul, de 5 à 9.', T) : null),
        fin: L => L.dire('Personne ne fait mieux : <b>le tableau joue</b>, et le pot est partagé. Seules cinq cartes comptent, alors ton As ne sert à rien.', T),
      },
    },
    {
      cartesSurTable: true, blindes: [0, 0], bouton: 'baron', sansExplication: true,
      mains: { toi: 'As 2h', odette: 'Kd Kc', baron: 'Qc Jc' },
      tableau: '3c 4d 5h Ks 9d',
      recit: {
        rue: (L, { rue }) => {
          if (rue === 1) return L.dire('As, 2, 3, 4, 5 : une quinte ! Ici, l’As compte pour 1. C’est la plus petite quinte, <b>la roue</b>.', T);
          if (rue === 2) return L.dire('Odette touche un brelan de Rois. Mais une quinte bat un brelan.', T);
          return null;
        },
        fin: L => L.dire('L’As peut être tout en haut (10-J-Q-K-A) ou tout en bas (A-2-3-4-5), jamais au milieu.', T),
      },
    },
    {
      bouton: 'baron', tapis: { odette: 150 }, sansExplication: true,
      mains: { toi: 'Kh Kc', odette: 'As Ad', baron: 'Qs Js' },
      tableau: '2c 7d 9s 4h 3c',
      ia: {
        baron: ({ o, rue }) => {
          if (rue === 0) return o.miseMax <= 20 ? { type: 'relancer', a: 60 } : 'suivre';
          if (rue === 1) return o.peutParler ? { type: 'relancer', a: 100 } : 'suivre';
          return o.peutParler ? 'parole' : 'suivre';
        },
        odette: () => 'tapis',
      },
      recit: {
        avant: L => L.dire('Dernier cas, avec de vrais jetons. Odette n’a plus que 150 jetons.'),
        conseil: ({ o, rue }) => {
          if (rue === 0) return { type: 'suivre', texte: o.suivreEstTapis ? 'Suis.' : 'Deux Rois : suis.' };
          if (o.peutParler) return { type: 'parole', texte: 'Dis parole.' };
          return { type: 'suivre', texte: 'Suis.' };
        },
        apresAction: (L, { evt }) => {
          if (evt.id === 'odette' && evt.tapis) return L.dire('Odette fait <b>tapis</b> : elle mise tous ses jetons. Elle ne pourra gagner, contre chacun, que ce qu’elle a misé.', T);
          return null;
        },
        rue: (L, { rue }) => (rue === 1 ? L.dire('Odette n’a plus de jetons : elle ne parle plus. Ce que vous misez maintenant, le Baron et toi, va dans un pot à part, le <b>pot annexe</b>. Elle ne peut pas le gagner.', T) : null),
        fin: L => L.dire('Odette gagne le <b>pot principal</b> avec sa paire d’As. Le pot annexe se jouait entre le Baron et toi : ta paire de Rois l’emporte.', T),
      },
    },
  ],
};

const PALIERS = [[10, 20], [20, 40], [40, 80], [75, 150], [100, 200], [150, 300]];

const T1 = {
  id: 't1', numero: 4, groupe: 'Tables', titre: 'La table du Baron', resume: 'Partie libre à trois',
  joueurs: ['toi', 'odette', 'baron'], tapis: 1000, blindes: PALIERS[0], coach: 2, niveau: 0,
  libre: { mains: 14, montee: 5, paliers: PALIERS },
  ouverture: ['Partie libre. Je ne te dis plus quoi jouer : je ne parle que si tu fais une vraie erreur.'],
};

const T2 = {
  id: 't2', numero: 5, groupe: 'Tables', titre: 'Kiki s’installe', resume: 'Partie libre à quatre',
  joueurs: ['toi', 'odette', 'baron', 'kiki'], tapis: 1000, blindes: PALIERS[0], coach: 3, niveau: 0.3,
  libre: { mains: 16, montee: 5, paliers: PALIERS },
  ouverture: ['Kiki s’installe. Il paie tout ce qu’on lui propose : mise quand tu as du jeu, et ne le bluffe pas.'],
};

const T3 = {
  id: 't3', numero: 6, groupe: 'Tables', titre: 'Le Notaire', resume: 'Le meilleur joueur du Cercle',
  joueurs: ['toi', 'baron', 'kiki', 'notaire'], tapis: 1000, blindes: PALIERS[0], coach: 3, niveau: 0.6,
  libre: { mains: 18, montee: 4, paliers: PALIERS },
  ouverture: ['Le Notaire joue peu de mains, et presque toujours juste. Bonne chance.'],
};

export const PARTIES = [COMBINAISONS, DEROULEMENT, EXCEPTIONS, T1, T2, T3];
