"use client";

import { useOnlineSync } from "@/hooks/use-online-sync";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { cn } from "@/lib/utils";

export function SyncPrompt() {
  const { shouldPrompt, confirmSync, dismissPrompt } = useOnlineSync();

  return (
    <Dialog
      open={shouldPrompt}
      onOpenChange={(open) => !open && dismissPrompt()}
    >
      <DialogContent
        className={cn(
          " z-9999"
        )}
      >
        <DialogHeader className="flex justify-between items-center mb-4">
          <DialogTitle>You're Back Online</DialogTitle>
          <DialogClose asChild>
            <button onClick={dismissPrompt} aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </DialogClose>
        </DialogHeader>
        <DialogDescription className="mb-4 text-sm">
          Would you like to sync your offline data now or later?
        </DialogDescription>
        <DialogFooter className="flex justify-end space-x-2">
          <button
            onClick={dismissPrompt}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
            disabled={true}
          >
            Later
          </button>
          <button
            onClick={confirmSync}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            Sync Now
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
