
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, Package, Soup, ClipboardList } from 'lucide-react';
import type { ActiveOrder, OrderStatus } from '@/lib/types';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderProgressProps {
  orders: ActiveOrder[];
  onCompleteOrder: (orderId: string) => void;
  onClearOrder: (orderId: string) => void;
}

const statusConfig: Record<OrderStatus, { icon: React.ElementType; label: string; badgeVariant: "default" | "secondary" | "outline" | "destructive" }> = {
    Preparing: { icon: Soup, label: "Preparing", badgeVariant: "secondary" },
    Ready: { icon: Package, label: "Ready", badgeVariant: "outline" },
    Completed: { icon: CheckCircle, label: "Completed", badgeVariant: "default" },
};

function OrderCard({ order, onCompleteOrder, onClearOrder }: { order: ActiveOrder, onCompleteOrder: (id: string) => void, onClearOrder: (id: string) => void }) {
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
    
    if (order.status === 'Completed') {
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
    const timeLeft = endTime - currentTime.getTime();

    return (
        <div className="p-4 border rounded-lg space-y-3 transition-all bg-card/50">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold">{order.checkName} - #{order.id.slice(-6)}</p>
                    <p className="text-sm text-muted-foreground">
                        Ordered at {format(order.createdAt, "p")} - Total: ${order.total.toFixed(2)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={config.badgeVariant} className={currentStatus === 'Completed' ? 'bg-green-600 text-white border-transparent hover:bg-green-700' : ''}>
                        <config.icon className="h-3 w-3 mr-1.5" />
                        {config.label}
                    </Badge>
                     {currentStatus === 'Ready' && (
                        <Button size="sm" onClick={() => onCompleteOrder(order.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Mark Completed
                        </Button>
                    )}
                    {currentStatus === 'Completed' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onClearOrder(order.id)}>
                            <X className="h-4 w-4"/>
                            <span className="sr-only">Clear Order</span>
                        </Button>
                    )}
                </div>
            </div>
            <div>
                 <Progress value={progress} className="h-2" />
                 <p className="text-xs text-muted-foreground mt-1.5 text-right">
                    {currentStatus === 'Preparing' && timeLeft > 0 && `Ready in approx. ${formatDistanceToNowStrict(endTime)}`}
                    {currentStatus === 'Ready' && 'Ready for pickup!'}
                    {currentStatus === 'Completed' && 'Order collected.'}
                 </p>
            </div>
        </div>
    );
}

export default function OrderProgress({ orders, onCompleteOrder, onClearOrder }: OrderProgressProps) {

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Order Progress</CardTitle>
        <CardDescription>Track active and recently completed orders in real-time.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
        {orders.length === 0 ? (
            <div className="text-center text-muted-foreground flex-grow flex flex-col justify-center items-center">
                <ClipboardList className="w-16 h-16 mb-4"/>
                <p className="font-semibold">No active orders</p>
                <p className="text-sm">Place a new order to see its progress here.</p>
            </div>
        ) : (
        <ScrollArea className="h-full w-full pr-4">
            <div className="space-y-4">
                {orders.map((order) => (
                    <OrderCard key={order.id} order={order} onCompleteOrder={onCompleteOrder} onClearOrder={onClearOrder} />
                ))}
            </div>
        </ScrollArea>
      )}
      </CardContent>
    </Card>
  );
}
