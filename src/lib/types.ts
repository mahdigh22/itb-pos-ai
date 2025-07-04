
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageHint: string;
  ingredients?: string[];
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

export interface ActiveOrder {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: Date;
}
