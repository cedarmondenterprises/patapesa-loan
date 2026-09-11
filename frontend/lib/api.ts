export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export function token(): string | null { if (typeof window === 'undefined') return null; return localStorage.getItem('authToken') || sessionStorage.getItem('authToken'); }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = token();
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...options.headers } });
  const data = await response.json().catch(() => ({ message: 'The server returned an invalid response' }));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}
export function saveSession(value: string, remember = true): void { (remember ? localStorage : sessionStorage).setItem('authToken', value); }
export function logout(): void { localStorage.removeItem('authToken'); sessionStorage.removeItem('authToken'); }
