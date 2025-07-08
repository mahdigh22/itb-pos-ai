import MenuClient from "@/components/admin/menu-client";
import { getMenuItems, getCategories } from "./actions";

export default async function AdminMenuPage() {
    const menuItems = await getMenuItems();
    const categories = await getCategories();

    return (
       <MenuClient initialMenuItems={menuItems} initialCategories={categories} />
    );
}
