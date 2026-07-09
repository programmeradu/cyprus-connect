"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

type PremiumButtonProps = Omit<ComponentPropsWithoutRef<typeof motion.button>, "children"> & {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "relative font-medium transition-all-smooth rounded-md disabled:opacity-50 disabled:cursor-not-allowed"

    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]",
      secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 active:scale-[0.99]",
      outline: "border border-foreground/20 text-foreground hover:border-foreground/40 hover:bg-muted/50 active:scale-[0.99]",
      ghost: "text-foreground hover:bg-muted active:scale-[0.99]"
    }

    const sizes = {
      sm: "px-3.5 py-2 text-sm min-h-9",
      md: "px-5 py-2.5 text-sm min-h-11",
      lg: "px-6 py-3 text-base min-h-12"
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileTap={{ scale: 0.99 }}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    )
  }
)

PremiumButton.displayName = "PremiumButton"

export { PremiumButton }
