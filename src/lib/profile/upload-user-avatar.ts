import { filesApi } from "@/lib/files/api";
import { inferUploadKindFromMime } from "@/lib/files/upload-constraints";
import { waitForUploadConfirmation } from "@/lib/files/wait-for-upload";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function validateAvatarFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Veuillez choisir une image (JPG, PNG ou WebP).";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "L'image ne doit pas dépasser 2 Mo.";
  }
  return null;
}

export const AVATAR_FILE_ACCEPT = AVATAR_ACCEPT;

export async function uploadUserAvatarToBucket(file: File): Promise<string> {
  const validationError = validateAvatarFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const intent = await filesApi.createUploadIntent({
    ownerType: "user",
    kind: inferUploadKindFromMime(file.type),
    fileName: `avatar-${Date.now()}.${extensionForMime(file.type)}`,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  const confirmationPromise = waitForUploadConfirmation({
    fileId: intent.fileId,
    uploadSessionId: intent.uploadSessionId,
  });

  const putResponse = await fetch(intent.uploadUrl, {
    method: "PUT",
    headers: intent.headers,
    body: file,
  });

  if (!putResponse.ok) {
    throw new Error(`Échec de l'envoi vers le stockage (${putResponse.status}).`);
  }

  await confirmationPromise;
  return intent.fileId;
}
