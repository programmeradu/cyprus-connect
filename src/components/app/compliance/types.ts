export interface Regulation {
  id: number;
  regulationId: string;
  name: string;
  jurisdiction: string;
  status: "compliant" | "action_required" | "upcoming";
  nextDeadline: string;
  description: string;
  requirements: string[];
}

export interface ComplianceDocument {
  id: number;
  title: string;
  framework: string;
  status: "draft" | "ready" | "submitted";
  generatedAt: string;
  dueDate: string;
  content?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  details: string;
  createdBy: string;
  createdAt: string;
}

export interface Settings {
  jurisdictions: string[];
  autoSubmit: boolean;
  emailNotifications: boolean;
}

export const DEFAULT_JURISDICTIONS = ["Cyprus", "European Union", "Global"];

/** Whole days from now to a date; negative when past. */
export function daysUntil(date: string, now = Date.now()): number {
  return Math.floor((new Date(date).getTime() - now) / 86_400_000);
}
