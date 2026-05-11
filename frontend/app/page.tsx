import { redirect } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';

export default async function RootPage() {
  const user = await serverFetch('/auth/me');
  if (user) redirect('/projects');
  redirect('/login');
}
