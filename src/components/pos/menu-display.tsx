

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, BookOpen } from 'lucide-react';
import type { Category, MenuItem } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';

interface MenuDisplayProps {
  categories: Category[];
  menuItems: MenuItem[];
  onAddItem: (item: MenuItem) => void;
}

export default function MenuDisplay({ categories, menuItems, onAddItem }: MenuDisplayProps) {
  const { t } = useTranslation('common');
  
  if (categories.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">{t('menu')}</CardTitle>
          <CardDescription>{t('menuDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 justify-center items-center text-center text-muted-foreground">
            <BookOpen className="w-16 h-16 mb-4"/>
            <p className="font-semibold text-lg">{t('menuEmpty')}</p>
            <p className="text-sm mb-4">{t('menuEmptyDescription')}</p>
            <Button asChild>
                <Link href="/admin/menu">{t('goToMenuManagement')}</Link>
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">{t('menu')}</CardTitle>
        <CardDescription>{t('menuDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue={categories[0].id} className="w-full flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 bg-muted p-1 rounded-lg h-14">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:rounded-lg data-[state=active]:shadow-sm h-12 text-base"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-4 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pr-3">
                  {menuItems
                    .filter((item) => item.category === category.id)
                    .map((item) => (
                       <Card
                        key={item.id}
                        onClick={() => onAddItem(item)}
                        className="group flex flex-col overflow-hidden rounded-lg border-2 border-transparent transition-all hover:border-primary hover:shadow-lg cursor-pointer"
                      >
                        <div className="relative w-full h-32">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            data-ai-hint={item.imageHint}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardHeader className="flex-grow p-4 pb-1">
                          <CardTitle className="font-headline text-base">{item.name}</CardTitle>
                          <CardDescription className="text-xs text-muted-foreground pt-1 line-clamp-2">
                            {item.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-lg text-primary">
                              ${item.price.toFixed(2)}
                            </p>
                            <PlusCircle className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
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
