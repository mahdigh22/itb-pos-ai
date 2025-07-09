

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getOrders, updateOrderStatus, archiveOrder } from '@/app/pos/actions';
import { getTables } from '@/app/admin/tables/actions';
import type { ActiveOrder, RestaurantTable, Employee } from '@/lib/types';
import OrderProgress from '@/components/pos/order-progress';
import { useToast } from "@/hooks/use-toast"
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, LogOut, UserCircle } from 'lucide-react';
import ItbIcon from '@/components/itb-icon';
import { ThemeToggle } from '@/components/theme-toggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function KitchenPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

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
    
    if (!employeeData?.id || employeeData.role !== 'Chef') {
      router.replace('/login');
    } else {
      setCurrentUser(employeeData);
      
      const fetchInitialData = async () => {
        setIsLoading(true);
        const [initialOrders, initialTables] = await Promise.all([
          getOrders(),
          getTables(),
        ]);
        setOrders(initialOrders);
        setTables(initialTables);
        setIsLoading(false);
      };

      fetchInitialData();
      
      const q = query(
          collection(db, 'orders'), 
          where('status', 'in', ['Preparing', 'Ready', 'Completed']),
          orderBy('createdAt', 'desc')
        );
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
          setOrders(liveOrders);
      }, (error) => {
        console.error("Error in kitchen snapshot listener: ", error);
        toast({
          variant: "destructive",
          title: "Real-time Update Error",
          description: "Could not fetch live order updates. Please check console for details."
        })
      });

      return () => unsubscribe();
    }
  }, [router, toast]);

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

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 text-lg font-headline font-semibold">
              <ItbIcon className="h-8 w-8" />
              <span className="text-xl text-primary font-bold">Kitchen View</span>
            </div>

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
      <main className="flex-grow min-h-0 container mx-auto p-4 md:p-8">
        <OrderProgress 
          orders={orders} 
          onCompleteOrder={handleCompleteOrder} 
          onClearOrder={handleClearOrder} 
          tables={tables}
        />
      </main>
    </div>
  );
}
