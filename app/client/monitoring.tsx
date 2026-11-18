import { Text } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { ClientScreenScaffold } from "@/components/client/screen-scaffold";

export default function MonitoringScreen() {
  return (
    <ClientScreenScaffold
      eyebrow="Suivi"
      title="Monitoring"
      description="Production, onduleurs et alertes — aligné sur la vue mobile web."
    >
      <Card className="rounded-2xl">
        <CardContent className="gap-2 p-5">
          <Text className="text-sm leading-relaxed text-ink-muted">
            Les graphiques web (chart-kit / Recharts) sont en cours d&apos;adaptation
            vers react-native-svg. Les données API dashboard/monitoring restent
            les mêmes.
          </Text>
        </CardContent>
      </Card>
    </ClientScreenScaffold>
  );
}
