
'use server';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Employee } from '@/lib/types';

export async function loginEmployee(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    const q = query(collection(db, 'employees'), where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const employeeDoc = querySnapshot.docs[0];
    const employee = { id: employeeDoc.id, ...employeeDoc.data() } as Employee;

    // In a real app, you would use a secure password hashing library (e.g., bcrypt)
    // to compare hashed passwords. For this prototype, we'll compare plaintext.
    if (employee.password !== password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Return employee data without the password
    const { password: _, ...employeeData } = employee;

    return { success: true, employee: employeeData };

  } catch (e) {
    console.error('Login error:', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}
