
'use server';

import { revalidatePath } from 'next/cache';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PriceList } from '@/lib/types';

const SETTINGS_COLLECTION = 'settings';
const MAIN_SETTINGS_DOC = 'main';

interface Settings {
    taxRate: number;
    priceLists: PriceList[];
    activePriceListId?: string;
}

export async function getSettings(restaurantId: string): Promise<Settings> {
    try {
        if (!restaurantId) {
            throw new Error("Restaurant ID is required to get settings.");
        }
        const docRef = doc(db, 'restaurants', restaurantId, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as Settings;
        } else {
            const defaultSettings: Settings = {
                taxRate: 0,
                priceLists: [
                    { id: 'pl-1', name: 'Default', discount: 0 },
                    { id: 'pl-2', name: 'Happy Hour', discount: 20 },
                    { id: 'pl-3', name: 'Employee Discount', discount: 50 },
                ],
                activePriceListId: 'pl-1',
            };
            await setDoc(docRef, defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error("Error fetching settings: ", error);
        return { taxRate: 0, priceLists: [], activePriceListId: undefined };
    }
}

export async function saveTaxRate(restaurantId: string, newRate: number) {
    try {
        const docRef = doc(db, 'restaurants', restaurantId, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC);
        await updateDoc(docRef, { taxRate: newRate });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error("Error saving tax rate: ", error);
        return { success: false, error: 'Failed to save tax rate.' };
    }
}

export async function saveActivePriceList(restaurantId: string, priceListId: string | null) {
    try {
        const docRef = doc(db, 'restaurants', restaurantId, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC);
        await updateDoc(docRef, { activePriceListId: priceListId || null });
        revalidatePath('/admin/settings');
        revalidatePath('/'); // For POS
        return { success: true };
    } catch (error) {
        console.error("Error saving active price list: ", error);
        return { success: false, error: 'Failed to save active price list.' };
    }
}

export async function addPriceList(restaurantId: string, formData: FormData) {
    const newPriceList: PriceList = {
        id: `pl-${Date.now()}`,
        name: formData.get('name') as string,
        discount: parseFloat(formData.get('discount') as string),
    };
    
    try {
        const docRef = doc(db, 'restaurants', restaurantId, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC);
        await updateDoc(docRef, {
            priceLists: arrayUnion(newPriceList)
        });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error("Error adding price list: ", error);
        return { success: false, error: 'Failed to add price list.' };
    }
}

export async function updatePriceList(restaurantId: string, id: string, formData: FormData) {
    const updatedPriceList: Partial<PriceList> = {
        name: formData.get('name') as string,
        discount: parseFloat(formData.get('discount') as string),
    };
    
    try {
        const settings = await getSettings(restaurantId);
        const updatedPriceLists = settings.priceLists.map(pl => 
            pl.id === id ? { ...pl, ...updatedPriceList } : pl
        );
        
        const docRef = doc(db, 'restaurants', restaurantId, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC);
        await updateDoc(docRef, { priceLists: updatedPriceLists });

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error("Error updating price list: ", error);
        return { success: false, error: 'Failed to update price list.' };
    }
}

export async function deletePriceList(restaurantId: string, id: string) {
    try {
        const settings = await getSettings(restaurantId);
        const updatedPriceLists = settings.priceLists.filter(pl => pl.id !== id);
        
        const docRef = doc(db, 'restaurants', restaurantId, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC);
        
        const updateData: { priceLists: PriceList[], activePriceListId?: string | null } = {
            priceLists: updatedPriceLists
        };

        if (settings.activePriceListId === id) {
            updateData.activePriceListId = null;
        }

        await updateDoc(docRef, updateData);

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error("Error deleting price list: ", error);
        return { success: false, error: 'Failed to delete price list.' };
    }
}
