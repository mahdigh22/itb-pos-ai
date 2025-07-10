
import TablesClient from '@/components/admin/tables-client';
import { getTables } from './actions';

export default async function TablesPage() {
  const tables = await getTables();
  return <TablesClient initialTables={tables} />;
}
