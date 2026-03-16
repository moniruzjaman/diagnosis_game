import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // For GitHub Pages deployment, set base to repo name
  // For Vercel or custom domain, leave base as '/'
  const base = process.env.GITHUB_PAGES ? '/diagnosis_game/' : '/';
  
  return {
    plugins: [react(), tailwindcss()],
    base,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild' as const,
    },
  };
});
