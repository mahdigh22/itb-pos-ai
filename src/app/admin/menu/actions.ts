
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MenuItem, Category, Ingredient } from '@/lib/types';

// Menu Item Actions
export async function addMenuItem(formData: FormData) {
  const ingredientLinksString = formData.get('ingredientLinks') as string;
  const ingredientLinks = ingredientLinksString ? JSON.parse(ingredientLinksString) : [];

  const newItemData: Omit<MenuItem, 'id'> = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string),
    category: formData.get('category') as string,
    imageUrl: formData.get('imageUrl') as string || `https://placehold.co/600x400.png`,
    imageHint: 'food placeholder',
    preparationTime: parseInt(formData.get('preparationTime') as string, 10) || 5,
    ingredientLinks: ingredientLinks,
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

export async function updateMenuItem(id: string, formData: FormData) {
    const ingredientLinksString = formData.get('ingredientLinks') as string;
    const ingredientLinks = ingredientLinksString ? JSON.parse(ingredientLinksString) : [];

    const itemUpdates = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string),
        category: formData.get('category') as string,
        imageUrl: formData.get('imageUrl') as string || `https://placehold.co/600x400.png`,
        preparationTime: parseInt(formData.get('preparationTime') as string, 10) || 5,
        ingredientLinks: ingredientLinks,
    };
    
    try {
        await updateDoc(doc(db, 'menuItems', id), itemUpdates);
        revalidatePath('/admin/menu');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error updating document: ', e);
        return { success: false, error: 'Failed to update menu item.' };
    }
}

export async function deleteMenuItem(id: string) {
    try {
        await deleteDoc(doc(db, 'menuItems', id));
        revalidatePath('/admin/menu');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error deleting document: ', e);
        return { success: false, error: 'Failed to delete menu item.' };
    }
}


export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const [menuItemsSnapshot, ingredientsSnapshot] = await Promise.all([
        getDocs(collection(db, 'menuItems')),
        getDocs(collection(db, 'ingredients'))
    ]);

    const ingredientsMap = new Map<string, Ingredient>();
    ingredientsSnapshot.forEach(doc => {
        const data = doc.data();
        ingredientsMap.set(doc.id, { 
          id: doc.id,
          name: data.name,
          stock: data.stock || 0,
          unit: data.unit || 'units',
        } as Ingredient);
    });

    const items: MenuItem[] = [];
    menuItemsSnapshot.forEach((doc) => {
      const data = doc.data();
      const menuItem = { id: doc.id, ...data } as MenuItem;

      // Resolve ingredient links
      if (menuItem.ingredientLinks) {
          menuItem.ingredients = menuItem.ingredientLinks
            .map(link => {
                const ingredient = ingredientsMap.get(link.ingredientId);
                return ingredient ? { 
                  ...ingredient, 
                  isOptional: link.isOptional, 
                  quantity: link.quantity || 1, // Default quantity to 1 if not specified
                } : null;
            })
            .filter(Boolean) as MenuItem['ingredients'];
      }

      items.push(menuItem);
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


export async function updateCategory(id: string, formData: FormData) {
    const categoryUpdates = {
        name: formData.get('name') as string,
    };
    try {
        await updateDoc(doc(db, 'categories', id), categoryUpdates);
        revalidatePath('/admin/menu');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error updating document: ', e);
        return { success: false, error: 'Failed to update category.' };
    }
}

export async function deleteCategory(id: string) {
    try {
        // TODO: Add logic to handle menu items in this category
        await deleteDoc(doc(db, 'categories', id));
        revalidatePath('/admin/menu');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error deleting document: ', e);
        return { success: false, error: 'Failed to delete category.' };
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
