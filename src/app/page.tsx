
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCategories,
  getMenuItems as fetchMenuItems,
} from "@/app/admin/menu/actions";
import { getExtras } from "@/app/admin/extras/actions";
import { getUsers } from "@/app/admin/users/actions";
import { getSettings } from "@/app/admin/settings/actions";
import { getTables } from "@/app/admin/tables/actions";
import {
  sendNewItemsToKitchen,
  updateOrderStatus,
  archiveOrder,
  addCheck,
  updateCheck,
  deleteCheck,
} from "@/app/pos/actions";
import type {
  OrderItem,
  MenuItem,
  ActiveOrder,
  Check,
  Member,
  Category,
  OrderType,
  Extra,
  PriceList,
  RestaurantTable,
  Employee,
} from "@/lib/types";
import MenuDisplay from "@/components/pos/menu-display";
import OrderSummary from "@/components/pos/order-summary";
import MembersList from "@/components/members/members-list";
import OrderProgress from "@/components/pos/order-progress";
import CustomizeItemDialog from "@/components/pos/customize-item-dialog";
import OpenChecksDisplay from "@/components/pos/open-checks-display";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Users,
  Loader2,
  ClipboardList,
  LogOut,
  LayoutGrid,
  ClipboardCheck,
  UserCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import ItbIcon from "@/components/itb-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Bill from "@/components/pos/bill";

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

