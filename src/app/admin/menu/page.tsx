import MenuClient from "@/components/admin/menu-client";
import { getMenuItems, getCategories } from "./actions";
import { getIngredients } from "../ingredients/actions";

export default async function AdminMenuPage() {
    const [menuItems, categories, availableIngredients] = await Promise.all([
        getMenuItems(),
        getCategories(),
        getIngredients()
    ]);

    return (
       <MenuClient 
        initialMenuItems={menuItems} 
        initialCategories={categories} 
        availableIngredients={availableIngredients}
    />
    );
}
