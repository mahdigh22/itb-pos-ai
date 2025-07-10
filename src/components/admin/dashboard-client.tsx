
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ActiveOrder } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { collection, onSnapshot, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { DollarSign, ShoppingCart, Percent, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardClient({ initialOrders }: { initialOrders: ActiveOrder[] }) {
    const [orders, setOrders] = useState<ActiveOrder[]>(initialOrders);

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

    const reportData = useMemo(() => {
        const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalPrepTime = orders.reduce((acc, order) => acc + (order.totalPreparationTime || 0), 0);
        const averagePrepTime = totalOrders > 0 ? totalPrepTime / totalOrders : 0;
        
        const totalProfit = orders.reduce((profitAcc, order) => {
            const orderSubtotal = order.items.reduce((subtotalAcc, item) => {
                const extrasPrice = item.customizations?.added?.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
                return subtotalAcc + (item.price + extrasPrice) * item.quantity;
            }, 0);

            const discountAmount = orderSubtotal * ((order.discountApplied || 0) / 100);
            const orderRevenue = orderSubtotal - discountAmount;

            const orderCost = order.items.reduce((costAcc, item) => {
                return costAcc + (item.cost || 0) * item.quantity;
            }, 0);
            
            const orderProfit = orderRevenue - orderCost;
            return profitAcc + orderProfit;
        }, 0);

        const orderTypeCounts = orders.reduce((acc, order) => {
            const type = order.orderType || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const orderTypeData = Object.entries(orderTypeCounts).map(([name, value]) => ({ name, value }));
        
        const topSellingItems = orders
            .flatMap(order => order.items)
            .reduce((acc, item) => {
                const existing = acc.get(item.name);
                if (existing) {
                    existing.quantity += item.quantity;
                    existing.revenue += item.price * item.quantity;
                } else {
                    acc.set(item.name, {
                        name: item.name,
                        quantity: item.quantity,
                        revenue: item.price * item.quantity
                    });
                }
                return acc;
            }, new Map<string, {name: string, quantity: number, revenue: number}>());

        const sortedTopItems = Array.from(topSellingItems.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        const revenueByDay = orders.reduce((acc, order) => {
            const day = format(order.createdAt, 'yyyy-MM-dd');
            acc[day] = (acc[day] || 0) + order.total;
            return acc;
        }, {} as Record<string, number>);

        const dailyRevenueData = Object.entries(revenueByDay)
            .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-30);

        return {
            totalRevenue,
            totalOrders,
            averageOrderValue,
            averagePrepTime,
            orderTypeData,
            sortedTopItems,
            dailyRevenueData,
            totalProfit,
        };
    }, [orders]);
    
    const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

    const chartConfig = {
        revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
        'Dine In': { label: "Dine In", color: "hsl(var(--chart-1))" },
        'Take Away': { label: "Take Away", color: "hsl(var(--chart-2))" },
        'Unknown': { label: "Unknown", color: "hsl(var(--chart-3))" }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
                <p className="text-muted-foreground">A real-time overview of your restaurant's performance.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${reportData.totalRevenue.toFixed(2)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Profit</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${reportData.totalProfit.toFixed(2)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Orders</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reportData.totalOrders}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle><Percent className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${reportData.averageOrderValue.toFixed(2)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg. Prep Time</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reportData.averagePrepTime.toFixed(1)} min</div></CardContent></Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader><CardTitle>Revenue Over Time</CardTitle><CardDescription>Showing revenue for the last 30 days.</CardDescription></CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                           <ResponsiveContainer>
                                <BarChart data={reportData.dailyRevenueData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => format(new Date(value), "MMM d")}/>
                                    <YAxis tickFormatter={(value) => `$${value}`} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader><CardTitle>Order Types</CardTitle><CardDescription>Breakdown of orders by type.</CardDescription></CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <ChartContainer config={chartConfig} className="h-[200px] w-full max-w-[300px]">
                            <ResponsiveContainer>
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={reportData.orderTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                         {reportData.orderTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top Selling Items</CardTitle>
                    <CardDescription>Your most popular menu items by quantity sold.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead className="text-right">Quantity Sold</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.sortedTopItems.map((item) => (
                                <TableRow key={item.name}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">${item.revenue.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                             {reportData.sortedTopItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No sales data available yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
