"use client";

import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Workspace tag. Rectangular, bordered, 4px radius — never a rounded-full pill.
 * Tone is carried by the border and the text colour, not by a filled wash.
 */
export const Badge = ({
  children,
  variant = "primary",
  size = "md",
  className = ""
}: BadgeProps) => {
  const tone: Record<string, string | undefined> = {
    primary: "positive",
    success: "positive",
    warning: "caution",
    danger: "critical",
    secondary: undefined,
    outline: undefined
  };

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-[0.8125rem] px-2.5 py-1"
  };

  return (
    <span
      className={`app-tag ${sizeClasses[size]} ${className}`}
      data-tone={tone[variant]}
    >
      {children}
    </span>
  );
};
