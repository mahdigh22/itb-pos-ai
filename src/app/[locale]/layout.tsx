import '../globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';

export default async function RootLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <title>ITB Members</title>
        <meta name="description" content="A Point of Sale system for managing menus and members." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased bg-background h-screen flex flex-col")}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <main className="flex-grow min-h-0">
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
