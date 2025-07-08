'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MenuItem, Category } from '@/lib/types';

// Menu Item Actions
export async function addMenuItem(formData: FormData) {
  const newItemData: Omit<MenuItem, 'id'> = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string),
    category: formData.get('category') as string,
    imageUrl: formData.get('imageUrl') as string || `https://placehold.co/600x400.png`,
    imageHint: 'food placeholder', // Simple hint for now
    preparationTime: parseInt(formData.get('preparationTime') as string, 10) || 5,
  };

  try {
    await addDoc(collection(db, 'menuItems'), newItemData);
    revalidatePath('/admin/menu');
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Error adding document: ', e);
    return { success: false, error: 'Failed to add menu item.' };
  }
}

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'menuItems'));
    const items: MenuItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as MenuItem);
    });
    return items.sort((a,b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching menu items: ", error);
    return [];
  }
}

// Category Actions
export async function addCategory(formData: FormData) {
  const newCategory = {
    name: formData.get('name') as string,
  };

  try {
    await addDoc(collection(db, 'categories'), newCategory);
    revalidatePath('/admin/menu');
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Error adding document: ', e);
    return { success: false, error: 'Failed to add category.' };
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as Category);
    });
    return categories.sort((a,b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching categories: ", error);
    return [];
  }
}
