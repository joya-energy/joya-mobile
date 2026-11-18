"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { JoyaEmptyState } from "@/components/joya";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  invoicesApi,
  type ClientInvoiceItem,
} from "@/lib/company/invoices-api";

const INITIAL_VISIBLE = 3;
const ALL_VALUE = "all";

const MONTH_LABELS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

function formatInvoiceDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function capitalizePeriodLabel(label: string): string {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function ClientInvoicesCard() {
  const [invoices, setInvoices] = useState<ClientInvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string>(ALL_VALUE);
  const [monthFilter, setMonthFilter] = useState<string>(ALL_VALUE);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await invoicesApi.list();
      setInvoices(rows);
    } catch {
      setInvoices([]);
      toast.error("Impossible de charger les factures.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const availableYears = useMemo(() => {
    const years = new Set(invoices.map((row) => row.year));
    return [...years].sort((a, b) => b - a);
  }, [invoices]);

  const availableMonths = useMemo(() => {
    const months = new Set(
      invoices
        .filter(
          (row) => yearFilter === ALL_VALUE || row.year === Number(yearFilter),
        )
        .map((row) => row.month),
    );
    return [...months].sort((a, b) => a - b);
  }, [invoices, yearFilter]);

  useEffect(() => {
    if (
      monthFilter !== ALL_VALUE &&
      !availableMonths.includes(Number(monthFilter))
    ) {
      setMonthFilter(ALL_VALUE);
    }
  }, [availableMonths, monthFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (yearFilter !== ALL_VALUE && invoice.year !== Number(yearFilter)) {
        return false;
      }
      if (monthFilter !== ALL_VALUE && invoice.month !== Number(monthFilter)) {
        return false;
      }
      return true;
    });
  }, [invoices, yearFilter, monthFilter]);

  const visibleInvoices = expanded
    ? filteredInvoices
    : filteredInvoices.slice(0, INITIAL_VISIBLE);
  const hasMore = filteredInvoices.length > INITIAL_VISIBLE;

  const handleDownload = async (invoice: ClientInvoiceItem) => {
    setDownloadingKey(invoice.periodKey);
    try {
      const { blob, filename } = await invoicesApi.download(invoice.periodKey);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Téléchargement démarré");
    } catch {
      toast.error("Impossible de télécharger cette facture.");
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <section
      id="factures"
      className="scroll-mt-24 overflow-hidden rounded-[24px] border border-line bg-white shadow-joya-sm"
    >
      <div className="relative isolate flex flex-col gap-4 overflow-hidden border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 md:block"
          style={{
            maskImage: "linear-gradient(90deg, transparent 0%, #000 70%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 70%)",
          }}
        >
          <div
            className="absolute inset-0 bg-[url('/brand/images/report-header.jpg')] bg-cover bg-center opacity-95"
            style={{
              filter: "hue-rotate(185deg) saturate(1.15) brightness(0.55)",
            }}
          />
          <div className="absolute inset-0 bg-[#0b2a5c]/55 mix-blend-multiply" />
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-cream-2 text-coral">
            <Receipt className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="joya-eyebrow">Rapports</p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-navy">
              Factures
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              Factures mensuelles — PDF téléchargeable
            </p>
          </div>
        </div>

        {!loading && invoices.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-pill bg-white/90 p-1 backdrop-blur-sm">
            <Select
              value={yearFilter}
              onValueChange={(value) => {
                setYearFilter(value);
                setExpanded(false);
              }}
            >
              <SelectTrigger
                className="!h-9 !w-fit min-w-[8.5rem] rounded-pill px-3 text-[13px] font-medium [&>span]:line-clamp-none"
                aria-label="Filtrer par année"
              >
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Toutes années</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={monthFilter}
              onValueChange={(value) => {
                setMonthFilter(value);
                setExpanded(false);
              }}
            >
              <SelectTrigger
                className="!h-9 !w-fit min-w-[9rem] rounded-pill px-3 text-[13px] font-medium [&>span]:line-clamp-none"
                aria-label="Filtrer par mois"
              >
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tous les mois</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={String(month)}>
                    {MONTH_LABELS_FR[month - 1] ?? month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center gap-2 py-12 text-sm text-ink-muted"
          role="status"
        >
          <Loader2 className="h-4 w-4 animate-spin text-coral" />
          Chargement des factures…
        </div>
      ) : invoices.length === 0 ? (
        <JoyaEmptyState
          icon={FileText}
          title="Aucune facture disponible pour le moment"
          description="Vos factures apparaîtront ici dès que l'équipe JOYA les aura déposées."
        />
      ) : filteredInvoices.length === 0 ? (
        <JoyaEmptyState
          compact
          icon={FileText}
          title="Aucune facture pour cette période"
          description="Modifiez le filtre année / mois."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-slate-50/80 font-data text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-5 py-3 font-medium sm:px-6">Période</th>
                  <th className="px-5 py-3 font-medium sm:px-6">Date</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-6">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleInvoices.map((invoice) => {
                  const isDownloading = downloadingKey === invoice.periodKey;
                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-line transition-colors last:border-0 hover:bg-cream"
                    >
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-coral-soft text-coral">
                            <FileText className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="font-semibold text-navy">
                            {capitalizePeriodLabel(invoice.periodLabel)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-data text-[12.5px] text-ink-muted sm:px-6">
                        {formatInvoiceDate(invoice.uploadedAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right sm:px-6">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          disabled={isDownloading}
                          onClick={() => void handleDownload(invoice)}
                        >
                          {isDownloading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          Télécharger
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasMore ? (
            <div className="flex justify-center border-t border-line py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-coral-dark hover:bg-coral-soft hover:text-coral-dark"
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? (
                  <>
                    Voir moins
                    <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Voir plus ({filteredInvoices.length - INITIAL_VISIBLE})
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
