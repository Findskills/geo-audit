import { checkRobots } from './checkRobots.js';
import { checkSitemap } from './checkSitemap.js';
import { checkSchema } from './checkSchema.js';
import { checkMeta } from './checkMeta.js';
import { checkAiFiles } from './checkAiFiles.js';
import { fixes, grade, scoreChecks } from '../scoring.js';
import { consumeFreeAudit, previousPaid, appendPaid } from '../usage.js';
import { parseUrl, type Check } from '../shared.js';
const disclaimer='本审计为诊断性检查，不保证排名、不保证被 ChatGPT 提及。';
export async function runAudit(raw:unknown,tier:'free'|'paid'){
 const u=(raw as any)?.url,parsed=parseUrl(u);if(!parsed)return {error:'invalid url'};const url=parsed.href;
 if(tier==='free'&&!await consumeFreeAudit())return {error:'free daily limit reached: 3 full audits per day'};
 const partial=tier==='free';const checks:Record<string,Check>={};
 checks.check_robots=await checkRobots({url});checks.check_sitemap=await checkSitemap({url});checks.check_meta=await checkMeta({url});
 if(!partial){checks.check_schema=await checkSchema({url});checks.check_ai_files=await checkAiFiles({url});}
 const score=scoreChecks(checks,partial),audited_at=new Date().toISOString();
 const multiLanguage=Boolean((checks.check_meta as any).hreflang?.length);
 const todo=fixes(checks,multiLanguage);const previous=partial?null:await previousPaid(url);
 const lines=[`# GEO 可见度审计报告 — ${parsed.hostname}`,``, `审计时间：${audited_at}`,`审计 URL：${url}`,`总分：${score}/100（${grade(score)}）${partial?'，部分审计':''}`,``,`## 检查结果`,``,`| 工具名 | 结论 verdict | 关键发现 |`,`|---|---|---|`];
 for(const [name,c]of Object.entries(checks))lines.push(`| ${name} | ${c.verdict} | ${String(c.issues?.[0]??'未发现问题').replaceAll('|','\\|')} |`);
 lines.push('', '## 整改清单');for(const p of ['P0','P1','P2']){lines.push('',`### ${p}`);const selected=todo.filter(f=>f.priority===p);if(!selected.length)lines.push('- 无');for(const f of selected)lines.push(`- **${f.title}**（${f.tool}）：${f.detail}`);}
 lines.push('',disclaimer);const result:any={url,audited_at,score,grade:grade(score),partial,locked_checks:partial?['check_schema','check_ai_files']:[],checks,fixes:todo,report_markdown:lines.join('\n'),disclaimer};
 if(previous){result.previous_score=previous.score;result.previous_at=previous.audited_at;}
 if(!partial){result.history_available=await appendPaid({url,audited_at,score,grade:grade(score)});}
 return result;
}
