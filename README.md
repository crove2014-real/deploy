# Crove CF v3.4 Pure Pages

## 架构
一个 Cloudflare Pages 项目：
- public/index.html：部署器 UI
- functions/api/[[path]].js：服务器端部署 API
- pages-app/：以后放完整 Crove CF 优选页面
- worker/：Worker 源码参考

## 部署
Cloudflare Pages 使用 Git integration：
Framework preset：None
Build command：留空
Build output directory：public
Root directory：/

注意：Cloudflare 官方说明，Pages Functions 需要通过 Git 集成或 Wrangler 部署；Dashboard Direct Upload 不支持 Functions。

## KV
项目创建时 API 会尝试把 `CROVE_NODES` 绑定到指定 KV。Cloudflare Pages 的 KV binding 可以在项目设置中配置，也可以通过项目 API 配置。

## 安全
Global API Key 只存在于单次请求的内存中，不写入 KV/localStorage/Cookie/文件。
不要把此部署器公开给不可信用户。Cloudflare 官方推荐 API Token 优先于 Global API Key。
