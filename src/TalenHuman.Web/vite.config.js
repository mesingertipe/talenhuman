import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // FORCE IMMEDIATE UPDATE ON EVERY DEVICE
      injectRegister: 'auto',
      manifestFilename: 'manifest.json', // Ensure it matches what the browser looks for
      workbox: {
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 7000000
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
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
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
