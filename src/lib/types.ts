export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageHint: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface OrderItem extends MenuItem {
  quantity: number;
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
