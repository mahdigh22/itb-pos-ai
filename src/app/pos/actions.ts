"use server";

import { revalidatePath } from "next/cache";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  query,
  orderBy,
  deleteDoc,
  updateDoc,
  runTransaction,
  where,
  documentId,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  ActiveOrder,
  Check,
  Employee,
  Extra,
  Ingredient,
  OrderItem,
  OrderStatus,
  PriceList,
} from "@/lib/types";
import { safeAdd } from "@/lib/offlineSync";

// Check Actions
export async function getChecks(restaurantId: string): Promise<Check[]> {
  try {
    if (!restaurantId) return [];
    const querySnapshot = await getDocs(
      collection(db, "restaurants", restaurantId, "checks")
    );
    const checks: Check[] = [];
    querySnapshot.forEach((doc) => {
      checks.push({ id: doc.id, ...doc.data() } as Check);
    });
    return checks.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching checks: ", error);
    return [];
  }
}

export async function addCheck(
  restaurantId: string,
  check: Omit<Check, "id">
): Promise<Check> {
  // const docRef = await addDoc(
  //   collection(db, "restaurants", restaurantId, "checks"),
  //   check
  // );
  const docRef = await safeAdd(`restaurants/${restaurantId}/checks`, check);
  revalidatePath("/");
  return { id: docRef.id, ...check };
}

export async function updateCheck(
  restaurantId: string,
  checkId: string,
  updates: Partial<Omit<Check, "id">>
) {
  try {
    const checkRef = doc(db, "restaurants", restaurantId, "checks", checkId);
    await updateDoc(checkRef, updates);
    return { success: true };
  } catch (e) {
    console.error("Error updating check: ", e);
    return { success: false, error: "Failed to update check." };
  }
}

export async function deleteCheck(restaurantId: string, checkId: string) {
  try {
    await deleteDoc(doc(db, "restaurants", restaurantId, "checks", checkId));
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error deleting check: ", e);
    return { success: false, error: "Failed to delete check." };
  }
}

// Order Actions

async function deductStockForItems(
  restaurantId: string,
  items: OrderItem[],
  transaction: any
) {
  const ingredientUsage = new Map<string, number>();

  items.forEach((item) => {
    const removedIngredientIds = new Set(
      item.customizations.removed.map((r) => r.id)
    );

    if (item.ingredientLinks) {
      item.ingredientLinks.forEach((link) => {
        if (!removedIngredientIds.has(link.ingredientId)) {
          const currentQuantity = ingredientUsage.get(link.ingredientId) || 0;
          ingredientUsage.set(
            link.ingredientId,
            currentQuantity + link.quantity * item.quantity
          );
        }
      });
    }
    if (item.customizations?.added) {
      item.customizations.added.forEach((extra) => {
        if (extra.ingredientLinks) {
          extra.ingredientLinks.forEach((link) => {
            const currentQuantity = ingredientUsage.get(link.ingredientId) || 0;
            ingredientUsage.set(
              link.ingredientId,
              currentQuantity + link.quantity * item.quantity
            );
          });
        }
      });
    }
  });

  if (ingredientUsage.size === 0) return;

  const ingredientIds = Array.from(ingredientUsage.keys());
  if (ingredientIds.length === 0) return;

  const ingredientRefs = ingredientIds.map((id) =>
    doc(db, "restaurants", restaurantId, "ingredients", id)
  );
  const ingredientDocs = await Promise.all(
    ingredientRefs.map((ref) => transaction.get(ref))
  );

  const stockUpdates: { ref: any; newStock: number }[] = [];
  for (let i = 0; i < ingredientDocs.length; i++) {
    const ingredientDoc = ingredientDocs[i];
    const ingredientId = ingredientIds[i];

    if (!ingredientDoc.exists()) {
      throw new Error(`Ingredient with ID ${ingredientId} not found.`);
    }

    const ingredientData = ingredientDoc.data() as Ingredient;
    const requiredStock = ingredientUsage.get(ingredientId)!;

    if (ingredientData.stock < requiredStock) {
      throw new Error(
        `Insufficient stock for ${ingredientData.name}. Required: ${requiredStock}, Available: ${ingredientData.stock}`
      );
    }

    stockUpdates.push({
      ref: ingredientDoc.ref,
      newStock: ingredientData.stock - requiredStock,
    });
  }

  stockUpdates.forEach((update) => {
    transaction.update(update.ref, { stock: update.newStock });
  });
}

