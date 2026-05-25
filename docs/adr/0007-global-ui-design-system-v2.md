# ADR 0007: 全局 UI 与设计系统 v2（Editorial Luxe）

## Status

Accepted

## Context

皮肤原型选定 **杂志编辑（Skin B）** 方向，需在不过改业务逻辑/API 的前提下，建立可维护的全站视觉系统，并消除散落的 inline 样式与双轨 token。

## Decision

1. **视觉语言**：Editorial Luxe — 暖纸刊面、2px 结构线、`text-kicker` / `text-display` 排版、Fig. 画框式 CTDP 画布、章节编号侧栏。
2. **Token 源**：`globals.css` `@theme` + `.dark`「夜刊」策展色；CTDP 变量 `--ctdp-*` 与主题联动。
3. **组件变体**：Button（`editorial`, `masthead`）、Card（`narrative`, `stat`, `figure`）、Badge（含 CTDP 态）。
4. **画布**：圆形 `CtdpNode` 用 CSS 变量；`CtdpCanvasTheme` 注入用户色；RSIP 矩形节点用 `BaseNodeShell` 同 palette。
5. **质量门禁**：`src/lib/design/contrast.test.ts`（WCAG AA）；`scripts/check-no-inline-style.mjs` 白名单。

## Consequences

- 删除 `/prototype/skins` _throwaway 路由。
- 新页面必须使用 token / `ui/*`，禁止裸 hex。
- 用户可配置 CTDP 节点色仍经 `CtdpCanvasTheme` 写 CSS 变量（登记白名单）。

## Verdict (from prototype)

- **选中**：Skin B → v2 升格（更华丽、艺术化刊面）
- **不默认采纳**：Skin C 仪器暗色（仅 night 主题参考对比度）
