import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

export type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "hidden";

/** Joya toast accents — white card + semantic left rule (see ui/sonner.tsx). */
const toastAccent = (rule: string) => ({
  toast: `border-l-4 ${rule}`,
  title: "font-semibold text-navy",
  description: "text-ink-muted",
  closeButton: "text-slate-500 hover:text-navy",
});

const TOAST_CLASSNAMES = {
  success: toastAccent("border-l-success"),
  error: toastAccent("border-l-danger"),
  warning: toastAccent("border-l-warning"),
  info: toastAccent("border-l-blue"),
};

export interface NotificationOptions {
  /** Notification message */
  message: string;
  /** Optional title/status */
  title?: string;
  /** Duration in milliseconds. Set to Infinity to keep forever */
  duration?: number;
  /** Custom action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Show a success notification
 */
export const notifySuccess = (options: NotificationOptions | string) => {
  const opts = typeof options === "string" ? { message: options } : options;

  return toast.success(opts.title || "Succès", {
    description: opts.message,
    duration: opts.duration ?? 4000,
    icon: <CheckCircle2 className="h-5 w-5 text-success" />,
    classNames: TOAST_CLASSNAMES.success,
    action: opts.action,
  });
};

/**
 * Show an error notification
 */
export const notifyError = (options: NotificationOptions | string) => {
  const opts = typeof options === "string" ? { message: options } : options;

  return toast.error(opts.title || "Erreur", {
    description: opts.message,
    duration: opts.duration ?? 5000,
    icon: <XCircle className="h-5 w-5 text-danger" />,
    classNames: TOAST_CLASSNAMES.error,
    action: opts.action,
  });
};

/**
 * Show a warning notification
 */
export const notifyWarning = (options: NotificationOptions | string) => {
  const opts = typeof options === "string" ? { message: options } : options;

  return toast.warning(opts.title || "Attention", {
    description: opts.message,
    duration: opts.duration ?? 4000,
    icon: <AlertTriangle className="h-5 w-5 text-warning" />,
    classNames: TOAST_CLASSNAMES.warning,
    action: opts.action,
  });
};

/**
 * Show an info notification
 */
export const notifyInfo = (options: NotificationOptions | string) => {
  const opts = typeof options === "string" ? { message: options } : options;

  return toast.info(opts.title || "Information", {
    description: opts.message,
    duration: opts.duration ?? 4000,
    icon: <Info className="h-5 w-5 text-blue" />,
    classNames: TOAST_CLASSNAMES.info,
    action: opts.action,
  });
};

/**
 * Generic notification function
 */
export const notify = (
  type: NotificationType,
  options: NotificationOptions | string,
) => {
  switch (type) {
    case "success":
      return notifySuccess(options);
    case "error":
      return notifyError(options);
    case "warning":
      return notifyWarning(options);
    case "info":
      return notifyInfo(options);
    case "hidden":
      return null;
    default:
      return notifyInfo(options);
  }
};

/**
 * Show a notification from API response
 * Automatically determines type based on response status
 */
export const notifyFromResponse = (
  response: { status?: number; data?: { message?: string } },
  options?: { successMessage?: string; errorMessage?: string },
) => {
  const status = response.status;
  const message =
    response.data?.message ||
    options?.errorMessage ||
    "Une erreur est survenue";

  if (status && status >= 200 && status < 300) {
    notifySuccess({
      message: options?.successMessage || message || "Opération réussie",
    });
  } else if (status && status >= 400 && status < 500) {
    notifyError({
      message,
    });
  } else if (status && status >= 500) {
    notifyError({
      message: "Erreur serveur. Veuillez réessayer plus tard.",
    });
  } else {
    notifyError({
      message,
    });
  }
};

/**
 * Show a notification from an error object
 */
export const notifyFromError = (error: unknown, defaultMessage?: string) => {
  const errorMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ||
    (error as { message?: string })?.message ||
    defaultMessage ||
    "Une erreur inattendue est survenue";

  notifyError({
    message: errorMessage,
  });
};
