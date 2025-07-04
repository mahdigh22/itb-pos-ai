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
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'bruschetta food'
  },
  {
    id: 'app-2',
    name: 'Spinach Dip',
    description: 'Creamy spinach and artichoke dip served with tortilla chips.',
    price: 10.50,
    category: 'appetizers',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'spinach dip'
  },
  {
    id: 'app-3',
    name: 'Calamari',
    description: 'Lightly fried calamari with a spicy marinara sauce.',
    price: 12.00,
    category: 'appetizers',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'fried calamari'
  },
  // Mains
  {
    id: 'main-1',
    name: 'Grilled Salmon',
    description: 'Salmon fillet grilled to perfection, served with asparagus.',
    price: 22.99,
    category: 'mains',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'grilled salmon'
  },
  {
    id: 'main-2',
    name: 'Classic Burger',
    description: 'Angus beef patty with lettuce, tomato, and our special sauce.',
    price: 15.50,
    category: 'mains',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'classic burger'
  },
  {
    id: 'main-3',
    name: 'Spaghetti Carbonara',
    description: 'Classic pasta with pancetta, pecorino cheese, and egg.',
    price: 18.00,
    category: 'mains',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'spaghetti carbonara'
  },
  {
    id: 'main-4',
    name: 'Ribeye Steak',
    description: '12oz Ribeye served with mashed potatoes and gravy.',
    price: 32.00,
    category: 'mains',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'ribeye steak'
  },
  // Drinks
  {
    id: 'drink-1',
    name: 'Iced Tea',
    description: 'Freshly brewed and chilled to perfection.',
    price: 3.00,
    category: 'drinks',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'iced tea'
  },
  {
    id: 'drink-2',
    name: 'Craft Beer',
    description: 'A selection of local and imported craft beers.',
    price: 7.50,
    category: 'drinks',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'craft beer'
  },
  {
    id: 'drink-3',
    name: 'House Red Wine',
    description: 'A smooth and balanced red, perfect with any main.',
    price: 9.00,
    category: 'drinks',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'glass wine'
  },
  // Desserts
  {
    id: 'dessert-1',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a molten center, served with vanilla ice cream.',
    price: 9.50,
    category: 'desserts',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'lava cake'
  },
  {
    id: 'dessert-2',
    name: 'New York Cheesecake',
    description: 'Creamy cheesecake with a graham cracker crust.',
    price: 8.00,
    category: 'desserts',
    imageUrl: 'https://placehold.co/600x400.png',
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
    avatarUrl: 'https://placehold.co/100x100.png',
    avatarHint: 'woman smiling',
  },
  {
    id: 'mem-2',
    name: 'Bob Williams',
    email: 'bob.w@example.com',
    phone: '555-0102',
    joined: '2023-02-20T11:30:00Z',
    avatarUrl: 'https://placehold.co/100x100.png',
    avatarHint: 'man portrait',
  },
  {
    id: 'mem-3',
    name: 'Charlie Brown',
    email: 'charlie.b@example.com',
    phone: '555-0103',
    joined: '2023-03-10T09:00:00Z',
    avatarUrl: 'https://placehold.co/100x100.png',
    avatarHint: 'man smiling',
  },
  {
    id: 'mem-4',
    name: 'Diana Prince',
    email: 'diana.p@example.com',
    phone: '555-0104',
    joined: '2023-04-05T14:00:00Z',
    avatarUrl: 'https://placehold.co/100x100.png',
    avatarHint: 'woman portrait',
  },
    {
    id: 'mem-5',
    name: 'Ethan Hunt',
    email: 'ethan.h@example.com',
    phone: '555-0105',
    joined: '2023-05-25T18:00:00Z',
    avatarUrl: 'https://placehold.co/100x100.png',
    avatarHint: 'man glasses',
  },
];
