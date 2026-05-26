/** CTDP 画布拖动状态：布局 effect 与设置项在拖动期间延后重算 */

let dragging = false;
let pendingRelayout = false;

export function isCtdpDragging() {
  return dragging;
}

export function setCtdpDragging(active: boolean) {
  dragging = active;
  if (!active && pendingRelayout) {
    pendingRelayout = false;
    window.dispatchEvent(new CustomEvent("ctdp-force-pending-relayout"));
  }
}

export function markCtdpPendingRelayout() {
  if (dragging) {
    pendingRelayout = true;
    return true;
  }
  return false;
}
