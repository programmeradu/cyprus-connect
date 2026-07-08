import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { TrustPageView, trustMetadataFor } from "@/components/trust/TrustPageView";

type Params = Promise<{ locale: string }>;

const PAGE = "dpa" as const;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const safe = (routing.locales.includes(locale as Locale) ? locale : routing.defaultLocale) as Locale;
  return trustMetadataFor(safe, PAGE);
}

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  return <TrustPageView locale={locale as Locale} page={PAGE} />;
}
