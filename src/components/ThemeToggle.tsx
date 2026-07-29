"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

export function ThemeToggle({ overHero = false }: { overHero?: boolean }) {
  const t = useTranslations("themeToggle")
  const [theme, setTheme] = useState<"light" | "dark">("light")


  useEffect(() => {
    // Check localStorage and system preference on mount
    const stored = localStorage.getItem("theme") as "light" | "dark" | null
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const initialTheme = stored || systemPreference
    
    setTheme(initialTheme)
    document.documentElement.classList.toggle("dark", initialTheme === "dark")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-full bg-transparent hover:bg-foreground/5 text-foreground/80 hover:text-foreground flex items-center justify-center group transition-colors"
      whileTap={{ scale: 0.95 }}
      aria-label={theme === "dark" ? t("label") + " — switch to light" : t("label") + " — switch to dark"}
    >
      {/* Animated background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-md opacity-0 group-hover:opacity-100"
        animate={{
          boxShadow: theme === "dark"
            ? "0 0 20px rgba(100, 255, 180, 0.15)"
            : "0 0 20px rgba(255, 200, 80, 0.15)"
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Sun Icon */}
      <motion.svg
        className="absolute w-[18px] h-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        initial={false}
        animate={{
          scale: theme === "light" ? 1 : 0,
          rotate: theme === "light" ? 0 : 180,
          opacity: theme === "light" ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180
          const x1 = 12 + 7 * Math.cos(rad)
          const y1 = 12 + 7 * Math.sin(rad)
          const x2 = 12 + 10 * Math.cos(rad)
          const y2 = 12 + 10 * Math.sin(rad)
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )
        })}
      </motion.svg>

      {/* Moon Icon */}
      <motion.svg
        className="absolute w-[18px] h-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        initial={false}
        animate={{
          scale: theme === "dark" ? 1 : 0,
          rotate: theme === "dark" ? 0 : -180,
          opacity: theme === "dark" ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <path
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          fill="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.button>
  )
}