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
    const baseStyles = "relative overflow-hidden font-medium transition-all-smooth rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]",
      secondary: "glass-strong text-foreground hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
      outline: "border-2 border-primary/20 text-foreground hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]",
      ghost: "text-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]"
    }
    
    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        {variant === "primary" && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.button>
    )
  }
)

PremiumButton.displayName = "PremiumButton"

export { PremiumButton }
