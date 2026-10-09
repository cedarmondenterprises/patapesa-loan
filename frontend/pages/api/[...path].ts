import type { NextApiRequest, NextApiResponse } from 'next';

const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    for (const item of Array.isArray(value) ? value : [value])
      if (item !== undefined) query.append(key, item);
  }
  const target = `${backendUrl}/api/${segments
    .map((segment) => encodeURIComponent(segment || ''))
    .join('/')}${query.size ? `?${query}` : ''}`;
  const headers: Record<string, string> = { accept: req.headers.accept || 'application/json' };
  if (req.headers.cookie) headers.cookie = req.headers.cookie;
  if (req.headers['user-agent']) headers['user-agent'] = req.headers['user-agent'];
  if (req.headers['x-request-id']) headers['x-request-id'] = String(req.headers['x-request-id']);
  headers['x-forwarded-for'] = [req.headers['x-forwarded-for'], req.socket.remoteAddress]
    .filter(Boolean)
    .join(', ');
  if (req.headers['x-forwarded-proto'])
    headers['x-forwarded-proto'] = String(req.headers['x-forwarded-proto']);
  headers.origin = String(
    req.headers.origin || process.env.PUBLIC_APP_URL || 'http://localhost:3000',
  );
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) headers['content-type'] = 'application/json';

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      // Next represents an empty non-JSON request as ''. Do not serialize it
      // as a JSON string: Express rejects scalar JSON before reaching logout.
      body: ['GET', 'HEAD'].includes(req.method || 'GET') || req.body === '' || req.body == null
        ? undefined
        : JSON.stringify(req.body),
      signal: AbortSignal.timeout(15_000),
    });
    const cookie = upstream.headers.get('set-cookie');
    if (cookie) res.setHeader('set-cookie', cookie);
    for (const name of [
      'content-type',
      'cache-control',
      'ratelimit-limit',
      'ratelimit-remaining',
      'ratelimit-reset',
      'retry-after',
      'x-request-id',
    ]) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).json({ success: false, message: 'The service is temporarily unavailable' });
  }
}
