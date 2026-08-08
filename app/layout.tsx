import './globals.css';
import type { Metadata } from 'next';
import { MigrateEffect } from './migrate-effect';

export const metadata: Metadata = {
  title: 'ExamKiller — AZ-104',
  description: 'Practice exam for Microsoft Azure Administrator certification',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MigrateEffect />
        {children}
      </body>
    </html>
  );
}
