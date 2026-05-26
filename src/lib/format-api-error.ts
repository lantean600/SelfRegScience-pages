import { collectErrorText } from "@/lib/collect-error-text";

/** Map server errors to safe, actionable Chinese messages for the UI. */
export function formatApiError(error: unknown): string {
  const full = collectErrorText(error);

  if (full.includes("must contain only ASCII")) {
    return "环境变量含中文或特殊符号，请只使用纯 ASCII 的 SESSION_SECRET。";
  }
  if (full.includes("SESSION_SECRET must be set")) {
    return "服务端未配置 SESSION_SECRET。";
  }
  if (full.includes("Cloudflare runtime context is unavailable")) {
    return "Cloudflare 运行时上下文不可用，无法解析 D1 绑定。";
  }
  if (full.includes("Cloudflare D1 binding `DB` is not configured")) {
    return "Cloudflare D1 绑定 `DB` 未配置，请在 wrangler 或 Dashboard 中绑定 D1 数据库。";
  }
  if (full.includes("Node-only module")) {
    return "线上请求误回退到了本地 SQLite 路径，请检查 Cloudflare D1 运行时分流。";
  }
  if (
    full.includes("no such table") ||
    full.includes("P2021") ||
    full.includes("does not exist") ||
    full.includes("SQLITE_UNKNOWN")
  ) {
    return "D1 数据库表未创建，请先执行 D1 migration。";
  }
  if (full.includes("ENOTFOUND") || full.includes("fetch failed") || full.includes("Network")) {
    return "无法连接 Cloudflare D1，请检查绑定和部署配置。";
  }
  if (full.includes("initOpenNextCloudflareForDev")) {
    return "Cloudflare 开发集成未初始化；线上若出现此错误，多为运行时上下文丢失。";
  }
  if (full.includes("__wrangler") || full.includes("getPlatformProxy")) {
    return "无法在 Node 运行时解析 Cloudflare 绑定，请确认 OpenNext/Prisma 已按 workerd 打包。";
  }
  if (full.includes("__name is not defined")) {
    return "Worker 打包配置异常（__name），请确认 wrangler keep_names 与最新部署。";
  }
  if (full.includes("DriverAdapter") || full.match(/\bP[0-9]{4}\b/)) {
    return "D1 数据库查询失败，请检查 migration 与 Prisma D1 适配器配置。";
  }

  return "服务暂时不可用，请稍后重试";
}
