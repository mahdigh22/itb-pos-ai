// src/lib/syncOfflineQueue.ts
import { dbQueue } from './dexieOfflineQueue';
import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function syncOfflineQueue() {
  const queue = await dbQueue.mutations.orderBy('timestamp').toArray();

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
    } catch (err) {
      console.error('Failed to sync mutation:', mutation, err);
      // stop sync if a single operation fails (to avoid corrupt state)
      break;
    }
  }
}
