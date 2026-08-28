# Crove CF v3.2 纯部署器（修正版）

public/index.html 已改为纯部署器，不再是优选 IP 页面。

根目录：
public/
functions/
worker/
pages-tool/
deployer.html（可选）

Pages 设置：
框架预设：无
构建命令：留空
构建输出目录：public
根目录：/

注意：纯浏览器 HTML 不能安全完成完整的 Cloudflare Pages/Worker 自部署而不经过服务器端凭据桥接。请用 Wrangler/Git 集成执行实际部署；Global API Key 不写入仓库。
