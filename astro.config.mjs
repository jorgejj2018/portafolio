// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages publica el sitio en https://jorgejj2018.github.io/portafolio/
// Si lo despliegas en un dominio propio, cambia SITE y BASE_PATH (por ejemplo BASE_PATH=/).
export default defineConfig({
  site: process.env.SITE ?? 'https://jorgejj2018.github.io',
  base: process.env.BASE_PATH ?? '/portafolio',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
