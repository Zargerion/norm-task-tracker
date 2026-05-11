import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Norm Task Tracker',
  description: 'Красивый и удобный таск-трекер',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
