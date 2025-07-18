
"use server";

import {
  collection,
  getDocs,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ActiveOrder } from "@/lib/types";

export async function getOrdersForReports(restaurantId: string): Promise<ActiveOrder[]> {
  try {
    if (!restaurantId) return [];
    const q = query(collection(db, "restaurants", restaurantId, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const orders: ActiveOrder[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        items: data.items,
        status: data.status,
        total: data.total,
        checkName: data.checkName,
        createdAt: (data.createdAt as Timestamp).toDate(),
        totalPreparationTime: data.totalPreparationTime,
        orderType: data.orderType,
        tableId: data.tableId,
        tableName: data.tableName,
        customerName: data.customerName,
        priceListId: data.priceListId,
        discountApplied: data.discountApplied,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
      });
    });
    return orders;
  } catch (error) {
    console.error("Error fetching orders for reports: ", error);
    return [];
  }
}
