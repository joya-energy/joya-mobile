"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader2, ScrollText, Shield } from "lucide-react";
import { toast } from "sonner";
import { JoyaEmptyState } from "@/components/joya";
import {
  contractsApi,
  type ClientContractFile,
  type ClientContractsResponse,
} from "@/lib/company/contracts-api";

const GROUPS = [
  {
    key: "insurance" as const,
    title: "Assurance",
    icon: Shield,
  },
  {
    key: "warranty" as const,
    title: "Garanties",
    icon: ScrollText,
  },
  {
    key: "contract" as const,
    title: "Contrat",
    icon: FileText,
  },
];

function formatAddedDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function FileRow({ file }: { file: ClientContractFile }) {
  const added = formatAddedDate(file.createdAt);
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-navy">{file.fileName}</p>
        {added ? (
          <p className="mt-0.5 text-xs text-ink-faint">Ajouté le {added}</p>
        ) : null}
      </div>
      {file.viewUrl ? (
        <a
          href={file.viewUrl}
          target="_blank"
          rel="noreferrer"
          download={file.fileName}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[13px] font-medium text-navy transition-colors hover:border-coral hover:text-coral"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Télécharger
        </a>
      ) : (
        <p className="shrink-0 text-xs text-ink-faint">Lien indisponible</p>
      )}
    </div>
  );
}

export function ClientContractsCard() {
  const [data, setData] = useState<ClientContractsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await contractsApi.list());
    } catch {
      setData(null);
      toast.error("Impossible de charger vos contrats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = data
    ? data.insurance.length + data.warranty.length + data.contract.length
    : 0;

  return (
    <section
      id="mes-contrats"
      className="scroll-mt-24 overflow-hidden rounded-[24px] border border-line bg-white shadow-joya-sm"
    >
      <div className="flex items-center gap-3 border-b border-line px-5 py-5 sm:px-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-cream-2 text-coral">
          <FileText className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="joya-eyebrow">Documents</p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-navy">
            Mes contrats
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Assurance, garanties et contrat déposés par JOYA
          </p>
        </div>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center gap-2 py-12 text-sm text-ink-muted"
          role="status"
        >
          <Loader2 className="h-4 w-4 animate-spin text-coral" />
          Chargement des contrats…
        </div>
      ) : !data || total === 0 ? (
        <JoyaEmptyState
          icon={FileText}
          title="Aucun document pour le moment"
          description="Vos contrats, assurances et garanties apparaîtront ici dès que l'équipe JOYA les aura déposés."
        />
      ) : (
        <div className="grid gap-5 px-5 py-5 sm:px-6">
          {GROUPS.map((group) => {
            const files = data[group.key];
            const Icon = group.icon;
            return (
              <div key={group.key}>
                <div className="mb-2.5 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-coral" aria-hidden />
                  <h3 className="text-sm font-semibold text-navy">{group.title}</h3>
                </div>
                {files.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line bg-cream px-4 py-4 text-center text-[13px] text-ink-muted">
                    Aucun fichier
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {files.map((file) => (
                      <FileRow
                        key={file.fileId || file.fileName}
                        file={file}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
