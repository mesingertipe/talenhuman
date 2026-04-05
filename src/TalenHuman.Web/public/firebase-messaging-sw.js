importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Parse query parameters for dynamic configuration
const urlParams = new URLSearchParams(self.location.search);

const firebaseConfig = {
  apiKey: urlParams.get('apiKey') || "YOUR_API_KEY",
  authDomain: urlParams.get('authDomain') || "talenhuman.firebaseapp.com",
  projectId: urlParams.get('projectId') || "talenhuman",
  storageBucket: urlParams.get('storageBucket') || "talenhuman.appspot.com",
  messagingSenderId: urlParams.get('messagingSenderId') || "YOUR_SENDER_ID",
  appId: urlParams.get('appId') || "YOUR_APP_ID",
  measurementId: urlParams.get('measurementId') || "YOUR_MEASUREMENT_ID"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Message Received:', payload);
  
  const notificationTitle = payload.notification?.title || 'Notificación';
  const notificationOptions = {
      body: payload.notification?.body || 'Nuevo mensaje recibido',
      icon: payload.notification?.image || '/logo192.png',
      badge: '/icon-192.png',
      tag: payload.data?.comunicadoId || 'talenhuman-broadcast',
      renotify: true,
      data: payload.data // Incluir METADATOS para el clic
  };

  // 🛡️ INTELLIGENT FILTERING (V65.1.29)
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const isFocused = clientList.some(client => client.focused);
      
      if (isFocused) {
          console.log('✅ App is FOCUSED. Skipping system notification, sending message to UI.');
          clientList.forEach(client => {
              if (client.focused) {
                  client.postMessage({
                      type: 'FOREGROUND_NOTIFICATION',
                      payload: payload
                  });
              }
          });
          return; // No showNotification here
      }

      console.log('💤 App is in BACKGROUND. Showing system notification.');
      return self.registration.showNotification(notificationTitle, notificationOptions);
  });
});

// 🚀 HANDLE NOTIFICATION CLICK (V65.1.28)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // Extract metadata
    const data = event.notification.data || {};
    const comunicadoId = data.comunicadoId;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // 1. Try to find an existing window
            for (const client of clientList) {
                if (client.url.includes(self.location.origin)) {
                    // Send a message to the client instead of reloading if it's already open
                    if (comunicadoId) {
                        client.postMessage({
                            type: 'NOTIFICATION_CLICK',
                            comunicadoId: comunicadoId
                        });
                    }
                    return client.focus();
                }
            }

            // 2. Open new window if none found, with the deep link parameter
            let targetUrl = '/';
            if (comunicadoId) {
                targetUrl = `/?comunicadoId=${comunicadoId}`;
            }
            return self.clients.openWindow(targetUrl);
        })
    );
});
