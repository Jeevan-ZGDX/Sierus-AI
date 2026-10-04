import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [svelte()],
  server: {
    port: 5173,
    host: true,
<<<<<<< HEAD
=======
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
>>>>>>> 643a550 (supabase integration)
  }
});
