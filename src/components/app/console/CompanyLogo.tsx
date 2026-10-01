"use client";

/**
 * A company's real logo, looked up by its web domain. Falls back to the
 * generated avatar when there is no domain or no logo was found, so a row
 * never shows a broken image or an empty box.
 */

import { useEffect, useState } from "react";
import { ConsoleAvatar } from "./ConsoleAvatar";

export function CompanyLogo({
  name,
  domain,
  size = 28,
  className,
}: {
  name: string;
  /** Already-normalised domain, see src/lib/company-logo.ts. */
  domain: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [domain]);

  if (!domain || failed) {
    return <ConsoleAvatar seed={name || "vuneli"} size={size} styleKey="shapes" alt="" className={className} />;
  }

  const pad = Math.max(2, Math.round(size * 0.12));
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        overflow: "hidden",
        background: "var(--vc-card, var(--card))",
        boxShadow: "inset 0 0 0 1px var(--vc-rule, var(--border))",
        padding: pad,
      }}
    >
      <img
        src={`/api/logo?d=${encodeURIComponent(domain)}`}
        alt=""
        width={size - pad * 2}
        height={size - pad * 2}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
    </span>
  );
}
