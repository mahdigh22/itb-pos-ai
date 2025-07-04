
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, Trash2, CreditCard, FilePlus, ShoppingCart, Settings2 } from 'lucide-react';
import type { OrderItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

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
            <ScrollArea className="flex-grow -mr-4 pr-4">
              <div className="space-y-4">
                {order.map((item) => (
                  <div key={item.lineItemId}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          data-ai-hint={item.imageHint}
                          className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                        />
                        <div className="flex-grow truncate">
                          <p className="font-semibold truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateQuantity(item.lineItemId, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateQuantity(item.lineItemId, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                     {(item.customizations?.removed?.length || 0) > 0 || (item.customizations?.added?.length || 0) > 0 ? (
                        <div className="pl-16 mt-1 flex flex-wrap gap-1">
                            {item.customizations?.removed?.map(r => (
                                <Badge key={r} variant="destructive" className="font-normal capitalize">
                                    - {r}
                                </Badge>
                            ))}
                            {item.customizations?.added?.map(a => (
                                <Badge key={a} variant="secondary" className="font-normal capitalize">
                                    + {a}
                                </Badge>
                            ))}
                        </div>
                    ) : null}
                    <div className="flex justify-end gap-2 mt-1 -mb-2">
                       {item.ingredients && item.ingredients.length > 0 && (
                          <Button variant="outline" size="sm" className="h-7" onClick={() => onCustomizeItem(item)}>
                            <Settings2 className="h-3 w-3 mr-1.5"/>
                            Customize
                          </Button>
                       )}
                       <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive/80 hover:text-destructive"
                          onClick={() => onRemoveItem(item.lineItemId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
