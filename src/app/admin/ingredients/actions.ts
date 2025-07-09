
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ingredient } from '@/lib/types';

export async function addIngredient(formData: FormData) {
  const newIngredient: Omit<Ingredient, 'id'> = {
    name: formData.get('name') as string,
    stock: parseFloat(formData.get('stock') as string) || 0,
    unit: formData.get('unit') as string || 'units',
  };

  try {
    await addDoc(collection(db, 'ingredients'), newIngredient);
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

export async function updateIngredient(id: string, formData: FormData) {
    const ingredientUpdates = {
        name: formData.get('name') as string,
        stock: parseFloat(formData.get('stock') as string) || 0,
        unit: formData.get('unit') as string || 'units',
    };

    try {
        const ingredientRef = doc(db, 'ingredients', id);
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

export async function deleteIngredient(id: string) {
    try {
        await deleteDoc(doc(db, 'ingredients', id));
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


export async function getIngredients(): Promise<Ingredient[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'ingredients'));
    const ingredients: Ingredient[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ingredients.push({ 
        id: doc.id,
        name: data.name,
        stock: data.stock || 0,
        unit: data.unit || 'units',
       } as Ingredient);
    });
    return ingredients.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching ingredients: ", error);
    return [];
  }
}
