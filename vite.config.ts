import { defineConfig } from 'vite';

export default defineConfig({
  // Utiliser ./ assure que les liens vers le JS/CSS fonctionnent quel que soit le nom du repo GitHub
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Assure que le manifest est généré correctement
    manifest: true,
  },
});
