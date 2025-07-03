import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, Trash2, CreditCard, FilePlus, ShoppingCart } from 'lucide-react';
import type { OrderItem } from '@/lib/types';

interface OrderSummaryProps {
  order: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onNewCheck: () => void;
  onCheckout: () => void;
}

const TAX_RATE = 0.08; // 8%

export default function OrderSummary({
  order,
  onUpdateQuantity,
  onRemoveItem,
  onNewCheck,
  onCheckout,
}: OrderSummaryProps) {
  const subtotal = order.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <Card className="sticky top-24 flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Current Order</CardTitle>
        <CardDescription>Review and manage the order items</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {order.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
            <ShoppingCart className="w-16 h-16 mb-4"/>
            <p className="font-semibold">Your order is empty</p>
            <p className="text-sm">Add items from the menu to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-grow -mr-4 pr-4">
              <div className="space-y-4">
                {order.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-grow">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator className="my-2"/>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-6 border-t">
        <Button className="w-full" size="lg" onClick={onCheckout} disabled={order.length === 0}>
          <CreditCard className="mr-2 h-4 w-4" /> Checkout
        </Button>
        <Button variant="outline" className="w-full" onClick={onNewCheck}>
          <FilePlus className="mr-2 h-4 w-4" /> New Check
        </Button>
      </CardFooter>
    </Card>
  );
}
