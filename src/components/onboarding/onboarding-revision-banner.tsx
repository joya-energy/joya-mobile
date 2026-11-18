"use client";

import { AlertTriangle } from "lucide-react";
import {
  ONBOARDING_REVISION_ITEM_LABELS,
  type OnboardingRevisionItemId,
} from "@/lib/onboarding/revision-items";

type OnboardingRevisionBannerProps = {
  adminNote: string;
  revisionItems: string[];
};

export function OnboardingRevisionBanner({
  adminNote,
  revisionItems,
}: OnboardingRevisionBannerProps) {
  const flaggedLabels = revisionItems
    .filter((id): id is OnboardingRevisionItemId => id in ONBOARDING_REVISION_ITEM_LABELS)
    .map((id) => ONBOARDING_REVISION_ITEM_LABELS[id]);

  return (
    <div className="rounded-2xl border-2 border-warning/50 bg-warning-soft px-5 py-4 text-sm text-warning-strong shadow-sm shadow-warning/40">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="min-w-0 space-y-2">
          <p className="font-semibold">
            Modifications demandées sur votre dossier
          </p>
          <p className="text-warning-strong/90">
            Notre équipe a examiné votre dossier. Veuillez corriger les éléments
            indiqués ci-dessous puis soumettre à nouveau.
          </p>
          {adminNote.trim() ? (
            <blockquote className="rounded-lg border border-warning/60 bg-white/70 px-3 py-2 text-warning-strong">
              <p className="text-[10px] font-bold uppercase tracking-wide text-warning-strong/80">
                Message de l&apos;équipe JOYA
              </p>
              <p className="mt-1 whitespace-pre-wrap">{adminNote.trim()}</p>
            </blockquote>
          ) : null}
          {flaggedLabels.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-warning-strong/80">
                Documents à corriger
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {flaggedLabels.map((label) => (
                  <li
                    key={label}
                    className="rounded-full bg-warning/70 px-2.5 py-0.5 text-xs font-medium text-warning-strong"
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
