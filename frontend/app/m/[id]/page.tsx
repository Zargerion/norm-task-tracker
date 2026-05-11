import { serverFetch } from '@/lib/server-api';
import { MaterialViewer } from '@/components/materials/MaterialViewer';
import { notFound } from 'next/navigation';

export default async function PublicMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const material = await serverFetch(`/materials/${id}`).catch(() => null);
  if (!material) notFound();
  return <MaterialViewer material={material} />;
}
