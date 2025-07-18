
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ActiveOrder, OrderItem, RestaurantTable, Admin } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';
import { getTables } from '@/app/admin/tables/actions';

export default function ReportsClient() {
    const [orders, setOrders] = useState<ActiveOrder[]>([]);
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

    const [filterText, setFilterText] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterTable, setFilterTable] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    useEffect(() => {
        const adminData = localStorage.getItem('currentAdmin');
        if (adminData) {
            const admin = JSON.parse(adminData);
            setCurrentAdmin(admin);

            const ordersQuery = query(collection(db, 'restaurants', admin.restaurantId, 'orders'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
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

            getTables(admin.restaurantId).then(tablesData => {
                setTables(tablesData);
            });

            setIsLoading(false);
            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
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
                const matchesEmployeeName = order.employeeName?.toLowerCase().includes(searchText);
                return matchesId || matchesCheckName || (matchesCustomerName || false) || (matchesEmployeeName || false);
            }
            return true;
        });
    }, [orders, filterText, filterType, filterTable, dateRange]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

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
                            placeholder="Filter by ID, name, employee..."
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
                                <TableHead>Server</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                            {filteredOrders.length > 0 ? filteredOrders.map(order => (
                                <OrderRow key={order.id} order={order} />
                            )) : (
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">No matching orders found.</TableCell>
                                    </TableRow>
                                </TableBody>
                            )}
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function OrderRow({ order }: { order: ActiveOrder }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Collapsible asChild open={isOpen} onOpenChange={setIsOpen}>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon">
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
                    <TableCell>{order.employeeName || 'N/A'}</TableCell>
                    <TableCell className="text-right font-medium">${order.total.toFixed(2)}</TableCell>
                </TableRow>
                <CollapsibleContent asChild>
                     <tr className="bg-muted/50 hover:bg-muted/50">
                        <td colSpan={7}>
                            <div className="p-4">
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
                        </td>
                    </tr>
                </CollapsibleContent>
            </TableBody>
        </Collapsible>
    )
}
