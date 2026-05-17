import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Norm Task Tracker',
  description: 'Красивый и удобный таск-трекер',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark');})()`
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