export default function Home() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isCloseCheckAlertOpen, setCloseCheckAlertOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<OrderItem | null>(
    null
  );
  
  const [billToPrint, setBillToPrint] = useState<Check | null>(null);
  const billRef = useRef<HTMLDivElement>(null);

  const [checks, setChecks] = useState<Check[]>([]);
  const [activeCheckId, setActiveCheckId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableExtras, setAvailableExtras] = useState<Extra[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [settings, setSettings] = useState<{
    taxRate: number;
    priceLists: PriceList[];
    activePriceListId?: string;
  } | null>(null);
  const [restaurantName, setRestaurantName] = useState('');

  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("pos");

  const activeCheck = useMemo(
    () => checks.find((c) => c.id === activeCheckId),
    [checks, activeCheckId]
  );

  const debouncedUpdateCheck = useRef(
    debounce((checkId: string, updates: Partial<Omit<Check, "id">>) => {
      if (currentUser?.restaurantId) {
        updateCheck(currentUser.restaurantId, checkId, updates);
      }
    }, 500)
  ).current;
  
  useEffect(() => {
    const handlePrint = async () => {
        if (billToPrint) {
            await new Promise(resolve => setTimeout(resolve, 100)); // allow component to render
            window.print();
        }
    };
    handlePrint();
  }, [billToPrint]);

  useEffect(() => {
    const afterPrint = () => {
      if (billToPrint) {
        // If it was a Dine In order, finalize it after printing
        if (billToPrint.orderType === 'Dine In' && currentUser?.restaurantId) {
            deleteCheck(currentUser.restaurantId, billToPrint.id);
            toast({
                title: "Bill Closed",
                description: `${billToPrint.name}'s bill has been paid and closed.`,
            });
        }
        setBillToPrint(null);
      }
    };
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, [billToPrint, currentUser?.restaurantId, toast]);

  useEffect(() => {
    let employeeData = null;
    try {
      const storedEmployee = localStorage.getItem("currentEmployee");
      if (storedEmployee) {
        employeeData = JSON.parse(storedEmployee);
      }
    } catch (e) {
      console.error("Failed to parse employee data from localStorage", e);
    }

    if (!employeeData?.id || !employeeData?.restaurantId) {
      setIsLoading(false);
      router.replace("/login");
      return;
    }

    if (employeeData.role === "Chef") {
      setIsLoading(false);
      router.replace("/kitchen");
      return;
    }

    setCurrentUser(employeeData);
    const fetchInitialData = async () => {
      setIsLoading(true);
      const restaurantId = employeeData.restaurantId;
      const [
        fetchedMembers,
        fetchedMenuItems,
        fetchedCategories,
        fetchedExtras,
        fetchedSettings,
        fetchedTables,
        restaurantDoc,
      ] = await Promise.all([
        getUsers(restaurantId),
        fetchMenuItems(restaurantId),
        getCategories(restaurantId),
        getExtras(restaurantId),
        getSettings(restaurantId),
        getTables(restaurantId),
        getDoc(doc(db, 'restaurants', restaurantId))
      ]);
      setMembers(fetchedMembers);
      setMenuItems(fetchedMenuItems);
      setCategories(fetchedCategories);
      setAvailableExtras(fetchedExtras);
      setSettings(fetchedSettings);
      setTables(fetchedTables);
      if (restaurantDoc.exists()) {
        setRestaurantName(restaurantDoc.data().name);
      }

      setIsLoading(false);
    };
    fetchInitialData();
  }, [router]);

  useEffect(() => {
    if (!currentUser?.restaurantId) return;
    const restaurantId = currentUser.restaurantId;

    const checksQuery = query(
      collection(db, "restaurants", restaurantId, "checks")
    );
    const unsubscribeChecks = onSnapshot(
      checksQuery,
      async (querySnapshot) => {
        const liveChecks: Check[] = [];
        querySnapshot.forEach((doc) => {
          liveChecks.push({ id: doc.id, ...doc.data() } as Check);
        });
        setChecks(liveChecks.sort((a, b) => a.name.localeCompare(b.name)));

        if (!activeCheckId || !liveChecks.some((c) => c.id === activeCheckId)) {
          if (liveChecks.length > 0) {
            setActiveCheckId(liveChecks[0].id);
          } else if (currentUser) {
            const newCheckData: Omit<Check, "id"> = {
              name: `Check 1`,
              items: [],
              priceListId: settings?.activePriceListId,
              employeeId: currentUser.id,
              employeeName: currentUser.name,
            };
            const newCheck = await addCheck(restaurantId, newCheckData);
            setActiveCheckId(newCheck.id);
          }
        }
      },
      (error) => {
        console.error("Error in checks snapshot listener: ", error);
        toast({
          variant: "destructive",
          title: "Real-time Error",
          description: "Could not fetch live check updates.",
        });
      }
    );

    return () => {
      unsubscribeChecks();
    };
  }, [toast, activeCheckId, currentUser, settings]);

  const updateActiveCheckDetails = async (
    updates: Partial<Omit<Check, "id">>
  ) => {
    if (!activeCheckId || !currentUser?.restaurantId) return;
    await updateCheck(currentUser.restaurantId, activeCheckId, updates);
  };

  const handleTableSelect = async (tableId: string) => {
    if (!activeCheckId) return;

    const selectedTable = tables.find((t) => t.id === tableId);
    if (selectedTable) {
      updateActiveCheckDetails({
        tableId: selectedTable.id,
        tableName: selectedTable.name,
      });
    }
  };

  const handleAddItem = (item: MenuItem) => {
    if (!activeCheck || !currentUser?.restaurantId) return;

    const restaurantId = currentUser.restaurantId;
    const customizationsAreEqual = (a: any, b: any) => {
      const aAdded = a.added.map((i: any) => i.id).sort();
      const bAdded = b.added.map((i: any) => i.id).sort();
      const aRemoved = a.removed.map((i: any) => i.id).sort();
      const bRemoved = b.removed.map((i: any) => i.id).sort();

      return (
        aAdded.join(",") === bAdded.join(",") &&
        aRemoved.join(",") === bRemoved.join(",")
      );
    };

    const existingItemIndex = activeCheck.items.findIndex(
      (orderItem) =>
        orderItem.id === item.id &&
        customizationsAreEqual(orderItem.customizations, {
          added: [],
          removed: [],
        })
    );

    let newItems: OrderItem[];

    if (existingItemIndex > -1) {
      newItems = activeCheck.items.map((orderItem, index) => {
        if (index === existingItemIndex) {
          return {
            ...orderItem,
            quantity: orderItem.quantity + 1,
            status: "new" as const,
          };
        }
        return orderItem;
      });
    } else {
      const newOrderItem: OrderItem = {
        ...item,
        quantity: 1,
        lineItemId: `${item.id}-${Date.now()}`,
        status: "new" as const,
        customizations: { added: [], removed: [] },
      };
      newItems = [...activeCheck.items, newOrderItem];
    }

    const updatedChecks = checks.map((c) =>
      c.id === activeCheck.id ? { ...c, items: newItems } : c
    );
    setChecks(updatedChecks);

    debouncedUpdateCheck(activeCheck.id, { items: newItems });
  };

  const handleUpdateQuantity = async (lineItemId: string, quantity: number) => {
    if (!activeCheck || !currentUser?.restaurantId) return;
    debouncedUpdateCheck.cancel();
    if (quantity < 1) {
      await handleRemoveItem(lineItemId);
      return;
    }
    const newItems = activeCheck.items.map((item) =>
      item.lineItemId === lineItemId
        ? { ...item, quantity, status: "new" as const }
        : item
    );
    await updateCheck(currentUser.restaurantId, activeCheck.id, {
      items: newItems,
    });
  };

  const handleRemoveItem = async (lineItemId: string) => {
    if (!activeCheck || !currentUser?.restaurantId) return;
    debouncedUpdateCheck.cancel();
    const newItems = activeCheck.items.filter(
      (item) => item.lineItemId !== lineItemId
    );
    await updateCheck(currentUser.restaurantId, activeCheck.id, {
      items: newItems,
    });
  };

  const handleClearCheck = async () => {
    if (!activeCheck || !currentUser?.restaurantId) return;
    debouncedUpdateCheck.cancel();
    await updateCheck(currentUser.restaurantId, activeCheck.id, { items: [] });
  };

  const handleStartCustomization = (itemToCustomize: OrderItem) => {
    if (!activeCheck || !currentUser?.restaurantId) return;
    debouncedUpdateCheck.cancel();
    setCustomizingItem(itemToCustomize);
  };

  const handleUpdateCustomization = async (
    lineItemId: string,
    customizations: { added: Extra[]; removed: { id: string; name: string }[] }
  ) => {
    if (!activeCheck || !currentUser?.restaurantId) return;

    const newItems = activeCheck.items.map((item) =>
      item.lineItemId === lineItemId
        ? { ...item, customizations, status: "new" as const }
        : item
    );
    await updateCheck(currentUser.restaurantId, activeCheck.id, {
      items: newItems,
    });
    setCustomizingItem(null);
  };

  const handleNewCheck = async () => {
    if (!currentUser?.restaurantId) return;
    const restaurantId = currentUser.restaurantId;
    const emptyCheck = checks.find((c) => c.items.length === 0);

    if (emptyCheck) {
      setActiveCheckId(emptyCheck.id);
      toast({
        title: "Switched to Empty Check",
        description: `Now editing ${emptyCheck.name}.`,
      });
      return;
    }

    const newCheckName = `Check ${checks.length + 1}`;
    const newCheckData: Omit<Check, "id"> = {
      name: newCheckName,
      items: [],
      priceListId: settings?.activePriceListId,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
    };
    const newCheck = await addCheck(restaurantId, newCheckData);
    setActiveCheckId(newCheck.id);

    toast({
      title: "New Check Started",
      description: `Switched to ${newCheck.name}.`,
    });
  };

  const handleSwitchCheck = (checkId: string) => {
    setActiveCheckId(checkId);
  };

  const handleSelectCheckAndSwitchTab = (checkId: string) => {
    setActiveCheckId(checkId);
    setActiveTab("pos");
  };

  const handleSendToKitchen = async () => {
    if (!activeCheckId || !activeCheck || !currentUser?.restaurantId) return;

    if (!activeCheck.orderType) {
      toast({
        variant: "destructive",
        title: "Order Type Required",
        description:
          "Please select Dine In or Take Away before sending to kitchen.",
      });
      return;
    }

    debouncedUpdateCheck.cancel();

    const originalCheckName = activeCheck.name;
    const result = await sendNewItemsToKitchen(
      currentUser.restaurantId,
      activeCheckId
    );

    if (result.success) {
      toast({
        title: "Items Sent!",
        description: `New items for ${originalCheckName} sent to the kitchen.`,
      });

      if (activeCheck.orderType === 'Take Away') {
        setBillToPrint(activeCheck);
      }
      
      const currentChecks = checks;
      const emptyCheck = currentChecks.find(
        (c) => c.items.length === 0 && c.id !== activeCheckId
      );

      if (emptyCheck) {
        setActiveCheckId(emptyCheck.id);
        toast({
          title: "Switched to Empty Check",
          description: "The previous check is available in 'Open Checks'.",
        });
      } else {
        const newCheckName = `Check ${currentChecks.length + 1}`;
        const newCheckData: Omit<Check, "id"> = {
          name: newCheckName,
          items: [],
          priceListId: settings?.activePriceListId,
          employeeId: currentUser.id,
          employeeName: currentUser.name,
        };
        const newCheck = await addCheck(currentUser.restaurantId, newCheckData);
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

  const handleFinalizeAndPay = () => {
    if (!activeCheck) return;
    setBillToPrint(activeCheck);
    setCloseCheckAlertOpen(false);
  };
  

  const handleCloseCheck = () => {
    if (activeCheck?.orderType === "Take Away") {
      toast({
        variant: "destructive",
        title: "Invalid Action",
        description:
          'Takeaway orders close when sent. Use "Send to Kitchen" to print bill.',
      });
      return;
    }

    if (!activeCheck?.orderType) {
      toast({
        variant: "destructive",
        title: "Order Type Required",
        description:
          "Please select Dine In or Take Away before closing the check.",
      });
      return;
    }

    setCloseCheckAlertOpen(true);
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (!currentUser?.restaurantId) return;
    await updateOrderStatus(currentUser.restaurantId, orderId, "Completed");
    toast({
      title: "Order Completed",
      description: "The order has been marked as complete.",
    });
  };

  const handleClearOrder = async (orderId: string) => {
    if (!currentUser?.restaurantId) return;
    await archiveOrder(currentUser.restaurantId, orderId);
    toast({
      title: "Order Cleared",
      description: "The completed order has been removed from the view.",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("currentEmployee");
    setCurrentUser(null);
    router.push("/login");
  };

  if (isLoading || !settings || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const closeCheckAlertDescription =
    "This will print the bill and close the check. This assumes the customer has paid. Are you sure?";

  return (
    <>
      <div className="print-only">
        {billToPrint && settings && (
            <Bill ref={billRef} check={billToPrint} priceLists={settings.priceLists} taxRate={settings.taxRate} restaurantName={restaurantName} />
        )}
      </div>
      <div className="no-print h-full flex flex-col">
        <Tabs
          defaultValue="pos"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full h-full flex flex-col"
        >
          <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-headline font-semibold"
                >
                  <ItbIcon className="h-8 w-8" />
                  <span className="text-xl text-primary font-bold">Members</span>
                </Link>

                <TabsList className="inline-grid h-12 w-full max-w-2xl grid-cols-4 bg-muted p-1 rounded-lg">
                  <TabsTrigger
                    value="pos"
                    className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Point of Sale
                  </TabsTrigger>
                  <TabsTrigger
                    value="checks"
                    className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    <ClipboardCheck className="h-5 w-5" />
                    Open Checks
                  </TabsTrigger>
                  <TabsTrigger
                    value="progress"
                    className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    <ClipboardList className="h-5 w-5" />
                    Order Progress
                  </TabsTrigger>
                  <TabsTrigger
                    value="members"
                    className="h-10 text-base gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
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
                        <span className="hidden md:inline">
                          {currentUser.name}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        My Account ({currentUser.role})
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {currentUser.role === "Manager" && (
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
                  <MenuDisplay
                    categories={categories}
                    menuItems={menuItems}
                    onAddItem={handleAddItem}
                  />
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
                restaurantId={currentUser.restaurantId}
              />
            </TabsContent>

            <TabsContent
              value="progress"
              className="flex-grow min-h-0 h-full mt-0"
            >
              <OrderProgress
                onCompleteOrder={handleCompleteOrder}
                onClearOrder={handleClearOrder}
                tables={tables}
                restaurantId={currentUser.restaurantId}
              />
            </TabsContent>

            <TabsContent value="members" className="h-full mt-0">
              <MembersList members={members} />
            </TabsContent>
          </div>

          <AlertDialog
            open={isCloseCheckAlertOpen}
            onOpenChange={setCloseCheckAlertOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-headline">
                  Confirm Action
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {closeCheckAlertDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinalizeAndPay}>
                  Yes, Print & Close
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Tabs>
      </div>
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
