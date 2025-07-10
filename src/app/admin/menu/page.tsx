
import MenuClient from '@/components/admin/menu-client';
import { getMenuItems, getCategories } from './actions';
import { getIngredients } from '../ingredients/actions';

export default async function MenuPage() {
  const [menuItems, categories, ingredients] = await Promise.all([
    getMenuItems(),
    getCategories(),
    getIngredients()
  ]);

  return <MenuClient initialMenuItems={menuItems} initialCategories={categories} availableIngredients={ingredients} />;
}
