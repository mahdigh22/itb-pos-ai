'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ActiveOrder, OrderItem, RestaurantTable } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';


export default function ReportsClient({ initialOrders, tables }: { initialOrders: ActiveOrder[], tables: RestaurantTable[] }) {
    const [orders, setOrders] = useState<ActiveOrder[]>(initialOrders);
    const [filterText, setFilterText] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterTable, setFilterTable] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    useEffect(() => {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
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
        });

        return () => unsubscribe();
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            if (dateRange?.from && orderDate < startOfDay(dateRange.from)) return false;
            if (dateRange?.to && orderDate > endOfDay(dateRange.to)) return false;
            
            if (filterType !== 'all' && order.orderType !== filterType) return false;
            if (filterType === 'Dine In' && filterTable !== 'all' && order.tableId !== filterTable) return false;

            if (filterText) {
                const searchText = filterText.toLowerCase();
                const matchesId = order.id.toLowerCase().includes(searchText);
                const matchesCheckName = order.checkName.toLowerCase().includes(searchText);
                const matchesCustomerName = order.customerName?.toLowerCase().includes(searchText);
                return matchesId || matchesCheckName || (matchesCustomerName || false);
            }
            return true;
        });
    }, [orders, filterText, filterType, filterTable, dateRange]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Order Reports</h1>
                <p className="text-muted-foreground">Browse and filter all historical orders.</p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center gap-4">
                        <Input 
                            placeholder="Filter by ID, check name, customer..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="max-w-sm"
                        />
                        <div className="flex gap-4">
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-[300px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pick a date range</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Order Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Dine In">Dine In</SelectItem>
                                    <SelectItem value="Take Away">Take Away</SelectItem>
                                </SelectContent>
                            </Select>
                            {filterType === 'Dine In' && (
                                <Select value={filterTable} onValueChange={setFilterTable}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Table" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Tables</SelectItem>
                                        {tables.map(table => (
                                            <SelectItem key={table.id} value={table.id}>{table.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead>Order Details</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length > 0 ? filteredOrders.map(order => (
                                <OrderRow key={order.id} order={order} />
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No matching orders found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function OrderRow({ order }: { order: ActiveOrder }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Collapsible asChild>
            <>
            <TableRow>
                <TableCell>
                     <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span className="sr-only">Toggle details</span>
                        </Button>
                    </CollapsibleTrigger>
                </TableCell>
                <TableCell>
                    <div className="font-medium">{order.checkName} - #{order.id.slice(-6)}</div>
                    <div className="text-sm text-muted-foreground">
                        {order.orderType === 'Dine In' ? `Table: ${order.tableName}` : `Customer: ${order.customerName || 'N/A'}`}
                    </div>
                </TableCell>
                <TableCell><Badge variant="outline">{order.orderType}</Badge></TableCell>
                <TableCell>{format(new Date(order.createdAt), "PPpp")}</TableCell>
                <TableCell><Badge>{order.status}</Badge></TableCell>
                <TableCell className="text-right font-medium">${order.total.toFixed(2)}</TableCell>
            </TableRow>
            <CollapsibleContent asChild>
                <TableRow>
                    <TableCell colSpan={6}>
                        <div className="p-4 bg-muted/50 rounded-md">
                            <h4 className="font-semibold mb-2">Order Items:</h4>
                            <ul className="space-y-1 text-sm">
                                {order.items.map((item: OrderItem) => (
                                    <li key={item.lineItemId} className="flex justify-between">
                                        <span>{item.quantity} x {item.name}</span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                            {order.discountApplied && order.discountApplied > 0 && (
                                <>
                                <div className="border-t my-2"></div>
                                <div className="flex justify-between font-semibold text-green-600">
                                    <span>Discount Applied</span>
                                    <span>{order.discountApplied}%</span>
                                </div>
                                </>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            </CollapsibleContent>
            </>
        </Collapsible>
    )
}
