import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
const dir=join(homedir(),'.geo-audit');
async function ensure(){await mkdir(dir,{recursive:true,mode:0o700});}
function today(){return new Date().toISOString().slice(0,10);}
export async function consumeFreeAudit():Promise<boolean>{
 await ensure();const path=join(dir,'usage.json');let data:Record<string,number>={};try{data=JSON.parse(await readFile(path,'utf8')) as Record<string,number>;}catch{}
 const day=today(),used=data[day]??0,limitRaw=Number(process.env.FREE_AUDITS_PER_DAY??'3'),limit=Number.isFinite(limitRaw)&&limitRaw>=0?Math.floor(limitRaw):3;
 if(used>=limit)return false;data[day]=used+1;await writeFile(path,JSON.stringify(data,null,2)+'\n',{mode:0o600});return true;
}
export type History={url:string;audited_at:string;score:number;grade:string};
export async function previousPaid(url:string):Promise<History|null>{
 try{const rows=(await readFile(join(dir,'history.jsonl'),'utf8')).trim().split(/\r?\n/).filter(Boolean);for(let i=rows.length-1;i>=0;i--){const h=JSON.parse(rows[i]) as History;if(h.url===url)return h;}}catch{}return null;
}
export async function appendPaid(row:History):Promise<boolean>{
 try{await ensure();await appendFile(join(dir,'history.jsonl'),JSON.stringify(row)+'\n',{mode:0o600});return true;}catch{return false;}
}
