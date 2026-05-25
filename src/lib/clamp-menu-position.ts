/** Keep fixed menus inside the viewport after layout. */
export function clampMenuPosition(
  x: number,
  y: number,
  el: HTMLElement | null,
  margin = 8,
): { x: number; y: number } {
  if (typeof window === "undefined" || !el) return { x, y };
  const { width, height } = el.getBoundingClientRect();
  const maxX = window.innerWidth - width - margin;
  const maxY = window.innerHeight - height - margin;
  return {
    x: Math.min(Math.max(margin, x), Math.max(margin, maxX)),
    y: Math.min(Math.max(margin, y), Math.max(margin, maxY)),
  };
}
