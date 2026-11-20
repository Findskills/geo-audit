import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { checkRobots } from './tools/checkRobots.js';
import { checkSitemap } from './tools/checkSitemap.js';
import { checkSchema } from './tools/checkSchema.js';
import { checkMeta } from './tools/checkMeta.js';
import { checkAiFiles } from './tools/checkAiFiles.js';
import { runAudit } from './tools/runAudit.js';

type ToolDef={name:string;description:string;handler:(args:unknown)=>Promise<unknown>};
const tier=process.env.TIER==='paid'?'paid':'free';
const all:ToolDef[]=[
 {name:'check_robots',description:'检查 robots.txt 对 OAI-SearchBot、GPTBot、ClaudeBot 的规则。',handler:checkRobots},
 {name:'check_sitemap',description:'检查 sitemap 的数量、lastmod 与 noindex 页面。',handler:checkSitemap},
 {name:'check_schema',description:'检查网页中的 Organization JSON-LD。',handler:checkSchema},
 {name:'check_meta',description:'检查 title、description、Open Graph、canonical 与 hreflang。',handler:checkMeta},
 {name:'check_ai_files',description:'检查 llms.txt 与 llms-full.txt。',handler:checkAiFiles},
 {name:'run_audit',description:'运行 GEO 可见度诊断并生成 Markdown 报告。',handler:(args)=>runAudit(args,tier)}
];
const tools=tier==='free'?all.filter(x=>['check_robots','check_sitemap','check_meta','run_audit'].includes(x.name)):all;
const server=new Server({name:'geo-audit',version:'0.1.0'},{capabilities:{tools:{}}});
server.setRequestHandler(ListToolsRequestSchema,async()=>({tools:tools.map(t=>({name:t.name,description:t.description,inputSchema:{type:'object',properties:{url:{type:'string',description:'完整的 http:// 或 https:// URL'}},required:['url'],additionalProperties:false}}))}));
server.setRequestHandler(CallToolRequestSchema,async(req)=>{
 const name=req.params.name,args=req.params.arguments??{};const tool=tools.find(t=>t.name===name);
 if(!tool)return {content:[{type:'text',text:JSON.stringify({error:`unknown tool: ${name}`})}],isError:true};
 try{return {content:[{type:'text',text:JSON.stringify(await tool.handler(args))}]};}
 catch(e){return {content:[{type:'text',text:JSON.stringify({error:e instanceof Error?e.message:'tool failed'})}],isError:true};}
});
await server.connect(new StdioServerTransport());
