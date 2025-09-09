import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeFCM, setupForegroundListener } from './services/firebase'

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Export notification initialization function to be called after login
export const initializeNotifications = async () => {
  try {
    // Wait a bit for auth data to be saved to localStorage
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if user is logged in - auth_data contains the full auth object (暗号化されたデータを考慮)
    const authDataStr = localStorage.getItem('auth_data');
    if (!authDataStr) {
      console.log('User not logged in, skipping FCM initialization');
      return;
    }
    
    // Verify that auth data can be decrypted and parsed
    try {
      const { decryptData, isEncrypted } = await import('./utils/encryption');
      const dataToUse = isEncrypted(authDataStr) ? decryptData(authDataStr) : authDataStr;
      JSON.parse(dataToUse); // Test if data is valid
    } catch (error) {
      console.log('Invalid auth data, skipping FCM initialization');
      return;
    }
    
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Initialize FCM
      await initializeFCM();
      
      // Setup foreground listener
      setupForegroundListener();
    } else {
      console.log('Notification permission denied');
    }
  } catch (error) {
    console.error('Notification initialization error:', error);
  }
};

// Don't initialize notifications on app load - wait for login

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
