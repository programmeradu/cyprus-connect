"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { CheckIcon } from "@/components/icons/CustomIcons";

interface ActionCardProps {
  title: string;
  description: string;
  impact?: string;
  icon?: ReactNode;
  completed?: boolean;
  onComplete?: () => void;
  difficulty?: "low" | "medium" | "high";
  points?: number;
  className?: string;
}

export const ActionCard = ({
  title,
  description,
  impact,
  icon,
  completed = false,
  onComplete,
  difficulty = "medium",
  points,
  className = ""
}: ActionCardProps) => {
  const impactLevelColors = {
    low: "bg-primary/20 text-primary border-primary/30",
    medium: "bg-amber-500/20 text-amber-600 dark:text-amber-500 border-amber-500/30",
    high: "bg-red-500/20 text-red-600 dark:text-red-500 border-red-500/30"
  };

  return (
    <motion.div
      className={`relative glass-strong rounded-xl p-4 overflow-hidden border border-border/50 hover:border-primary/30 transition-all-smooth ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Title */}
        <h4 className="text-sm font-bold mb-2 leading-tight">{title}</h4>

        {/* Description */}
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{description}</p>

        {/* Impact Metric */}
        {impact && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20" strokeLinecap="round" />
                <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5" />
              </svg>
            </div>
            <span className="text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">{impact}</span>
            </span>
          </div>
        )}

        {/* Impact Level Badge */}
        <div className="mb-3">
          <span className={`inline-flex items-center text-[9px] uppercase px-2 py-0.5 rounded-md font-bold tracking-wider border ${impactLevelColors[difficulty]}`}>
            {difficulty} Impact
          </span>
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Action Button */}
        {onComplete && (
          <button
            onClick={onComplete}
            disabled={completed}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all-smooth ${
              completed
                ? "bg-primary/20 text-primary cursor-not-allowed border border-primary/30"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {completed ? (
                <>
                  <CheckIcon className="w-3 h-3" />
                  Completed
                </>
              ) : (
                "Mark Complete"
              )}
            </span>
          </button>
        )}
      </div>
    </motion.div>
  );
};