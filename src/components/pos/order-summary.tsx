import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, Trash2, CreditCard, FilePlus, ShoppingCart, Settings2, Send } from 'lucide-react';
import type { OrderItem, Check, OrderType, PriceList, RestaurantTable } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslations } from 'next-intl';

interface OrderSummaryProps {
  activeCheck: Check | undefined;
  checks: Check[];
  onUpdateQuantity: (lineItemId: string, quantity: number) => void;
  onRemoveItem: (lineItemId: string) => void;
  onNewCheck: () => void;
  onSendToKitchen: () => void;
  onCloseCheck: () => void;
  onClearCheck: () => void;
  onCustomizeItem: (item: OrderItem) => void;
  onSwitchCheck: (checkId: string) => void;
  onUpdateCheckDetails: (updates: Partial<Omit<Check, 'id'>>) => void;
  onTableSelect: (tableId: string) => void;
  priceLists: PriceList[];
  taxRate: number;
  tables: RestaurantTable[];
}

export default function OrderSummary({
  activeCheck,
  checks,
  onUpdateQuantity,
  onRemoveItem,
  onNewCheck,
  onSendToKitchen,
  onCloseCheck,
  onClearCheck,
  onCustomizeItem,
  onSwitchCheck,
  onUpdateCheckDetails,
  onTableSelect,
  priceLists,
  taxRate,
  tables,
}: OrderSummaryProps) {
  const t = useTranslations('OrderSummary');
  const [isClearAlertOpen, setClearAlertOpen] = useState(false);
  const order = activeCheck?.items ?? [];
  
  const isCheckPristine = !activeCheck?.items.some(item => item.status === 'sent');
  const pristineChecks = checks.filter(c => !c.items.some(item => item.status === 'sent'));

  const sentItems = order.filter((item) => item.status === 'sent');
  const newItems = order.filter((item) => item.status === 'new');

  const subtotal = order.reduce((acc, item) => {
    const extrasPrice = item.customizations?.added.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
    const totalItemPrice = (item.price + extrasPrice) * item.quantity;
    return acc + totalItemPrice;
  }, 0);
  
  const selectedPriceList = priceLists.find(pl => pl.id === activeCheck?.priceListId);
  const discountPercentage = selectedPriceList?.discount || 0;
  const discountAmount = subtotal * (discountPercentage / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * (taxRate / 100);
  const total = discountedSubtotal + tax;

  const hasNewItems = newItems.length > 0;
  
  const handleConfirmClear = () => {
    onClearCheck();
    setClearAlertOpen(false);
  };

  const handleTableSelection = (tableId: string) => {
    onTableSelect(tableId);
  };

  if (!activeCheck) {
    return (
        <Card className="flex flex-col h-full items-center justify-center text-muted-foreground">
             <ShoppingCart className="w-16 h-16 mb-4"/>
             <p className="font-semibold">{t('noActiveCheck')}</p>
        </Card>
    )
  }

  return (
    <>
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="font-headline">{t('currentCheckTitle')}</CardTitle>
             {order.length > 0 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setClearAlertOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t('clearCheck')}</span>
                </Button>
            )}
          </div>
            {isCheckPristine && pristineChecks.length > 1 && (
                <Select value={activeCheck.id ?? ''} onValueChange={onSwitchCheck}>
                    <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder={t('selectCheck')} />
                    </SelectTrigger>
                    <SelectContent>
                        {pristineChecks.map(check => (
                            <SelectItem key={check.id} value={check.id}>
                                {check.name} ({t('itemCount', {count: check.items.length})})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
        <CardDescription>
            {t('editingCheck', {checkName: activeCheck.name})}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
        <Tabs 
            value={activeCheck.orderType || ""} 
            onValueChange={(value) => onUpdateCheckDetails({ orderType: value as OrderType })}
            className="w-full"
        >
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="Dine In">{t('dineIn')}</TabsTrigger>
                <TabsTrigger value="Take Away">{t('takeAway')}</TabsTrigger>
            </TabsList>
            <TabsContent value="Dine In" className="mt-4 space-y-2">
                <Label htmlFor="table-select">{t('table')}</Label>
                <Select
                    value={activeCheck.tableId || ''}
                    onValueChange={handleTableSelection}
                >
                    <SelectTrigger id="table-select">
                        <SelectValue placeholder={t('selectTable')} />
                    </SelectTrigger>
                    <SelectContent>
                        {tables.map(table => (
                            <SelectItem key={table.id} value={table.id}>
                                {table.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TabsContent>
            <TabsContent value="Take Away" className="mt-4">
                <Label htmlFor="customer-name">{t('customerName')}</Label>
                <Input 
                    id="customer-name" 
                    placeholder={t('customerNamePlaceholder')} 
                    value={activeCheck.customerName || ''}
                    onChange={(e) => onUpdateCheckDetails({ customerName: e.target.value })}
                />
            </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <div className="space-y-1">
            <Label>{t('appliedDiscount')}</Label>
            <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2 text-sm">
                <span className="font-medium text-muted-foreground">{selectedPriceList ? selectedPriceList.name : t('defaultPricing')}</span>
                <span className="font-bold text-primary">{discountPercentage > 0 ? t('discountPercentage', {discount: discountPercentage}) : t('noDiscount')}</span>
            </div>
        </div>


        <Separator className="my-4" />

        {order.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground flex-grow">
            <ShoppingCart className="w-16 h-16 mb-4"/>
            <p className="font-semibold">{t('emptyCheckTitle')}</p>
            <p className="text-sm">{t('emptyCheckDescription')}</p>
          </div>
        ) : (
          <div className="flex flex-col h-full flex-grow min-h-0">
            <ScrollArea className="flex-grow -mr-6 pr-6">
              <div className="space-y-4">

                {sentItems.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('sentToKitchen')}</h4>
                        <div className="space-y-2 text-sm pl-1">
                        {sentItems.map(item => (
                            <div key={item.lineItemId} className="flex justify-between items-center text-muted-foreground">
                            <div>
                                <span>{item.quantity} x {item.name}</span>
                                {item.customizations?.added && item.customizations.added.length > 0 && 
                                    <div className="flex flex-wrap gap-1 mt-1">
                                    {item.customizations.added.map(a => <Badge key={a.id} variant="secondary" className="font-normal capitalize shadow-sm text-xs h-4 px-1.5">+ {a.name}</Badge>)}
                                    </div>
                                }
                                 {item.customizations?.removed && item.customizations.removed.length > 0 && 
                                    <div className="flex flex-wrap gap-1 mt-1">
                                    {item.customizations.removed.map(r => <Badge key={r} variant="destructive" className="font-normal capitalize shadow-sm text-xs h-4 px-1.5">- {r}</Badge>)}
                                    </div>
                                }
                            </div>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                
                {sentItems.length > 0 && newItems.length > 0 && <Separator />}

                {newItems.length > 0 && (
                  <div>
                    {sentItems.length > 0 && <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('newItems')}</h4>}
                    <div className="space-y-2">
                        {newItems.map((item) => (
                        <div key={item.lineItemId} className="flex items-start py-3 border-b last:border-b-0 gap-4">
                            <Avatar className="w-14 h-14 rounded-md border">
                                <AvatarImage src={item.imageUrl} alt={item.name} />
                                <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <div className="flex items-start">
                                    <div className="flex-1 pr-2">
                                        <div className="flex items-center gap-2">
                                            <span title={t('newItem')} className="h-2 w-2 rounded-full bg-accent" />
                                            <p className="font-semibold leading-tight">{item.name}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-4">{t('eachPrice', {price: item.price.toFixed(2)})}</p>
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
                                        <Badge key={a.id} variant="secondary" className="font-normal capitalize shadow-sm">
                                            + {a.name}{a.price > 0 ? ` (+$${a.price.toFixed(2)})` : ''}
                                        </Badge>
                                    ))}
                                    </div>
                                    {item.ingredients && item.ingredients.length > 0 && (
                                    <div className="flex-shrink-0">
                                        <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground hover:text-primary" onClick={() => onCustomizeItem(item)}>
                                        <Settings2 className="h-3 w-3 mr-1.5"/>
                                        {t('customize')}
                                        </Button>
                                    </div>
                                    )}
                                </div>
                                )}
                            </div>
                        </div>
                        ))}
                    </div>
                  </div>
                )}
                 {newItems.length === 0 && sentItems.length > 0 && (
                    <div className="text-center text-muted-foreground py-6">
                        <p className="font-medium">{t('noNewItems')}</p>
                        <p className="text-xs">{t('addMoreItems')}</p>
                    </div>
                )}
              </div>
            </ScrollArea>
            <div className="mt-auto pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                 {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>{t('discountLabel', {percentage: discountPercentage})}</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('taxLabel', {rate: taxRate.toFixed(1)})}</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator className="my-2"/>
                <div className="flex justify-between font-bold text-lg">
                  <span>{t('total')}</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-6 border-t">
        {activeCheck.orderType === 'Dine In' && (
            <>
                <Button className="w-full" size="lg" onClick={onSendToKitchen} disabled={!hasNewItems}>
                    <Send className="mr-2 h-4 w-4" /> {t('sendToKitchen')}
                </Button>
                <Button className="w-full" variant="outline" onClick={onCloseCheck} disabled={order.length === 0 || hasNewItems}>
                    <CreditCard className="mr-2 h-4 w-4" /> {t('closeAndPay')}
                </Button>
            </>
        )}
        {activeCheck.orderType === 'Take Away' && (
             <Button className="w-full" size="lg" onClick={onSendToKitchen} disabled={order.length === 0}>
                <CreditCard className="mr-2 h-4 w-4" /> {t('finalizeAndPay')}
            </Button>
        )}
        {!activeCheck.orderType && (
            <Button className="w-full" size="lg" disabled>
                {t('selectOrderType')}
            </Button>
        )}
        <Button variant="outline" className="w-full" onClick={onNewCheck}>
          <FilePlus className="mr-2 h-4 w-4" /> {t('newCheck')}
        </Button>
      </CardFooter>
    </Card>
    
    <AlertDialog open={isClearAlertOpen} onOpenChange={setClearAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('clearAlertTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('clearAlertDescription')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmClear}>{t('confirmClear')}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
