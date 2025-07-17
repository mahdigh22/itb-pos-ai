
'use server';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Employee } from '@/lib/types';
import { ensureDefaultRestaurant } from '@/lib/data';

export async function loginEmployee(formData: FormData) {
  // We no longer want to auto-create a restaurant from the employee login page.
  // Let's ensure one exists, but the primary creation path is via admin login/signup.

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
    if (restaurantsSnapshot.empty) {
      // Create a default restaurant if none exist, useful for first-time setup.
      await ensureDefaultRestaurant();
      // After creation, re-fetch to get the list (which will now have one).
      const newRestaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
      if (newRestaurantsSnapshot.empty) {
        return { success: false, error: 'System not initialized. Please log in as an admin first.' };
      }
      return { success: false, error: 'System has been initialized. Please try logging in again.' };
    }

    for (const restaurantDoc of restaurantsSnapshot.docs) {
      const restaurantId = restaurantDoc.id;
      const employeesCollectionRef = collection(db, 'restaurants', restaurantId, 'employees');
      
      const q = query(employeesCollectionRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const employeeDoc = querySnapshot.docs[0];
        const employeeData = employeeDoc.data();

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
          // Found the email but password doesn't match. We can stop searching.
          return { success: false, error: 'Invalid password.' };
        }
      }
    }

    // Looped through all restaurants and didn't find the email.
    return { success: false, error: 'No employee found with that email.' };

  } catch (e) {
    console.error('Login error:', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}
