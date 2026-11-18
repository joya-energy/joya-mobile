import { cn } from "@/lib/utils";
import { ob } from "@/lib/onboarding/theme";

export function OnboardingFormCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(ob.card, "animate-in fade-in slide-in-from-bottom-4 duration-700", className)}>
      {children}
    </div>
  );
}
