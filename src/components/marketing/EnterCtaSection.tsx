import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function EnterCtaSection() {
  return (
    <section className="js-cta py-[var(--spacing-section)] hairline-t">
      <div className="marketing-shell text-center">
        <p className="section-marker justify-center mb-8">Enter The System</p>
        <h2 className="text-headline-zh max-w-2xl mx-auto">
          从导览理解规则，再把自己放进系统
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button href="/guide" variant="secondary" size="lg">
            先看导览
          </Button>
          <Button href="/register" size="lg">
            创建账号
          </Button>
        </div>
        <p className="mt-8 text-caption">
          <Link href="/login" className="no-underline hover:underline">
            已有账号
          </Link>
        </p>
      </div>
    </section>
  );
}
