import { parse } from 'node-html-parser';
import { errorCheck, request, validInput, type Check } from '../shared.js';
type Org = { present: boolean; name: string | null; logo: string | null; sameAs: string[]; description: string | null; url: string | null };
function flatten(x: unknown): unknown[] { if (Array.isArray(x)) return x.flatMap(flatten); if (x && typeof x === 'object') { const o=x as Record<string,unknown>; return [...('@graph' in o ? flatten(o['@graph']) : []),o]; } return []; }
export async function checkSchema(raw: unknown): Promise<Check> {
 const v=validInput(raw); if('error'in v)return {error:v.error,issues:[],verdict:'warn'}; const {url}=v;
 try {
  const r=await request(url); if(r.status!==200)throw new Error(`HTTP ${r.status}`);
  if(!(r.headers.get('content-type')??'').toLowerCase().includes('text/html'))return {url,error:'content type is not text/html',json_ld_found:false,json_ld_blocks:0,parse_errors:0,organization:{present:false,name:null,logo:null,sameAs:[],description:null,url:null},missing_fields:['name','logo','sameAs','description'],issues:['响应不是 HTML'],verdict:'warn'};
  const nodes=parse(r.body).querySelectorAll('script[type="application/ld+json"]'); let errors=0, org:any=null;
  for(const n of nodes){try{const parsed=JSON.parse(n.text);for(const item of flatten(parsed)){const o=item as any;const types=Array.isArray(o?.['@type'])?o['@type']:[o?.['@type']];if(types.includes('Organization')){org=o;break;}if(types.includes('WebSite')&&o.publisher){const pubs=flatten(o.publisher);const found=pubs.find((p:any)=>(Array.isArray(p?.['@type'])?p['@type']:[p?.['@type']]).includes('Organization'));if(found){org=found;break;}}}if(org)break;}catch{errors++;}}
  const organization:Org={present:!!org,name:typeof org?.name==='string'?org.name:null,logo:typeof org?.logo==='string'?org.logo:(typeof org?.logo?.url==='string'?org.logo.url:null),sameAs:Array.isArray(org?.sameAs)?org.sameAs.filter((x:unknown)=>typeof x==='string'):[],description:typeof org?.description==='string'?org.description:null,url:typeof org?.url==='string'?org.url:null};
  const missing_fields=(['name','logo','sameAs','description'] as const).filter(k=>k==='sameAs'?!organization.sameAs.length:!organization[k]);const issues:string[]=[];
  if(!nodes.length)issues.push('未发现 JSON-LD');if(errors)issues.push(`${errors} 个 JSON-LD 块解析失败`);if(missing_fields.length)issues.push(`Organization 缺少字段：${missing_fields.join(', ')}`);
  return {url,json_ld_found:nodes.length>0,json_ld_blocks:nodes.length,parse_errors:errors,organization,missing_fields,issues,verdict:!org?'fail':missing_fields.length?'warn':'pass'};
 }catch(e){return {...errorCheck(url,e),json_ld_found:false,json_ld_blocks:0,parse_errors:0,organization:{present:false,name:null,logo:null,sameAs:[],description:null,url:null},missing_fields:['name','logo','sameAs','description']};}
}
