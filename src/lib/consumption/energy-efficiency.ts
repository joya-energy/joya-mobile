import type { EdgeMetricPoint } from "@/lib/consumption/api";
import type { SeriesRow } from "@/components/client/consumption/edge-consumption-charts";
import { SECTORS } from "@/types/const";

export const STEG_PF_THRESHOLD = 0.8;
export const METER_SILENCE_HOURS = 3;

/** STEG tranches DT/kWh (consommation mensuelle). */
export const STEG_TARIFF_BANDS = [
  { upToKwh: 200, dtPerKwh: 0.195 },
  { upToKwh: 300, dtPerKwh: 0.24 },
  { upToKwh: 500, dtPerKwh: 0.333 },
  { upToKwh: Infinity, dtPerKwh: 0.465 },
] as const;

export function stegTariffDtPerKwh(monthlyKwh: number): number {
  const band = STEG_TARIFF_BANDS.find((b) => monthlyKwh <= b.upToKwh);
  return band?.dtPerKwh ?? 0.465;
}

export { SECTORS as EFFICIENCY_SECTORS };

export type EfficiencyDayKind = "working" | "closed";

export type DaySchedule = {
  open: boolean;
  openTime: string;
  closeTime: string;
};

export type WeeklySchedule = DaySchedule[];

export const WEEKDAYS: Array<{ key: number; short: string; label: string }> = [
  { key: 1, short: "Lun", label: "Lundi" },
  { key: 2, short: "Mar", label: "Mardi" },
  { key: 3, short: "Mer", label: "Mercredi" },
  { key: 4, short: "Jeu", label: "Jeudi" },
  { key: 5, short: "Ven", label: "Vendredi" },
  { key: 6, short: "Sam", label: "Samedi" },
  { key: 0, short: "Dim", label: "Dimanche" },
];

export type EnergyEfficiencyProfile = {
  sector: string;
  subscribedKva: number | null;
  week: WeeklySchedule;
};

export type EfficiencyHourBar = {
  hour: number;
  label: string;
  operating: number;
  off: number;
};

export type EfficiencyAlertTone = "rose" | "amber" | "blue";
export type EfficiencyAlertPriority = "high" | "low" | "info";

export type EfficiencyAlert = {
  id: string;
  tone: EfficiencyAlertTone;
  priority: EfficiencyAlertPriority;
  title: string;
  hook: string;
  detail: string;
  whenTrigger: string;
  meaning: string;
  actions: string[];
  footer: string;
  action: string;
  mailtoSubject: string;
  mailtoLabel: string;
  savingsDtMonth?: number | null;
  hourLabel?: string;
  hourCaption?: string;
  measuredLabel?: string;
  thresholdLabel?: string;
};

export type EfficiencyRecKind =
  | "contractuel"
  | "economique"
  | "technique"
  | "comportemental"
  | "structurel"
  | "positif";

export type EfficiencyRecommendation = {
  id: string;
  kind: EfficiencyRecKind;
  title: string;
  detail: string;
};

export type EnergyEfficiencySnapshot = {
  operatingKwh: number;
  offKwh: number;
  operatingDt: number;
  offDt: number;
  dtPerKwh: number;
  estimatedMonthKwh: number;
  totalKwh: number;
  offSharePct: number | null;
  bars: EfficiencyHourBar[];
  operatingAvgKwh: number | null;
  alerts: EfficiencyAlert[];
  recommendations: EfficiencyRecommendation[];
};

const STORAGE_PREFIX = "joya.energy-efficiency.v1:";

export function defaultWeek(
  openTime = "08:00",
  closeTime = "17:00",
): WeeklySchedule {
  return Array.from({ length: 7 }, (_, day) => ({
    open: day >= 1 && day <= 5,
    openTime,
    closeTime,
  }));
}

export function weekdayIndex(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return 1;
  return new Date(y, m - 1, d).getDay();
}

export function hoursForDate(
  profile: EnergyEfficiencyProfile,
  ymd: string,
): { openTime: string; closeTime: string; dayKind: EfficiencyDayKind } {
  const day = profile.week[weekdayIndex(ymd)] ?? defaultWeek()[1];
  return {
    openTime: day.openTime,
    closeTime: day.closeTime,
    dayKind: day.open ? "working" : "closed",
  };
}

export function defaultDayKind(ymd: string): EfficiencyDayKind {
  return hoursForDate(defaultEfficiencyProfile(), ymd).dayKind;
}

export function defaultEfficiencyProfile(): EnergyEfficiencyProfile {
  return {
    sector: "",
    subscribedKva: null,
    week: defaultWeek(),
  };
}

