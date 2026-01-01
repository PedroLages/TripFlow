import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          strategies: 'injectManifest',
          srcDir: 'public',
          filename: 'sw.js',
          registerType: 'autoUpdate',
          includeAssets: ['icons/*.png', 'offline.html'],

          manifest: {
            name: 'TripFlow - Smart Trip Planning',
            short_name: 'TripFlow',
            description: 'Plan trips with AI-powered itineraries, budget tracking, and offline support',
            theme_color: '#3B82F6',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: 'icons/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png'
              },
              {
                src: 'icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png'
              },
              {
                src: 'icons/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png'
              },
              {
                src: 'icons/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png'
              },
              {
                src: 'icons/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png'
              },
              {
                src: 'icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: 'icons/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png'
              },
              {
                src: 'icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },

          injectManifest: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js'],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB (default is 2MB)
          },

          devOptions: {
            enabled: true, // Enable PWA in dev mode for testing
            type: 'module'
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
