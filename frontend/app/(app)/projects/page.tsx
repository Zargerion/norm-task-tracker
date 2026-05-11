import { serverFetch } from '@/lib/server-api';
import { ProjectsClient } from '@/components/projects/ProjectsClient';
import { redirect } from 'next/navigation';

export default async function ProjectsPage() {
  const user = await serverFetch('/auth/me');
  if (!user) redirect('/login');

  return <ProjectsClient user={user} />;
}
