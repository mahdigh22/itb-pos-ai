
'use server';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Employee } from '@/lib/types';

export async function loginEmployee(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    const q = query(
      collection(db, 'employees'),
      where('email', '==', email),
      where('password', '==', password) // In a real app, use hashed passwords
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const employeeDoc = querySnapshot.docs[0];
    const employeeData = employeeDoc.data();
    
    const employee: Omit<Employee, 'password'> = {
        id: employeeDoc.id,
        name: employeeData.name,
        email: employeeData.email,
        role: employeeData.role,
        startDate: employeeData.startDate.toDate().toISOString(),
    };

    return { success: true, employee };

  } catch (e) {
    console.error('Login error:', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}
