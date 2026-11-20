import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export type Verdict = 'pass' | 'warn' | 'fail';
export type Check = Record<string, unknown> & { verdict: Verdict; issues: string[] };
export const UA = 'geo-audit/0.1 (+https://skillpi.com)';

export function parseUrl(input: unknown): URL | null {
  if (typeof input !== 'string' || !/^https?:\/\//i.test(input)) return null;
  try {
    const u = new URL(input);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return null;
    return u;
  } catch { return null; }
}

function privateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const s = ip.toLowerCase();
    return s === '::' || s === '::1' || s.startsWith('fc') || s.startsWith('fd') || /^fe[89ab]/.test(s) || s.startsWith('::ffff:127.') || s.startsWith('::ffff:10.') || s.startsWith('::ffff:192.168.');
  }
  const p = ip.split('.').map(Number);
  return p[0] === 0 || p[0] === 10 || p[0] === 127 || p[0] >= 224 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168);
}

async function assertPublic(url: URL): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) throw new Error('blocked target host');
  const ip = isIP(host);
  if (ip && privateIp(host)) throw new Error('blocked target host');
  if (!ip) {
    const records = await lookup(host, { all: true, verbatim: true });
    if (!records.length || records.some(r => privateIp(r.address))) throw new Error('blocked target host');
  }
}

export async function request(urlString: string): Promise<{ status: number; headers: Headers; body: string; finalUrl: string }> {
  let current = new URL(urlString);
  for (let redirects = 0; redirects <= 3; redirects++) {
    await assertPublic(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    let res: Response;
    try { res = await fetch(current, { headers: { 'User-Agent': UA }, redirect: 'manual', signal: controller.signal });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) return { status: res.status, headers: res.headers, body: '', finalUrl: current.href };
      if (redirects === 3) throw new Error('too many redirects');
      current = new URL(location, current);
      if (!['http:', 'https:'].includes(current.protocol)) throw new Error('invalid redirect protocol');
      continue;
    }
    const body = await res.text();
    return { status: res.status, headers: res.headers, body, finalUrl: current.href };
    } finally { clearTimeout(timer); }
  }
  throw new Error('too many redirects');
}

export function errorCheck(url: string, error: unknown): Check {
  const message = error instanceof Error ? error.message : 'request failed';
  return { url, error: message, issues: [message], verdict: 'warn' };
}

export function validInput(raw: unknown): { url: string; parsed: URL } | { error: 'invalid url' } {
  const input = (raw as { url?: unknown } | null)?.url;
  const parsed = parseUrl(input);
  return parsed ? { url: parsed.href, parsed } : { error: 'invalid url' };
}
