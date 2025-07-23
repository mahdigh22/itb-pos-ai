// ClientServiceWorker.tsx
"use client";
import { useEffect } from "react";

export function ClientServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.log("Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}
