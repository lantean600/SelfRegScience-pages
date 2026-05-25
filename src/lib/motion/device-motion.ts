/** 触屏或小屏：使用原生滚动，避免 Lenis 与画布手势冲突 */
export function prefersNativeScroll(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  return coarse || narrow;
}
