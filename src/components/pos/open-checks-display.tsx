

'use client';

import type { Check, PriceList } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Package, Users, Hash, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OpenChecksDisplayProps {
  checks: Check[];
  activeCheckId: string | null;
  onSelectCheck: (checkId: string) => void;
  priceLists: PriceList[];
  taxRate: number;
  restaurantId: string;
}

function calculateTotal(check: Check, priceLists: PriceList[], taxRate: number) {
    if (!check) return { total: 0 };
    
    const subtotal = check.items.reduce((acc, item) => {
        const extrasPrice = item.customizations?.added.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
        const totalItemPrice = (item.price + extrasPrice) * item.quantity;
        return acc + totalItemPrice;
    }, 0);
    
    const selectedPriceList = priceLists.find(pl => pl.id === check.priceListId);
    const discountPercentage = selectedPriceList?.discount || 0;
    const discountAmount = subtotal * (discountPercentage / 100);
    const discountedSubtotal = subtotal - discountAmount;
    const tax = discountedSubtotal * (taxRate / 100);
    const total = discountedSubtotal + tax;

    return { total };
}


export default function OpenChecksDisplay({ checks: initialChecks, activeCheckId, onSelectCheck, priceLists, taxRate, restaurantId }: OpenChecksDisplayProps) {
  const [checks, setChecks] = useState<Check[]>(initialChecks);

  useEffect(() => {
    if (!restaurantId) return;
    const q = query(collection(db, "restaurants", restaurantId, "checks"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveChecks: Check[] = [];
        snapshot.forEach(doc => liveChecks.push({id: doc.id, ...doc.data()} as Check));
        setChecks(liveChecks.sort((a,b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, [restaurantId]);


  if (checks.length === 0) {
    return (
        <Card className="h-full flex flex-col items-center justify-center">
            <div className="text-center text-muted-foreground flex-grow flex flex-col justify-center items-center h-full">
                <Package className="w-16 h-16 mb-4" />
                <p className="font-semibold text-lg">No Open Checks</p>
                <p className="text-sm">Create a new check in the Point of Sale tab.</p>
            </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
        <CardHeader>
            <CardTitle className="font-headline">Open Checks</CardTitle>
            <CardDescription>Select a check to view or add items.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow min-h-0">
            <ScrollArea className="h-full pr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {checks.map((check) => {
                    const isActive = check.id === activeCheckId;
                    const { total } = calculateTotal(check, priceLists, taxRate);
                    const isTakeAway = check.orderType === 'Take Away';
                    const Icon = isTakeAway ? ShoppingBag : UtensilsCrossed;

                    return (
                        <Card
                            key={check.id}
                            onClick={() => onSelectCheck(check.id)}
                            className={cn(
                                'cursor-pointer transition-all hover:shadow-lg',
                                isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:border-primary/50',
                                isTakeAway ? 'bg-secondary' : 'bg-card'
                            )}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                    {check.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground space-y-1">
                               {check.orderType === 'Dine In' && check.tableName && (
                                   <div className="flex items-center gap-2">
                                       <Hash className="h-4 w-4" />
                                       <span>{check.tableName}</span>
                                   </div>
                               )}
                               {check.orderType === 'Take Away' && check.customerName && (
                                     <div className="flex items-center gap-2">
                                       <Users className="h-4 w-4" />
                                       <span>{check.customerName}</span>
                                   </div>
                               )}
                                <div>
                                    <span>{check.items.length} {check.items.length === 1 ? 'item' : 'items'}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <p className="text-lg font-bold text-primary w-full text-right">${total.toFixed(2)}</p>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
