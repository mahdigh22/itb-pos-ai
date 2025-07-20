
'use server';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Admin } from '@/lib/types';

export async function loginAdmin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
    if (restaurantsSnapshot.empty) {
        return { success: false, error: 'No restaurants have been configured in the system. Please contact the super administrator.' };
    }

    for (const restaurantDoc of restaurantsSnapshot.docs) {
      const restaurantId = restaurantDoc.id;
      const adminsCollectionRef = collection(db, 'restaurants', restaurantId, 'admins');
      
      const q = query(adminsCollectionRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const adminData = adminDoc.data();

        if (adminData.password === password) {
          const admin: Omit<Admin, 'password'> = {
            id: adminDoc.id,
            name: adminData.name,
            email: adminData.email,
            restaurantId: restaurantId,
          };
          return { success: true, admin };
        } else {
          // Found the email but password doesn't match for this restaurant's admin.
          // We can stop and return error as emails should be unique across admins.
          return { success: false, error: 'Invalid password.' };
        }
      }
    }

    // Looped through all restaurants and didn't find the email.
    return { success: false, error: 'No admin found with that email.' };

  } catch (e) {
    console.error('Admin login error:', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}
