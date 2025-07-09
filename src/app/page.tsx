
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCategories, getMenuItems } from '@/app/admin/menu/actions';
import { getExtras } from '@/app/admin/extras/actions';
import { getUsers } from '@/app/admin/users/actions';
import { getSettings } from '@/app/admin/settings/actions';
import { getTables } from '@/app/admin/tables/actions';
import { getChecks, addCheck, updateCheck, deleteCheck, getOrders, addOrder, deleteOrder, updateOrderStatus, sendNewItemsToKitchen } from '@/app/pos/actions';
import type { OrderItem, MenuItem, ActiveOrder, Check, Member, Category, OrderType, Extra, PriceList, RestaurantTable } from '@/lib/types';
import MenuDisplay from '@/components/pos/menu-display';
import OrderSummary from '@/components/pos/order-summary';
import MembersList from '@/components/members/members-list';
import OrderProgress from '@/components/pos/order-progress';
import CustomizeItemDialog from '@/components/pos/customize-item-dialog';
import OpenChecksDisplay from '@/components/pos/open-checks-display';
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
import { LayoutDashboard, Users, Loader2, ClipboardList, LogOut, Settings, ClipboardCheck } from 'lucide-react';
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
  const [availableExtras, setAvailableExtras] = useState<Extra[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [settings, setSettings] = useState<{ taxRate: number; priceLists: PriceList[]; activePriceListId?: string; } | null>(null);

  const [activeTab, setActiveTab] = useState("pos");

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
          fetchedOrders,
          fetchedExtras,
          fetchedSettings,
          fetchedTables,
        ] = await Promise.all([
            getUsers(),
            getMenuItems(),
            getCategories(),
            getChecks(),
            getOrders(),
            getExtras(),
            getSettings(),
            getTables(),
        ]);
        setMembers(fetchedMembers);
        setMenuItems(fetchedMenuItems);
        setCategories(fetchedCategories);
        setChecks(fetchedChecks);
        setActiveOrders(fetchedOrders);
        setAvailableExtras(fetchedExtras);
        setSettings(fetchedSettings);
        setTables(fetchedTables);
        
        if (fetchedChecks.length === 0) {
            const newCheckData: Omit<Check, 'id'> = { 
              name: 'Check 1', 
              items: [],
              priceListId: fetchedSettings.activePriceListId,
            };
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

  const updateActiveCheckDetails = async (updates: Partial<Omit<Check, 'id'>>) => {
    if (!activeCheckId) return;
    
    // Optimistically update the UI
    setChecks(prevChecks => 
      prevChecks.map(c => 
        c.id === activeCheckId ? { ...c, ...updates } : c
      )
    );
    
    await updateCheck(activeCheckId, updates);
  };

  const handleTableSelect = async (tableId: string) => {
    if (!activeCheckId) return;

    const selectedTable = tables.find(t => t.id === tableId);
    if (selectedTable) {
        updateActiveCheckDetails({ tableId: selectedTable.id, tableName: selectedTable.name });
    }
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

    updateActiveCheckDetails({ items: newItems });
  };

  const handleUpdateQuantity = (lineItemId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(lineItemId);
      return;
    }
    const newItems = (activeCheck?.items ?? []).map((item) => (item.lineItemId === lineItemId ? { ...item, quantity, status: 'new' } : item))
    updateActiveCheckDetails({ items: newItems });
  };

  const handleRemoveItem = (lineItemId: string) => {
    const newItems = (activeCheck?.items ?? []).filter((item) => item.lineItemId !== lineItemId);
    updateActiveCheckDetails({ items: newItems });
  };
  
  const handleClearCheck = () => {
    updateActiveCheckDetails({ items: [] });
  };
  
  const handleStartCustomization = (itemToCustomize: OrderItem) => {
    const order = activeCheck?.items ?? [];
    if (itemToCustomize.quantity > 1) {
      const otherItems = order.filter(i => i.lineItemId !== itemToCustomize.lineItemId);
      const originalItem = { ...itemToCustomize, quantity: itemToCustomize.quantity - 1 };
      const newItemToCustomize = { ...itemToCustomize, quantity: 1, lineItemId: `${itemToCustomize.id}-${Date.now()}`, status: 'new' as const };
      setCustomizingItem(newItemToCustomize);
      updateActiveCheckDetails({ items: [...otherItems, originalItem, newItemToCustomize] });
    } else {
      setCustomizingItem(itemToCustomize);
    }
  };

  const handleUpdateCustomization = (
    lineItemId: string, 
    customizations: { added: Extra[], removed: string[] }
  ) => {
    const newItems = (activeCheck?.items ?? []).map(item => 
        item.lineItemId === lineItemId ? { ...item, customizations, status: 'new' as const } : item
      );
    updateActiveCheckDetails({ items: newItems });
    setCustomizingItem(null);
  };

  const handleNewCheck = async () => {
    const newCheckName = `Check ${checks.length + 1}`;
    const newCheckData: Omit<Check, 'id'> = { 
      name: newCheckName, 
      items: [],
      priceListId: settings?.activePriceListId,
    };
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

  const handleSelectCheckAndSwitchTab = (checkId: string) => {
    setActiveCheckId(checkId);
    setActiveTab("pos");
  };

  const handleSendToKitchen = async () => {
    if (!activeCheckId || !activeCheck) return;

    if (activeCheck.orderType === 'Take Away') {
      await handleFinalizeAndPay();
      return;
    }

    // This logic is now only for "Dine In" orders
    const originalCheckId = activeCheckId;
    const originalCheckName = activeCheck.name;

    const result = await sendNewItemsToKitchen(originalCheckId);

    if (result.success) {
      toast({
        title: "Items Sent!",
        description: `New items for ${originalCheckName} sent to the kitchen.`,
      });

      // After sending, immediately create a new check.
      const newCheckName = `Check ${checks.length + 1}`;
      const newCheckData: Omit<Check, 'id'> = {
        name: newCheckName,
        items: [],
        priceListId: settings?.activePriceListId,
      };
      const newCheck = await addCheck(newCheckData);

      // Fetch the updated list of checks and orders
      const [updatedChecks, newOrders] = await Promise.all([
        getChecks(),
        getOrders()
      ]);
      
      setChecks(updatedChecks);
      setActiveOrders(newOrders);
      setActiveCheckId(newCheck.id); // Set the new, empty check as active.

      toast({
        title: "New Check Started",
        description: `The previous check is available in 'Open Checks'.`,
      });

    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || 'Could not send items to kitchen.',
      });
      const updatedChecks = await getChecks();
      setChecks(updatedChecks);
    }
  };

  const handleFinalizeAndPay = async () => {
    if (!activeCheck || !activeCheckId || activeCheck.items.length === 0 || !activeCheck.orderType || !settings) return;

    // For Dine In, we just close the check. The individual orders are already tracked.
    if (activeCheck.orderType === 'Dine In') {
      await deleteCheck(activeCheckId);
      
      const remainingChecks = checks.filter(c => c.id !== activeCheckId);
      setChecks(remainingChecks);

      if (remainingChecks.length > 0) {
          setActiveCheckId(remainingChecks[0].id);
      } else {
          const newCheckData: Omit<Check, 'id'> = { 
            name: 'Check 1', 
            items: [],
            priceListId: settings.activePriceListId,
          };
          const newCheck = await addCheck(newCheckData);
          setChecks([newCheck]);
          setActiveCheckId(newCheck.id);
      }

      toast({
          title: "Bill Closed",
          description: `${activeCheck.name} has been paid and closed.`,
      });
      setCloseCheckAlertOpen(false);
      return;
    }

    // This logic is for Take Away / Delivery where the entire check becomes one order.
    const subtotal = activeCheck.items.reduce((acc, item) => {
      const extrasPrice = item.customizations?.added.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
      const totalItemPrice = (item.price + extrasPrice) * item.quantity;
      return acc + totalItemPrice;
    }, 0);

    const selectedPriceList = settings.priceLists.find(pl => pl.id === activeCheck.priceListId);
    const discountPercentage = selectedPriceList?.discount || 0;
    const discountAmount = subtotal * (discountPercentage / 100);
    const discountedSubtotal = subtotal - discountAmount;
    const tax = discountedSubtotal * (settings.taxRate / 100);
    const total = discountedSubtotal + tax;
    
    const totalPreparationTime = activeCheck.items.reduce((acc, item) => acc + (item.preparationTime || 5) * item.quantity, 0);

    const newOrderData: Omit<ActiveOrder, 'id' | 'createdAt'> & { createdAt: Date } = {
      items: [...activeCheck.items],
      status: 'Preparing',
      total: total,
      createdAt: new Date(),
      checkName: activeCheck.name,
      totalPreparationTime,
      orderType: activeCheck.orderType,
      tableId: activeCheck.tableId,
      tableName: activeCheck.tableName,
      customerName: activeCheck.customerName,
      priceListId: activeCheck.priceListId,
      discountApplied: discountPercentage,
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
        const newCheckData: Omit<Check, 'id'> = { 
          name: 'Check 1', 
          items: [],
          priceListId: settings.activePriceListId,
        };
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

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  const closeCheckAlertDescription = activeCheck?.orderType === 'Dine In'
      ? "This will close the bill for this table. This assumes the customer has paid. Are you sure?"
      : "This will finalize the entire check, send it as one order, and close it. This action is for final payment. Are you sure?";

  return (
    <>
    <Tabs defaultValue="pos" value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
       <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 text-lg font-headline font-semibold">
                <ItbIcon className="h-8 w-8" />
                <span className="text-xl text-primary font-bold">ITB Members</span>
              </Link>
              
              <TabsList className="inline-grid h-12 w-full max-w-2xl grid-cols-4 bg-muted p-1 rounded-lg">
                <TabsTrigger value="pos" className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <LayoutDashboard className="h-5 w-5" />
                  Point of Sale
                </TabsTrigger>
                <TabsTrigger value="checks" className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <ClipboardCheck className="h-5 w-5" />
                  Open Checks
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
                onClearCheck={handleClearCheck}
                onCustomizeItem={handleStartCustomization}
                onSwitchCheck={handleSwitchCheck}
                onUpdateCheckDetails={updateActiveCheckDetails}
                onTableSelect={handleTableSelect}
                priceLists={settings.priceLists}
                taxRate={settings.taxRate}
                tables={tables}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="checks" className="flex-grow min-h-0 h-full mt-0">
            <OpenChecksDisplay 
                checks={checks} 
                activeCheckId={activeCheckId} 
                onSelectCheck={handleSelectCheckAndSwitchTab}
                priceLists={settings.priceLists}
                taxRate={settings.taxRate}
            />
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
            <AlertDialogTitle className="font-headline">Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
                {closeCheckAlertDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizeAndPay}>Yes, Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Tabs>
    <CustomizeItemDialog 
        item={customizingItem}
        availableExtras={availableExtras}
        onClose={() => setCustomizingItem(null)}
        onSave={handleUpdateCustomization}
    />
    </>
  );
}
