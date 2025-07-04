import type { Category, MenuItem, Member } from './types';

export const categories: Category[] = [
  { id: 'appetizers', name: 'Appetizers' },
  { id: 'mains', name: 'Mains' },
  { id: 'drinks', name: 'Drinks' },
  { id: 'desserts', name: 'Desserts' },
];

export const menuItems: MenuItem[] = [
  // Appetizers
  {
    id: 'app-1',
    name: 'Bruschetta',
    description: 'Grilled bread with tomatoes, garlic, basil, and olive oil.',
    price: 8.99,
    category: 'appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-6f7a6e1f9a2c?w=600&h=400&fit=crop',
    imageHint: 'bruschetta food'
  },
  {
    id: 'app-2',
    name: 'Spinach Dip',
    description: 'Creamy spinach and artichoke dip served with tortilla chips.',
    price: 10.50,
    category: 'appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1563245365-949526924376?w=600&h=400&fit=crop',
    imageHint: 'spinach dip'
  },
  {
    id: 'app-3',
    name: 'Calamari',
    description: 'Lightly fried calamari with a spicy marinara sauce.',
    price: 12.00,
    category: 'appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1625944239901-29008f1177b8?w=600&h=400&fit=crop',
    imageHint: 'fried calamari'
  },
  // Mains
  {
    id: 'main-1',
    name: 'Grilled Salmon',
    description: 'Salmon fillet grilled to perfection, served with asparagus.',
    price: 22.99,
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=400&fit=crop',
    imageHint: 'grilled salmon'
  },
  {
    id: 'main-2',
    name: 'Classic Burger',
    description: 'Angus beef patty with lettuce, tomato, and our special sauce.',
    price: 15.50,
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop',
    imageHint: 'classic burger'
  },
  {
    id: 'main-3',
    name: 'Spaghetti Carbonara',
    description: 'Classic pasta with pancetta, pecorino cheese, and egg.',
    price: 18.00,
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1612874426725-b40a4a4a4c8e?w=600&h=400&fit=crop',
    imageHint: 'spaghetti carbonara'
  },
  {
    id: 'main-4',
    name: 'Ribeye Steak',
    description: '12oz Ribeye served with mashed potatoes and gravy.',
    price: 32.00,
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1629517565931-fe147b1f5f9e?w=600&h=400&fit=crop',
    imageHint: 'ribeye steak'
  },
  // Drinks
  {
    id: 'drink-1',
    name: 'Iced Tea',
    description: 'Freshly brewed and chilled to perfection.',
    price: 3.00,
    category: 'drinks',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c859129?w=600&h=400&fit=crop',
    imageHint: 'iced tea'
  },
  {
    id: 'drink-2',
    name: 'Craft Beer',
    description: 'A selection of local and imported craft beers.',
    price: 7.50,
    category: 'drinks',
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop',
    imageHint: 'craft beer'
  },
  {
    id: 'drink-3',
    name: 'House Red Wine',
    description: 'A smooth and balanced red, perfect with any main.',
    price: 9.00,
    category: 'drinks',
    imageUrl: 'https://images.unsplash.com/photo-1553356658-27f20235373a?w=600&h=400&fit=crop',
    imageHint: 'glass wine'
  },
  // Desserts
  {
    id: 'dessert-1',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a molten center, served with vanilla ice cream.',
    price: 9.50,
    category: 'desserts',
    imageUrl: 'https://images.unsplash.com/photo-1618313936852-32d733b49e19?w=600&h=400&fit=crop',
    imageHint: 'lava cake'
  },
  {
    id: 'dessert-2',
    name: 'New York Cheesecake',
    description: 'Creamy cheesecake with a graham cracker crust.',
    price: 8.00,
    category: 'desserts',
    imageUrl: 'https://images.unsplash.com/photo-1542826438-e6a388456f5d?w=600&h=400&fit=crop',
    imageHint: 'newyork cheesecake'
  },
];

export const members: Member[] = [
  {
    id: 'mem-1',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    phone: '555-0101',
    joined: '2023-01-15T10:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    avatarHint: 'woman smiling',
  },
  {
    id: 'mem-2',
    name: 'Bob Williams',
    email: 'bob.w@example.com',
    phone: '555-0102',
    joined: '2023-02-20T11:30:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    avatarHint: 'man portrait',
  },
  {
    id: 'mem-3',
    name: 'Charlie Brown',
    email: 'charlie.b@example.com',
    phone: '555-0103',
    joined: '2023-03-10T09:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
    avatarHint: 'man smiling',
  },
  {
    id: 'mem-4',
    name: 'Diana Prince',
    email: 'diana.p@example.com',
    phone: '555-0104',
    joined: '2023-04-05T14:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=100&h=100&fit=crop',
    avatarHint: 'woman portrait',
  },
    {
    id: 'mem-5',
    name: 'Ethan Hunt',
    email: 'ethan.h@example.com',
    phone: '555-0105',
    joined: '2023-05-25T18:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    avatarHint: 'man glasses',
  },
];
