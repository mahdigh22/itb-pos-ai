import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Menu</CardTitle>
        <CardDescription>Select items to add to the order</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue={categories[0].id} className="w-full flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="h-14 text-base">
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-4 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
                  {menuItems
                    .filter((item) => item.category === category.id)
                    .map((item) => (
                       <Card
                        key={item.id}
                        onClick={() => onAddItem(item)}
                        className="group flex flex-col overflow-hidden rounded-lg border-2 border-transparent transition-all hover:border-primary hover:shadow-lg cursor-pointer"
                      >
                        <div className="relative w-full h-40">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            data-ai-hint={item.imageHint}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardHeader className="flex-grow pb-2">
                          <CardTitle className="font-headline text-lg">{item.name}</CardTitle>
                          <CardDescription className="text-sm text-muted-foreground pt-1 line-clamp-2">
                            {item.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center pt-2">
                            <p className="font-bold text-xl text-primary">
                              ${item.price.toFixed(2)}
                            </p>
                            <PlusCircle className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
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
