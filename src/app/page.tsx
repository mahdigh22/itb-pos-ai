

"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCategories, getMenuItems as fetchMenuItems } from '@/app/admin/menu/actions';
import { getExtras } from '@/app/admin/extras/actions';
import { getUsers } from '@/app/admin/users/actions';
import { getSettings } from '@/app/admin/settings/actions';
import { getTables } from '@/app/admin/tables/actions';
import { addCheck, updateCheck, deleteCheck, sendNewItemsToKitchen, addOrder, updateOrderStatus, archiveOrder, cancelOrderItem, editOrderItem } from '@/app/pos/actions';
import type { OrderItem, MenuItem, ActiveOrder, Check, Member, Category, OrderType, Extra, PriceList, RestaurantTable, Employee } from '@/lib/types';
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
import { LayoutDashboard, Users, Loader2, ClipboardList, LogOut, LayoutGrid, ClipboardCheck, UserCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import ItbIcon from '@/components/itb-icon';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Home() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
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

  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("pos");

  const activeCheck = useMemo(() => checks.find(c => c.id === activeCheckId), [checks, activeCheckId]);
  
  useEffect(() => {
    let employeeData = null;
    try {
        const storedEmployee = localStorage.getItem('currentEmployee');
        if (storedEmployee) {
            employeeData = JSON.parse(storedEmployee);
        }
    } catch (e) {
        console.error("Failed to parse employee data from localStorage", e);
    }
    
    if (!employeeData?.id) {
      setIsLoading(false);
      router.replace('/login');
      return;
    } 
    
    if (employeeData.role === 'Chef') {
      setIsLoading(false);
      router.replace('/kitchen');
      return;
    }

    setCurrentUser(employeeData);
    const fetchInitialData = async () => {
      setIsLoading(true);
      const [
        fetchedMembers, 
        fetchedMenuItems, 
        fetchedCategories, 
        fetchedExtras,
        fetchedSettings,
        fetchedTables,
      ] = await Promise.all([
          getUsers(),
          fetchMenuItems(),
          getCategories(),
          getExtras(),
          getSettings(),
          getTables(),
      ]);
      setMembers(fetchedMembers);
      setMenuItems(fetchedMenuItems);
      setCategories(fetchedCategories);
      setAvailableExtras(fetchedExtras);
      setSettings(fetchedSettings);
      setTables(fetchedTables);

      setIsLoading(false);
    }
    fetchInitialData();
    
  }, [router]);
  
  useEffect(() => {
      if (!currentUser) return;
      
      // Listener for open checks
      const checksQuery = query(collection(db, 'checks'));
      const unsubscribeChecks = onSnapshot(checksQuery, async (querySnapshot) => {
        const liveChecks: Check[] = [];
        querySnapshot.forEach((doc) => {
          liveChecks.push({ id: doc.id, ...doc.data() } as Check);
        });
        setChecks(liveChecks.sort((a, b) => a.name.localeCompare(b.name)));

        // If no active check is set, or the active check no longer exists, set one.
        if (!activeCheckId || !liveChecks.some(c => c.id === activeCheckId)) {
            if (liveChecks.length > 0) {
                setActiveCheckId(liveChecks[0].id);
            } else if (currentUser) { // Only create a new check if there are none and user is loaded
                 const newCheckData: Omit<Check, 'id'> = { 
                    name: `Check 1`, 
                    items: [],
                    priceListId: settings?.activePriceListId,
                    employeeId: currentUser.id,
                    employeeName: currentUser.name,
                };
                const newCheck = await addCheck(newCheckData);
                // The listener will pick this up and set state, no need to do it twice.
                setActiveCheckId(newCheck.id);
            }
        }
      }, (error) => {
        console.error("Error in checks snapshot listener: ", error);
        toast({
          variant: "destructive",
          title: "Real-time Error",
          description: "Could not fetch live check updates."
        })
      });

      return () => {
        unsubscribeChecks();
      };
  }, [toast, activeCheckId, currentUser, settings]);


  const updateActiveCheckDetails = async (updates: Partial<Omit<Check, 'id'>>) => {
    if (!activeCheckId) return;
    
    // The real-time listener will handle the UI update.
    await updateCheck(activeCheckId, updates);
  };

  const handleTableSelect = async (tableId: string) => {
    if (!activeCheckId) return;

    const selectedTable = tables.find(t => t.id === tableId);
    if (selectedTable) {
        updateActiveCheckDetails({ tableId: selectedTable.id, tableName: selectedTable.name });
    }
  };


  const handleAddItem = async (item: MenuItem) => {
    if (!activeCheck) return;
    const order = activeCheck.items;
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

    await updateCheck(activeCheck.id, { items: newItems });
  };

  const handleUpdateQuantity = async (lineItemId: string, quantity: number) => {
    if (!activeCheck) return;
    if (quantity < 1) {
      await handleRemoveItem(lineItemId);
      return;
    }
    const newItems = (activeCheck.items).map((item) => (item.lineItemId === lineItemId ? { ...item, quantity, status: 'new' } : item))
    await updateCheck(activeCheck.id, { items: newItems });
  };

  const handleRemoveItem = async (lineItemId: string) => {
    if (!activeCheck) return;
    const newItems = (activeCheck.items).filter((item) => item.lineItemId !== lineItemId);
    await updateCheck(activeCheck.id, { items: newItems });
  };
  
  const handleClearCheck = async () => {
    if (!activeCheck) return;
    await updateCheck(activeCheck.id, { items: [] });
  };
  
  const handleStartCustomization = async (itemToCustomize: OrderItem) => {
    if (!activeCheck) return;
    const order = activeCheck.items;
    if (itemToCustomize.quantity > 1) {
      const otherItems = order.filter(i => i.lineItemId !== itemToCustomize.lineItemId);
      const originalItem = { ...itemToCustomize, quantity: itemToCustomize.quantity - 1 };
      const newItemToCustomize = { ...itemToCustomize, quantity: 1, lineItemId: `${itemToCustomize.id}-${Date.now()}`, status: 'new' as const };
      setCustomizingItem(newItemToCustomize);
      await updateCheck(activeCheck.id, { items: [...otherItems, originalItem, newItemToCustomize] });
    } else {
      setCustomizingItem(itemToCustomize);
    }
  };

  const handleUpdateCustomization = async (
    lineItemId: string, 
    customizations: { added: Extra[], removed: string[] }
  ) => {
    if (!activeCheck) return;
    const newItems = (activeCheck.items).map(item => 
        item.lineItemId === lineItemId ? { ...item, customizations, status: 'new' as const } : item
      );
    await updateCheck(activeCheck.id, { items: newItems });
    setCustomizingItem(null);
  };

  const handleNewCheck = async () => {
    if (!currentUser) return;
    const emptyCheck = checks.find(c => c.items.length === 0);

    if (emptyCheck) {
        setActiveCheckId(emptyCheck.id);
        toast({
            title: "Switched to Empty Check",
            description: `Now editing ${emptyCheck.name}.`,
        });
        return;
    }

    const newCheckName = `Check ${checks.length + 1}`;
    const newCheckData: Omit<Check, 'id'> = { 
      name: newCheckName, 
      items: [],
      priceListId: settings?.activePriceListId,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
    };
    const newCheck = await addCheck(newCheckData);
    
    // The listener will add the check to state, just need to switch to it.
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
    if (!activeCheckId || !activeCheck || !currentUser) return;

    if (activeCheck.orderType === 'Take Away') {
      await handleFinalizeAndPay();
      return;
    }

    const originalCheckName = activeCheck.name;

    const result = await sendNewItemsToKitchen(activeCheckId);

    if (result.success) {
      toast({
        title: "Items Sent!",
        description: `New items for ${originalCheckName} sent to the kitchen.`,
      });

      // The check listener will update the checks state automatically.
      // Now, we need to decide which check to switch to.
      const currentChecks = checks;
      const emptyCheck = currentChecks.find(c => c.items.length === 0 && c.id !== activeCheckId);

      if (emptyCheck) {
          setActiveCheckId(emptyCheck.id);
          toast({
              title: "Switched to Empty Check",
              description: "The previous check is available in 'Open Checks'.",
          });
      } else {
          const newCheckName = `Check ${currentChecks.length + 1}`;
          const newCheckData: Omit<Check, 'id'> = {
              name: newCheckName,
              items: [],
              priceListId: settings?.activePriceListId,
              employeeId: currentUser.id,
              employeeName: currentUser.name,
          };
          const newCheck = await addCheck(newCheckData);
          setActiveCheckId(newCheck.id);
          toast({
              title: "New Check Started",
              description: "The previous check is available in 'Open Checks'.",
          });
      }

    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Could not send items to kitchen.",
      });
    }
  };

  const handleFinalizeAndPay = async () => {
    if (!activeCheck || !activeCheckId || activeCheck.items.length === 0 || !activeCheck.orderType || !settings || !currentUser) return;

    const originalCheckName = activeCheck.name;

    if (activeCheck.orderType === 'Dine In') {
      await deleteCheck(activeCheckId);
      // The listener will automatically remove the check from state and select a new one.
      toast({
          title: "Bill Closed",
          description: `${originalCheckName}'s bill has been paid and closed.`,
      });
      setCloseCheckAlertOpen(false);
      return;
    }

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
      employeeId: currentUser.id,
      employeeName: currentUser.name,
    };

    await addOrder(newOrderData);
    await deleteCheck(activeCheckId);
    
    toast({
        title: "Order Sent & Closed!",
        description: `${originalCheckName}'s order sent and check is closed.`,
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
    toast({
        title: "Order Completed",
        description: "The order has been marked as complete.",
    });
  }

  const handleClearOrder = async (orderId: string) => {
    await archiveOrder(orderId);
     toast({
        title: "Order Cleared",
        description: "The completed order has been removed from the view.",
    });
  }


  const handleLogout = () => {
    localStorage.removeItem('currentEmployee');
    router.push('/login');
  };

  if (isLoading || !settings || !currentUser) {
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
                 <ThemeToggle />
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <UserCircle className="h-5 w-5" />
                        <span className="hidden md:inline">{currentUser.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account ({currentUser.role})</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {currentUser.role === 'Manager' && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <LayoutGrid className="mr-2 h-4 w-4" />
                            <span>Go to Admin</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                availableExtras={availableExtras}
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
          <OrderProgress 
            orders={[]} 
            onCompleteOrder={handleCompleteOrder} 
            onClearOrder={handleClearOrder} 
            tables={tables}
           />
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
    {customizingItem && (
      <CustomizeItemDialog 
          item={customizingItem}
          availableExtras={availableExtras}
          onClose={() => setCustomizingItem(null)}
          onSave={handleUpdateCustomization}
      />
    )}
    </>
  );
}
