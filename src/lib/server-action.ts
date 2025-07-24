"use server";

import {
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  collection,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";
import { ActiveOrder, Check, OrderItem } from "./types";
import { revalidatePath } from "next/cache";

// Server is always online - no offline checks needed
export async function serverAdd(path: string, data: any) {
  const colRef = collection(db, path);
  return await addDoc(colRef, data);
}

export async function serverUpdate(path: string, data: any) {
  const docRef = doc(db, path);
  return await updateDoc(docRef, data);
}

export async function serverDelete(path: string) {
  const docRef = doc(db, path);
  return await deleteDoc(docRef);
}
export async function serverCancelOrderItem(
  restaurantId: string,
  orderId: string,
  lineItemId: string
) {
  const orderRef = doc(db, "restaurants", restaurantId, "orders", orderId);

  try {
    await runTransaction(db, async (transaction) => {
      // Step 1: Read order
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) throw new Error("Order not found.");
      const orderData = orderDoc.data() as ActiveOrder;

      let itemToCancel: OrderItem | undefined;
      const updatedItems = orderData.items.map((item) => {
        if (item.lineItemId === lineItemId) {
          itemToCancel = item;
          return { ...item, status: "cancelled" as const };
        }
        return item;
      });

      // Step 2: Prepare ingredient reads
      const ingredientUsage = new Map<string, number>();
      if (itemToCancel?.ingredientLinks) {
        for (const link of itemToCancel.ingredientLinks) {
          const qty = ingredientUsage.get(link.ingredientId) || 0;
          ingredientUsage.set(
            link.ingredientId,
            qty + link.quantity * itemToCancel.quantity
          );
        }
      }

      const ingredientIds = Array.from(ingredientUsage.keys());
      const ingredientRefs = ingredientIds.map((id) =>
        doc(db, "restaurants", restaurantId, "ingredients", id)
      );
      const ingredientDocs = await Promise.all(
        ingredientRefs.map((ref) => transaction.get(ref))
      );

      // Step 3: Read check (must happen before any writes)
      let updatedCheckItems: Check["items"] | null = null;
      if (orderData.sourceCheckId) {
        const checkRef = doc(
          db,
          "restaurants",
          restaurantId,
          "checks",
          orderData.sourceCheckId
        );
        const checkDoc = await transaction.get(checkRef);
        if (checkDoc.exists()) {
          const checkData = checkDoc.data() as Check;
          updatedCheckItems = checkData.items.map((item) =>
            item.lineItemId === lineItemId
              ? { ...item, status: "cancelled" as const }
              : item
          );
        }
      }

      // Step 4: Write updates to ingredient stocks
      for (let i = 0; i < ingredientDocs.length; i++) {
        const ingDoc = ingredientDocs[i];
        if (ingDoc.exists()) {
          const newStock =
            (ingDoc.data().stock || 0) + (ingredientUsage.get(ingDoc.id) || 0);
          transaction.update(ingDoc.ref, { stock: newStock });
        }
      }

      // Step 5: Update order
      transaction.update(orderRef, { items: updatedItems });

      // Step 6: Update check (if needed)
      if (orderData.sourceCheckId && updatedCheckItems) {
        const checkRef = doc(
          db,
          "restaurants",
          restaurantId,
          "checks",
          orderData.sourceCheckId
        );
        transaction.update(checkRef, { items: updatedCheckItems });
      }
    });

    revalidatePath("/");
    revalidatePath("/admin/ingredients");
    return { success: true };
  } catch (e) {
    console.error("Error cancelling order item: ", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred.",
    };
  }
}