function normalizeWeek(
  raw: unknown,
  fallbackTimes: { openTime: string; closeTime: string },
): WeeklySchedule {
  const fallback = defaultWeek(fallbackTimes.openTime, fallbackTimes.closeTime);
  if (!Array.isArray(raw) || raw.length < 7) return fallback;
  return fallback.map((day, i) => {
    const parsed = raw[i] as Partial<DaySchedule> | undefined;
    return {
      open: typeof parsed?.open === "boolean" ? parsed.open : day.open,
      openTime: parsed?.openTime || day.openTime,
      closeTime: parsed?.closeTime || day.closeTime,
    };
  });
}

/** Map a stored/API value onto the official Joya sector list. */
export function normalizeJoyaSector(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (SECTORS.includes(value)) return value;
  const match = SECTORS.find(
    (s) => s.toLowerCase() === value.toLowerCase(),
  );
  if (match) return match;
  const compact = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/scolaire|education|ecole|enseignement/.test(compact)) return "Éducation";
  if (/sante|bien-etre|medical/.test(compact)) return "Santé & Bien-être";
  if (/hotel|resto|restauration/.test(compact)) return "Hôtellerie & Restauration";
  if (/finance|immo/.test(compact)) return "Finance & Immobilier";
  if (/tech/.test(compact)) return "Technologie";
  if (/commerce|retail/.test(compact)) return "Commerce";
  if (/service/.test(compact)) return "Services";
  return null;
}

export function loadEfficiencyProfile(
  siteId: string | null | undefined,
  _ymd?: string,
): EnergyEfficiencyProfile {
  const fallback = defaultEfficiencyProfile();
  if (!siteId || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + siteId);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<EnergyEfficiencyProfile> & {
      openTime?: string;
      closeTime?: string;
    };
    const openTime = parsed.openTime || "08:00";
    const closeTime = parsed.closeTime || "17:00";
    return {
      sector: normalizeJoyaSector(parsed.sector) ?? fallback.sector,
      subscribedKva:
        parsed.subscribedKva != null && Number.isFinite(parsed.subscribedKva)
          ? parsed.subscribedKva
          : null,
      week: parsed.week
        ? normalizeWeek(parsed.week, { openTime, closeTime })
        : defaultWeek(openTime, closeTime),
    };
  } catch {
    return fallback;
  }
}

export function saveEfficiencyProfile(
  siteId: string | null | undefined,
  profile: EnergyEfficiencyProfile,
) {
  if (!siteId || typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + siteId, JSON.stringify(profile));
}

export function hourFromHm(hm: string): number {
  const [h] = (hm || "08:00").split(":").map(Number);
  if (!Number.isFinite(h)) return 8;
  return Math.min(23, Math.max(0, Math.trunc(h)));
}

export function isOperatingHour(
  hour: number,
  openHour: number,
  closeHour: number,
): boolean {
  if (openHour === closeHour) return true;
  if (openHour < closeHour) return hour >= openHour && hour <= closeHour;
  return hour >= openHour || hour <= closeHour;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function kwhToDt(kwh: number, dtPerKwh: number): number {
  return round2(kwh * dtPerKwh);
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function weekdayFr(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return "ce jour";
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "long" });
}

const PRIORITY_TONE: Record<EfficiencyAlertPriority, EfficiencyAlertTone> = {
  high: "rose",
  low: "amber",
  info: "blue",
};

function featuredAlert(
  priority: EfficiencyAlertPriority,
  fields: Omit<EfficiencyAlert, "tone" | "priority" | "action"> & {
    action?: string;
  },
): EfficiencyAlert {
  const actions = fields.actions;
  return {
    ...fields,
    priority,
    tone: PRIORITY_TONE[priority],
    action: fields.action ?? actions[0] ?? "",
  };
}

