"use client";

import { useEffect, useState } from "react";
import { useServerMutation } from "@/hooks/use-server-mutation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Timeline, TimelineItem } from "@/components/ui/Timeline";
import { Hairline } from "@/components/ui/Hairline";

export function ReviewClient({
  logs,
  collapses,
  wins,
  precedents,
}: {
  logs: { id: string; type: string; payload: string; createdAt: string }[];
  collapses: {
    reasonTag: string;
    notes: string | null;
    createdAt: string;
    node: { policy: { title: string } };
  }[];
  wins: { date: string; dayName: string | null; winLevel: string | null }[];
  precedents: {
    scopeType: string;
    behaviorKey: string;
    description: string | null;
    allowedAt: string;
  }[];
}) {
  const { mutate } = useServerMutation();
  const [dayName, setDayName] = useState("");
  const [winLevel, setWinLevel] = useState("中赢");
  const [winList, setWinList] = useState(wins);
  useEffect(() => setWinList(wins), [wins]);

  async function saveWin() {
    if (!dayName.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const entry = { date: today, dayName: dayName.trim(), winLevel };
    setWinList((prev) => [entry, ...prev.filter((w) => w.date !== today)]);
    setDayName("");
    await mutate({
      url: "/api/daily-wins",
      init: {
        method: "POST",
        body: {
          entries: [{ text: entry.dayName, level: winLevel }],
          dayName: entry.dayName,
          winLevel,
        },
      },
    });
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-6 md:gap-8 grid-cols-1 xl:grid-cols-[0.72fr_1.28fr]" data-reveal>
        <div className="hairline-b pb-8 xl:border-b-0 xl:pb-0 xl:pr-8 xl:border-r xl:border-rule">
          <p className="section-marker mb-4">Daily Crown</p>
          <h2 className="text-headline-zh">赢麻了</h2>
          <p className="mt-4 text-editorial-body">
            给今天留下一个最值得被记住的名字。
          </p>
          <Hairline className="my-5" />
          <div className="space-y-4">
            <Field label="命名今日（最大喜报）">
              <Input
                value={dayName}
                onChange={(e) => setDayName(e.target.value)}
                placeholder="炖鸡汤大成功日"
              />
            </Field>
            <Field label="定级">
              <Select value={winLevel} onChange={(e) => setWinLevel(e.target.value)}>
                <option>小赢</option>
                <option>中赢</option>
                <option>大赢</option>
              </Select>
            </Field>
            <Button onClick={saveWin} className="w-full md:w-auto min-h-11">
              保存
            </Button>
          </div>
        </div>

        <ul className="grid gap-0 md:grid-cols-2">
          {winList.map((w) => (
            <li key={w.date} className="hairline-b py-4 px-0 md:px-4 space-y-2">
              <p className="font-data text-xs text-ink-muted">{w.date}</p>
              <p className="font-display text-2xl normal-case leading-snug text-ink">
                {w.dayName ?? "—"}
              </p>
              {w.winLevel && <Badge variant="success">{w.winLevel}</Badge>}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-2 hairline-t pt-8" data-reveal>
        <div>
          <p className="section-marker mb-4">Collapse Records</p>
          <h2 className="text-headline-zh text-2xl">崩塌记录</h2>
          {collapses.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">暂无崩塌记录</p>
          ) : (
            <Timeline className="mt-5">
              {collapses.map((c, i) => (
                <TimelineItem
                  key={i}
                  title={c.node.policy.title}
                  meta={new Date(c.createdAt).toLocaleDateString("zh-CN")}
                >
                  <Badge variant="outline">{c.reasonTag}</Badge>
                  {c.notes && <p className="mt-2">{c.notes}</p>}
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </div>

        <div>
          <p className="section-marker mb-4">Precedent Archive</p>
          <h2 className="text-headline-zh text-2xl">判例库</h2>
          <ul className="mt-5 space-y-0">
            {precedents.map((p, i) => (
              <li key={i} className="hairline-b py-4 text-sm font-data">
                <span className="text-editorial">[{p.scopeType}]</span> {p.behaviorKey}
                {p.description && (
                  <span className="mt-2 block font-sans text-ink-muted">{p.description}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="hairline-t pt-8" data-reveal>
        <p className="section-marker mb-4">Event Stream</p>
        <h2 className="text-headline-zh text-2xl">事件日志</h2>
        <Timeline className="mt-5">
          {logs.map((l) => (
            <TimelineItem
              key={l.id}
              title={l.type}
              meta={new Date(l.createdAt).toLocaleString("zh-CN")}
            />
          ))}
        </Timeline>
      </section>
    </div>
  );
}
