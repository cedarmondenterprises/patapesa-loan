export class ApiError extends Error {
  constructor(message: string, public status: number, public readonly retryAfterSeconds = 0) {
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
    try {
      const response = await fetch(`/api${path}`, {
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
      const data = await response.json().catch(() => ({ message: 'Invalid server response' }));
      if (!response.ok) {
        const value = response.headers.get('retry-after');
        const seconds =
          value && /^\d+$/.test(value)
            ? Number(value)
            : value
            ? Math.ceil((Date.parse(value) - Date.now()) / 1000)
            : 0;
        const retryAfter = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
        throw new ApiError(
          response.status === 429
            ? `Too many attempts. Try again in ${retryAfter || 60} seconds.`
            : data.message || 'Request failed',
          response.status,
          response.status === 429 ? retryAfter || 60 : 0,
        );
      }
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (attempt + 1 < attempts) continue;
      throw new ApiError(
        typeof navigator !== 'undefined' && !navigator.onLine
          ? 'You are offline. Live queues will resume when the connection returns.'
          : 'The connection timed out. Please try again.',
        0,
      );
    } finally {
      window.clearTimeout(timeout);
    }
  }
  throw new ApiError('Request failed', 0);
}
