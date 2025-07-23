// lib/hooks/useOnlineSync.ts
'use client';

import { useEffect, useState } from 'react';

export function useOnlineSync() {
  const [shouldPrompt, setShouldPrompt] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setShouldPrompt(true);
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const confirmSync = () => {
    setShouldPrompt(false);
    import('@/lib/syncOfflineQueue').then(({ syncOfflineQueue }) => {
      syncOfflineQueue();
    });
  };

  const dismissPrompt = () => {
    setShouldPrompt(false);
  };

  return { shouldPrompt, confirmSync, dismissPrompt };
}
