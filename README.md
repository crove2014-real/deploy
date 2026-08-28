# Crove CF v3.2 纯部署器

## deployer.html
只负责部署，不包含 IP 优选/测速功能。

## pages/
完整的 Crove CF Pages 主体：
- public/index.html 的内容位于 pages/index.html
- Pages Functions：pages/functions/api/[[path]].js

## worker/
独立 Worker 后端。

### 推荐部署
将 `pages` 目录作为 Pages 项目根目录：
Build command 留空
Build output directory：留空（若使用当前目录策略，需按 Pages 项目设置调整）

最稳妥方式：把 `pages/index.html` 放入 public，并把 functions 放在项目根目录。

注意：
纯 HTML 部署器无法在没有服务器端中转的情况下安全地自我部署 Pages/Worker。Global API Key 不应写入仓库。
