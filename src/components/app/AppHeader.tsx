"use client";

import { motion } from "framer-motion";
import { UserIcon } from "@/components/icons/CustomIcons";
import { Badge } from "./Badge";
import { CurrencySwitcher } from "@/components/ui/CurrencySwitcher";
import { NotificationBell } from "@/components/app/NotificationBell";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { useTranslations } from "next-intl";


interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AppHeader = ({ title, subtitle, actions }: AppHeaderProps) => {
  const t = useTranslations("shared.header");
  const { data: session, refetch } = useSession();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error(t("signOutError"));
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      toast.success(t("signOutSuccess"));
      router.push("/");
    }
  };


  return (
    <motion.header
      className="mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {actions}
          
          {/* Currency Switcher */}
          <CurrencySwitcher variant="compact" />
          
          {/* Notifications */}
          <NotificationBell />
          
          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-9 h-9 rounded-lg border border-border/50 bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground transition-all-smooth hover:scale-105"
            >
              <UserIcon className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 glass-strong rounded-xl shadow-premium overflow-hidden z-50"
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="text-sm font-medium truncate">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push("/app/settings");
                    }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-accent/50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};