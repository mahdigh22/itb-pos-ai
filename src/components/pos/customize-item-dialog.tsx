
'use client';

import { useState, useEffect } from 'react';
import type { OrderItem, Extra } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

interface CustomizeItemDialogProps {
  item: OrderItem | null;
  availableExtras: Extra[];
  onSave: (lineItemId: string, customizations: { added: Extra[], removed: string[] }) => void;
  onClose: () => void;
}

export default function CustomizeItemDialog({ item, availableExtras, onSave, onClose }: CustomizeItemDialogProps) {
  const t = useTranslations('CustomizeItemDialog');
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<Extra[]>([]);
  
  const optionalIngredients = item?.ingredients?.filter(i => i.isOptional) ?? [];

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

  const handleIngredientToggle = (ingredientName: string) => {
    setRemoved(prev => 
        prev.includes(ingredientName) 
        ? prev.filter(i => i !== ingredientName) 
        : [...prev, ingredientName]
    );
  };
  
  const handleExtraToggle = (extra: Extra) => {
    setAdded(prev => 
        prev.some(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
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
          <DialogTitle className="font-headline">{t('title', {itemName: item.name})}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
            {optionalIngredients.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-semibold">{t('optionalIngredients')}</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {optionalIngredients.map(ingredient => (
                            <div key={ingredient.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`ingredient-${ingredient.id}`} 
                                    checked={!removed.includes(ingredient.name)}
                                    onCheckedChange={() => handleIngredientToggle(ingredient.name)}
                                />
                                <Label htmlFor={`ingredient-${ingredient.id}`} className="capitalize cursor-pointer">{ingredient.name}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
             {optionalIngredients.length > 0 && <Separator />}
            <div className="space-y-3">
                <h4 className="font-semibold">{t('addExtras')}</h4>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {availableExtras.map(extra => (
                       <div key={extra.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`extra-${extra.id}`} 
                                checked={added.some(e => e.id === extra.id)}
                                onCheckedChange={() => handleExtraToggle(extra)}
                            />
                            <Label htmlFor={`extra-${extra.id}`} className="cursor-pointer">
                                {extra.name}
                                {extra.price > 0 && (
                                    <span className="text-muted-foreground ltr:ml-1.5 rtl:mr-1.5">
                                        (+${extra.price.toFixed(2)})
                                    </span>
                                )}
                            </Label>
                       </div>
                    ))}
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button type="button" onClick={handleSave}>{t('saveChanges')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
