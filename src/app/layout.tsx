
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ContentProvider, ContentContext } from '@/context/content-context';
import { useContext } from 'react';
import { AppShell } from '@/components/app-shell';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ContentProvider>
      <LayoutContent>{children}</LayoutContent>
    </ContentProvider>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { theme } = useContext(ContentContext);

  return (
    <html lang="en" suppressHydrationWarning className={theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
