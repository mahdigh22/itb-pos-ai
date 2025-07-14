
import ExtrasClient from '@/components/admin/extras-client';
import { getExtras } from './actions';
import { getIngredients } from '../ingredients/actions';

export default async function ExtrasPage() {
  const [extras, ingredients] = await Promise.all([
    getExtras(),
    getIngredients(),
  ]);

  return <ExtrasClient initialExtras={extras} availableIngredients={ingredients} />;
}
