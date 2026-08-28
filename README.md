# Crove CF v3.2 Deploy Only

这是最终 Pages + Worker/Functions 项目主体，不包含 Global API Key 部署器。

结构：
public/index.html
functions/api/[[path]].js
wrangler.toml

Cloudflare Pages Git：
Build command：留空
Build output directory：public

绑定 KV：
变量名：CROVE_NODES
选择你的 KV Namespace。

说明：
- Pages 主体负责 UI 和优选功能。
- Pages Functions 提供 /api/ips、/api/trace、/api/save、/api/sub。
- 本项目不保存 Global API Key。
