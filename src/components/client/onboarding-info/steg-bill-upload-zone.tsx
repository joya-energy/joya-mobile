import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { Upload } from "lucide-react-native";
import { filesApi, type UploadFileRef } from "@/lib/files/api";
import { inferUploadKindFromMime } from "@/lib/files/upload-constraints";
import { waitForUploadConfirmation } from "@/lib/files/wait-for-upload";
import { toast } from "@/lib/toast";
import { translateUserMessage } from "@/lib/user-messages";
import { cn } from "@/lib/utils";
import { joyaColors } from "@/theme/colors";

const ACCEPT_TYPES = ["application/pdf", "image/*"];

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
};

function resolveMimeType(asset: DocumentPicker.DocumentPickerAsset): string {
  if (asset.mimeType) return asset.mimeType;
  const ext = asset.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
}

type StegBillUploadZoneProps = {
  label: string;
  companyId: string;
  maxFiles?: number;
  disabled?: boolean;
  /** Called with files whose upload was confirmed by the server. */
  onUploaded: (refs: UploadFileRef[]) => void | Promise<void>;
};

/**
 * Native replacement for `FileUploadCard` (uploadMode) used by the STEG bills
 * card: system document picker → upload intent → PUT to storage → confirmation.
 */
export function StegBillUploadZone({
  label,
  companyId,
  maxFiles = 10,
  disabled = false,
  onUploaded,
}: StegBillUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAsset = async (
    asset: DocumentPicker.DocumentPickerAsset,
  ): Promise<UploadFileRef | null> => {
    const mimeType = resolveMimeType(asset);
    const file = new File(asset.uri);
    const intent = await filesApi.createUploadIntent({
      ownerType: "company",
      ownerId: companyId,
      kind: inferUploadKindFromMime(mimeType),
      fileName: asset.name,
      mimeType,
      sizeBytes: asset.size ?? file.size ?? 0,
      linkContext: { companyId },
    });

    const confirmation = waitForUploadConfirmation({
      fileId: intent.fileId,
      uploadSessionId: intent.uploadSessionId,
    });
    // Avoid an unhandled rejection if the PUT below fails first.
    confirmation.catch(() => undefined);

    const putResponse = await expoFetch(intent.uploadUrl, {
      method: "PUT",
      headers: intent.headers,
      body: file,
    });
    if (!putResponse.ok) {
      throw new Error(
        `Échec du téléversement (statut ${putResponse.status}).`,
      );
    }

    try {
      await confirmation;
    } catch (confirmError) {
      toast.error(
        confirmError instanceof Error
          ? confirmError.message
          : "Échec de la confirmation du téléversement.",
        { duration: 12_000 },
      );
      return null;
    }

    return {
      fileId: intent.fileId,
      objectKey: intent.objectKey,
      fileName: asset.name,
      uploadSessionId: intent.uploadSessionId,
      status: "uploaded",
    };
  };

  const handlePick = async () => {
    if (disabled || isUploading) return;
    let result: DocumentPicker.DocumentPickerResult;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: ACCEPT_TYPES,
        multiple: true,
        copyToCacheDirectory: true,
      });
    } catch {
      toast.error("Impossible d'ouvrir le sélecteur de fichiers.");
      return;
    }
    if (result.canceled || result.assets.length === 0) return;

    const assets = result.assets.slice(0, maxFiles);
    if (assets.length < result.assets.length) {
      toast.warning(`Seulement ${maxFiles} fichier(s) autorisé(s).`);
    }

    setIsUploading(true);
    const uploaded: UploadFileRef[] = [];
    try {
      for (const asset of assets) {
        const ref = await uploadAsset(asset);
        if (ref) uploaded.push(ref);
      }
    } catch (error) {
      const backendMessage = (
        error as { response?: { data?: { message?: string } } }
      ).response?.data?.message;
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

    if (uploaded.length > 0) {
      await onUploaded(uploaded);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || isUploading}
      onPress={() => void handlePick()}
      className={cn(
        "items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy/20 bg-navy/5 p-6 active:bg-coral/5",
        (disabled || isUploading) && "opacity-60",
      )}
    >
      {isUploading ? (
        <ActivityIndicator color={joyaColors.coral} />
      ) : (
        <Upload size={24} color={joyaColors.coral} />
      )}
      <Text className="text-center text-[10px] font-bold uppercase tracking-wider text-navy/55">
        {label}
      </Text>
      {isUploading ? (
        <View>
          <Text className="text-[10px] text-navy/50">Téléversement…</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
