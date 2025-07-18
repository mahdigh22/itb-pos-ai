
'use server';

import { revalidatePath } from 'next/cache';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Admin } from '@/lib/types';

interface Restaurant {
  id: string;
  name: string;
  admins: Admin[];
}

// Hardcoded password for super admin access
const SUPER_ADMIN_PASSWORD = 'superadmin';

export async function verifySuperAdminPassword(password: string) {
  if (password === SUPER_ADMIN_PASSWORD) {
    return { success: true };
  }
  return { success: false, error: 'Invalid password.' };
}


export async function getRestaurantsWithAdmins(): Promise<Restaurant[]> {
  const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
  const restaurants: Restaurant[] = [];

  for (const restaurantDoc of restaurantsSnapshot.docs) {
    const adminsSnapshot = await getDocs(collection(restaurantDoc.ref, 'admins'));
    const admins = adminsSnapshot.docs.map(adminDoc => ({
      id: adminDoc.id,
      ...adminDoc.data()
    } as Admin));
    
    restaurants.push({
      id: restaurantDoc.id,
      name: restaurantDoc.data().name,
      admins: admins,
    });
  }

  return restaurants.sort((a,b) => a.name.localeCompare(b.name));
}

export async function createRestaurant(formData: FormData) {
    const restaurantName = formData.get('restaurantName') as string;
    if (!restaurantName) return { success: false, error: 'Restaurant name is required.' };

    try {
        await addDoc(collection(db, 'restaurants'), {
            name: restaurantName,
            createdAt: new Date(),
        });
        revalidatePath('/superadmin');
        return { success: true };
    } catch(e) {
        console.error("Error creating restaurant: ", e);
        return { success: false, error: 'Failed to create restaurant.' };
    }
}

export async function deleteRestaurant(restaurantId: string) {
    try {
        // This is a simplified delete. In a real app, you'd also delete all sub-collections (orders, menuitems, etc.)
        await deleteDoc(doc(db, 'restaurants', restaurantId));
        revalidatePath('/superadmin');
        return { success: true };
    } catch (e) {
        console.error("Error deleting restaurant: ", e);
        return { success: false, error: 'Failed to delete restaurant.' };
    }
}


export async function addRestaurantAdmin(restaurantId: string, formData: FormData) {
  const adminData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };
  
  if (!adminData.name || !adminData.email || !adminData.password) {
      return { success: false, error: "All fields are required." };
  }

  try {
    await addDoc(collection(db, 'restaurants', restaurantId, 'admins'), adminData);
    revalidatePath('/superadmin');
    return { success: true };
  } catch (e) {
    console.error('Error adding admin: ', e);
    return { success: false, error: 'Failed to add admin.' };
  }
}

export async function updateRestaurantAdmin(restaurantId: string, adminId: string, formData: FormData) {
  const adminUpdates: Partial<Admin> = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
  };
  const password = formData.get('password') as string;
  if (password) {
      adminUpdates.password = password;
  }

  try {
    const adminRef = doc(db, 'restaurants', restaurantId, 'admins', adminId);
    await updateDoc(adminRef, adminUpdates);
    revalidatePath('/superadmin');
    return { success: true };
  } catch (e) {
    console.error('Error updating admin: ', e);
    return { success: false, error: 'Failed to update admin.' };
  }
}

export async function deleteRestaurantAdmin(restaurantId: string, adminId: string) {
    try {
        await deleteDoc(doc(db, 'restaurants', restaurantId, 'admins', adminId));
        revalidatePath('/superadmin');
        return { success: true };
    } catch (e) {
        console.error("Error deleting admin: ", e);
        return { success: false, error: 'Failed to delete admin.' };
    }
}
