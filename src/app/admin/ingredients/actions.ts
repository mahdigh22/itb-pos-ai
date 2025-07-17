
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ingredient } from '@/lib/types';

export async function addIngredient(restaurantId: string, formData: FormData) {
  const newIngredient: Omit<Ingredient, 'id'> = {
    name: formData.get('name') as string,
    stock: parseFloat(formData.get('stock') as string) || 0,
    unit: formData.get('unit') as string || 'units',
    cost: parseFloat(formData.get('cost') as string) || 0,
  };

  try {
    await addDoc(collection(db, 'restaurants', restaurantId, 'ingredients'), newIngredient);
    revalidatePath('/admin/ingredients');
    revalidatePath('/admin/menu'); // Revalidate menu page as it uses ingredients
    return { success: true };
  } catch (e) {
    console.error('Error adding ingredient: ', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'Failed to add ingredient.' };
  }
}

export async function updateIngredient(restaurantId: string, id: string, formData: FormData) {
    const ingredientUpdates = {
        name: formData.get('name') as string,
        stock: parseFloat(formData.get('stock') as string) || 0,
        unit: formData.get('unit') as string || 'units',
        cost: parseFloat(formData.get('cost') as string) || 0,
    };

    try {
        const ingredientRef = doc(db, 'restaurants', restaurantId, 'ingredients', id);
        await updateDoc(ingredientRef, ingredientUpdates);
        revalidatePath('/admin/ingredients');
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (e) {
        console.error('Error updating ingredient: ', e);
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Failed to update ingredient.' };
    }
}

export async function deleteIngredient(restaurantId: string, id: string) {
    try {
        await deleteDoc(doc(db, 'restaurants', restaurantId, 'ingredients', id));
        revalidatePath('/admin/ingredients');
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (e) {
        console.error('Error deleting ingredient: ', e);
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Failed to delete ingredient.' };
    }
}


export async function getIngredients(restaurantId: string): Promise<Ingredient[]> {
  try {
    if (!restaurantId) return [];
    const querySnapshot = await getDocs(collection(db, 'restaurants', restaurantId, 'ingredients'));
    const ingredients: Ingredient[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ingredients.push({ 
        id: doc.id,
        name: data.name,
        stock: data.stock || 0,
        unit: data.unit || 'units',
        cost: data.cost || 0,
       } as Ingredient);
    });
    return ingredients.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching ingredients: ", error);
    return [];
  }
}
