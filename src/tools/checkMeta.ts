import { parse } from 'node-html-parser';
import { errorCheck, request, validInput, type Check } from '../shared.js';
export async function checkMeta(raw: unknown): Promise<Check> {
  const v = validInput(raw); if ('error' in v) return { error: v.error, issues: [], verdict: 'warn' };
  const { url } = v;
  try {
    const r = await request(url); if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    if (!(r.headers.get('content-type') ?? '').toLowerCase().includes('text/html')) return { url, error: 'content type is not text/html', title: null, title_length: 0, description: null, description_length: 0, og: { title: null, description: null, image: null, url: null }, canonical: null, canonical_is_self: false, hreflang: [], issues: ['响应不是 HTML'], verdict: 'warn' };
    const root = parse(r.body), title = root.querySelector('title')?.text.trim() || null;
    const meta = (name: string) => root.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim() || null;
    const og = (key: string) => root.querySelector(`meta[property="og:${key}"]`)?.getAttribute('content')?.trim() || null;
    const description = meta('description'), canonical = root.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || null;
    const hreflang = root.querySelectorAll('link[rel="alternate"][hreflang]').map(n => ({ lang: n.getAttribute('hreflang') ?? '', href: n.getAttribute('href') ?? '' }));
    const self = (s: string) => { try { return new URL(s, url).href.replace(/\/$/, '') === url.replace(/\/$/, ''); } catch { return false; } };
    const issues: string[] = [];
    if (!title) issues.push('缺少 title'); else if (title.length > 60) issues.push('title 超过 60 字符');
    if (!description) issues.push('缺少 meta description'); else if (description.length < 50 || description.length > 160) issues.push('description 长度不在 50–160 字符范围');
    if (!og('title') || !og('description') || !og('image')) issues.push('OG 标签不完整');
    if (!canonical) issues.push('缺少 canonical');
    const verdict = !title || !description ? 'fail' : title.length >= 1 && title.length <= 60 && description.length >= 50 && description.length <= 160 && og('title') && og('description') && og('image') && canonical ? 'pass' : 'warn';
    return { url, title, title_length: title?.length ?? 0, description, description_length: description?.length ?? 0, og: { title: og('title'), description: og('description'), image: og('image'), url: og('url') }, canonical, canonical_is_self: canonical ? self(canonical) : false, hreflang, issues, verdict } as Check;
  } catch (e) { return { ...errorCheck(url, e), title: null, title_length: 0, description: null, description_length: 0, og: { title: null, description: null, image: null, url: null }, canonical: null, canonical_is_self: false, hreflang: [] }; }
}
