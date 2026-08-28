const API="https://api.cloudflare.com/client/v4";
const C={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
const j=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...C,"Content-Type":"application/json;charset=UTF-8","Cache-Control":"no-store"}});
function auth(c){if(!c?.email||!c?.key)throw Error("请填写邮箱和 Global API Key");return{"X-Auth-Email":c.email,"X-Auth-Key":c.key,"Content-Type":"application/json"}}
async function cf(c,path,opt={}){let r=await fetch(API+path,{...opt,headers:{...auth(c),...(opt.headers||{})}}),d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw Error((d.errors||[]).map(x=>x.message).join("; ")||`Cloudflare API HTTP ${r.status}`);return d.result}
async function accounts(c){return (await cf(c,"/accounts?per_page=50")).map(x=>({id:x.id,name:x.name,status:x.status}))}
async function accountId(c,id){if(id)return id;let a=await accounts(c);if(!a[0])throw Error("没有可用 Account");return a[0].id}
async function resources(c,id){let [w,p,k]=await Promise.all([
 cf(c,`/accounts/${id}/workers/scripts?per_page=100`).catch(()=>[]),
 cf(c,`/accounts/${id}/pages/projects?per_page=100`).catch(()=>[]),
 cf(c,`/accounts/${id}/storage/kv/namespaces?per_page=100`).catch(()=>[])
]);return{workers:w.map(x=>x.id||x.script_name||x.name),pages:p.map(x=>x.name),kv:k.map(x=>x.title+" ("+x.id+")")}}
async function kv(c,id,title,logs){let all=await cf(c,`/accounts/${id}/storage/kv/namespaces?per_page=100`);let x=all.find(v=>v.title===title);if(x){logs.push("复用 KV："+title);return x}let n=await cf(c,`/accounts/${id}/storage/kv/namespaces`,{method:"POST",body:JSON.stringify({title})});logs.push("创建 KV："+title);return n}
async function project(c,id,name,kvId,logs){try{await cf(c,`/accounts/${id}/pages/projects/${encodeURIComponent(name)}`);logs.push("复用 Pages："+name)}catch{await cf(c,`/accounts/${id}/pages/projects`,{method:"POST",body:JSON.stringify({name,production_branch:"main",deployment_configs:{production:{kv_namespaces:{CROVE_NODES:{namespace_id:kvId}},compatibility_date:"2026-08-28",compatibility_flags:[]},preview:{kv_namespaces:{CROVE_NODES:{namespace_id:kvId}},compatibility_date:"2026-08-28",compatibility_flags:[]}}})});logs.push("创建 Pages："+name)}}
async function worker(c,id,name,logs){let code=`export default{async fetch(){return new Response(JSON.stringify({name:${JSON.stringify(name)},version:"3.4",status:"ready"}),{headers:{"Content-Type":"application/json"}})}}`;
await fetch(API+`/accounts/${id}/workers/scripts/${encodeURIComponent(name)}`,{method:"PUT",headers:auth(c),"body":code}).then(async r=>{if(!r.ok)throw Error("Worker 上传失败 HTTP "+r.status)});logs.push("Worker 部署完成："+name)}
export async function onRequest(context){
if(context.request.method==="OPTIONS")return new Response(null,{status:204,headers:C});
if(context.request.method!=="POST")return j({ok:false,error:"POST required"},405);
try{let body=await context.request.json(),p=new URL(context.request.url).pathname.replace(/^\/api\/?/,""),c=body.credentials||{};
if(p==="accounts")return j({ok:true,accounts:await accounts(c)});
let id=await accountId(c,body.accountId);
if(p==="resources")return j({ok:true,...await resources(c,id)});
if(p==="deploy"){let logs=[],k=await kv(c,id,body.kvName||"CROVE_CF_NODES_V34",logs),pagesUrl=null,workerUrl=null;
if(body.target==="pages"||body.target==="both"){await project(c,id,body.pagesName||"crove-cf-v34",k.id,logs);pagesUrl=`https://${body.pagesName||"crove-cf-v34"}.pages.dev`;logs.push("Pages 项目已准备完成。")}
if(body.target==="worker"||body.target==="both"){let n=body.workerName||"crove-cf-v34-worker";await worker(c,id,n,logs);workerUrl=`https://${n}.workers.dev`}
return j({ok:true,logs,pagesUrl,workerUrl,kvId:k.id})}
return j({ok:false,error:"Not Found"},404)
}catch(e){return j({ok:false,error:e.message||String(e)},500)}}
