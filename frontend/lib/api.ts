const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: isFormData
      ? undefined
      : { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T = any>(path: string) => apiFetch<T>(path),
  post: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = any>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
  upload: <T = any>(path: string, form: FormData) =>
    apiFetch<T>(path, { method: 'POST', body: form }),
};
