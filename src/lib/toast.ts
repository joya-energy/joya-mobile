import { Alert } from "react-native";

/**
 * Drop-in stand-in for sonner `toast` used across copied customer-web files.
 * Replace with sonner-native once peer deps settle.
 */
type ToastOpts = { description?: string; duration?: number };

function show(title: string, message: string, opts?: ToastOpts) {
  const body = opts?.description
    ? `${message}\n${opts.description}`
    : message;
  Alert.alert(title, body);
}

export const toast = {
  success(message: string, opts?: ToastOpts) {
    show("", message, opts);
  },
  error(message: string, opts?: ToastOpts) {
    show("Erreur", message, opts);
  },
  info(message: string, opts?: ToastOpts) {
    show("", message, opts);
  },
  warning(message: string, opts?: ToastOpts) {
    show("Attention", message, opts);
  },
  message(message: string, opts?: ToastOpts) {
    show("", message, opts);
  },
};
