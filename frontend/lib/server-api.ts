import { cookies } from 'next/headers';

const SERVER_BASE = process.env.API_BASE_URL ?? 'http://localhost:4000/api';

export async function serverFetch<T = any>(path: string, init?: RequestInit): Promise<T | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('ntt_token')?.value;

  const res = await fetch(`${SERVER_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `ntt_token=${token}` } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return res.json();
}
