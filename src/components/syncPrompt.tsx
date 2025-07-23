// components/SyncPrompt.tsx
"use client";

import { useOnlineSync } from "@/hooks/use-online-sync";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function SyncPrompt() {
  const { shouldPrompt, confirmSync, dismissPrompt } = useOnlineSync();

  return (
    <Dialog.Root
      open={shouldPrompt}
      onOpenChange={(open) => !open && dismissPrompt()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg w-[90vw] max-w-sm">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">
              You're Back Online
            </Dialog.Title>
            <Dialog.Close asChild>
              <button onClick={dismissPrompt}>
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="mb-4 text-sm">
            Would you like to sync your offline data now or later?
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={dismissPrompt}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
            >
              Later
            </button>
            <button
              onClick={confirmSync}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              Sync Now
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
