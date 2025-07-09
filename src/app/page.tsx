
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCategories, getMenuItems } from '@/app/admin/menu/actions';
import { getUsers } from '@/app/admin/users/actions';
import { getChecks, addCheck, updateCheck, deleteCheck, getOrders, addOrder, deleteOrder, updateOrderStatus, sendNewItemsToKitchen } from '@/app/pos/actions';
import type { OrderItem, MenuItem, ActiveOrder, Check, Member, Category, OrderType } from '@/lib/types';
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
  const [isCloseCheckAlertOpen, setCloseCheckAlertOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<OrderItem | null>(null);

  const [checks, setChecks] = useState<Check[]>([]);
  const [activeCheckId, setActiveCheckId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const activeCheck = useMemo(() => checks.find(c => c.id === activeCheckId), [checks, activeCheckId]);
  
  useEffect(() => {
    const isLoggedIn = typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') : null;
    if (isLoggedIn !== 'true') {
      router.replace('/login');
    } else {
      const fetchInitialData = async () => {
        setIsLoading(true);
        const [
          fetchedMembers, 
          fetchedMenuItems, 
          fetchedCategories, 
          fetchedChecks, 
          fetchedOrders
        ] = await Promise.all([
            getUsers(),
            getMenuItems(),
            getCategories(),
            getChecks(),
            getOrders()
        ]);
        setMembers(fetchedMembers);
        setMenuItems(fetchedMenuItems);
        setCategories(fetchedCategories);
        setChecks(fetchedChecks);
        setActiveOrders(fetchedOrders);
        
        if (fetchedChecks.length === 0) {
            const newCheckData: Omit<Check, 'id'> = { name: 'Check 1', items: [] };
            const newCheck = await addCheck(newCheckData);
            setChecks([newCheck]);
            setActiveCheckId(newCheck.id);
        } else {
            setActiveCheckId(fetchedChecks[0].id);
        }

        setIsLoading(false);
      }
      fetchInitialData();
    }
  }, [router]);

  const updateActiveCheck = async (updates: Partial<Omit<Check, 'id'>>) => {
    if (!activeCheckId) return;
    
    // Optimistically update the UI
    setChecks(prevChecks => 
      prevChecks.map(c => 
        c.id === activeCheckId ? { ...c, ...updates } : c
      )
    );
    
    await updateCheck(activeCheckId, updates);
  };


  const handleAddItem = (item: MenuItem) => {
    const order = activeCheck?.items ?? [];
    let newItems: OrderItem[];
    const existingNewItem = order.find(
      (orderItem) => orderItem.id === item.id && !orderItem.customizations && orderItem.status === 'new'
    );

    if (existingNewItem) {
      newItems = order.map((orderItem) =>
        orderItem.lineItemId === existingNewItem.lineItemId
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      );
    } else {
      const newOrderItem: OrderItem = { ...item, quantity: 1, lineItemId: `${item.id}-${Date.now()}`, status: 'new' };
      newItems = [...order, newOrderItem];
    }

    updateActiveCheck({ items: newItems });
  };

  const handleUpdateQuantity = (lineItemId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(lineItemId);
      return;
    }
    const newItems = (activeCheck?.items ?? []).map((item) => (item.lineItemId === lineItemId ? { ...item, quantity, status: 'new' } : item))
    updateActiveCheck({ items: newItems });
  };

  const handleRemoveItem = (lineItemId: string) => {
    const newItems = (activeCheck?.items ?? []).filter((item) => item.lineItemId !== lineItemId);
    updateActiveCheck({ items: newItems });
  };
  
  const handleStartCustomization = (itemToCustomize: OrderItem) => {
    const order = activeCheck?.items ?? [];
    if (itemToCustomize.quantity > 1) {
      const otherItems = order.filter(i => i.lineItemId !== itemToCustomize.lineItemId);
      const originalItem = { ...itemToCustomize, quantity: itemToCustomize.quantity - 1 };
      const newItemToCustomize = { ...itemToCustomize, quantity: 1, lineItemId: `${itemToCustomize.id}-${Date.now()}`, status: 'new' as const };
      setCustomizingItem(newItemToCustomize);
      updateActiveCheck({ items: [...otherItems, originalItem, newItemToCustomize] });
    } else {
      setCustomizingItem(itemToCustomize);
    }
  };

  const handleUpdateCustomization = (
    lineItemId: string, 
    customizations: { added: string[], removed: string[] }
  ) => {
    const newItems = (activeCheck?.items ?? []).map(item => 
        item.lineItemId === lineItemId ? { ...item, customizations, status: 'new' as const } : item
      );
    updateActiveCheck({ items: newItems });
    setCustomizingItem(null);
  };

  const handleNewCheck = async () => {
    const newCheckName = `Check ${checks.length + 1}`;
    const newCheckData: Omit<Check, 'id'> = { name: newCheckName, items: [] };
    const newCheck = await addCheck(newCheckData);
    
    setChecks(prevChecks => [...prevChecks, newCheck]);
    setActiveCheckId(newCheck.id);

    toast({
        title: "New Check Started",
        description: `Switched to ${newCheck.name}.`,
    });
  };

  const handleSwitchCheck = (checkId: string) => {
    setActiveCheckId(checkId);
  }

  const handleSendToKitchen = async () => {
    if (!activeCheckId || !activeCheck) return;
    if (activeCheck.orderType === 'Take Away') {
        await handleFinalizeAndPay();
        return;
    }

    // Optimistically update UI
    setChecks(prevChecks => prevChecks.map(c => {
        if (c.id !== activeCheckId) return c;
        const updatedItems = c.items.map(i => i.status === 'new' ? { ...i, status: 'sent' as const } : i);
        return { ...c, items: updatedItems };
    }));

    const result = await sendNewItemsToKitchen(activeCheckId);

    if (result.success) {
        toast({
            title: "Items Sent!",
            description: `New items for ${activeCheck.name} sent to the kitchen.`,
        });
        const newOrders = await getOrders();
        setActiveOrders(newOrders);
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error || 'Could not send items to kitchen.',
        });
        // Revert optimistic update on failure - refetch from server
        const updatedChecks = await getChecks();
        setChecks(updatedChecks);
    }
  };

  const handleFinalizeAndPay = async () => {
    if (!activeCheck || !activeCheckId || activeCheck.items.length === 0 || !activeCheck.orderType) return;

    const subtotal = activeCheck.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.08; // TODO: Get from settings
    const total = subtotal + tax;
    const totalPreparationTime = activeCheck.items.reduce((acc, item) => acc + (item.preparationTime || 5) * item.quantity, 0);

    const newOrderData: Omit<ActiveOrder, 'id' | 'createdAt'> & { createdAt: Date } = {
      items: [...activeCheck.items],
      status: 'Preparing',
      total: total,
      createdAt: new Date(),
      checkName: activeCheck.name,
      totalPreparationTime,
      orderType: activeCheck.orderType,
      tableNumber: activeCheck.tableNumber,
      customerName: activeCheck.customerName,
    };

    await addOrder(newOrderData);
    await deleteCheck(activeCheckId);
    
    // Refetch orders and update checks state
    const newOrders = await getOrders();
    setActiveOrders(newOrders);
    
    const remainingChecks = checks.filter(c => c.id !== activeCheckId);
    setChecks(remainingChecks);

    if (remainingChecks.length > 0) {
        setActiveCheckId(remainingChecks[0].id);
    } else {
        const newCheckData: Omit<Check, 'id'> = { name: 'Check 1', items: [] };
        const newCheck = await addCheck(newCheckData);
        setChecks([newCheck]);
        setActiveCheckId(newCheck.id);
    }

    toast({
        title: "Order Sent & Closed!",
        description: `${activeCheck.name} sent and check is closed.`,
    });
    setCloseCheckAlertOpen(false);
  }

  const handleCloseCheck = () => {
    if (!activeCheck?.orderType) {
        toast({
            variant: "destructive",
            title: "Order Type Required",
            description: "Please select Dine In or Take Away before closing the check.",
        });
        return;
    }
     setCloseCheckAlertOpen(true);
  }

  const handleCompleteOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'Completed');
    setActiveOrders(prev => prev.map(o => o.id === orderId ? {...o, status: 'Completed'} : o));
    toast({
        title: "Order Completed",
        description: "The order has been marked as complete.",
    });
  }

  const handleClearOrder = async (orderId: string) => {
    await deleteOrder(orderId);
    setActiveOrders(prev => prev.filter(o => o.id !== orderId));
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
              <MenuDisplay categories={categories} menuItems={menuItems} onAddItem={handleAddItem} />
            </div>
            <div className="lg:col-span-2 xl:col-span-1 h-full">
              <OrderSummary
                activeCheck={activeCheck}
                checks={checks}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onNewCheck={handleNewCheck}
                onSendToKitchen={handleSendToKitchen}
                onCloseCheck={handleCloseCheck}
                onCustomizeItem={handleStartCustomization}
                onSwitchCheck={handleSwitchCheck}
                onUpdateDetails={updateActiveCheck}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="progress" className="flex-grow min-h-0 h-full mt-0">
          <OrderProgress orders={activeOrders} onCompleteOrder={handleCompleteOrder} onClearOrder={handleClearOrder} />
        </TabsContent>

        <TabsContent value="members" className="h-full mt-0">
          <MembersList members={members} />
        </TabsContent>
      </div>


      <AlertDialog open={isCloseCheckAlertOpen} onOpenChange={setCloseCheckAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Confirm Close & Pay</AlertDialogTitle>
            <AlertDialogDescription>
                This will finalize the entire check, send it as one order, and close it. This action is for final payment. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizeAndPay}>Yes, Close & Pay</AlertDialogAction>
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
