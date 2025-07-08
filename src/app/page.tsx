
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { categories, menuItems as initialMenuItems } from '@/lib/data';
import { getUsers } from '@/app/admin/users/actions';
import type { OrderItem, MenuItem, ActiveOrder, OrderStatus, Check, Member } from '@/lib/types';
import MenuDisplay from '@/components/pos/menu-display';
import OrderSummary from '@/components/pos/order-summary';
import MembersList from '@/components/members/members-list';
import OrderProgress from '@/components/pos/order-progress';
import CustomizeItemDialog from '@/components/pos/customize-item-dialog';
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
import { LayoutDashboard, Users, Loader2, ClipboardList, LogOut, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import ItbIcon from '@/components/itb-icon';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const { toast } = useToast()
  const [isCheckoutAlertOpen, setCheckoutAlertOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<OrderItem | null>(null);

  const [checks, setChecks] = useState<Check[]>([]);
  const [activeCheckId, setActiveCheckId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const activeCheck = useMemo(() => checks.find(c => c.id === activeCheckId), [checks, activeCheckId]);
  const order = useMemo(() => activeCheck?.items ?? [], [activeCheck]);

  useEffect(() => {
    const isLoggedIn = typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') : null;
    if (isLoggedIn !== 'true') {
      router.replace('/login');
    } else {
      // Fetch live data
      const fetchInitialData = async () => {
        const fetchedMembers = await getUsers();
        setMembers(fetchedMembers);

        // Set sample data here, as this only runs on the client
        if (checks.length === 0 && activeOrders.length === 0) {
          const sampleItem1 = initialMenuItems.find(item => item.id === 'app-1');
          const sampleItem2 = initialMenuItems.find(item => item.id === 'main-2');
          
          let initialItems: OrderItem[] = [];
          if (sampleItem1 && sampleItem2) {
            initialItems = [
              { ...sampleItem1, quantity: 2, lineItemId: `app-1-${Date.now()}` },
              { ...sampleItem2, quantity: 1, lineItemId: `main-2-${Date.now()+1}`, customizations: { added: ['Bacon'], removed: ['Onion'] } },
            ];
          }
          
          const initialCheckId = `check-${Date.now()}`;
          setChecks([{ id: initialCheckId, name: 'Check 1', items: initialItems }]);
          setActiveCheckId(initialCheckId);
          
          const sampleActiveItem1 = initialMenuItems.find(item => item.id === 'main-1');
          const sampleActiveItem2 = initialMenuItems.find(item => item.id === 'drink-1');
          const sampleActiveItem3 = initialMenuItems.find(item => item.id === 'app-3');
          const orders: ActiveOrder[] = [];
          if (sampleActiveItem1 && sampleActiveItem2) {
              const subtotal = sampleActiveItem1.price * 1 + sampleActiveItem2.price * 2;
              const tax = subtotal * 0.08;
              orders.push({
                  id: `order-${Math.floor(Date.now() / 1000) - 300}`,
                  checkName: 'Table 5',
                  items: [
                      { ...sampleActiveItem1, quantity: 1, lineItemId: `main-1-${Date.now()+2}` },
                      { ...sampleActiveItem2, quantity: 2, lineItemId: `drink-1-${Date.now()+3}` },
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
                  checkName: 'Bar Seat 2',
                  items: [{ ...sampleActiveItem3, quantity: 1, lineItemId: `app-3-${Date.now()+4}` }],
                  status: 'Preparing',
                  total: subtotal + tax,
                  createdAt: new Date(Date.now() - 120000), // 2 minutes ago
              });
          }
          setActiveOrders(orders);
        }
        setIsLoading(false);
      }
      fetchInitialData();
    }
  }, [router, checks.length, activeOrders.length]);

  const updateActiveCheckItems = (updater: (prevItems: OrderItem[]) => OrderItem[]) => {
    setChecks(prevChecks => 
      prevChecks.map(c => 
        c.id === activeCheckId ? { ...c, items: updater(c.items) } : c
      )
    );
  };

  const handleAddItem = (item: MenuItem) => {
    updateActiveCheckItems((prevOrder) => {
      const existingItem = prevOrder.find(
        (orderItem) => orderItem.id === item.id && !orderItem.customizations
      );

      if (existingItem) {
        return prevOrder.map((orderItem) =>
          orderItem.lineItemId === existingItem.lineItemId
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      }
      
      const newOrderItem: OrderItem = { ...item, quantity: 1, lineItemId: `${item.id}-${Date.now()}` };
      return [...prevOrder, newOrderItem];
    });
  };

  const handleUpdateQuantity = (lineItemId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(lineItemId);
      return;
    }
    updateActiveCheckItems(prevOrder =>
      prevOrder.map((item) => (item.lineItemId === lineItemId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (lineItemId: string) => {
    updateActiveCheckItems(prevOrder => prevOrder.filter((item) => item.lineItemId !== lineItemId));
  };
  
  const handleStartCustomization = (itemToCustomize: OrderItem) => {
    if (itemToCustomize.quantity > 1) {
      updateActiveCheckItems(prev => {
        const otherItems = prev.filter(i => i.lineItemId !== itemToCustomize.lineItemId);
        const originalItem = { ...itemToCustomize, quantity: itemToCustomize.quantity - 1 };
        const newItemToCustomize = { ...itemToCustomize, quantity: 1, lineItemId: `${itemToCustomize.id}-${Date.now()}` };
        setCustomizingItem(newItemToCustomize);
        return [...otherItems, originalItem, newItemToCustomize];
      });
    } else {
      setCustomizingItem(itemToCustomize);
    }
  };

  const handleUpdateCustomization = (
    lineItemId: string, 
    customizations: { added: string[], removed: string[] }
  ) => {
    updateActiveCheckItems(prev => 
      prev.map(item => 
        item.lineItemId === lineItemId ? { ...item, customizations } : item
      )
    );
    setCustomizingItem(null);
  };

  const handleNewCheck = () => {
    const newCheckName = `Check ${checks.length + 1}`;
    const newCheckId = `check-${Date.now()}`;
    const newCheck: Check = { id: newCheckId, name: newCheckName, items: [] };
    
    setChecks(prevChecks => [...prevChecks, newCheck]);
    setActiveCheckId(newCheckId);

    toast({
        title: "New Check Started",
        description: `Switched to ${newCheckName}.`,
    });
  };

  const handleSwitchCheck = (checkId: string) => {
    setActiveCheckId(checkId);
  }

  const handleCheckout = () => {
    if (order.length > 0) {
      setCheckoutAlertOpen(true);
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Checkout",
        description: "The active check is empty.",
      });
    }
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
    if (!activeCheck || order.length === 0) return;
    const subtotal = order.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const newOrder: ActiveOrder = {
      id: `order-${Date.now()}`,
      items: [...order],
      status: 'Preparing',
      total: total,
      createdAt: new Date(),
      checkName: activeCheck.name,
    };

    setActiveOrders(prev => [newOrder, ...prev]);

    setTimeout(() => {
      handleUpdateOrderStatus(newOrder.id, 'Ready');
    }, 15000);

    setTimeout(() => {
      handleUpdateOrderStatus(newOrder.id, 'Completed');
    }, 30000);

    setChecks(prevChecks => {
        const remainingChecks = prevChecks.filter(c => c.id !== activeCheckId);
        if (remainingChecks.length === 0) {
            const newCheckId = `check-${Date.now()}`;
            const newCheck: Check = { id: newCheckId, name: 'Check 1', items: [] };
            setActiveCheckId(newCheckId);
            return [newCheck];
        } else {
            setActiveCheckId(remainingChecks[0].id);
            return remainingChecks;
        }
    });

    toast({
        title: "Order Sent!",
        description: `${activeCheck.name} is being prepared.`,
    });
    setCheckoutAlertOpen(false);
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <Tabs defaultValue="pos" className="w-full h-full flex flex-col">
       <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 text-lg font-headline font-semibold">
                <ItbIcon className="h-8 w-8" />
                <span className="text-xl text-primary font-bold">ITB Members</span>
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

              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin" aria-label="Admin Portal">
                        <Settings className="h-5 w-5" />
                    </Link>
                </Button>
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log Out">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

      <div className="flex-grow min-h-0 container mx-auto p-4 md:p-8">
        <TabsContent value="pos" className="flex-grow min-h-0 h-full mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-3 xl:col-span-2 h-full flex flex-col">
              <MenuDisplay categories={categories} menuItems={initialMenuItems} onAddItem={handleAddItem} />
            </div>
            <div className="lg:col-span-2 xl:col-span-1 h-full">
              <OrderSummary
                order={order}
                checks={checks}
                activeCheckId={activeCheckId}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onNewCheck={handleNewCheck}
                onCheckout={handleCheckout}
                onCustomizeItem={handleStartCustomization}
                onSwitchCheck={handleSwitchCheck}
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
              Are you sure you want to send this check to the kitchen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCheckout}>Confirm & Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Tabs>
    <CustomizeItemDialog 
        item={customizingItem}
        onClose={() => setCustomizingItem(null)}
        onSave={handleUpdateCustomization}
    />
    </>
  );
}
