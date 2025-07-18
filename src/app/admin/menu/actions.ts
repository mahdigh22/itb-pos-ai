
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MenuItem, Category, Ingredient } from '@/lib/types';

// Menu Item Actions
export async function addMenuItem(restaurantId: string, formData: FormData) {
  const ingredientLinksString = formData.get('ingredientLinks') as string;
  const ingredientLinks = ingredientLinksString ? JSON.parse(ingredientLinksString) : [];

  const newItemData: Omit<MenuItem, 'id' | 'cost'> = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string),
    category: formData.get('category') as string,
    imageUrl: formData.get('imageUrl') as string || `https://placehold.co/600x400.png`,
    imageHint: 'food placeholder',
    preparationTime: parseInt(formData.get('preparationTime') as string, 10) || 5,
    ingredientLinks: ingredientLinks,
    ingredients: []
  };

  try {
    await addDoc(collection(db, 'restaurants', restaurantId, 'menuItems'), newItemData);
    revalidatePath('/admin/menu');
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Error adding document: ', e);
    return { success: false, error: 'Failed to add menu item.' };
  }
}

export async function updateMenuItem(restaurantId: string, id: string, formData: FormData) {
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
        await updateDoc(doc(db, 'restaurants', restaurantId, 'menuItems', id), itemUpdates);
        revalidatePath('/admin/menu');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error updating document: ', e);
        return { success: false, error: 'Failed to update menu item.' };
    }
}

export async function deleteMenuItem(restaurantId: string, id: string) {
    try {
        await deleteDoc(doc(db, 'restaurants', restaurantId, 'menuItems', id));
        revalidatePath('/admin/menu');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error deleting document: ', e);
        return { success: false, error: 'Failed to delete menu item.' };
    }
}


export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  try {
    if (!restaurantId) return [];
    const [menuItemsSnapshot, ingredientsSnapshot] = await Promise.all([
        getDocs(collection(db, 'restaurants', restaurantId, 'menuItems')),
        getDocs(collection(db, 'restaurants', restaurantId, 'ingredients'))
    ]);

    const ingredientsMap = new Map<string, Ingredient>();
    ingredientsSnapshot.forEach(doc => {
        const data = doc.data();
        ingredientsMap.set(doc.id, { 
          id: doc.id,
          name: data.name,
          stock: data.stock || 0,
          unit: data.unit || 'units',
          cost: data.cost || 0,
        } as Ingredient);
    });

    const items: MenuItem[] = [];
    menuItemsSnapshot.forEach((doc) => {
      const data = doc.data();
      const menuItem: MenuItem = { 
        id: doc.id,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        imageUrl: data.imageUrl,
        imageHint: data.imageHint,
        preparationTime: data.preparationTime,
        ingredientLinks: data.ingredientLinks || [],
        ingredients: [],
        cost: 0,
       };
      
      let calculatedCost = 0;

      if (menuItem.ingredientLinks) {
          menuItem.ingredients = menuItem.ingredientLinks
            .map(link => {
                const ingredient = ingredientsMap.get(link.ingredientId);
                if (ingredient) {
                    calculatedCost += (ingredient.cost || 0) * (link.quantity || 0);
                    return { 
                      ...ingredient, 
                      isOptional: link.isOptional, 
                      quantity: link.quantity || 1,
                    };
                }
                return null;
            })
            .filter((i): i is NonNullable<typeof i> => i !== null);
      }
      
      menuItem.cost = calculatedCost;
      items.push(menuItem);
    });

    return items.sort((a,b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching menu items: ", error);
    return [];
  }
}

// Category Actions
export async function addCategory(restaurantId: string, formData: FormData) {
  const newCategory = {
    name: formData.get('name') as string,
  };

  try {
    await addDoc(collection(db, 'restaurants', restaurantId, 'categories'), newCategory);
    revalidatePath('/admin/menu');
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Error adding document: ', e);
    return { success: false, error: 'Failed to add category.' };
  }
}


export async function updateCategory(restaurantId: string, id: string, formData: FormData) {
    const categoryUpdates = {
        name: formData.get('name') as string,
    };
    try {
        await updateDoc(doc(db, 'restaurants', restaurantId, 'categories', id), categoryUpdates);
        revalidatePath('/admin/menu');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error updating document: ', e);
        return { success: false, error: 'Failed to update category.' };
    }
}

export async function deleteCategory(restaurantId: string, id: string) {
    try {
        await deleteDoc(doc(db, 'restaurants', restaurantId, 'categories', id));
        revalidatePath('/admin/menu');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Error deleting document: ', e);
        return { success: false, error: 'Failed to delete category.' };
    }
}


export async function getCategories(restaurantId: string): Promise<Category[]> {
  try {
    if (!restaurantId) return [];
    const querySnapshot = await getDocs(collection(db, 'restaurants', restaurantId, 'categories'));
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
