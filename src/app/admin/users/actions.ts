'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, Timestamp, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member } from '@/lib/types';

export async function addUser(formData: FormData) {
  const newUser: Omit<Member, 'id'> = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    joined: new Date().toISOString(),
    avatarUrl: 'https://placehold.co/100x100.png',
    avatarHint: 'placeholder person',
  };

  try {
    await addDoc(collection(db, 'members'), {
      ...newUser,
      joined: Timestamp.fromDate(new Date(newUser.joined)), // Store as Firestore Timestamp
    });
    revalidatePath('/admin/users');
    revalidatePath('/');
    revalidatePath('/members');
    return { success: true };
  } catch (e) {
    console.error('Error adding document: ', e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: 'Failed to add user.' };
  }
}

export async function updateUser(id: string, formData: FormData) {
    const userUpdates = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
    };

    try {
        const userRef = doc(db, 'members', id);
        await updateDoc(userRef, userUpdates);
        revalidatePath('/admin/users');
        revalidatePath('/');
        revalidatePath('/members');
        revalidatePath(`/members/${id}`);
        return { success: true };
    } catch (e) {
        console.error('Error updating document: ', e);
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Failed to update user.' };
    }
}

export async function deleteUser(id: string) {
    try {
        await deleteDoc(doc(db, 'members', id));
        revalidatePath('/admin/users');
        revalidatePath('/');
        revalidatePath('/members');
        return { success: true };
    } catch (e) {
        console.error('Error deleting document: ', e);
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Failed to delete user.' };
    }
}

export async function getUsers(): Promise<Member[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'members'));
    const members: Member[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      members.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        joined: (data.joined as Timestamp).toDate().toISOString(),
        avatarUrl: data.avatarUrl,
        avatarHint: data.avatarHint,
      });
    });
    return members.sort((a,b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching users: ", error);
    return [];
  }
}

export async function getMember(id: string): Promise<Member | null> {
    try {
        const docRef = doc(db, 'members', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                joined: (data.joined as Timestamp).toDate().toISOString(),
                avatarUrl: data.avatarUrl,
                avatarHint: data.avatarHint,
            };
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching member: ", error);
        return null;
    }
}
