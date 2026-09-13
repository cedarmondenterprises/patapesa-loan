export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

const retryableStatuses = new Set([502, 503, 504]);

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const attempts = method === 'GET' || method === 'HEAD' ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    try {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: 'same-origin',
        signal: controller.signal,
        headers: {
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...options.headers,
        },
      });
      if (retryableStatuses.has(response.status) && attempt + 1 < attempts) continue;
      if (response.status === 204) return undefined as T;
      const data = await response
        .json()
        .catch(() => ({ message: 'The server returned an invalid response' }));
      if (!response.ok) throw new ApiError(data.message || 'Request failed', response.status);
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (attempt + 1 < attempts) continue;
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      throw new ApiError(
        offline
          ? 'You are offline. Your form is saved on this device.'
          : 'The connection timed out. Please try again.',
        0,
      );
    } finally {
      window.clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abort);
    }
  }
  throw new ApiError('Request failed', 0);
}

export async function logout(): Promise<void> {
  await api<void>('/auth/logout', { method: 'POST' });
}
