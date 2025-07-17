
'use server';

import { collection, query, where, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Admin } from '@/lib/types';

// Function to ensure a default restaurant and admin exists
async function ensureDefaultAdmin() {
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
  } else {
    restaurantId = restaurantSnap.docs[0].id;
  }
  
  const adminQuery = query(collection(db, 'restaurants', restaurantId, 'admins'), where('email', '==', 'admin@default.com'));
  const adminSnap = await getDocs(adminQuery);
  
  if (adminSnap.empty) {
    console.log("No default admin found, creating one...");
    await setDoc(doc(collection(db, 'restaurants', restaurantId, 'admins')), {
      name: 'Default Admin',
      email: 'admin@default.com',
      password: 'password' // In a real app, use a secure, hashed password
    });
  }

  return restaurantId;
}

export async function loginAdmin(formData: FormData) {
  const restaurantId = await ensureDefaultAdmin(); // Ensure default admin and restaurant exist

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    const q = query(
      collection(db, 'restaurants', restaurantId, 'admins'),
      where('email', '==', email),
      where('password', '==', password) // WARNING: Storing plain text passwords is not secure.
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'Invalid admin email or password.' };
    }

    const adminDoc = querySnapshot.docs[0];
    const adminData = adminDoc.data();
    
    // Return admin data without the password
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
