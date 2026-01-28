'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/sw-register';

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Register service worker on mount
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker().then((result) => {
        if (result.success) {
          console.log('PWA ready - Service Worker registered');
        } else {
          console.warn('⚠️ PWA not available:', result.error?.message);
        }
      });
    }

    // Listen for SW updates
    const handleSWUpdate = () => {
      console.log('Service Worker update available');
      // TODO: Show a toast notification to user about update
      // For now, just log it
    };

    window.addEventListener('sw-update-available', handleSWUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []);

  return null; // This component doesn't render anything
}



