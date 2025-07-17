
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Extra } from '@/lib/types';

export async function addExtra(restaurantId: string, formData: FormData) {
  const ingredientLinksString = formData.get('ingredientLinks') as string;
  const ingredientLinks = ingredientLinksString ? JSON.parse(ingredientLinksString) : [];

  const newExtra: Omit<Extra, 'id'> = {
    name: formData.get('name') as string,
    price: parseFloat(formData.get('price') as string) || 0,
    ingredientLinks,
  };

  try {
    await addDoc(collection(db, 'restaurants', restaurantId, 'extras'), newExtra);
    revalidatePath('/admin/extras');
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Error adding extra: ', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'Failed to add extra.' };
  }
}

export async function updateExtra(restaurantId: string, id: string, formData: FormData) {
    const ingredientLinksString = formData.get('ingredientLinks') as string;
    const ingredientLinks = ingredientLinksString ? JSON.parse(ingredientLinksString) : [];

    const extraUpdates = {
        name: formData.get('name') as string,
        price: parseFloat(formData.get('price') as string) || 0,
        ingredientLinks,
    };

    try {
        const extraRef = doc(db, 'restaurants', restaurantId, 'extras', id);
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

export async function deleteExtra(restaurantId: string, id: string) {
    try {
        await deleteDoc(doc(db, 'restaurants', restaurantId, 'extras', id));
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


export async function getExtras(restaurantId: string): Promise<Extra[]> {
  try {
    if (!restaurantId) return [];
    const querySnapshot = await getDocs(collection(db, 'restaurants', restaurantId, 'extras'));
    const extras: Extra[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      extras.push({ 
        id: doc.id,
        name: data.name,
        price: data.price || 0,
        ingredientLinks: data.ingredientLinks || [],
       } as Extra);
    });
    return extras.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching extras: ", error);
    return [];
  }
}
