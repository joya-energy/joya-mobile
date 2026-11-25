import type { InboxNotification } from "@/types/notifications";
import type { EfficiencyAlert } from "@/lib/consumption/energy-efficiency";
import { appStorage } from "@/platform/storage";

export const EFFICIENCY_INBOX_PREFIX = "efficiency:";

const STORAGE_KEY = "joya.efficiency-inbox.v1";

type InboxState = {
  dismissed: string[];
  read: string[];
};

function readState(): InboxState {
  try {
    const raw = appStorage.getItem(STORAGE_KEY);
    if (!raw) return { dismissed: [], read: [] };
    const parsed = JSON.parse(raw) as Partial<InboxState>;
    return {
      dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed : [],
      read: Array.isArray(parsed.read) ? parsed.read : [],
    };
  } catch {
    return { dismissed: [], read: [] };
  }
}

function writeState(state: InboxState) {
  appStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isEfficiencyInboxId(id: string): boolean {
  return id.startsWith(EFFICIENCY_INBOX_PREFIX);
}

export function efficiencyInboxId(siteId: string | null, ymd: string, alertId: string): string {
  return `${EFFICIENCY_INBOX_PREFIX}${siteId ?? "site"}:${ymd}:${alertId}`;
}

export function isEfficiencyInboxDismissed(id: string): boolean {
  return readState().dismissed.includes(id);
}

export function dismissEfficiencyInbox(id: string) {
  const state = readState();
  if (!state.dismissed.includes(id)) {
    writeState({ ...state, dismissed: [...state.dismissed, id] });
  }
}

export function dismissAllEfficiencyInbox(ids: string[]) {
  const state = readState();
  const extra = ids.filter((id) => !state.dismissed.includes(id));
  if (extra.length) {
    writeState({ ...state, dismissed: [...state.dismissed, ...extra] });
  }
}

export function markEfficiencyInboxRead(id: string) {
  const state = readState();
  if (!state.read.includes(id)) {
    writeState({ ...state, read: [...state.read, id] });
  }
}

export function markAllEfficiencyInboxRead(ids: string[]) {
  const state = readState();
  const extra = ids.filter((id) => !state.read.includes(id));
  if (extra.length) {
    writeState({ ...state, read: [...state.read, ...extra] });
  }
}

function severityFromTone(
  tone: EfficiencyAlert["tone"],
): InboxNotification["severity"] {
  if (tone === "blue") return "info";
  if (tone === "rose") return "warning";
  return "warning";
}

export function efficiencyAlertToInbox(input: {
  alert: EfficiencyAlert;
  siteId: string | null;
  ymd: string;
}): InboxNotification {
  const id = efficiencyInboxId(input.siteId, input.ymd, input.alert.id);
  const message = `${input.alert.hook} ${input.alert.detail}`.trim();
  const read = readState().read.includes(id);
  const now = new Date().toISOString();
  return {
    id,
    type: `efficiency.${input.alert.id}`,
    severity: severityFromTone(input.alert.tone),
    title: input.alert.title,
    message,
    actionUrl: "/client/consumption",
    persistence: "ephemeral",
    showOnDashboard: true,
    readAt: read ? now : null,
    createdAt: now,
    timeLabel: "Aujourd’hui",
    sourceLabel: "Efficacité",
    sourceType: "company",
  };
}
