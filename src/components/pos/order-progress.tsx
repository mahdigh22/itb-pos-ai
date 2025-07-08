import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, Package, Soup, ClipboardList } from 'lucide-react';
import type { ActiveOrder, OrderStatus } from '@/lib/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderProgressProps {
  orders: ActiveOrder[];
  onClearOrder: (orderId: string) => void;
}

const statusConfig: Record<OrderStatus, { value: number; icon: React.ElementType; label: string; badgeVariant: "default" | "secondary" | "outline" | "destructive" }> = {
    Preparing: { value: 33, icon: Soup, label: "Preparing", badgeVariant: "secondary" },
    Ready: { value: 66, icon: Package, label: "Ready", badgeVariant: "outline" },
    Completed: { value: 100, icon: CheckCircle, label: "Completed", badgeVariant: "default" },
};

export default function OrderProgress({ orders, onClearOrder }: OrderProgressProps) {

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Order Progress</CardTitle>
        <CardDescription>Track active and recently completed orders.</CardDescription>
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
                {orders.map((order) => {
                const config = statusConfig[order.status];
                return (
                    <div key={order.id} className="p-4 border rounded-lg space-y-3 transition-all bg-card/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{order.checkName} - #{order.id.split('-')[1].slice(-4)}</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(order.createdAt, "p")} - ${order.total.toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                    <Badge variant={config.badgeVariant} className={order.status === 'Completed' ? 'bg-green-600 text-white border-transparent hover:bg-green-700' : ''}>
                                    <config.icon className="h-3 w-3 mr-1.5" />
                                    {config.label}
                                    </Badge>
                                    {order.status === 'Completed' && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onClearOrder(order.id)}>
                                        <X className="h-4 w-4"/>
                                        <span className="sr-only">Clear Order</span>
                                    </Button>
                                    )}
                            </div>
                        </div>
                        <Progress value={config.value} className="h-2" />
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {order.items.map(item => (
                                <li key={item.lineItemId}>{item.quantity}x {item.name}</li>
                            ))}
                        </ul>
                    </div>
                )
                })}
            </div>
        </ScrollArea>
      )}
      </CardContent>
    </Card>
  );
}
