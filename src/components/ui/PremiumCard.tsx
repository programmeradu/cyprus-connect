"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

type PremiumCardProps = Omit<ComponentPropsWithoutRef<typeof motion.div>, "children"> & {
  children?: ReactNode
  variant?: "default" | "glass" | "neomorph"
  hover?: boolean
}

const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, variant = "default", hover = true, children, ...props }, ref) => {
    const variants = {
      default: "bg-card/50 backdrop-blur-sm border border-border/50",
      glass: "glass",
      neomorph: "neomorph"
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl p-6 transition-all-smooth",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

PremiumCard.displayName = "PremiumCard"

export { PremiumCard }