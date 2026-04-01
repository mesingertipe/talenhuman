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
  vapidKey: "YOUR_VAPID_KEY" // Guardar aquí la vapid key por defecto
};

let app;
let messaging;
let analytics;
let performance;
let currentVapidKey = defaultFirebaseConfig.vapidKey;

/**
 * Inicializa Firebase de forma dinámica con la configuración del Tenant
 * @param {Object} tenantConfig Configuración opcional del tenant
 */
export const initializeFirebase = (tenantConfig = {}) => {
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

    if (!getApps().length) {
      app = initializeApp(finalConfig);
    } else {
      app = getApp();
    }

    if (typeof window !== "undefined") {
      messaging = getMessaging(app);

      // Register Service Worker with dynamic config as query params
      const configParams = new URLSearchParams({
        apiKey: finalConfig.apiKey,
        authDomain: finalConfig.authDomain,
        projectId: finalConfig.projectId,
        storageBucket: finalConfig.storageBucket,
        messagingSenderId: finalConfig.messagingSenderId,
        appId: finalConfig.appId,
        measurementId: finalConfig.measurementId
      }).toString();

      navigator.serviceWorker.register(`/firebase-messaging-sw.js?${configParams}`)
        .then((registration) => {
          // Initialize Analytics/Performance
          if (typeof window !== "undefined") {
            analytics = getAnalytics(app);
            performance = getPerformance(app);
          }

          console.log("🔥 Firebase SW registered for tenant:", finalConfig.projectId);
        })
        .catch((err) => {
          console.error("Firebase SW registration failed:", err);
        });
    }
  } catch (error) {
    console.error("Fallo al inicializar Firebase:", error);
  }
};

// Inicialización inicial con defaults
initializeFirebase();

export const requestForToken = async () => {
  if (!messaging) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const currentToken = await getToken(messaging, {
      vapidKey: currentVapidKey,
      serviceWorkerRegistration: registration,
    });
    if (currentToken) {
      console.log("Firebase Token:", currentToken);
      return currentToken;
    }
    return null;
  } catch (err) {
    console.log("An error occurred while retrieving token. ", err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { messaging, analytics };
