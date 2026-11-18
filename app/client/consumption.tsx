import { Text } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { ClientScreenScaffold } from "@/components/client/screen-scaffold";

export default function ConsumptionScreen() {
  return (
    <ClientScreenScaffold
      eyebrow="Énergie"
      title="Consommation"
      description="Historique, efficacité et coupures — même API que le web."
    >
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <Text className="text-sm leading-relaxed text-ink-muted">
            Écrans charts consommation en portage. Navigation et shell sont
            déjà actifs.
          </Text>
        </CardContent>
      </Card>
    </ClientScreenScaffold>
  );
}
