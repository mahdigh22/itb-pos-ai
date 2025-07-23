import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'pos_offline_db';
const DB_VERSION = 1;

interface MenuItem {
  id: string;
  name: string;
  price: number;
  // Add other relevant menu item properties
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
  status: string; // e.g., 'pending_sync', 'synced'
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
}

export const initLocalDatabase = async (): Promise<IDBPDatabase<LocalDatabase>> => {
  return openDB<LocalDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('menuItems')) {
        db.createObjectStore('menuItems', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('checks')) {
        db.createObjectStore('checks', { keyPath: 'id' });
      }
    },
  });
};

export const addMenuItem = async (item: MenuItem) => {
  const db = await initLocalDatabase();
  await db.put('menuItems', item);
};

export const getMenuItems = async (): Promise<MenuItem[]> => {
  const db = await initLocalDatabase();
  return db.getAll('menuItems');
};

export const addOrder = async (order: Order) => {
  const db = await initLocalDatabase();
  await db.put('orders', order);
};

export const getOrders = async (): Promise<Order[]> => {
  const db = await initLocalDatabase();
  return db.getAll('orders');
};

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
