
'use server';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Admin } from '@/lib/types';

export async function loginAdmin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  // To bootstrap, let's check for a default admin if the collection is empty
  if (email === 'admin@example.com' && password === 'password') {
    const q = query(collection(db, 'admins'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        const bootstrapAdmin: Omit<Admin, 'id'> = {
            name: 'Default Admin',
            email: 'admin@example.com',
        };
        return { success: true, admin: { id: 'bootstrap', ...bootstrapAdmin } };
    }
  }


  try {
    const q = query(collection(db, 'admins'), where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const adminDoc = querySnapshot.docs[0];
    const admin = { id: adminDoc.id, ...adminDoc.data() } as Admin;

    if (admin.password !== password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const { password: _, ...adminData } = admin;

    return { success: true, admin: adminData };

  } catch (e) {
    console.error('Admin login error:', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'An unexpected error occurred during admin login.' };
  }
}
