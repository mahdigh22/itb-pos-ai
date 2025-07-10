
'use server';

import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Admin } from '@/lib/types';

// Function to ensure a default admin exists
async function ensureDefaultAdmin() {
  const adminQuery = query(collection(db, 'admins'), where('email', '==', 'admin@default.com'));
  const adminSnap = await getDocs(adminQuery);
  
  if (adminSnap.empty) {
    console.log("No default admin found, creating one...");
    await setDoc(doc(collection(db, 'admins')), {
      name: 'Default Admin',
      email: 'admin@default.com',
      password: 'password' // In a real app, use a secure, hashed password
    });
  }
}

export async function loginAdmin(formData: FormData) {
  await ensureDefaultAdmin(); // Ensure default admin exists before any login attempt

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    const q = query(
      collection(db, 'admins'),
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
