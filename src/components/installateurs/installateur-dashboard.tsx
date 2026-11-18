"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, Plus, Sun, UserCheck, Users } from "lucide-react";
import { Button, ButtonPuck } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { CreateClientModal } from "@/components/installateurs/create-client-modal";
import { ClientDocsDrawer } from "@/components/installateurs/client-docs-drawer";
import { ClientsList } from "@/components/installateurs/clients-list";
import { InstallateurTopbar } from "@/components/installateurs/installateur-topbar";
import {
  installateurApi,
  type InstallateurClient,
} from "@/lib/installateurs/api";
import { getRoleAwareHomePath, isInstaller } from "@/lib/auth/roles";
import { notifyError } from "@/lib/notifications";
import { translateUserMessage } from "@/lib/user-messages";
import { JoyaKpiCard, JoyaLoadingState, JoyaPageHeader } from "@/components/joya";

export function InstallateurDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<InstallateurClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [docsClient, setDocsClient] = useState<InstallateurClient | null>(null);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await installateurApi.listClients();
      setClients(rows);
    } catch (error) {
      const message = translateUserMessage(
        (error as { message?: string })?.message,
        "Impossible de charger les clients.",
      );
      notifyError({ title: "Erreur", message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!isInstaller(user.role)) {
      router.replace(getRoleAwareHomePath(user.role, "welcome"));
      return;
    }
    void loadClients();
  }, [loadClients, router, user]);

  /** Portfolio summary — derived from the list already loaded. */
  const stats = useMemo(
    () => ({
      total: clients.length,
      activated: clients.filter((c) => c.account_claimed).length,
      withDevis: clients.filter((c) => c.has_devis).length,
      withPvsys: clients.filter((c) => c.has_pvsys).length,
    }),
    [clients],
  );

  if (!user || !isInstaller(user.role)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <JoyaLoadingState label="Redirection…" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream">
      <InstallateurTopbar />

      <main className="joya-page-enter mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <JoyaPageHeader
          eyebrow="Espace installateur"
          title={user.full_name ? `Bonjour ${user.full_name.split(" ")[0]}` : "Espace installateur"}
          description="Créez vos clients, déposez devis & PVSYST et suivez l'avancement de chaque dossier Joya."
          actions={
            <Button size="lg" className="pr-2.5" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Déposer un projet
              <ButtonPuck />
            </Button>
          }
        />

        <div className="joya-stagger grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4">
          <JoyaKpiCard label="Clients" value={isLoading ? "…" : stats.total} icon={Users} tone="navy" />
          <JoyaKpiCard
            label="Comptes activés"
            value={isLoading ? "…" : stats.activated}
            icon={UserCheck}
            tone="success"
          />
          <JoyaKpiCard
            label="Devis déposés"
            value={isLoading ? "…" : stats.withDevis}
            icon={FileCheck2}
            tone="coral"
          />
          <JoyaKpiCard
            label="Études PVSYST"
            value={isLoading ? "…" : stats.withPvsys}
            icon={Sun}
            tone="sun"
          />
        </div>

        <ClientsList
          clients={clients}
          isLoading={isLoading}
          onManageDocs={setDocsClient}
          onCreate={() => setModalOpen(true)}
        />
      </main>

      <CreateClientModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={() => void loadClients()}
      />
      <ClientDocsDrawer
        client={docsClient}
        open={Boolean(docsClient)}
        onOpenChange={(next) => {
          if (!next) setDocsClient(null);
        }}
        onSaved={() => void loadClients()}
      />
    </div>
  );
}
