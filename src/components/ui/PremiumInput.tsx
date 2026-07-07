"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { InputHTMLAttributes, forwardRef, useState } from "react"

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ className, label, error, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(false)

    return (
      <div className="relative w-full">
        <motion.div
          className="relative"
          animate={{ scale: isFocused ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full px-4 py-3 rounded-xl",
              "glass-strong",
              "text-foreground placeholder:text-muted-foreground",
              "border-2 border-transparent",
              "focus:border-primary focus:outline-none",
              "transition-all-smooth",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-destructive focus:border-destructive",
              label && "pt-6 pb-2",
              className
            )}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            onChange={(e) => {
              setHasValue(e.target.value.length > 0)
              props.onChange?.(e)
            }}
            {...props}
          />
          
          {label && (
            <motion.label
              className={cn(
                "absolute left-4 pointer-events-none transition-all-smooth",
                "text-muted-foreground",
                (isFocused || hasValue)
                  ? "top-2 text-xs font-medium text-primary"
                  : "top-1/2 -translate-y-1/2 text-base"
              )}
              animate={{
                scale: isFocused || hasValue ? 0.85 : 1,
              }}
            >
              {label}
            </motion.label>
          )}
          
          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                boxShadow: "0 0 0 3px rgba(var(--primary), 0.1)"
              }}
            />
          )}
        </motion.div>
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

PremiumInput.displayName = "PremiumInput"

export { PremiumInput }
