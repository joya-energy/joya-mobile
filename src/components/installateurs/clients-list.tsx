"use client";

import { useMemo, useState } from "react";
import type { InstallateurClient } from "@/lib/installateurs/api";
import { FileText, FolderOpen, Paperclip, Plus, Search, Sun, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JoyaEmptyState, JoyaStatusBadge } from "@/components/joya";

const FUNNEL_LABELS: Record<string, string> = {
  educatif: "Éducatif",
  conversion: "Conversion",
  rdv_confirme: "RDV confirmé",
  decision_principe: "Décision de principe",
  dossier_complet: "Dossier complet",
  lead_cold: "Inactif",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-TN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function AccountStatus({ client }: { client: InstallateurClient }) {
  return client.account_claimed ? (
    <JoyaStatusBadge status="success" label="Compte activé" size="sm" />
  ) : (
    <JoyaStatusBadge status="warning" label="En attente invitation JOYA" size="sm" />
  );
}

function DocChip({
  present,
  icon: Icon,
  label,
}: {
  present: boolean;
  icon: typeof FileText;
  label: string;
}) {
  return (
    <Badge
      size="sm"
      tone={present ? "success" : "neutral"}
      className={cn(!present && "opacity-70")}
      aria-label={`${label} : ${present ? "déposé" : "manquant"}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </Badge>
  );
}

function DocChips({ client }: { client: InstallateurClient }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <DocChip present={client.has_devis} icon={FileText} label="Devis" />
      <DocChip present={client.has_pvsys} icon={Sun} label="PVSYS" />
      <DocChip present={client.has_autres} icon={Paperclip} label="Autres" />
    </div>
  );
}

type Props = {
  clients: InstallateurClient[];
  isLoading: boolean;
  onManageDocs?: (client: InstallateurClient) => void;
  onCreate?: () => void;
};

export function ClientsList({ clients, isLoading, onManageDocs, onCreate }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.full_name, c.email, c.phone, c.tax_id, c.governorate]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [clients, query]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-joya-sm" role="status" aria-label="Chargement des clients">
        <Skeleton className="h-5 w-40" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <JoyaEmptyState
        className="rounded-2xl border border-dashed border-line-strong bg-white"
        icon={Users}
        title="Aucun client pour le moment"
        description="Ajoutez un client pour démarrer un dossier Joya."
        action={
          onCreate ? (
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              Déposer un projet
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-joya-sm">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <h2 className="font-display text-base font-semibold text-navy">
          Mes clients{" "}
          <span className="font-data text-[13px] font-normal text-ink-faint">({clients.length})</span>
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client…"
            aria-label="Rechercher un client"
            className="h-10 rounded-pill pl-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <JoyaEmptyState
          compact
          icon={Search}
          title="Aucun résultat"
          description={`Aucun client ne correspond à « ${query} ».`}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Dossier</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Ajouté</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow key={client.company_id} className="align-top">
                    <TableCell>
                      <p className="font-semibold text-navy">{client.full_name}</p>
                      <p className="mt-0.5 font-data text-[11.5px] text-ink-faint">
                        {client.tax_id || "—"}
                        {client.governorate ? ` · ${client.governorate}` : ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-navy">{client.phone || "—"}</p>
                      <p className="text-[12.5px] text-ink-muted">{client.email || "—"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge tone="outline" size="sm">
                        {client.company_status_label}
                      </Badge>
                      {client.funnel_stage ? (
                        <p className="mt-1.5 text-[12px] text-ink-muted">
                          {FUNNEL_LABELS[client.funnel_stage] || client.funnel_stage}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <AccountStatus client={client} />
                    </TableCell>
                    <TableCell>
                      <DocChips client={client} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-data text-[12.5px] text-ink-muted">
                      {formatDate(client.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {onManageDocs && client.site_id ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onManageDocs(client)}
                        >
                          <FolderOpen className="h-3.5 w-3.5" aria-hidden />
                          Ouvrir
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-line md:hidden">
            {filtered.map((client) => (
              <li key={client.company_id} className="space-y-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{client.full_name}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
                      {[client.phone, client.email].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <span className="shrink-0 font-data text-[11.5px] text-ink-faint">
                    {formatDate(client.created_at)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="outline" size="sm">
                    {client.company_status_label}
                  </Badge>
                  <AccountStatus client={client} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <DocChips client={client} />
                  {onManageDocs && client.site_id ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onManageDocs(client)}
                    >
                      <FolderOpen className="h-3.5 w-3.5" aria-hidden />
                      Ouvrir
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
