import type { UploadFileRef } from "@/lib/files/api";
import type {
  InstallateurLinkedFile,
  InstallateurOnboardingDocs,
  InstallateurOnboardingDocsPatch,
} from "@/lib/installateurs/api";

export type InstallateurOnboardingFiles = {
  tradeRegister: UploadFileRef[];
  rne: UploadFileRef[];
  cin: UploadFileRef[];
  stegBills: UploadFileRef[];
  bankStatements: UploadFileRef[];
  roofImages: UploadFileRef[];
};

export function emptyOnboardingFiles(): InstallateurOnboardingFiles {
  return {
    tradeRegister: [],
    rne: [],
    cin: [],
    stegBills: [],
    bankStatements: [],
    roofImages: [],
  };
}

function singleToRefs(params: {
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

function listToRefs(
  files: InstallateurLinkedFile[] | undefined,
  fallbackName: string,
): UploadFileRef[] {
  return (files ?? []).map((f) => ({
    fileId: f.file_id,
    objectKey: f.object_key,
    fileName: f.object_key.split("/").pop() || fallbackName,
    viewUrl: f.view_url ?? undefined,
    status: "uploaded" as const,
  }));
}

export function onboardingFilesFromApi(
  docs: InstallateurOnboardingDocs,
): InstallateurOnboardingFiles {
  return {
    tradeRegister: singleToRefs({
      fileId: docs.trade_register_file_id,
      objectKey: docs.trade_register_object_key,
      viewUrl: docs.trade_register_view_url,
      fileName: "registre-commerce.pdf",
    }),
    rne: singleToRefs({
      fileId: docs.rne_file_id,
      objectKey: docs.rne_object_key,
      viewUrl: docs.rne_view_url,
      fileName: "rne.pdf",
    }),
    cin: listToRefs(docs.cin_documents, "cin.pdf"),
    stegBills: listToRefs(docs.bills, "facture-steg.pdf"),
    bankStatements: listToRefs(docs.bank_statements, "extrait-bancaire.pdf"),
    roofImages: listToRefs(docs.roof_images, "toiture.jpg"),
  };
}

function readyFileId(files: UploadFileRef[]): string | null {
  const file = files[0];
  if (!file?.fileId || file.status === "uploading" || file.status === "failed") {
    return null;
  }
  return file.fileId;
}

function readyFileIds(files: UploadFileRef[]): string[] {
  return files
    .filter(
      (f) => f.fileId && f.status !== "uploading" && f.status !== "failed",
    )
    .map((f) => f.fileId);
}

export function hasOnboardingFilesToSave(
  files: InstallateurOnboardingFiles,
): boolean {
  return Boolean(
    readyFileId(files.tradeRegister) ||
      readyFileId(files.rne) ||
      readyFileIds(files.cin).length > 0 ||
      readyFileIds(files.stegBills).length > 0 ||
      readyFileIds(files.bankStatements).length > 0 ||
      readyFileIds(files.roofImages).length > 0,
  );
}

export function toOnboardingDocsPatch(
  files: InstallateurOnboardingFiles,
  mode: "partial" | "full",
): InstallateurOnboardingDocsPatch {
  const trade = readyFileId(files.tradeRegister);
  const rne = readyFileId(files.rne);
  const cin = readyFileIds(files.cin);
  const bills = readyFileIds(files.stegBills);
  const bank = readyFileIds(files.bankStatements);
  const roof = readyFileIds(files.roofImages);

  if (mode === "full") {
    return {
      trade_register_file_id: trade,
      rne_file_id: rne,
      cin_document_file_ids: cin,
      bill_file_ids: bills,
      bank_statement_file_ids: bank,
      roof_image_file_ids: roof,
    };
  }

  return {
    ...(trade ? { trade_register_file_id: trade } : {}),
    ...(rne ? { rne_file_id: rne } : {}),
    ...(cin.length > 0 ? { cin_document_file_ids: cin } : {}),
    ...(bills.length > 0 ? { bill_file_ids: bills } : {}),
    ...(bank.length > 0 ? { bank_statement_file_ids: bank } : {}),
    ...(roof.length > 0 ? { roof_image_file_ids: roof } : {}),
  };
}
