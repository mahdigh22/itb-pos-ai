

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, Package, Soup, ClipboardList, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import type { ActiveOrder, OrderStatus, RestaurantTable } from '@/lib/types';
import { formatDistanceToNowStrict } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

interface OrderProgressProps {
  orders: ActiveOrder[];
  onCompleteOrder: (orderId: string) => void;
  onClearOrder: (orderId: string) => void;
  tables: RestaurantTable[];
}

const statusConfig: Record<OrderStatus, { key: string; icon: React.ElementType; badgeVariant: "default" | "secondary" | "outline" | "destructive" }> = {
    Preparing: { key: "preparing", icon: Soup, badgeVariant: "secondary" },
    Ready: { key: "ready", icon: Package, badgeVariant: "outline" },
    Completed: { key: "completed", icon: CheckCircle, badgeVariant: "default" },
    Archived: { key: "archived", icon: CheckCircle, badgeVariant: "default" }, // Should not be visible
};

function OrderCard({ order, onCompleteOrder, onClearOrder }: { order: ActiveOrder, onCompleteOrder: (id: string) => void, onClearOrder: (id: string) => void }) {
    const t = useTranslations('OrderProgress');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const startTime = new Date(order.createdAt).getTime();
    const totalDuration = order.totalPreparationTime * 60 * 1000; // in milliseconds
    const endTime = startTime + totalDuration;
    const elapsedTime = currentTime.getTime() - startTime;

    let currentStatus: OrderStatus;
    let progress = 0;
    
    if (order.status === 'Completed' || order.status === 'Archived') {
        currentStatus = 'Completed';
        progress = 100;
    } else {
        progress = Math.min(100, (elapsedTime / totalDuration) * 100);
        if (progress >= 100) {
            currentStatus = 'Ready';
        } else {
            currentStatus = 'Preparing';
        }
    }

    const config = statusConfig[currentStatus];

    return (
        <div className="p-4 border rounded-lg space-y-3 transition-all bg-card/50">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        {order.orderType === 'Dine In' && <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />}
                        {order.orderType === 'Take Away' && <ShoppingBag className="h-4 w-4 text-muted-foreground" />}
                        <p className="font-semibold">{order.checkName} - #{order.id.slice(-6)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground ltr:pl-6 rtl:pr-6">
                        {order.orderType === 'Dine In' && t('tableIdentifier', {tableName: order.tableName || 'N/A'})}
                        {order.orderType === 'Take Away' && t('customerIdentifier', {customerName: order.customerName || 'N/A'})}
                        {' · '}
                        {t('total')}: ${order.total.toFixed(2)}
                        {order.discountApplied && order.discountApplied > 0 && (
                            <span className="text-green-600 dark:text-green-400 font-medium"> ({order.discountApplied}% {t('offDiscount')})</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={config.badgeVariant} className={currentStatus === 'Completed' ? 'bg-green-600 text-white border-transparent hover:bg-green-700' : ''}>
                        <config.icon className="h-3 w-3 ltr:mr-1.5 rtl:ml-1.5" />
                        {t(`status.${config.key}`)}
                    </Badge>
                     {currentStatus === 'Ready' && (
                        <Button size="sm" onClick={() => onCompleteOrder(order.id)}>
                            <CheckCircle className="h-4 w-4 ltr:mr-2 rtl:ml-2" /> {t('markCompleted')}
                        </Button>
                    )}
                    {currentStatus === 'Completed' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onClearOrder(order.id)}>
                            <X className="h-4 w-4"/>
                            <span className="sr-only">{t('clearOrder')}</span>
                        </Button>
                    )}
                </div>
            </div>
            <div>
                 <Progress value={progress} className="h-2" />
                 <p className="text-xs text-muted-foreground mt-1.5 text-right">
                    {currentStatus === 'Preparing' && endTime > currentTime.getTime() && t('readyIn', {time: formatDistanceToNowStrict(endTime)})}
                    {currentStatus === 'Ready' && t('readyForPickup')}
                    {currentStatus === 'Completed' && t('orderCollected')}
                 </p>
            </div>
        </div>
    );
}

export default function OrderProgress({ orders: initialOrders, onCompleteOrder, onClearOrder, tables }: OrderProgressProps) {
  const t = useTranslations('OrderProgress');
  const tAlerts = useTranslations('Alerts');
  const [orders, setOrders] = useState<ActiveOrder[]>(initialOrders);
  const [filter, setFilter] = useState<'all' | 'Dine In' | 'Take Away'>('all');
  const [selectedTableId, setSelectedTableId] = useState<string>('all');
  const { toast } = useToast();

    useEffect(() => {
        const q = query(
          collection(db, 'orders'), 
          where('status', 'in', ['Preparing', 'Ready', 'Completed'])
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
          setOrders(liveOrders.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
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


  useEffect(() => {
    // Reset table filter if main filter is not 'Dine In'
    if (filter !== 'Dine In') {
        setSelectedTableId('all');
    }
  }, [filter]);

  const filteredOrders = orders.filter(order => {
      if (order.status === 'Archived') return false; // Always hide archived orders

      if (filter !== 'all' && order.orderType !== filter) {
          return false;
      }
      if (filter === 'Dine In' && selectedTableId !== 'all' && order.tableId !== selectedTableId) {
          return false;
      }
      return true;
  });

  const visibleOrders = orders.filter(o => o.status !== 'Archived');

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
                <CardTitle className="font-headline">{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </div>
            <div className="flex gap-2">
                <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder={t('filterByType')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('allOrders')}</SelectItem>
                        <SelectItem value="Dine In">{t('dineIn')}</SelectItem>
                        <SelectItem value="Take Away">{t('takeAway')}</SelectItem>
                    </SelectContent>
                </Select>
                {filter === 'Dine In' && (
                     <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder={t('filterByTable')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allTables')}</SelectItem>
                            {tables.map(table => (
                                <SelectItem key={table.id} value={table.id}>{table.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
        {visibleOrders.length === 0 ? (
            <div className="text-center text-muted-foreground flex-grow flex flex-col justify-center items-center">
                <ClipboardList className="w-16 h-16 mb-4"/>
                <p className="font-semibold">{t('noActiveOrders')}</p>
                <p className="text-sm">{t('noActiveOrdersDescription')}</p>
            </div>
        ) : filteredOrders.length === 0 ? (
            <div className="text-center text-muted-foreground flex-grow flex flex-col justify-center items-center">
                <ClipboardList className="w-16 h-16 mb-4"/>
                <p className="font-semibold text-lg">{t('noOrdersMatchFilter')}</p>
                <p className="text-sm">{t('noOrdersMatchFilterDescription')}</p>
            </div>
        ) : (
        <ScrollArea className="h-full w-full pr-4">
            <div className="space-y-4">
                {filteredOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onCompleteOrder={onCompleteOrder} onClearOrder={onClearOrder} />
                ))}
            </div>
        </ScrollArea>
      )}
      </CardContent>
    </Card>
  );
}
