/** 最近一次画布 pane 右键/新建时的流坐标（左上角，非圆心） */
export const ctdpCreateAnchor = { x: 420, y: 320 };

export function setCtdpCreateAnchor(x: number, y: number) {
  ctdpCreateAnchor.x = x;
  ctdpCreateAnchor.y = y;
}

export const CTDP_PENDING_PREFIX = "pending:";

export function isPendingCtdpId(id: string) {
  return id.startsWith(CTDP_PENDING_PREFIX);
}
