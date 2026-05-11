import { serverFetch } from '@/lib/server-api';
import { TrackersClient } from '@/components/tasks/TrackersClient';
import { redirect } from 'next/navigation';

export default async function TrackersPage() {
  const user = await serverFetch('/auth/me');
  if (!user) redirect('/login');

  const spaceId = user.spaceUsers?.[0]?.spaceId;
  const projects = spaceId ? await serverFetch(`/spaces/${spaceId}/projects`) : [];

  return <TrackersClient spaceId={spaceId} initialProjects={projects ?? []} user={user} />;
}
