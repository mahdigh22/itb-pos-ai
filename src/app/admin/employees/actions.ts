
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, Timestamp, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Employee } from '@/lib/types';

async function getRestaurantIdForEmployee(employeeId: string): Promise<string | null> {
    const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
    for (const restaurantDoc of restaurantsSnapshot.docs) {
        const employeeRef = doc(db, 'restaurants', restaurantDoc.id, 'employees', employeeId);
        const employeeSnap = await getDoc(employeeRef);
        if (employeeSnap.exists()) {
            return restaurantDoc.id;
        }
    }
    return null;
}

export async function addEmployee(restaurantId: string, formData: FormData) {
  const newEmployeeData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    role: formData.get('role') as 'Manager' | 'Server' | 'Chef',
    startDate: Timestamp.fromDate(new Date()),
  };

  if (!newEmployeeData.password) {
    return { success: false, error: 'Password is required for new employees.' };
  }

  try {
    const docRef = await addDoc(collection(db, 'restaurants', restaurantId, 'employees'), newEmployeeData);
    revalidatePath('/admin/employees');
    
    const finalEmployee: Omit<Employee, 'password'> = {
        id: docRef.id,
        name: newEmployeeData.name,
        email: newEmployeeData.email,
        role: newEmployeeData.role,
        startDate: newEmployeeData.startDate.toDate().toISOString(),
        restaurantId: restaurantId,
    };
    
    return { success: true, employee: finalEmployee };
  } catch (e) {
    console.error('Error adding document: ', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'Failed to add employee.' };
  }
}

export async function updateEmployee(restaurantId: string, id: string, formData: FormData) {
  const employeeUpdates: Partial<Omit<Employee, 'id' | 'startDate'>> = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    role: formData.get('role') as 'Manager' | 'Server' | 'Chef',
  };

  const password = formData.get('password') as string;
  if (password) {
    employeeUpdates.password = password;
  }

  try {
    const employeeRef = doc(db, 'restaurants', restaurantId, 'employees', id);
    await updateDoc(employeeRef, employeeUpdates);
    revalidatePath('/admin/employees');
    return { success: true };
  } catch (e) {
    console.error('Error updating document: ', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'Failed to update employee.' };
  }
}

export async function deleteEmployee(restaurantId: string, id: string) {
    try {
        await deleteDoc(doc(db, 'restaurants', restaurantId, 'employees', id));
        revalidatePath('/admin/employees');
        return { success: true };
    } catch (e) {
        console.error('Error deleting document: ', e);
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Failed to delete employee.' };
    }
}


export async function getEmployees(restaurantId: string): Promise<Omit<Employee, 'password'>[]> {
  try {
    if (!restaurantId) {
        console.error("getEmployees: restaurantId is required.");
        return [];
    }
    const querySnapshot = await getDocs(collection(db, 'restaurants', restaurantId, 'employees'));
    const employees: Omit<Employee, 'password'>[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      employees.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        startDate: (data.startDate as Timestamp).toDate().toISOString(),
        restaurantId: restaurantId,
      });
    });
    return employees.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching employees: ", error);
    return [];
  }
}
