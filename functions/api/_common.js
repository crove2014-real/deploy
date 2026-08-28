const API='https://api.cloudflare.com/client/v4';
const H={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
const out=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...H,'Content-Type':'application/json;charset=UTF-8','Cache-Control':'no-store'}});
function ah(c){if(!c?.email||!c?.key)throw Error('请填写邮箱和 Global API Key');return{'X-Auth-Email':c.email,'X-Auth-Key':c.key,'Content-Type':'application/json'}}
async function cf(c,path,opt={}){let r=await fetch(API+path,{...opt,headers:{...ah(c),...(opt.headers||{})}}),d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw Error((d.errors||[]).map(x=>x.message).join('; ')||('Cloudflare API HTTP '+r.status));return d.result}
export{H,out,cf};