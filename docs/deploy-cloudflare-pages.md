# Cloudflare Pages 部署指南（大陆入口）

本仓库专用于 **`https://selfregscience-pages.pages.dev`**，与 Worker 仓库 [lantean600/SelfRegScience](https://github.com/lantean600/SelfRegScience) 并行，**不修改**旧仓与 `workers.dev` 部署。

## 架构

```text
用户 → *.pages.dev (薄代理 Pages Functions，全部路径含 /_next/static)
         → Service Binding → Worker `selfregscience`（OpenNext：SSR + ASSETS + API）
         → D1 `selfregscience`（与旧入口同一库）
```

**禁止 HTML/静态双构建分裂**：HTML 与 `/_next/static/*` 必须来自**同一次** `build:opennext` 并**同一** Worker 部署。切勿让 Pages 单独托管静态而 Worker 提供另一版 HTML（会导致 CSS/JS 404、页面无样式）。

Pages **不会**二次打包完整 `worker.js`（否则会破坏 Prisma WASM），只上传：

- 薄代理 `_worker.js`（转发到 `selfregscience` Worker）
- `_routes.json`（`include: ["/*"]`，无 static exclude）

## 前置条件

- Node.js 20+，`npm install`
- `npx wrangler login`
- 线上 Worker **`selfregscience`** 已可正常运行（旧仓 Workers Builds）
- D1 已建表（`npm run db:d1:apply:remote`，通常旧仓已做过）

## 本地命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | Next 本地开发（SQLite） |
| `npm run build:pages` | OpenNext 构建 + 生成 Pages 代理产物 |
| `npm run deploy:worker:production` | 部署 Worker `selfregscience`（[`wrangler.selfregscience.jsonc`](../wrangler.selfregscience.jsonc)） |
| `npm run deploy:production` | Worker + Pages 一次发布（推荐） |
| `npm run deploy:pages` | 仅 Pages（需 Worker 已与本次 build 同步） |
| `npm run deploy:worker` | 可选：单独部署 `selfregscience-pages-api` Worker（默认不用） |
| `npm run cf:secret:session` | 为 Pages 项目写入 `SESSION_SECRET`（与 Worker 一致为佳） |

## 首次 / 日常部署

```bash
npm ci
npm run deploy:production
```

### 方式 A：GitHub Actions（推荐，已配置）

推送 `main` 后由 [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) 顺序执行：

1. `npm run build:opennext`（单次构建）
2. `wrangler deploy -c wrangler.selfregscience.jsonc`
3. `node scripts/prepare-pages-output.mjs`
4. `wrangler pages deploy .open-next ...`

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 添加：

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | 需 **Cloudflare Pages: Edit** + **Workers Scripts: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard 右侧 Account ID |

### 方式 B：Dashboard 连 Git

- **Build command**：`npm ci && npm run build:pages`
- **Build output**：由 `wrangler.toml` 的 `pages_build_output_dir = ".open-next"` 决定
- **Production branch**：`main`
- **Compatibility flags**：Production 与 Preview 均启用 `nodejs_compat`，日期 ≥ `2024-09-23`

## 绑定与密钥

| 项 | 配置 |
|----|------|
| Service binding | Pages `API` → Worker **`selfregscience`**（[`wrangler.toml`](../wrangler.toml)） |
| D1 | 经 Worker 使用同一 `database_id`（无需在 Pages 再绑 D1） |
| `SESSION_SECRET` | Worker 与 Pages 项目均需配置；可用 `npm run cf:secret:session`（会写入 Pages；Worker 请在旧项目 Dashboard 保持一致） |
| `CF_PAGES=1` | 已在 `wrangler.toml` 的 `[vars]` 中设置 |

修改转发目标 Worker 时，设置环境变量 `CF_PAGES_API_SERVICE` 后重新 `npm run build:pages`。

## 验收清单

1. `GET https://selfregscience-pages.pages.dev/api/health` → `ok: true`, `databaseBackend: "d1"`
2. 首页、登录、Dashboard、CTDP、RSIP、Review
3. 大陆关代理可访问（主入口）
4. `npm run lint` / `npm test` 通过

## 本地预览

- **Next + SQLite**：`npm run dev`（日常开发）
- **`wrangler pages dev`**：会本地加载完整 OpenNext handler，Prisma WASM 在 Pages 本地运行时不可用 → `/api/health` 503。**属预期**；生产依赖薄代理转发到已部署 Worker `selfregscience`。

## 故障排查

- **页面无样式 / 黑底白字**：`/_next/static/*.css` 404。多为只部署了 Pages 未同步 Worker，或 `_routes.json` 把 static 留在 Pages 而 HTML 来自旧 Worker。修复：同次 `build:opennext` 后执行 `deploy:worker:production` 再 `deploy:pages`，并确保无 `exclude: ["/_next/static/*"]`。
- **503 + Prisma WASM 文案**：Pages 误上传了完整 `worker.js`；应只保留 [`scripts/prepare-pages-output.mjs`](../scripts/prepare-pages-output.mjs) 生成的薄代理。
- **本地 `pages dev` 503**：见上文「本地预览」，勿与生产混淆。
- **503 API service binding missing**：`wrangler.toml` 中 `API` 未指向已部署的 Worker `selfregscience`。
- **登录失败**：`SESSION_SECRET` 未在 Pages 或 Worker 配置。
- **与旧站数据不一致**：确认绑定 Worker 名为 `selfregscience` 且 D1 为同一库。

## 与旧 Worker 仓同步代码

功能在 `SelfRegScience` 开发，合并后复制到本仓再 `npm run deploy:production`。
