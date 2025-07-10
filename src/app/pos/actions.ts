

'use server';

import { revalidatePath } from 'next/cache';
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
    documentId
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ActiveOrder, Check, Employee, OrderItem, OrderStatus, PriceList } from '@/lib/types';

// Check Actions
export async function getChecks(): Promise<Check[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'checks'));
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

export async function addCheck(check: Omit<Check, 'id'>): Promise<Check> {
    const docRef = await addDoc(collection(db, 'checks'), check);
    revalidatePath('/');
    return { id: docRef.id, ...check };
}

export async function updateCheck(checkId: string, updates: Partial<Omit<Check, 'id'>>) {
  try {
    const checkRef = doc(db, 'checks', checkId);
    await updateDoc(checkRef, updates);
    // No revalidate needed for this as it's a frequent action
    return { success: true };
  } catch (e) {
    console.error("Error updating check: ", e);
    return { success: false, error: 'Failed to update check.' };
  }
}

export async function deleteCheck(checkId: string) {
    try {
        await deleteDoc(doc(db, 'checks', checkId));
        revalidatePath('/');
        return { success: true };
    } catch(e) {
        console.error("Error deleting check: ", e);
        return { success: false, error: 'Failed to delete check.' };
    }
}

// Order Actions
export async function sendNewItemsToKitchen(checkId: string) {
    const sourceCheckRef = doc(db, 'checks', checkId);
    let targetCheckId: string | null = null;
    
    // Phase 1: Read data outside transaction to find if a merge is needed
    const sourceCheckSnap = await getDoc(sourceCheckRef);
    if (!sourceCheckSnap.exists()) return { success: false, error: 'Check not found.' };
    const sourceCheck = { id: sourceCheckSnap.id, ...sourceCheckSnap.data() } as Check;
    
    // Merge logic only applies to dine-in orders with a specified table
    if (sourceCheck.orderType === 'Dine In' && sourceCheck.tableId) {
        const q = query(
            collection(db, 'checks'), 
            where('tableId', '==', sourceCheck.tableId), 
            where(documentId(), '!=', sourceCheck.id)
        );
        const existingChecksSnap = await getDocs(q);
        if (existingChecksSnap.docs.length > 0) {
            targetCheckId = existingChecksSnap.docs[0].id;
        }
    }

    // Phase 2: Perform atomic write operations in a transaction
    try {
        await runTransaction(db, async (transaction) => {
            // ----- ALL READS FIRST -----
            const settingsDocRef = doc(db, "settings", "main");
            const freshSourceSnap = await transaction.get(sourceCheckRef);
            const settingsDoc = await transaction.get(settingsDocRef);
            
            let freshTargetSnap: any = null;
            let targetCheckRef: any = null;
            if (targetCheckId) {
                targetCheckRef = doc(db, 'checks', targetCheckId);
                freshTargetSnap = await transaction.get(targetCheckRef);
            }
            
            if (!freshSourceSnap.exists()) {
                throw new Error("Source check was deleted during operation.");
            }
            
            // ----- LOGIC AND PREPARATION -----
            const freshSourceCheck = { id: freshSourceSnap.id, ...freshSourceSnap.data() } as Check;
            const newItemsToProcess = freshSourceCheck.items.filter(item => item.status === 'new');

            if (newItemsToProcess.length === 0) {
                return; // Nothing to send, exit transaction.
            }

            const settings = settingsDoc.exists() ? settingsDoc.data()! : { taxRate: 0, priceLists: [] };
            const taxRate = settings.taxRate || 0;
            const priceLists: PriceList[] = settings.priceLists || [];
            
            const newSanitizedItems = newItemsToProcess.map(item => {
                const { ingredients, ...rest } = item;
                const cost = item.cost || 0;
                return { ...rest, cost };
            });

            // Determine which check data to use for the new order (for pricing, customer name, etc.)
            const finalCheckDataForOrder = freshTargetSnap?.exists() 
                ? { ...freshTargetSnap.data(), id: freshTargetSnap.id } as Check 
                : freshSourceCheck;

            const subtotal = newSanitizedItems.reduce((acc, item) => {
                const extrasPrice = item.customizations?.added.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
                const totalItemPrice = (item.price + extrasPrice) * item.quantity;
                return acc + totalItemPrice;
            }, 0);
            
            const selectedPriceList = priceLists.find(pl => pl.id === finalCheckDataForOrder.priceListId);
            const discountPercentage = selectedPriceList?.discount || 0;
            const discountAmount = subtotal * (discountPercentage / 100);
            const discountedSubtotal = subtotal - discountAmount;
            const tax = discountedSubtotal * (taxRate / 100);
            const total = discountedSubtotal + tax;
            const totalPreparationTime = newSanitizedItems.reduce((acc, item) => acc + (item.preparationTime || 5) * item.quantity, 0);

            const newOrderData = {
                items: newSanitizedItems,
                status: 'Preparing' as OrderStatus,
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

            const newOrderRef = doc(collection(db, 'orders'));

            // ----- ALL WRITES LAST -----
            transaction.set(newOrderRef, newOrderData);

            if (targetCheckRef && freshTargetSnap?.exists()) {
                // MERGE case
                if (!freshTargetSnap.exists()) throw new Error("Target check was deleted during operation.");
                const targetCheck = { id: freshTargetSnap.id, ...freshTargetSnap.data() } as Check;
                const itemsToMerge = newItemsToProcess.map(item => ({...item, status: 'sent' as const}));
                const mergedItems = [...targetCheck.items, ...itemsToMerge];
                
                transaction.update(targetCheckRef, { items: mergedItems });
                transaction.delete(sourceCheckRef);
            } else {
                // NO MERGE case
                const updatedItems = freshSourceCheck.items.map(item => 
                    item.status === 'new' ? { ...item, status: 'sent' as const } : item
                );
                transaction.update(sourceCheckRef, { items: updatedItems });
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error("Error in transaction for sending items to kitchen: ", e);
        if (e instanceof Error) {
          return { success: false, error: e.message };
        }
        return { success: false, error: 'An unknown error occurred.' };
    }
}


export async function getOrders(): Promise<ActiveOrder[]> {
  try {
    const q = query(
        collection(db, 'orders'), 
        where('status', 'in', ['Preparing', 'Ready', 'Completed']),
        orderBy('createdAt', 'desc')
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


export async function addOrder(orderData: Omit<ActiveOrder, 'id' | 'createdAt'> & { createdAt: Date }) {
    try {
        // Sanitize items before saving to prevent storing client-side fields
        const sanitizedItems = orderData.items.map(item => {
            const { ingredients, ...rest } = item;
            return { ...rest, cost: item.cost || 0 };
        });

        const dataToSave = {
            ...orderData,
            items: sanitizedItems,
            createdAt: Timestamp.fromDate(orderData.createdAt),
            tableId: orderData.tableId || null,
            tableName: orderData.tableName || null,
            customerName: orderData.customerName || null,
            priceListId: orderData.priceListId || null,
            employeeId: orderData.employeeId || null,
            employeeName: orderData.employeeName || null,
        };

        await addDoc(collection(db, 'orders'), dataToSave);
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error("Error adding order: ", e);
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Failed to add order.' };
    }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status });
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error("Error updating order status: ", e);
        return { success: false, error: 'Failed to update order status.' };
    }
}

export async function archiveOrder(orderId: string) {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: 'Archived' });
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error("Error archiving order: ", e);
        return { success: false, error: 'Failed to archive order.' };
    }
}

export async function cancelOrderItem(orderId: string, lineItemId: string) {
    const orderRef = doc(db, "orders", orderId);
    try {
        await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) throw new Error("Order not found.");

            const orderData = orderDoc.data() as ActiveOrder;
            const updatedItems = orderData.items.map(item => {
                if (item.lineItemId === lineItemId) {
                    return { ...item, status: 'cancelled' as const };
                }
                return item;
            });
            
            // Sync change with the source check if it exists
            if (orderData.sourceCheckId) {
                const checkRef = doc(db, "checks", orderData.sourceCheckId);
                const checkDoc = await transaction.get(checkRef);
                if (checkDoc.exists()) {
                    const checkData = checkDoc.data() as Check;
                    const updatedCheckItems = checkData.items.map(item => 
                        item.lineItemId === lineItemId ? { ...item, status: 'cancelled' as const } : item
                    );
                    transaction.update(checkRef, { items: updatedCheckItems });
                }
            }

            transaction.update(orderRef, { items: updatedItems });
        });
        revalidatePath('/');
        return { success: true };
    } catch(e) {
        console.error("Error cancelling order item: ", e);
        return { success: false, error: e instanceof Error ? e.message : "An unknown error occurred." };
    }
}

