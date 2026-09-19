import type { NextApiRequest, NextApiResponse } from 'next';
const backend = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    for (const item of Array.isArray(value) ? value : [value])
      if (item !== undefined) query.append(key, item);
  }
  const target = `${backend}/api/${parts.map((x) => encodeURIComponent(x || '')).join('/')}${
    query.size ? `?${query}` : ''
  }`;
  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        cookie: req.headers.cookie || '',
        'user-agent': req.headers['user-agent'] || '',
        origin: String(req.headers.origin || process.env.ADMIN_APP_URL || 'http://localhost:3001'),
        'x-forwarded-for': [req.headers['x-forwarded-for'], req.socket.remoteAddress]
          .filter(Boolean)
          .join(', '),
        'x-forwarded-proto': String(req.headers['x-forwarded-proto'] || ''),
      },
      body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : JSON.stringify(req.body),
      signal: AbortSignal.timeout(15000),
    });
    for (const name of [
      'retry-after',
      'ratelimit-limit',
      'ratelimit-remaining',
      'ratelimit-reset',
      'x-request-id',
    ]) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    const cookie = upstream.headers.get('set-cookie');
    if (cookie) res.setHeader('set-cookie', cookie);
    const contentType = upstream.headers.get('content-type');
    const contentDisposition = upstream.headers.get('content-disposition');
    if (contentType) res.setHeader('content-type', contentType);
    if (contentDisposition) res.setHeader('content-disposition', contentDisposition);
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).json({ success: false, message: 'Service unavailable' });
  }
}
