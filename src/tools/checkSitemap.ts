import { XMLParser } from 'fast-xml-parser';
import { errorCheck, request, validInput, type Check } from '../shared.js';
const parser=new XMLParser({ignoreAttributes:true,trimValues:true,parseTagValue:false,removeNSPrefix:true});
function values(x:unknown):unknown[]{return x===undefined?[]:Array.isArray(x)?x:[x];}
function loc(v:unknown):string|null{if(typeof v==='string')return v;if(v&&typeof v==='object'&&typeof (v as any).loc==='string')return (v as any).loc;return null;}
function isIndex(doc:any):boolean{return !!doc?.sitemapindex;}
export async function checkSitemap(raw:unknown):Promise<Check>{
 const v=validInput(raw);if('error'in v)return {error:v.error,issues:[],verdict:'warn'};const {url,parsed}=v;const issues:string[]=[];let sitemapUrl:string|null=null,sitemapStatus:number|null=null,isIndexResult=false,childCount=0,total=0,withLastmod=0;const samples:string[]=[];let failed=false;
 try{
  const candidates=[`${parsed.origin}/sitemap.xml`];let first=await request(candidates[0]);sitemapStatus=first.status;
  if(first.status!==200&&first.status!==404)return {url,error:`HTTP ${first.status}`,sitemap_url:null,sitemap_found:false,sitemap_status:first.status,is_index:false,child_sitemaps:0,total_urls:0,urls_with_lastmod:0,lastmod_coverage:0,sample_checked:0,noindex_pages:[],issues:[`sitemap.xml 返回 HTTP ${first.status}`],verdict:'warn'};
  if(first.status===404){try{const robots=await request(`${parsed.origin}/robots.txt`);if(robots.status===200)for(const line of robots.body.split(/\r?\n/)){const m=line.match(/^\s*sitemap\s*:\s*(\S+)/i);if(m)candidates.push(m[1]);}else if(robots.status!==404){failed=true;issues.push(`robots.txt 返回 HTTP ${robots.status}`);}}catch(e){failed=true;issues.push(`robots.txt 读取失败：${e instanceof Error?e.message:'request failed'}`);}candidates.push(`${parsed.origin}/sitemap_index.xml`);}
  let rootBody:string|null=null;
  for(let i=0;i<candidates.length;i++){const candidate=candidates[i];if(i===0){if(first.status===200){sitemapUrl=candidate;rootBody=first.body;break;}continue;}const r=await request(candidate);if(r.status===200){sitemapUrl=candidate;sitemapStatus=r.status;rootBody=r.body;break;}if(r.status!==404){failed=true;issues.push(`候选 sitemap 返回 HTTP ${r.status}`);}}
  if(!sitemapUrl||rootBody===null){if(!failed)issues.push('未发现 sitemap');return {url,...(failed?{error:'sitemap discovery request failed'}:{}),sitemap_url:null,sitemap_found:false,sitemap_status:sitemapStatus,is_index:false,child_sitemaps:0,total_urls:0,urls_with_lastmod:0,lastmod_coverage:0,sample_checked:0,noindex_pages:[],issues,verdict:failed?'warn':'fail'};}
  const seen=new Set<string>();
  const visit=async(body:string,base:string,depth:number):Promise<void>=>{
   let doc:any;try{doc=parser.parse(body);}catch{issues.push(`XML 解析失败：${base}`);failed=true;return;}
   if(isIndex(doc)){
    if(depth>=5){issues.push('子 sitemap 递归达到 5 个上限');return;}
    for(const child of values(doc.sitemapindex.sitemap)){const childUrl=loc(child);if(!childUrl||seen.has(childUrl))continue;if(childCount>=5){issues.push('子 sitemap 数量达到 5 个上限');return;}seen.add(childUrl);childCount++;try{const r=await request(childUrl);if(r.status!==200){issues.push(`子 sitemap HTTP ${r.status}：${childUrl}`);failed=true;continue;}await visit(r.body,childUrl,depth+1);}catch(e){issues.push(`子 sitemap 抓取失败：${childUrl} (${e instanceof Error?e.message:'request failed'})`);failed=true;}}
    return;
   }
   const entries=values(doc?.urlset?.url);for(const entry of entries){const u=loc(entry);if(!u)continue;if(total<5000){total++;if((entry as any).lastmod)withLastmod++;if(samples.length<10)samples.push(u);}}
  };
  const rootDoc=parser.parse(rootBody);isIndexResult=isIndex(rootDoc);await visit(rootBody,sitemapUrl,0);
  const noindex:string[]=[];let sampleChecked=0;
  for(const sample of samples){sampleChecked++;try{const r=await request(sample);if(r.status!==200){failed=true;issues.push(`抽样页面 HTTP ${r.status}：${sample}`);continue;}const header=r.headers.get('x-robots-tag')??'';const htmlNoindex=/<meta\b[^>]*name\s*=\s*["']?robots["']?[^>]*content\s*=\s*["'][^"']*\bnoindex\b/i.test(r.body);if(/\bnoindex\b/i.test(header)||htmlNoindex)noindex.push(sample);}catch(e){failed=true;issues.push(`抽样页面抓取失败：${sample} (${e instanceof Error?e.message:'request failed'})`);}}
  if(noindex.length)issues.push(`抽样发现 ${noindex.length} 个 noindex 页面`);if(total===0)issues.push('sitemap 中未解析到任何 URL');const coverage=total?Math.round(withLastmod/total*10000)/100:0;
  const verdict=!failed&&total>0&&noindex.length===0?'pass':'warn';return {url,sitemap_url:sitemapUrl,sitemap_found:true,sitemap_status:sitemapStatus,is_index:isIndexResult,child_sitemaps:childCount,total_urls:total,urls_with_lastmod:withLastmod,lastmod_coverage:coverage,sample_checked:sampleChecked,noindex_pages:noindex.slice(0,10),issues,verdict};
 }catch(e){return {...errorCheck(url,e),sitemap_url:sitemapUrl,sitemap_found:false,sitemap_status:sitemapStatus,is_index:isIndexResult,child_sitemaps:childCount,total_urls:total,urls_with_lastmod:withLastmod,lastmod_coverage:0,sample_checked:0,noindex_pages:[]};}
}
