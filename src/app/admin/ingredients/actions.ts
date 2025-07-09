'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ingredient } from '@/lib/types';

export async function addIngredient(formData: FormData) {
  const newIngredient: Omit<Ingredient, 'id'> = {
    name: formData.get('name') as string,
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

export async function getIngredients(): Promise<Ingredient[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'ingredients'));
    const ingredients: Ingredient[] = [];
    querySnapshot.forEach((doc) => {
      ingredients.push({ id: doc.id, ...doc.data() } as Ingredient);
    });
    return ingredients.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching ingredients: ", error);
    return [];
  }
}
