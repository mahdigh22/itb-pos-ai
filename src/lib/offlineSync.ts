"use client";

import { dbQueue } from "./dexieOfflineQueue";
import { v4 as uuidv4 } from "uuid";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  collection,
} from "firebase/firestore";
import { db } from "./firebase";
import { openDB } from "idb";

export const isOnline = () =>
  typeof navigator !== "undefined" && navigator.onLine;

const DB_NAME = "restaurantAppDB";
const DB_VERSION = 1;

// Initialize the database
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores for each data type
      if (!db.objectStoreNames.contains("checks")) {
        db.createObjectStore("checks", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("members")) {
        db.createObjectStore("members", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("menuItems")) {
        db.createObjectStore("menuItems", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("extras")) {
        db.createObjectStore("extras", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "restaurantId" });
      }
      if (!db.objectStoreNames.contains("tables")) {
        db.createObjectStore("tables", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("restaurantInfo")) {
        db.createObjectStore("restaurantInfo", { keyPath: "id" });
      }
      
    },
  });
}

const storeKeyPaths: Record<string, string> = {
  members: "id",
  menuItems: "id",
  categories: "id",
  extras: "id",
  settings: "restaurantId",
  tables: "id",
  restaurantInfo: "id",
  checks: "id",
};

export async function saveData(storeName: string, data: any) {
  const db = await initDB();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  const keyPath = storeKeyPaths[storeName];

  if (!keyPath) {
    throw new Error(`Unknown keyPath for store "${storeName}"`);
  }

  const assignKeyIfNeeded = (item: any) => {
    if (!item[keyPath]) {
      // Auto assign key if it's "id", but not if it's "restaurantId"
      if (keyPath === "id") {
        item.id = uuidv4();
      } else {
        throw new Error(
          `Missing required key "${keyPath}" for store "${storeName}"`
        );
      }
    }
    store.put(item);
  };

  if (Array.isArray(data)) {
    data.forEach(assignKeyIfNeeded);
  } else {
    assignKeyIfNeeded(data);
  }

  await tx.done;
}

// Load data from IndexedDB
export async function loadData(storeName: string) {
  const db = await initDB();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  return store.getAll();
}

// Get single item by key
export async function getDataByKey(storeName: string, key: any) {
  const db = await initDB();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  return store.get(key);
}

// Clear all data (for logout)
export async function clearAllStores() {
  const db = await initDB();
  const storeNames = Array.from(db.objectStoreNames);

  await Promise.all(
    storeNames.map(async (storeName) => {
      const tx = db.transaction(storeName, "readwrite");
      await tx.objectStore(storeName).clear();
      await tx.done;
    })
  );
}
export async function safeAdd(path: string, data: any) {
  if (isOnline()) {
    const colRef = collection(db, path);
    return await addDoc(colRef, data);
  } else {
    await dbQueue.mutations.add({
      id: uuidv4(),
      type: "add",
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
      type: "update",
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
      type: "delete",
      path,
      data: null,
      timestamp: Date.now(),
    });
  }
}
