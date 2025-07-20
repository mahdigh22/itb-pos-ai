
'use server';

import { collection, addDoc, doc, setDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Admin } from '@/lib/types';

async function isEmailInUse(email: string): Promise<boolean> {
    const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
    for (const restaurantDoc of restaurantsSnapshot.docs) {
        const adminsCollectionRef = collection(db, 'restaurants', restaurantDoc.id, 'admins');
        const q = query(adminsCollectionRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return true;
        }
    }
    return false;
}

export async function signupAdmin(formData: FormData) {
  const restaurantName = formData.get('restaurantName') as string;
  const adminName = formData.get('adminName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!restaurantName || !adminName || !email || !password) {
    return { success: false, error: 'All fields are required.' };
  }
  
  const emailExists = await isEmailInUse(email);
  if (emailExists) {
      return { success: false, error: 'This email address is already in use.' };
  }

  try {
    const restaurantRef = await addDoc(collection(db, 'restaurants'), {
      name: restaurantName,
      createdAt: new Date(),
    });
    const restaurantId = restaurantRef.id;

    const adminRef = doc(collection(db, 'restaurants', restaurantId, 'admins'));
    await setDoc(adminRef, {
      name: adminName,
      email: email,
      password: password, 
    });
    const adminId = adminRef.id;

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
