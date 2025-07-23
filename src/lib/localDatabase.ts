import { openDB, IDBPDatabase } from 'idb';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'; // Import necessary Firebase functions
import { db as firebaseDb } from './firebase'; // Import Firebase db with a different name

const DB_NAME = 'pos_offline_db';
const DB_VERSION = 1;

interface MenuItem {
  id: string;
  name: string;
  price: number;
  // Add other relevant menu item properties like category, image, etc.
}

export interface RestaurantTable {
  id: string;
  name: string;
  // Add other relevant table properties like status, capacity, etc.
}

interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  // Add other relevant order item properties
}

interface Order {
  id: string;
  table: string;
  items: OrderItem[];
  status: 'pending_sync' | 'synced'; // e.g., 'pending_sync', 'synced'
  timestamp: number;
  // Add other relevant order properties
}

interface Check {
  id: string;
  table: string;
  orders: Order[];
  status: string; // e.g., 'open', 'closed'
  // Add other relevant check properties
}

interface LocalDatabase extends IDBPDatabase {
  'menuItems': {
    key: string;
    value: MenuItem;
  };
  'orders': {
    key: string;
    value: Order;
  };
  'checks': {
    key: string;
    value: Check;
  };
  'tables': {
    key: string;
    value: RestaurantTable;
  };
}

export const initLocalDatabase = async (): Promise<IDBPDatabase<LocalDatabase>> => {
  return openDB<LocalDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('menuItems')) {
        db.createObjectStore('menuItems', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('orders')) {
        const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
        ordersStore.createIndex('status', 'status'); // Create index on 'status'
      }
      if (!db.objectStoreNames.contains('checks')) {
        db.createObjectStore('checks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tables')) {
        db.createObjectStore('tables', { keyPath: 'id' });
      }
    },
  });
};

// Menu Item Functions
export const addMenuItem = async (item: MenuItem) => {
  const db = await initLocalDatabase();
  await db.put('menuItems', item);
};

export const getMenuItems = async (): Promise<MenuItem[]> => {
  const db = await initLocalDatabase();
  return db.getAll('menuItems');
};

export const updateMenuItem = async (item: MenuItem) => {
  const db = await initLocalDatabase();
  await db.put('menuItems', item);
};

export const deleteMenuItem = async (itemId: string) => {
  const db = await initLocalDatabase();
  await db.delete('menuItems', itemId);
};

// Table Functions
export const addTable = async (table: RestaurantTable) => {
  const db = await initLocalDatabase();
  await db.put('tables', table);
};

export const getTables = async (): Promise<RestaurantTable[]> => {
  const db = await initLocalDatabase();
  return db.getAll('tables');
};

export const updateTable = async (table: RestaurantTable) => {
  const db = await initLocalDatabase();
  await db.put('tables', table);
};

export const deleteTable = async (tableId: string) => {
  const db = await initLocalDatabase();
  await db.delete('tables', tableId);
};

// Order Functions
export const addOrder = async (order: Order) => {
  const db = await initLocalDatabase();

  if (!navigator.onLine) {
    // Add to local DB ONLY when offline
    await db.put('orders', { ...order, status: 'pending_sync' });
  }
  // When online, the order will be added directly to Firebase
  // from the component or service handling online order creation.
  // The syncOrders function will handle pushing offline orders to Firebase.
};

export const getOrders = async (): Promise<Order[]> => {
  const db = await initLocalDatabase();
  return db.getAll('orders');
};

// Check Functions
export const addCheck = async (check: Check) => {
  const db = await initLocalDatabase();
  await db.put('checks', check);
};

export const getChecks = async (): Promise<Check[]> => {
  const db = await initLocalDatabase();
  return db.getAll('checks');
};

export const updateCheck = async (check: Check) => {
  const db = await initLocalDatabase();
  await db.put('checks', check);
}

export const deleteCheck = async (checkId: string) => {
  const db = await initLocalDatabase();
  await db.delete('checks', checkId);
}

// Synchronization Functions
export const syncOrders = async () => {
  const db = await initLocalDatabase();
  const pendingOrders = await db.getAllFromIndex('orders', 'status', 'pending_sync');

  for (const order of pendingOrders) {
    if (navigator.onLine) {
      try {
        await addDoc(collection(firebaseDb, 'orders'), { // Use firebaseDb here
          ...order,
          status: 'synced',
        });
        // Update local order status or delete it
        await db.put('orders', { ...order, status: 'synced' });
        // Or delete if you don't need the synced order in local DB
        // await db.delete('orders', order.id);
      } catch (error) {
        console.error('Error syncing order to Firebase:', error);
        // Handle errors (e.g., retry later)
      }
    } else {
      // If offline again during sync, stop and wait for next online event
      break;
    }
  }
};

// You'll need to implement sync functions for other data types (checks, etc.) as well
// export const syncChecks = async () => { ... };
