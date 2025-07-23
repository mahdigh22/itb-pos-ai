import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import TranslationsProvider from "@/components/i18n-provider";
import { useOnlineSync } from "@/hooks/use-online-sync";
import { SyncPrompt } from "@/components/syncPrompt";
import { useEffect } from "react";
import { ClientServiceWorker } from "@/hooks/use-client-service-worker";

export const metadata = {
  title: "Members",
  description: "A Point of Sale system for managing menus and members.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Offline POS" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Offline POS" />
        <meta name="theme-color" content="#000000" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <link rel="icon" href="/icon-192x192.svg" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body
        className={cn(
          "font-body antialiased bg-background h-screen flex flex-col"
        )}
      >
        <ClientServiceWorker />
        <SyncPrompt />
        <TranslationsProvider>
          <ThemeProvider>
            <main className="flex-grow min-h-0">{children}</main>
            <Toaster />
          </ThemeProvider>
        </TranslationsProvider>
      </body>
    </html>
  );
}
