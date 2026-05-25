import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { GuideClient } from "@/components/guide/GuideClient";
import { PublicMasthead } from "@/components/layout/PublicMasthead";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default async function GuidePage() {
  const user = await getCurrentUser();

  if (user) {
    return (
      <AppShell>
        <PageHeader
          kicker="Chapter 00"
          title="交互式协议概览"
          description="CTDP 节点森林与 RSIP 国策树的分步演示。"
        />
        <GuideClient showHeader={false} />
      </AppShell>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <PublicMasthead />
      <div className="marketing-shell py-[var(--spacing-section)]">
        <p className="section-marker mb-6">Protocol Guide</p>
        <h1 className="text-headline-zh max-w-3xl">
          进入系统之前，先看清它如何运作
        </h1>
        <p className="mt-5 max-w-2xl text-editorial-body">
          把 CTDP 与 RSIP 的关键状态迁移直接展开给你看，而不是空泛的产品介绍。
        </p>
        <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 w-full max-w-sm sm:max-w-none">
          <Button href="/login" variant="secondary" className="w-full sm:w-auto min-h-11">
            登录
          </Button>
          <Button href="/register" className="w-full sm:w-auto min-h-11">
            创建档案
          </Button>
        </div>
        <div className="mt-12 hairline-t pt-10">
          <GuideClient showHeader={false} />
        </div>
      </div>
    </div>
  );
}
