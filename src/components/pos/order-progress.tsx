

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  CheckCircle,
  Package,
  Soup,
  ClipboardList,
  UtensilsCrossed,
  ShoppingBag,
  MoreVertical,
  Edit,
  Ban,
  Hourglass,
} from "lucide-react";
import type {
  ActiveOrder,
  OrderItem,
  OrderStatus,
  RestaurantTable,
  Extra,
  MenuItem,
} from "@/lib/types";
import { formatDistanceToNowStrict } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
  doc as firestoreDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import CustomizeItemDialog from "./customize-item-dialog";
import { editOrderItem, cancelOrderItem } from "@/app/pos/actions";
import { getExtras } from "@/app/admin/extras/actions";
import { getMenuItems } from "@/app/admin/menu/actions";

interface OrderProgressProps {
  onCompleteOrder: (orderId: string) => void;
  onClearOrder: (orderId: string) => void;
  tables: RestaurantTable[];
}

const statusConfig: Record<
  OrderStatus,
  {
    text: string;
    icon: React.ElementType;
    badgeVariant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  Pending: { text: "Pending", icon: Hourglass, badgeVariant: "secondary" },
  Preparing: { text: "Preparing", icon: Soup, badgeVariant: "secondary" },
  Ready: { text: "Ready", icon: Package, badgeVariant: "outline" },
  Completed: { text: "Completed", icon: CheckCircle, badgeVariant: "default" },
  Archived: { text: "Archived", icon: CheckCircle, badgeVariant: "default" }, // Should not be visible
};

const PENDING_DURATION = 2 * 60 * 1000; // 2 minutes

