import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { Category, MenuItem } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface MenuDisplayProps {
  categories: Category[];
  menuItems: MenuItem[];
  onAddItem: (item: MenuItem) => void;
}

export default function MenuDisplay({ categories, menuItems, onAddItem }: MenuDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Menu</CardTitle>
        <CardDescription>Select items to add to the order</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={categories[0].id} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-4">
              <ScrollArea className="h-[calc(100vh-22rem)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
                  {menuItems
                    .filter((item) => item.category === category.id)
                    .map((item) => (
                      <Card key={item.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md">
                         <div className="relative w-full h-40">
                           <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            data-ai-hint={item.imageHint}
                            className="object-cover"
                          />
                         </div>
                        <CardHeader className="flex-grow pb-2">
                          <CardTitle className="font-headline text-lg">{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                           <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                          <p className="font-semibold text-lg">${item.price.toFixed(2)}</p>
                          <Button size="sm" onClick={() => onAddItem(item)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
