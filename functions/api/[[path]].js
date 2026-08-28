export async function onRequest(context){
const c={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
const j=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...c,"Content-Type":"application/json;charset=UTF-8"}});
if(context.request.method==="OPTIONS")return new Response(null,{status:204,headers:c});
try{
const u=new URL(context.request.url),p=u.pathname;
if(p==="/api/ips"){let r=await fetch("https://api.cloudflare.com/client/v4/ips");return new Response(await r.text(),{headers:{...c,"Content-Type":"application/json"}})}
if(p==="/api/trace"){let ip=u.searchParams.get("ip")||"",s=Date.now();try{await fetch("https://cloudflare.com/cdn-cgi/trace",{cache:"no-store"})}catch(_){}return j({success:true,ip,latency:Date.now()-s,speed:0})}
if(p==="/api/save"&&context.request.method==="POST"){if(!context.env.CROVE_NODES)return j({success:false,error:"KV 未绑定 CROVE_NODES"},500);let b=await context.request.json();await context.env.CROVE_NODES.put("best",JSON.stringify(b.nodes||[]));return j({success:true})}
if(p==="/api/sub"){if(!context.env.CROVE_NODES)return j({success:false,error:"KV 未绑定 CROVE_NODES"},500);let n=JSON.parse(await context.env.CROVE_NODES.get("best")||"[]"),y="proxies:\n";n.forEach((x,i)=>y+=`- name: CF-${i+1}\n  type: http\n  server: ${x.ip}\n  port: ${x.port||443}\n  tls: true\n`);return new Response(y,{headers:{...c,"Content-Type":"text/yaml;charset=UTF-8"}})}
return j({name:"Crove CF Worker",version:"3.2",routes:["/api/ips","/api/trace","/api/save","/api/sub"]})
}catch(e){return j({success:false,error:e.message||String(e)},500)}
}