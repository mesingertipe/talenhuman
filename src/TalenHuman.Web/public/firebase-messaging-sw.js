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

// 📻 BROADCAST CHANNEL (V65.1.30) - Canal de radio para hablar con la UI
const bc = new BroadcastChannel('talenhuman_notifications');

messaging.onBackgroundMessage((payload) => {
  console.log('📻 [FCM SW] Received:', payload);
  
  // 1. Siempre emitir hacia la radio interna (Toast)
  bc.postMessage({ type: 'FOREGROUND_NOTIFICATION', payload });

  // 2. Revisar si debemos mostrar Push de sistema
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const isFocused = clientList.some(client => client.focused);
      const isDiagnostic = payload.data?.category === 'diagnostic' || payload.data?.type === 'test';
      
      if (isFocused && !isDiagnostic) {
          console.log('✅ UI is FOCUSED. Toast handled via BC. Skipping push.');
          return; 
      }

      console.log(isDiagnostic ? '🚀 Diagnostic Push: Forcing System Notification.' : '💤 UI is BACKGROUND. Showing system push.');
      const notificationTitle = payload.notification?.title || 'Notificación';
      const notificationOptions = {
          body: payload.notification?.body || 'Nuevo mensaje',
          icon: payload.notification?.image || '/logo192.png',
          badge: '/icon-192.png',
          tag: payload.data?.comunicadoId || 'talenhuman-broadcast',
          renotify: true,
          data: payload.data
      };
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
                    // Send a message via Radio instead of individual postMessage
                    if (comunicadoId) {
                        bc.postMessage({
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
