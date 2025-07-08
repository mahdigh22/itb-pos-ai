'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Employee } from '@/lib/types';

export async function addEmployee(formData: FormData) {
  const newEmployee: Omit<Employee, 'id'> = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    role: formData.get('role') as 'Manager' | 'Server' | 'Chef',
    startDate: new Date().toISOString(),
  };

  try {
    await addDoc(collection(db, 'employees'), {
      ...newEmployee,
      startDate: Timestamp.fromDate(new Date(newEmployee.startDate)),
    });
    revalidatePath('/admin/employees');
    return { success: true };
  } catch (e) {
    console.error('Error adding document: ', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'Failed to add employee.' };
  }
}

export async function getEmployees(): Promise<Employee[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'employees'));
    const employees: Employee[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      employees.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        startDate: (data.startDate as Timestamp).toDate().toISOString(),
      });
    });
    return employees.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching employees: ", error);
    return [];
  }
}
