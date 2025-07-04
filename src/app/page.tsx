
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { Cpu, LayoutDashboard, Users, Loader2, ClipboardList } from 'lucide-react';

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
      // Set sample data here, as this only runs on the client
      if (order.length === 0 && activeOrders.length === 0) {
        const sampleItem1 = initialMenuItems.find(item => item.id === 'app-1');
        const sampleItem2 = initialMenuItems.find(item => item.id === 'main-2');
        if (sampleItem1 && sampleItem2) {
          setOrder([
            { ...sampleItem1, quantity: 2 },
            { ...sampleItem2, quantity: 1 },
          ]);
        }
        
        const sampleActiveItem1 = initialMenuItems.find(item => item.id === 'main-1');
        const sampleActiveItem2 = initialMenuItems.find(item => item.id === 'drink-1');
        const sampleActiveItem3 = initialMenuItems.find(item => item.id === 'app-3');
        const orders: ActiveOrder[] = [];
        if (sampleActiveItem1 && sampleActiveItem2) {
            const subtotal = sampleActiveItem1.price * 1 + sampleActiveItem2.price * 2;
            const tax = subtotal * 0.08;
            orders.push({
                id: `order-${Math.floor(Date.now() / 1000) - 300}`,
                items: [
                    { ...sampleActiveItem1, quantity: 1 },
                    { ...sampleActiveItem2, quantity: 2 },
                ],
                status: 'Ready',
                total: subtotal + tax,
                createdAt: new Date(Date.now() - 300000), // 5 minutes ago
            });
        }
        if (sampleActiveItem3) {
            const subtotal = sampleActiveItem3.price * 1;
            const tax = subtotal * 0.08;
            orders.push({
                id: `order-${Math.floor(Date.now() / 1000) - 120}`,
                items: [{ ...sampleActiveItem3, quantity: 1 }],
                status: 'Preparing',
                total: subtotal + tax,
                createdAt: new Date(Date.now() - 120000), // 2 minutes ago
            });
        }
        setActiveOrders(orders);
      }
      setIsLoading(false);
    }
  }, [router, order.length, activeOrders.length]);

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
       <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 text-lg font-headline font-semibold text-primary">
                <Cpu className="h-6 w-6" />
                <span>POSitive</span>
              </Link>
              
              <TabsList className="inline-grid h-12 w-full max-w-lg grid-cols-3 bg-muted p-1 rounded-lg">
                <TabsTrigger value="pos" className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <LayoutDashboard className="h-5 w-5" />
                  Point of Sale
                </TabsTrigger>
                <TabsTrigger value="progress" className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <ClipboardList className="h-5 w-5" />
                  Order Progress
                </TabsTrigger>
                <TabsTrigger value="members" className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <Users className="h-5 w-5" />
                  Members
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 text-lg invisible" aria-hidden="true">
                <Cpu className="h-6 w-6" />
                <span>POSitive</span>
              </div>
            </div>
          </div>
        </header>

      <div className="flex-grow min-h-0 container mx-auto p-4 md:p-8">
        <TabsContent value="pos" className="flex-grow min-h-0 h-full mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-2 h-full flex flex-col">
              <MenuDisplay categories={categories} menuItems={initialMenuItems} onAddItem={handleAddItem} />
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
        
        <TabsContent value="progress" className="flex-grow min-h-0 h-full mt-0">
          <OrderProgress orders={activeOrders} onClearOrder={handleClearOrder} />
        </TabsContent>

        <TabsContent value="members" className="h-full mt-0">
          <MembersList members={members} />
        </TabsContent>
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
    </Tabs>
  );
}
