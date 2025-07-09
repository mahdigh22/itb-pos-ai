
'use server';

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Admin } from "@/lib/types";

export async function loginAdmin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const q = query(collection(db, "admins"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    // Bootstrap for first-time login
    if (querySnapshot.empty && email === 'admin@example.com' && password === 'password') {
        const newAdmin: Omit<Admin, 'id'> = {
            name: 'Default Admin',
            email: 'admin@example.com',
        };
        // In a real app, you would hash the password here before saving
        // For simplicity, we are not storing the bootstrap password.
        
        return { success: true, admin: { id: 'bootstrap', ...newAdmin } };
    }


    if (querySnapshot.empty) {
      return { success: false, error: 'No admin found with that email.' };
    }

    const adminDoc = querySnapshot.docs[0];
    const admin = { id: adminDoc.id, ...adminDoc.data() } as Admin;

    // In a real app, you'd compare hashed passwords.
    // This is a placeholder for the actual password check.
    if (admin.password === password) {
        const { password, ...adminData } = admin;
        return { success: true, admin: adminData };
    } else {
        return { success: false, error: 'Incorrect password.' };
    }
  } catch (e) {
    console.error("Admin login error: ", e);
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}
