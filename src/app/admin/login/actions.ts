
'use server';

import { collection, query, where, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Admin } from '@/lib/types';
import { ensureDefaultRestaurant } from '@/lib/data';


export async function loginAdmin(formData: FormData) {
  const restaurantId = await ensureDefaultRestaurant(); 

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    const q = query(
      collection(db, 'restaurants', restaurantId, 'admins'),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'Invalid admin email.' };
    }

    const adminDoc = querySnapshot.docs[0];
    const adminData = adminDoc.data();

    if (adminData.password !== password) {
        return { success: false, error: 'Invalid password.' };
    }
    
    const admin: Omit<Admin, 'password'> = {
        id: adminDoc.id,
        name: adminData.name,
        email: adminData.email,
        restaurantId: restaurantId,
    };

    return { success: true, admin };

  } catch (e) {
    console.error('Admin login error:', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}
