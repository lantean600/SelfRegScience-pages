# Pages 入口回归清单

在 **`https://selfregscience-pages.pages.dev`**（关代理）与 **`workers.dev`**（旧入口，开代理对照）执行。

## 自动化

```bash
npm run lint
npm test
npm run build:pages
curl -sS https://selfregscience-pages.pages.dev/api/health
```

期望 health JSON：`ok: true`, `databaseBackend: "d1"`, `hasSessionSecret: true`。

最近一次生产检查（2026-05-25）：`ok: true`, `databaseBackend: "d1"`, `hasD1Binding: true`, `hasSessionSecret: true`。

`npm test` 在无本地 SQLite/D1 时会跳过部分集成用例；纯逻辑用例应全部通过。

## 手动

- [ ] 营销首页 Hero 可纵向滚动，Mechanics 无横滚卡顿
- [ ] 注册 / 登录 / 退出
- [ ] Dashboard 波纹与统计
- [ ] CTDP：双指缩放、点 + 新建、菜单不出屏
- [ ] RSIP / Review / Guide
- [ ] 主题切换、移动端布局
- [ ] 无整页横向滚动条
