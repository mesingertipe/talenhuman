import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      disable: false, // RESTORED FOR ANDROID SUPPORT
      registerType: 'autoUpdate', 
      injectRegister: 'auto',
      filename: 'sw-v16.js',
      manifestFilename: 'manifest-v16.json', 
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        cacheId: 'v16-elite-pwa', // SHIELD AGAINST OLD CACHE
        maximumFileSizeToCacheInBytes: 5242880, // 5MB limit to accommodate the main bundle
      },
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'TalenHuman',
        short_name: 'TalenHuman',
        description: 'Employee Management PWA',
        theme_color: '#4f46e5',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        icons: [
          {
            src: 'icon-192-v16.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512-v16.png',
            sizes: '512x512',
            type: 'image/png'
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
