import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Mode 'offline' produit un fichier HTML unique embarquant JS + CSS + assets.
// Mode standard produit un build multi-fichiers pour GitHub Pages.
export default defineConfig(({ mode }) => {
  const isOffline = mode === 'offline';

  // Base path GitHub Pages : configurable via VITE_BASE_PATH (ex: '/pegass/').
  // Par défaut on assume un repo nommé "pegass-dashboard".
  const onlineBase = process.env.VITE_BASE_PATH ?? '/pegass-dashboard/';

  return {
    base: isOffline ? './' : onlineBase,
    plugins: [
      svelte(),
      tailwindcss(),
      ...(isOffline ? [viteSingleFile()] : [])
    ],
    build: {
      outDir: isOffline ? 'dist-offline' : 'dist',
      emptyOutDir: true,
      sourcemap: !isOffline,
      assetsInlineLimit: isOffline ? 100_000_000 : 4096,
      cssCodeSplit: !isOffline
    },
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['tests/**/*.test.ts']
    }
  };
});
