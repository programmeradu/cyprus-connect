"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import {
  DashboardIcon,
  CalculatorIcon,
  TrophyIcon,
  ChartIcon,
  BulbIcon,
  SettingsIcon,
  MenuIcon,
  CloseIcon,
  LeafIcon
} from "@/components/icons/CustomIcons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Lightbulb, Plug, Wand2, GraduationCap } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useUser } from "@/lib/user-context";

// Custom Marketplace Icon
const MarketplaceIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="1" />
    <path d="M9 9 L9 15 M15 9 L15 15 M9 12 L15 12" strokeWidth="1" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3" strokeWidth="1" opacity="0.3" />
  </svg>
);

// Custom Compliance Icon
const ComplianceIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <path d="M12 2 L20 6 L20 12 C20 16, 16 20, 12 22 C8 20, 4 16, 4 12 L4 6 Z" strokeWidth="1" strokeLinejoin="round" />
    <path d="M9 12 L11 14 L15 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const navItems = [
  { href: "/app", label: "Dashboard", icon: DashboardIcon },
  { href: "/app/calculator", label: "Calculator", icon: CalculatorIcon },
  { href: "/app/actions", label: "Green Actions", icon: BulbIcon },
  { href: "/app/marketplace", label: "Carbon Offsets", icon: MarketplaceIcon },
  { href: "/app/compliance", label: "Compliance", icon: ComplianceIcon, badge: true },
  { href: "/app/learn", label: "Learning Center", icon: GraduationCap },
  { href: "/app/studio", label: "Media Studio", icon: Wand2 },
  { href: "/app/leaderboard", label: "Leaderboard", icon: TrophyIcon },
  { href: "/app/analytics", label: "Analytics", icon: ChartIcon },
  { href: "/app/insights", label: "Insights", icon: Lightbulb },
  { href: "/app/integrations", label: "Integrations", icon: Plug },
  { href: "/app/settings", label: "Settings", icon: SettingsIcon }
];

export const Sidebar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const { user, isLoading: isUserLoading } = useUser();
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [urgentItems, setUrgentItems] = useState(0);

  // Get display name and initials
  const displayName = user?.name || session?.user?.name || "User";
  const displayEmail = user?.email || session?.user?.email || "";
  const initials = displayName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // Fetch compliance data
  useEffect(() => {
    if (session?.user) {
      fetchComplianceData();
    }
  }, [session]);

  const fetchComplianceData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/compliance/check-requirements", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setComplianceScore(data.score || 85);
        const urgent = data.regulations?.filter((r: any) => r.status === "action_required").length || 0;
        setUrgentItems(urgent);
      } else {
        // Default values
        setComplianceScore(85);
        setUrgentItems(1);
      }
    } catch (error) {
      // Default values on error
      setComplianceScore(85);
      setUrgentItems(1);
    }
  };

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="p-4 border-b border-border/50">
        <Link href="/app" className="flex items-center gap-2 group">
          <h1 className="text-base font-bold gradient-text">VerdeIQ</h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const showBadge = item.badge && complianceScore !== null;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block"
            >
              <motion.div
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                
                {/* Compliance Badge */}
                {showBadge && (
                  <div className="flex items-center gap-1">
                    {urgentItems > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                    )}
                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      complianceScore >= 80 ? 'text-primary' : 
                      complianceScore >= 60 ? 'text-yellow-500' : 
                      'text-destructive'
                    }`}>
                      {complianceScore}%
                    </div>
                  </div>
                )}
                
                {isActive && !showBadge && (
                  <motion.div
                    className="absolute right-2 w-1 h-1 rounded-full bg-primary"
                    layoutId="activeIndicator"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 space-y-3">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Appearance</span>
          <ThemeToggle />
        </div>
        
        {/* User Info */}
        <Link href="/app/settings" className="block">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all-smooth cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              {isUserLoading ? (
                <div className="space-y-1">
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <p className="text-xs font-medium truncate">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{displayEmail}</p>
                </>
              )}
            </div>
          </div>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-9 h-9 rounded-lg bg-card border border-border/50 flex items-center justify-center text-foreground"
      >
        {mobileOpen ? <CloseIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-56 glass-strong border-r border-border/50 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.aside
              className="fixed left-0 top-0 h-screen w-64 glass-strong border-r border-border/50 z-50 lg:hidden flex flex-col"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};