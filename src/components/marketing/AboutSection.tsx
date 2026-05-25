const lines = [
  {
    label: "01",
    text: "每个动作进入可预约、可触发、可判定的流程，而不是临时起意。",
  },
  {
    label: "02",
    text: "失败被限定在局部：节点森林与国策树让崩塌可传播、可隔离、可追责。",
  },
  {
    label: "03",
    text: "判例与习惯进度构成约束资产，赢麻了与崩塌记录都留在系统记忆里。",
  },
];

export function AboutSection() {
  return (
    <section className="js-about py-[var(--spacing-section)] hairline-t">
      <div className="marketing-shell">
        <p className="section-marker mb-8">Why This Exists</p>
        <h2 className="js-about-line text-headline-zh max-w-3xl">
          给明知该做却做不动的人一套工程化约束
        </h2>
        <p className="js-about-line mt-6 max-w-2xl text-editorial-body leading-relaxed">
          把执行力拆成状态迁移、失败传播、局部隔离与长程积累——让人不再靠当下的主观意愿苦撑。
        </p>
        <ul className="mt-12 space-y-0">
          {lines.map((line) => (
            <li
              key={line.label}
              className="js-about-line flex gap-6 py-5 hairline-b last:border-b-0"
            >
              <span className="text-kicker shrink-0 pt-1">{line.label}</span>
              <p className="text-base text-ink leading-relaxed md:text-lg">{line.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