export async function editOrderItem(orderId: string, oldLineItemId: string, newItem: OrderItem) {
    const orderRef = doc(db, "orders", orderId);
    try {
        await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) throw new Error("Order not found.");
            
            const orderData = orderDoc.data() as ActiveOrder;
            
            // Mark old item as edited and add the new one
            const itemsWithoutOld = orderData.items.map(item => 
                item.lineItemId === oldLineItemId ? { ...item, status: 'edited' as const } : item
            );
            const updatedItems = [...itemsWithoutOld, newItem];

            // Sync with check
            if (orderData.sourceCheckId) {
                const checkRef = doc(db, "checks", orderData.sourceCheckId);
                const checkDoc = await transaction.get(checkRef);
                if (checkDoc.exists()) {
                    const checkData = checkDoc.data() as Check;
                    const updatedCheckItems = checkData.items.map(item => 
                        item.lineItemId === oldLineItemId ? { ...item, status: 'edited' as const } : item
                    );
                    const finalCheckItems = [...updatedCheckItems, newItem];
                    transaction.update(checkRef, { items: finalCheckItems });
                }
            }

            transaction.update(orderRef, { items: updatedItems });
        });
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error("Error editing order item: ", e);
        return { success: false, error: e instanceof Error ? e.message : "An unknown error occurred." };
    }
}

// Helper function to recalculate order total, assuming it might be needed in other places.
// It needs access to settings to get the tax rate.
async function calculateOrderTotal(items: OrderItem[], discountPercentage: number) {
    const settingsDocRef = doc(db, "settings", "main");
    const settingsDoc = await getDoc(settingsDocRef);
    const taxRate = settingsDoc.exists() ? (settingsDoc.data().taxRate || 0) : 0;

    const subtotal = items.reduce((acc, item) => {
        const extrasPrice = item.customizations?.added.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
        const totalItemPrice = (item.price + extrasPrice) * item.quantity;
        return acc + totalItemPrice;
    }, 0);

    const discountAmount = subtotal * (discountPercentage / 100);
    const discountedSubtotal = subtotal - discountAmount;
    const tax = discountedSubtotal * (taxRate / 100);
    const total = discountedSubtotal + tax;
    
    return { total };
}
