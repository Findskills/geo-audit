import { errorCheck, request, validInput, type Check } from '../shared.js';

type BotResult = { status: 'allowed' | 'blocked' | 'unknown'; rule: string | null };
function groups(text: string): Map<string, string[]> {
  const out = new Map<string, string[]>(); let agents: string[] = [], hasDirective=false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s*#.*$/, '').trim(); if (!line) continue;
    const colon = line.indexOf(':'); if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase(), val = line.slice(colon + 1).trim();
    if (key === 'user-agent') { if(hasDirective){agents=[];hasDirective=false;}const agent=val.toLowerCase();agents.push(agent);if(!out.has(agent))out.set(agent,[]); }
    else if (agents.length) {hasDirective=true;for (const a of agents) out.get(a)?.push(`${key}: ${val}`);}
  }
  return out;
}
function resolve(groupsMap: Map<string, string[]>, bot: string): BotResult {
  const rules = groupsMap.get(bot.toLowerCase()) ?? groupsMap.get('*') ?? [];
  const disallow = rules.find(x => /^disallow:\s*\/$/i.test(x));
  const allowRoot = rules.find(x => /^allow:\s*\/$/i.test(x));
  if (disallow && !allowRoot) return { status: 'blocked', rule: disallow };
  const other = rules.find(x => /^disallow:/i.test(x));
  return { status: 'allowed', rule: allowRoot ?? (other ?? null) };
}
export async function checkRobots(raw: unknown): Promise<Check> {
  const v = validInput(raw); if ('error' in v) return { error: v.error, issues: [], verdict: 'warn' };
  const { url, parsed } = v, robotsUrl = `${parsed.origin}/robots.txt`, issues: string[] = [];
  try {
    const res = await request(robotsUrl); const bots = ['OAI-SearchBot', 'GPTBot', 'ClaudeBot'];
    if (res.status === 404 || res.body.trim() === '') {
      issues.push('robots.txt 缺失，视为全部允许');
      const allowed = { status: 'allowed', rule: null } as BotResult;
      return { url, robots_txt_url: robotsUrl, robots_txt_found: false, robots_txt_status: res.status, oai_searchbot: allowed, gptbot: allowed, claudebot: allowed, wildcard_status: allowed, issues, verdict: 'pass' };
    }
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const g = groups(res.body), results = bots.map(b => resolve(g, b)), wildcard = resolve(new Map(g.has('*') ? [['*', g.get('*')!]] : []), '*');
    const verdict = results.every(x => x.status === 'allowed') ? 'pass' : results[0].status === 'blocked' ? 'fail' : 'warn';
    if (verdict !== 'pass') issues.push('至少一个 AI 爬虫受到限制或无法确认');
    return { url, robots_txt_url: robotsUrl, robots_txt_found: true, robots_txt_status: res.status, oai_searchbot: results[0], gptbot: results[1], claudebot: results[2], wildcard_status: wildcard, issues, verdict };
  } catch (e) { return { ...errorCheck(url, e), robots_txt_url: robotsUrl, robots_txt_found: false, robots_txt_status: null, oai_searchbot: { status: 'unknown', rule: null }, gptbot: { status: 'unknown', rule: null }, claudebot: { status: 'unknown', rule: null }, wildcard_status: { status: 'unknown', rule: null } }; }
}
