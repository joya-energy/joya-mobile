"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MailPlus, RefreshCw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useClientJourney } from "@/contexts/client-journey-context";
import {
  companyMembersApi,
  type CompanyMember,
} from "@/lib/company/members-api";
import { translateUserMessage } from "@/lib/user-messages";
import { getRoleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

function statusLabel(status: string): string {
  switch (status) {
    case "invited":
      return "Invitation envoyée";
    case "active":
      return "Actif";
    case "revoked":
      return "Révoqué";
    default:
      return status;
  }
}

export function TeamMembersCard() {
  const { journey } = useClientJourney();
  const companyId = journey?.companyId ?? null;

  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!companyId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await companyMembersApi.list(companyId);
      setMembers(list);
    } catch (error) {
      toast.error(
        translateUserMessage(
          error instanceof Error ? error.message : "",
          "Impossible de charger l'équipe.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !email.trim()) return;

    setSubmitting(true);
    try {
      const result = await companyMembersApi.invite(companyId, {
        email: email.trim(),
        full_name: fullName.trim() || undefined,
      });
      setEmail("");
      setFullName("");
      toast.success(
        result.email_sent
          ? "Invitation envoyée par email."
          : "Membre ajouté — l'email n'a pas pu être envoyé.",
      );
      await loadMembers();
    } catch (error) {
      toast.error(
        translateUserMessage(
          error instanceof Error ? error.message : "",
          "Impossible d'envoyer l'invitation.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (memberId: string) => {
    if (!companyId) return;
    setBusyMemberId(memberId);
    try {
      const result = await companyMembersApi.resend(companyId, memberId);
      toast.success(
        result.email_sent
          ? "Invitation renvoyée."
          : "Échec de l'envoi de l'email.",
      );
    } catch (error) {
      toast.error(
        translateUserMessage(
          error instanceof Error ? error.message : "",
          "Impossible de renvoyer l'invitation.",
        ),
      );
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleRevoke = async (memberId: string) => {
    if (!companyId) return;
    setBusyMemberId(memberId);
    try {
      await companyMembersApi.revoke(companyId, memberId);
      toast.success("Accès révoqué.");
      await loadMembers();
    } catch (error) {
      toast.error(
        translateUserMessage(
          error instanceof Error ? error.message : "",
          "Impossible de révoquer l'accès.",
        ),
      );
    } finally {
      setBusyMemberId(null);
    }
  };

  if (!companyId) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Users className="h-5 w-5 text-coral" />
          Équipe
        </CardTitle>
        <CardDescription>
          Invitez des référents techniques. Ils recevront un email pour créer
          leur mot de passe, puis accéderont au tableau de bord et au monitoring
          (sans les données contrat ESCO).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-full-name">Nom complet</Label>
              <Input
                id="invite-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Prénom Nom"
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="referent@entreprise.tn"
                disabled={submitting}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={submitting || !email.trim()}
            
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MailPlus className="mr-2 h-4 w-4" />
            )}
            Inviter un référent technique
          </Button>
        </form>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">Membres invités</p>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun référent technique pour le moment.
            </p>
          ) : (
            <ul className="space-y-3">
              {members.map((member) => {
                const busy = busyMemberId === member.id;
                return (
                  <li
                    key={member.id}
                    className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3.5 transition-colors hover:bg-cream sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {member.full_name || member.email}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {member.email}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            "border-slate-200 bg-slate-100 text-slate-700",
                          )}
                        >
                          {getRoleLabel(member.role)}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            member.status === "active"
                              ? "border-success/20 bg-success-soft text-success-strong"
                              : "border-warning/20 bg-warning-soft text-warning-strong",
                          )}
                        >
                          {statusLabel(member.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {member.status === "invited" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => void handleResend(member.id)}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          <span className="ml-1.5">Renvoyer</span>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleRevoke(member.id)}
                        className="text-danger hover:bg-danger-soft hover:text-danger-strong"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="ml-1.5">Révoquer</span>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
