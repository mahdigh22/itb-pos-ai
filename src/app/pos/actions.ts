
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, Timestamp, query, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ActiveOrder, Check, OrderItem, OrderStatus } from '@/lib/types';

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

export async function updateCheckItems(checkId: string, items: OrderItem[]) {
  try {
    const checkRef = doc(db, 'checks', checkId);
    await updateDoc(checkRef, { items });
    // No revalidate needed for this as it's a frequent action
    return { success: true };
  } catch (e) {
    console.error("Error updating check items: ", e);
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
        await addDoc(collection(db, 'orders'), {
            ...orderData,
            createdAt: Timestamp.fromDate(orderData.createdAt),
        });
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
