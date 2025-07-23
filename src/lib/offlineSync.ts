"use client";

import { dbQueue } from './dexieOfflineQueue';
import { v4 as uuidv4 } from 'uuid';
import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from './firebase';

export const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine;
console.log('isOnline', isOnline());
export async function safeAdd(path: string, data: any) {
  if (isOnline()) {
    const colRef = collection(db, path);
    return await addDoc(colRef, data);
  } else {
    await dbQueue.mutations.add({
      id: uuidv4(),
      type: 'add',
      path,
      data,
      timestamp: Date.now(),
    });
    return { id: uuidv4(), ...data, _offline: true };
  }
}

export async function safeUpdate(path: string, data: any) {
  if (isOnline()) {
    const docRef = doc(db, path);
    return await updateDoc(docRef, data);
  } else {
    await dbQueue.mutations.add({
      id: uuidv4(),
      type: 'update',
      path,
      data,
      timestamp: Date.now(),
    });
  }
}

export async function safeDelete(path: string) {
  if (isOnline()) {
    const docRef = doc(db, path);
    return await deleteDoc(docRef);
  } else {
    await dbQueue.mutations.add({
      id: uuidv4(),
      type: 'delete',
      path,
      data: null,
      timestamp: Date.now(),
    });
  }
}
