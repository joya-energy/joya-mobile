"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, User, Loader2 } from "lucide-react";
import { JoyaSectionHeader } from "@/components/joya";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { getRoleLabel } from "@/lib/auth/roles";
import { useResolvedAvatarUrl } from "@/hooks/use-resolved-avatar-url";
import { authApi } from "@/lib/auth/api";
import {
  AVATAR_FILE_ACCEPT,
  uploadUserAvatarToBucket,
} from "@/lib/profile/upload-user-avatar";
import { toast } from "sonner";

export function ProfileCard() {
  const { user, applyUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const { src: resolvedAvatarSrc, failed, setFailed } = useResolvedAvatarUrl(
    user?.avatar,
  );

  useEffect(() => {
    setFullName(user?.full_name ?? "");
  }, [user?.full_name]);

  const displayAvatarSrc = localPreview ?? resolvedAvatarSrc;
  const trimmedName = fullName.trim();
  const nameDirty = trimmedName !== (user?.full_name ?? "").trim();
  const canSaveName = trimmedName.length >= 2 && nameDirty && !savingName;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    setFailed(false);
    setUploading(true);

    try {
      const fileId = await uploadUserAvatarToBucket(file);
      const { user: updatedUser, avatar } = await authApi.updateAvatar(fileId);
      const nextAvatar = avatar ?? updatedUser.avatar ?? undefined;

      applyUser({
        ...updatedUser,
        avatar: nextAvatar,
      });
      setLocalPreview(null);

      if (!nextAvatar) {
        toast.error(
          "Photo enregistrée, mais l’aperçu est indisponible. Réessayez dans un instant.",
        );
        return;
      }

      toast.success("Photo de profil mise à jour.");
    } catch (err) {
      setLocalPreview(null);
      const message =
        err instanceof Error ? err.message : "Échec de la mise à jour.";
      toast.error(message);
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (trimmedName.length < 2) {
      toast.error("Le nom doit contenir au moins 2 caractères.");
      return;
    }
    setSavingName(true);
    try {
      const { user: updatedUser } = await authApi.updateProfile({
        full_name: trimmedName,
      });
      applyUser(updatedUser);
      setEditingName(false);
      toast.success("Nom mis à jour.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible d’enregistrer le nom.";
      toast.error(message);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-line">
        <JoyaSectionHeader
          icon={<User />}
          title="Informations personnelles"
          description={`Votre compte ${getRoleLabel(user?.role).toLowerCase()}`}
        />
      </CardHeader>
      <CardContent className="space-y-6 pt-6 sm:pt-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-coral-tint ring-4 ring-coral-soft">
            {displayAvatarSrc && !failed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={displayAvatarSrc}
                src={displayAvatarSrc}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setFailed(true)}
              />
            ) : (
              <User className="h-9 w-9 text-coral-dark" aria-hidden />
            )}
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-navy-deep/50">
                <Loader2 className="h-6 w-6 animate-spin text-white" aria-label="Envoi en cours" />
              </div>
            ) : null}
          </div>
          <div className="min-w-0 space-y-2">
            <p className="font-display text-lg font-semibold text-navy">{user?.full_name}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_FILE_ACCEPT}
              className="hidden"
              disabled={uploading}
              onChange={(e) => void handleAvatarChange(e)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Envoi en cours…" : (
                  <>
                    <Camera className="h-4 w-4" aria-hidden />
                    Changer la photo
                  </>
                )}
              </Button>
              <p className="text-[12.5px] text-ink-faint">JPG, PNG ou WebP · 2 Mo max.</p>
            </div>
          </div>
        </div>

        <Separator className="bg-line" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={120}
              autoComplete="name"
              disabled={!editingName || savingName}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email} disabled />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {editingName ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={savingName}
                onClick={() => {
                  setFullName(user?.full_name ?? "");
                  setEditingName(false);
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!canSaveName}
                loading={savingName}
                onClick={() => void handleSaveName()}
              >
                Enregistrer
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFullName(user?.full_name ?? "");
                setEditingName(true);
              }}
            >
              Modifier
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
