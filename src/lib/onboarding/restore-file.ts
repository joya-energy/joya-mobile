import { filesApi, UploadFileRef } from "@/lib/files/api";

/**
 * Rebuild an {@link UploadFileRef} for a previously uploaded document so it can
 * be shown in a {@link FileUploadCard}. Resolves a fresh view URL when an
 * object key is available; failures are swallowed so a missing preview never
 * blocks form restoration.
 */
export async function restoreUploadedFile(
  fileId: string,
  objectKey: string,
  fallbackName: string,
): Promise<UploadFileRef> {
  let viewUrl: string | undefined;
  if (objectKey) {
    try {
      const v = await filesApi.getViewUrl(objectKey);
      viewUrl = v.viewUrl;
    } catch {
      // preview is best-effort
    }
  }
  return {
    fileId,
    objectKey,
    fileName: objectKey.split("/").pop() || fallbackName,
    status: "uploaded",
    viewUrl,
  };
}

/** Map a backend list of `{ file_id, object_key, viewUrl }` rows into upload refs. */
export function mapUploadedList(rows: unknown): UploadFileRef[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row: any) => ({
    fileId: String(row.file_id),
    objectKey: String(row.object_key),
    fileName: String(row.object_key).split("/").pop() || "document",
    viewUrl: row.viewUrl,
    status: "uploaded" as const,
  }));
}
