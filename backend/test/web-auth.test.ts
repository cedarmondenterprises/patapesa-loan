import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import express from 'express';
import request from 'supertest';

// Exercise the actual Next handlers and browser clients without starting Next.
function load(file: string, fetch: jest.Mock) {
  const source = readFileSync(path.resolve(__dirname, '../../', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } }).outputText;
  const exports: Record<string, any> = {};
  vm.runInNewContext(code, {
    exports, process: { env: {} }, fetch, URLSearchParams, AbortSignal, AbortController, Buffer,
    window: { setTimeout, clearTimeout }, navigator: { onLine: true },
  });
  return exports;
}

describe.each(['frontend', 'admin'])('%s authentication transport', (area) => {
  it('forwards an empty logout POST through the backend JSON parser', async () => {
    const backend = express();
    backend.use(express.json());
    backend.post('/api/auth/logout', (_req, res) => {
      res.clearCookie('patapesa_session');
      res.status(204).end();
    });
    const fetch = jest.fn(async (_url, options) => {
      const call = request(backend).post('/api/auth/logout').set(options.headers);
      const response = await (options.body === undefined ? call : call.send(options.body));
      return new Response(response.status === 204 ? null : response.text, {
        status: response.status,
        headers: { 'set-cookie': response.headers['set-cookie']?.[0] || '' },
      });
    });
    const handler = load(`${area}/pages/api/[...path].ts`, fetch).default;
    const res: any = { setHeader: jest.fn(), status: jest.fn(), send: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    await handler({ query: { path: ['auth', 'logout'] }, method: 'POST', body: '',
      headers: {}, socket: { remoteAddress: '127.0.0.1' },
    }, res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.setHeader).toHaveBeenCalledWith('set-cookie', expect.stringContaining('Expires=Thu, 01 Jan 1970'));
  });
  it('appends the real peer and preserves rate-limit response headers', async () => {
    const fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Wait' }), {
      status: 429, headers: { 'retry-after': '120', 'content-type': 'application/json' },
    }));
    const handler = load(`${area}/pages/api/[...path].ts`, fetch).default;
    const res: any = { setHeader: jest.fn(), status: jest.fn(), send: jest.fn() };
    res.status.mockReturnValue(res);
    await handler({ query: { path: ['auth', 'login'] }, method: 'POST', body: {},
      headers: { 'x-forwarded-for': '1.1.1.1', 'cf-connecting-ip': '2.2.2.2' },
      socket: { remoteAddress: '203.0.113.30' },
    }, res);
    expect(fetch.mock.calls[0][1].headers['x-forwarded-for']).toBe('1.1.1.1, 203.0.113.30');
    expect(fetch.mock.calls[0][1].headers['cf-connecting-ip']).toBeUndefined();
    expect(res.setHeader).toHaveBeenCalledWith('retry-after', '120');
    expect(res.status).toHaveBeenCalledWith(429);
  });
  it('exposes Retry-After and never automatically retries a login POST', async () => {
    const fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Wait' }), {
      status: 429, headers: { 'retry-after': '120', 'content-type': 'application/json' },
    }));
    const api = load(`${area}/lib/api.ts`, fetch).api;
    await expect(api('/auth/login', { method: 'POST' })).rejects.toMatchObject({
      status: 429, retryAfterSeconds: 120, message: 'Too many attempts. Try again in 120 seconds.',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
