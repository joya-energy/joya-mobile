import {
  AlertOctagon,
  AlertTriangle,
  FileText,
  FolderOpen,
  Info,
  Leaf,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { InboxNotification } from "@/types/notifications";

export type NotificationCategoryKey =
  | "alert"
  | "warning"
  | "report"
  | "maintenance"
  | "efficiency"
  | "file"
  | "info";

export type NotificationCategory = {
  key: NotificationCategoryKey;
  label: string;
  icon: LucideIcon;
  /** Icon tile classes (soft background + strong foreground). */
  tile: string;
  /** Left accent for unread rows. */
  accent: string;
};

const CATEGORIES: Record<NotificationCategoryKey, NotificationCategory> = {
  alert: {
    key: "alert",
    label: "Alerte",
    icon: AlertOctagon,
    tile: "bg-danger-soft text-danger",
    accent: "bg-danger",
  },
  warning: {
    key: "warning",
    label: "Attention",
    icon: AlertTriangle,
    tile: "bg-warning-soft text-warning",
    accent: "bg-warning",
  },
  report: {
    key: "report",
    label: "Rapport",
    icon: FileText,
    tile: "bg-blue-tint text-blue",
    accent: "bg-blue",
  },
  maintenance: {
    key: "maintenance",
    label: "Maintenance",
    icon: Wrench,
    tile: "bg-navy/[0.07] text-navy",
    accent: "bg-navy",
  },
  efficiency: {
    key: "efficiency",
    label: "Efficacité",
    icon: Leaf,
    tile: "bg-success-soft text-success",
    accent: "bg-success",
  },
  file: {
    key: "file",
    label: "Dossier",
    icon: FolderOpen,
    tile: "bg-coral-soft text-coral",
    accent: "bg-coral",
  },
  info: {
    key: "info",
    label: "Information",
    icon: Info,
    tile: "bg-blue-tint text-blue",
    accent: "bg-blue",
  },
};

/**
 * Visual category of a notification — derived from its severity and `type`
 * (presentation only; does not change routing or business rules).
 */
export function notificationCategory(
  item: Pick<InboxNotification, "severity" | "type">,
): NotificationCategory {
  if (item.severity === "error") return CATEGORIES.alert;
  if (item.severity === "warning") return CATEGORIES.warning;
  const type = (item.type ?? "").toLowerCase();
  if (type.includes("report") || type.includes("rapport")) return CATEGORIES.report;
  if (type.includes("maintenance") || type.includes("intervention")) return CATEGORIES.maintenance;
  if (type.startsWith("efficiency")) return CATEGORIES.efficiency;
  if (type.includes("onboarding") || type.includes("document") || type.includes("file")) {
    return CATEGORIES.file;
  }
  return CATEGORIES.info;
}
