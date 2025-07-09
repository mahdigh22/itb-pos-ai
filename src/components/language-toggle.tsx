'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, Loader2 } from 'lucide-react';

export default function LanguageToggle() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleLocaleChange = (newLocale: 'en' | 'ar') => {
    startTransition(() => {
        // The pathname from usePathname in next/navigation will include the locale,
        // so we need to strip it out before calling router.replace.
        const newPath = pathname.startsWith(`/${locale}`) 
            ? pathname.substring(locale.length + 1) || '/' 
            : pathname;
      router.replace(newPath, { locale: newLocale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Languages className="h-5 w-5" />}
            <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLocaleChange('en')}
          disabled={locale === 'en' || isPending}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLocaleChange('ar')}
          disabled={locale === 'ar' || isPending}
        >
          العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
