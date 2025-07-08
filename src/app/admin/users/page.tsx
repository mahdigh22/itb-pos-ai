import UsersClient from "@/components/admin/users-client";
import { getUsers } from "./actions";

// This is now a React Server Component (RSC)
export default async function AdminUsersPage() {
    // It fetches data on the server.
    const members = await getUsers();

    // It passes the initial data to a Client Component.
    return (
       <UsersClient initialMembers={members} />
    );
}
