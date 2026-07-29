"use client";

import { useState, useEffect, useRef } from "react";
import { BellIcon } from "@/components/icons/CustomIcons";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/app/shell";

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
    const iconClassName = "w-5 h-5 text-muted-foreground";

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
        type="button"
        onClick={handleBellClick}
        aria-label={t("title")}
        className="app-btn-ghost app-btn relative h-11 w-11 px-0"
      >
        <BellIcon className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-[4px] border border-[var(--app-rule-strong)] bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center app-num">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="app-overlay absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden z-50"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--app-rule)] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold break-words">{t("title")}</h3>
              <p className="app-meta break-words">
                {t("unread", { count: unreadCount })}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="app-btn-ghost app-btn shrink-0 h-9 px-2.5 text-xs"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-3 w-full animate-pulse rounded bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                className="border-0"
                title={t("empty")}
                description={t("unread", { count: 0 })}
              />
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-[var(--app-rule)] last:border-b-0 hover:bg-[var(--app-surface-2)] transition-colors cursor-pointer group relative ${
                      !notification.isRead ? "bg-[var(--app-surface-2)]" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium break-words">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="app-tag shrink-0">{t("unread", { count: 1 })}</span>
                          )}
                        </div>
                        <p className="app-meta mt-0.5 break-words">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <p className="app-meta">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleDeleteNotification(e, notification.id)
                            }
                            aria-label={t("toasts.deleted")}
                            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity app-btn-ghost app-btn h-8 px-2 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-[var(--app-rule)] text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/app/settings#notifications");
                }}
                className="app-btn-ghost app-btn h-9 px-2.5 text-xs w-full"
              >
                {t("settings")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