export async function sendNewItemsToKitchen(
  restaurantId: string,
  checkId: string
) {
  const sourceCheckRef = doc(
    db,
    "restaurants",
    restaurantId,
    "checks",
    checkId
  );
  let targetCheckId: string | null = null;

  const sourceCheckSnap = await getDoc(sourceCheckRef);
  if (!sourceCheckSnap.exists())
    return { success: false, error: "Check not found." };
  const sourceCheck = {
    id: sourceCheckSnap.id,
    ...sourceCheckSnap.data(),
  } as Check;

  if (sourceCheck.orderType === "Dine In" && sourceCheck.tableId) {
    const q = query(
      collection(db, "restaurants", restaurantId, "checks"),
      where("tableId", "==", sourceCheck.tableId),
      where(documentId(), "!=", sourceCheck.id)
    );
    const existingChecksSnap = await getDocs(q);
    if (existingChecksSnap.docs.length > 0) {
      targetCheckId = existingChecksSnap.docs[0].id;
    }
  }

  try {
    await runTransaction(db, async (transaction) => {
      const settingsDocRef = doc(
        db,
        "restaurants",
        restaurantId,
        "settings",
        "main"
      );
      const freshSourceSnap = await transaction.get(sourceCheckRef);
      const settingsDoc = await transaction.get(settingsDocRef);

      let freshTargetSnap: any = null;
      let targetCheckRef: any = null;
      if (targetCheckId) {
        targetCheckRef = doc(
          db,
          "restaurants",
          restaurantId,
          "checks",
          targetCheckId
        );
        freshTargetSnap = await transaction.get(targetCheckRef);
      }

      if (!freshSourceSnap.exists()) {
        throw new Error("Source check was deleted during operation.");
      }

      const freshSourceCheck = {
        id: freshSourceSnap.id,
        ...freshSourceSnap.data(),
      } as Check;
      const newItemsToProcess = freshSourceCheck.items.filter(
        (item) => item.status === "new"
      );

      if (newItemsToProcess.length === 0) {
        return;
      }

      await deductStockForItems(restaurantId, newItemsToProcess, transaction);

      const settings = settingsDoc.exists()
        ? settingsDoc.data()!
        : { taxRate: 0, priceLists: [] };
      const taxRate = settings.taxRate || 0;
      const priceLists: PriceList[] = settings.priceLists || [];

      const newSanitizedItems = newItemsToProcess.map((item) => {
        const { ingredients, ...rest } = item;
        const cost = item.cost || 0;
        return { ...rest, cost };
      });

      const finalCheckDataForOrder = freshTargetSnap?.exists()
        ? ({ ...freshTargetSnap.data(), id: freshTargetSnap.id } as Check)
        : freshSourceCheck;

      const subtotal = newSanitizedItems.reduce((acc, item) => {
        const extrasPrice =
          item.customizations?.added.reduce(
            (extraAcc, extra) => extraAcc + extra.price,
            0
          ) || 0;
        const totalItemPrice = (item.price + extrasPrice) * item.quantity;
        return acc + totalItemPrice;
      }, 0);

      const selectedPriceList = priceLists.find(
        (pl) => pl.id === finalCheckDataForOrder.priceListId
      );
      const discountPercentage = selectedPriceList?.discount || 0;
      const discountAmount = subtotal * (discountPercentage / 100);
      const discountedSubtotal = subtotal - discountAmount;
      const tax = discountedSubtotal * (taxRate / 100);
      const total = discountedSubtotal + tax;
      const totalPreparationTime = newSanitizedItems.reduce(
        (acc, item) => acc + (item.preparationTime || 5) * item.quantity,
        0
      );

      const newOrderData = {
        items: newSanitizedItems,
        status: "Pending" as OrderStatus,
        total: total,
        createdAt: Timestamp.now(),
        sourceCheckId: finalCheckDataForOrder.id,
        checkName: `${finalCheckDataForOrder.name} (Batch)`,
        totalPreparationTime,
        orderType: finalCheckDataForOrder.orderType,
        tableId: finalCheckDataForOrder.tableId || null,
        tableName: finalCheckDataForOrder.tableName || null,
        customerName: finalCheckDataForOrder.customerName || null,
        priceListId: finalCheckDataForOrder.priceListId || null,
        discountApplied: discountPercentage,
        employeeId: finalCheckDataForOrder.employeeId || null,
        employeeName: finalCheckDataForOrder.employeeName || null,
      };

      const newOrderRef = doc(
        collection(db, "restaurants", restaurantId, "orders")
      );

      transaction.set(newOrderRef, newOrderData);

      if (targetCheckRef && freshTargetSnap?.exists()) {
        if (!freshTargetSnap.exists())
          throw new Error("Target check was deleted during operation.");
        const targetCheck = {
          id: freshTargetSnap.id,
          ...freshTargetSnap.data(),
        } as Check;
        const itemsToMerge = newItemsToProcess.map((item) => ({
          ...item,
          status: "sent" as const,
        }));
        const mergedItems = [...targetCheck.items, ...itemsToMerge];

        transaction.update(targetCheckRef, { items: mergedItems });
        transaction.delete(sourceCheckRef);
      } else {
        const updatedItems = freshSourceCheck.items.map((item) =>
          item.status === "new" ? { ...item, status: "sent" as const } : item
        );
        transaction.update(sourceCheckRef, { items: updatedItems });
      }
    });

    revalidatePath("/");
    revalidatePath("/admin/ingredients");
    return { success: true };
  } catch (e) {
    console.error("Error in transaction for sending items to kitchen: ", e);
    if (e instanceof Error) {
      return { success: false, error: e.message };
    }
    return { success: false, error: "An unknown error occurred." };
  }
}

