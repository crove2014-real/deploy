export async function onRequestPost(context){
const cors={"Access-Control-Allow-Origin":context.request.headers.get("Origin")||"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Vary":"Origin"};
const out=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json;charset=UTF-8"}});
try{
const b=await context.request.json(),email=String(b.email||"").trim(),key=String(b.key||"").trim(),action=new URL(context.request.url).pathname.replace(/^\/api\/?/,"");
if(!email||!key)return out({success:false,error:"邮箱和 Global API Key 不能为空"},400);
const h={"X-Auth-Email":email,"X-Auth-Key":key,"Accept":"application/json"};
async function cf(p,o={}){let r=await fetch("https://api.cloudflare.com/client/v4"+p,{...o,headers:{...h,...(o.headers||{})}}),d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw Error(d.errors?.map(x=>x.message).join("; ")||"HTTP "+r.status);return d}
if(action==="verify"){let d=await cf("/user");return out({success:true,email:d.result?.email||email})}
if(action==="ips"){return out(await cf("/ips"))}
if(action==="account"){let d=await cf("/accounts?per_page=50");if((d.result||[]).length===1)return out({success:true,accountId:d.result[0].id});return out({success:false,error:"无法唯一确定 Account ID，请在 Cloudflare Dashboard 查看"},400)}
if(action==="save"){let a=String(b.accountId||"").trim();if(!a)return out({success:false,error:"缺少 Account ID"},400);return out({success:true})}
if(action==="trace"){let ip=String(b.ip||"");let s=performance.now();try{await fetch("https://cloudflare.com/cdn-cgi/trace",{cache:"no-store"})}catch(_){}return out({success:true,ip,latency:Math.round(performance.now()-s),speed:0})}
if(action==="sub"){return out({success:false,error:"订阅请通过 Worker/KV 端点生成"},400)}
return out({success:false,error:"未知 API 路径"},404)
}catch(e){return out({success:false,error:e.message||String(e)},500)}
}
export async function onRequestOptions(context){return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":context.request.headers.get("Origin")||"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"}})}
