import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export const PremiumButton = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const base =
      "relative inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]";
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline:
        "border border-foreground/20 text-foreground hover:border-foreground/40 hover:bg-muted/50",
      ghost: "text-foreground hover:bg-muted",
    };
    const sizes = {
      sm: "px-3.5 py-2 text-sm min-h-9",
      md: "px-5 py-2.5 text-sm min-h-11",
      lg: "px-6 py-3 text-base min-h-12",
    };
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
PremiumButton.displayName = "PremiumButton";
