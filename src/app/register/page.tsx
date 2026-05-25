"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { parseAuthResponse } from "@/lib/auth-form";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await parseAuthResponse(res);
      if (!result.ok) {
        setError(result.error ?? "注册失败");
        return;
      }
      startTransition(() => {
        router.push("/dashboard");
        router.refresh();
      });
    } catch {
      setError("网络异常，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="注册" subtitle="创建你的自控协议档案">
      <form onSubmit={submit} className="space-y-1" data-reveal>
          <Field label="邮箱">
            <Input
            name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            inputMode="email"
              autoComplete="email"
            spellCheck={false}
              required
              disabled={loading}
              placeholder="name@example.com"
            />
          </Field>
          <Field label="密码" hint="创建一个你会长期使用的访问口令。">
            <Input
            name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
              disabled={loading}
              placeholder="设置访问口令"
            />
          </Field>
          {error && (
            <Alert variant="danger" className="mt-4">
              {error}
            </Alert>
          )}
          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? "注册中…" : "创建档案"}
          </Button>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-muted">
          <p>已经注册过？</p>
          <Link href="/login">返回登录</Link>
        </div>
      </form>
    </AuthShell>
  );
}
