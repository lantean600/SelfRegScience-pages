import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MarketingHome } from "@/components/marketing/MarketingHome";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return <MarketingHome />;
}
