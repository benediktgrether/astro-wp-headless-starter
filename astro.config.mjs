// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // ⭐ Add path aliases here
  alias: {
    '@components': './src/components',
    '@blocks': './src/blocks',
    '@layouts': './src/layouts',
    '@lib': './src/lib',
    '@styles': './src/styles',
    '@pages': './src/pages',
    '@assets': './src/assets',
    '@types': './src/types'
  },

  vite: {
    plugins: [tailwindcss()]
  }
});