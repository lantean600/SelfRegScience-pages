# SelfRegScience — Domain Context

## CTDP 节点森林

- **任务节点（CtdpNode）**：四态 `initial` | `executing` | `success` | `failed`
- **出边**：`refTargetId` 至多一个，方向为引用者 → 被引用者
- **引用属性（refCount）**：出边数 + 下游 refCount；结构变更时重算
- **完整度**：Σ(成功节点 refCount) / Σ(全部节点 refCount)

## 执行链（嵌套在节点上）

1. **执行（arm）**：对 `initial` 节点创建预约（warning bell）
2. **触发**：deadline 内触发神圣座位 → `executing` + 专注会话
3. **完成**：专注结束 → 待判定；或 **逾期未触发** → 待判定（不经 executing）
4. **判定**：成功 | 规则修正→成功 | 彻底失败→传播
5. **放弃**：执行中主动放弃 → 直接 `failed` + 传播

## 失败传播

沿出边向下；`success`/`executing`→`failed`；`initial` 不变；入度≥2 的节点处理完后停止向下传播。

## RSIP

国策树、水密隔舱等与 CTDP 正交；半被动国策可通过 `linkPolicyToCtdpNode` 创建并 arm 节点。
