
'use client';

import { useState, useEffect } from 'react';
import type { OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PlusCircle, X } from 'lucide-react';

interface CustomizeItemDialogProps {
  item: OrderItem | null;
  onSave: (lineItemId: string, customizations: { added: string[], removed: string[] }) => void;
  onClose: () => void;
}

// Some example extras. In a real app this might come from an API.
const availableExtras = ['Bacon', 'Extra Cheese', 'Avocado', 'Fried Egg'];

export default function CustomizeItemDialog({ item, onSave, onClose }: CustomizeItemDialogProps) {
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  const [customExtra, setCustomExtra] = useState('');

  useEffect(() => {
    if (item) {
      setRemoved(item.customizations?.removed || []);
      setAdded(item.customizations?.added || []);
    } else {
        // Reset when dialog is closed/item is null
        setRemoved([]);
        setAdded([]);
        setCustomExtra('');
    }
  }, [item]);

  if (!item) return null;

  const handleIngredientToggle = (ingredient: string) => {
    setRemoved(prev => 
        prev.includes(ingredient) 
        ? prev.filter(i => i !== ingredient) 
        : [...prev, ingredient]
    );
  };
  
  const handleExtraToggle = (extra: string) => {
    setAdded(prev => 
        prev.includes(extra)
        ? prev.filter(i => i !== extra)
        : [...prev, extra]
    );
  };

  const handleAddCustomExtra = () => {
    if (customExtra.trim() && !added.includes(customExtra.trim())) {
        setAdded(prev => [...prev, customExtra.trim()]);
        setCustomExtra('');
    }
  };

  const handleSave = () => {
    onSave(item.lineItemId, { added, removed });
  };

  return (
    <Dialog open={!!item} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Customize: {item.name}</DialogTitle>
          <DialogDescription>Add or remove ingredients to make it just right.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
            {item.ingredients && item.ingredients.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-semibold">Ingredients</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {item.ingredients.map(ingredient => (
                            <div key={ingredient} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`ingredient-${ingredient.replace(/\s/g, '')}`} 
                                    checked={!removed.includes(ingredient)}
                                    onCheckedChange={() => handleIngredientToggle(ingredient)}
                                />
                                <Label htmlFor={`ingredient-${ingredient.replace(/\s/g, '')}`} className="capitalize cursor-pointer">{ingredient}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
             {(item.ingredients && item.ingredients.length > 0) && <Separator />}
            <div className="space-y-3">
                <h4 className="font-semibold">Add Extras</h4>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {availableExtras.map(extra => (
                       <div key={extra} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`extra-${extra.replace(/\s/g, '')}`} 
                                checked={added.includes(extra)}
                                onCheckedChange={() => handleExtraToggle(extra)}
                            />
                            <Label htmlFor={`extra-${extra.replace(/\s/g, '')}`} className="cursor-pointer">{extra}</Label>
                       </div>
                    ))}
                </div>
                <div className="flex gap-2 pt-2">
                    <Input 
                        placeholder="Type a custom extra..." 
                        value={customExtra} 
                        onChange={(e) => setCustomExtra(e.target.value)}
                        onKeyDown={(e) => {if(e.key === 'Enter'){ e.preventDefault(); handleAddCustomExtra();}}}
                    />
                    <Button variant="outline" size="icon" onClick={handleAddCustomExtra}>
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-1 pt-2">
                    {added.filter(e => !availableExtras.includes(e)).map(extra => (
                        <Badge key={extra} variant="secondary" className="capitalize">
                            {extra}
                            <button onClick={() => handleExtraToggle(extra)} className="ml-1.5 rounded-full hover:bg-background/50">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
