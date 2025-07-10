
import IngredientsClient from '@/components/admin/ingredients-client';
import { getIngredients } from './actions';

export default async function IngredientsPage() {
  const ingredients = await getIngredients();
  return <IngredientsClient initialIngredients={ingredients} />;
}
