# SelfRegScience

基于 [theory.md](./theory.md) 的 **CTDP**（链式时延协议）与 **RSIP**（递归稳态迭代协议）全栈实现。

## 技术栈

- Next.js 15（App Router）
- Prisma + SQLite（本地开发）/ Cloudflare D1（部署环境）
- Tailwind CSS v4 + 编辑型设计系统（Fraunces / Inter / JetBrains Mono）
- `next-themes` 浅色 / 深色 / 跟随系统

## 破坏性变更（CTDP 节点森林）

本版本将 CTDP 从「主链 / 任务群画布」重构为 **CtdpNetwork + CtdpNode** 森林模型，并删除 `MainChain`、`TaskEchelon` 等表。**不迁移**旧主链 streak / 任务群数据。升级后请执行：

```bash
npx prisma db push
```

开发库若提示 data loss，需接受重置或换用新数据库文件。

## 快速开始

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

访问 http://localhost:3000 ，注册后即可使用：

- `/dashboard` — 总览、网络完整度与待判定节点
- `/ctdp` — 任务节点森林（引用属性、完整度、预约→神圣座位→专注→判定）
- `/rsip` — 国策模板、国策树、习惯内化、国策组
- `/review` — 赢麻了、崩塌、判例、事件时间线

侧栏底部可切换主题（浅色 / 深色 / 系统）。

## 测试

```bash
npm test
npm run build:local
```

## 生产部署（Pages · 大陆入口）

- **本仓库**：Cloudflare Pages → `https://selfregscience-pages.pages.dev`
- 见 [docs/deploy-cloudflare-pages.md](./docs/deploy-cloudflare-pages.md)
- 与 Worker 仓 [lantean600/SelfRegScience](https://github.com/lantean600/SelfRegScience) 共用同一 D1；`workers.dev` 入口仍在旧仓，互不修改。

## UI 结构

| 目录 | 职责 |
|------|------|
| `src/app/globals.css` | 设计令牌（暖纸色 / 暖墨深色） |
| `src/components/ui/` | 原子组件 |
| `src/components/AppShell.tsx` | 应用侧栏壳 |
| `src/app/(app)/` | 需登录的业务页面 |

## 环境变量

见 `.env.example`。
