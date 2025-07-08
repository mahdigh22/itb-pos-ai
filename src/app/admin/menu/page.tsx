
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function AdminMenuPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Menu Management</h1>
                    <p className="text-muted-foreground">Manage your categories and menu items.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Item
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Menu Items</CardTitle>
                    <CardDescription>A list of all items on your menu.</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">A table of menu items will be displayed here.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>Manage your menu categories.</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">A list of categories will be displayed here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
