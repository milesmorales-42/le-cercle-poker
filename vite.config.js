import { defineConfig } from 'vite';

// Chemins relatifs : le jeu fonctionne aussi bien à la racine d'un domaine
// que dans un sous-dossier (GitHub Pages).
export default defineConfig({
  base: './',
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
