
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Extra } from '@/lib/types';

export async function addExtra(formData: FormData) {
  const newExtra: Omit<Extra, 'id'> = {
    name: formData.get('name') as string,
    price: parseFloat(formData.get('price') as string) || 0,
  };

  try {
    await addDoc(collection(db, 'extras'), newExtra);
    revalidatePath('/admin/extras');
    revalidatePath('/'); // Revalidate POS page as it uses extras
    return { success: true };
  } catch (e) {
    console.error('Error adding extra: ', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'Failed to add extra.' };
  }
}

export async function updateExtra(id: string, formData: FormData) {
    const extraUpdates = {
        name: formData.get('name') as string,
        price: parseFloat(formData.get('price') as string) || 0,
    };

    try {
        const extraRef = doc(db, 'extras', id);
        await updateDoc(extraRef, extraUpdates);
        revalidatePath('/admin/extras');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error updating extra: ', e);
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Failed to update extra.' };
    }
}

export async function deleteExtra(id: string) {
    try {
        await deleteDoc(doc(db, 'extras', id));
        revalidatePath('/admin/extras');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error deleting extra: ', e);
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Failed to delete extra.' };
    }
}


export async function getExtras(): Promise<Extra[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'extras'));
    const extras: Extra[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      extras.push({ 
        id: doc.id,
        name: data.name,
        price: data.price || 0,
       } as Extra);
    });
    return extras.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching extras: ", error);
    return [];
  }
}
