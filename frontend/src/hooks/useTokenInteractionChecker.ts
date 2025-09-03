import { useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

export const useTokenInteractionChecker = () => {
  const handleUserInteraction = useCallback(() => {
    // Only check if user is authenticated (has token)
    if (authAPI.isAuthenticated()) {
      authAPI.checkTokenOnInteraction();
    }
  }, []);

  useEffect(() => {
    // Add event listeners for user interactions
    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { passive: true });
    });

    // Cleanup event listeners
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [handleUserInteraction]);
};