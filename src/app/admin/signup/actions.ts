
'use server';

import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Admin } from '@/lib/types';

export async function signupAdmin(formData: FormData) {
  const restaurantName = formData.get('restaurantName') as string;
  const adminName = formData.get('adminName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!restaurantName || !adminName || !email || !password) {
    return { success: false, error: 'All fields are required.' };
  }

  try {
    // 1. Create the new restaurant document
    const restaurantRef = await addDoc(collection(db, 'restaurants'), {
      name: restaurantName,
      createdAt: new Date(),
    });
    const restaurantId = restaurantRef.id;

    // 2. Create the admin user within the new restaurant's 'admins' sub-collection
    const adminRef = doc(collection(db, 'restaurants', restaurantId, 'admins'));
    await setDoc(adminRef, {
      name: adminName,
      email: email,
      password: password, // In a real app, this should be hashed!
    });
    const adminId = adminRef.id;

    // 3. Prepare admin object to return for auto-login
    const admin: Omit<Admin, 'password'> = {
        id: adminId,
        name: adminName,
        email: email,
        restaurantId: restaurantId,
    };

    return { success: true, admin };

  } catch (e) {
    console.error('Admin signup error:', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'An unexpected error occurred during sign-up.' };
  }
}
