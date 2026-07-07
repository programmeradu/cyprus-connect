import { motion } from "framer-motion";

interface IconProps {
  className?: string;
}

// Emission Entry Icon - Chart with leaf
export const EmissionEntryIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <defs>
      <linearGradient id="emission-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.60 0.16 165)" />
        <stop offset="100%" stopColor="oklch(0.50 0.14 145)" />
      </linearGradient>
    </defs>
    {/* Bar chart bars */}
    <motion.rect
      x="4"
      y="14"
      width="3"
      height="6"
      rx="1"
      fill="url(#emission-grad)"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.3 }}
      style={{ transformOrigin: "bottom" }}
    />
    <motion.rect
      x="9"
      y="10"
      width="3"
      height="10"
      rx="1"
      fill="url(#emission-grad)"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{ transformOrigin: "bottom" }}
    />
    <motion.rect
      x="14"
      y="8"
      width="3"
      height="12"
      rx="1"
      fill="url(#emission-grad)"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      style={{ transformOrigin: "bottom" }}
    />
    {/* Small leaf overlay */}
    <motion.path
      d="M18 6c0 2-1.5 3.5-3 3.5s-3-1.5-3-3.5c0-1 1-2 3-3 2 1 3 2 3 3z"
      fill="url(#emission-grad)"
      opacity="0.8"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.4, type: "spring" }}
    />
  </svg>
);

// Goal Achievement Icon - Target with checkmark
export const GoalAchievementIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <defs>
      <linearGradient id="goal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.60 0.16 165)" />
        <stop offset="100%" stopColor="oklch(0.50 0.14 145)" />
      </linearGradient>
    </defs>
    {/* Outer circle */}
    <motion.circle
      cx="12"
      cy="12"
      r="9"
      stroke="url(#goal-grad)"
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
    {/* Middle circle */}
    <motion.circle
      cx="12"
      cy="12"
      r="6"
      stroke="url(#goal-grad)"
      strokeWidth="1.5"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.7 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    />
    {/* Center with checkmark */}
    <motion.circle
      cx="12"
      cy="12"
      r="4"
      fill="url(#goal-grad)"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.4, type: "spring" }}
    />
    <motion.path
      d="M10 12l1.5 1.5 3-3"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.6 }}
    />
  </svg>
);

// Leaderboard Change Icon - Trophy
export const LeaderboardChangeIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <defs>
      <linearGradient id="trophy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.60 0.16 165)" />
        <stop offset="100%" stopColor="oklch(0.50 0.14 145)" />
      </linearGradient>
    </defs>
    {/* Trophy cup */}
    <motion.path
      d="M8 4h8v6c0 2.2-1.8 4-4 4s-4-1.8-4-4V4z"
      fill="url(#trophy-grad)"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.4 }}
      style={{ transformOrigin: "center" }}
    />
    {/* Trophy handles */}
    <motion.path
      d="M7 6H5c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h2"
      stroke="url(#trophy-grad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    />
    <motion.path
      d="M17 6h2c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-2"
      stroke="url(#trophy-grad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    />
    {/* Trophy base */}
    <motion.path
      d="M10 14v3M14 14v3M9 20h6"
      stroke="url(#trophy-grad)"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    />
    {/* Star on trophy */}
    <motion.path
      d="M12 5l.5 1.5h1.5l-1 1 .5 1.5-1.5-1-1.5 1 .5-1.5-1-1h1.5z"
      fill="white"
      opacity="0.9"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.7, type: "spring" }}
    />
  </svg>
);

// Action Completed Icon - Checkmark with circle
export const ActionCompletedIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <defs>
      <linearGradient id="check-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.60 0.16 165)" />
        <stop offset="100%" stopColor="oklch(0.50 0.14 145)" />
      </linearGradient>
    </defs>
    {/* Circle background */}
    <motion.circle
      cx="12"
      cy="12"
      r="10"
      fill="url(#check-grad)"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    />
    {/* Checkmark */}
    <motion.path
      d="M8 12.5l2.5 2.5 5.5-5.5"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    />
  </svg>
);