export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  status: OrderStatus
) {
  const orderRef = doc(db, "restaurants", restaurantId, "orders", orderId);
  try {
    await runTransaction(db, async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Order not found.");
      }

      transaction.update(orderRef, { status });

      const orderData = orderDoc.data();
      if (
        status === "Completed" &&
        orderData.orderType === "Take Away" &&
        orderData.sourceCheckId
      ) {
        const checkRef = doc(
          db,
          "restaurants",
          restaurantId,
          "checks",
          orderData.sourceCheckId
        );
        transaction.delete(checkRef);
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error updating order status: ", e);
    if (e instanceof Error) {
      return { success: false, error: e.message };
    }
    return { success: false, error: "Failed to update order status." };
  }
}

export async function getOrders(restaurantId: string): Promise<ActiveOrder[]> {
  try {
    if (!restaurantId) return [];
    const q = query(
      collection(db, "restaurants", restaurantId, "orders"),
      where("status", "in", ["Pending", "Preparing", "Ready", "Completed"]),
      orderBy("status"),
      orderBy("createdAt", "desc")
    );
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
        sourceCheckId: data.sourceCheckId,
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
    console.error("Error fetching orders: ", error);
    return [];
  }
}

export async function archiveOrder(restaurantId: string, orderId: string) {
  try {
    const orderRef = doc(db, "restaurants", restaurantId, "orders", orderId);
    await updateDoc(orderRef, { status: "Archived" });
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error archiving order: ", e);
    return { success: false, error: "Failed to archive order." };
  }
}

export async function cancelOrderItem(
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

export async function editOrderItem(
  restaurantId: string,
  orderId: string,
  oldLineItemId: string,
  newItem: OrderItem
) {
  const orderRef = doc(db, "restaurants", restaurantId, "orders", orderId);

  try {
    await runTransaction(db, async (transaction) => {
      // READS
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) throw new Error("Order not found.");

      const orderData = orderDoc.data() as ActiveOrder;
      const oldItem = orderData.items.find(
        (i) => i.lineItemId === oldLineItemId
      );
      if (!oldItem)
        throw new Error("Original item to edit not found in order.");

      let checkDoc: any = null;
      if (orderData.sourceCheckId) {
        const checkRef = doc(
          db,
          "restaurants",
          restaurantId,
          "checks",
          orderData.sourceCheckId
        );
        checkDoc = await transaction.get(checkRef);
      }

      const oldIngredients = new Map<string, number>();
      const newIngredients = new Map<string, number>();
      const quantity = oldItem.quantity;

      oldItem.ingredientLinks.forEach((link) => {
        if (
          !oldItem.customizations.removed.some(
            (r) => r.id === link.ingredientId
          )
        ) {
          oldIngredients.set(
            link.ingredientId,
            (oldIngredients.get(link.ingredientId) || 0) +
              link.quantity * quantity
          );
        }
      });
      oldItem.customizations.added.forEach((extra) => {
        extra.ingredientLinks?.forEach((link) => {
          oldIngredients.set(
            link.ingredientId,
            (oldIngredients.get(link.ingredientId) || 0) +
              link.quantity * quantity
          );
        });
      });

      newItem.ingredientLinks.forEach((link) => {
        if (
          !newItem.customizations.removed.some(
            (r) => r.id === link.ingredientId
          )
        ) {
          newIngredients.set(
            link.ingredientId,
            (newIngredients.get(link.ingredientId) || 0) +
              link.quantity * quantity
          );
        }
      });
      newItem.customizations.added.forEach((extra) => {
        extra.ingredientLinks?.forEach((link) => {
          newIngredients.set(
            link.ingredientId,
            (newIngredients.get(link.ingredientId) || 0) +
              link.quantity * quantity
          );
        });
      });

      const allIngredientIds = new Set([
        ...oldIngredients.keys(),
        ...newIngredients.keys(),
      ]);
      const ingredientRefs = Array.from(allIngredientIds).map((id) =>
        doc(db, "restaurants", restaurantId, "ingredients", id)
      );
      const ingredientDocs = await Promise.all(
        ingredientRefs.map((ref) => transaction.get(ref))
      );
      const stockAdjustments = new Map<string, number>();

      // CALCULATIONS
      for (const id of allIngredientIds) {
        const oldQty = oldIngredients.get(id) || 0;
        const newQty = newIngredients.get(id) || 0;
        if (oldQty !== newQty) {
          stockAdjustments.set(id, oldQty - newQty);
        }
      }

      // WRITES
      for (const ingDoc of ingredientDocs) {
        if (ingDoc.exists()) {
          const adjustment = stockAdjustments.get(ingDoc.id) || 0;
          if (adjustment === 0) continue;
          const newStock = (ingDoc.data().stock || 0) + adjustment;
          if (newStock < 0)
            throw new Error(`Insufficient stock for ${ingDoc.data().name}.`);
          transaction.update(ingDoc.ref, { stock: newStock });
        }
      }

      const itemsWithoutOld = orderData.items.map((item) =>
        item.lineItemId === oldLineItemId
          ? { ...item, status: "edited" as const }
          : item
      );
      const updatedItems = [...itemsWithoutOld, newItem];

      if (checkDoc && checkDoc.exists()) {
        const checkRef = doc(
          db,
          "restaurants",
          restaurantId,
          "checks",
          orderData.sourceCheckId!
        );
        const checkData = checkDoc.data() as Check;
        const updatedCheckItems = checkData.items.map((item) =>
          item.lineItemId === oldLineItemId
            ? { ...item, status: "edited" as const }
            : item
        );
        const finalCheckItems = [...updatedCheckItems, newItem];
        transaction.update(checkRef, { items: finalCheckItems });
      }

      transaction.update(orderRef, { items: updatedItems });
    });

    revalidatePath("/");
    revalidatePath("/admin/ingredients");
    return { success: true };
  } catch (e) {
    console.error("Error editing order item: ", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred.",
    };
  }
}
