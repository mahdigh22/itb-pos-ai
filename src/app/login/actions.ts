
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
    // First, get all restaurants
    const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
    if (restaurantsSnapshot.empty) {
      return { success: false, error: 'No restaurants configured in the system.' };
    }

    // Iterate over each restaurant and check for the employee
    for (const restaurantDoc of restaurantsSnapshot.docs) {
      const restaurantId = restaurantDoc.id;
      const employeesCollectionRef = collection(db, 'restaurants', restaurantId, 'employees');
      
      const q = query(employeesCollectionRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const employeeDoc = querySnapshot.docs[0];
        const employeeData = employeeDoc.data();

        // Now, verify the password in the application code.
        if (employeeData.password === password) {
          const employee: Omit<Employee, 'password'> = {
            id: employeeDoc.id,
            name: employeeData.name,
            email: employeeData.email,
            role: employeeData.role,
            startDate: employeeData.startDate.toDate().toISOString(),
            restaurantId: restaurantId,
          };
          return { success: true, employee };
        } else {
          // Found email but password was wrong. Since emails should be unique, we can stop here.
          return { success: false, error: 'Invalid password.' };
        }
      }
    }

    // If we get here, it means we iterated through all restaurants and found no matching email.
    return { success: false, error: 'No employee found with that email.' };

  } catch (e) {
    console.error('Login error:', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}