function OrderCard({
  order,
  onCompleteOrder,
  onClearOrder,
  onEditItem,
  onCancelItem,
}: {
  order: ActiveOrder;
  onCompleteOrder: (id: string) => void;
  onClearOrder: (id: string) => void;
  onEditItem: (orderId: string, item: OrderItem) => void;
  onCancelItem: (orderId: string, item: OrderItem) => void;
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startTime = new Date(order.createdAt).getTime();
  const pendingEndTime = startTime + PENDING_DURATION;
  const isPending = order.status === 'Pending' && currentTime.getTime() < pendingEndTime;

  const prepStartTime = isPending ? pendingEndTime : startTime;
  const totalDuration = order.totalPreparationTime * 60 * 1000; // in milliseconds
  const prepEndTime = prepStartTime + totalDuration;
  const elapsedTime = currentTime.getTime() - prepStartTime;
  
  const activeItems = order.items.filter(
    (i) => i.status !== "cancelled" && i.status !== "edited"
  );

  let currentStatus: OrderStatus;
  let progress = 0;

  if (order.status === "Completed" || order.status === "Archived") {
    currentStatus = "Completed";
    progress = 100;
  } else if (isPending) {
    currentStatus = "Pending";
    progress = 0;
  } else {
    progress = Math.min(100, (elapsedTime / totalDuration) * 100);
    currentStatus = progress >= 100 ? "Ready" : "Preparing";
  }

  const config = statusConfig[currentStatus];

  return (
    <div className="p-4 border rounded-lg space-y-3 transition-all bg-card/50">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            {order.orderType === "Dine In" && (
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            )}
            {order.orderType === "Take Away" && (
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            )}
            <p className="font-semibold">
              {order.checkName} - #{order.id.slice(-6)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground pl-6">
            {order.orderType === "Dine In" &&
              `Table: ${order.tableName || "N/A"}`}
            {order.orderType === "Take Away" &&
              `For ${order.customerName || "N/A"}`}
            {" · "}
            Total: ${order.total.toFixed(2)}
            {order.discountApplied && order.discountApplied > 0 && (
              <span className="text-green-600 dark:text-green-400 font-medium">
                {" "}
                ({order.discountApplied}% off)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={config.badgeVariant}
            className={cn(
              currentStatus === "Completed"
                ? "bg-green-600 text-white border-transparent hover:bg-green-700"
                : "",
              currentStatus === "Ready" &&
                "bg-blue-600 text-white border-transparent hover:bg-blue-700"
            )}
          >
            <config.icon className="h-3 w-3 mr-1.5" />
            {config.text}
          </Badge>
          {currentStatus === "Ready" && (
            <Button size="sm" onClick={() => onCompleteOrder(order.id)}>
              <CheckCircle className="h-4 w-4 mr-2" /> Mark Completed
            </Button>
          )}
          {currentStatus === "Completed" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onClearOrder(order.id)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear Order</span>
            </Button>
          )}
        </div>
      </div>
      <div className="pl-6 space-y-2">
        {order.items.map((item) => (
          <div
            key={item.lineItemId}
            className="flex items-center justify-between text-sm"
          >
            <div>
              <div
                className={cn(
                  "flex items-center gap-2",
                  item.status === "cancelled" && "text-red-500 line-through",
                  item.status === "edited" && "text-amber-500 line-through"
                )}
              >
                <span className="font-medium">{item.quantity}x</span>
                <span>{item.name}</span>
                 {item.status === 'edited' && (
                  <Badge variant="outline" className="h-5 text-xs font-normal border-amber-500 text-amber-500">Edited</Badge>
                )}
                {item.status === 'cancelled' && (
                  <Badge variant="outline" className="h-5 text-xs font-normal border-red-500 text-red-500">Cancelled</Badge>
                )}
              </div>
              <div className="flex-grow flex flex-wrap gap-1 mt-1">
                {item.customizations?.removed?.map((r, index) => (
                  <Badge
                    key={`${r.id}-${index}`}
                    variant="destructive"
                    className="font-normal capitalize shadow-sm"
                  >
                    - {r.name}
                  </Badge>
                ))}
                {item.customizations?.added?.map((a) => (
                  <Badge
                    key={a.id}
                    variant="secondary"
                    className="font-normal capitalize shadow-sm"
                  >
                    + {a.name}
                    {a.price > 0 ? ` (+$${a.price.toFixed(2)})` : ""}
                  </Badge>
                ))}
              </div>
            </div>

            {isPending &&
              item.status !== "cancelled" &&
              item.status !== "edited" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => onEditItem(order.id, item)}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onCancelItem(order.id, item)}
                    >
                      <Ban className="mr-2 h-4 w-4" /> Cancel Item
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        ))}
      </div>
      {activeItems.length > 0 && currentStatus !== "Pending" && (
        <div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5 text-right">
            {currentStatus === "Preparing" &&
              prepEndTime > currentTime.getTime() &&
              `Ready in approx. ${formatDistanceToNowStrict(prepEndTime)}`}
            {currentStatus === "Ready" && "Ready for pickup!"}
            {currentStatus === "Completed" && "Order collected."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function OrderProgress({
  onCompleteOrder,
  onClearOrder,
  tables,
}: OrderProgressProps) {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [filter, setFilter] = useState<"all" | "Dine In" | "Take Away">("all");
  const [selectedTableId, setSelectedTableId] = useState<string>("all");
  const { toast } = useToast();

  const [customizingItem, setCustomizingItem] = useState<{
    orderId: string;
    item: OrderItem;
  } | null>(null);
  const [availableExtras, setAvailableExtras] = useState<Extra[]>([]);
  const [menuItemsMap, setMenuItemsMap] = useState<Map<string, MenuItem>>(
    new Map()
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      const extras = await getExtras();
      setAvailableExtras(extras);
      const menuItems = await getMenuItems();
      const map = new Map<string, MenuItem>();
      menuItems.forEach((item) => map.set(item.id, item));
      setMenuItemsMap(map);
    };
    fetchInitialData();

    const q = query(
      collection(db, "orders"),
      where("status", "in", ["Pending", "Preparing", "Ready", "Completed"])
    );
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const liveOrders: ActiveOrder[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          liveOrders.push({
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
          } as ActiveOrder);
        });
        setOrders(
          liveOrders.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          )
        );
      },
      (error) => {
        console.error("Error in orders snapshot listener: ", error);
        toast({
          variant: "destructive",
          title: "Real-time Update Error",
          description:
            "Could not fetch live order updates. Please check console for details.",
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (filter !== "Dine In") {
      setSelectedTableId("all");
    }
  }, [filter]);

  const handleEditItem = async (orderId: string, item: OrderItem) => {
    const fullMenuItemData = menuItemsMap.get(item.id);
    if (!fullMenuItemData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find original menu item details to edit.",
      });
      return;
    }
    const itemWithFullDetails: OrderItem = {
      ...item,
      ingredients: fullMenuItemData.ingredients,
    };

    setCustomizingItem({ orderId, item: itemWithFullDetails });
  };

  const handleCancelItem = async (orderId: string, item: OrderItem) => {
    const result = await cancelOrderItem(orderId, item.lineItemId);
    if (result.success) {
      toast({
        title: "Item Cancelled",
        description: `${item.name} has been cancelled from the order.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
  };

  const handleSaveCustomization = async (
    lineItemId: string,
    customizations: { added: Extra[]; removed: { id: string; name: string }[] }
  ) => {
    if (!customizingItem) return;

    const { orderId, item } = customizingItem;

    const updatedItem: OrderItem = {
      ...item,
      customizations,
      status: "sent",
      lineItemId: `${item.id}-${Date.now()}`,
    };

    const result = await editOrderItem(orderId, item.lineItemId, updatedItem);

    if (result.success) {
      toast({
        title: "Item Edited",
        description: `Changes to ${item.name} have been sent to the kitchen.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
    setCustomizingItem(null);
  };

  const filteredOrders = orders.filter((order) => {
    if (order.status === "Archived") return false;

    if (filter !== "all" && order.orderType !== filter) {
      return false;
    }
    if (
      filter === "Dine In" &&
      selectedTableId !== "all" &&
      order.tableId !== selectedTableId
    ) {
      return false;
    }
    return true;
  });

  const visibleOrders = orders.filter((o) => o.status !== "Archived");

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
              <CardTitle className="font-headline">Order Progress</CardTitle>
              <CardDescription>
                Track active and recently completed orders in real-time.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select
                value={filter}
                onValueChange={(value) => setFilter(value as any)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="Dine In">Dine In</SelectItem>
                  <SelectItem value="Take Away">Take Away</SelectItem>
                </SelectContent>
              </Select>
              {filter === "Dine In" && (
                <Select
                  value={selectedTableId}
                  onValueChange={setSelectedTableId}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {tables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name}
                      </SelectItem>
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
              <ClipboardList className="w-16 h-16 mb-4" />
              <p className="font-semibold">No active orders</p>
              <p className="text-sm">
                Place a new order to see its progress here.
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center text-muted-foreground flex-grow flex flex-col justify-center items-center">
              <ClipboardList className="w-16 h-16 mb-4" />
              <p className="font-semibold text-lg">No orders match filter</p>
              <p className="text-sm">Try adjusting your filter settings.</p>
            </div>
          ) : (
            <ScrollArea className="h-full w-full pr-4">
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onCompleteOrder={onCompleteOrder}
                    onClearOrder={onClearOrder}
                    onEditItem={handleEditItem}
                    onCancelItem={handleCancelItem}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <CustomizeItemDialog
        item={customizingItem?.item ?? null}
        availableExtras={availableExtras}
        onClose={() => setCustomizingItem(null)}
        onSave={handleSaveCustomization}
      />
    </>
  );
}
