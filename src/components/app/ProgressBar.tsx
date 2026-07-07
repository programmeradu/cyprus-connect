"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ProgressBar = ({
  value,
  max = 100,
  label,
  showValue = true,
  color = "primary",
  size = "md",
  className = ""
}: ProgressBarProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    primary: "bg-primary",
    success: "bg-chart-2",
    warning: "bg-chart-4",
    danger: "bg-destructive"
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2"
  };

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-medium text-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-xs text-muted-foreground">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className={`relative w-full ${sizeClasses[size]} rounded-full bg-muted overflow-hidden`}>
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};
