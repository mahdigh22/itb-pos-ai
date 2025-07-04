'use client';

import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import Link from 'next/link';
import { Cpu } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>POSitive</title>
        <meta name="description" content="A Point of Sale system for managing menus and members." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased bg-background h-screen flex flex-col")}>
        {!isLoginPage && (
          <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4">
              <div className="flex items-center h-16">
                <Link href="/" className="flex items-center gap-2 text-lg font-headline font-semibold text-primary">
                  <Cpu className="h-6 w-6" />
                  <span>POSitive</span>
                </Link>
              </div>
            </div>
          </header>
        )}
        <main className={cn(
          "flex-grow min-h-0",
          isLoginPage ? "p-0" : "container mx-auto p-4 md:p-8"
        )}>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}