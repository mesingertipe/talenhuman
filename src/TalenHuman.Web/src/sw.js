/* TalenHuman Static Service Worker V24.1 */
// 🚀 REQUIRED FOR VITE PWA INJECTMANIFEST
// @ts-ignore
const manifest = self.__WB_MANIFEST;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 🚀 PASS-THROUGH
  event.respondWith(fetch(event.request));
});
