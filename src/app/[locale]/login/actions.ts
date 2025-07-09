
'use server';

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Employee } from "@/lib/types";

export async function loginEmployee(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const q = query(collection(db, "employees"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'No employee found with that email.' };
    }

    const employeeDoc = querySnapshot.docs[0];
    const employee = { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
    
    if (employee.password === password) {
      // Don't send password to client
      const { password, ...employeeData } = employee;
      return { success: true, employee: employeeData };
    } else {
      return { success: false, error: 'Incorrect password.' };
    }

  } catch (e) {
     console.error("Employee login error: ", e);
     return { success: false, error: 'An unexpected error occurred.' };
  }
}
