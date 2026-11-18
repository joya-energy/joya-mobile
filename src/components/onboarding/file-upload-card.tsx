"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { filesApi, LinkTarget, UploadFileRef } from "@/lib/files/api";
import {
  inferUploadKindFromMime,
  resolveMaxFiles,
} from "@/lib/files/upload-constraints";
import { waitForUploadConfirmation } from "@/lib/files/wait-for-upload";
import { toast } from "sonner";
import { translateUserMessage } from "@/lib/user-messages";
import { onSocketEvent } from "@/lib/socket/client";
import { DocumentUploadTip } from "@/components/onboarding/document-upload-tip";

type ApiErrorShape = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

type FileUploadCardProps = {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  value?: string | string[] | UploadFileRef[];
  onValueChange?: (next: string | string[] | UploadFileRef[]) => void;
  uploadConfig?: {
    companyId: string;
    linkTarget?: LinkTarget;
  };
  uploadMode?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
  /** When set, replaces the default storage delete before removing from the list. */
  onFileRemove?: (ref: UploadFileRef) => Promise<void>;
  /** Onboarding uses a single bright theme; kept for API compatibility */
  theme?: "light" | "dark";
  /** Highlight when admin flagged this document for revision */
  needsRevision?: boolean;
  /** Short guidance — tap to expand (mobile-friendly) */
  tip?: string;
};

function toDisplayFileName(rawName: string | undefined): string {
  return (rawName || "").trim();
}

function uploadRefLabel(ref: UploadFileRef): string {
  const raw =
    (ref.fileName && ref.fileName.trim()) ||
    ref.objectKey?.split("/").pop()?.trim() ||
    "document";
  return toDisplayFileName(raw) || "document";
}

