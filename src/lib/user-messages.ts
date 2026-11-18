/** Maps common API / runtime English messages to French for user-facing UI. */
const EXACT_MESSAGES: Record<string, string> = {
  "L'utilisateur existe déjà": "Un compte existe déjà avec cet email. Connectez-vous pour continuer.",
  "Un compte existe déjà avec cet email. Connectez-vous pour continuer.":
    "Un compte existe déjà avec cet email. Connectez-vous pour continuer.",
  "Une demande a déjà été enregistrée pour cet email.":
    "Une demande a déjà été enregistrée pour cet email.",
  "Une demande a déjà été acceptée pour cet email. Connectez-vous.":
    "Une demande a déjà été acceptée pour cet email. Connectez-vous.",
  "Un compte existe déjà avec ce numéro de téléphone. Connectez-vous pour continuer.":
    "Un compte existe déjà avec ce numéro de téléphone. Connectez-vous pour continuer.",
  "Upload failed.": "Échec du téléversement.",
  "Delete failed.": "Échec de la suppression.",
  "Upload confirmation failed.": "Échec de la confirmation du téléversement.",
  "File not found on server for deletion.":
    "Fichier introuvable sur le serveur pour la suppression.",
  "Network Error": "Erreur réseau. Vérifiez votre connexion.",
  "Request failed with status code 401": "Session expirée. Reconnectez-vous.",
  "Request failed with status code 403": "Accès refusé.",
  "Request failed with status code 404": "Ressource introuvable.",
  "Request failed with status code 500": "Erreur serveur. Réessayez plus tard.",
  "Company context is missing. Reload onboarding and try again.":
    "Contexte entreprise manquant. Rechargez la page d'intégration et réessayez.",
};

const PATTERN_MESSAGES: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /^Upload failed with status (\d+)/i,
    message: "Échec du téléversement (statut $1).",
  },
  {
    pattern: /^Upload limit reached \((\d+)\)\.?$/i,
    message: "Limite de téléversement atteinte ($1).",
  },
  {
    pattern: /^Only (\d+) file\(s\) allowed\.?$/i,
    message: "Seulement $1 fichier(s) autorisé(s).",
  },
  {
    pattern: /^Request failed with status code (\d+)/i,
    message: "Requête échouée (code $1).",
  },
];

export function translateUserMessage(
  message: string | null | undefined,
  fallback = "Une erreur est survenue.",
): string {
  if (!message?.trim()) return fallback;
  const trimmed = message.trim();
  if (EXACT_MESSAGES[trimmed]) return EXACT_MESSAGES[trimmed];

  for (const { pattern, message: translated } of PATTERN_MESSAGES) {
    const match = trimmed.match(pattern);
    if (match) {
      return translated.replace(/\$(\d+)/g, (_, index) => match[Number(index)] ?? "");
    }
  }

  return trimmed;
}
