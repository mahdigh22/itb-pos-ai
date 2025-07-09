
export type OrderType = 'Dine In' | 'Take Away' | 'Delivery';

export interface Ingredient {
  id: string;
  name: string;
  stock: number; // The current quantity in stock
  unit: string; // e.g., 'grams', 'pcs', 'ml'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageHint: string;
  preparationTime: number; // in minutes
  
  // Stored in Firestore
  ingredientLinks?: {
    ingredientId: string;
    isOptional: boolean;
    quantity: number; // The amount of this ingredient used in the recipe
  }[];

  // Populated in getMenuItems for UI consumption
  ingredients?: {
    id: string;
    name: string;
    isOptional: boolean;
    quantity: number; // The amount of this ingredient used in the recipe
    unit: string; // Unit for context, e.g. 'grams'
    stock: number;
  }[];
}

export interface Category {
  id: string;
  name: string;
}

export interface OrderItem extends MenuItem {
  lineItemId: string; // Unique ID for this line in the order
  quantity: number;
  customizations?: {
    added: string[];
    removed: string[];
  };
  status: 'new' | 'sent';
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joined: string; // ISO date string
  avatarUrl: string;
  avatarHint: string;
}

export type OrderStatus = 'Preparing' | 'Ready' | 'Completed';

// This is an order that has been sent to the kitchen
export interface ActiveOrder {
  id:string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: Date;
  checkName: string;
  totalPreparationTime: number; // in minutes
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
}

// This is a "check" or "tab" that is currently being built
export interface Check {
    id: string;
    name: string;
    items: OrderItem[];
    orderType?: OrderType;
    tableNumber?: string;
    customerName?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'Manager' | 'Server' | 'Chef';
  startDate: string; // ISO date string
}

export interface PriceList {
    id: string;
    name: string;
    discount: number; // as a percentage
}
