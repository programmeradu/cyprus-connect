import { redirect } from "@/i18n/navigation";

/** Funding now sits inside the Action plan, next to the steps it pays for. */
export default async function GrantAlertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/app/actions#funding", locale });
}
