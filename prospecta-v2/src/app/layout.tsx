// @ts-nocheck
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/Toaster';

export const metadata: Metadata = {
  title: { default: 'NOF PROSPECT PROD', template: '%s | NOF PROSPECT PROD' },
  description: 'Plateforme B2B de prospection commerciale',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
