import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

/** In-app browser first (signed storage URLs), system handler as fallback. */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url);
  }
}
