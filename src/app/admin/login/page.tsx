
'use client';

import { useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ItbIcon from '@/components/itb-icon';
import { loginAdmin } from './actions';
import { Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = i18n.dir(currentLanguage);
  }, [currentLanguage, i18n]);

  return (
     <div className="absolute top-4 right-4">
        <Select value={currentLanguage} onValueChange={changeLanguage}>
            <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
        </Select>
    </div>
  );
}

export default function AdminLoginPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const { t, i18n } = useTranslation('common');

  useEffect(() => {
    document.documentElement.dir = i18n.dir(i18n.language);
  }, [i18n, i18n.language]);

  const handleLogin = (formData: FormData) => {
    startTransition(async () => {
      const result = await loginAdmin(formData);
      
      if (result.success && result.admin) {
        localStorage.setItem('currentAdmin', JSON.stringify(result.admin));
        
        toast({
          title: t('loginSuccessTitle'),
          description: t('loginSuccessDescription', {name: result.admin.name}),
        });
        router.push('/admin');
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
            <ItbIcon className="h-10 w-10" />
            <CardTitle className="text-3xl font-headline text-primary">{t('backofficeTitle')}</CardTitle>
          </div>
          <CardDescription>{t('backofficeDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@default.com"
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
