import { getDb } from "../src/lib/db";

const templates = [
  {
    slug: "first-strike",
    title: "先发制人",
    type: "passive",
    constraintJson: JSON.stringify({
      forbid: "限制组 App",
      context: "起床后30分钟内",
    }),
    interventionNode: "起床后30分钟内",
    steadyStateTarget: "一日基调下滑",
    difficulty: 2,
    maintenanceCost: 2,
    description: "起床后30分钟内不得使用娱乐类 App",
  },
  {
    slug: "watertight-compartment",
    title: "水密隔舱",
    type: "passive",
    constraintJson: JSON.stringify({ mechanism: "freeze_on_force_majeure" }),
    interventionNode: "不可抗力事件",
    steadyStateTarget: "国策树全面崩塌",
    difficulty: 1,
    maintenanceCost: 1,
    description: "意外时可冻结国策结算",
  },
  {
    slug: "win-big",
    title: "赢麻了",
    type: "active",
    interventionNode: "每晚复盘",
    steadyStateTarget: "情绪低落",
    difficulty: 2,
    maintenanceCost: 2,
    description: "用当日最大喜报命名一天",
  },
  {
    slug: "night-fall",
    title: "夜幕降临",
    type: "passive",
    constraintJson: JSON.stringify({ auto: "grayscale_23_00" }),
    steadyStateTarget: "熬夜刷手机",
    difficulty: 1,
    maintenanceCost: 1,
  },
  {
    slug: "prep-ritual",
    title: "预备仪式",
    type: "semi_passive",
    triggerJson: JSON.stringify({ after: "23:00", action: "stand_only_phone" }),
    steadyStateTarget: "熬夜刷手机",
    difficulty: 2,
    maintenanceCost: 2,
  },
  {
    slug: "trap-avoid",
    title: "陷阱规避",
    type: "passive",
    constraintJson: JSON.stringify({ forbid: "手机", context: "沙发" }),
    interventionNode: "不带手机上沙发",
    steadyStateTarget: "沙发放纵",
    difficulty: 2,
    maintenanceCost: 2,
  },
  {
    slug: "wash-dishes",
    title: "饭后洗碗",
    type: "semi_passive",
    triggerJson: JSON.stringify({ event: "after_meal_at_home" }),
    interventionNode: "吃完饭后",
    steadyStateTarget: "居家颓废",
    difficulty: 1,
    maintenanceCost: 1,
  },
  {
    slug: "return-shower",
    title: "神清气爽",
    type: "semi_passive",
    triggerJson: JSON.stringify({ event: "return_home", minutes: 15 }),
    interventionNode: "回家进门",
    steadyStateTarget: "洗澡拖延",
    difficulty: 2,
    maintenanceCost: 2,
  },
  {
    slug: "sleep-reserve",
    title: "作息储备计划",
    type: "semi_passive",
    triggerJson: JSON.stringify({ wake: "08:30" }),
    isUpgradeable: true,
    difficulty: 3,
    maintenanceCost: 3,
  },
];

async function main() {
  const prisma = await getDb();
  for (const t of templates) {
    await prisma.policyTemplate.upsert({
      where: { slug: t.slug },
      create: t,
      update: t,
    });
  }
  console.log("Seeded policy templates:", templates.length);
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
