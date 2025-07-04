"use client";

import { useState } from 'react';
import { categories, menuItems as initialMenuItems, members } from '@/lib/data';
import type { OrderItem, MenuItem, ActiveOrder, OrderStatus } from '@/lib/types';
import MenuDisplay from '@/components/pos/menu-display';
import OrderSummary from '@/components/pos/order-summary';
import MembersList from '@/components/members/members-list';
import OrderProgress from '@/components/pos/order-progress';
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
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
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
  };

  const handleCheckout = () => {
    setCheckoutAlertOpen(true);
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setActiveOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const handleClearOrder = (orderId: string) => {
    setActiveOrders(prev => prev.filter(o => o.id !== orderId));
  }

  const confirmCheckout = () => {
    if (order.length === 0) return;
    const subtotal = order.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const newOrder: ActiveOrder = {
      id: `order-${Date.now()}`,
      items: [...order],
      status: 'Preparing',
      total: total,
      createdAt: new Date(),
    };

    setActiveOrders(prev => [newOrder, ...prev]);

    setTimeout(() => {
      handleUpdateOrderStatus(newOrder.id, 'Ready');
    }, 15000);

    setTimeout(() => {
      handleUpdateOrderStatus(newOrder.id, 'Completed');
    }, 30000);

    setOrder([]);
    toast({
        title: "Order Sent!",
        description: "Your order is being prepared and is now tracked below.",
    });
    setCheckoutAlertOpen(false);
  }

  return (
    <Tabs defaultValue="pos" className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
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

      <TabsContent value="pos" className="flex-grow min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          <div className="lg:col-span-2 grid grid-rows-5 gap-8 h-full">
            <div className="row-span-3 min-h-0">
              <MenuDisplay categories={categories} menuItems={initialMenuItems} onAddItem={handleAddItem} />
            </div>
            <div className="row-span-2 min-h-0">
              <OrderProgress orders={activeOrders} onClearOrder={handleClearOrder} />
            </div>
          </div>
          <div className="lg:col-span-1 h-full">
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

      <TabsContent value="members" className="h-full">
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
