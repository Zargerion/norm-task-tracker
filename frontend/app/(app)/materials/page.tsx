import { serverFetch } from '@/lib/server-api';
import { MaterialsClient } from '@/components/materials/MaterialsClient';
import { redirect } from 'next/navigation';

export default async function MaterialsPage() {
  const user = await serverFetch('/auth/me');
  if (!user) redirect('/login');
  return <MaterialsClient user={user} />;
}
