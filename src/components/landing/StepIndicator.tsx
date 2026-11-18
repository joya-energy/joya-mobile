"use client";

export type StepItem = { id: number; label: string };

const stepBase =
  "w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center transition-all duration-300 ease-out";

export function StepIndicator({
  steps,
  currentStep,
  className = "",
}: {
  steps: StepItem[];
  currentStep: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 ${className}`}
      role="list"
      aria-label="Étapes du formulaire"
    >
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`${stepBase} ${
              step.id <= currentStep
                ? "bg-landing-primary text-primary-foreground scale-100 shadow-sm"
                : "bg-muted text-muted-foreground"
            } ${step.id === currentStep ? "ring-2 ring-landing-primary/30 ring-offset-2" : ""}`}
            aria-current={step.id === currentStep ? "step" : undefined}
          >
            {step.id}
          </div>
          <span
            className={`text-xs sm:text-sm font-medium hidden xs:inline max-w-[90px] sm:max-w-none truncate ${
              step.id === currentStep ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className="w-4 sm:w-8 h-px bg-border shrink-0 transition-opacity duration-300"
              aria-hidden
            />
          )}
        </div>
      ))}
    </div>
  );
}
