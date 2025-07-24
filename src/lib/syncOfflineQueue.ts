// src/lib/syncOfflineQueue.ts
import { dbQueue } from './dexieOfflineQueue';
import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

type SyncCallbacks = {
  onStart?: (total: number) => void;
  onProgress?: (completed: number, total: number, mutation: any) => void;
  onSuccess?: (mutation: any) => void;
  onError?: (mutation: any, error: any) => void;
  onComplete?: (completed: number, total: number) => void;
};

export async function syncOfflineQueue(callbacks: SyncCallbacks = {}) {
  const queue = await dbQueue.mutations.orderBy('timestamp').toArray();
  const total = queue.length;
  let completed = 0;

  callbacks.onStart?.(total);

  for (const mutation of queue) {
    try {
      const { type, path, data } = mutation;

      if (type === 'add') {
        const colRef = collection(db, path);
        await addDoc(colRef, data);
      } else if (type === 'update') {
        const docRef = doc(db, path);
        await updateDoc(docRef, data);
      } else if (type === 'delete') {
        const docRef = doc(db, path);
        await deleteDoc(docRef);
      }

      await dbQueue.mutations.delete(mutation.id);
      completed++;

      callbacks.onSuccess?.(mutation);
      callbacks.onProgress?.(completed, total, mutation);
    } catch (error) {
      callbacks.onError?.(mutation, error);
      break; // stop on first failure
    }
  }

  callbacks.onComplete?.(completed, total);
}
