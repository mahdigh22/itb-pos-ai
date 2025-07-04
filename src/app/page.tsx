"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { LayoutDashboard, Users, Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const { toast } = useToast()
  const [isCheckoutAlertOpen, setCheckoutAlertOpen] = useState(false);

  useEffect(() => {
    const isLoggedIn = typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') : null;
    if (isLoggedIn !== 'true') {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="pos" className="w-full h-full flex flex-col">
      <div className="flex flex-col items-center mb-4">
        <h1 className="text-3xl font-headline font-bold mb-4">Dashboard</h1>
        <TabsList className="grid w-full max-w-lg grid-cols-2 bg-muted p-1 rounded-full">
          <TabsTrigger value="pos" className="h-12 text-base gap-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
            Point of Sale
          </TabsTrigger>
          <TabsTrigger value="members" className="h-12 text-base gap-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-5 w-5" />
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
