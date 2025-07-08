
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold font-headline">System Settings</h1>
                <p className="text-muted-foreground">Manage general application settings.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Taxes</CardTitle>
                    <CardDescription>Manage tax rates for your business.</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">Tax settings form will be displayed here.</p>
                   <Button className="mt-4">Save Changes</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Price Lists</CardTitle>
                    <CardDescription>Manage different price lists (e.g., Happy Hour).</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">Price list management will be displayed here.</p>
                   <Button className="mt-4">Manage Price Lists</Button>
                </CardContent>
            </Card>
        </div>
    );
}
