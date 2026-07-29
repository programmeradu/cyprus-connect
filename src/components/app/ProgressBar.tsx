"use client";

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
            <span className="app-label break-words">{label}</span>
          )}
          {showValue && (
            <span className="app-num app-meta shrink-0">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className={`relative w-full ${sizeClasses[size]} rounded-[2px] bg-[var(--app-surface-2)] overflow-hidden border border-[var(--app-rule)]`}>
        <div
          className={`absolute inset-y-0 left-0 rounded-[2px] ${colorClasses[color]} transition-[width] duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
