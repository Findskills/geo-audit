import { errorCheck, request, validInput, type Check } from '../shared.js';
export async function checkAiFiles(raw: unknown): Promise<Check> {
 const v=validInput(raw);if('error'in v)return {error:v.error,issues:[],verdict:'warn'};const {url,parsed}=v;const files=[] as Array<Record<string,unknown>>;const issues:string[]=[];let failed=false;
 try{for(const path of ['/llms.txt','/llms-full.txt']){try{const r=await request(`${parsed.origin}${path}`);const found=r.status===200;if(r.status!==200&&r.status!==404){failed=true;files.push({path,found:false,status:r.status,size_bytes:null,preview:null,error:`HTTP ${r.status}`});issues.push(`${path} 抓取失败：HTTP ${r.status}`);continue;}files.push({path,found,status:r.status,size_bytes:new TextEncoder().encode(r.body).length,preview:r.body.slice(0,200)});}catch(e){failed=true;files.push({path,found:false,status:null,size_bytes:null,preview:null,error:e instanceof Error?e.message:'request failed'});issues.push(`${path} 抓取失败：${e instanceof Error?e.message:'request failed'}`);}}
 const llms=files[0];if(failed)return {url,files,issues,verdict:'warn'};if(!llms.found){issues.push('llms.txt 缺失——AI 爬虫无结构化入口');return {url,files,issues,verdict:'fail'};}if(Number(llms.size_bytes)===0){issues.push('llms.txt 存在但为空');return {url,files,issues,verdict:'warn'};}return {url,files,issues,verdict:'pass'};
 }catch(e){return {...errorCheck(url,e),files};}
}
