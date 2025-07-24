'use client';

import { useEffect, useState } from 'react';
import { syncOfflineQueue } from '@/lib/syncOfflineQueue';
import * as Progress from '@radix-ui/react-progress';
import * as Toast from '@radix-ui/react-toast';

export default function SyncButtonWithStatus() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setToastType('info');
      setToastMessage('🔌 You’re back online. Tap to sync your offline changes.');
      setOpen(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastType('error');
      setToastMessage('⚠️ You are offline. Sync is unavailable.');
      setOpen(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startSync = async () => {
    setSyncing(true);
    setProgress({ completed: 0, total: 0 });
    setToastMessage('');
    setOpen(false);

    await syncOfflineQueue({
      onStart: (total) => setProgress({ completed: 0, total }),
      onProgress: (completed, total) => setProgress({ completed, total }),
      onError: (mutation, err) => {
        console.error('Sync error:', mutation, err);
        setToastType('error');
        setToastMessage(`❌ Sync failed: ${mutation.path}`);
        setOpen(true);
      },
      onComplete: (completed, total) => {
        const success = completed === total;
        setToastType(success ? 'success' : 'error');
        setToastMessage(success ? '✅ All changes synced.' : '⚠️ Sync incomplete.');
        setOpen(true);
        setSyncing(false);
      },
    });
  };

  return (
    <div className="space-y-4">
      <button
        className="px-4 py-2 mt-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
        onClick={startSync}
        disabled={syncing || !isOnline}
      >
        {syncing ? 'Syncing...' : 'Sync Offline Changes'}
      </button>

      {syncing && (
        <div className="w-full">
          <Progress.Root
            className="relative overflow-hidden bg-gray-200 rounded-full h-2"
            value={percentage}
          >
            <Progress.Indicator
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </Progress.Root>
          <p className="text-sm text-gray-600 mt-1">
            {progress.completed}/{progress.total} synced
          </p>
        </div>
      )}

      <Toast.Provider swipeDirection="right">
        <Toast.Root
          className={`bg-white rounded-md shadow-md px-4 py-3 text-sm border ${
            toastType === 'success'
              ? 'border-green-400 text-green-700'
              : toastType === 'error'
              ? 'border-red-400 text-red-700'
              : 'border-blue-400 text-blue-700'
          }`}
          open={open}
          onOpenChange={setOpen}
        >
          <Toast.Title>{toastMessage}</Toast.Title>
        </Toast.Root>
        <Toast.Viewport className="fixed bottom-4 right-4 w-80 z-50" />
      </Toast.Provider>
    </div>
  );
}
