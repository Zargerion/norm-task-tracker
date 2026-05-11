import { redirect } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';
import { AppShell } from '@/components/layout/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await serverFetch('/auth/me');
  if (!user) redirect('/login');

  return <AppShell user={user}>{children}</AppShell>;
}
