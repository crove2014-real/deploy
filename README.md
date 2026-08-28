# Crove CF v3.2 Pages Ready

## GitHub 根目录必须保持

deploy/
├── public/
│   └── index.html
├── functions/
│   └── api/
│       └── [[path]].js
├── worker/
│   └── worker.js
└── deployer.html

## Cloudflare Pages 构建设置

框架预设：无
构建命令：留空
构建输出目录：public

## Functions

`functions` 必须位于仓库根目录，不能放到 `public` 中。

## KV

Pages Functions 的 KV 绑定变量名：
CROVE_NODES

Worker 也需要绑定同名 KV（如果使用独立 Worker）。

## 重要

deployer.html 是纯部署器界面；Global API Key 不写入仓库。
