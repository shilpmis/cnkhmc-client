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
      alias: [
        { find: "@", replacement: path.resolve(__dirname, "./src") },
        // mdb-reader (biometric import) only uses these for encrypted files; their real code needs Node's stream
        { find: /^create-hash$/, replacement: path.resolve(__dirname, "./src/utils/mdb-crypto-stub.ts") },
        { find: /^browserify-aes\/browser\.js$/, replacement: path.resolve(__dirname, "./src/utils/mdb-crypto-stub.ts") },
      ],
    },
    define: {
      __Mode__: JSON.stringify(mode),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            recharts: ['recharts'],
          },
        },
      },
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