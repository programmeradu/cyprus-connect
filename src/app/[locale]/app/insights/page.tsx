import { redirect } from "@/i18n/navigation";

/** Insights now lives on the Footprint page; keep old links working. */
export default async function InsightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/app/analytics", locale });
}
