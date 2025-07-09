
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
import type { ActiveOrder, Check, OrderItem, OrderStatus, PriceList } from '@/lib/types';

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

// Helper function for creating an order and updating a check within a transaction
async function processAndSendItems(transaction: any, checkRef: any, checkData: Check) {
    const newItemsToProcess = checkData.items.filter(item => item.status === 'new');
    if (newItemsToProcess.length === 0) {
        return; // Nothing to do
    }

    // Sanitize items for Firestore by removing client-side populated fields
    const newItems = newItemsToProcess.map(item => {
        const { ingredients, cost, ...rest } = item;
        return rest;
    });

    // Fetch settings to apply correct tax and discounts
    const settingsDocRef = doc(db, "settings", "main");
    const settingsDoc = await transaction.get(settingsDocRef);
    const settings = settingsDoc.exists() ? settingsDoc.data() : { taxRate: 0, priceLists: [] };
    const taxRate = settings.taxRate || 0;
    const priceLists: PriceList[] = settings.priceLists || [];
    
    const subtotal = newItems.reduce((acc, item) => {
        const extrasPrice = item.customizations?.added.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
        const totalItemPrice = (item.price + extrasPrice) * item.quantity;
        return acc + totalItemPrice;
    }, 0);
    
    const selectedPriceList = priceLists.find(pl => pl.id === checkData.priceListId);
    const discountPercentage = selectedPriceList?.discount || 0;
    const discountAmount = subtotal * (discountPercentage / 100);
    const discountedSubtotal = subtotal - discountAmount;
    const tax = discountedSubtotal * (taxRate / 100);
    const total = discountedSubtotal + tax;
    
    const totalPreparationTime = newItems.reduce((acc, item) => acc + (item.preparationTime || 5) * item.quantity, 0);

    const newOrderData = {
        items: newItems,
        status: 'Preparing' as OrderStatus,
        total: total,
        createdAt: Timestamp.now(),
        checkName: `${checkData.name} (Batch)`,
        totalPreparationTime,
        orderType: checkData.orderType,
        tableId: checkData.tableId || null,
        tableName: checkData.tableName || null,
        customerName: checkData.customerName || null,
        priceListId: checkData.priceListId || null,
        discountApplied: discountPercentage,
    };

    const newOrderRef = doc(collection(db, 'orders'));
    transaction.set(newOrderRef, newOrderData);

    const updatedItems = checkData.items.map(item => 
        item.status === 'new' ? { ...item, status: 'sent' as const } : item
    );
    transaction.update(checkRef, { items: updatedItems });
}


// Order Actions
export async function sendNewItemsToKitchen(checkId: string) {
    // Phase 1: Read data outside transaction to find if a merge is needed
    const sourceCheckRef = doc(db, 'checks', checkId);
    const sourceCheckSnap = await getDoc(sourceCheckRef);

    if (!sourceCheckSnap.exists()) {
        return { success: false, error: 'Check not found.' };
    }
    const sourceCheck = { id: sourceCheckSnap.id, ...sourceCheckSnap.data() } as Check;
    
    let targetCheckDoc = null;
    // Merge logic only applies to dine-in orders with a specified table
    if (sourceCheck.orderType === 'Dine In' && sourceCheck.tableId) {
        const q = query(
            collection(db, 'checks'), 
            where('tableId', '==', sourceCheck.tableId), 
            where(documentId(), '!=', sourceCheck.id)
        );
        const existingChecksSnap = await getDocs(q);
        if (existingChecksSnap.docs.length > 0) {
            targetCheckDoc = existingChecksSnap.docs[0];
        }
    }

    // Phase 2: Perform atomic write operations in a transaction
    try {
        await runTransaction(db, async (transaction) => {
            // Re-read source check inside transaction for consistency
            const freshSourceSnap = await transaction.get(sourceCheckRef);
            if (!freshSourceSnap.exists()) throw new Error("Source check was deleted during operation.");
            
            const freshSourceCheck = { id: freshSourceSnap.id, ...freshSourceSnap.data() } as Check;
            const newItemsFromSource = freshSourceCheck.items.filter(item => item.status === 'new');

            if (newItemsFromSource.length === 0) return; // Nothing to send

            if (targetCheckDoc) {
                // MERGE case: An existing check for this table was found
                const targetCheckRef = doc(db, 'checks', targetCheckDoc.id);
                const freshTargetSnap = await transaction.get(targetCheckRef);
                if (!freshTargetSnap.exists()) throw new Error("Target check was deleted during operation.");
                
                const freshTargetCheck = { id: freshTargetSnap.id, ...freshTargetSnap.data() } as Check;
                const updatedTargetItems = [...freshTargetCheck.items, ...newItemsFromSource];

                transaction.update(targetCheckRef, { items: updatedTargetItems });
                transaction.delete(sourceCheckRef);

                const checkToProcess = { ...freshTargetCheck, items: updatedTargetItems };
                await processAndSendItems(transaction, targetCheckRef, checkToProcess);
            } else {
                // NO MERGE case: This is the first/only check for this table
                await processAndSendItems(transaction, sourceCheckRef, freshSourceCheck);
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
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
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
            const { ingredients, cost, ...rest } = item;
            return rest;
        });

        const dataToSave = {
            ...orderData,
            items: sanitizedItems,
            createdAt: Timestamp.fromDate(orderData.createdAt),
            tableId: orderData.tableId || null,
            tableName: orderData.tableName || null,
            customerName: orderData.customerName || null,
            priceListId: orderData.priceListId || null,
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

export async function deleteOrder(orderId: string) {
    try {
        await deleteDoc(doc(db, 'orders', orderId));
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error("Error deleting order: ", e);
        return { success: false, error: 'Failed to delete order.' };
    }
}
