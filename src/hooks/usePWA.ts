import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAReturn {
  isOffline: boolean;
  needRefresh: boolean;
  updateServiceWorker: (reloadPage?: boolean) => void;
  isInstallable: boolean;
  installPrompt: () => Promise<void>;
}

/**
 * Hook for managing Progressive Web App functionality
 *
 * Features:
 * - Service worker registration and updates
 * - Online/offline state detection
 * - PWA installation prompt handling
 *
 * @returns PWA state and control functions
 */
export function usePWA(): UsePWAReturn {
  // Online/offline state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // PWA install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Register service worker with vite-plugin-pwa
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('[PWA] Service worker registered:', registration);
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration failed:', error);
    },
    onNeedRefresh() {
      console.log('[PWA] New version available');
    },
  });

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] Connection restored');
      setIsOffline(false);
    };

    const handleOffline = () => {
      console.log('[PWA] Connection lost');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Stash the event so it can be triggered later
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      console.log('[PWA] Install prompt available');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger install prompt
  const installPrompt = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`[PWA] User response to install prompt: ${outcome}`);

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
    }
  }, [deferredPrompt]);

  return {
    isOffline,
    needRefresh,
    updateServiceWorker,
    isInstallable,
    installPrompt,
  };
}
