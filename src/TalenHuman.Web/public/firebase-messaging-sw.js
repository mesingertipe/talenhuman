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
  
  if (payload.notification) {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.image || '/logo192.png',
        badge: '/icon-192.png',
        tag: payload.data?.comunicadoId || 'talenhuman-broadcast',
        renotify: true,
        data: payload.data
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  }
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