export function FileUploadCard({
  label,
  accept = ".pdf,.png,.jpg,.jpeg",
  multiple = false,
  maxFiles,
  value,
  onValueChange,
  uploadConfig,
  uploadMode = false,
  onUploadingChange,
  onFileRemove,
  theme: _theme = "light",
  needsRevision = false,
  tip,
}: FileUploadCardProps) {
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const valueList = useMemo(() => {
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "object"
    ) {
      return value as UploadFileRef[];
    }
    return [];
  }, [value]);

  const valueNames = useMemo(() => {
    if (
      Array.isArray(value) &&
      (value.length === 0 || typeof value[0] === "string")
    ) {
      return value as string[];
    }
    if (typeof value === "string" && value.trim().length > 0) return [value];
    return [];
  }, [value]);

  const displayItems = uploadConfig
    ? valueList.map((v) => uploadRefLabel(v))
    : value !== undefined
      ? valueNames.map((n) => toDisplayFileName(n))
      : localFiles.map((f) => toDisplayFileName(f.name));
  const effectiveMaxFiles = resolveMaxFiles(
    multiple,
    maxFiles,
    uploadConfig?.linkTarget,
  );
  const isAtLimit = displayItems.length >= effectiveMaxFiles;

  const setNext = (
    nextNames: string[],
    nextFiles: File[],
    nextRefs: UploadFileRef[] = [],
  ) => {
    if (onValueChange) {
      if (uploadConfig) {
        onValueChange(multiple ? nextRefs : nextRefs.slice(0, 1));
      } else {
        onValueChange(multiple ? nextNames : (nextNames[0] ?? ""));
      }
      return;
    }
    setLocalFiles(nextFiles);
  };

  const hasPendingUploads = useMemo(
    () => valueList.some((v) => v.status === "uploading"),
    [valueList],
  );

  useEffect(() => {
    onUploadingChange?.(isUploading || hasPendingUploads);
  }, [hasPendingUploads, isUploading, onUploadingChange]);

  useEffect(() => {
    if (!uploadMode || !uploadConfig || !onValueChange) {
      return;
    }

    const unsubscribe = onSocketEvent(
      "file.status.changed",
      async (payload) => {
        if (!payload || typeof payload !== "object") return;

        const eventPayload = payload as Record<string, unknown>;
        const data =
          eventPayload.data && typeof eventPayload.data === "object"
            ? (eventPayload.data as Record<string, unknown>)
            : null;
        const uploadSessionId =
          typeof data?.uploadSessionId === "string"
            ? data.uploadSessionId
            : null;
        if (!uploadSessionId) return;

        const notificationType = eventPayload.type;
        const nextStatus: UploadFileRef["status"] =
          notificationType === "success" ? "uploaded" : "failed";

        const currentRefs =
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === "object"
            ? (value as UploadFileRef[])
            : [];
        const matchIdx = currentRefs.findIndex(
          (ref) => ref.uploadSessionId === uploadSessionId,
        );
        if (matchIdx < 0) return;

        const updated = [...currentRefs];
        const target = { ...updated[matchIdx], status: nextStatus };
        if (nextStatus === "uploaded" && !target.viewUrl) {
          try {
            const view = await filesApi.getViewUrl(target.objectKey);
            target.viewUrl = view.viewUrl;
          } catch {
            // keep without view url
          }
        }
        updated[matchIdx] = target;
        onValueChange(multiple ? updated : updated.slice(0, 1));
      },
    );

    return unsubscribe;
  }, [multiple, onValueChange, uploadConfig, uploadMode, value]);

  // Existing refs (reloaded from API) often have objectKey but no viewUrl.
  useEffect(() => {
    if (!uploadConfig || !onValueChange) return;
    if (
      !Array.isArray(value) ||
      value.length === 0 ||
      typeof value[0] !== "object"
    ) {
      return;
    }
    const refs = value as UploadFileRef[];
    const missing = refs
      .map((ref, index) => ({ ref, index }))
      .filter(
        ({ ref }) =>
          Boolean(ref.objectKey) &&
          !ref.viewUrl &&
          ref.status !== "uploading" &&
          ref.status !== "failed",
      );
    if (missing.length === 0) return;

    let cancelled = false;
    void (async () => {
      const updates = new Map<number, string>();
      await Promise.all(
        missing.map(async ({ ref, index }) => {
          try {
            const view = await filesApi.getViewUrl(ref.objectKey);
            if (view.viewUrl) updates.set(index, view.viewUrl);
          } catch {
            // keep without view url
          }
        }),
      );
      if (cancelled || updates.size === 0) return;
      const next = refs.map((ref, index) =>
        updates.has(index) ? { ...ref, viewUrl: updates.get(index) } : ref,
      );
      onValueChange(multiple ? next : next.slice(0, 1));
    })();

    return () => {
      cancelled = true;
    };
  }, [multiple, onValueChange, uploadConfig, value]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) {
      e.target.value = "";
      return;
    }
    if (isAtLimit) {
      toast.error(`Limite de téléversement atteinte (${effectiveMaxFiles}).`);
      e.target.value = "";
      return;
    }
    const availableSlots = Math.max(0, effectiveMaxFiles - displayItems.length);
    const selectedFiles = files.slice(0, availableSlots);
    if (selectedFiles.length < files.length) {
      toast.warning(`Seulement ${availableSlots} fichier(s) autorisé(s).`);
    }
    if (selectedFiles.length === 0) {
      e.target.value = "";
      return;
    }
    if (uploadMode && !uploadConfig) {
      toast.error(
        "Contexte entreprise manquant. Rechargez la page d'intégration et réessayez.",
      );
      e.target.value = "";
      return;
    }
    if (uploadConfig) {
      setIsUploading(true);
      try {
        const uploadedRefs: UploadFileRef[] = [];
        for (const file of selectedFiles) {
          const intent = await filesApi.createUploadIntent({
            ownerType: "company",
            ownerId: uploadConfig.companyId,
            kind: inferUploadKindFromMime(file.type),
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            linkTarget: uploadConfig.linkTarget,
            linkContext: { companyId: uploadConfig.companyId },
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
            throw new Error(`Échec du téléversement (statut ${putResponse.status}).`);
          }

          let finalStatus: UploadFileRef["status"] = "uploading";
          let viewUrl: string | undefined;
          try {
            await confirmationPromise;
            finalStatus = "uploaded";
            try {
              const view = await filesApi.getViewUrl(intent.objectKey);
              viewUrl = view.viewUrl;
            } catch {
              // optional preview url
            }
          } catch (confirmError) {
            finalStatus = "failed";
            const message =
              confirmError instanceof Error
                ? confirmError.message
                : "Échec de la confirmation du téléversement.";
            toast.error(message, { duration: 12_000 });
          }

          uploadedRefs.push({
            fileId: intent.fileId,
            objectKey: intent.objectKey,
            fileName: file.name,
            uploadSessionId: intent.uploadSessionId,
            status: finalStatus,
            viewUrl,
          });
        }

        const existingRefs =
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === "object"
            ? (value as UploadFileRef[])
            : [];
        const mergedRefs = multiple
          ? [...existingRefs, ...uploadedRefs]
          : uploadedRefs.slice(0, 1);
        setNext(
          mergedRefs.map((f) => f.fileName),
          [],
          mergedRefs,
        );
        //toast.info("Upload started. Waiting for server confirmation...");
      } catch (error) {
        const apiError = error as ApiErrorShape;
        const backendMessage = apiError.response?.data?.message;
        if (backendMessage === "File already exists") {
          toast.error("Ce fichier existe déjà.");
        } else {
          toast.error(
            translateUserMessage(
              (error as Error).message,
              "Échec du téléversement.",
            ),
          );
        }
      } finally {
        setIsUploading(false);
      }
      e.target.value = "";
      return;
    }

    if (multiple) {
      const existingNames =
        value !== undefined ? valueNames : localFiles.map((f) => f.name);
      const mergedFiles = [
        ...(value !== undefined ? [] : localFiles),
        ...selectedFiles,
      ];
      const mergedNames = [
        ...existingNames,
        ...selectedFiles.map((f) => f.name),
      ];
      setNext(mergedNames, mergedFiles);
    } else {
      setNext([selectedFiles[0].name], [selectedFiles[0]]);
    }
    e.target.value = "";
  };

  const removeAt = async (index: number) => {
    if (uploadConfig) {
      const refs =
        Array.isArray(value) && value.length > 0 && typeof value[0] === "object"
          ? (value as UploadFileRef[])
          : [];
      const toRemove = refs[index];
      if (toRemove) {
        setIsRemoving(true);
        try {
          if (onFileRemove) {
            await onFileRemove(toRemove);
          } else if (toRemove.objectKey) {
            const deletion = await filesApi.deleteFile(toRemove.objectKey);
            if (!deletion.deleted) {
              // Keep UI responsive: remove from form state even when backend
              // reports no DB row deleted (e.g. already cleaned server-side).
              toast.info("Fichier retiré du formulaire.");
            }
          }
        } catch (error) {
          const message = (error as Error).message || "";
          const alreadyRemoved =
            /file not found/i.test(message) || /introuvable/i.test(message);
          if (!alreadyRemoved) {
            toast.error(
              translateUserMessage(message, "Échec de la suppression."),
            );
            setIsRemoving(false);
            return;
          }
        }
        setIsRemoving(false);
      }
      const nextRefs = refs.filter((_, i) => i !== index);
      setNext(
        nextRefs.map((r) => r.fileName),
        [],
        nextRefs,
      );
      return;
    }

    const nextNames = displayItems.filter((_, i) => i !== index);
    const nextFiles = localFiles.filter((_, i) => i !== index);
    setNext(nextNames, nextFiles);
  };

  const zoneClass = needsRevision
    ? "relative cursor-pointer rounded-2xl border-2 border-dashed border-warning bg-warning-soft/80 p-6 ring-2 ring-warning/40 transition-all hover:border-warning hover:bg-warning-soft"
    : "relative cursor-pointer rounded-2xl border-2 border-dashed border-navy/18 bg-navy/[0.03] p-6 transition-all hover:border-coral/35 hover:bg-coral/5";

  return (
    <div className="space-y-3">
      {tip ? <DocumentUploadTip>{tip}</DocumentUploadTip> : null}
      {needsRevision ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-warning-strong">
          <span className="inline-flex rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            À corriger
          </span>
        </p>
      ) : null}
      <div className={zoneClass}>
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleChange}
          disabled={isUploading || isRemoving || isAtLimit}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="text-coral" size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-navy/55">
            {label}
          </span>
          {isUploading ? (
            <span className="text-[10px] text-navy/50">Téléversement…</span>
          ) : null}
        </div>
      </div>

      {displayItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {displayItems.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-center justify-between rounded-xl border border-coral/28 bg-coral/10 p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {uploadConfig && valueList[index]?.status === "uploading" ? (
                  <Loader2
                    className="shrink-0 animate-spin text-slate-500"
                    size={18}
                  />
                ) : (
                  <CheckCircle2 className="shrink-0 text-coral" size={18} />
                )}
                {valueList[index]?.viewUrl ? (
                  <a
                    href={valueList[index].viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-xs font-bold text-navy underline"
                    title={item}
                  >
                    {item}
                  </a>
                ) : (
                  <span
                    className="min-w-0 flex-1 truncate text-xs font-bold text-navy"
                    title={item}
                  >
                    {item}
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  void removeAt(index);
                }}
                disabled={isRemoving}
                className="ml-2 h-7 w-7 shrink-0 p-0 text-danger hover:bg-danger-soft"
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
