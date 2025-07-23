// src/lib/serverActions.ts
import { 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    collection 
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  // Server is always online - no offline checks needed
  export async function serverAdd(path: string, data: any) {
    const colRef = collection(db, path);
    return await addDoc(colRef, data);
  }
  
  export async function serverUpdate(path: string, data: any) {
    const docRef = doc(db, path);
    return await updateDoc(docRef, data);
  }
  
  export async function serverDelete(path: string) {
    const docRef = doc(db, path);
    return await deleteDoc(docRef);
  }