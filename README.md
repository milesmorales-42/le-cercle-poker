# Le Cercle

Apprendre le Texas Hold'em en jouant. Pas de quiz : de vraies mains contre les habitués d'un cercle de jeu parisien, sous la lampe, avec Lucien, le croupier, qui t'explique chaque règle au moment où elle arrive.

## Jouer

- En ligne : https://milesmorales-42.github.io/le-cercle-poker/ (une fois GitHub Pages activé, voir plus bas).
- Sur iPhone : ouvrir la page dans Safari, puis Partager, « Sur l'écran d'accueil ». Le jeu s'ouvre alors en plein écran.

## Développer

```sh
npm install
npm run dev      # serveur local, accessible depuis le téléphone sur le même réseau
npm test         # tests du moteur
npm run build    # version publiable dans dist/
```

Organisation :

- `src/moteur/` : le moteur de Hold'em (évaluation des mains, donne, pots annexes, IA par personnalité). Sans interface, testé dans `tests/`.
- `src/partie/` : les parties (`scenarios.js`), les répliques et le metteur en scène (`jeu.js`) qui relie moteur, animations et Lucien.
- `src/ui/` : la table, les cartes, les jetons, les bulles, les plaques d'action, l'intro et la carte de membre.
- `src/fx/lumiere.js` : la lumière et les particules (PixiJS).
- `src/persos/portraits.js` : les portraits des personnages, en SVG.
- `src/audio/sons.js` : les sons (Web Audio).

## Publier

Chaque push sur `main` construit le jeu et le publie sur GitHub Pages (`.github/workflows/pages.yml`).
À faire une seule fois : dans les réglages du dépôt, Pages, « Build and deployment », choisir la source « GitHub Actions ».

## Crédits

- Sons : Kenney (kenney.nl), packs Casino Audio, Impact Sounds et Interface Sounds, licence CC0.
- Polices : Young Serif et Bricolage Grotesque, licence SIL Open Font (via Fontsource).
- Animations : GSAP. Lumière et particules : PixiJS.
