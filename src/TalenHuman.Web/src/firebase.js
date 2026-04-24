import { initializeApp, getApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";
import { getPerformance } from "firebase/performance";

// Configuración general por defecto (Fallback)
const defaultFirebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "talenhuman.firebaseapp.com",
  projectId: "talenhuman",
  storageBucket: "talenhuman.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
  vapidKey: "YOUR_VAPID_KEY"
};

let app = null;
let messaging = null;
let analytics = null;
let performance = null;
let pendingMessageCallback = null;
let currentOnMessageUnsubscribe = null;
let currentVapidKey = defaultFirebaseConfig.vapidKey;
let isRegistering = false;

/**
 * Inicializa Firebase de forma dinámica con la configuración del Tenant
 */
export const initializeFirebase = async (tenantConfig = {}) => {
  try {
    const finalConfig = {
      apiKey: tenantConfig.firebaseApiKey || defaultFirebaseConfig.apiKey,
      authDomain: tenantConfig.firebaseAuthDomain || defaultFirebaseConfig.authDomain,
      projectId: tenantConfig.firebaseProjectId || defaultFirebaseConfig.projectId,
      storageBucket: tenantConfig.firebaseStorageBucket || defaultFirebaseConfig.storageBucket,
      messagingSenderId: tenantConfig.firebaseMessagingSenderId || defaultFirebaseConfig.messagingSenderId,
      appId: tenantConfig.firebaseAppId || defaultFirebaseConfig.appId,
      measurementId: tenantConfig.firebaseMeasurementId || defaultFirebaseConfig.measurementId
    };

    currentVapidKey = tenantConfig.firebaseVapidKey || defaultFirebaseConfig.vapidKey;

    const isPlaceholder = !finalConfig.apiKey || finalConfig.apiKey.includes('YOUR_') || 
                         !finalConfig.appId || finalConfig.appId.includes('YOUR_');

    if (isPlaceholder) return;

    if (!getApps().length) {
      app = initializeApp(finalConfig);
    } else {
      app = getApp();
    }

    if (typeof window !== "undefined" && app) {
      try {
        messaging = getMessaging(app);
        
        // 🚀 Register pending listener if exists
        if (pendingMessageCallback) {
            console.log("🔗 Firebase: Registering pending FCM listener...");
            if (currentOnMessageUnsubscribe) currentOnMessageUnsubscribe();
            currentOnMessageUnsubscribe = onMessage(messaging, (payload) => {
                console.log('🔥 FCM Message Received (Late Init):', payload);
                if (pendingMessageCallback) pendingMessageCallback(payload);
            });
        }

        // Initialize Analytics/Performance early if available
        if (finalConfig.measurementId && !finalConfig.measurementId.includes('YOUR_')) {
            try {
                analytics = getAnalytics(app);
                performance = getPerformance(app);
            } catch (err) {}
        }

        const configParams = new URLSearchParams({
            apiKey: finalConfig.apiKey,
            authDomain: finalConfig.authDomain,
            projectId: finalConfig.projectId,
            storageBucket: finalConfig.storageBucket,
            messagingSenderId: finalConfig.messagingSenderId,
            appId: finalConfig.appId,
            measurementId: finalConfig.measurementId
        }).toString();

        const swUrl = `/firebase-messaging-sw.js?${configParams}`;
        const registrations = await navigator.serviceWorker.getRegistrations();
        const swBaseUrl = window.location.origin + '/firebase-messaging-sw.js';
        const alreadyRegistered = registrations.some(reg => reg.active && reg.active.scriptURL.startsWith(swBaseUrl));

        if (!alreadyRegistered && !isRegistering) {
          isRegistering = true;
          navigator.serviceWorker.register(swUrl).then((registration) => {
            console.log("🔥 Firebase SW registered for tenant:", finalConfig.projectId);
            isRegistering = false;
          }).catch((err) => { 
            console.error("SW Registration failed:", err);
            isRegistering = false; 
          });
        }
      } catch (mErr) {
        console.warn("Firebase Messaging failed to init:", mErr);
      }
    }
  } catch (error) {
    console.error("Fallo crítico al inicializar Firebase:", error);
  }
};

export const requestForToken = async () => {
  if (!messaging) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await getToken(messaging, {
      vapidKey: currentVapidKey,
      serviceWorkerRegistration: registration,
    });
  } catch (err) {
    return null;
  }
};

export const onMessageListener = (callback) => {
    pendingMessageCallback = callback;
    if (!messaging) {
        console.log('⏳ Firebase: Messaging not ready, pooling listener...');
        return () => { pendingMessageCallback = null; };
    }

    if (currentOnMessageUnsubscribe) currentOnMessageUnsubscribe();
    currentOnMessageUnsubscribe = onMessage(messaging, (payload) => {
        console.log('🔥 FCM Message Received:', payload);
        if (payload && callback) callback(payload);
    });
    
    return () => {
        if (currentOnMessageUnsubscribe) currentOnMessageUnsubscribe();
        pendingMessageCallback = null;
    };
};

export { messaging, analytics };
