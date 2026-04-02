import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      disable: false, // RESTORED FOR ANDROID SUPPORT
      registerType: 'prompt', // 🚀 PREVENTS INFINITE RELOAD LOOPS
      injectRegister: 'auto',
      filename: 'sw.js',
      manifestFilename: 'manifest.json', 
      workbox: {
        cleanupOutdatedCaches: true,
        // 🚀 REMOVED skipWaiting and clientsClaim to prevent mid-session crashes
        cacheId: 'v21-pwa', 
        maximumFileSizeToCacheInBytes: 5242880,
      },
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'TalenHuman',
        short_name: 'TalenHuman',
        description: 'Gestión de Capital Humano',
        theme_color: '#4f46e5',
        start_url: '/?source=pwa', // 🚀 INSTANT BULLETPROOF PWA DETECTION
        display: 'standalone',
        background_color: '#020617',
        icons: [
          {
            src: 'icon-192-v21.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512-v21.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