export function analyzeEnergyEfficiency(input: {
  profile: EnergyEfficiencyProfile;
  hourly: SeriesRow[];
  seriesPoints: EdgeMetricPoint[];
  latest: EdgeMetricPoint | null;
  lastTelemetryAt: string | null | undefined;
  isToday: boolean;
  selectedDate: string;
  hasMeter: boolean;
  forceClosedDay?: boolean;
}): EnergyEfficiencySnapshot {
  const hours = hoursForDate(input.profile, input.selectedDate);
  const openHour = hourFromHm(hours.openTime);
  const closeHour = hourFromHm(hours.closeTime);
  const closedDay = hours.dayKind === "closed" || Boolean(input.forceClosedDay);

  const bars: EfficiencyHourBar[] = Array.from({ length: 24 }, (_, hour) => {
    const row = input.hourly.find((r) => r.label === `${String(hour).padStart(2, "0")}h`);
    const kwh = row?.gen != null && Number.isFinite(row.gen) ? row.gen : 0;
    const operating = !closedDay && isOperatingHour(hour, openHour, closeHour);
    return {
      hour,
      label: `${String(hour).padStart(2, "0")}h`,
      operating: operating ? kwh : 0,
      off: operating ? 0 : kwh,
    };
  });

  const operatingKwh = round2(bars.reduce((s, b) => s + b.operating, 0));
  const offKwh = round2(bars.reduce((s, b) => s + b.off, 0));
  const totalKwh = round2(operatingKwh + offKwh);
  const offSharePct =
    totalKwh > 0 ? Math.round((offKwh / totalKwh) * 100) : null;
  const estimatedMonthKwh = round2(totalKwh * 30);
  const dtPerKwh = stegTariffDtPerKwh(estimatedMonthKwh);
  const operatingDt = kwhToDt(operatingKwh, dtPerKwh);
  const offDt = kwhToDt(offKwh, dtPerKwh);
  const openDaysMonth = Math.round(
    (input.profile.week.filter((d) => d.open).length / 7) * 30,
  );
  const closedDaysMonth = Math.max(0, 30 - openDaysMonth);

  const operatingHours = bars.filter((b) =>
    !closedDay && isOperatingHour(b.hour, openHour, closeHour),
  );
  const operatingAvgKwh = mean(
    operatingHours.map((b) => b.operating).filter((v) => v > 0),
  );

  const pfOperating = mean(
    input.seriesPoints
      .map((p) => {
        const t = p.t ? new Date(p.t) : null;
        if (!t || !Number.isFinite(t.getTime())) return null;
        const hour = Number(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: "Africa/Tunis",
            hour: "2-digit",
            hourCycle: "h23",
          }).formatToParts(t).find((part) => part.type === "hour")?.value,
        );
        if (
          closedDay ||
          !isOperatingHour(hour, openHour, closeHour) ||
          p.power_factor == null ||
          !Number.isFinite(p.power_factor)
        ) {
          return null;
        }
        return p.power_factor;
      })
      .filter((v): v is number => v != null),
  );

  const peakKw = Math.max(
    0,
    ...input.seriesPoints
      .map((p) => p.active_power_total_kw)
      .filter((v): v is number => v != null && Number.isFinite(v)),
  );
  const peakKva = Math.max(
    0,
    ...input.seriesPoints
      .map((p) => p.apparent_power_total_kva)
      .filter((v): v is number => v != null && Number.isFinite(v)),
  );

  const currents = [
    input.latest?.current_l1,
    input.latest?.current_l2,
    input.latest?.current_l3,
  ].filter((v): v is number => v != null && Number.isFinite(v) && v >= 0);

  const alerts: EfficiencyAlert[] = [];
  const recommendations: EfficiencyRecommendation[] = [];

  const hourKwh = (b: EfficiencyHourBar) => b.operating + b.off;
  const windowBars = bars.filter((b) =>
    isOperatingHour(b.hour, openHour, closeHour),
  );
  const daytimeAvgKwh = mean(
    windowBars.map(hourKwh).filter((v) => v > 0),
  );
  const typicalDayKwh =
    daytimeAvgKwh != null ? daytimeAvgKwh * windowBars.length : null;

  const silenceMs = METER_SILENCE_HOURS * 3600_000;
  const lastTs = input.lastTelemetryAt
    ? new Date(input.lastTelemetryAt).getTime()
    : NaN;
  if (!input.hasMeter) {
    alerts.push(
      featuredAlert("info", {
        id: "meter-silence",
        title: "Nous ne recevons plus les données de votre compteur",
        hook: "Absence de remontée de données.",
        detail: "Aucun compteur de consommation n’est rattaché à ce site.",
        whenTrigger:
          "Aucune donnée n’est reçue de votre compteur depuis plus de 3 heures.",
        meaning:
          "Tant que la liaison n’est pas rétablie, la surveillance de votre site est suspendue et une anomalie pourrait passer inaperçue.",
        actions: [
          "Vérifier l’alimentation et la connexion réseau du compteur ou de la passerelle",
          "Redémarrer la passerelle de communication si le problème persiste",
          "Nous contacter pour ajouter une supervision redondante si les coupures se répètent",
        ],
        footer: "Notre équipe peut diagnostiquer la liaison à distance.",
        mailtoSubject: "Support - compteur hors ligne",
        mailtoLabel: "Contacter le support →",
      }),
    );
  } else if (
    input.isToday &&
    ((Number.isFinite(lastTs) && Date.now() - lastTs > silenceMs) ||
      (!Number.isFinite(lastTs) && totalKwh === 0))
  ) {
    alerts.push(
      featuredAlert("info", {
        id: "meter-silence",
        title: "Nous ne recevons plus les données de votre compteur",
        hook: "Absence de remontée de données.",
        detail: `Aucune donnée n’est reçue de votre compteur depuis plus de ${METER_SILENCE_HOURS} heures.`,
        whenTrigger:
          "Aucune donnée n’est reçue de votre compteur depuis plus de 3 heures.",
        meaning:
          "Tant que la liaison n’est pas rétablie, la surveillance de votre site est suspendue et une anomalie pourrait passer inaperçue.",
        actions: [
          "Vérifier l’alimentation et la connexion réseau du compteur ou de la passerelle",
          "Redémarrer la passerelle de communication si le problème persiste",
          "Nous contacter pour ajouter une supervision redondante si les coupures se répètent",
        ],
        footer: "Notre équipe peut diagnostiquer la liaison à distance.",
        mailtoSubject: "Support - compteur hors ligne",
        mailtoLabel: "Contacter le support →",
      }),
    );
  }
  const silent =
    alerts.some((a) => a.id === "meter-silence") && totalKwh === 0;

  const closedThreshold =
    typicalDayKwh != null && typicalDayKwh > 0
      ? typicalDayKwh * 0.05
      : 0.2;
  if (!silent && closedDay && totalKwh > closedThreshold) {
    alerts.push(
      featuredAlert("high", {
        id: "closed-day",
        title: "Activité détectée un jour où le site est fermé",
        hook: "Consommation active un jour de fermeture déclaré.",
        detail: `${totalKwh.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kWh consommés un ${weekdayFr(input.selectedDate)} alors que le site est marqué comme fermé.`,
        hourLabel: "Jour",
        hourCaption: "FERMÉ",
        measuredLabel: `${totalKwh.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kWh relevés`,
        thresholdLabel: "Seuil : 5 % d’une journée normale",
        savingsDtMonth: kwhToDt(totalKwh * Math.max(closedDaysMonth, 1), dtPerKwh),
        whenTrigger:
          "Un jour que vous avez déclaré fermé, la consommation dépasse 5 % d’une journée normale de fonctionnement.",
        meaning:
          "Des équipements tournent en continu sans nécessité, ou le site est utilisé sans que le planning n’en tienne compte.",
        actions: [
          "Consulter les accès (badges, alarme) sur la journée concernée",
          "Contrôler la programmation du chauffage, de la ventilation et des équipements automatiques",
          "Ajuster votre planning si le site est réellement occupé ce jour-là",
        ],
        footer: "Chaque jour fermé mal maîtrisé pèse sur votre facture annuelle.",
        mailtoSubject: "Aide - jours de fermeture",
        mailtoLabel: "Être accompagné →",
      }),
    );
  }

  if (!silent && !closedDay && daytimeAvgKwh != null) {
    const offLimit = daytimeAvgKwh * 0.15;
    const offHours = bars.filter(
      (b) => !isOperatingHour(b.hour, openHour, closeHour) && hourKwh(b) > offLimit,
    );
    for (const bar of offHours) {
      const kwh = hourKwh(bar);
      alerts.push(
        featuredAlert("high", {
          id: `off-hours-${bar.hour}`,
          title: "Votre site consomme alors qu’il devrait être au repos",
          hook: "Consommation détectée hors des heures de fonctionnement.",
          detail: `${kwh.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kWh relevés à ${bar.hour}h, au-delà de 15 % de la moyenne de journée (${daytimeAvgKwh.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kWh).`,
          hourLabel: `${bar.hour}h`,
          hourCaption: "REPOS",
          measuredLabel: `${kwh.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kWh relevés`,
          thresholdLabel: `Seuil : 15 % de la moyenne (${daytimeAvgKwh.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kWh)`,
          savingsDtMonth: kwhToDt(kwh * Math.max(openDaysMonth, 1), dtPerKwh),
          whenTrigger:
            "En dehors de vos horaires d’ouverture, la consommation d’une heure dépasse 15 % de votre consommation moyenne en journée.",
          meaning:
            "De l’énergie est payée pour rien : éclairage, climatisation ou machines restés allumés après la fermeture.",
          actions: [
            "Vérifier les équipements restés allumés après la fermeture",
            "Mettre en place une checklist de fermeture pour vos équipes",
            "Installer un programmateur horaire ou une coupure automatique sur les circuits non essentiels",
          ],
          footer: "Une action simple suffit souvent à corriger cette anomalie.",
          mailtoSubject: "Aide - consommation hors fonctionnement",
          mailtoLabel: "Être accompagné →",
        }),
      );
    }
  }

  const pf = pfOperating ?? input.latest?.power_factor ?? null;
  if (!silent && pf != null && pf < STEG_PF_THRESHOLD) {
    alerts.push(
      featuredAlert("low", {
        id: "pf",
        title: "Votre installation utilise mal l’énergie qu’elle reçoit",
        hook: "Facteur de puissance sous le seuil contractuel.",
        detail: `cos φ mesuré à ${pf.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pendant les heures de fonctionnement.`,
        whenTrigger:
          "Le facteur de puissance (cos φ) moyen de vos heures de fonctionnement passe sous 0,80, le seuil couramment appliqué par la STEG.",
        meaning:
          "Vous vous exposez à des pénalités d’énergie réactive sur votre facture et sollicitez inutilement votre installation.",
        actions: [
          "Faire mesurer le cos φ réel pour confirmer l’écart",
          "Installer une batterie de condensateurs adaptée à votre charge",
          "Suivre le cos φ chaque mois sur votre facture pour valider la correction",
        ],
        footer: "Une solution technique éprouvée, dimensionnée sur mesure.",
        mailtoSubject: "Devis - correction du cos phi",
        mailtoLabel: "Obtenir un devis →",
      }),
    );
  }

  if (!silent && currents.length === 3) {
    const avgA = currents.reduce((a, b) => a + b, 0) / currents.length;
    const maxA = Math.max(...currents);
    if (avgA >= 1 && maxA > avgA * 1.3) {
      const [l1, l2, l3] = [
        input.latest?.current_l1,
        input.latest?.current_l2,
        input.latest?.current_l3,
      ];
      alerts.push(
        featuredAlert("low", {
          id: "imbalance",
          title: "Vos phases électriques ne sont pas équilibrées",
          hook: "Déséquilibre de charge entre les trois phases.",
          detail: `Courant mesuré à ${l1?.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} A / ${l2?.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} A / ${l3?.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} A (L1 / L2 / L3).`,
          whenTrigger:
            "La phase la plus chargée dépasse de plus de 30 % la moyenne des trois phases.",
          meaning:
            "Échauffement, pertes d’énergie et usure prématurée des équipements, avec un risque de pannes à terme.",
          actions: [
            "Identifier les circuits concentrés sur la phase la plus chargée",
            "Redistribuer les circuits sur les trois phases lors du prochain entretien électrique",
          ],
          footer: "Une intervention courte, à intégrer à votre maintenance.",
          mailtoSubject: "Aide - déséquilibre des phases",
          mailtoLabel: "Être accompagné →",
        }),
      );
    }
  }

  if (
    !silent &&
    input.profile.subscribedKva != null &&
    input.profile.subscribedKva > 0
  ) {
    const peak = Math.max(peakKva, peakKw);
    if (peak >= input.profile.subscribedKva * 0.95) {
      alerts.push(
        featuredAlert("high", {
          id: "subscribed",
          title: "Vous approchez de la limite de votre contrat de puissance",
          hook: "Dépassement de la puissance souscrite.",
          detail: `Pic estimé à ${peak.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} kW pour ${input.profile.subscribedKva.toLocaleString("fr-FR")} kVA souscrits.`,
          whenTrigger:
            "Votre pic de puissance estimé dépasse 95 % de la puissance souscrite auprès de la STEG.",
          meaning:
            "Risque de pénalités de dépassement, voire de coupure si les équipements démarrent tous en même temps.",
          actions: [
            "Décaler le démarrage simultané des équipements les plus puissants",
            "Mettre en place un délestage automatique à l’approche du seuil",
            "Réviser votre contrat de puissance si le dépassement devient récurrent",
          ],
          footer:
            "Nous pouvons analyser votre courbe de charge et optimiser votre contrat.",
          mailtoSubject: "Aide - puissance souscrite",
          mailtoLabel: "Être accompagné →",
        }),
      );
    }
  }

  return {
    operatingKwh,
    offKwh,
    operatingDt,
    offDt,
    dtPerKwh,
    estimatedMonthKwh,
    totalKwh,
    offSharePct,
    bars,
    operatingAvgKwh,
    alerts,
    recommendations,
  };
}
