import { serverFetch } from '@/lib/server-api';
import { UsersClient } from '@/components/users/UsersClient';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const user = await serverFetch('/auth/me');
  if (!user) redirect('/login');
  const spaceId = user.spaceUsers?.[0]?.spaceId;
  const members = spaceId ? await serverFetch(`/spaces/${spaceId}/users`) : [];
  const role = user.isSuperAdmin ? 'SUPER_ADMIN' : user.spaceUsers?.[0]?.role ?? 'EMPLOYEE';

  return <UsersClient spaceId={spaceId} initialMembers={members ?? []} currentUser={user} role={role} />;
}
