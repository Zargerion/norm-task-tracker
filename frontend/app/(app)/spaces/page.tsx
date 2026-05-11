import { serverFetch } from '@/lib/server-api';
import { SpacesClient } from '@/components/spaces/SpacesClient';
import { redirect } from 'next/navigation';

export default async function SpacesPage() {
  const user = await serverFetch('/auth/me');
  if (!user) redirect('/login');
  const spaces = await serverFetch('/spaces');
  const allUsers = user.isSuperAdmin ? await serverFetch('/users/all') : [];

  return <SpacesClient initialSpaces={spaces ?? []} allUsers={allUsers ?? []} isSuperAdmin={user.isSuperAdmin} />;
}
