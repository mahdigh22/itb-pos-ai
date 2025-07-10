
import ExtrasClient from '@/components/admin/extras-client';
import { getExtras } from './actions';

export default async function ExtrasPage() {
  const extras = await getExtras();
  return <ExtrasClient initialExtras={extras} />;
}
