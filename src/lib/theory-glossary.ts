export type GlossaryTerm =
  | "ctdp_node"
  | "reference_count"
  | "completeness"
  | "sacred_seat"
  | "aux_chain"
  | "appointment"
  | "precedent"
  | "focus_session"
  | "policy"
  | "policy_tree"
  | "compartment_freeze";

export const theoryGlossary: Record<
  GlossaryTerm,
  { title: string; excerpt: string; anchor: string }
> = {
  ctdp_node: {
    title: "任务节点",
    excerpt:
      "森林中的任务单元，四态：初始、执行、成功、失败。出边至多一条，指向被引用者。",
    anchor: "ctdp_node",
  },
  reference_count: {
    title: "引用属性",
    excerpt: "沿出边可达的下游节点总数；用于预估失败波及范围。",
    anchor: "reference_count",
  },
  completeness: {
    title: "网络完整度",
    excerpt: "成功节点引用属性之和 / 全部节点引用属性之和，衡量森林执行情况。",
    anchor: "completeness",
  },
  sacred_seat: {
    title: "神圣座位",
    excerpt:
      "一个具体、可区分的标志；触发即承诺进入专注。座位是 CTDP 的入口节点。",
    anchor: "sacred_seat",
  },
  aux_chain: {
    title: "辅助链",
    excerpt: "通过预约在时延窗口内触发座位；逾期则辅助链断裂。",
    anchor: "aux_chain",
  },
  appointment: {
    title: "预约",
    excerpt: "在辅助链上设定信号与截止时间；须在 deadline 前触发神圣座位。",
    anchor: "appointment",
  },
  precedent: {
    title: "下必为例",
    excerpt: "首次裁决将永久约束同类行为：要么断裂链，要么永久允许。",
    anchor: "precedent",
  },
  focus_session: {
    title: "专注会话",
    excerpt: "触发座位后进入的计时状态；可标准、侦查或违规裁决。",
    anchor: "focus_session",
  },
  policy: {
    title: "国策",
    excerpt: "对稳态的干预定式；分被动、半被动、主动三类。",
    anchor: "policy",
  },
  policy_tree: {
    title: "国策树",
    excerpt: "堆栈式演化：子节点失败时回滚熄灭父节点子树，保留更稳定的根。",
    anchor: "policy_tree",
  },
  compartment_freeze: {
    title: "水密隔舱",
    excerpt: "在特定时段冻结部分国策节点，避免连锁失败。",
    anchor: "compartment_freeze",
  },
};
