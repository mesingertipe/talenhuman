/* TalenHuman Static Service Worker V24 */
const CACHE_NAME = 'talenhuman-v24';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 🚀 PASS-THROUGH: Solo queremos que Chrome vea un SW activo para habilitar la instalación
  event.respondWith(fetch(event.request));
});
