"use client";

import { useState } from 'react';
import { categories, menuItems as initialMenuItems, members } from '@/lib/data';
import type { OrderItem, MenuItem } from '@/lib/types';
import MenuDisplay from '@/components/pos/menu-display';
import OrderSummary from '@/components/pos/order-summary';
import MembersList from '@/components/members/members-list';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Users } from 'lucide-react';

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
    <Tabs defaultValue="pos" className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
        <TabsList>
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Point of Sale
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="pos">
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
      </TabsContent>

      <TabsContent value="members">
        <MembersList members={members} />
      </TabsContent>

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
    </Tabs>
  );
}
