"use client";

import { ReactNode } from "react";
import { PageHeader } from "@/components/app/shell/PageHeader";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Compatibility wrapper. The workspace header is now `PageHeader` from
 * `@/components/app/shell`; the account menu moved to the sidebar footer.
 * New pages should import PageHeader directly.
 */
export const AppHeader = ({ title, subtitle, actions }: AppHeaderProps) => (
  <PageHeader title={title} purpose={subtitle} actions={actions} />
);
