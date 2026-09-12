export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (response.status === 204) return undefined as T;
  const data = await response
    .json()
    .catch(() => ({ message: 'The server returned an invalid response' }));
  if (!response.ok) throw new ApiError(data.message || 'Request failed', response.status);
  return data;
}

export async function logout(): Promise<void> {
  await api<void>('/auth/logout', { method: 'POST' });
}
