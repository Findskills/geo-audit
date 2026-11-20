import type { Check } from './shared.js';
export type Fix={priority:'P0'|'P1'|'P2';title:string;detail:string;tool:string};
const n=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)?x:0;
export function scoreChecks(checks:Record<string,Check>,partial:boolean):number{
 let s=0;const r=checks.check_robots as any,sm=checks.check_sitemap as any,sc=checks.check_schema as any,m=checks.check_meta as any,a=checks.check_ai_files as any;
 if(r){s+=({allowed:15,unknown:7,blocked:0} as any)[r.oai_searchbot?.status]??0;s+=({allowed:5,unknown:2,blocked:0} as any)[r.gptbot?.status]??0;s+=({allowed:5,unknown:2,blocked:0} as any)[r.claudebot?.status]??0;}
 if(sm){s+=(sm.sitemap_found?8:0)+(n(sm.total_urls)>0?4:0)+(n(sm.lastmod_coverage)>=80?4:0)+(n(sm.sample_checked)>0&&Array.isArray(sm.noindex_pages)&&sm.noindex_pages.length===0?4:0);}
 if(sc){const o=sc.organization??{};s+=(o.present?8:0)+(o.name?3:0)+(o.logo?3:0)+(Array.isArray(o.sameAs)&&o.sameAs.length?3:0)+(o.description?3:0);}
 if(m){const t=n(m.title_length),d=n(m.description_length);s+=m.title?(t>=1&&t<=60?5:2):0;s+=m.description?(d>=50&&d<=160?5:2):0;const og=m.og??{},count=[og.title,og.description,og.image].filter(Boolean).length;s+=count===3?5:count?2:0;s+=m.canonical?5:0;}
 if(a){const files=Array.isArray(a.files)?a.files:[];const f=(p:string)=>files.find((x:any)=>x.path===p);s+=(f('/llms.txt')?.found&&n(f('/llms.txt')?.size_bytes)>0?10:0)+(f('/llms-full.txt')?.found&&n(f('/llms-full.txt')?.size_bytes)>0?5:0);}
 return Math.round(partial?s/65*100:s);
}
export function grade(score:number):string{return score>=90?'优秀':score>=75?'良好':score>=60?'待改进':'差';}
export function fixes(checks:Record<string,Check>,multiLanguage:boolean):Fix[]{
 const out:Fix[]=[];const r:any=checks.check_robots,sm:any=checks.check_sitemap,sc:any=checks.check_schema,m:any=checks.check_meta,a:any=checks.check_ai_files;
 const add=(priority:Fix['priority'],title:string,detail:string,tool:string)=>out.push({priority,title,detail,tool});
 if(r?.oai_searchbot?.status==='blocked')add('P0','允许 OAI-SearchBot 抓取','检查 robots.txt 中针对 OAI-SearchBot 的规则；本项仅说明抓取许可，不保证被引用。','check_robots');
 if(sm&&!sm.sitemap_found)add('P0','提供可读取的 sitemap','在 robots.txt 声明 sitemap 地址，并确认站点地图返回有效 XML。','check_sitemap');
 if(sc){const o:any=sc.organization;if(!o?.present)add('P1','补充 Organization JSON-LD','在 HTML 中提供可解析的 Organization 结构化数据。','check_schema');else for(const f of sc.missing_fields??[])add('P1',`补齐 Organization 的 ${f}`,'补充可验证的组织字段，不填入无法证实的信息。','check_schema');}
 if(m){if(!m.title||m.title_length<1||m.title_length>60)add('P1','修正页面标题','提供 1–60 字符的准确页面标题。','check_meta');if(!m.description||m.description_length<50||m.description_length>160)add('P1','修正页面描述','提供 50–160 字符且准确概括页面的描述。','check_meta');if(!m.canonical)add('P1','设置 canonical','为页面设置规范地址。','check_meta');const og:any=m.og;if(!og?.title||!og?.description||!og?.image)add('P2','补齐 Open Graph 标签','补充 og:title、og:description 和 og:image。','check_meta');if(m.hreflang?.length===0&&multiLanguage)add('P2','补齐 hreflang','多语言站点应声明各语言版本及对应 URL。','check_meta');}
 if(a&&!a.files?.find((f:any)=>f.path==='/llms.txt')?.found)add('P1','添加 llms.txt','在站点根目录提供可读的 llms.txt 文件。','check_ai_files');
 if(sm&&Number(sm.lastmod_coverage)<80)add('P2','补充 sitemap lastmod','仅在更新时间真实可追溯时提供 lastmod。','check_sitemap');if(sm&&sm.noindex_pages?.length)add('P2','检查 sitemap 中的 noindex 页面','确认被列入站点地图的 URL 是否应该允许索引。','check_sitemap');
 const order={P0:0,P1:1,P2:2};return out.sort((a,b)=>order[a.priority]-order[b.priority]);
}
