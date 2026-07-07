import { db } from "@/db";
import { notifications, notificationPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

type NotificationType = 
  | "emission_entry"
  | "goal_achievement"
  | "leaderboard_change"
  | "action_completed"
  | "insight_available"
  | "compliance_alert"
  | "system_alert";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Check if user has enabled notifications for a specific type
 */
async function isNotificationEnabled(userId: string, type: NotificationType): Promise<boolean> {
  try {
    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (prefs.length === 0) {
      // Default preferences if not set
      const defaults: Record<string, boolean> = {
        emission_entry: true,
        goal_achievement: true,
        leaderboard_change: false,
        action_completed: true,
        insight_available: true,
        compliance_alert: true,
        system_alert: true,
      };
      return defaults[type] ?? true;
    }

    const pref = prefs[0];
    const prefMap: Record<NotificationType, boolean> = {
      emission_entry: pref.emissionAlerts,
      goal_achievement: pref.goalAlerts,
      leaderboard_change: pref.leaderboardAlerts,
      action_completed: pref.actionAlerts,
      insight_available: pref.insightAlerts,
      compliance_alert: pref.complianceAlerts,
      system_alert: pref.systemAlerts,
    };

    return prefMap[type] ?? true;
  } catch (error) {
    console.error("Failed to check notification preferences:", error);
    return true; // Default to enabled if check fails
  }
}

/**
 * Create a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const { userId, type, title, message, link, metadata } = params;

    // Check if user has this notification type enabled
    const isEnabled = await isNotificationEnabled(userId, type);
    if (!isEnabled) {
      console.log(`Notification type ${type} disabled for user ${userId}`);
      return;
    }

    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      link: link || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    console.log(`Notification created: ${type} for user ${userId}`);
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Don't throw error - notifications are non-critical
  }
}

/**
 * Notification templates for common actions
 */
export const NotificationTemplates = {
  emissionEntry: (data: { month: string; year: number; totalCo2e: number; link: string }) => ({
    type: "emission_entry" as const,
    title: "New Emissions Data Recorded",
    message: `Emissions for ${data.month} ${data.year}: ${data.totalCo2e.toFixed(1)} tons CO2e`,
    link: data.link,
    metadata: { month: data.month, year: data.year, totalCo2e: data.totalCo2e },
  }),

  goalAchievement: (data: { goalName: string; progress: number; link: string }) => ({
    type: "goal_achievement" as const,
    title: "🎯 Goal Milestone Reached!",
    message: `You've achieved ${data.progress}% of your ${data.goalName} goal`,
    link: data.link,
    metadata: { goalName: data.goalName, progress: data.progress },
  }),

  leaderboardChange: (data: { oldRank: number; newRank: number; link: string }) => ({
    type: "leaderboard_change" as const,
    title: data.newRank < data.oldRank ? "🏆 Leaderboard Rank Improved!" : "Leaderboard Rank Changed",
    message: `Your rank changed from #${data.oldRank} to #${data.newRank}`,
    link: data.link,
    metadata: { oldRank: data.oldRank, newRank: data.newRank },
  }),

  actionCompleted: (data: { actionTitle: string; points: number; link: string }) => ({
    type: "action_completed" as const,
    title: "✅ Green Action Completed!",
    message: `You completed "${data.actionTitle}" and earned ${data.points} credits`,
    link: data.link,
    metadata: { actionTitle: data.actionTitle, points: data.points },
  }),

  insightAvailable: (data: { insightType: string; link: string }) => ({
    type: "insight_available" as const,
    title: "💡 New AI Insights Available",
    message: `Fresh ${data.insightType} insights are ready for you`,
    link: data.link,
    metadata: { insightType: data.insightType },
  }),

  complianceAlert: (data: { requirement: string; deadline?: string; link: string }) => ({
    type: "compliance_alert" as const,
    title: "⚠️ Compliance Alert",
    message: data.deadline 
      ? `${data.requirement} - Due by ${data.deadline}`
      : data.requirement,
    link: data.link,
    metadata: { requirement: data.requirement, deadline: data.deadline },
  }),

  systemAlert: (data: { title: string; message: string; link?: string }) => ({
    type: "system_alert" as const,
    title: data.title,
    message: data.message,
    link: data.link || "/app",
    metadata: {},
  }),
};
