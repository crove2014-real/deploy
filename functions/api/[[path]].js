export async function onRequestPost(context) {
  const cors = {
    "Access-Control-Allow-Origin": context.request.headers.get("Origin") || "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
  const json=(data,status=200)=>new Response(JSON.stringify(data),{
    status,headers:{...cors,"Content-Type":"application/json;charset=UTF-8"}
  });

  try{
    const body=await context.request.json();
    const email=String(body.email||"").trim();
    const key=String(body.key||"").trim();
    if(!email||!key)return json({success:false,error:"邮箱和 Global API Key 不能为空"},400);

    const auth={"X-Auth-Email":email,"X-Auth-Key":key,"Accept":"application/json"};

    async function cf(path,opt={}){
      const r=await fetch("https://api.cloudflare.com/client/v4"+path,{
        ...opt,headers:{...auth,...(opt.headers||{})}
      });
      let d=null;try{d=await r.json()}catch(_){}
      if(!r.ok||d?.success===false){
        throw new Error(d?.errors?.map(x=>x.message).join("; ")||("HTTP "+r.status));
      }
      return d;
    }

    const action=new URL(context.request.url).pathname.replace(/^\/api\/?/,"");

    if(action==="verify"){
      const d=await cf("/user");
      return json({success:true,email:d.result?.email||email});
    }

    if(action==="account"){
      const d=await cf("/accounts?per_page=50");
      const list=d.result||[];
      if(list.length===1)return json({success:true,accountId:list[0].id});
      if(list.length>1)return json({success:false,error:"检测到多个账户，请填写 Account ID"},400);
      return json({success:false,error:"没有可用的 Cloudflare 账户"},400);
    }

    if(action==="kv"){
      const a=String(body.accountId||"").trim();
      const title=String(body.title||"CROVE_CF_NODES_V31").trim();
      if(!a)return json({success:false,error:"Account ID 不能为空"},400);

      try{
        const d=await cf("/accounts/"+encodeURIComponent(a)+"/storage/kv/namespaces?per_page=100");
        const found=(d.result||[]).find(x=>x.title===title);
        if(found)return json({success:true,kvId:found.id});
      }catch(_){}

      const d=await cf("/accounts/"+encodeURIComponent(a)+"/storage/kv/namespaces",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({title})
      });
      return json({success:true,kvId:d.result.id});
    }

    if(action==="deploy"){
      const a=String(body.accountId||"").trim();
      const n=String(body.workerName||"crove-cf-v31").replace(/[^A-Za-z0-9_-]/g,"-").slice(0,63);
      const k=String(body.kvId||"").trim();
      if(!a||!k)return json({success:false,error:"Account ID 或 KV ID 缺失"},400);

      const source=`export default {
async fetch(request,env){
const u=new URL(request.url);
const c={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"*"};
if(request.method==="OPTIONS")return new Response(null,{headers:c});
if(u.pathname==="/ips"){
const r=await fetch("https://api.cloudflare.com/client/v4/ips");
return new Response(await r.text(),{headers:{...c,"content-type":"application/json;charset=UTF-8"}});
}
if(u.pathname==="/trace"){
let t="";
try{t=await(await fetch("https://cloudflare.com/cdn-cgi/trace",{cf:{cacheTtl:0}})).text()}catch(e){}
const x={};t.split("\\n").forEach(s=>{const i=s.indexOf("=");if(i>0)x[s.slice(0,i)]=s.slice(i+1)});
return new Response(JSON.stringify({ip:u.searchParams.get("ip")||"",colo:x.colo||"-",country:x.loc||"-"}),{headers:{...c,"content-type":"application/json"}});
}
if(u.pathname==="/nodes")return new Response(await env.CROVE_NODES.get("best")||"[]",{headers:{...c,"content-type":"application/json"}});
if(u.pathname==="/save"){
if(request.method!=="POST")return new Response("POST required",{status:405,headers:c});
const b=await request.text();JSON.parse(b);await env.CROVE_NODES.put("best",b);
return new Response(JSON.stringify({success:true}),{headers:{...c,"content-type":"application/json"}});
}
if(u.pathname==="/sub"){
let nodes=[];try{nodes=JSON.parse(await env.CROVE_NODES.get("best")||"[]")}catch(e){}
let y="proxies:\\n";nodes.forEach((n,i)=>{y+="- name: "+(n.name||"CF-"+(i+1))+"\\n  type: http\\n  server: "+(n.server||n.ip)+"\\n  port: "+Number(n.port||443)+"\\n  tls: true\\n"});
return new Response(y,{headers:{...c,"content-type":"text/yaml;charset=UTF-8"}});
}
return new Response(JSON.stringify({name:"Crove CF Worker",version:"3.1.2",routes:["/ips","/trace","/nodes","/save","/sub"]}),{headers:{...c,"content-type":"application/json"}});
}}`;

      const fd=new FormData();
      fd.append("metadata",new Blob([JSON.stringify({
        main_module:"worker.js",
        compatibility_date:"2026-08-28",
        bindings:[{type:"kv_namespace",name:"CROVE_NODES",namespace_id:k}]
      })],{type:"application/json"}));
      fd.append("worker.js",new Blob([source],{type:"application/javascript+module"}),"worker.js");

      const r=await fetch("https://api.cloudflare.com/client/v4/accounts/"+encodeURIComponent(a)+"/workers/scripts/"+encodeURIComponent(n),{
        method:"PUT",headers:auth,body:fd
      });
      let d=null;try{d=await r.json()}catch(_){}
      if(!r.ok||d?.success===false)throw new Error(d?.errors?.map(x=>x.message).join("; ")||("HTTP "+r.status));

      let workersDevEnabled=true;
      try{
        const sr=await fetch("https://api.cloudflare.com/client/v4/accounts/"+encodeURIComponent(a)+"/workers/scripts/"+encodeURIComponent(n)+"/subdomain",{
          method:"POST",
          headers:{...auth,"Content-Type":"application/json"},
          body:JSON.stringify({enabled:true,previews_enabled:false})
        });
        if(!sr.ok)workersDevEnabled=false;
      }catch(_){workersDevEnabled=false}

      return json({success:true,workerUrl:"https://"+n+".workers.dev",workersDevEnabled});
    }

    return json({success:false,error:"未知 API 路径"},404);
  }catch(e){
    return json({success:false,error:e.message||String(e)},500);
  }
}

export async function onRequestOptions(context){
  return new Response(null,{status:204,headers:{
    "Access-Control-Allow-Origin":context.request.headers.get("Origin")||"*",
    "Access-Control-Allow-Methods":"POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type",
    "Vary":"Origin"
  }});
}
