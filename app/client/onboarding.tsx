import { Text } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { ClientScreenScaffold } from "@/components/client/screen-scaffold";
import { useClientJourney } from "@/contexts/client-journey-context";

export default function OnboardingScreen() {
  const { phase, journey } = useClientJourney();

  return (
    <ClientScreenScaffold
      eyebrow="Intégration"
      title={
        phase === "pending_review" ? "Dossier en revue" : "Compléter le dossier"
      }
      description="Uploads et formulaires d'onboarding (portage des cartes web en cours)."
    >
      <Card className="rounded-2xl">
        <CardContent className="gap-2 p-5">
          <Text className="text-sm text-ink-muted">
            Phase : {phase ?? "—"}
          </Text>
          {journey?.adminNote ? (
            <Text className="text-sm text-navy">{journey.adminNote}</Text>
          ) : null}
          {journey?.revisionItems?.length ? (
            <Text className="text-sm text-warning-strong">
              Révisions demandées : {journey.revisionItems.join(", ")}
            </Text>
          ) : null}
        </CardContent>
      </Card>
    </ClientScreenScaffold>
  );
}
