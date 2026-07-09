"use client";

import { motion } from "framer-motion";
import { UserIcon } from "@/components/icons/CustomIcons";
import { Badge } from "./Badge";

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
          
          {/* Notifications */}
          <NotificationBell />
          
          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Account menu"
              className="w-9 h-9 rounded-md border border-foreground/15 bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors overflow-hidden"
            >
              {session?.user?.image ? (
                <img src={session.user.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 glass-strong rounded-lg shadow-premium overflow-hidden z-50"
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="text-sm font-medium text-foreground break-words leading-tight">{session?.user?.name || t("defaultUser")}</p>
                  <p className="text-xs text-muted-foreground break-all leading-tight mt-0.5">{session?.user?.email}</p>
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
                    <span>{t("settings")}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t("signOut")}</span>
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