// Insight Available Icon - Lightbulb with sparkle
export const InsightAvailableIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <defs>
      <linearGradient id="insight-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.60 0.16 165)" />
        <stop offset="100%" stopColor="oklch(0.50 0.14 145)" />
      </linearGradient>
    </defs>
    {/* Bulb */}
    <motion.path
      d="M9 18h6M10 21h4M12 3c-2.8 0-5 2.2-5 5 0 2.3 1.6 4.2 3.7 4.8.3.1.3.2.3.5V15h2v-1.7c0-.3 0-.4.3-.5C15.4 12.2 17 10.3 17 8c0-2.8-2.2-5-5-5z"
      stroke="url(#insight-grad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6 }}
    />
    {/* Filament */}
    <motion.path
      d="M12 8v3"
      stroke="url(#insight-grad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    />
    {/* Sparkles */}
    {[
      { d: "M6 6l.5 1-.5 1-.5-1z", delay: 0.6 },
      { d: "M18 6l.5 1-.5 1-.5-1z", delay: 0.7 },
      { d: "M19 12l.5 1-.5 1-.5-1z", delay: 0.8 }
    ].map((sparkle, i) => (
      <motion.path
        key={i}
        d={sparkle.d}
        fill="url(#insight-grad)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: sparkle.delay, type: "spring" }}
      />
    ))}
  </svg>
);

// Compliance Alert Icon - Shield with exclamation
export const ComplianceAlertIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <defs>
      <linearGradient id="compliance-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.60 0.16 165)" />
        <stop offset="100%" stopColor="oklch(0.50 0.14 145)" />
      </linearGradient>
    </defs>
    {/* Shield outline */}
    <motion.path
      d="M12 3L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-3z"
      stroke="url(#compliance-grad)"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6 }}
    />
    {/* Shield fill */}
    <motion.path
      d="M12 3L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-3z"
      fill="url(#compliance-grad)"
      opacity="0.15"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, type: "spring" }}
    />
    {/* Exclamation mark */}
    <motion.path
      d="M12 8v4M12 15h.01"
      stroke="url(#compliance-grad)"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    />
  </svg>
);

// System Alert Icon - Bell with wave
export const SystemAlertIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <defs>
      <linearGradient id="system-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.60 0.16 165)" />
        <stop offset="100%" stopColor="oklch(0.50 0.14 145)" />
      </linearGradient>
    </defs>
    {/* Bell body */}
    <motion.path
      d="M18 8c0-3.3-2.7-6-6-6S6 4.7 6 8c0 3.8-1.5 5-2 6h16c-.5-1-2-2.2-2-6z"
      stroke="url(#system-grad)"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5 }}
    />
    {/* Bell clapper */}
    <motion.path
      d="M13.7 19c-.2.6-.8 1-1.7 1s-1.5-.4-1.7-1"
      stroke="url(#system-grad)"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    />
    {/* Ring waves */}
    {[
      { d: "M8 2c-.8.8-1.3 2-1.3 3.2", delay: 0.5, opacity: 0.7 },
      { d: "M16 2c.8.8 1.3 2 1.3 3.2", delay: 0.6, opacity: 0.7 },
      { d: "M5 4c-1 1-1.5 2.5-1.5 4", delay: 0.7, opacity: 0.5 }
    ].map((wave, i) => (
      <motion.path
        key={i}
        d={wave.d}
        stroke="url(#system-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity={wave.opacity}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: wave.delay }}
      />
    ))}
  </svg>
);

// Default Notification Icon - Megaphone
export const DefaultNotificationIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <defs>
      <linearGradient id="default-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.60 0.16 165)" />
        <stop offset="100%" stopColor="oklch(0.50 0.14 145)" />
      </linearGradient>
    </defs>
    {/* Megaphone cone */}
    <motion.path
      d="M3 11c0-1.1.9-2 2-2h3l6-4v14l-6-4H5c-1.1 0-2-.9-2-2z"
      fill="url(#default-grad)"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    />
    {/* Megaphone handle */}
    <motion.path
      d="M8 15v3c0 1.1.9 2 2 2h1"
      stroke="url(#default-grad)"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    />
    {/* Sound waves */}
    {[
      { d: "M17 8c1.1.9 2 2.3 2 4s-.9 3.1-2 4", delay: 0.4 },
      { d: "M20 6c1.9 1.5 3 3.8 3 6s-1.1 4.5-3 6", delay: 0.5, opacity: 0.6 }
    ].map((wave, i) => (
      <motion.path
        key={i}
        d={wave.d}
        stroke="url(#default-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={wave.opacity || 1}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: wave.delay }}
      />
    ))}
  </svg>
);
