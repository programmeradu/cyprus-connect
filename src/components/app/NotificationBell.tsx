"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BellIcon } from "@/components/icons/CustomIcons";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Check, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  EmissionEntryIcon,
  GoalAchievementIcon,
  LeaderboardChangeIcon,
  ActionCompletedIcon,
  InsightAvailableIcon,
  ComplianceAlertIcon,
  SystemAlertIcon,
  DefaultNotificationIcon,
} from "@/components/icons/NotificationIcons";

interface Notification {
  id: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: string | null;
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell = () => {
  const t = useTranslations("shared.notifications");
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch notifications and unread count
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      fetchUnreadCount();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/notifications?userId=${session.user.id}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        `/api/notifications/unread-count?userId=${session.user.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await fetch(`/api/notifications/${notification.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
          },
          body: JSON.stringify({ isRead: true }),
        });

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Navigate to link if available
    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success(t("toasts.allRead"));
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error(t("toasts.allReadError"));
    }
  };


  const handleDeleteNotification = async (
    e: React.MouseEvent,
    notificationId: number
  ) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
      });

      if (response.ok) {
        const deletedNotification = notifications.find((n) => n.id === notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        
        toast.success(t("toasts.deleted"));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error(t("toasts.deleteError"));
    }
  };


  const getNotificationIcon = (type: string) => {
    const iconClassName = "w-5 h-5";
    
    switch (type) {
      case "emission_entry":
        return <EmissionEntryIcon className={iconClassName} />;
      case "goal_achievement":
        return <GoalAchievementIcon className={iconClassName} />;
      case "leaderboard_change":
        return <LeaderboardChangeIcon className={iconClassName} />;
      case "action_completed":
        return <ActionCompletedIcon className={iconClassName} />;
      case "insight_available":
        return <InsightAvailableIcon className={iconClassName} />;
      case "compliance_alert":
        return <ComplianceAlertIcon className={iconClassName} />;
      case "system_alert":
        return <SystemAlertIcon className={iconClassName} />;
      default:
        return <DefaultNotificationIcon className={iconClassName} />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("time.justNow");
    if (diffMins < 60) return t("time.minutes", { n: diffMins });
    if (diffHours < 24) return t("time.hours", { n: diffHours });
    if (diffDays < 7) return t("time.days", { n: diffDays });
    return date.toLocaleDateString();
  };


  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        aria-label={t("title")}
        className="relative w-9 h-9 rounded-md border border-foreground/15 bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <BellIcon className="w-4 h-4" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-[4px] bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] glass-strong rounded-lg shadow-premium overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">{t("title")}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("unread", { count: unreadCount })}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  {t("markAllRead")}
                </button>

              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 px-6 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {t("empty")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("unread", { count: 0 })}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer group relative ${
                        !notification.isRead ? "bg-primary/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] text-muted-foreground">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                            <button
                              onClick={(e) =>
                                handleDeleteNotification(e, notification.id)
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-border/50 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/app/settings#notifications");
                  }}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  {t("settings")}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};