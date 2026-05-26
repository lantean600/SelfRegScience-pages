/** 应用内路由：禁用 Link prefetch，避免并行挂载多个 React Flow 树 */
export const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/ctdp",
  "/rsip",
  "/review",
  "/guide",
] as const;

export function isAppRoute(href: string): boolean {
  const path = href.split("?")[0]?.split("#")[0] ?? href;
  return APP_ROUTE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export function shouldPrefetchHref(href: string): boolean {
  return !isAppRoute(href);
}
