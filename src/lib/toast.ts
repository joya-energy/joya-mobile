import { Alert } from "react-native";

/**
 * Drop-in stand-in for sonner `toast` used across copied customer-web files.
 * Replace with sonner-native once peer deps settle.
 */
export const toast = {
  success(message: string) {
    Alert.alert("", message);
  },
  error(message: string) {
    Alert.alert("Erreur", message);
  },
  info(message: string) {
    Alert.alert("", message);
  },
  message(message: string) {
    Alert.alert("", message);
  },
};
