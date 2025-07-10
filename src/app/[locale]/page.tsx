
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'next-intl';
import { useRouter } from 'next/navigation';
import { getCategories, getMenuItems } from '@/app/admin/menu/actions';
import { getExtras } from '@/app/admin/extras/actions';
import { getUsers } from '@/app/admin/users/actions';
import { getSettings } from '@/app/admin/settings/actions';
import { getTables } from '@/app/admin/tables/actions';
import { getChecks, addCheck, updateCheck, deleteCheck, addOrder, updateOrderStatus, sendNewItemsToKitchen, archiveOrder } from '@/app/pos/actions';
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
import { LayoutDashboard, Users, Loader2, ClipboardList, LogOut, Settings, ClipboardCheck, UserCircle, LayoutGrid } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import ItbIcon from '@/components/itb-icon';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LanguageToggle from '@/components/language-toggle';
import { useTranslations } from 'next-intl';

export default function Home() {
  const router = useRouter();
  const t = useTranslations('HomePage');
  const tAlerts = useTranslations('Alerts');

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
      setIsLoading(false); // Ensure loading is stopped before redirect
      router.replace('/login');
      return;
    } else {
      if (employeeData.role === 'Chef') {
        setIsLoading(false); // Ensure loading is stopped before redirect
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
          fetchedChecks, 
          fetchedExtras,
          fetchedSettings,
          fetchedTables,
        ] = await Promise.all([
            getUsers(),
            getMenuItems(),
            getCategories(),
            getChecks(),
            getExtras(),
            getSettings(),
            getTables(),
        ]);
        setMembers(fetchedMembers);
        setMenuItems(fetchedMenuItems);
        setCategories(fetchedCategories);
        setChecks(fetchedChecks);
        setAvailableExtras(fetchedExtras);
        setSettings(fetchedSettings);
        setTables(fetchedTables);
        
        if (fetchedChecks.length === 0) {
            const newCheckData: Omit<Check, 'id'> = { 
              name: t('newCheckName', {number: 1}), 
              items: [],
              priceListId: fetchedSettings.activePriceListId,
              employeeId: employeeData.id,
              employeeName: employeeData.name,
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
  }, [router, t]);
  
  useEffect(() => {
      const q = query(collection(db, 'orders'), where('status', 'in', ['Preparing', 'Ready', 'Completed']));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const liveOrders: ActiveOrder[] = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              liveOrders.push({
                  id: doc.id,
                  ...data,
                  createdAt: (data.createdAt as Timestamp).toDate(),
              } as ActiveOrder);
          });
          setActiveOrders(liveOrders.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
      }, (error) => {
        console.error("Error in orders snapshot listener: ", error);
        toast({
          variant: "destructive",
          title: tAlerts('realtimeErrorTitle'),
          description: tAlerts('realtimeErrorDescription')
        })
      });

      return () => unsubscribe();
  }, [toast, tAlerts]);

  const updateActiveCheckDetails = async (updates: Partial<Omit<Check, 'id'>>) => {
    if (!activeCheckId) return;
    
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
    if (!currentUser) return;
    const emptyCheck = checks.find(c => c.items.length === 0);

    if (emptyCheck) {
        setActiveCheckId(emptyCheck.id);
        toast({
            title: tAlerts('switchedToEmptyCheckTitle'),
            description: tAlerts('switchedToEmptyCheckDescription', {checkName: emptyCheck.name}),
        });
        return;
    }

    const newCheckName = t('newCheckName', {number: checks.length + 1});
    const newCheckData: Omit<Check, 'id'> = { 
      name: newCheckName, 
      items: [],
      priceListId: settings?.activePriceListId,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
    };
    const newCheck = await addCheck(newCheckData);
    
    setChecks(prevChecks => [...prevChecks, newCheck]);
    setActiveCheckId(newCheck.id);

    toast({
        title: tAlerts('newCheckStartedTitle'),
        description: tAlerts('switchedToNewCheckDescription', {checkName: newCheck.name}),
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

    const originalCheckId = activeCheckId;
    const originalCheckName = activeCheck.name;

    const result = await sendNewItemsToKitchen(originalCheckId);

    if (result.success) {
      toast({
        title: tAlerts('itemsSentTitle'),
        description: tAlerts('itemsSentDescription', {checkName: originalCheckName}),
      });

      const updatedChecks = await getChecks();
      
      setChecks(updatedChecks);

      const emptyCheck = updatedChecks.find(c => c.items.length === 0);

      if (emptyCheck) {
          setActiveCheckId(emptyCheck.id);
          toast({
              title: tAlerts('switchedToEmptyCheckTitle'),
              description: tAlerts('previousCheckInOpen'),
          });
      } else {
          const newCheckName = t('newCheckName', {number: updatedChecks.length + 1});
          const newCheckData: Omit<Check, 'id'> = {
              name: newCheckName,
              items: [],
              priceListId: settings?.activePriceListId,
              employeeId: currentUser.id,
              employeeName: currentUser.name,
          };
          const newCheck = await addCheck(newCheckData);
          setChecks(prev => [...prev, newCheck]);
          setActiveCheckId(newCheck.id);
          toast({
              title: tAlerts('newCheckStartedTitle'),
              description: tAlerts('previousCheckInOpen'),
          });
      }

    } else {
      toast({
        variant: "destructive",
        title: tAlerts('error'),
        description: result.error || tAlerts('sendToKitchenError'),
      });
      const updatedChecks = await getChecks();
      setChecks(updatedChecks);
    }
  };

  const handleFinalizeAndPay = async () => {
    if (!activeCheck || !activeCheckId || activeCheck.items.length === 0 || !activeCheck.orderType || !settings || !currentUser) return;

    if (activeCheck.orderType === 'Dine In') {
      await deleteCheck(activeCheckId);
      
      const remainingChecks = checks.filter(c => c.id !== activeCheckId);
      setChecks(remainingChecks);

      if (remainingChecks.length > 0) {
          setActiveCheckId(remainingChecks[0].id);
      } else {
          const newCheckData: Omit<Check, 'id'> = { 
            name: t('newCheckName', {number: 1}),
            items: [],
            priceListId: settings.activePriceListId,
            employeeId: currentUser.id,
            employeeName: currentUser.name,
          };
          const newCheck = await addCheck(newCheckData);
          setChecks([newCheck]);
          setActiveCheckId(newCheck.id);
      }

      toast({
          title: tAlerts('billClosedTitle'),
          description: tAlerts('billClosedDescription', {checkName: activeCheck.name}),
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
    
    const remainingChecks = checks.filter(c => c.id !== activeCheckId);
    setChecks(remainingChecks);

    if (remainingChecks.length > 0) {
        setActiveCheckId(remainingChecks[0].id);
    } else {
        const newCheckData: Omit<Check, 'id'> = { 
          name: t('newCheckName', {number: 1}),
          items: [],
          priceListId: settings.activePriceListId,
          employeeId: currentUser.id,
          employeeName: currentUser.name,
        };
        const newCheck = await addCheck(newCheckData);
        setChecks([newCheck]);
        setActiveCheckId(newCheck.id);
    }

    toast({
        title: tAlerts('orderSentAndClosedTitle'),
        description: tAlerts('orderSentAndClosedDescription', {checkName: activeCheck.name}),
    });
    setCloseCheckAlertOpen(false);
  }

  const handleCloseCheck = () => {
    if (!activeCheck?.orderType) {
        toast({
            variant: "destructive",
            title: tAlerts('orderTypeRequiredTitle'),
            description: tAlerts('orderTypeRequiredDescription'),
        });
        return;
    }
     setCloseCheckAlertOpen(true);
  }

  const handleCompleteOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'Completed');
    toast({
        title: tAlerts('orderCompletedTitle'),
        description: tAlerts('orderCompletedDescription'),
    });
  }

  const handleClearOrder = async (orderId: string) => {
    await archiveOrder(orderId);
     toast({
        title: tAlerts('orderClearedTitle'),
        description: tAlerts('orderClearedDescription'),
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
      ? tAlerts('closeDineInCheckDescription')
      : tAlerts('closeTakeAwayCheckDescription');

  return (
    <>
    <Tabs defaultValue="pos" value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
       <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 text-lg font-headline font-semibold">
                <ItbIcon className="h-8 w-8" />
                <span className="text-xl text-primary font-bold">{t('headerTitle')}</span>
              </Link>
              
              <TabsList className="inline-grid h-12 w-full max-w-2xl grid-cols-4 bg-muted p-1 rounded-lg">
                <TabsTrigger value="pos" className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <LayoutDashboard className="h-5 w-5" />
                  {t('posTab')}
                </TabsTrigger>
                <TabsTrigger value="checks" className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <ClipboardCheck className="h-5 w-5" />
                  {t('openChecksTab')}
                </TabsTrigger>
                <TabsTrigger value="progress" className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <ClipboardList className="h-5 w-5" />
                  {t('orderProgressTab')}
                </TabsTrigger>
                <TabsTrigger value="members" className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <Users className="h-5 w-5" />
                  {t('membersTab')}
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                 <ThemeToggle />
                 <LanguageToggle />
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <UserCircle className="h-5 w-5" />
                        <span className="hidden md:inline">{currentUser.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('myAccountLabel')} ({currentUser.role})</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {currentUser.role === 'Manager' && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <LayoutGrid className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                            <span>Go to Admin</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                        <span>{t('logout')}</span>
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
            orders={activeOrders} 
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
            <AlertDialogTitle className="font-headline">{tAlerts('confirmActionTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
                {closeCheckAlertDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tAlerts('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizeAndPay}>{tAlerts('confirm')}</AlertDialogAction>
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
