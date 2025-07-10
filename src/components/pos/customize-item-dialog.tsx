"use client";

import { useState, useEffect } from "react";
import type { OrderItem, Extra, Ingredient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface CustomizeItemDialogProps {
  item: OrderItem | null;
  availableExtras: Extra[];
  onSave: (
    lineItemId: string,
    customizations: { added: Extra[]; removed: { id: string; name: string }[] }
  ) => void;
  onClose: () => void;
}

export default function CustomizeItemDialog({
  item,
  availableExtras,
  onSave,
  onClose,
}: CustomizeItemDialogProps) {
  const [removed, setRemoved] = useState<{ id: string; name: string }[]>([]);
  const [added, setAdded] = useState<Extra[]>([]);

  const optionalIngredients =
    item?.ingredients?.filter((i) => i.isOptional) ?? [];

  useEffect(() => {
    if (item) {
      setRemoved(item.customizations?.removed || []);
      setAdded(item.customizations?.added || []);
    } else {
      setRemoved([]);
      setAdded([]);
    }
  }, [item]);

  if (!item) return null;

  const handleIngredientToggle = (id: string, name: string) => {
    setRemoved((prev) =>
      prev.some((i) => i.name === name)
        ? prev.filter((i) => i.name !== name)
        : [...prev, { id, name }]
    );
  };

  const handleExtraToggle = (extra: Extra) => {
    setAdded((prev) =>
      prev.some((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const handleSave = () => {
    onSave(item.lineItemId, { added, removed });
  };

  return (
    <Dialog open={!!item} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline">
            Customize: {item.name}
          </DialogTitle>
          <DialogDescription>
            Add or remove ingredients to make it just right.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          {optionalIngredients.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Optional Ingredients</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {optionalIngredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`ingredient-${ingredient.id}`}
                      checked={!removed.some((i) => i.name === ingredient.name)}
                      onCheckedChange={() =>
                        handleIngredientToggle(ingredient.id, ingredient.name)
                      }
                    />
                    <Label
                      htmlFor={`ingredient-${ingredient.id}`}
                      className="capitalize cursor-pointer"
                    >
                      {ingredient.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {optionalIngredients.length > 0 && availableExtras.length > 0 && (
            <Separator />
          )}
          {availableExtras.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Add Extras</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {availableExtras.map((extra) => (
                  <div key={extra.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`extra-${extra.id}`}
                      checked={added.some((e) => e.id === extra.id)}
                      onCheckedChange={() => handleExtraToggle(extra)}
                    />
                    <Label
                      htmlFor={`extra-${extra.id}`}
                      className="cursor-pointer"
                    >
                      {extra.name}
                      {extra.price > 0 && (
                        <span className="text-muted-foreground ml-1.5">
                          (+${extra.price.toFixed(2)})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
