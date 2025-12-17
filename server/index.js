/**
 * LearnMappers Console — Standalone Server
 *
 * Goal: LearnMappers runs without Quick Server.
 * - Serves console assets from this folder
 * - Serves Sunday Framework assets from the external Sunday repo
 * - Proxies /api/auth/* to the shared Sunday auth host
 * - Enforces auth for other /api/* endpoints
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

const PORT = parseInt(process.env.PORT || '8901', 10);
const HOST = process.env.HOST || '0.0.0.0';

const SUNDAY_ROOT = process.env.SUNDAY_ROOT || '/home/abrownsanta/sundayapp';
const SUNDAY_AUTH_BASE = process.env.SUNDAY_AUTH_BASE || 'https://auth.thebriefcase.app';

// Resolve to this console folder (sites/learnmappers/console)
const CONSOLE_ROOT = new URL('../', import.meta.url).pathname.replace(/\/$/, '');

app.use('*', cors());
app.use('*', logger());

// Serve /sundayapp/* from the external framework repo
app.use('*', async (c, next) => {
  const p = c.req.path;
  if (!p.startsWith('/sundayapp')) return next();

  try {
    let rel = p.replace(/^\/sundayapp/, '');
    if (!rel || rel === '/') rel = '/index.js';

    const filePath = `${SUNDAY_ROOT}${rel}`;
    return await Bun.file(filePath).exists()
      ? c.body(await Bun.file(filePath).arrayBuffer(), {
          headers: {
            'Content-Type': Bun.file(filePath).type || 'application/octet-stream',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      : c.json({ error: 'Not found', path: rel }, 404);
  } catch (e) {
    return c.json({ error: 'Server error', message: e?.message || String(e) }, 500);
  }
});

// Serve shared Sunday paths required for auth pages
app.use('*', async (c, next) => {
  const p = c.req.path;
  if (!(p.startsWith('/core/') || p.startsWith('/cartridges/auth/'))) return next();

  try {
    const filePath = `${SUNDAY_ROOT}${p}`;
    return await Bun.file(filePath).exists()
      ? c.body(await Bun.file(filePath).arrayBuffer(), {
          headers: {
            'Content-Type': Bun.file(filePath).type || 'application/octet-stream',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      : c.json({ error: 'Not found', path: p }, 404);
  } catch (e) {
    return c.json({ error: 'Server error', message: e?.message || String(e) }, 500);
  }
});

// Static console assets
app.use('/css/*', serveStatic({ root: CONSOLE_ROOT }));
app.use('/js/*', serveStatic({ root: CONSOLE_ROOT }));
app.use('/html/*', serveStatic({ root: CONSOLE_ROOT }));
app.use('/components/*', serveStatic({ root: CONSOLE_ROOT }));
app.use('/cartridges/*', serveStatic({ root: CONSOLE_ROOT }));
app.use('/app.config.js', serveStatic({ root: CONSOLE_ROOT }));

// Root
app.get('/', (c) => c.redirect('/index.html'));
app.get('/index.html', serveStatic({ root: CONSOLE_ROOT }));

// Auth proxy (same-origin for this console)
async function proxyAuth(c, upstreamPath) {
  const url = `${SUNDAY_AUTH_BASE}${upstreamPath}`;

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  const authHeader = c.req.header('Authorization');
  if (authHeader) headers.set('Authorization', authHeader);

  const method = c.req.method;
  const body = method === 'GET' ? undefined : await c.req.text();

  const res = await fetch(url, {
    method,
    headers,
    body,
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return c.json(data, res.status);
}

app.all('/api/auth/*', async (c) => {
  const rest = c.req.path.replace(/^\/api\/auth/, '');
  // auth host speaks the gateway surface: /api/auth/...
  return proxyAuth(c, `/api/auth${rest}`);
});

app.get('/api/health', (c) => c.json({ ok: true, console: 'learnmappers', version: '0.1.0' }));

// Enforce auth for other /api/* endpoints
app.use('/api/*', async (c, next) => {
  const p = c.req.path;
  if (p.startsWith('/api/auth') || p === '/api/health') return next();

  const authHeader = c.req.header('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return c.json({ error: 'Authorization required' }, 401);

  // Validate token via shared auth host
  const res = await fetch(`${SUNDAY_AUTH_BASE}/api/auth/me`, {
    headers: { Authorization: authHeader },
  });
  if (!res.ok) return c.json({ error: 'Invalid or expired token' }, 401);

  return next();
});

console.log(`[LearnMappers] starting on http://${HOST}:${PORT}`);
serve({ fetch: app.fetch, port: PORT, hostname: HOST });
