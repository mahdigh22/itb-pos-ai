
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, Trash2, CreditCard, FilePlus, ShoppingCart, Settings2 } from 'lucide-react';
import type { OrderItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OrderSummaryProps {
  order: OrderItem[];
  onUpdateQuantity: (lineItemId: string, quantity: number) => void;
  onRemoveItem: (lineItemId: string) => void;
  onNewCheck: () => void;
  onCheckout: () => void;
  onCustomizeItem: (item: OrderItem) => void;
}

const TAX_RATE = 0.08; // 8%

export default function OrderSummary({
  order,
  onUpdateQuantity,
  onRemoveItem,
  onNewCheck,
  onCheckout,
  onCustomizeItem
}: OrderSummaryProps) {
  const subtotal = order.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline">Current Order</CardTitle>
        <CardDescription>Review and manage the order items</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
        {order.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground flex-grow">
            <ShoppingCart className="w-16 h-16 mb-4"/>
            <p className="font-semibold">Your order is empty</p>
            <p className="text-sm">Add items from the menu to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full flex-grow">
            <ScrollArea className="flex-grow -mr-6 pr-6">
              <div className="space-y-2">
                {order.map((item) => (
                  <div key={item.lineItemId} className="flex items-start py-3 border-b last:border-b-0 gap-4">
                    <Avatar className="w-14 h-14 rounded-md border">
                        <AvatarImage src={item.imageUrl} alt={item.name} />
                        <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <div className="flex items-start">
                            <div className="flex-1 pr-2">
                                <p className="font-semibold leading-tight">{item.name}</p>
                                <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onUpdateQuantity(item.lineItemId, item.quantity - 1)}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-medium text-base">{item.quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onUpdateQuantity(item.lineItemId, item.quantity + 1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                </div>
                                <p className="w-20 text-right font-semibold text-base">
                                ${(item.price * item.quantity).toFixed(2)}
                                </p>
                                <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => onRemoveItem(item.lineItemId)}
                                >
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        
                        {( (item.customizations?.added?.length || 0) > 0 || (item.customizations?.removed?.length || 0) > 0 || (item.ingredients && item.ingredients.length > 0) ) && (
                        <div className="mt-2 flex items-center gap-4 flex-wrap">
                            <div className="flex-grow flex flex-wrap gap-1">
                            {item.customizations?.removed?.map(r => (
                                <Badge key={r} variant="destructive" className="font-normal capitalize shadow-sm">
                                    - {r}
                                </Badge>
                            ))}
                            {item.customizations?.added?.map(a => (
                                <Badge key={a} variant="secondary" className="font-normal capitalize shadow-sm">
                                    + {a}
                                </Badge>
                            ))}
                            </div>
                            {item.ingredients && item.ingredients.length > 0 && (
                            <div className="flex-shrink-0">
                                <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground hover:text-primary" onClick={() => onCustomizeItem(item)}>
                                <Settings2 className="h-3 w-3 mr-1.5"/>
                                Customize
                                </Button>
                            </div>
                            )}
                        </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-auto pt-4 border-t">
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
