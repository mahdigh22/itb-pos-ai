"use client";

import { useState } from 'react';
import { categories, menuItems as initialMenuItems } from '@/lib/data';
import type { OrderItem, MenuItem } from '@/lib/types';
import MenuDisplay from '@/components/pos/menu-display';
import OrderSummary from '@/components/pos/order-summary';
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function Home() {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const { toast } = useToast()
  const [isCheckoutAlertOpen, setCheckoutAlertOpen] = useState(false);

  const handleAddItem = (item: MenuItem) => {
    setOrder((prevOrder) => {
      const existingItem = prevOrder.find((orderItem) => orderItem.id === item.id);
      if (existingItem) {
        return prevOrder.map((orderItem) =>
          orderItem.id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
        );
      }
      return [...prevOrder, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    setOrder((prevOrder) =>
      prevOrder.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrder((prevOrder) => prevOrder.filter((item) => item.id !== itemId));
  };

  const handleNewCheck = () => {
    setOrder([]);
    toast({
      title: `New Check`,
      description: "Current order cleared.",
    })
  };

  const handleCheckout = () => {
    setCheckoutAlertOpen(true);
  };

  const confirmCheckout = () => {
    console.log('Checkout confirmed:', order);
    setOrder([]);
    toast({
        title: "Checkout Successful!",
        description: "Your payment has been processed.",
    });
    setCheckoutAlertOpen(false);
  }

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <MenuDisplay categories={categories} menuItems={initialMenuItems} onAddItem={handleAddItem} />
        </div>
        <div className="lg:col-span-1">
          <OrderSummary
            order={order}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onNewCheck={handleNewCheck}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
      <AlertDialog open={isCheckoutAlertOpen} onOpenChange={setCheckoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Confirm Checkout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to proceed with the payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCheckout}>Confirm Payment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
