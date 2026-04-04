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

// 🚀 HANDLE NOTIFICATION CLICK
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) { client = clientList[i]; }
                }
                return client.focus();
            }
            return self.clients.openWindow('/');
        })
    );
});
