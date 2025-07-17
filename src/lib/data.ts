
import type { Category, MenuItem, Employee } from './types';
import { collection, getDocs, addDoc, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const categories: Category[] = [];

export const menuItems: MenuItem[] = [];

export const employees: Employee[] = [];

export async function ensureDefaultRestaurant(): Promise<string> {
  const restaurantsQuery = query(collection(db, 'restaurants'));
  const restaurantSnap = await getDocs(restaurantsQuery);

  let restaurantId: string;

  if (restaurantSnap.empty) {
    console.log("No restaurants found, creating a default one...");
    const restaurantRef = await addDoc(collection(db, 'restaurants'), {
      name: 'Default Restaurant',
      createdAt: new Date(),
    });
    restaurantId = restaurantRef.id;
    
    console.log("Creating default admin for new restaurant...");
    await setDoc(doc(db, 'restaurants', restaurantId, 'admins', 'default-admin'), {
      name: 'Default Admin',
      email: 'admin@default.com',
      password: 'password'
    });

  } else {
    restaurantId = restaurantSnap.docs[0].id;
  }

  return restaurantId;
}
