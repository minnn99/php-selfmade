// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCwl_cskIjgFx2vyEzXGUQ0jY7jJpsGFJI",
  authDomain: "php-selfmade-a7990.firebaseapp.com",
  projectId: "php-selfmade-a7990",
  storageBucket: "php-selfmade-a7990.firebasestorage.app",
  messagingSenderId: "854584349002",
  appId: "1:854584349002:web:e2767e21123e277913b3",
  measurementId: "G-25YX5IEVTN"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background notification received:', payload);

  const notificationTitle = payload.notification?.title || 'お知らせ';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.type || 'default',
    data: {
      click_action: payload.data?.click_action || '/',
      type: payload.data?.type || 'system',
      priority: payload.data?.priority || 'medium'
    },
    actions: [
      {
        action: 'view',
        title: '確認する'
      }
    ],
    requireInteraction: payload.data?.priority === 'high'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const clickAction = event.notification.data?.click_action || '/';

  if (event.action === 'view') {
    // Open specific page
    event.waitUntil(
      clients.openWindow(clickAction)
    );
  } else {
    // Default click behavior
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url === clickAction && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if not found
          if (clients.openWindow) {
            return clients.openWindow(clickAction);
          }
        })
    );
  }
});

// Handle push events (fallback)
self.addEventListener('push', (event) => {
  if (event.data) {
    const payload = event.data.json();
    const notificationTitle = payload.notification?.title || 'お知らせ';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  }
});