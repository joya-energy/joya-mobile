"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { FileUploadCard } from "@/components/onboarding/file-upload-card";
import { OnboardingDocsFields } from "@/components/installateurs/onboarding-docs-fields";
import { filesApi, type UploadFileRef } from "@/lib/files/api";
import {
  installateurApi,
  type InstallateurClient,
} from "@/lib/installateurs/api";
import {
  emptyOnboardingFiles,
  onboardingFilesFromApi,
  toOnboardingDocsPatch,
} from "@/lib/installateurs/onboarding-docs";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { translateUserMessage } from "@/lib/user-messages";
import { Loader2 } from "lucide-react";

type Props = {
  client: InstallateurClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

function toRef(params: {
  fileId: string | null;
  objectKey: string | null;
  viewUrl?: string | null;
  fileName: string;
}): UploadFileRef[] {
  if (!params.fileId || !params.objectKey) return [];
  return [
    {
      fileId: params.fileId,
      objectKey: params.objectKey,
      fileName: params.fileName,
      viewUrl: params.viewUrl ?? undefined,
      status: "uploaded",
    },
  ];
}

export function ClientDocsDrawer({
  client,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [devisFiles, setDevisFiles] = useState<UploadFileRef[]>([]);
  const [pvsysFiles, setPvsysFiles] = useState<UploadFileRef[]>([]);
  const [autresFiles, setAutresFiles] = useState<UploadFileRef[]>([]);
  const [onboardingFiles, setOnboardingFiles] = useState(
    emptyOnboardingFiles(),
  );

  const companyId = client?.company_id;
  const siteId = client?.site_id;

  const loadDocs = useCallback(async () => {
    if (!companyId || !siteId) return;
    setIsLoading(true);
    try {
      const [docs, onboarding] = await Promise.all([
        installateurApi.getClientSiteDocs(companyId, siteId),
        installateurApi.getClientOnboardingDocs(companyId),
      ]);
      setDevisFiles(
        toRef({
          fileId: docs.devis_file_id,
          objectKey: docs.devis_object_key,
          viewUrl: docs.devis_view_url,
          fileName: "devis.pdf",
        }),
      );
      setPvsysFiles(
        toRef({
          fileId: docs.pvsys_file_id,
          objectKey: docs.pvsys_object_key,
          viewUrl: docs.pvsys_view_url,
          fileName: "rapport-pvsys.pdf",
        }),
      );
      setAutresFiles(
        (docs.autres_files ?? []).map((f) => ({
          fileId: f.file_id,
          objectKey: f.object_key,
          fileName: f.file_name || f.object_key.split("/").pop() || "fichier",
          viewUrl: f.view_url ?? undefined,
          status: "uploaded" as const,
        })),
      );
      setOnboardingFiles(onboardingFilesFromApi(onboarding));
    } catch (error) {
      notifyError({
        title: "Erreur",
        message: translateUserMessage(
          (error as { message?: string })?.message,
          "Impossible de charger les documents.",
        ),
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyId, siteId]);

  useEffect(() => {
    if (!open || !client?.site_id) return;
    void loadDocs();
  }, [client?.site_id, loadDocs, open]);

  useEffect(() => {
    if (!open) {
      setDevisFiles([]);
      setPvsysFiles([]);
      setAutresFiles([]);
      setOnboardingFiles(emptyOnboardingFiles());
    }
  }, [open]);

  const handleDevisRemove = async (ref: UploadFileRef) => {
    if (!companyId || !siteId) return;
    await installateurApi.updateClientSiteDocs(companyId, siteId, {
      devis_file_id: null,
    });
    if (ref.objectKey) {
      try {
        await filesApi.deleteFile(ref.objectKey);
      } catch {
        // Profile already unlinked; storage cleanup is best-effort.
      }
    }
  };

  const handlePvsysRemove = async (ref: UploadFileRef) => {
    if (!companyId || !siteId) return;
    await installateurApi.updateClientSiteDocs(companyId, siteId, {
      pvsys_file_id: null,
    });
    if (ref.objectKey) {
      try {
        await filesApi.deleteFile(ref.objectKey);
      } catch {
        // Profile already unlinked; storage cleanup is best-effort.
      }
    }
  };

  const handleAutresRemove = async (ref: UploadFileRef) => {
    if (!companyId || !siteId) return;
    const remaining = autresFiles
      .filter((f) => f.fileId !== ref.fileId)
      .map((f) => f.fileId)
      .filter(Boolean);
    await installateurApi.updateClientSiteDocs(companyId, siteId, {
      autres_file_ids: remaining,
    });
    if (ref.objectKey) {
      try {
        await filesApi.deleteFile(ref.objectKey);
      } catch {
        // Profile already unlinked; storage cleanup is best-effort.
      }
    }
  };

  const handleSave = async () => {
    if (!companyId || !siteId) return;
    setIsSaving(true);
    try {
      const devisReady =
        devisFiles[0]?.fileId &&
        devisFiles[0].status !== "uploading" &&
        devisFiles[0].status !== "failed"
          ? devisFiles[0].fileId
          : null;
      const pvsysReady =
        pvsysFiles[0]?.fileId &&
        pvsysFiles[0].status !== "uploading" &&
        pvsysFiles[0].status !== "failed"
          ? pvsysFiles[0].fileId
          : null;
      const autresReady = autresFiles
        .filter(
          (f) =>
            f.fileId && f.status !== "uploading" && f.status !== "failed",
        )
        .map((f) => f.fileId);

      const docs = await installateurApi.updateClientSiteDocs(
        companyId,
        siteId,
        {
          devis_file_id: devisReady,
          pvsys_file_id: pvsysReady,
          autres_file_ids: autresReady,
        },
      );

      const onboarding = await installateurApi.updateClientOnboardingDocs(
        companyId,
        toOnboardingDocsPatch(onboardingFiles, "full"),
      );
      setOnboardingFiles(onboardingFilesFromApi(onboarding));
      setDevisFiles(
        toRef({
          fileId: docs.devis_file_id,
          objectKey: docs.devis_object_key,
          viewUrl: docs.devis_view_url,
          fileName: devisFiles[0]?.fileName || "devis.pdf",
        }),
      );
      setPvsysFiles(
        toRef({
          fileId: docs.pvsys_file_id,
          objectKey: docs.pvsys_object_key,
          viewUrl: docs.pvsys_view_url,
          fileName: pvsysFiles[0]?.fileName || "rapport-pvsys.pdf",
        }),
      );
      setAutresFiles(
        (docs.autres_files ?? []).map((f) => ({
          fileId: f.file_id,
          objectKey: f.object_key,
          fileName:
            f.file_name ||
            autresFiles.find((x) => x.fileId === f.file_id)?.fileName ||
            f.object_key.split("/").pop() ||
            "fichier",
          viewUrl: f.view_url ?? undefined,
          status: "uploaded" as const,
        })),
      );
      notifySuccess({
        title: "Documents enregistrés",
        message: "Documents du site et d'onboarding mis à jour.",
      });
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      notifyError({
        title: "Erreur",
        message: translateUserMessage(
          (error as { message?: string })?.message,
          "Impossible d'enregistrer les documents.",
        ),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = Boolean(companyId && siteId);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full max-h-dvh flex-col sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Documents client</DrawerTitle>
          <DrawerDescription>
            {client?.full_name
              ? `Ouvrez ou mettez à jour les documents pour ${client.full_name}.`
              : "Ouvrez ou mettez à jour les documents du site."}
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
          {!canEdit ? (
            <p className="text-sm text-slate-500">
              Site introuvable pour ce client.
            </p>
          ) : isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des documents…
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-600">
                Documents site
              </p>
              <FileUploadCard
                label="Devis estimatif (PDF)"
                accept=".pdf,application/pdf"
                multiple={false}
                value={devisFiles}
                onValueChange={(next) =>
                  setDevisFiles(
                    Array.isArray(next) ? (next as UploadFileRef[]) : [],
                  )
                }
                onFileRemove={handleDevisRemove}
                uploadConfig={{ companyId: companyId! }}
                uploadMode
              />
              <FileUploadCard
                label="Rapport PVSYS (PDF)"
                accept=".pdf,application/pdf"
                multiple={false}
                value={pvsysFiles}
                onValueChange={(next) =>
                  setPvsysFiles(
                    Array.isArray(next) ? (next as UploadFileRef[]) : [],
                  )
                }
                onFileRemove={handlePvsysRemove}
                uploadConfig={{ companyId: companyId! }}
                uploadMode
              />
              <FileUploadCard
                label="Autres fichiers (plans, 3D, SketchUp…)"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.skp,application/pdf,image/*,application/octet-stream,model/vnd.sketchup.skp"
                multiple
                maxFiles={10}
                value={autresFiles}
                onValueChange={(next) =>
                  setAutresFiles(
                    Array.isArray(next) ? (next as UploadFileRef[]) : [],
                  )
                }
                onFileRemove={handleAutresRemove}
                uploadConfig={{ companyId: companyId! }}
                uploadMode
              />
              <p className="text-xs text-slate-500">
                Cliquez sur le nom du fichier pour l&apos;ouvrir.
              </p>

              <OnboardingDocsFields
                companyId={companyId!}
                value={onboardingFiles}
                onChange={setOnboardingFiles}
                description="Pièces déposées par vous ou par le client depuis son espace."
              />
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canEdit || isLoading || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Fermer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
