
import UsersClient from '@/components/admin/users-client';
import { getUsers } from './actions';

export default async function UsersPage() {
  const members = await getUsers();
  return <UsersClient initialMembers={members} />;
}
