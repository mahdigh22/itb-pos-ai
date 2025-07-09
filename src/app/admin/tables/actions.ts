
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { RestaurantTable } from '@/lib/types';

export async function addTable(formData: FormData) {
  const newTable: Omit<RestaurantTable, 'id'> = {
    name: formData.get('name') as string,
  };

  try {
    await addDoc(collection(db, 'tables'), newTable);
    revalidatePath('/admin/tables');
    revalidatePath('/'); // For POS
    return { success: true };
  } catch (e) {
    console.error('Error adding table: ', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'Failed to add table.' };
  }
}

export async function updateTable(id: string, formData: FormData) {
    const tableUpdates = {
        name: formData.get('name') as string,
    };

    try {
        const tableRef = doc(db, 'tables', id);
        await updateDoc(tableRef, tableUpdates);
        revalidatePath('/admin/tables');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error updating table: ', e);
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Failed to update table.' };
    }
}

export async function deleteTable(id: string) {
    try {
        await deleteDoc(doc(db, 'tables', id));
        revalidatePath('/admin/tables');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error deleting table: ', e);
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Failed to delete table.' };
    }
}

export async function getTables(): Promise<RestaurantTable[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'tables'));
    const tables: RestaurantTable[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tables.push({ 
        id: doc.id,
        name: data.name,
       } as RestaurantTable);
    });
    return tables.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching tables: ", error);
    return [];
  }
}
