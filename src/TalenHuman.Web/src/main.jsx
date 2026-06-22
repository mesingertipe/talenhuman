import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onOfflineReady() {
    console.log('La aplicación está lista para usarse sin conexión.')
  },
})

// Recarga automática segura cuando un nuevo service worker toma el control (evita loops)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  const hasController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasController && !refreshing) {
      refreshing = true;
      console.log('🔄 Nueva versión activada. Recargando aplicación...');
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
