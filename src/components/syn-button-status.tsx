// app/components/SyncButtonWithStatus.tsx
"use client";

import { useState } from "react";
import { syncOfflineQueue } from "@/lib/syncOfflineQueue";
import * as Progress from "@radix-ui/react-progress";
import * as Toast from "@radix-ui/react-toast";

export default function SyncButtonWithStatus() {
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const startSync = async () => {
    setSyncing(true);
    setProgress({ completed: 0, total: 0 });
    setToastMessage("");
    setOpen(false);

    await syncOfflineQueue({
      onStart: (total) => {
        setProgress({ completed: 0, total });
      },
      onProgress: (completed, total) => {
        setProgress({ completed, total });
      },
      onError: (mutation, err) => {
        console.error("Sync error:", mutation, err);
        setToastMessage(`❌ Failed to sync: ${mutation.path}`);
        setToastType("error");
        setOpen(true);
      },
      onComplete: (completed, total) => {
        const success = completed === total;
        setToastMessage(
          success
            ? "✅ Sync completed successfully!"
            : "⚠️ Sync stopped due to an error."
        );
        setToastType(success ? "success" : "error");
        setOpen(true);
        setSyncing(false);
      },
    });
  };
  const percentage =
    progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="space-y-4">
      <button
        className="px-4 py-2 mt-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
        onClick={startSync}
        disabled={syncing}
      >
        {syncing ? "Syncing..." : "Sync Offline Changes"}
      </button>

      {syncing && (
        <div className="w-full">
          <Progress.Root
            className="relative overflow-hidden bg-gray-200 rounded-full h-2"
            value={percentage}
          >
            <Progress.Indicator
              className="bg-blue-600 h-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
              }}
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
            toastType === "success"
              ? "border-green-400 text-green-700"
              : "border-red-400 text-red-700"
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
