
'use client';

import { useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { loginEmployee } from './actions';
import { Loader2, Languages, UtensilsCrossed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { getSettings } from '../admin/settings/actions';
import { ensureDefaultRestaurant } from '@/lib/data';

function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.dir(i18n.language);
  }, [i18n.language, i18n]);

  return (
    <div className="absolute top-4 right-4">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t('changeLanguage')}>
                                <Languages className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>English</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeLanguage('ar')} disabled={i18n.language === 'ar'}>العربية</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">{t('changeLanguage')}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
  );
}

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const { t, i18n } = useTranslation('common');

  useEffect(() => {
    const setLanguage = async () => {
        const restaurantId = await ensureDefaultRestaurant();
        const settings = await getSettings(restaurantId);
        if (settings && !localStorage.getItem('i18nextLng')) {
            i18n.changeLanguage(settings.defaultLanguage);
        } else {
            document.documentElement.dir = i18n.dir(i18n.language);
        }
    };
    setLanguage();
  }, [i18n]);

  useEffect(() => {
    document.documentElement.dir = i18n.dir(i18n.language);
  }, [i18n.language, i18n]);

  const handleLogin = (formData: FormData) => {
    startTransition(async () => {
      const result = await loginEmployee(formData);

      if (result.success && result.employee) {
        localStorage.setItem('currentEmployee', JSON.stringify(result.employee));
        toast({
          title: t('loginSuccessTitle'),
          description: t('welcomeBackDescription', {name: result.employee.name}),
        });

        if (result.employee.role === 'Chef') {
            router.push('/kitchen');
        } else {
            router.push('/');
        }
      } else {
        toast({
          variant: 'destructive',
          title: t('loginFailedTitle'),
          description: result.error || t('loginFailedDescription'),
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 relative">
      <LanguageSwitcher />
      <Card className="w-full max-w-sm mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <UtensilsCrossed className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-headline text-primary">{t('posTitle')}</CardTitle>
          </div>
          <CardDescription>{t('posDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('passwordLabel')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isPending}
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg mt-4" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {t('loginButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
