
'use server';

import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Employee } from '@/lib/types';

export async function loginEmployee(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    // Query across all 'employees' sub-collections in all restaurants by email only
    const q = query(
      collectionGroup(db, 'employees'),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'No employee found with that email.' };
    }

    // Since emails should be unique, we expect at most one result, but we'll iterate just in case.
    for (const employeeDoc of querySnapshot.docs) {
        const employeeData = employeeDoc.data();
        
        // Now, verify the password in the application code.
        if (employeeData.password === password) {
            const restaurantId = employeeDoc.ref.parent.parent?.id;

            if (!restaurantId) {
                return { success: false, error: 'Could not determine the restaurant for this employee.' };
            }
            
            const employee: Omit<Employee, 'password'> = {
                id: employeeDoc.id,
                name: employeeData.name,
                email: employeeData.email,
                role: employeeData.role,
                startDate: employeeData.startDate.toDate().toISOString(),
                restaurantId: restaurantId,
            };

            return { success: true, employee };
        }
    }

    // If we get here, it means we found an email but the password was wrong for all matches.
    return { success: false, error: 'Invalid password.' };

  } catch (e) {
    console.error('Login error:', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}
