// vite.config.ts
// import react from '@vitejs/plugin-react'; // If using React, adjust for other frameworks
import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import path from 'path';

export default defineConfig(({ mode }) => {
  return {
    plugins: [reactRefresh()],
    css: {
      postcss: {
        plugins: [
          tailwindcss(),
          autoprefixer(),
        ],
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      __Mode__: JSON.stringify(mode),
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://localhost:3334',
          changeOrigin: true,
          secure: false,
        },
      },
      allowedHosts: ['localhost'],
    },
  }
})