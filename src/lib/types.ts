export type OrderType = "Dine In" | "Take Away" | "Delivery";

export interface RestaurantTable {
  id: string;
  name: string;
}

export interface Ingredient {
  id: string;
  name: string;
  stock: number; // The current quantity in stock
  unit: string; // e.g., 'grams', 'pcs', 'ml'
  cost: number; // The cost per unit
  isOptional?: boolean;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  ingredientLinks?: {
    ingredientId: string;
    quantity: number;
  }[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // This is the sell price (customer price)
  cost: number; // This is the calculated cost of goods sold
  category: string;
  imageUrl: string;
  imageHint: string;
  preparationTime: number; // in minutes

  // Stored in Firestore
  ingredientLinks: {
    ingredientId: string;
    isOptional: boolean;
    quantity: number; // The amount of this ingredient used in the recipe
  }[];

  // Populated in getMenuItems for UI consumption
  ingredients: {
    id: string;
    name: string;
    isOptional: boolean;
    quantity: number; // The amount of this ingredient used in the recipe
    unit: string; // Unit for context, e.g. 'grams'
    stock: number;
    cost: number;
  }[];
}

export interface Category {
  id: string;
  name: string;
}

export interface OrderItem extends MenuItem {
  lineItemId: string; // Unique ID for this line in the order
  quantity: number;
  customizations: {
    added: Extra[];
    removed: { id: string; name: string }[];
  };
  status: "new" | "sent" | "cancelled" | "edited";
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

export type OrderStatus = "Pending" | "Preparing" | "Ready" | "Completed" | "Archived";

// This is an order that has been sent to the kitchen
export interface ActiveOrder {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: Date;
  checkName: string;
  sourceCheckId?: string; // Link back to the original check
  totalPreparationTime: number; // in minutes
  orderType: OrderType;
  tableId?: string;
  tableName?: string;
  customerName?: string;
  priceListId?: string;
  discountApplied?: number; // as a percentage
  employeeId?: string;
  employeeName?: string;
}

// This is a "check" or "tab" that is currently being built
export interface Check {
  id: string;
  name: string;
  items: OrderItem[];
  orderType?: OrderType;
  tableId?: string;
  tableName?: string;
  customerName?: string;
  priceListId?: string;
  employeeId?: string;
  employeeName?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "Manager" | "Server" | "Chef";
  startDate: string; // ISO date string
  restaurantId: string; // New field for multi-tenancy
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  password?: string;
  restaurantId: string; // New field for multi-tenancy
}

export interface PriceList {
  id: string;
  name: string;
  discount: number; // as a percentage
}
