const panels = [
  {
    id: "ctdp",
    kicker: "Chained Time-Delay Protocol",
    title: "CTDP",
    body: "神圣座位、链式时延与任务节点森林，破解启动困难与破窗效应。",
  },
  {
    id: "precedent",
    kicker: "Precedent Law",
    title: "下必为例",
    body: "违规时仅二选一：断裂清零，或永久允许并写入判例库。",
  },
  {
    id: "rsip",
    kicker: "Recursive Stabilization",
    title: "RSIP",
    body: "国策树堆栈演化，以最小定式撬动宏观稳态，习惯进度在崩塌后仍保留。",
  },
];

function MechanicsPanelContent({
  panel,
  index,
}: {
  panel: (typeof panels)[number];
  index: number;
}) {
  return (
    <>
      <p className="text-kicker mb-3 md:mb-4">{panel.kicker}</p>
      <h3 className="text-headline-zh text-2xl md:text-4xl">{panel.title}</h3>
      <p className="mt-4 md:mt-6 max-w-xl text-editorial-body text-base md:text-lg leading-relaxed">
        {panel.body}
      </p>
      <p className="mt-8 md:mt-12 font-mono text-xs tracking-[0.3em] text-ink-faint">
        {String(index + 1).padStart(2, "0")} / {String(panels.length).padStart(2, "0")}
      </p>
    </>
  );
}

export function MechanicsScroll() {
  return (
    <section className="hairline-t">
      <div className="marketing-shell py-6 md:py-8">
        <p className="section-marker">Core Mechanics</p>
      </div>

      <div className="js-mechanics-pin mechanics-scroll-wrap">
        <div className="mechanics-track js-mechanics-track">
          {panels.map((panel, index) => (
            <article key={panel.id} className="mechanics-panel">
              <div className="mechanics-panel__inner">
                <MechanicsPanelContent panel={panel} index={index} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
