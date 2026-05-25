# Cloudflare Workers + D1 部署指南

SelfRegScience 现在使用 **OpenNext + Cloudflare Workers + Cloudflare D1**。

## 架构

```text
git push -> Cloudflare Workers Builds -> OpenNext worker
                                           |
                                           +-> Cloudflare D1 (production / preview)

local npm run dev -> SQLite file:./dev.db
```

## 运行策略

- 线上与 Cloudflare 预览环境使用 D1 binding `DB`
- 本地 `npm run dev` 继续使用 SQLite `file:./dev.db`
- 本地 Worker 预览 / 线上部署都需要在 `wrangler.jsonc` 或 Dashboard 里配置 D1 绑定

## 前置条件

- 已有 Cloudflare 账号
- 已将仓库连接到 Cloudflare Workers Builds
- 本机 Node.js 20+
- 本机已安装项目依赖：`npm install`

## 1. 创建 D1 数据库

首次执行：

```bash
npx wrangler d1 create selfregscience
```

Wrangler 会输出一段 `d1_databases` 配置。把其中的 `database_id` 写回 `wrangler.jsonc` 的 D1 模板位置，或在 Cloudflare Dashboard 里给当前 Worker 添加同名 binding：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "selfregscience",
    "database_id": "<你的 D1 database_id>"
  }
]
```

如果本机还没登录 Wrangler，需要先执行：

```bash
npx wrangler login
```

## 2. 生成并应用 D1 Schema

项目已提供基于 Prisma schema 的 D1 SQL 基线：

- `prisma/migrations/0001_init.sql`

后续如需重新生成：

```bash
npm run db:d1:generate
```

将 SQL 应用到本地 D1 预览库：

```bash
npm run db:d1:apply:local
```

将 SQL 应用到远端 D1：

```bash
npm run db:d1:apply:remote
```

默认数据库名为 `selfregscience`。如你创建时用了别的名字，可先设置环境变量：

```powershell
$env:CLOUDFLARE_D1_DATABASE_NAME="你的库名"
```

```bash
export CLOUDFLARE_D1_DATABASE_NAME="你的库名"
```

可选：本地 SQLite 初始化与种子数据仍可继续使用：

```bash
npx prisma db push
npm run db:seed
```

## 3. Cloudflare 变量

在 Cloudflare Dashboard 的 Worker / Build 环境里至少配置：

- `SESSION_SECRET`: 随机长字符串，仅 ASCII（**类型选 Secret / 加密**）

**重要**：若使用 GitHub → Cloudflare Workers Builds 自动部署，仅在本机执行 `wrangler secret put` 可能不够，还必须在 Dashboard → **Workers & Pages** → `selfregscience` → **Settings** → **Variables and Secrets** 中添加同名 `SESSION_SECRET`，然后 **Deploy** 一次。

本地可生成并写入 Worker：

```bash
npm run cf:secret:session
```

不再需要：

- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`

## 4. 本地与预览命令

- `npm run dev`: 本地 Next.js 开发，走 SQLite
- `npm run build:local`: 本地完整构建
- `npm run preview:cf`: 用 Workers 运行时本地预览 Cloudflare 构建
- `npm run deploy:cf`: 命令行部署到 Cloudflare
- `npm run cf:typegen`: 从 Wrangler 绑定生成 Cloudflare 类型

如要在本地 Worker 预览里使用自定义变量，复制 `.dev.vars.example` 为 `.dev.vars` 后填写。

## 5. GitHub 自动部署

Cloudflare Workers Builds 推荐配置：

- Production branch: `main`
- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`
- Node.js version: 20

## 6. 部署后回归

至少验证以下链路：

1. `/register` 注册
2. `/login` 登录
3. `/dashboard` 能加载
4. `/ctdp` 能创建与刷新节点
5. `/rsip` 能读出国策树
6. `/api/health` 返回 `ok: true` 且 `databaseBackend: "d1"`

## 故障排查

- `Cloudflare D1 binding 'DB' is not configured`：
  `wrangler.jsonc` 或 Dashboard 没配 D1 binding。
- `D1 数据库表未创建，请先执行 D1 migration`：
  还没执行 `npm run db:d1:apply:remote`。
- `must contain only ASCII characters`：
  `SESSION_SECRET` 混入中文或弯引号。
- `服务端未配置 SESSION_SECRET`（但 `wrangler secret list` 已有）：
  Secret 在 Worker 的 `env` 上，不一定会进入 `process.env`；应用会从 `getCloudflareContext().env.SESSION_SECRET` 直接读取。若仍报错，执行 `npm run cf:secret:session`，并在 Workers Builds Dashboard 中配置同名 Secret。
- `__name is not defined`：
  已通过 `wrangler.jsonc` 中 `"keep_names": false` 规避；确认部署使用的是当前代码。
- 本地 `npm run dev` 正常，但线上 500：
  优先检查 D1 binding、远端 migration、`SESSION_SECRET`。
- `/api/health` 与登录同为泛化 503/500：
  确认 [next.config.ts](../next.config.ts) 含 `serverExternalPackages: ["@prisma/client", ".prisma/client"]`（OpenNext 需以此把 Prisma 打进 workerd），重新 `opennextjs-cloudflare build` 并部署。

## 相关文件

- `wrangler.jsonc`：Worker 与 D1 binding 模板
- `src/lib/db.ts`：D1 / SQLite 数据库入口
- `prisma/migrations/0001_init.sql`：D1 初始建表 SQL
- `.env.example`：本地 SQLite 环境模板
- `.dev.vars.example`：Worker 本地预览环境模板
