"use client";

import { useEffect, useRef, useState } from "react";

export function useOnlineSync() {
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const [wasOffline, setWasOffline] = useState(!navigator.onLine);
  const wasOfflineRef = useRef(!navigator.onLine);

  async function checkInternetAccess(): Promise<boolean> {
    try {
      const response = await fetch("/ping.txt", {
        cache: "no-store",
        method: "HEAD",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    const handleOnline = async () => {
      if (wasOfflineRef.current) {
        const reallyOnline = await checkInternetAccess();
        if (reallyOnline) {
          setShouldPrompt(true);
          setWasOffline(false);
          wasOfflineRef.current = false;
        }
      }
    };

    const handleOffline = () => {
      setWasOffline(true);
      wasOfflineRef.current = true;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const online = navigator.onLine;
      if (online && wasOfflineRef.current) {
        const reallyOnline = await checkInternetAccess();
        if (reallyOnline) {
          setShouldPrompt(true);
          setWasOffline(false);
          wasOfflineRef.current = false;
        }
      } else if (!online && !wasOfflineRef.current) {
        setWasOffline(true);
        wasOfflineRef.current = true;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const confirmSync = () => {
    setShouldPrompt(false);
    import("@/lib/syncOfflineQueue").then(({ syncOfflineQueue }) => {
      syncOfflineQueue();
    });
  };

  const dismissPrompt = () => {
    setShouldPrompt(false);
  };

  return { shouldPrompt, confirmSync, dismissPrompt };
}
